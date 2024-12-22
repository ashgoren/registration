import { useState, useEffect } from "react";
import { Box, Typography } from '@mui/material';
import { useOrder, useOrderSetup, useOrderOperations } from 'components/OrderContext';
import { scrollToTop, warnBeforeUserLeavesSite, formatCurrency } from 'utils';
import PaypalCheckout from 'components/PaypalCheckout';
import Check from "components/Check";
import Loading from 'components/Loading';
import TogglePaymentMode from 'components/TogglePaymentMode';
import NavButtons from 'components/NavButtons/index.js';
import { StyledPaper, Title } from 'components/Layout/SharedStyles';
import StripeCheckout from 'components/StripeCheckout';
import Error from 'components/Error';
import config from 'config';
const { NUM_PAGES, TECH_CONTACT } = config;

export default function Checkout() {
  console.log('RENDER Checkout');

  const { order, updateOrder, setCurrentPage, processing, setProcessing, processingMessage, setProcessingMessage, error, setError, paymentMethod, amountToCharge } = useOrder();
  const { saveFinalOrderToFirebase, sendReceipts } = useOrderOperations();
  const [paying, setPaying] = useState(null);
  const [paypalButtonsLoaded, setPaypalButtonsLoaded] = useState(false);

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

  useEffect(() => { scrollToTop() },[]);

  useEffect(() => {
    if (window.location.hostname !== 'localhost') {
      window.addEventListener('beforeunload', warnBeforeUserLeavesSite);
      return () => window.removeEventListener('beforeunload', warnBeforeUserLeavesSite);
    }
  }, []);

  const handleClickBackButton = () => {
    setError(null);
    setCurrentPage(NUM_PAGES);
  };

  // error handling is done within the called functions
  const processCheckout = async ({ paymentProcessorFn, paymentParams={} }) => {
    setError(null);
    setProcessing(true);
    setProcessingMessage('Processing payment...');

    // move this part to backend to happen at same time we confirm payment? (tho stripe capture is front-end only)

    const { id, amount } = await paymentProcessorFn(paymentParams);
    if (!id) return;

    updateOrder({ paymentId: id, charged: amount });
    const finalOrder = { ...order, paymentId: id, charged: amount };

    try {
      await saveFinalOrderToFirebase(finalOrder);
      sendReceipts(finalOrder); // fire-and-forget
      setPaying(false);
      setProcessing(false);
      setCurrentPage('confirmation');
    } catch (error) {
      setProcessing(false);
    }
  };




  if (!isValidTotal(order)) {
    setError('Possible payment amount discrepancy. Please verify total is correct!');
  }

  if (!amountToCharge) {
    return (
      <>
        <StyledPaper align='center'>
          {error && <Box sx={{ mb: 4 }}><Error /></Box>}
          <Loading text={`Retrieving total from ${paymentMethod}...`} />
        </StyledPaper>
        <NavButtons backButtonProps = {{ onClick: handleClickBackButton, text: 'Back' }} />
      </>
    );
  }

  return (
    <section>
      <StyledPaper align='center'>

        {processing && <Loading processing={true} text={processingMessage} />}
        {error && <Box sx={{ mb: 4 }}><Error /></Box>}

        {!processing &&
          <>
            <Typography variant='h6' gutterBottom><em>Please confirm the amount shown is correct!</em></Typography>
            <Title>Amount due: ${formatCurrency(amountToCharge)}</Title>
          </>

        }

        {paymentMethod === 'stripe' &&
          <StripeCheckout
            total={amountToCharge}
            processCheckout={processCheckout}
          />
        }

        {paymentMethod === 'paypal' &&
          <PaypalCheckout
            paypalButtonsLoaded={paypalButtonsLoaded} setPaypalButtonsLoaded={setPaypalButtonsLoaded}
            setPaying={setPaying}
            processCheckout={processCheckout}
          />
        }

        {paymentMethod === 'check' && 
          <Check processCheckout={processCheckout} />
        }

        {!paying && !processing && (paymentMethod === 'check' || paymentMethod === 'stripe' || paypalButtonsLoaded) &&
          <TogglePaymentMode />
        }
      </StyledPaper>

      {!paying && !processing &&
        <NavButtons backButtonProps = {{ onClick: handleClickBackButton, text: 'Back' }} />
      }
    </section>
  );
}

function isValidTotal(order) {
  const orderTotal = parseInt(order.total) + parseFloat(order.fees);
  const isDeposit = order.deposit > 0;
  const admissions = order.people.map(person => person.admission);
  const admissionsTotal = admissions.reduce((total, admission) => total + admission, 0);
  const donation = order.donation;
  const fees = order.fees;
  return isDeposit || orderTotal === admissionsTotal + donation + fees;
}
