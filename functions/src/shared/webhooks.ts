import { logger } from 'firebase-functions/v2';
import { ordersCollection } from './orders.js';
import { sendMail } from './email.js';
import { createError, ErrorType } from './errorHandler.js';
import { getConfig } from '../config/internal/config.js';

import type { Order } from '../types/order.js';
type OrderWithKey = Order & { key: string };

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000; // 5 seconds

const getOrderByPaymentId = async (paymentId: string): Promise<OrderWithKey | null> => {
  try {
    const snapshot = await ordersCollection.where('paymentId', '==', paymentId).get();
    if (snapshot.empty) {
      return null;
    }
    const order = snapshot.docs[0].data() as Order;
    return { key: snapshot.docs[0].id, ...order };
  } catch (err) {
    throw createError(ErrorType.DATABASE_READ, `Error reading order with paymentId ${paymentId}: ${(err as Error).message}`);
  }
};

const findPaymentInDatabase = async (paymentId: string) => {
  let attempt = 0;
  const order = await getOrderByPaymentId(paymentId);
  if (order) return order;
  while (attempt < MAX_RETRIES) { // payment not found; retry
    const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
    logger.warn(`Attempt ${attempt + 1}: Payment ID ${paymentId} not found, retrying in ${delay}ms`);
    await new Promise(resolve => setTimeout(resolve, delay));
    const order = await getOrderByPaymentId(paymentId);
    if (order) return order;
    attempt++;
  }
  return null; // payment still not found after retries
};

export const handlePaymentVerification = async (paymentId: string) => {
  const { EMAIL_NOTIFY_TO, PROJECT_ID } = getConfig();
  const order = await findPaymentInDatabase(paymentId);
  if (order) {
    logger.info('Found matching order in database', { paymentId, email: order.people[0].email });
  } else {
    logger.warn('Received payment webhook for unrecognized payment ID', { paymentId });
    sendMail({
      to: EMAIL_NOTIFY_TO,
      subject: `${PROJECT_ID} - Unrecognized Payment Webhook: ${paymentId}`,
      text: `Received payment webhook for ID ${paymentId} but no matching record found in the database.`,
    });
  }
}
