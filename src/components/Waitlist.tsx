import { useState } from 'react';
import { Box, Typography, Button, Checkbox, FormControlLabel, Alert } from '@mui/material';
import { Loading, Error, NavButtons } from 'components/layouts';
import { StyledPaper, Paragraph } from 'components/layouts/SharedStyles';
import { useWarnBeforeUnload } from 'hooks/useWarnBeforeUnload';
import { useOrderData } from 'contexts/OrderDataContext';
import { useOrderFlow } from 'contexts/OrderFlowContext';
import { useOrderSaving } from 'hooks/useOrderSaving';
import { useOrderFinalization } from 'hooks/useOrderFinalization';
import { usePageNavigation } from 'hooks/usePageNavigation';
import { OrderSummary } from 'components/OrderSummary';
import { logDebug, logErrorDebug } from 'src/logger';
import { config } from 'config';
const { ENV, TECH_CONTACT, WAITLIST_MODE } = config;

export const Waitlist = () => {
  const { order, updateOrder } = useOrderData();
  const { error, setError, processing, setProcessing, processingMessage, setProcessingMessage } = useOrderFlow();
  const { savePendingOrder, isSaving } = useOrderSaving();
  const { finalizeOrder } = useOrderFinalization();
  const { goBack } = usePageNavigation();
  const [ready, setReady] = useState(ENV === 'dev');
  const [confirmed, setConfirmed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useWarnBeforeUnload(!submitted);

  setTimeout(() => {
    setReady(true);
  }, 5000);

  const processWaitlist = async () => {
    setError(null);
    setProcessing(true);
    setProcessingMessage('Adding to waitlist...');
    try {
      const orderId = await savePendingOrder();
      logDebug('Pending order saved successfully');
      const paymentId = 'waitlist';
      const charged = 0;
      updateOrder({ paymentId, charged });
      await finalizeOrder({ orderId, paymentId, charged });
      logDebug('Final order saved successfully');
      setSubmitted(true);
      setProcessing(false);
    } catch (error: unknown) { // instance of HttpsError from backend or other error
      logErrorDebug('Error saving pending order:', error);
      const { code, message } = error as { code?: string; message?: string };
      setError(
				<>
					We're sorry, but we experienced an issue saving your order.<br />
					Please try again or contact {TECH_CONTACT} for assistance.<br />
					Error: {code} {message || error}
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

        {!WAITLIST_MODE &&
          <Alert severity='warning' sx={{ mb: 4 }}>
            We apologize but we have just hit our registration capacity. You can sign up for the waitlist below and we will notify you if a spot becomes available.
          </Alert>
        }

        <OrderSummary order={order} />

        {!ready && <Loading text='Please wait...' />}

        {processing && <Loading processing={true} text={processingMessage} />}

        {error && <Box sx={{ mb: 4 }}><Error /></Box>}

        {ready && !submitted && !processing &&
          <>
            {!confirmed &&
              <Paragraph sx={{ my: 4 }}>
                <FormControlLabel
                  label='I understand that I am signing up for the waitlist and that I will be notified if a spot becomes available.'
                  control={<Checkbox
                    onChange={() => setConfirmed(!confirmed)}
                    name='confirm'
                    color='primary'
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
        <NavButtons
          back={{ text: 'Back', onClick: goBack }}
        />
      }
    </>
  );
};
