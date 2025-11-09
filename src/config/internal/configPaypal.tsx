const { VITE_PAYPAL_CLIENT_ID } = import.meta.env;

const config = {
  PAYPAL_OPTIONS: {
    "clientId": VITE_PAYPAL_CLIENT_ID,
    "disable-funding": "paylater,credit",
    "enable-funding": "venmo",
    "currency": "USD",
    "locale": "en_US"
  }
} as const;

export default config;