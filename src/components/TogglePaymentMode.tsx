import { Typography, Button } from '@mui/material';
import { useOrderPayment } from 'contexts/OrderPaymentContext';
import { useOrderFlow } from 'contexts/OrderFlowContext';
import { config } from 'config';
const { PAYMENT_METHODS } = config;

export const TogglePaymentMode = () => {
  const { paymentMethod, setPaymentMethod } = useOrderPayment();
  const { setError } = useOrderFlow();

  const togglePaymentMethod = () => {
    setError(null);
    setPaymentMethod(paymentMethod === 'check' ? PAYMENT_METHODS[0] : 'check');
  };

  if (!PAYMENT_METHODS.includes('check') || PAYMENT_METHODS.length < 2) {
    return null;
  }

  return (
    <Typography align='center'>
      <Button size='small' color='secondary' sx={{ my: 2 }} onClick={() => togglePaymentMethod()}>
        {paymentMethod === 'check' ? '(or view online payment options)' : '(or pay by check)'}
      </Button>
    </Typography>
  );
};
