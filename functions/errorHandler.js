import { logger } from 'firebase-functions/v2';
import { HttpsError } from 'firebase-functions/v2/https';

export const ErrorType = {
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  VALIDATION_MISSING_ID: 'VALIDATION_MISSING_ID',
  VALIDATION_MISSING_AMOUNT: 'VALIDATION_MISSING_AMOUNT',
  VALIDATION_ID_MISMATCH: 'VALIDATION_ID_MISMATCH',
  VALIDATION_AMOUNT_MISMATCH: 'VALIDATION_AMOUNT_MISMATCH',
  PAYPAL_API: 'PAYPAL_API',
  STRIPE_API: 'STRIPE_API',
  DATABASE_SAVE: 'DATABASE_SAVE'
};

// Firebase Function error codes for use with HttpsError
// https://firebase.google.com/docs/reference/node/firebase.functions#functionserrorcode
const ErrorCode = {
  OK: 'ok',
  CANCELLED: 'cancelled',
  UNKNOWN: 'unknown',
  INVALID_ARGUMENT: 'invalid-argument',
  DEADLINE_EXCEEDED: 'deadline-exceeded',
  NOT_FOUND: 'not-found',
  ALREADY_EXISTS: 'already-exists',
  PERMISSION_DENIED: 'permission-denied',
  RESOURCE_EXHAUSTED: 'resource-exhausted',
  FAILED_PRECONDITION: 'failed-precondition',
  ABORTED: 'aborted',
  OUT_OF_RANGE: 'out-of-range',
  UNIMPLEMENTED: 'unimplemented',
  INTERNAL: 'internal',
  UNAVAILABLE: 'unavailable',
  DATA_LOSS: 'data-loss',
  UNAUTHENTICATED: 'unauthenticated'
};

// set valid error code and optional message override for each error type
const errorMapping = {
  [ErrorType.INVALID_AMOUNT]: { code: ErrorCode.OUT_OF_RANGE },
  [ErrorType.VALIDATION_MISSING_ID]: { code: ErrorCode.INVALID_ARGUMENT },
  [ErrorType.VALIDATION_MISSING_AMOUNT]: { code: ErrorCode.INVALID_ARGUMENT },
  [ErrorType.VALIDATION_ID_MISMATCH]: { code: ErrorCode.INVALID_ARGUMENT },
  [ErrorType.VALIDATION_AMOUNT_MISMATCH]: { code: ErrorCode.INVALID_ARGUMENT },
  [ErrorType.PAYPAL_API]: { code: ErrorCode.UNAVAILABLE, message: 'Payment service temporarily unavailable' },
  [ErrorType.STRIPE_API]: { code: ErrorCode.UNAVAILABLE, message: 'Payment service temporarily unavailable' },
  [ErrorType.DATABASE_SAVE]: { code: ErrorCode.INTERNAL, message: 'Error saving order' }
};

export const createError = (type, message, details = {}) => {
  const error = new Error(message);
  error.type = type;
  error.details = details;
  return error;
};


export const handleFunctionError = (err, action, data) => {
  logger.error(err, { action, data, errorType: err.type, ...err.details });

  const { code, message } = errorMapping[err.type] ?? {
    code: ErrorCode.INTERNAL, // default error code
    message: `An error occurred in ${action}` // default message
  };

  // if didn't override message above, just use the message the error came with
  throw new HttpsError(code, message ?? err.message);
};
