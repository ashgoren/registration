import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Box, Button } from '@mui/material';
import { TestCardBox } from 'components/layouts/SharedStyles';
import { useOrderData } from 'contexts/OrderDataContext';
import { useOrderPayment } from 'contexts/OrderPaymentContext';
import { useOrderFlow } from 'contexts/OrderFlowContext';
import { useOrderSaving } from 'hooks/useOrderSaving';
import { useStripePayment } from 'hooks/useStripePayment';
import { config } from 'config';
const { SANDBOX_MODE, PAYMENT_METHODS, TECH_CONTACT } = config;
const { VITE_STRIPE_PUBLISHABLE_KEY } = import.meta.env;

const stripePromise = PAYMENT_METHODS.includes('stripe') ? loadStripe(VITE_STRIPE_PUBLISHABLE_KEY) : null;

// this wrapper is required to use the Stripe Elements component
export const StripeCheckout = ({ total }) => {
  const options = { mode: 'payment', currency: 'usd', amount: Math.round(total * 100) };
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
  const { order, updateOrder } = useOrderData();
  const { electronicPaymentDetails: { clientSecret} } = useOrderPayment();
  const { setCurrentPage, processing, setProcessing, setError } = useOrderFlow();
  const { savePendingOrder } = useOrderSaving();
  const { processPayment } = useStripePayment({ order, stripe, elements, clientSecret });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setProcessing(true);

    const {error: submitError} = await elements.submit();

    // Early return if error automatically handled by PaymentElement
    if (submitError) {
      setProcessing(false); // PaymentElement automatically shows error messages
      return;
    }

		// Step 1: save pending order
		try {
			await savePendingOrder();
		} catch (error) { // instance of HttpsError from backend or other error from savePendingOrder
			setError(
				<>
					We're sorry, but we experienced an issue saving your order.<br />
					You were not charged.<br />
					Please try again or contact {TECH_CONTACT} for assistance.<br />
					Error: {error.message || error}
				</>
			);
			setProcessing(false);
			return ; // exit early if pending order save fails
		}

    // Step 2: process payment (only reaches here if pending order saved successfully)
    try {
      const { paymentId, amount } = await processPayment();
      updateOrder({ paymentId, charged: amount });
      setCurrentPage('processing');
		} catch (error) { // instance of HttpsError from backend or other error from processPayment
			setError(
				<>
					We're sorry, but we experienced an issue processing your payment.<br />
					Please try again or contact {TECH_CONTACT} for assistance.<br />
					Error: {error.message || error}
				</>
			);
      setProcessing(false);
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
