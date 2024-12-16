import {Elements} from '@stripe/react-stripe-js';
import {loadStripe} from '@stripe/stripe-js';
import StripeCheckoutForm from 'components/StripeCheckoutForm';
import { Box } from '@mui/material';
import config from 'config';
const { SANDBOX_MODE, PAYMENT_METHODS } = config;
const stripePromise = PAYMENT_METHODS.includes('stripe') ? loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY) : null;

export default function StripeCheckoutWrapper({ total, processCheckout }) {
  const options = {
    mode: 'payment',
    currency: 'usd',
    amount: total * 100
  };

  return (
    <>
      {SANDBOX_MODE &&
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '3rem', my: 2, backgroundColor: 'var(--color-error)' }}>
          Testing: 4242424242424242 / any future expiration / any cvc / any zip
        </Box>
      }

      <Elements stripe={stripePromise} options={options}>
        <StripeCheckoutForm processCheckout={processCheckout} />
      </Elements>
    </>
  );
}
