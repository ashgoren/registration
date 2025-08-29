import { logger } from 'firebase-functions/v2';
import { getConfig } from '../config.js';

export const logToPapertrail = (payload) => {
  const { PAPERTRAIL_TOKEN } = getConfig();

  if (!PAPERTRAIL_TOKEN) {
    logger.warn('PAPERTRAIL_TOKEN is missing. Skipping logging to Papertrail.');
    return { status: 'Logging skipped: missing token' };
  }

  fetch('https://logs.collector.solarwinds.com/v1/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Basic ' + btoa(`:${PAPERTRAIL_TOKEN}`) },
    body: JSON.stringify(payload)
  }).catch(error => {
    logger.warn('Failed to log to Papertrail:', error);
  });
  return { status: 'Logging initiated' };
};
