import { useState, useEffect, useCallback, useRef } from "react";
import { Box, Typography } from '@mui/material';
import { useOrder, useOrderOperations } from 'components/OrderContext';
import { scrollToTop, warnBeforeUserLeavesSite, fullName, formatCurrency } from 'utils';
import PaypalCheckoutButton from 'components/PaypalCheckoutButton';
import Check from "components/Check";
import Loading from 'components/Loading';
import TogglePaymentMode from 'components/TogglePaymentMode';
import NavButtons from 'components/NavButtons/index.js';
import { StyledPaper, Title } from 'components/Layout/SharedStyles';
import StripeCheckoutWrapper from "components/StripeCheckoutWrapper";
import { firebaseFunctionDispatcher } from 'firebase.js';
import Error from 'components/Error';
import config from 'config';
const { NUM_PAGES, EVENT_TITLE, TECH_CONTACT } = config;

export default function Checkout() {
  const { order, updateOrder, setCurrentPage, processing, setProcessing, processingMessage, setProcessingMessage, error, setError, paymentMethod, paymentInfo, setPaymentInfo } = useOrder();
  const { prepOrderForFirebase, savePendingOrderToFirebase, saveFinalOrderToFirebase, sendReceipts } = useOrderOperations();
  const [paying, setPaying] = useState(null);
  const [paypalButtonsLoaded, setPaypalButtonsLoaded] = useState(false);
  const [amount, setAmount] = useState(null);
  const total = parseInt(order.total) + parseFloat(order.fees);
	const orderCreationAttempted = useRef(false);
  const [updateIdempotencyKey, setUpdateIdempotencyKey] = useState(null);

  if (!isValidTotal(order)) {
    setError('Possible payment amount discrepancy. Please verify total is correct!');
  }

  useEffect(() => {
    setUpdateIdempotencyKey(crypto.randomUUID());
  }, []);

  useEffect(() => { scrollToTop() },[]);

  useEffect(() => {
    if (window.location.hostname !== 'localhost') {
      window.addEventListener('beforeunload', warnBeforeUserLeavesSite);
      return () => window.removeEventListener('beforeunload', warnBeforeUserLeavesSite);
    }
  }, []);

  const handleClickBackButton = () => {
    setError(null);
    updateOrder({ status: '' });
    setCurrentPage(NUM_PAGES);
  };

  // prep paypal / stripe order
	const createOrder = useCallback(async () => {
		if (orderCreationAttempted.current) {
			console.log('orderCreationAttempted', orderCreationAttempted.current);
			return;
		}
		console.log(paymentInfo.id ? 'updating existing order' : 'creating new order');
		orderCreationAttempted.current = true;

		try {
      const response = await firebaseFunctionDispatcher({
        action: paymentMethod === 'paypal' ? 'createOrUpdatePaypalOrder' : 'getStripePaymentIntent',
        email: order.people[0].email,
        data: {
          description: `${EVENT_TITLE}`, // only used by paypal
          name: fullName(order.people[0]), // only used by stripe
          email: order.people[0].email, // only used by stripe
          id: paymentInfo.id,
          amount: total,
          idempotencyKey: paymentInfo.id ? updateIdempotencyKey : order.idempotencyKey
        }
      });
      const { id, amount, clientSecret } = response?.data || {};

      if (!id || !amount) throw new Error('Missing data from payment processor');
      if (paymentMethod === 'stripe' && !clientSecret) throw new Error('Missing clientSecret from Stripe');
      if (amount > 999 * order.people.length) throw new Error('out-of-range');

      setPaymentInfo({ id, clientSecret }); // clientSecret only used by stripe
      setAmount(amount); // to show user the actual total from paypal before they enter payment info

		} catch (error) {
      // console.log('error.code', error.code);
      // console.log('error.message', error.message);
      // console.log('error.details', error.details);
			console.log('createOrder error', error);
			orderCreationAttempted.current = false; // allow retry on fail
			setError(`${paymentMethod} encountered an error. ${error}. Please try again or contact ${TECH_CONTACT}.`);
		}

	}, [order, total, paymentMethod, paymentInfo, setPaymentInfo, setError, updateIdempotencyKey]);

	useEffect(() => {
		createOrder();
	}, [createOrder]);

  // error handling is done within the called functions
  const processCheckout = async ({ paymentProcessorFn, paymentParams={} }) => {
    setError(null);
    setProcessing(true);

    const preppedOrder = prepOrderForFirebase();

    const pendingSuccess = await savePendingOrderToFirebase(preppedOrder);
    if (!pendingSuccess) {
      setProcessing(false);
      setPaying(false);
      return;
    }

    setProcessingMessage('Processing payment...');
    const paymentId = await paymentProcessorFn(paymentParams);
    console.log('paymentId', paymentId);
    if (!paymentId) return;
    updateOrder({ paymentId });
    const finalOrder = { ...preppedOrder, paymentId };

    const success = await saveFinalOrderToFirebase(finalOrder);
    if (success) {
      sendReceipts(finalOrder); // fire-and-forget
      setPaying(false);
      setProcessing(false);
      setCurrentPage('confirmation');
    } else {
      setProcessing(false);
    }
  };

  if (!amount) {
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
            <Title>Amount due: ${formatCurrency(amount)}</Title>
          </>

        }

        {paymentMethod === 'stripe' &&
          <StripeCheckoutWrapper
            total={total}
            processCheckout={processCheckout}
          />
        }

        {paymentMethod === 'paypal' &&
          <PaypalCheckoutButton 
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
