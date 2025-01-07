import { logger } from 'firebase-functions/v2';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { validFields } from './fields.js';
import { createError, ErrorType } from './errorHandler.js';
const firestore = getFirestore();

const ordersCollection = firestore.collection('orders');

export const savePendingOrder = async ({ orderId, order }) => {
  const { email } = order.people[0];
  logger.info(`SAVING PENDING ORDER: ${email}`, order);

  const filteredOrder = filterObject(order, validFields);
  const preppedOrder = {
    ...filteredOrder,
    createdAt: FieldValue.serverTimestamp(),
    paymentId: 'PENDING',
    status: 'pending'
  };

  try {
    if (orderId) {
      await ordersCollection.doc(orderId).set(preppedOrder);
      logger.info(`PENDING ORDER UPDATED: ${email}`);
      return { id: orderId };
    } else {
      const docRef = await ordersCollection.add(preppedOrder);
      logger.info(`PENDING ORDER SAVED: ${email}`);
      return { id: docRef.id };
    }
  } catch (err) {
    throw createError(ErrorType.DATABASE_SAVE, 'Error saving pending order', { order, error: err });
  }
};

export const saveFinalOrder = async ({ orderId, order }) => {
  const { email } = order.people[0];
  logger.info(`SAVING FINAL ORDER: ${email}`, order);

  if (!orderId) throw new Error('Missing orderId');

  const filteredOrder = filterObject(order, validFields);
  const preppedOrder = {
    ...filteredOrder,
    completedAt: FieldValue.serverTimestamp(),
    status: 'final'
  };

  try {
    await ordersCollection.doc(orderId).set(preppedOrder, { merge: true });
    logger.info(`FINAL ORDER SAVED: ${email}`);
  } catch (err) {
    throw createError(ErrorType.DATABASE_SAVE, 'Error saving final order', { order, error: err });
  }
};

// helper function to filter out any fields that aren't in the validFields array
const filterObject = (originalObj, validFields) => validFields.reduce((newObj, key) => {
  if (key in originalObj) {
    const value = originalObj[key];
    if (Array.isArray(value)) {
      newObj[key] = value.map(item => (item && typeof item === 'object') ? filterObject(item, validFields) : item);
    } else if (value && typeof value === 'object') {
      newObj[key] = filterObject(value, validFields);
    } else {
      newObj[key] = value;
    }
  }
  return newObj;
}, {});
