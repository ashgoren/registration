import { useState } from 'react';
import { useOrder } from 'hooks/useOrder';
import { Typography, Button } from '@mui/material';
import { Loading } from 'components/Layout/Loading';
import { config } from 'config';
const { CHECK_ADDRESS, CHECK_TO, SANDBOX_MODE } = config;

export const Check = () => {
  const { processing, setCurrentPage, updateOrder } = useOrder();
  const [ready, setReady] = useState(SANDBOX_MODE);

  setTimeout(() => {
    setReady(true);
  }, 5000);

  const handleRegister = async () => {
    updateOrder({ paymentId: 'check', charged: 0 });
    setCurrentPage('processing');
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
};
