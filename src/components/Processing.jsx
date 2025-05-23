import { useEffect } from 'react';
import { Box } from '@mui/material';
import { Loading, Error } from 'components/layouts';
import { StyledPaper } from 'components/layouts/SharedStyles';
import { useOrder } from 'hooks/useOrder';
import { useOrderFinalization } from 'hooks/useOrderFinalization';
import { config } from 'config';
const { TECH_CONTACT } = config;

export const Processing = ({ isPaymentComplete }) => {
  const { paymentMethod, setCurrentPage, error, setError } = useOrder();
  const { finalizeOrder } = useOrderFinalization();

  useEffect(() => {
    if (!isPaymentComplete) return;

    const finalize = async () => {
      try {
        await finalizeOrder();
        setCurrentPage('confirmation');
      } catch (error) {
        setError(`Your payment was processed successfully. However, we encountered an error updating your registration. Please contact ${TECH_CONTACT}.`);
      }
    };

    finalize();
  }, [isPaymentComplete, finalizeOrder, setCurrentPage, setError]);

  return (
    <StyledPaper align='center'>
      {error && <Box sx={{ mb: 4 }}><Error /></Box>}
      {!isPaymentComplete &&
        <Loading processing={true} text='Saving payment details...' />
      }
      {isPaymentComplete &&
        <Loading
          processing={true}
          text={isElectronicPayment(paymentMethod) ? 'Payment successful. Updating registration...' : 'Updating registration...'}
        />
      }
    </StyledPaper>
  );
};

const isElectronicPayment = (paymentMethod) => ['stripe', 'paypal'].includes(paymentMethod);
