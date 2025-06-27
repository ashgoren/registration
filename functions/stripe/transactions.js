import { stripe } from './auth.js';
import { logger } from 'firebase-functions/v2';
import { createError, ErrorType } from '../shared/errorhandler.js';

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
