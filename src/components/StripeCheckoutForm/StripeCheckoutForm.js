import { useOrder } from 'components/OrderContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {useStripe, useElements, PaymentElement} from '@stripe/react-stripe-js';
import { Box, Button } from '@mui/material';
import { fullName } from 'utils';
import config from 'config';
const { TECH_CONTACT } = config;
const functions = getFunctions();
const firebaseFunctionDispatcher = httpsCallable(functions, 'firebaseFunctionDispatcher');

export default function StripeCheckoutForm({ processCheckout, amount }) {
  const { order, processing, setProcessing, setError, paymentIntentId, setPaymentIntentId } = useOrder();
  const stripe = useStripe();
  const elements = useElements();

  const getPaymentIntent = async () => {
    try {
      const timer = new Date();
      const { data }  = await firebaseFunctionDispatcher({
        action: 'getStripePaymentIntent',
        data: {
          amount,
          name: fullName(order.people[0]),
          email: order.people[0].email,
          idempotencyKey: order.idempotencyKey,
          ...(paymentIntentId && { paymentIntentId })
        }
      });
      console.log('Stripe payment intent retrieved in', new Date() - timer, 'ms');

      if (!data) {
        throw new Error('No data returned');
      } else if (!data.paymentIntentId || !data.clientSecret) {
        throw new Error('Missing paymentIntentId and/or clientSecret');
      }

      setPaymentIntentId(data.paymentIntentId);
      return data.clientSecret;
    } catch (error) {
      throw new PaymentInitializationError(error.message);
    }
  };

  const confirmPayment = async ({ clientSecret }) => {
    let result;
    try {
      const timer = new Date();
      result = await stripe.confirmPayment({
        elements,
        clientSecret,
        redirect: "if_required",
        confirmParams: {
          return_url: "http://localhost:3000/error-contact-support", // not needed for cards or apple/google pay
        },
      });
      console.log('Stripe payment confirmed in', new Date() - timer, 'ms');

      if (!result) {
        throw new Error('No result returned');
      } else if (!result.error && !result.paymentIntent) {
        throw new Error('Invalid result returned');
      } else if (result.paymentIntent && result.paymentIntent.status !== 'succeeded') {
        // e.g. paymentIntent.status === 'requires_action'
        // this should never trigger for cards or apple/google pay
        // may also try to redirect to return_url, which is not yet setup
        throw new Error(`Payment failed with status: ${result.paymentIntent.status}`);
      }
    } catch (error) {
      throw new PaymentConfirmationError(error.message);
    }

    const { paymentIntent, error } = result;
    if (error) {
      // e.g. card denied; this results in record left in pendingOrders db
      // tho could also be no such payment intent error
      throw new PaymentProcessingError(error.message);
    }

    return paymentIntent;
  };

  const processPayment = async () => {
    try {
      const clientSecret = await getPaymentIntent();
      const paymentIntent = await confirmPayment({ clientSecret });
      return paymentIntent.id;
    } catch (error) {
      console.error(error);
      switch(error.name) {
        case 'PaymentInitializationError':
          if (error.message === 'Unauthenticated') {
            setError(`There was a problem initializing the payment. Please try again or contact ${TECH_CONTACT}. If resubmitting fails, try closing the browser tab and starting over.`);
          } else {
            setError(`There was a problem initializing the payment: ${error.message}. Please try again or contact ${TECH_CONTACT}.`);
          }
          break;
        case 'PaymentProcessingError':
          setError(`There was a problem processing the payment: ${error.message}. Please verify your payment details and try again.`);
          break;
        case 'PaymentConfirmationError':
          setError(`There was a problem confirming the payment: ${error.message}. Please contact ${TECH_CONTACT}.`);
          break;
        default:
          setError(`Unexpected payment processing error: ${error.message}. Please contact ${TECH_CONTACT}.`);
      }
      setProcessing(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) {
      setError(`Stripe payment processing is not available. Please try again or contact ${TECH_CONTACT} with this error message.`);
      return;
    }
    setError(null);
    setProcessing(true);
    const {error: submitError} = await elements.submit();
    if (submitError) {
      setProcessing(false); // PaymentElement automatically shows error messages
    } else {
      processCheckout({ paymentProcessorFn: processPayment });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ visibility: processing ? 'hidden' : 'visible', height: processing ? 0 : 'auto' }}>
        <PaymentElement />
        <Button type='submit' variant='contained' color='success' disabled={!stripe || processing} sx={{ my: 2 }}>Register and submit payment</Button>
      </Box>
    </form>
  );
}

class PaymentInitializationError extends Error {
  constructor(message) {
    super(message);
    this.name = "PaymentInitializationError";
  }
}

class PaymentProcessingError extends Error {
  constructor(message) {
    super(message);
    this.name = "PaymentProcessingError";
  }
}

class PaymentConfirmationError extends Error {
  constructor(message) {
    super(message);
    this.name = "PaymentConfirmationError";
  }
}
