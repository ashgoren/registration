import { useEffect } from 'react';
import { Box } from '@mui/material';
import { StyledPaper } from 'components/Layout/SharedStyles';
import { useOrder, useOrderOperations } from 'components/OrderContext';
import Loading from 'components/Loading';
import Error from 'components/Error';
import config from 'config';
const { TECH_CONTACT } = config;

export default function Processing({ isPaymentComplete }) {
  const { paymentMethod, setCurrentPage, error, setError } = useOrder();
  const { saveFinalOrderToFirebase, sendReceipts } = useOrderOperations();

  useEffect(() => {
    if (!isPaymentComplete) return;

    const finalize = async () => {
      try {
        await saveFinalOrderToFirebase();
        sendReceipts(); // fire-and-forget
        setCurrentPage('confirmation');
      } catch (error) {
        setError(`Your payment was processed successfully. However, we encountered an error updating your registration. Please contact ${TECH_CONTACT}.`);
      }
    };

    finalize();
  }, [isPaymentComplete, setCurrentPage, setError, saveFinalOrderToFirebase, sendReceipts]);

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
}

const isElectronicPayment = (paymentMethod) => ['stripe', 'paypal'].includes(paymentMethod);
