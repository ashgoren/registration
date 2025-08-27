import { Client, Environment, LogLevel } from '@paypal/paypal-server-sdk';
import { createError, ErrorType } from '../shared/errorHandler.js';
import { IS_SANDBOX, IS_EMULATOR } from '../shared/helpers.js';
const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;

export const useSandbox = IS_SANDBOX || IS_EMULATOR;
export const paypalApiUrl = useSandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';

export const client = new Client({
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

// Manually get token for use with REST API since server sdk doesn't support transactions list
export const getPayPalAccessToken = async () => {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
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
