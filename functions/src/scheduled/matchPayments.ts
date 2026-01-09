// onSchedule versions of function to match payments with orders

// ensure no payments missing from db

// NOTE: There is a significant delay for PayPal transactions to appear in the API
// so recent orders may show up as missing from PayPal

// local testing: run `matchPaymentsScheduled()` from `firebase functions:shell`

import { logger } from 'firebase-functions/v2';
import { listPaypalTransactions } from '../paypal/index.js';
import { listStripeTransactions } from '../stripe/index.js';
import { getOrders } from '../shared/orders.js';
import { sendMail } from '../shared/email.js';
import { getConfig } from '../config/internal/config.js';
import type { Request } from 'firebase-functions/v2/https';
import type { Response } from 'express';
import type { Order } from '../types/order'

export type NormalizedPaymentTransaction = {
  id: string;
  amount: number;
  currency: string;
  date: Date;
  email: string;
};

// On-demand (onRequest) wrapper for matching payments
export const matchPaymentsOnDemandHandler = async (req: Request, res: Response) => {
  if (req.get('Authorization') !== getConfig().CLOUD_FUNCTIONS_TRIGGER_TOKEN) {
    logger.warn('Unauthorized access attempt to matchPayments function');
    return res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    const result = await matchPaymentsHandler({ skipEmail: true });
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ error: 'Function failed', details: (error as Error).message });
  }
};

// Scheduled function to match payments with orders
export const matchPaymentsHandler = async ({ skipEmail }: { skipEmail?: boolean } = {}) => {
  const { PAYMENT_DESCRIPTION, PAYMENT_PROCESSOR } = getConfig();

  logger.info(`matchPayments triggered for event: ${PAYMENT_DESCRIPTION}`);

  // get final orders from db
  const finalOrders = await getOrders({ pending: false });
  const orders = finalOrders.filter(order => order.paymentId && order.paymentId !== 'check');

  // get list of payments from paypal or stripe
  const transactions = PAYMENT_PROCESSOR === 'paypal'
    ? await listPaypalTransactions(PAYMENT_DESCRIPTION)
    : await listStripeTransactions(PAYMENT_DESCRIPTION);

  if (!orders?.length || !transactions?.length) {
    if (!orders?.length) logger.warn('No final electronic payment orders found in db');
    if (!transactions?.length) logger.warn('No transactions found (note: PayPal API has delay)');
    return { matchingOrders: [], extraDatabaseOrders: [], extraTransactions: [] };
  }

  const { matchingOrders, extraDatabaseOrders, extraTransactions } = categorizeTransactions({ orders, transactions });

  logResults({ matchingOrders, extraDatabaseOrders, extraTransactions });

  if (extraTransactions.length && !skipEmail) {
    await sendEmailNotification(extraTransactions);
  }

  return {
    matchingOrders: matchingOrders.map(mapOrder),
    extraDatabaseOrders: extraDatabaseOrders.map(mapOrder),
    extraTransactions: extraTransactions.map(mapTransaction)
  };
};

const categorizeTransactions = ({ orders, transactions }: { orders: Order[], transactions: NormalizedPaymentTransaction[] }) => {
  const transactionIds = new Set(transactions.map(txn => txn.id));
  const orderPaymentIds = new Set(orders.map(order => order.paymentId));

  // logger.debug('transactionIds', { transactionIds: Array.from(transactionIds) });
  // logger.debug('orderPaymentIds', { orderPaymentIds: Array.from(orderPaymentIds) });

  return {
    matchingOrders: orders.filter(order => transactionIds.has(order.paymentId!)),
    extraDatabaseOrders: orders.filter(order => !transactionIds.has(order.paymentId!)),
    extraTransactions: transactions.filter(txn => !orderPaymentIds.has(txn.id))
  };
};

const logResults = ({ matchingOrders, extraDatabaseOrders, extraTransactions }: {
  matchingOrders: Order[];
  extraDatabaseOrders: Order[];
  extraTransactions: NormalizedPaymentTransaction[];
}) => {
  logger.debug(`Found ${matchingOrders.length} matching orders and transactions`, {
    matchingOrders: matchingOrders.map(mapOrder)
  });

  if (extraDatabaseOrders.length === 0 && extraTransactions.length === 0) {
    logger.info('All final orders have matching transactions and there are no unmatched transactions.');
    return;
  }

  // just logging this rather than sending email because paypal transactions can take a while to appear
  if (extraDatabaseOrders.length) {
    logger.info(`Found ${extraDatabaseOrders.length} extra orders not in transactions (note: PayPal API has a delay)`, {
      extraDatabaseOrders: extraDatabaseOrders.map(mapOrder)
    });
  }

  if (extraTransactions.length) {
    logger.warn(`Found ${extraTransactions.length} extra transactions not in final orders`, {
      extraTransactions: extraTransactions.map(mapTransaction)
    });
  }
};

const sendEmailNotification = async (extraTransactions: NormalizedPaymentTransaction[]) => {
  const { PAYMENT_DESCRIPTION, EMAIL_NOTIFY_TO } = getConfig();
  await sendMail({
    to: EMAIL_NOTIFY_TO,
    subject: `${PAYMENT_DESCRIPTION}: Unmatched Payment Transactions`,
    text: `Payment transactions missing from DB: \n${extraTransactions.map(txn => `${txn.id} (${txn.email})`).join('\n')}`
  });
};

const mapOrder = (order: Order) => ({ id: order.id, paymentId: order.paymentId, paymentEmail: order.paymentEmail });
const mapTransaction = (txn: NormalizedPaymentTransaction) => ({ paymentId: txn.id, paymentEmail: txn.email });
