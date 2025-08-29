import { getStripe } from './auth.js';
import { logger } from 'firebase-functions/v2';
import { handlePaymentVerification } from '../shared/webhooks.js';
import { getConfig } from '../config.js';

// onRequest function to handle Stripe webhooks
export const stripeWebhookHandler = async (req, res) => {
  logger.debug('Received Stripe webhook', { headers: req.headers, body: req.body });
  
  const { STRIPE_WEBHOOK_SECRET, IS_SANDBOX } = getConfig();

  const sig = req.headers['stripe-signature'];
  let event;

  // Verify the webhook signature
  try {
    event = getStripe().webhooks.constructEvent(req.rawBody, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.error('Error verifying Stripe webhook signature', { error: err });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type !== 'payment_intent.succeeded') {
    logger.info(`Ignoring irrelevant webhook: ${event.type}`);
    return res.status(200).json({ received: true });
  }

  logger.info('Received webhook for Stripe payment_intent succeeded', { id: event.id, IS_SANDBOX });

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
