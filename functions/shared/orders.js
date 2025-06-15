import { getFirestore } from 'firebase-admin/firestore';
import { createError, ErrorType } from '../errorHandler.js';

const ordersCollection = getFirestore().collection('orders');

const getOrders = async ({ pending = false }) => {
  try {
    const snapshot = await ordersCollection.where('status', '==', pending ? 'pending' : 'final').get();
    return snapshot.docs.map((doc) => ({ key: doc.id, ...doc.data() }));
  } catch (err) {
    throw createError(ErrorType.DATABASE_READ, 'Error reading pending orders', { error: err });
  }
}

const getPendingOrders = async () => getOrders({ pending: true });
const getFinalOrders = async () => getOrders({ pending: false });

const getPendingOrdersMissingFromFinalOrders = async () => {
  const pendingOrders = await getPendingOrders();
  const finalOrders = await getFinalOrders();
  const finalOrderEmails = new Set(finalOrders.map(order => order.people[0].email));
  return pendingOrders.filter(order => !finalOrderEmails.has(order.people[0].email));
}

export { ordersCollection, getPendingOrders, getFinalOrders, getPendingOrdersMissingFromFinalOrders };
