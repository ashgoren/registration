import { getFirestore } from 'firebase-admin/firestore';
import { createError, ErrorType } from './errorHandler.js';

export const ordersCollection = getFirestore().collection('orders');

export const getOrders = async ({ pending = false } = {}) => {
  const query = ordersCollection.where('status', '==', pending ? 'pending' : 'final').orderBy('createdAt', 'asc');
  try {
    const snapshot = await query.get();
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map((doc) => ({ key: doc.id, ...doc.data() }));
  } catch (err) {
    throw createError(ErrorType.DATABASE_READ, `Error reading orders: ${err.message}`);
  }
};

export const getPendingOrdersMissingFromFinalOrders = async () => {
  const pendingOrders = await getOrders({ pending: true });
  const finalOrders = await getOrders({ pending: false });
  const finalOrderEmails = new Set(finalOrders.map(order => order.people[0].email));
  return pendingOrders.filter(order => !finalOrderEmails.has(order.people[0].email));
};
