import { useOrder } from 'hooks/useOrder';
import { Typography, Button } from '@mui/material';
import config from 'config';
const { PAYMENT_METHODS } = config;

const switchToCheckText = '(or pay by check)';
const switchToElectronicText = '(or view online payment options)';

export default function TogglePaymentMode() {
  const { paymentMethod, setPaymentMethod, setError } = useOrder();
  const text = paymentMethod === 'check' ? switchToElectronicText : switchToCheckText;
  const togglePaymentMethod = () => {
    setError(null);
    setPaymentMethod(paymentMethod === 'check' ? PAYMENT_METHODS[0] : 'check');
  };

  return (
    <>
      {PAYMENT_METHODS.includes('check') &&
        <Typography align='center'>
          <Button size='small' color='secondary' sx={{ my: 2 }} onClick={() => togglePaymentMethod()}>
            {text}
          </Button>
        </Typography>
      }
    </>
  );
}
