import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';
import configBasics from 'config/configBasics';

const { VITE_FIREBASE_CONFIG, VITE_FUNCTIONS_REGION } = import.meta.env;
const { USE_FIREBASE_EMULATOR } = configBasics;

const firebaseConfig = JSON.parse(VITE_FIREBASE_CONFIG);

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// initial setup of Firebase functions
const functions = getFunctions(app, VITE_FUNCTIONS_REGION);
if (USE_FIREBASE_EMULATOR) {
  console.log('Using Firebase Emulator');
  connectFunctionsEmulator(functions, 'localhost', 5001);
} else if (import.meta.env.DEV) {
  console.warn('%cNOT using Firebase Emulator', 'background: orange; font-size: 1.1em; font-weight: bold; padding: 2px 4px;');
}

// centralize calling Firebase functions
const firebaseFunctionDispatcher = async ({ action, data, email }) => {
  const metadata = {
    userAgent: navigator.userAgent,
    ...(email && { email })
  };
  const callable = httpsCallable(functions, 'firebaseFunctionDispatcher');
  return await callable({ action, data, metadata });
};

export { firebaseFunctionDispatcher };
