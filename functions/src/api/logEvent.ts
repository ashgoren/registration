// Used by front-end to log front-end events

import { logger } from 'firebase-functions/v2';
import type { LoggerPayload } from '../types/logger';

export const logEvent = (payload: LoggerPayload) => {
  const { level, message, ...rest } = payload;
  logger[level](`[Frontend] ${message}`, rest);
};
