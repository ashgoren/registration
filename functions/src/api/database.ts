import { logger } from 'firebase-functions/v2';
import { FieldValue } from 'firebase-admin/firestore';
import { validFields } from '../shared/fields.js';
import { createError, ErrorType } from '../shared/errorHandler.js';
import { ordersCollection, peopleCounterDoc } from '../shared/orders.js';
import type { Order } from '../types/order';

export const savePendingOrder = async ({ orderId, order }: {
  orderId: string;
  order: Order
}) => {
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

export const saveFinalOrder = async ({ orderId, order }: {
  orderId: string;
  order: Order
}) => {
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

    await peopleCounterDoc.set({
      count: FieldValue.increment(order.people.length)
    }, { merge: true });
    logger.info(`PEOPLE COUNTER UPDATED: +${order.people.length}`);
  } catch (err) {
    throw createError(ErrorType.DATABASE_SAVE, 'Error saving final order', { order, error: err });
  }
};

// helper function to filter out any fields that aren't in the validFields array
const filterObject = (originalObj: Record<string, unknown>, validFields: string[]) => validFields.reduce((newObj, key) => {
  if (key in originalObj) {
    const value = originalObj[key];
    if (Array.isArray(value)) {
      newObj[key] = value.map(item =>
        (item && typeof item === 'object') ? filterObject(item as Record<string, unknown>, validFields) : item
      );
    } else if (value && typeof value === 'object') {
      newObj[key] = filterObject(value as Record<string, unknown>, validFields);
    } else {
      newObj[key] = value;
    }
  }
  return newObj;
}, {} as Record<string, unknown>);
