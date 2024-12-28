import { firebaseFunctionDispatcher } from 'src/firebase.jsx';

export const log = (message, metadata) => logger('info', message, metadata);
export const logWarn = (message, metadata) => logger('warn', message, metadata);
export const logError = (message, metadata) => logger('error', message, metadata);
export const logDivider = () => logger('divider', '-'.repeat(125));

const logger = (level, msg, metadata = {}) => {
  const isLog = level !== 'divider';

  // log locally
  if (isLog) {
    console[level](msg, ...(Object.keys(metadata).length ? [metadata] : []));
  }

  // log to Papertrail via Firebase Function (production only)
  if (import.meta.env.MODE === 'production') {
    const { email, order, error, userAgent, ...rest } = metadata;
    const includeLevel = level === 'warn' || level === 'error';
    const includeMetadata = Object.keys(rest).length > 0;

    const payload = {
      ...includeLevel ? { level } : {},
      msg,
      ...isLog && { timestamp: new Date().toISOString() },
      ...email && { email },
      ...userAgent && { userAgent },
      ...order && { order },
      ...error && { error },
      ...includeMetadata && { metadata: rest },
      ...isLog && { project: import.meta.env.VITE_FIREBASE_PROJECT_ID }
    };

    firebaseFunctionDispatcher({
      action: 'logToPapertrail',
      data: payload,
      ...email && { email }
    });
  }
};
