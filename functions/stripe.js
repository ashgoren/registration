import { logger } from 'firebase-functions/v2';
import Stripe from 'stripe';
import { getOrderByPaymentId } from './shared/orders.js';
import { sendMail } from './shared/email.js';
import { createError, ErrorType } from './errorHandler.js';
import { IS_EMULATOR, PROJECT_ID } from './helpers.js';
const { SANDBOX_MODE, STRIPE_SECRET_KEY_SANDBOX, STRIPE_SECRET_KEY_LIVE, STRIPE_STATEMENT_DESCRIPTOR_SUFFIX, STRIPE_WEBHOOK_SECRET } = process.env;

const useSandbox = SANDBOX_MODE === 'true' || IS_EMULATOR;
const stripeSecretKey = useSandbox ? STRIPE_SECRET_KEY_SANDBOX : STRIPE_SECRET_KEY_LIVE;
const statement_descriptor_suffix = STRIPE_STATEMENT_DESCRIPTOR_SUFFIX; // appended to statement descriptor set in Stripe dashboard

const stripe = Stripe(stripeSecretKey);

export const getStripePaymentIntent = async ({ email, name, amount, description, idempotencyKey, id }) => {
  logger.info('getStripePaymentIntent', { email, idempotencyKey });

  const amountInCents = Math.round(amount * 100); // client-side handles amount in dollars
  let paymentIntent;
  try {
    if (id) {
      paymentIntent = await stripe.paymentIntents.retrieve(id);
      if (paymentIntent.amount !== amountInCents) {
        logger.info('Amount mismatch, updating paymentIntent');
        paymentIntent = await stripe.paymentIntents.update(id, { amount: amountInCents }, { idempotencyKey });
      }
      logger.info(`Retrieved paymentIntent ${id}`, { paymentIntent });
    } else {
      paymentIntent = await stripe.paymentIntents.create(
        {
          amount: amountInCents,
          currency: "usd",
          customer: await findOrCreateCustomer(email, name),
          description,
          ...(statement_descriptor_suffix && { statement_descriptor_suffix })
        },
        { idempotencyKey }
      );
      logger.info(`Created paymentIntent ${paymentIntent.id}`, { paymentIntent });
    }
  } catch (error) {
    throw createError(ErrorType.STRIPE_API, 'Error creating or updating paymentIntent', { email, name, amount, idempotencyKey, id, error });
  }
  return {
    clientSecret: paymentIntent.client_secret,
    id: paymentIntent.id,
    amount: paymentIntent.amount / 100 // client-side handles amount in dollars
  };
};

async function findOrCreateCustomer(email, name) {
  let customer;
  const existingCustomers = await stripe.customers.list({ email, limit: 1 });
  if (existingCustomers.data.length) {
    customer = existingCustomers.data[0].id;
  } else {
    const newCustomer = await stripe.customers.create({ name, email });
    customer = newCustomer.id;
  }
  return customer;
}

export const listStripeTransactions = async (description) => {
  logger.info('listStripeTransactions', { description });

  try {
    const [transactions, customers] = await Promise.all([
      fetchAllTransactions(),
      fetchAllCustomers()
    ]);
    logger.info(`Fetched ${transactions.length} payment intents and ${customers.length} customers from Stripe API`);

    const customerMap = new Map(customers.map(c => [c.id, c.email]));

    const matchingTransactions = transactions.filter(txn =>
      txn.description === description &&
      txn.status === 'succeeded'
    );
    logger.info(`Stripe API returned ${matchingTransactions.length} succeeded payment intent for ${description}`);
    // logger.debug('Matching transactions:', matchingTransactions);

    const normalizedTransactions = matchingTransactions.map(txn => ({
      id: txn.id,
      amount: txn.amount / 100,
      currency: txn.currency,
      date: new Date(txn.created * 1000),
      email: customerMap.get(txn.customer)
    }));

    // logger.debug('Normalized Stripe transactions from API:', normalizedTransactions); // debug log
    return normalizedTransactions;
  } catch (error) {
    throw createError(ErrorType.STRIPE_API, `Error listing Stripe transactions: ${error.message}`);
  }
};

const fetchAllTransactions = async () => {
  const allTransactions = [];
  let hasMore = true;
  let startingAfter = null;

  while (hasMore) {
    const { data, has_more } = await stripe.paymentIntents.list({
      limit: 100,
      created: {
        gte: Math.floor(Date.now() / 1000) - 300 * 24 * 60 * 60 // last 300 days
      },
      ...(startingAfter && { starting_after: startingAfter })
    });

    allTransactions.push(...data);
    hasMore = has_more;
    startingAfter = data.length ? data[data.length - 1].id : null;
  }

  return allTransactions;
};

const fetchAllCustomers = async () => {
  const allCustomers = [];
  let hasMore = true;
  let startingAfter = null;

  while (hasMore) {
    const { data, has_more } = await stripe.customers.list({
      limit: 100,
      ...(startingAfter && { starting_after: startingAfter })
    });

    allCustomers.push(...data);
    hasMore = has_more;
    startingAfter = data.length ? data[data.length - 1].id : null;
  }

  return allCustomers;
};

// onRequest function to handle Stripe webhooks
export const stripeWebhookHandler = async (req, res) => {
  logger.debug('Received Stripe webhook', { headers: req.headers, body: req.body });

  const sig = req.headers['stripe-signature'];
  let event;

  // Verify the webhook signature
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.error('Error verifying Stripe webhook signature', { error: err });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type !== 'payment_intent.succeeded') {
    logger.info(`Ignoring irrelevant webhook: ${event.type}`);
    return res.status(200).json({ received: true });
  }

  logger.info('Received webhook for Stripe payment_intent succeeded', { id: event.id, useSandbox });

  const paymentIntent = event.data.object;
  const paymentId = paymentIntent.id;

  logger.info('PaymentIntent was successful!', { paymentIntent });

  // Confirm this payment is already in db
  try {
    const order = await getOrderByPaymentId(paymentId, useSandbox);
    if (order) {
      logger.info('Found matching order in database', { paymentId, email: order.email });
    } else {
      logger.warn('Received Stripe payment capture for unrecognized payment ID', { paymentId });
      sendMail({
        to: process.env.EMAIL_NOTIFY_TO,
        subject: `${PROJECT_ID} - Unrecognized Stripe Payment Capture: ${paymentId}`,
        text: `Received Stripe payment capture for ID ${paymentId} but no matching record found in the database.`,
      });
    }
  } catch (error) {
    logger.error('Error processing Stripe webhook', { paymentId, error });
    return res.status(500).send('Internal Server Error');
  }

  res.json({ received: true });
};
