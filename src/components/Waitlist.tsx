import { useEffect, useState } from 'react';
import { Box, Typography, Button, Checkbox, FormControlLabel } from '@mui/material';
import { NavButtons, Loading, Error } from 'components/layouts';
import { StyledPaper, Paragraph } from 'components/layouts/SharedStyles';
import { useWarnBeforeUnload } from 'hooks/useWarnBeforeUnload';
import { useOrderData } from 'contexts/OrderDataContext';
import { useOrderFlow } from 'contexts/OrderFlowContext';
import { useOrderSaving } from 'hooks/useOrderSaving';
import { useOrderFinalization } from 'hooks/useOrderFinalization';
import { OrderSummary } from 'components/OrderSummary';
import { logDebug, logErrorDebug } from 'src/logger';
import { config } from 'config';
const { ENV, TECH_CONTACT } = config;

export const Waitlist = ({ handleClickBackButton }: {
  handleClickBackButton: () => void
}) => {
  const { order, updateOrder } = useOrderData();
  const { error, setError, processing, setProcessing, processingMessage, setProcessingMessage } = useOrderFlow();
  const { savePendingOrder, isSaving } = useOrderSaving();
  const { finalizeOrder } = useOrderFinalization();
  const [ready, setReady] = useState(ENV === 'dev');
  const [confirmed, setConfirmed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useWarnBeforeUnload(!submitted);

  setTimeout(() => {
    setReady(true);
  }, 5000);

  // useEffect rather than directly calling finalizeOrder to ensure order.paymentId has finished updating
  useEffect(() => {
    if (order.paymentId !== 'waitlist') return;

    const finalize = async () => {
      logDebug('FINALIZE WAITLIST');
      try {
        await finalizeOrder();
        setProcessing(false);
        setSubmitted(true);
      } catch {
        setError(`Error adding to waitlist. Please try again or contact ${TECH_CONTACT}.`);
        setProcessing(false);
      }
    };

    finalize();
  }, [order.paymentId, finalizeOrder, setError, setProcessing, setSubmitted]);

  const processWaitlist = async () => {
    setError(null);
    setProcessing(true);
    setProcessingMessage('Adding to waitlist...');
    try {
      await savePendingOrder();
      updateOrder({ paymentId: 'waitlist', charged: 0 });
    } catch (error: unknown) { // instance of HttpsError from backend or other error
      logErrorDebug('Error saving pending order:', error);
      setError(
				<>
					We're sorry, but we experienced an issue saving your order.<br />
					Please try again or contact {TECH_CONTACT} for assistance.<br />
					Error: {(error as Error).message || error}
				</>
      );
      setProcessing(false);
    }
  };

  return (
    <>
      <StyledPaper>

        <Typography variant='h4' align='center' mt={1} mb={3}>
          {submitted ? 'Success!' : 'Waitlist Sign-up'}
        </Typography>

        <OrderSummary order={order} />

        {!ready && <Loading text='Please wait...' />}

        {processing && <Loading processing={true} text={processingMessage} />}

        {error && <Box sx={{ mb: 4 }}><Error /></Box>}

        {ready && !submitted && !processing &&
          <>

            {!confirmed &&
              <Paragraph sx={{ my: 4 }}>
                <FormControlLabel
                  label="I understand that I am signing up for the waitlist and that I will be notified if a spot becomes available."
                  control={<Checkbox
                    onChange={() => setConfirmed(!confirmed)}
                    name="confirm"
                    color="primary"
                  />}
                />
              </Paragraph>
            }

            {confirmed &&
              <Box sx={{ textAlign: 'center', my: 4 }}>
                <Button variant='contained' color='secondary' onClick={processWaitlist}>
                  {isSaving ? 'Saving...' : 'Sign up for waitlist'}
                </Button>
              </Box>
            }
          </>
        }

        {submitted &&
          <Box sx={{ textAlign: 'center', my: 4 }}>
            <Typography variant='h5' my={2} sx={{ fontWeight: 'bold' }}>You have been added to the waitlist.</Typography>
            <Typography variant='body1'>We will notify you if a spot becomes available.</Typography>
          </Box>
        }

      </StyledPaper>

      {!submitted && !processing &&
        <NavButtons backButtonProps = {{ text: 'Back', onClick: handleClickBackButton }} />
      }
    </>
  );
};
