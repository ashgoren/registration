import { logger } from 'firebase-functions/v2';
import { handlePaymentVerification } from '../shared/webhooks.js';
import { getPayPalAccessToken, getPaypalApiUrl } from './auth.js'
import { getConfig } from '../config/internal/config.js';
import type { Request } from 'firebase-functions/v2/https';
import type { Response } from 'express';

// onRequest handler for PayPal webhooks
export const paypalWebhookHandler = async (req: Request, res: Response) => {
  logger.debug('Received PayPal webhook', { headers: req.headers, body: req.body });

  const { ENV, PAYMENT_DESCRIPTION } = getConfig();

  const accessToken = await getPayPalAccessToken();
  const paypalApiUrl = getPaypalApiUrl();

  try {
    // Validate the webhook signature
    const isValid = await validateWebhookSignature(req, accessToken, paypalApiUrl);
    if (!isValid) {
      logger.warn('Invalid PayPal webhook signature', { headers: req.headers });
      return res.status(400).send('Invalid signature');
    }
  } catch (error) {
    logger.error('Error validating PayPal webhook signature', { error });
    return res.status(500).send('Internal Server Error');
  }

  // Parse webhook payload
  const { event_type, resource } = req.body;
  const { id: paymentId, status, supplementary_data } = resource || {};

  // Only process completed payment captures with matching description
  if (event_type !== 'PAYMENT.CAPTURE.COMPLETED' || status !== 'COMPLETED') {
    logger.info('Ignoring irrelevant webhook', { eventType: event_type });
    return res.status(200).json({ received: true });
  }
  const orderId = supplementary_data?.related_ids?.order_id;
  if (!orderId) {
    logger.error('No order ID found in PayPal webhook resource', { resource, ENV });
    return res.status(500).send('No order ID in webhook');
  }
  const order = await getOrder(orderId, accessToken, paypalApiUrl);
  const description = order?.purchase_units?.[0]?.description;
  if (!order) {
    logger.error('Failed to retrieve PayPal order', { orderId });
    return res.status(500).send('Failed to retrieve order');
  }
  if (!description) {
    logger.error('No description found in PayPal order', { order, orderId });
    return res.status(500).send('No description in order');
  }
  if (description !== PAYMENT_DESCRIPTION) {
    logger.info(`Webhook ignored: description (${description}) != ${PAYMENT_DESCRIPTION}`);
    return res.status(200).json({ received: true });
  }

  // Process the webhook event
  logger.info(`Received ${ENV} webhook for PayPal payment capture`, { paymentId, ENV });

  // Check if the payment is in the DB
  try {
    await handlePaymentVerification(paymentId);
    return res.status(200).send('Webhook received');
  } catch (error) {
    logger.error('Error processing PayPal webhook', { paymentId, error });
    return res.status(500).send('Internal Server Error');
  }
};

const validateWebhookSignature = async (req: Request, accessToken: string, paypalApiUrl: string) => {
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
      webhook_id: getConfig().PAYPAL_WEBHOOK_ID,
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

const getOrder = async (orderId: string, accessToken: string, paypalApiUrl: string) => {
  const response = await fetch(`${paypalApiUrl}/v2/checkout/orders/${orderId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    }
  });

  if (!response.ok) {
    logger.warn('Failed to retrieve PayPal order', { status: response.status, orderId });
    return null;
  }

  return await response.json();
};
