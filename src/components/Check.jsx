import { useState } from 'react';
import { Typography, Button } from '@mui/material';
import { Loading } from 'components/layouts';
import { useOrder } from 'hooks/useOrder';
import { useOrderSaving } from 'hooks/useOrderSaving';
import { config } from 'config';
const { CHECK_ADDRESS, CHECK_TO, SANDBOX_MODE } = config;

export const Check = () => {
  const { processing, setCurrentPage, updateOrder, error } = useOrder();
  const { savePendingOrder, isSaving } = useOrderSaving();
  const [ready, setReady] = useState(SANDBOX_MODE);

  setTimeout(() => {
    setReady(true);
  }, 5000);

  const handleRegister = async () => {
    try {
      await savePendingOrder();
      updateOrder({ paymentId: 'check', charged: 0 });
      setCurrentPage('processing');
    } catch (error) {
      console.error('Error saving pending order:', error);
      return;
    }
  }

  return (
    <section>
      {error && <Typography color='error' sx={{ mb: 4 }}>Error: {error}</Typography>}
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
            {isSaving ? 'Saving...' : 'Register and agree to send a check'}
          </Button>
        </>
      }
    </section>
  );
};
