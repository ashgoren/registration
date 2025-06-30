import { logger } from 'firebase-functions/v2';
import { ordersCollection } from './orders.js';
import { sendMail } from './email.js';
import { createError, ErrorType } from './errorHandler.js';
import { PROJECT_ID, IS_SANDBOX } from './helpers.js';
const { EMAIL_NOTIFY_TO } = process.env;

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000; // 5 seconds

const getOrderByPaymentId = async (paymentId) => {
  try {
    const snapshot = await ordersCollection
      .where('paymentId', '==', paymentId)
      .where('isTestOrder', '==', IS_SANDBOX)
      .get();
    if (snapshot.empty) {
      return null;
    }
    const order = snapshot.docs[0].data();
    return { key: snapshot.docs[0].id, ...order };
  } catch (err) {
    throw createError(ErrorType.DATABASE_READ, `Error reading order with paymentId ${paymentId}: ${err.message}`);
  }
};

const findPaymentInDatabase = async (paymentId, attempt = 0) => {
  try {
    const order = await getOrderByPaymentId(paymentId);
    if (order) return order;
    if (attempt < MAX_RETRIES) { // payment not found; retry
      const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
      logger.warn(`Attempt ${attempt + 1}: Payment ID ${paymentId} not found, retrying in ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return findPaymentInDatabase(paymentId, attempt + 1);
    }
    return null; // payment still not found after retries
  } catch (error) { // handle DB errors
    if (attempt < MAX_RETRIES) { // also retry on DB errors
      const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
      logger.warn(`Attempt ${attempt + 1}: ${error.message}, retrying in ${delay}ms`, { paymentId });
      await new Promise(resolve => setTimeout(resolve, delay));
      return findPaymentInDatabase(paymentId, attempt + 1);
    }
    throw error; // re-throw DB errors after max retries
  }
};

export const handlePaymentVerification = async (paymentId) => {
  const order = await findPaymentInDatabase(paymentId);
  if (order) {
    logger.info('Found matching order in database', { paymentId, email: order.email });
  } else {
    logger.warn('Received payment webhook for unrecognized payment ID', { paymentId });
    sendMail({
      to: EMAIL_NOTIFY_TO,
      subject: `${PROJECT_ID} - Unrecognized Payment Webhook: ${paymentId}`,
      text: `Received payment webhook for ID ${paymentId} but no matching record found in the database.`,
    });
  }
}
