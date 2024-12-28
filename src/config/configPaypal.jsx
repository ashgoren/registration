const config = {
  PAYPAL_OPTIONS: {
    "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID,
    "disable-funding": "paylater,credit",
    "enable-funding": "venmo",
    "currency": "USD",
    "locale": "en_US"
  }
}

export default config;
