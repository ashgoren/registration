import { logger } from 'firebase-functions/v2';
import { HttpsError } from 'firebase-functions/v2/https';
import { ErrorType, ErrorCode } from './constants.js';

export const createError = (type, message, details = {}) => {
  const error = new Error(message);
  error.type = type;
  error.details = details;
  return error;
};

// set valid error code and optional message override for each error type
const errorMapping = {
  [ErrorType.INVALID_AMOUNT]: { code: ErrorCode.OUT_OF_RANGE },
  [ErrorType.VALIDATION_MISSING_ID]: { code: ErrorCode.INVALID_ARGUMENT },
  [ErrorType.VALIDATION_MISSING_AMOUNT]: { code: ErrorCode.INVALID_ARGUMENT },
  [ErrorType.VALIDATION_ID_MISMATCH]: { code: ErrorCode.INVALID_ARGUMENT },
  [ErrorType.VALIDATION_AMOUNT_MISMATCH]: { code: ErrorCode.INVALID_ARGUMENT },
  [ErrorType.PAYPAL_API]: { code: ErrorCode.UNAVAILABLE, message: 'Payment service temporarily unavailable' }
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
