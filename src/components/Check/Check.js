import { useState } from 'react';
import { useOrder } from 'components/OrderContext';
import { Typography, Button } from '@mui/material';
import Loading from 'components/Loading';
import config from 'config';
const { CHECK_ADDRESS, CHECK_TO, SANDBOX_MODE } = config;

export default function Check({ processCheckout }) {
  const { processing } = useOrder();
  const [ready, setReady] = useState(SANDBOX_MODE);

  setTimeout(() => {
    setReady(true);
  }, 5000);

  const processPayment = () => {
    return { id: 'check', amount: 0 };
  };

  const handleRegister = async () => {
    processCheckout({ paymentProcessorFn: processPayment });
  }

  return (
    <section>
      {!processing &&
        <>
          <Typography sx={{ mt: 2 }}>
            Make your check out to {CHECK_TO}<br />
            Write your name in the memo area, and mail to:
          </Typography>
          <Typography sx={{ mt: 2 }}>
            {CHECK_ADDRESS }
          </Typography>

          {!ready && <Loading />}
          <Button variant='contained' color='success' disabled={!ready} onClick={handleRegister} sx={{ mt: 4, mb: 2 }}>
            Register and agree to send a check
          </Button>
        </>
      }
    </section>
  );
}
