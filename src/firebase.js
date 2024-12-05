import { initializeApp, getApps } from "firebase/app";
import { initializeAppCheck, ReCaptchaEnterpriseProvider, onTokenChanged } from "firebase/app-check";
import { getFunctions, connectFunctionsEmulator, httpsCallable } from "firebase/functions";
import { log, logWarn } from 'logger.js';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL
}

// window.self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;

let appCheck;

// initial setup of Firebase app and AppCheck
if (!getApps().length) {
  const app = initializeApp(firebaseConfig);
  appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(process.env.REACT_APP_RECAPTCHA_SITE_KEY),
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
if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_FIREBASE_EMULATOR === 'true') {
  console.log('Using Firebase Emulator');
  connectFunctionsEmulator(functions, 'localhost', 5001);
} else if (process.env.NODE_ENV === 'development') {
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
