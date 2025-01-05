import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider, getToken } from 'firebase/app-check';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';
import { logWarn } from 'src/logger';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL
}

// This is used to bypass Firebase App Check in development mode
if (process.env.NODE_ENV === 'development') {
  window.self.FIREBASE_APPCHECK_DEBUG_TOKEN = import.meta.env.VITE_APPCHECK_DEBUG_TOKEN;
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
let appCheck;

const initializeFirebaseAppCheck = async () => {
  if (!appCheck) {
    indexedDB.deleteDatabase('firebase-app-check-database');
    try {
      appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
        isTokenAutoRefreshEnabled: true
      });
      await getToken(appCheck);
      console.log('AppCheck initialized successfully');
      return true;
    } catch (error) {
      logWarn('AppCheck initialization failed', { error });
      return false;
    }
  }
  return !!appCheck;
};

// initial setup of Firebase functions
const functions = getFunctions();
if (import.meta.env.MODE === 'development' && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  console.log('Using Firebase Emulator');
  connectFunctionsEmulator(functions, 'localhost', 5001);
} else if (import.meta.env.MODE === 'development') {
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

export { initializeFirebaseAppCheck, firebaseFunctionDispatcher };
