import configBasics from './configBasics';
const { SANDBOX_MODE } = configBasics;
const { VITE_PAYPAL_CLIENT_ID_SANDBOX, VITE_PAYPAL_CLIENT_ID_LIVE, VITE_USE_FIREBASE_EMULATOR, MODE } = import.meta.env;

const IS_EMULATOR = VITE_USE_FIREBASE_EMULATOR === 'true' && MODE === 'development';

const paypalClientId = SANDBOX_MODE || IS_EMULATOR ? VITE_PAYPAL_CLIENT_ID_SANDBOX : VITE_PAYPAL_CLIENT_ID_LIVE;

const config = {
  PAYPAL_OPTIONS: {
    "client-id": paypalClientId,
    "disable-funding": "paylater,credit",
    "enable-funding": "venmo",
    "currency": "USD",
    "locale": "en_US"
  }
}

export default config;
