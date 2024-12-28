import { useEffect, useState } from 'react';
import { Box, Typography, Button, Checkbox, FormControlLabel } from '@mui/material';
import { OrderSummary } from 'components/OrderSummary';
import { useOrder } from 'hooks/useOrder';
import { useOrderSetup } from 'hooks/useOrderSetup';
import { useOrderFinalization } from 'hooks/useOrderFinalization';
import { useWarnBeforeUnload } from 'hooks/useWarnBeforeUnload';
import { StyledPaper, Paragraph } from 'components/Layout/SharedStyles';
import { NavButtons } from 'components/Layout/NavButtons';
import { Loading } from 'components/Layout/Loading';
import { Error } from 'components/Layout/Error';
import { config } from 'config';
const { SANDBOX_MODE, TECH_CONTACT } = config;

export const Waitlist = ({ handleClickBackButton }) => {
  const { order, updateOrder, error, setError, processing, setProcessing, processingMessage, setProcessingMessage } = useOrder();
  const { finalizeOrder } = useOrderFinalization();
  const [ready, setReady] = useState(SANDBOX_MODE);
  const [confirmed, setConfirmed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useWarnBeforeUnload(!submitted);

  setTimeout(() => {
    setReady(true);
  }, 5000);

  useOrderSetup({
    onError: (errorMsg) => setError(
      <>
        We're sorry, but we experienced an issue initializing your registration:<br />
        {errorMsg}<br />
        Please close this tab and start over.<br />
        If this error persists, please contact {TECH_CONTACT}.
      </>
    )
  });

  useEffect(() => {
    if (order.paymentId !== 'waitlist') return;

    const finalize = async () => {
      console.log('FINALIZE WAITLIST');
      try {
        await finalizeOrder();
        setProcessing(false);
        setSubmitted(true);
      } catch (error) {
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
    updateOrder({ paymentId: 'waitlist', charged: 0 });
  };

  return (
    <>
      <StyledPaper>

        <Typography variant='h4' align='center' mt={1} mb={3}>
          {submitted ? 'Success!' : 'Waitlist Sign-up'}
        </Typography>

        <OrderSummary order={order} currentPage='waitlist' />

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
              <Box align='center' my={4}>
                <Button variant='contained' color='secondary' onClick={processWaitlist}>Sign up for waitlist</Button>
              </Box>
            }
          </>
        }

        {submitted &&
          <Box align='center' my={4}>
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
