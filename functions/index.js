import { logger } from 'firebase-functions/v2';
import { onCall } from 'firebase-functions/v2/https';
import { initializeApp, getApps } from 'firebase-admin/app';
import { handleFunctionError } from './errorHandler.js';
import { appendrecordtospreadsheet } from './google-sheet-sync.js';
import { savePendingOrder, saveFinalOrder } from './database.js';
import { sendEmailConfirmations } from './email-confirmation.js';
import { logToPapertrail } from './logger.js';
import { getStripePaymentIntent } from './stripe.js';
import { createOrUpdatePaypalOrder, capturePaypalOrder } from './paypal.js';
import { initializeOrder } from './initializeOrder.js';
import { log } from 'firebase-functions/logger';

if (!getApps().length) initializeApp();

// combining into one callable function to reduce slow cold start preflight checks
const firebaseFunctionDispatcher = onCall({ enforceAppCheck: false }, async (request) => {
  const hasToken = !!request.app?.token;
  const { action, data, metadata } = request.data;

  logTokenStatus(hasToken, action, metadata);

  try {
    switch(action) {
      case 'caffeinate': return { status: 'awake' };
      case 'initializeOrder':
        return await initializeOrder(data, savePendingOrder, getStripePaymentIntent, createOrUpdatePaypalOrder);
      case 'getStripePaymentIntent': return await getStripePaymentIntent(data);
      case 'createOrUpdatePaypalOrder': return await createOrUpdatePaypalOrder(data);
      case 'capturePaypalOrder': return await capturePaypalOrder(data);
      case 'savePendingOrder': return await savePendingOrder(data);
      case 'saveFinalOrder': return await saveFinalOrder(data);
      case 'sendEmailConfirmations': return await sendEmailConfirmations(data);
      case 'logToPapertrail': return logToPapertrail(data); // fire-and-forget
      default: return { error: 'Invalid action' };
    }
  } catch (err) {
    handleFunctionError(err, action, data);
  }
});

const logTokenStatus = (hasToken, action, metadata) => {
  if (action !== 'caffeinate' && action !== 'logToPapertrail') {
    const email = metadata?.email;
    logger[hasToken ? 'info' : 'warn'](
      'AppCheck ' + (hasToken ? 'success' : 'fail') + (email ? `: ${email}` : ''),
      { ...metadata, action }
    );
  };
};

export { firebaseFunctionDispatcher, appendrecordtospreadsheet };
