// errors are handled in the calling function
import { logger } from 'firebase-functions/v2';
import Stripe from "stripe";

const isEmulator = !!process.env.FIREBASE_AUTH_EMULATOR_HOST || !!process.env.FIRESTORE_EMULATOR_HOST;
const stripe = Stripe(isEmulator ? process.env.STRIPE_SECRET_KEY_DEV : process.env.STRIPE_SECRET_KEY);
const statement_descriptor_suffix = process.env.STRIPE_STATEMENT_DESCRIPTOR_SUFFIX; // appended to statement descriptor set in Stripe dashboard

export const getStripePaymentIntent = async ({ email, name, amount, idempotencyKey, id }) => {
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
    console.error("Error in getStripePaymentIntent:", error, email, name, amount, idempotencyKey, id);
    throw error;
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
