import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  initializeApp({ projectId: 'contra-registration-stg' });
}

const db = getFirestore();

export async function getOrderByEmail(email: string) {
  const snapshot = await db
    .collection('orders')
    .where('email', '==', email)
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();
  
  return snapshot.docs[0]?.data();
}

export async function clearFirestore() {
  await fetch(
    'http://localhost:8080/emulator/v1/projects/contra-registration-stg/databases/(default)/documents',
    { method: 'DELETE' }
  );
}
