import './initializeFirebase.js'; // Ensure Firebase is initialized before importing other modules
import { onCall, onRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { onMessagePublished } from 'firebase-functions/v2/pubsub';
import { handleFunctionError } from './shared/errorHandler.js';
import { logTokenStatus } from './shared/helpers.js';

// Functions called by firebaseFunctionDispatcher
import { logToPapertrail } from './api/logToPapertrail.js';
import { initializePayment } from './api/initializePayment.js';
import { savePendingOrder, saveFinalOrder } from './api/database.js';
import { createOrUpdatePaypalOrder, capturePaypalOrder } from './paypal/index.js';
import { getStripePaymentIntent } from './stripe/index.js';

// Firebase functions, wrapped in onCall/onRequest/onSchedule/onDocumentUpdated/onMessagePublished
import { stripeWebhookHandler } from './stripe/index.js';
import { paypalWebhookHandler } from './paypal/index.js';
import { appendRecordToSpreadsheetHandler } from './automations/google-sheet-sync.js';
import { sendEmailConfirmationsHandler } from './automations/email-confirmation.js';
import { missingFromSpreadsheetHandler, duplicateEmailsInSpreadsheetHandler } from './scheduled/validateSpreadsheet.js';
import { emailIncompleteOrdersHandler } from './scheduled/incomplete.js';
import { matchPaymentsHandler, matchPaymentsOnDemandHandler } from './scheduled/matchPayments.js';
import { disableProjectAPIsHandler } from './automations/budget-cutoff.js';


// Configuration constants (here because .env file is not yet loaded)
const region = 'us-west1'; // also set in .env on client-side
const timeZone = 'America/Los_Angeles';
const enforceAppCheck = process.env.ENFORCE_APPCHECK === 'true'; // also set in .env on client-side

// Combined into one callable function to reduce slow cold start preflight checks
const firebaseFunctionDispatcherHandler = async (request) => {
  const hasToken = !!request.app?.token;
  const { action, data, metadata } = request.data;

  if (enforceAppCheck) logTokenStatus(hasToken, action, metadata);

  try {
    switch(action) {
      case 'getAppCheckToken': return { token: request.app?.token };
      case 'caffeinate': return { status: 'awake' };
      case 'initializePayment': return await initializePayment(
        data,
        getStripePaymentIntent,
        createOrUpdatePaypalOrder
      );
      case 'capturePaypalOrder': return await capturePaypalOrder(data);
      case 'savePendingOrder': return await savePendingOrder(data);
      case 'saveFinalOrder': return await saveFinalOrder(data);
      case 'logToPapertrail': return logToPapertrail(data); // fire-and-forget
      default: return { error: 'Invalid action' };
    }
  } catch (err) {
    handleFunctionError(err, action, data);
  }
};


const onCallFunctions = [
  {
    name: 'firebaseFunctionDispatcher',
    handler: firebaseFunctionDispatcherHandler,
  }
];

const onRequestFunctions = [
  {
    name: 'paypalWebhook',
    handler: paypalWebhookHandler // paypal/webhooks.js
  },
  {
    name: 'stripeWebhook',
    handler: stripeWebhookHandler // stripe/webhooks.js
  },
  {
    name: 'matchPaymentsOnDemand',
    handler: matchPaymentsOnDemandHandler, // matchPayments.js
  }
];

const onScheduleFunctions = [
  {
    name: 'emailIncompleteOrders',
    handler: emailIncompleteOrdersHandler, // incomplete.js
    schedule: 'every day 02:00',
  },
  {
    name: 'missingFromSpreadsheet',
    handler: missingFromSpreadsheetHandler, // validateSpreadsheet.js
    schedule: 'every day 02:01',
  },
  {
    name: 'duplicateEmailsInSpreadsheet',
    handler: duplicateEmailsInSpreadsheetHandler, // validateSpreadsheet.js
    schedule: 'every day 02:02',
  },
  {
    name: 'matchPayments',
    handler: matchPaymentsHandler, // matchPayments.js
    schedule: 'every day 02:03',
  },
];

const onDocumentUpdatedFunctions = [
  {
    name: 'appendRecordToSpreadsheet',
    handler: appendRecordToSpreadsheetHandler, // google-sheet-sync.js
    document: 'orders/{ITEM}',
  },
  {
    name: 'sendEmailConfirmations',
    handler: sendEmailConfirmationsHandler, // email-confirmation.js
    document: 'orders/{ITEM}',
  },
];

const onMessagePublishedFunctions = [
  {
    name: 'disableProjectAPIs',
    handler: disableProjectAPIsHandler, // budget-cutoff.js
    topic: 'budget-cutoff',
  },
];

const exports = {};

onCallFunctions.forEach(({ name, handler }) => {
  exports[name] = onCall({ enforceAppCheck, region }, handler);
});

onRequestFunctions.forEach(({ name, handler }) => {
  exports[name] = onRequest({ region }, handler);
});

onScheduleFunctions.forEach(({ name, handler, schedule }) => {
  exports[name] = onSchedule({ schedule, timeZone, region }, handler);
});

onDocumentUpdatedFunctions.forEach(({ name, handler, document }) => {
  exports[name] = onDocumentUpdated({ document, region }, handler);
});

onMessagePublishedFunctions.forEach(({ name, handler, topic }) => {
  exports[name] = onMessagePublished({ topic, region }, handler);
});

export const {
  firebaseFunctionDispatcher,
  appendRecordToSpreadsheet,
  sendEmailConfirmations,
  missingFromSpreadsheet,
  duplicateEmailsInSpreadsheet,
  emailIncompleteOrders,
  matchPayments,
  matchPaymentsOnDemand,
  disableProjectAPIs,
  paypalWebhook,
  stripeWebhook
} = exports;