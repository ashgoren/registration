import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider, getToken } from 'firebase/app-check';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';
import { logWarn } from 'src/logger';
import configEnv from 'config/configEnv';
import configBasics from 'config/configBasics';

const { FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_PROJECT_ID, FIREBASE_STORAGE_BUCKET, FIREBASE_SENDER_ID, FIREBASE_APP_ID } = configEnv;
const { FUNCTIONS_REGION, RECAPTCHA_SITE_KEY, APPCHECK_DEBUG_TOKEN } = configEnv;
const { USE_FIREBASE_EMULATOR } = configBasics;

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_SENDER_ID,
  appId: FIREBASE_APP_ID
}

// This is used to bypass Firebase App Check in development mode
if (import.meta.env.DEV) {
  window.self.FIREBASE_APPCHECK_DEBUG_TOKEN = APPCHECK_DEBUG_TOKEN;
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
let appCheck;

const initializeFirebaseAppCheck = async () => {
  if (!appCheck) {
    indexedDB.deleteDatabase('firebase-app-check-database');
    try {
      appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(RECAPTCHA_SITE_KEY),
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
const functions = getFunctions(app, FUNCTIONS_REGION);
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

export { initializeFirebaseAppCheck, firebaseFunctionDispatcher };
