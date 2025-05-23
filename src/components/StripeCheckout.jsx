import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Box, Button } from '@mui/material';
import { TestCardBox } from 'components/layouts/SharedStyles';
import { useOrder } from 'hooks/useOrder';
import { useOrderSaving, OrderSavingError } from 'hooks/useOrderSaving';
import { useStripePayment } from 'hooks/useStripePayment';
import { config } from 'config';
const { SANDBOX_MODE, PAYMENT_METHODS, TECH_CONTACT } = config;
const { VITE_STRIPE_PUBLISHABLE_KEY_SANDBOX, VITE_STRIPE_PUBLISHABLE_KEY_LIVE, VITE_USE_FIREBASE_EMULATOR, MODE} = import.meta.env;

const IS_EMULATOR = VITE_USE_FIREBASE_EMULATOR === 'true' && MODE === 'development';
const stripePublishableKey = SANDBOX_MODE || IS_EMULATOR ? VITE_STRIPE_PUBLISHABLE_KEY_SANDBOX : VITE_STRIPE_PUBLISHABLE_KEY_LIVE;

const stripePromise = PAYMENT_METHODS.includes('stripe') ? loadStripe(stripePublishableKey) : null;

// this wrapper is required to use the Stripe Elements component
export const StripeCheckout = ({ total }) => {
  const options = { mode: 'payment', currency: 'usd', amount: total * 100 };
  return (
    <>
      {SANDBOX_MODE && <TestCardBox number='4242424242424242' />}
      <Elements stripe={stripePromise} options={options}>
        <StripeCheckoutForm />
      </Elements>
    </>
  );
};

function StripeCheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const { order, updateOrder, setCurrentPage, processing, setProcessing, setError, electronicPaymentDetails: { clientSecret} } = useOrder();
  const { savePendingOrder } = useOrderSaving();
  const { processPayment } = useStripePayment({ order, stripe, elements, clientSecret });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setProcessing(true);
    const {error: submitError} = await elements.submit();
    if (submitError) {
      setProcessing(false); // PaymentElement automatically shows error messages
    } else {
      try {
        await savePendingOrder(); // if fails to save, throws and sets error
  
        // only reaches here if pending order saved successfully
        const { id, amount } = await processPayment();

        updateOrder({ paymentId: id, charged: amount });
        setCurrentPage('processing');
      } catch (error) {
        // UI error already set for OrderSavingError
        if (!(error instanceof OrderSavingError)) {
          const errorMessage = mapPaymentError(error);
          setError(errorMessage);
        }
        setProcessing(false);
      }
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

const mapPaymentError = (error) => {
  const errorMessages = {
    PAYMENT_AMOUNT_ERROR: `There was a problem initializing the payment: Amount out of range. Please contact ${TECH_CONTACT}.`,
    PAYMENT_INIT_ERROR: `There was a problem initializing the payment: ${error.message}. Please try again or contact ${TECH_CONTACT}.`,
    PAYMENT_PROCESS_ERROR: `There was a problem processing the payment: ${error.message}. Please verify your payment details and try again.`,
    PAYMENT_CONFIRM_ERROR: `There was a problem confirming the payment: ${error.message}. Please contact ${TECH_CONTACT}.`,
  };
  return errorMessages[error.code] || `Unexpected payment processing error: ${error.message}. Please contact ${TECH_CONTACT}.`;
}
