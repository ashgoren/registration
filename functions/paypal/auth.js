import { Client, Environment, LogLevel } from '@paypal/paypal-server-sdk';
import { createError, ErrorType } from '../shared/errorHandler.js';
import { getConfig } from '../config.js';

let paypalApiUrl = null;
let client = null;

export const getPaypalApiUrl = () => {
  if (paypalApiUrl) return paypalApiUrl;

  const { IS_SANDBOX, IS_EMULATOR } = getConfig();
  const useSandbox = IS_SANDBOX || IS_EMULATOR;
  paypalApiUrl = useSandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';

  return paypalApiUrl;
};

export const getClient = () => {
  if (client) return client;

  const { IS_SANDBOX, IS_EMULATOR, PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = getConfig();
  const useSandbox = IS_SANDBOX || IS_EMULATOR;

  client = new Client({
    clientCredentialsAuthCredentials: {
      oAuthClientId: PAYPAL_CLIENT_ID,
      oAuthClientSecret: PAYPAL_CLIENT_SECRET
    },
    timeout: 0,
    environment: useSandbox ? Environment.Sandbox : Environment.Production,
    logging: {
      logLevel: LogLevel.Info,
      logRequest: { logBody: true },
      logResponse: { logHeaders: true },
    },
  });

  return client;
};

// Manually get token for use with REST API since server sdk doesn't support transactions list
export const getPayPalAccessToken = async () => {
  const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = getConfig();

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  const paypalApiUrl = getPaypalApiUrl();
  const response = await fetch(`${paypalApiUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    throw createError(ErrorType.PAYPAL_API, `Failed to get access token: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
};
