import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Box, Button } from '@mui/material';
import { TestCardBox } from 'components/layouts/SharedStyles';
import { useOrderData } from 'contexts/OrderDataContext';
import { useOrderPayment } from 'contexts/OrderPaymentContext';
import { useOrderFlow } from 'contexts/OrderFlowContext';
import { useOrderSaving } from 'hooks/useOrderSaving';
import { useStripePayment } from 'hooks/useStripePayment';
import { useOrderFinalization } from 'hooks/useOrderFinalization';
import { usePageNavigation } from 'hooks/usePageNavigation';
import { logDebug } from 'src/logger';
import { config } from 'config';
import type { FormEvent } from 'react';
import type { StripeElementsOptions } from '@stripe/stripe-js';

const { VITE_STRIPE_PUBLISHABLE_KEY } = import.meta.env;

const stripePromise = config.payments.processor === 'stripe' ? loadStripe(VITE_STRIPE_PUBLISHABLE_KEY) : null;

// this wrapper is required to use the Stripe Elements component
export const StripeCheckout = ({ total }: { total: number }) => {
  const options: StripeElementsOptions = { mode: 'payment', currency: 'usd', amount: Math.round(total * 100) };
  return (
    <>
      {config.sandboxMode && <TestCardBox number={4242424242424242} />}
      <Elements stripe={stripePromise} options={options}>
        <StripeCheckoutForm total={total} />
      </Elements>
    </>
  );
};

function StripeCheckoutForm({ total }: { total: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const { order, updateOrder } = useOrderData();
  const { electronicPaymentDetails: { clientSecret} } = useOrderPayment();
  const { processing, setProcessing, setError } = useOrderFlow();
  const { savePendingOrder } = useOrderSaving();
  const { processPayment } = useStripePayment({ order, stripe, elements, clientSecret });
  const { finalizeOrder } = useOrderFinalization();
  const { goNext } = usePageNavigation();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setProcessing(true);

    if (!elements) {
      throw new Error('Stripe has not loaded properly. Please refresh the page and try again.');
    }
    const {error: submitError} = await elements.submit();

    // Early return if error automatically handled by PaymentElement
    if (submitError) {
      setProcessing(false); // PaymentElement automatically shows error messages
      return;
    }

		// Step 1: save pending order
    let orderId: string;
		try {
			orderId = await savePendingOrder();
      if (!orderId) {
        throw new Error('Failed to obtain orderId after saving pending order.');
      }
      logDebug('Pending order saved successfully');
		} catch (error: unknown) { // instance of HttpsError from backend or other error from savePendingOrder
      const { code, message } = error as { code?: string; message?: string };
			setError(
				<>
					We're sorry, but we experienced an issue saving your order.<br />
					You were not charged.<br />
					Please try again or contact {config.contacts.tech} for assistance.<br />
          Error: {code} {message || error}
				</>
			);
			setProcessing(false);
			return; // exit early if pending order save fails
		}

    // Step 2: process payment (only reaches here if pending order saved successfully)
    let paymentId: string;
    let charged: number;
    try {
      ({ paymentId, amount: charged } = await processPayment());
      updateOrder({ paymentId, charged });
      logDebug('Payment processed successfully');
		} catch (error: unknown) { // instance of HttpsError from backend or other error from processPayment
      const { code, message } = error as { code?: string; message?: string };
			setError(
				<>
					We're sorry, but we experienced an issue processing your payment.<br />
					Please try again or contact {config.contacts.tech} for assistance.<br />
					Error: {code} {message || error}
				</>
			);
      setProcessing(false);
      return; // exit early if payment processing fails
    }

    // Step 3: Save final order
    try {
      await finalizeOrder({ orderId, paymentId, charged });
      logDebug('Final order saved successfully');
      goNext();
    } catch (error: unknown) { // instance of HttpsError from backend or other error from finalizeOrder
      const { code, message } = error as { code?: string; message?: string };
      setError(
        <>
          Your payment was processed successfully. However, we encountered an error updating your registration. Please contact {config.contacts.tech}.
          <br />
          Error: {code} {message || error}
        </>
      );
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ visibility: processing ? 'hidden' : 'visible', height: processing ? 0 : 'auto' }}>
        <PaymentElement />
        <Button type='submit' variant='contained' color='success' disabled={!stripe || processing} sx={{ my: 2 }}>Register and submit payment (${total}) </Button>
      </Box>
    </form>
  );
}
