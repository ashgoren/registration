import { logger } from 'firebase-functions/v2';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp, getApps } from 'firebase-admin/app';
import { appendrecordtospreadsheet } from './google-sheet-sync.js';
import { savePendingOrder, saveFinalOrder } from './database.js';
import { sendEmailConfirmations } from './email-confirmation.js';
import { logToPapertrail } from './logger.js';
import { getStripePaymentIntent as stripeImport } from './stripe.js';
const getStripePaymentIntent = process.env.STRIPE_SECRET_KEY ? stripeImport : undefined;

if (!getApps().length) initializeApp();

// combining into one callable function to reduce slow cold start preflight checks
export const firebaseFunctionDispatcher = onCall({ enforceAppCheck: false }, async (request) => {
  const hasToken = !!request.app?.token;
  const { action, data, metadata } = request.data;

  if (action !== 'caffeinate' && action !== 'logToPapertrail') {
    const email = metadata?.email;
    logger[hasToken ? 'info' : 'warn'](
      'AppCheck ' + (hasToken ? 'success' : 'fail') + (email ? `: ${email}` : ''),
      { ...metadata, action }
    );
  };

  try {
    switch(action) {
      case 'caffeinate': return { status: 'awake' };
      case 'getStripePaymentIntent': return await getStripePaymentIntent(data);
      case 'savePendingOrder': return await savePendingOrder(data);
      case 'saveFinalOrder': return await saveFinalOrder(data);
      case 'sendEmailConfirmations': return await sendEmailConfirmations(data);
      case 'logToPapertrail': return logToPapertrail(data); // fire-and-forget
      default: return { error: 'Invalid action' };
    }
  } catch (err) {
    logger.error(err, { action, data });
    throw new HttpsError(
      err.message === 'Invalid Amount' ? 'out-of-range' : 'internal',
      `An error occurred in ${action}`,
      { msg: err.message }
    );
  }
});

export { appendrecordtospreadsheet };
