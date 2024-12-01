// errors are handled in the calling function
import { logger } from 'firebase-functions/v2';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { validFields } from './fields.js';
const firestore = getFirestore();

export const savePendingOrder = async (order) => {
  logger.info(`SAVING PENDING ORDER: ${order.people[0].email}`, order);
  const filteredOrder = filterObject(order, validFields);
  const orderWithTimestamp = { ...filteredOrder, createdAt: FieldValue.serverTimestamp() };
  const pendingCollection = firestore.collection('pendingOrders');
  const existingOrder = await pendingCollection.where('idempotencyKey', '==', order.idempotencyKey).get();
  if (existingOrder.empty) {
    await pendingCollection.add(orderWithTimestamp);
  } else {
    await pendingCollection.doc(existingOrder.docs[0].id).set(orderWithTimestamp);
  }
  logger.info(`PENDING ORDER SAVED: ${order.people[0].email}`);
  return { status: 'success' };
};

export const saveFinalOrder = async (order) => {
  logger.info(`SAVING FINAL ORDER: ${order.people[0].email}`, order);
  const filteredOrder = filterObject(order, validFields);
  const orderWithTimestamp = { ...filteredOrder, createdAt: FieldValue.serverTimestamp() };
  const ordersCollection = firestore.collection('orders');
  await ordersCollection.add(orderWithTimestamp);
  logger.info(`FINAL ORDER SAVED: ${order.people[0].email}`);
  return { status: 'success' };
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
