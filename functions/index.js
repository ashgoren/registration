import './initializeFirebase.js'; // Ensure Firebase is initialized before importing other modules
import { onCall, onRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { onMessagePublished } from 'firebase-functions/v2/pubsub';
import { handleFunctionError } from './shared/errorHandler.js';
import { deployOptions } from './config/internal/config.js';

// Functions called by firebaseFunctionDispatcher
import { logEvent } from './api/logEvent.js';
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

// Deploy-time options
const region = deployOptions.REGION;
const timeZone = deployOptions.TIMEZONE;
const secrets = deployOptions.DOPPLER_SECRETS;

// Combined into one callable function to reduce slow cold start preflight checks
const firebaseFunctionDispatcherHandler = async (request) => {
  const { action, data } = request.data;

  try {
    switch(action) {
      case 'initializePayment': return await initializePayment(
        data,
        getStripePaymentIntent,
        createOrUpdatePaypalOrder
      );
      case 'capturePaypalOrder': return await capturePaypalOrder(data);
      case 'savePendingOrder': return await savePendingOrder(data);
      case 'saveFinalOrder': return await saveFinalOrder(data);
      case 'logEvent': return logEvent(data); // fire-and-forget
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
  },
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
    topic: 'budget_alerts',
  },
];

const exports = {};

onCallFunctions.forEach(({ name, handler }) => {
  exports[name] = onCall({ region, secrets, timeoutSeconds: 300 }, handler);
});

onRequestFunctions.forEach(({ name, handler }) => {
  exports[name] = onRequest({ region, secrets }, handler);
});

onScheduleFunctions.forEach(({ name, handler, schedule }) => {
  exports[name] = onSchedule({ schedule, timeZone, region, secrets }, handler);
});

onDocumentUpdatedFunctions.forEach(({ name, handler, document }) => {
  exports[name] = onDocumentUpdated({ document, region, secrets }, handler);
});

onMessagePublishedFunctions.forEach(({ name, handler, topic }) => {
  exports[name] = onMessagePublished({ topic, region, secrets, maxInstances: 50 }, handler);
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
