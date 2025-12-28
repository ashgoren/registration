import { logInfo, logError } from 'src/logger';
import type { Order } from '@registration/types';
import type { useElements, useStripe } from '@stripe/react-stripe-js';
import type { PaymentIntent, StripeError } from '@stripe/stripe-js';

interface UseStripePaymentParams {
  order: Order;
  stripe: ReturnType<typeof useStripe>;
  elements: ReturnType<typeof useElements>;
  clientSecret?: string | null;
}

export const useStripePayment = ({ order, stripe, elements, clientSecret }: UseStripePaymentParams) => {
  const { email } = order.people[0]; // for logging
  if (!clientSecret) {
    throw new Error('Missing client secret for Stripe payment processing');
  }

  const processPayment = async () => {
    logInfo('Capturing Stripe payment', { email, order });

    if (!stripe || !elements || !clientSecret) {
      logError('stripe, elements, or clientSecret missing', { email, stripe, elements, clientSecret });
      throw new Error('Stripe payment processing is not available');
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

      const { id: paymentId, amount } = paymentIntent as { id: string; amount: number };

      logInfo('Payment captured', { email, paymentId, amount: Number(amount) / 100 });
      return { paymentId, amount: Number(amount) / 100 };
    } catch (error) { // catch any error (from stripe or our validation) and just re-throw it
      logError('Error processing Stripe payment', { email, error });
      throw error;
    }
  };

  return { processPayment };
}


// ===== Helpers =====

const validatePaymentResponse = (paymentIntent?: PaymentIntent, error?: StripeError) => {
  if (error) { // just re-throw if is a Stripe error (e.g. card declined)
    throw error;
  }

  if (!paymentIntent) {
    throw new Error('Invalid response from Stripe.');
  }

  if (paymentIntent.status !== 'succeeded') {
    // e.g. paymentIntent.status === 'requires_action'
    // this should never trigger for cards or apple/google pay
    // may also try to redirect to return_url, which is not yet setup
    throw new Error(`Payment failed with an unexpected status: ${paymentIntent.status}`);
  }

  if (!paymentIntent.id || !paymentIntent.amount) {
    throw new Error('Payment confirmation from Stripe is missing an ID or amount.');
  }
};
