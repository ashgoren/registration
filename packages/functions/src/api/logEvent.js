// Used by front-end to log front-end events

import { logger } from 'firebase-functions/v2';

export const logEvent = (payload) => {
  const { level, message, ...rest } = payload;
  logger[level](`[Frontend] ${message}`, rest);
};
