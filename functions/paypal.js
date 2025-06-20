// NOTE: listTransactions requires manually enabling that access in PayPal developer dashboard

import { logger, https } from 'firebase-functions/v2';
import { ApiError, CheckoutPaymentIntent, Client, Environment, LogLevel, OrdersController, ShippingPreference, PatchOp } from '@paypal/paypal-server-sdk';
import { getOrderByPaymentId } from './shared/orders.js';
import { sendMail } from './shared/email.js';
import { getDateChunks, formatCurrency, IS_EMULATOR, PROJECT_ID } from './helpers.js';
import { createError, ErrorType } from './errorHandler.js';
const { SANDBOX_MODE, PAYPAL_CLIENT_ID_SANDBOX, PAYPAL_CLIENT_SECRET_SANDBOX, PAYPAL_CLIENT_ID_LIVE, PAYPAL_CLIENT_SECRET_LIVE } = process.env;

const useSandbox = SANDBOX_MODE === 'true' || IS_EMULATOR;
const paypalClientId = useSandbox ? PAYPAL_CLIENT_ID_SANDBOX : PAYPAL_CLIENT_ID_LIVE;
const paypalClientSecret = useSandbox ? PAYPAL_CLIENT_SECRET_SANDBOX : PAYPAL_CLIENT_SECRET_LIVE;
const paypalApiUrl = useSandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';

const client = new Client({
  clientCredentialsAuthCredentials: {
    oAuthClientId: paypalClientId,
    oAuthClientSecret: paypalClientSecret
  },
  timeout: 0,
  environment: useSandbox ? Environment.Sandbox : Environment.Production,
  logging: {
    logLevel: LogLevel.Info,
    logRequest: { logBody: true },
    logResponse: { logHeaders: true },
  },
});

const ordersController = new OrdersController(client);

export const capturePaypalOrder = async ({ id, idempotencyKey }) => {
  logger.info('capturePaypalOrder', { id });
  if (!id) throw createError(ErrorType.INVALID_ARGUMENT, 'No payment intent ID provided');
  try {
    const { result, statusCode } = await ordersController.ordersCapture({
      id,
      paypalRequestId: idempotencyKey,
      prefer: 'return=minimal'
    });
    if (statusCode < 200 || statusCode >= 300) throw new Error(`Failed to capture order: ${statusCode}`);
    validateOrderResponse(result);
    return parseResult(result);
  } catch (error) {
    handlePaypalError(error, 'capturePaypalOrder');
  }
};

export const createOrUpdatePaypalOrder = async ({ id, email, description, amount, idempotencyKey }) => {
  logger.info('createOrUpdatePaypalOrder', { email, idempotencyKey });

  const result = id
    ? await updateOrder({ id, amount, idempotencyKey })
    : await createOrder({ description, amount, idempotencyKey });

  validateOrderResponse(result, id, amount);
  return parseResult(result);
};

const createOrder = async ({ description, amount, idempotencyKey }) => {
  logger.info('Creating order');

  const requestBody = {
    intent: CheckoutPaymentIntent.CAPTURE,
    purchaseUnits: [
      {
        description,
        amount: {
          currencyCode: 'USD',
          value: formatCurrency(amount)
        },
      }
    ],
    paymentSource: {
      paypal: {
        experienceContext: {
          shippingPreference: ShippingPreference.NOSHIPPING,
        },
      },
    },
  };

  try {
    const { result } = await ordersController.ordersCreate({
      body: requestBody,
      paypalRequestId: idempotencyKey,
      prefer: 'return=representation'
    });

    if (!result) throw new Error('No order created');
    logger.info('Initialized Paypal order', { id: result.id });
    return result;
  } catch (error) {
    handlePaypalError(error, 'createOrder');
  }
}

const updateOrder = async ({ id, amount, idempotencyKey }) => {
  logger.info('Updating order', { id });

  const requestBody = [{
    op: PatchOp.Replace,
    path: "/purchase_units/@reference_id=='default'/amount",
    value: {
      currency_code: 'USD',
      value: formatCurrency(amount)
    }
  }];

  try {
    const { statusCode } = await ordersController.ordersPatch({
      id,
      body: requestBody,
      paypalRequestId: idempotencyKey,
      prefer: 'return=representation'
    });

    if (statusCode < 200 || statusCode >= 300) throw new Error(`Failed to update order: ${statusCode}`);
    logger.info('Updated Paypal order', { id });
    return getOrder(id);
  } catch (error) {
    handlePaypalError(error, 'updateOrder');
  }
}

