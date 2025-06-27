import { logger } from 'firebase-functions/v2';
import { getOrderByPaymentId } from '../shared/orders.js';
import { sendMail } from '../shared/email.js';
import { PROJECT_ID } from '../shared/helpers.js';
import { createError, ErrorType } from '../shared/errorhandler.js';
import { getPayPalAccessToken, paypalApiUrl, useSandbox } from './auth.js'

// onRequest handler for PayPal webhooks
export const paypalWebhookHandler = async (req, res) => {
  logger.debug('Received PayPal webhook', { headers: req.headers, body: req.body });

  try {
    // Validate the webhook signature
    const isValid = await validateWebhookSignature(req);
    if (!isValid) {
      logger.warn('Invalid PayPal webhook signature', { headers: req.headers });
      return res.status(400).send('Invalid signature');
    }
  } catch (error) {
    logger.error('Error validating PayPal webhook signature', { error });
    return res.status(500).send('Internal Server Error');
  }

  const { event_type, resource } = req.body;
  const { id: paymentId, status } = resource || {};
  if (event_type !== 'PAYMENT.CAPTURE.COMPLETED' || status !== 'COMPLETED') {
    logger.info('Ignoring irrelevant webhook', { eventType: event_type });
    return res.status(200).send('Event ignored - not completed payment capture');
  }

  // Process the webhook event
  logger.info('Received webhook for PayPal payment capture', { paymentId, useSandbox });

  try {
    // Confirm this payment is already in db
    const order = await getOrderByPaymentId(paymentId, useSandbox);
    if (order) {
      logger.info('Found matching order in database', { paymentId, email: order.email });
    } else {
      logger.warn('Received PayPal payment capture for unrecognized payment ID', { paymentId });
      sendMail({
        to: process.env.EMAIL_NOTIFY_TO,
        subject: `${PROJECT_ID} - Unrecognized PayPal Payment Capture: ${paymentId}`,
        text: `Received PayPal payment capture for ID ${paymentId} but no matching record found in the database.`,
      });
    }
  } catch (error) {
    logger.error('Error processing PayPal webhook', { paymentId, error });
    return res.status(500).send('Internal Server Error');
  }

  res.status(200).send('Webhook received');
};

const validateWebhookSignature = async (req) => {
  const accessToken = await getPayPalAccessToken();
  if (!accessToken) {
    throw createError(ErrorType.PAYPAL_API, 'Failed to retrieve PayPal access token');
  }

  const response = await fetch(`${paypalApiUrl}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      auth_algo: req.headers['paypal-auth-algo'],
      cert_url: req.headers['paypal-cert-url'],
      transmission_id: req.headers['paypal-transmission-id'],
      transmission_sig: req.headers['paypal-transmission-sig'],
      transmission_time: req.headers['paypal-transmission-time'],
      webhook_id: process.env.PAYPAL_WEBHOOK_ID,
      webhook_event: req.body
    })
  });

  if (!response.ok) {
    logger.warn('Failed to verify PayPal webhook signature', { status: response.status, headers: req.headers });
    return false;
  }

  const data = await response.json();
  return data.verification_status === 'SUCCESS';
};
