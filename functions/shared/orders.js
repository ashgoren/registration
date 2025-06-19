import { getFirestore } from 'firebase-admin/firestore';
import { createError, ErrorType } from '../errorHandler.js';

const ordersCollection = getFirestore().collection('orders');

const getOrders = async ({ pending = false, testMode = 'all' } = {}) => {
  try {
    const snapshot = await ordersCollection
      .where('status', '==', pending ? 'pending' : 'final')
      .orderBy('createdAt', 'asc')
      .get();
    const orders = snapshot.docs.map((doc) => ({ key: doc.id, ...doc.data() }));
    if (testMode === 'all') {
      return orders;
    } else {
      return orders.filter(order => order.isTestOrder === testMode);
    }
  } catch (err) {
    throw createError(ErrorType.DATABASE_READ, `Error reading orders: ${err.message}`);
  }
};

const getPendingOrdersMissingFromFinalOrders = async () => {
  const pendingOrders = await getOrders({ pending: true });
  const finalOrders = await getOrders({ pending: false });
  const finalOrderEmails = new Set(finalOrders.map(order => order.people[0].email));
  return pendingOrders.filter(order => !finalOrderEmails.has(order.people[0].email));
};

export { ordersCollection, getOrders, getPendingOrdersMissingFromFinalOrders };
