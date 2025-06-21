import configEnv from './configEnv';
import configBasics from './configBasics';

const { SANDBOX_MODE, USE_FIREBASE_EMULATOR } = configBasics;
const { PAYPAL_CLIENT_ID_SANDBOX, PAYPAL_CLIENT_ID_LIVE } = configEnv;

const paypalClientId = SANDBOX_MODE || USE_FIREBASE_EMULATOR ? PAYPAL_CLIENT_ID_SANDBOX : PAYPAL_CLIENT_ID_LIVE;

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