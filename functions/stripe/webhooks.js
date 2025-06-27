import { stripe } from './auth.js';
import { logger } from 'firebase-functions/v2';
import { getOrderByPaymentId } from '../shared/orders.js';
import { sendMail } from '../shared/email.js';
import { PROJECT_ID, IS_SANDBOX } from '../helpers.js';
const { STRIPE_WEBHOOK_SECRET } = process.env;

// onRequest function to handle Stripe webhooks
export const stripeWebhookHandler = async (req, res) => {
  logger.debug('Received Stripe webhook', { headers: req.headers, body: req.body });

  const sig = req.headers['stripe-signature'];
  let event;

  // Verify the webhook signature
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, STRIPE_WEBHOOK_SECRET);
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

  logger.info('PaymentIntent was successful!', { paymentIntent });

  // Confirm this payment is already in db
  try {
    const order = await getOrderByPaymentId(paymentId, IS_SANDBOX);
    if (order) {
      logger.info('Found matching order in database', { paymentId, email: order.email });
    } else {
      logger.warn('Received Stripe payment capture for unrecognized payment ID', { paymentId });
      sendMail({
        to: process.env.EMAIL_NOTIFY_TO,
        subject: `${PROJECT_ID} - Unrecognized Stripe Payment Capture: ${paymentId}`,
        text: `Received Stripe payment capture for ID ${paymentId} but no matching record found in the database.`,
      });
    }
  } catch (error) {
    logger.error('Error processing Stripe webhook', { paymentId, error });
    return res.status(500).send('Internal Server Error');
  }

  res.json({ received: true });
};
