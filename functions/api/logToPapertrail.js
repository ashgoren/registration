import { logger } from 'firebase-functions/v2';

export const logToPapertrail = (payload) => {
  const token = process.env.PAPERTRAIL_TOKEN;

  if (!token) {
    logger.warn('PAPERTRAIL_TOKEN is missing. Skipping logging to Papertrail.');
    return { status: 'Logging skipped: missing token' };
  }

  fetch('https://logs.collector.solarwinds.com/v1/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Basic ' + btoa(`:${token}`) },
    body: JSON.stringify(payload)
  }).catch(error => {
    logger.warn('Failed to log to Papertrail:', error);
  });
  return { status: 'Logging initiated' };
};
