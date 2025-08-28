import { stripe } from './auth.js';
import { logger } from 'firebase-functions/v2';
import { createError, ErrorType } from '../shared/errorHandler.js';
import { config } from '../config.js';

const { STRIPE_STATEMENT_DESCRIPTOR_SUFFIX: statement_descriptor_suffix } = config;

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
