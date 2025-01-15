import { logger } from 'firebase-functions/v2';
import Stripe from 'stripe';
import { createError, ErrorType } from './errorHandler.js';
import { IS_EMULATOR } from './helpers.js';
const { SANDBOX_MODE, STRIPE_SECRET_KEY_SANDBOX, STRIPE_SECRET_KEY_LIVE, STRIPE_STATEMENT_DESCRIPTOR_SUFFIX } = process.env;

const useSandbox = SANDBOX_MODE === 'true' || IS_EMULATOR;
const stripeSecretKey = useSandbox ? STRIPE_SECRET_KEY_SANDBOX : STRIPE_SECRET_KEY_LIVE;
const statement_descriptor_suffix = STRIPE_STATEMENT_DESCRIPTOR_SUFFIX; // appended to statement descriptor set in Stripe dashboard

const stripe = Stripe(stripeSecretKey);

export const getStripePaymentIntent = async ({ email, name, amount, idempotencyKey, id }) => {
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
