const { VITE_PAYPAL_CLIENT_ID } = import.meta.env;

export default {
  options: {
    'clientId': VITE_PAYPAL_CLIENT_ID,
    'disable-funding': 'paylater,credit',
    'currency': 'USD',
    'locale': 'en_US',
    // 'enable-funding': 'venmo'
  }
} as const;