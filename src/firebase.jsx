import { initializeApp, getApps } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider, onTokenChanged } from 'firebase/app-check';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';
import { log, logWarn } from 'src/logger';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL
}

// window.self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;

let appCheck;

// initial setup of Firebase app and AppCheck
if (!getApps().length) {
  const app = initializeApp(firebaseConfig);
  appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
    isTokenAutoRefreshEnabled: true
  });
}

// log AppCheck token changes, for debugging
if (appCheck) {
  onTokenChanged(appCheck, (tokenResult) => {
    if (tokenResult.error) {
      logWarn('AppCheck token error', { error: tokenResult.error });
    } else {
      log('AppCheck token refreshed');
    }
  });
}

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

export { firebaseFunctionDispatcher };
