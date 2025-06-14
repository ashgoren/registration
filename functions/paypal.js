import { logger } from 'firebase-functions/v2';
import { ApiError, CheckoutPaymentIntent, Client, Environment, LogLevel, OrdersController, ShippingPreference, PatchOp } from '@paypal/paypal-server-sdk';
import { formatCurrency, IS_EMULATOR } from './helpers.js';
import { createError, ErrorType } from './errorHandler.js';
const { SANDBOX_MODE, PAYPAL_CLIENT_ID_SANDBOX, PAYPAL_CLIENT_SECRET_SANDBOX, PAYPAL_CLIENT_ID_LIVE, PAYPAL_CLIENT_SECRET_LIVE } = process.env;

const useSandbox = SANDBOX_MODE === 'true' || IS_EMULATOR;
const paypalClientId = useSandbox ? PAYPAL_CLIENT_ID_SANDBOX : PAYPAL_CLIENT_ID_LIVE;
const paypalClientSecret = useSandbox ? PAYPAL_CLIENT_SECRET_SANDBOX : PAYPAL_CLIENT_SECRET_LIVE;

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
    return validateOrderResponse(result);
  } catch (error) {
    handlePaypalError(error, 'capturePaypalOrder');
  }
};

export const createOrUpdatePaypalOrder = async ({ id, email, description, amount, idempotencyKey }) => {
  logger.info('createOrUpdatePaypalOrder', { email, idempotencyKey });

  const result = id
    ? await updateOrder({ id, amount, idempotencyKey })
    : await createOrder({ description, amount, idempotencyKey });

  return validateOrderResponse(result, id, amount);
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


// helpers for validations and error handling

const validateOrderResponse = (result, expectedId = null, expectedAmount = null) => {
  let id, amount;
  if (result?.status === 'COMPLETED') {
    id = result.payer?.emailAddress; // or transaction id: result.purchaseUnits[0].payments.captures[0].id
    amount = result.purchaseUnits[0]?.payments?.captures[0]?.amount?.value;
  } else {
    id = result?.id;
    amount = result?.purchaseUnits[0]?.amount?.value;
  }

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
  
  return { id, amount };
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
