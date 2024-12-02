import { useState } from "react";
import { Box, Typography, Button, Checkbox, FormControlLabel } from "@mui/material";
import OrderSummary from "components/OrderSummary";
import { useOrder, useOrderOperations } from "components/OrderContext";
import { StyledPaper, Paragraph } from 'components/Layout/SharedStyles';
import NavButtons from 'components/NavButtons';
import Loading from 'components/Loading';
import Error from 'components/Error';
import config from 'config';
const { SANDBOX_MODE } = config;

export default function Waitlist({ handleClickBackButton }) {
  const { order, error, setError, processing, setProcessing, processingMessage, setProcessingMessage } = useOrder();
  const { prepOrderForFirebase, savePendingOrderToFirebase, saveFinalOrderToFirebase } = useOrderOperations();
  const [ready, setReady] = useState(SANDBOX_MODE);
  const [confirmed, setConfirmed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  setTimeout(() => {
    setReady(true);
  }, 5000);

  const processWaitlist = async () => {
    setError(null);
    setProcessing(true);
    setProcessingMessage('Adding to waitlist...');

    const preppedOrder = prepOrderForFirebase();

    const pendingSuccess = await savePendingOrderToFirebase({...preppedOrder, paymentMethod: 'waitlist' });
    if (!pendingSuccess) {
      setProcessing(false);
      return;
    }

    const success = await saveFinalOrderToFirebase({ ...preppedOrder, paymentMethod: 'waitlist', paymentId: '' });
    if (success) {
      setProcessing(false);
      setSubmitted(true);
    } else {
      setProcessing(false);
    }
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
}
