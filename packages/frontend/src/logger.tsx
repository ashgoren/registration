import * as api from 'src/firebase';
import { config } from 'config';
const { env } = config;

// log to firebase logger

export const logInfo = (message: string, metadata: Record<string, unknown> = {}) => logger('info', message, metadata);
export const logWarn = (message: string, metadata: Record<string, unknown> = {}) => logger('warn', message, metadata);
export const logError = (message: string, metadata: Record<string, unknown> = {}) => logger('error', message, metadata);

const logger = (level: 'info' | 'warn' | 'error', message: string, metadata: Record<string, unknown> = {}) => {
  // log locally
  console[level](message, ...(Object.keys(metadata).length ? [metadata] : []));

  // log to Google Cloud logging via Firebase Function (production only)
  if (import.meta.env.PROD) {
    api.logEvent({
      level,
      message,
      timestamp: new Date().toISOString(),
      metadata
    });
  }
};


// local debug logger
export const logInfoDebug = env !== 'prd' ? (...args: unknown[]) => console.log(...args) : () => {};
export const logWarnDebug = env !== 'prd' ? (...args: unknown[]) => console.warn(...args) : () => {};
export const logErrorDebug = env !== 'prd' ? (...args: unknown[]) => console.error(...args) : () => {};
export const logDebug = logInfoDebug;

// devtools console logger util
export const logEnvironment = () => {
  const styles = {
    dev: 'color: white; background: teal; padding: 2px 6px; border-radius: 4px; font-weight: bold',
    stg: 'color: black; background: gold; padding: 2px 6px; border-radius: 4px; font-weight: bold',
    prd: 'color: white; background: crimson; padding: 2px 6px; border-radius: 4px; font-weight: bold'
  };
  console.log(`%cEnvironment is ${env}`, styles[env] || ''); // keep the console.log here!
};
