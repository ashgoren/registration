import { getFirestore } from 'firebase-admin/firestore';
import { createError, ErrorType } from './errorHandler.js';

import type { Order } from '../types/order';
type OrderWithKey = Order & { key: string };

export const ordersCollection = getFirestore().collection('orders');
export const peopleCounterDoc = getFirestore().collection('metadata').doc('peopleCount');

export const getOrders = async ({ pending = false } = {}): Promise<OrderWithKey[]> => {
  const query = ordersCollection.where('status', '==', pending ? 'pending' : 'final').orderBy('createdAt', 'asc');
  try {
    const snapshot = await query.get();
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map((doc) => ({ key: doc.id, ...doc.data() })) as OrderWithKey[];
  } catch (err) {
    throw createError(ErrorType.DATABASE_READ, `Error reading orders: ${(err as Error).message}`);
  }
};

export const getPendingOrdersMissingFromFinalOrders = async () => {
  const pendingOrders = await getOrders({ pending: true });
  const finalOrders = await getOrders({ pending: false });
  const finalOrderEmails = new Set(finalOrders.map(order => order.people[0].email));
  return pendingOrders.filter(order => !finalOrderEmails.has(order.people[0].email));
};