const getOrder = async (id) => {
  logger.info('Retrieving order', { id });

  try {
    const { result } = await ordersController.ordersGet({ id });

    if (!result) throw new Error('No order found');
    return result;
  } catch (error) {
    handlePaypalError(error, 'getOrder');
  }
}

const parseResult = (result) => {
  let id, email, amount;
  if (result?.status === 'COMPLETED') {
    email = result.payer?.emailAddress;
    id = result.purchaseUnits[0]?.payments?.captures?.[0]?.id;
    amount = result.purchaseUnits[0]?.payments?.captures[0]?.amount?.value;
  } else {
    id = result?.id;
    amount = result?.purchaseUnits[0]?.amount?.value;
  }
  return { id, email, amount };
};


// helpers for validations and error handling

const validateOrderResponse = (result, expectedId = null, expectedAmount = null) => {
  const { id, amount } = parseResult(result);

  if (!id) throw createError(
    ErrorType.VALIDATION_MISSING_ID,
    'No order ID returned from PayPal',
    { result }
  );

  if (!amount) throw createError(
    ErrorType.VALIDATION_MISSING_AMOUNT,
    'No amount returned from PayPal',
    { result }
  );

  if (expectedId && expectedId !== id) throw createError(
    ErrorType.VALIDATION_AMOUNT_MISMATCH,
    'Order ID mismatch',
    { expected: expectedId, received: id }
  );

  if (expectedAmount && formatCurrency(expectedAmount) !== formatCurrency(amount)) throw createError(
    ErrorType.VALIDATION_AMOUNT_MISMATCH,
    'Amount mismatch',
    { expected: expectedAmount, received: amount }
  );
  
  return true;
};

const handlePaypalError = (error, operation) => {
  error.details = { ...error.details, operation };
  console.log('handlePaypalError', error);
  if (error instanceof ApiError) {
    error.type = ErrorType.PAYPAL_API;
    error.details = { ...error.details, statusCode: error.statusCode };

    // try to extract a more useful error message from PayPal response
    if (error.result?.message) {
      error.message = error.result.message;
      if (error.result.details?.[0]?.description) {
        error.message += ` ${error.result.details[0].description}`;
      }
    } else {
      error.message = `PayPal API error occurred during ${operation}.`;
    }
  }
  throw error;
};




