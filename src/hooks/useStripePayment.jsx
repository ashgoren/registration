import { log, logError } from 'src/logger';

export const useStripePayment = ({ order, stripe, elements, clientSecret }) => {
  const { email } = order.people[0]; // for logging

  const processPayment = async () => {
    log('Capturing Stripe payment', { email, order });
    if (!stripe || !elements || !clientSecret) {
      logError('stripe, elements, or clientSecret missing', { email, stripe, elements, clientSecret });
      throw new PaymentError('Stripe payment processing is not available', 'PAYMENT_INIT_ERROR');
    }
    try {
      const { paymentIntent, error} = await stripe.confirmPayment({
        elements,
        clientSecret,
        redirect: "if_required",
        confirmParams: {
          return_url: "http://localhost:3000/error-contact-support", // not needed for cards or apple/google pay
        },
      });

      validatePaymentResponse(paymentIntent, error);

      const { id, amount } = paymentIntent;

      log('Payment captured', { email, paymentId: id, amount: Number(amount) / 100 });
      return { id, amount: Number(amount) / 100}; // amount comes back from stripe in cents
    } catch (error) {
      throw new PaymentError(error.message, 'PAYMENT_CONFIRM_ERROR');
    }
  };

  return { processPayment };
}


// ===== Helpers =====

class PaymentError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

const validatePaymentResponse = (paymentIntent, error) => {
  if (!paymentIntent && !error) throw new Error('Invalid result returned');

  if (error) {
    // e.g. card denied; this results in record left in pendingOrders db
    // tho could also be no such payment intent error
    throw new PaymentError(error.message, 'PAYMENT_PROCESS_ERROR');
  }

  if (paymentIntent.status !== 'succeeded') {
    // e.g. paymentIntent.status === 'requires_action'
    // this should never trigger for cards or apple/google pay
    // may also try to redirect to return_url, which is not yet setup
    throw new Error(`Payment failed with status: ${paymentIntent.status}`);
  }

  if (!paymentIntent.id || !paymentIntent.amount) {
    throw new Error('Missing payment ID or amount');
  }
};
