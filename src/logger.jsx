import { firebaseFunctionDispatcher } from 'src/firebase.jsx';
import { config } from 'config';
const { ENV } = config;

export const log = (message, metadata) => logger('info', message, metadata);
export const logWarn = (message, metadata) => logger('warn', message, metadata);
export const logError = (message, metadata) => logger('error', message, metadata);

const logger = (level, message, metadata = {}) => {
  // log locally
  console[level](message, ...(Object.keys(metadata).length ? [metadata] : []));

  // log to Google Cloud logging via Firebase Function (production only)
  if (import.meta.env.PROD) {
    const { email, order, error, userAgent, ...rest } = metadata;

    const payload = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...email && { email },
      ...userAgent && { userAgent },
      ...order && { order },
      ...error && { error },
      ...(Object.keys(rest).length && { metadata: rest })
    };

    firebaseFunctionDispatcher({
      action: 'logEvent',
      data: payload,
      ...email && { email }
    });
  }
};

// devtools console logger util
export const logEnvironment = () => {
  const styles = {
    dev: 'color: white; background: teal; padding: 2px 6px; border-radius: 4px; font-weight: bold',
    stg: 'color: black; background: gold; padding: 2px 6px; border-radius: 4px; font-weight: bold',
    prd: 'color: white; background: crimson; padding: 2px 6px; border-radius: 4px; font-weight: bold'
  };
  console.log(`%cEnvironment is ${ENV}`, styles[ENV] || '');
};
