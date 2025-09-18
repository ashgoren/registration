import { getStripe } from './auth.js';
import { logger } from 'firebase-functions/v2';
import { handlePaymentVerification } from '../shared/webhooks.js';
import { getConfig } from '../config/internal/config.js';

// onRequest function to handle Stripe webhooks
export const stripeWebhookHandler = async (req, res) => {
  logger.debug('Received Stripe webhook', { headers: req.headers, body: req.body });
  
  const { STRIPE_WEBHOOK_SECRET, ENV, PAYMENT_DESCRIPTION } = getConfig();

  const sig = req.headers['stripe-signature'];
  let event;

  // Validate the webhook signature
  try {
    event = getStripe().webhooks.constructEvent(req.rawBody, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.error('Error validating Stripe webhook signature', { error: err });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Only process payment_intent.succeeded events with matching description
  if (event.type !== 'payment_intent.succeeded') {
    logger.info(`Webhook ignored: type != payment_intent.succeeded: ${event.type}`);
    return res.status(200).json({ received: true });
  }
  if (!event.data?.object?.description) {
    logger.error('No description found in Stripe webhook event data', { event });
    return res.status(500).send('No description in webhook');
  }
  if (event.data?.object?.description !== PAYMENT_DESCRIPTION) {
    logger.info(`Webhook ignored: description (${event.data?.object?.description}) != ${PAYMENT_DESCRIPTION}`);
    return res.status(200).json({ received: true });
  }

  // Process the webhook event
  logger.info(`Received ${ENV} webhook for Stripe payment_intent succeeded`, { id: event.id, ENV });
  const paymentIntent = event.data.object;
  const paymentId = paymentIntent.id;

  // Check if the payment is in the DB
  try {
    await handlePaymentVerification(paymentId);
    res.json({ received: true });
  } catch (error) { // database errors
    logger.error('Error processing Stripe webhook', { paymentId, error });
    res.status(500).send('Internal Server Error');
  }
};
