import { logger } from 'firebase-functions/v2';
import { ApiError, CheckoutPaymentIntent, OrdersController, ShippingPreference, PatchOp } from '@paypal/paypal-server-sdk';
import { formatCurrency } from '../shared/helpers.js';
import { createError, ErrorType } from '../shared/errorHandler.js';
import { getClient } from './auth.js';
import { getConfig } from '../config/internal/config.js';

import type { CustomError } from '../shared/errorHandler.js';

let ordersController = null;
const getOrdersController = () => ordersController ??= new OrdersController(getClient());

export const capturePaypalOrder = async ({ id, idempotencyKey, email }: {
  id: string;
  idempotencyKey: string;
  email: string;
}) => {
  logger.info(`capturePaypalOrder: ${email}`, { id, email });
  if (!id) throw createError(ErrorType.INVALID_ARGUMENT, 'No payment intent ID provided');
  try {
    const { result, statusCode } = await getOrdersController().ordersCapture({
      id,
      paypalRequestId: idempotencyKey,
      prefer: 'return=minimal'
    });
    if (statusCode < 200 || statusCode >= 300) {
      logger.error(`Failed to capture order ${id} for ${email}`, { statusCode, result, email });
      throw new Error(`Failed to capture order: ${statusCode}`);
    }
    validateOrderResponse(result);
    return parseResult(result);
  } catch (error) {
    handlePaypalError(error as CustomError, 'capturePaypalOrder');
    return; // satisfy TS
  }
};

export const createOrUpdatePaypalOrder = async ({ id, email, description, amount, idempotencyKey }: {
  id?: string;
  email: string;
  description: string;
  amount: number;
  idempotencyKey: string;
}) => {
  logger.info(`createOrUpdatePaypalOrder: ${email}`, { email, idempotencyKey });

  const { WAITLIST_MODE } = getConfig();
  if (WAITLIST_MODE) {
    throw createError(ErrorType.PERMISSION_DENIED, 'Client and server waitlist modes out of sync. Please hit the back button twice and then refresh the browser to continue.');
  }

  let result;
  if (id && await orderExists(id)) {
    logger.info(`Order ${id} exists, updating order for ${email}`);
    result = await updateOrder({ id, amount, idempotencyKey });
    validateOrderResponse(result, id, amount);
  } else if (id) {
    logger.info(`Order ID ${id} provided but does not exist, creating new order for ${email}`);
    result = await createOrder({ description, amount, idempotencyKey });
    validateOrderResponse(result, undefined, amount);
  } else {
    logger.info(`No Order ID provided, creating new order for ${email}`);
    result = await createOrder({ description, amount, idempotencyKey });
    validateOrderResponse(result, undefined, amount);
  }

  return parseResult(result);
};

const createOrder = async ({ description, amount, idempotencyKey }: {
  description: string;
  amount: number;
  idempotencyKey: string;
}) => {
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
    const { result } = await getOrdersController().ordersCreate({
      body: requestBody,
      paypalRequestId: idempotencyKey,
      prefer: 'return=representation'
    });

    if (!result) throw new Error('No order created');
    logger.info('Initialized Paypal order', { id: result.id });
    return result;
  } catch (error) {
    handlePaypalError(error as CustomError, 'createOrder');
  }
}

const updateOrder = async ({ id, amount, idempotencyKey }: {
  id: string;
  amount: number;
  idempotencyKey: string;
}) => {
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
    const { statusCode } = await getOrdersController().ordersPatch({
      id,
      body: requestBody,
      paypalRequestId: idempotencyKey,
      prefer: 'return=representation'
    });

    if (statusCode < 200 || statusCode >= 300) throw new Error(`Failed to update order: ${statusCode}`);
    logger.info('Updated Paypal order', { id });
    return getOrder(id);
  } catch (error) {
    handlePaypalError(error as CustomError, 'updateOrder');
  }
}

const getOrder = async (id: string) => {
  logger.info('Retrieving order', { id });

  try {
    const { result } = await getOrdersController().ordersGet({ id });

    if (!result) throw new Error('No order found');
    return result;
  } catch (error) {
    handlePaypalError(error as CustomError, 'getOrder');
  }
}

const orderExists = async (id: string) => {
  try {
    await getOrdersController().ordersGet({ id }); // throws error if not found
    return true;
  } catch {
    return false;
  }
};

interface PaypalResult {
  id?: string;
  status?: string;
  payer?: {
    emailAddress?: string;
  };
  purchaseUnits: Array<{
    amount?: {
      value?: string;
    };
    payments?: {
      captures?: Array<{
        id?: string;
        amount?: {
          value?: string;
        };
      }>;
    };
  }>;
}

const parseResult = (result: PaypalResult) => {
  let id, email, amount;
  if (result?.status === 'COMPLETED') {
    email = result.payer?.emailAddress;
    id = result.purchaseUnits[0]?.payments?.captures?.[0]?.id;
    amount = result.purchaseUnits[0]?.payments?.captures?.[0]?.amount?.value;
  } else {
    id = result?.id;
    amount = result?.purchaseUnits[0]?.amount?.value;
  }
  return { id, email, amount };
};


// helpers for validations and error handling

const validateOrderResponse = (result: PaypalResult, expectedId?: string, expectedAmount?: number) => {
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

  if (expectedId && expectedId !== id) {
    logger.info('expected id vs actual', { expectedId, id });
    throw createError(ErrorType.VALIDATION_ID_MISMATCH, 'Order ID mismatch', { expected: expectedId, received: id });
  }

  if (expectedAmount && formatCurrency(expectedAmount) !== formatCurrency(Number(amount))) {
    logger.info('expected amount vs actual', { expectedAmount, amount });
    throw createError(ErrorType.VALIDATION_AMOUNT_MISMATCH, 'Amount mismatch', { expected: expectedAmount, received: amount });
  }
  
  return true;
};

const handlePaypalError = (error: CustomError, operation: string): never => {
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
