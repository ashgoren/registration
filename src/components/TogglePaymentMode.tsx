import { Typography, Button } from '@mui/material';
import { useOrderPayment } from 'contexts/OrderPaymentContext';
import { useOrderFlow } from 'contexts/OrderFlowContext';
import { config } from 'config';

export const TogglePaymentMode = () => {
  const { paymentMethod, setPaymentMethod } = useOrderPayment();
  const { setError } = useOrderFlow();

  const togglePaymentMethod = () => {
    setError(null);
    setPaymentMethod(paymentMethod === 'check' ? config.payments.methods[0] : 'check');
  };

  if (!config.payments.methods.includes('check') || config.payments.methods.length < 2) {
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