/* * * * * * * * * * PayPal Transactions List * * * * * * * * * * * * * * * * * * * * * * * *
 * PayPal SDK does not support listing transactions directly.                               *
 * We need to manually fetch transactions using the REST API.                               *
 * The code below retrieves all transactions for a given description within the past year.  *
 * This requires enabling the "Transactions" permission in the PayPal developer dashboard.  *
 * Note that there is also a signficant delay (up to 24 hours) for transactions to appear.  *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

// List transactions from PayPal API (only available in REST API, not SDK)
export const listPaypalTransactions = async (description) => {
  logger.info('listPaypalTransactions', { description });

  const accessToken = await getPayPalAccessToken();
  if (!accessToken) {
    throw createError(ErrorType.PAYPAL_API, 'Failed to retrieve PayPal access token');
  }

  const transactions = await fetchAllTransactions(accessToken);

  const matchingTransactions = transactions.filter(txn => 
    txn.transaction_info?.transaction_subject === description
  );
  logger.info(`Found ${matchingTransactions.length} transactions for: ${description}`);

  const normalizedTransactions = matchingTransactions.map(normalizeTransaction);

  logger.debug('Normalized PayPal transactions from API:', normalizedTransactions); // debug log
  return normalizedTransactions;
};

const fetchTransactionChunk = async (accessToken, startDate, endDate) => {
  const params = new URLSearchParams({
    'start_date': startDate.toISOString(),
    'end_date': endDate.toISOString(),
    'fields': 'all',
    'page_size': '500'
  });

  const response = await fetch(`${paypalApiUrl}/v1/reporting/transactions?${params}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw createError(ErrorType.PAYPAL_API, `Failed to fetch transactions: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  if (!data?.transaction_details || !Array.isArray(data.transaction_details)) {
    throw createError(ErrorType.PAYPAL_API, 'Invalid response format from PayPal transactions API');
  }

  return data.transaction_details;
};

const fetchAllTransactions = async (accessToken) => {
  // Fetch in 30-day chunks due to PayPal API limitations
  const dateChunks = createDateChunks();
  const transactions = [];

  for (const { start, end } of dateChunks) {
    const chunkTransactions = await fetchTransactionChunk(accessToken, start, end);
    transactions.push(...chunkTransactions);
  }

  if (!transactions.length) {
    logger.info('No PayPal transactions found (recent transactions may not yet appear)');
  }

  return transactions;
};

const createDateChunks = () => {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 1);
  const startDate = new Date();
  startDate.setFullYear(endDate.getFullYear() - 1);

  return getDateChunks(startDate, endDate, 30);
};

const normalizeTransaction = (txn) => {
  const { transaction_info, payer_info } = txn;
  const { transaction_id, transaction_amount, transaction_initiation_date } = transaction_info;
  const { email_address } = payer_info;

  return {
    id: transaction_id,
    amount: parseFloat(transaction_amount.value),
    currency: transaction_amount.currency_code,
    date: new Date(transaction_initiation_date),
    email: email_address
  };
};

// Manually get token for use with REST API since server sdk doesn't support transactions list
const getPayPalAccessToken = async () => {
  const auth = Buffer.from(`${paypalClientId}:${paypalClientSecret}`).toString('base64');
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

// // Helper for debug logging of retrieved transactions
// const logTransactions = (transactions) => {
//   for (const txn of transactions) {
//     const { id, amount, currency, subject, date, email } = txn;
//     logger.debug(`Transaction ID: ${id}, Amount: ${amount} ${currency}, Subject: ${subject}, Date: ${date.toISOString()}, Email: ${email}`);
//   }
// }

export const paypalWebhook = https.onRequest(async (req, res) => {
  logger.debug('Received PayPal webhook', { headers: req.headers, body: req.body });

  try {
    // Validate the webhook signature
    const isValid = await validateWebhookSignature(req, res);
    if (!isValid) {
      logger.warn('Invalid PayPal webhook signature', { headers: req.headers });
      return res.status(400).send('Invalid signature');
    }
  } catch (error) {
    logger.error('Error validating PayPal webhook signature', { error });
    return res.status(500).send('Internal Server Error');
  }

  const { event_type, resource } = req.body;
  const { id: paymentId, status } = resource || {};
  if (event_type !== 'PAYMENT.CAPTURE.COMPLETED' || status !== 'COMPLETED') {
    logger.info('Ignoring irrelevant webhook', { eventType: event_type });
    return res.status(200).send('Event ignored - not completed payment capture');
  }

  // Process the webhook event
  logger.info('Received webhook for PayPal payment capture', { paymentId, useSandbox });

  try {
    // Confirm this payment is already in db
    const order = await getOrderByPaymentId(paymentId, useSandbox);
    if (order) {
      logger.info('Found matching order in database', { paymentId, email: order.email });
    } else {
      logger.warn('Received PayPal payment capture for unrecognized payment ID', { paymentId });
      sendMail({
        to: process.env.EMAIL_NOTIFY_TO,
        subject: `${PROJECT_ID} - Unrecognized PayPal Payment Capture: ${paymentId}`,
        text: `Received PayPal payment capture for ID ${paymentId} but no matching record found in the database.`,
      });
    }
  } catch (error) {
    logger.error('Error processing PayPal webhook', { paymentId, error });
    return res.status(500).send('Internal Server Error');
  }

  res.status(200).send('Webhook received');
});

const validateWebhookSignature = async (req, res) => {
  const accessToken = await getPayPalAccessToken();
  if (!accessToken) {
    throw createError(ErrorType.PAYPAL_API, 'Failed to retrieve PayPal access token');
  }

  const response = await fetch(`${paypalApiUrl}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      auth_algo: req.headers['paypal-auth-algo'],
      cert_url: req.headers['paypal-cert-url'],
      transmission_id: req.headers['paypal-transmission-id'],
      transmission_sig: req.headers['paypal-transmission-sig'],
      transmission_time: req.headers['paypal-transmission-time'],
      webhook_id: process.env.PAYPAL_WEBHOOK_ID,
      webhook_event: req.body
    })
  });

  if (!response.ok) {
    logger.warn('Failed to verify PayPal webhook signature', { status: response.status, headers: req.headers });
    return false;
  }

  const data = await response.json();
  return data.verification_status === 'SUCCESS';
};
