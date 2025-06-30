import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAppCheck, CustomProvider } from 'firebase/app-check';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';
import { CloudflareProviderOptions } from '@cloudflare/turnstile-firebase-app-check';
import { log, logWarn } from 'src/logger';
import configEnv from 'config/configEnv';
import configBasics from 'config/configBasics';

const { FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_PROJECT_ID, FIREBASE_STORAGE_BUCKET, FIREBASE_SENDER_ID, FIREBASE_APP_ID } = configEnv;
const { FUNCTIONS_REGION, TURNSTILE_SITE_KEY, TURNSTILE_FUNCTION_URL, APPCHECK_DEBUG_TOKEN } = configEnv;
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
  console.log('Initializing Firebase App Check...');
  if (!appCheck) {
    // indexedDB.deleteDatabase('firebase-app-check-database');
    try {
      const turnstileOptions = new CloudflareProviderOptions(TURNSTILE_FUNCTION_URL, TURNSTILE_SITE_KEY);

      appCheck = initializeAppCheck(app, {
        provider: new CustomProvider(turnstileOptions),
        isTokenAutoRefreshEnabled: true
      });
      await new Promise(resolve => setTimeout(resolve, 15000)); // wait 15 seconds to ensure App Check is initialized
      const { data } = await firebaseFunctionDispatcher({ action: 'getAppCheckToken' });
      if (!data?.token) {
        throw new Error('App Check token is missing');
      }
      log('Firebase App Check initialized successfully :)');
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
