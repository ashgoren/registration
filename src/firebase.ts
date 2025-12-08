import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';
import userConfig from 'config/configEvent.jsx';
import type { Order } from 'types/order';
import type { ElectronicPaymentMethod } from 'types/payment';

const isDev = import.meta.env.DEV;

const useFirebaseEmulator = isDev && userConfig.dev.use_firebase_emulator;

const { VITE_FIREBASE_CONFIG, VITE_FUNCTIONS_REGION } = import.meta.env;

const firebaseConfig = JSON.parse(VITE_FIREBASE_CONFIG);

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// initial setup of Firebase functions
const functions = getFunctions(app, VITE_FUNCTIONS_REGION);
if (useFirebaseEmulator) {
  console.log('Using Firebase Emulator');
  connectFunctionsEmulator(functions, 'localhost', 5001);
} else if (import.meta.env.DEV) {
  console.warn('%cNOT using Firebase Emulator', 'background: orange; font-size: 1.1em; font-weight: bold; padding: 2px 4px;');
}

type FirebaseFunctionData = {
  savePendingOrder: { orderId: string | null, order: Order };
  saveFinalOrder: { orderId: string, order: Order };
  capturePaypalOrder: { id: string; idempotencyKey: string  };
  initializePayment: {
    order: Order;
    paymentMethod: ElectronicPaymentMethod;
    paymentId: string | null;
    idempotencyKey: string;
    description: string;
  }
  logEvent: {
    level: 'info' | 'warn' | 'error';
    message: string;
    timestamp: string;
    metadata: Record<string, unknown>;
  };
  checkPeopleThreshold: Record<string, never>;
  createWaiverSubmission: { name: string; phone: string; email: string; };
}

export type FirebaseFunctionReturn = {
  savePendingOrder: { id: string };
  saveFinalOrder: void;
  capturePaypalOrder: {id: string; amount: string; email: string };
  initializePayment: { id: string; amount: number; clientSecret?: string };
  logEvent: void;
  checkPeopleThreshold: { thresholdReached: boolean; totalPeople: number };
  createWaiverSubmission: { slug: string };
}

type FirebaseCallableParams<T extends keyof FirebaseFunctionData> = {
  action: T;
  data?: FirebaseFunctionData[T];
  email?: string;
};

const firebaseFunctionDispatcher = async <T extends keyof FirebaseFunctionData>({
  action,
  data,
  email
}: FirebaseCallableParams<T>): Promise<FirebaseFunctionReturn[T]> => {
  const metadata = {
    userAgent: navigator.userAgent,
    ...(email && { email })
  };
  const callable = httpsCallable(functions, 'firebaseFunctionDispatcher');
  const response = await callable({ action, data, metadata });
  return response.data as FirebaseFunctionReturn[T];
};

export const savePendingOrder = async (params: {
  orderId: string | null,
  order: Order
}) => {
  const { email } = params.order.people[0];
  return await firebaseFunctionDispatcher({
    action: 'savePendingOrder',
    data: params,
    email
  });
};

export const saveFinalOrder = async (params: {
  orderId: string,
  order: Order
}) => {
  const { email } = params.order.people[0];
  return await firebaseFunctionDispatcher({
    action: 'saveFinalOrder',
    data: params,
    email
  });
};

export const initializePayment = async (params: {
  order: Order;
  paymentMethod: ElectronicPaymentMethod;
  paymentId: string | null;
  idempotencyKey: string;
  description: string;
  email: string;
}) => {
  const { email, ...data } = params;
  return await firebaseFunctionDispatcher({
    action: 'initializePayment',
    data,
    email
  });
};

export const capturePaypalOrder = async (params: {
  id: string,
  idempotencyKey: string,
  email: string
}) => {
  return await firebaseFunctionDispatcher({
    action: 'capturePaypalOrder',
    data: params,
    email: params.email
  });
};

export const logEvent = (params: {
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}) => {
  return firebaseFunctionDispatcher({
    action: 'logEvent',
    data: params
  });
};

export const checkPeopleThreshold = async () => {
  return await firebaseFunctionDispatcher({
    action: 'checkPeopleThreshold'
  });
};

export const createWaiverSubmission = async (params: {
  name: string;
  phone: string;
  email: string;
}) => {
  return await firebaseFunctionDispatcher({
    action: 'createWaiverSubmission',
    data: params,
    email: params.email
  });
};
