// Used by front-end to log front-end events

import { logger } from 'firebase-functions/v2';

export const logEvent = (payload) => {
  logger.info(`[Frontend] ${payload.message}`, payload);
  return { status: 'ok' };
};
