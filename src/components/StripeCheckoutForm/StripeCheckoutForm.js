import { useOrder } from 'components/OrderContext';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Box, Button } from '@mui/material';
import config from 'config';
const { TECH_CONTACT } = config;

export default function StripeCheckoutForm({ processCheckout }) {
  const { processing, setProcessing, setError, paymentInfo } = useOrder();
  const stripe = useStripe();
  const elements = useElements();

  const confirmPayment = async ({ clientSecret }) => {
    let result;
    try {
      result = await stripe.confirmPayment({
        elements,
        clientSecret,
        redirect: "if_required",
        confirmParams: {
          return_url: "http://localhost:3000/error-contact-support", // not needed for cards or apple/google pay
        },
      });

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
      throw new PaymentError(error.message, 'PAYMENT_CONFIRM_ERROR');
    }

    const { paymentIntent, error } = result;
    if (error) {
      // e.g. card denied; this results in record left in pendingOrders db
      // tho could also be no such payment intent error
      throw new PaymentError(error.message, 'PAYMENT_PROCESS_ERROR');
    }

    return paymentIntent;
  };

  const processPayment = async () => {
    try {
      const { clientSecret } = paymentInfo;
      if (!clientSecret) throw new Error('Missing clientSecret for payment processing');
      const { id } = await confirmPayment({ clientSecret });
      return id;
    } catch (error) {
      console.error(error);
      const errorMessage = mapPaymentError(error);
      setError(errorMessage);
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

class PaymentError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

const mapPaymentError = (error) => {
  const errorMessages = {
    PAYMENT_AMOUNT_ERROR: `There was a problem initializing the payment: Amount out of range. Please contact ${TECH_CONTACT}.`,
    PAYMENT_INIT_ERROR: `There was a problem initializing the payment: ${error.message}. Please try again or contact ${TECH_CONTACT}.`,
    PAYMENT_PROCESS_ERROR: `There was a problem processing the payment: ${error.message}. Please verify your payment details and try again.`,
    PAYMENT_CONFIRM_ERROR: `There was a problem confirming the payment: ${error.message}. Please contact ${TECH_CONTACT}.`,
  };
  return errorMessages[error.code] || `Unexpected payment processing error: ${error.message}. Please contact ${TECH_CONTACT}.`;
}
