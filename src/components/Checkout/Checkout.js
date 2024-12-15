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
  const { order, updateOrder, setCurrentPage, processing, setProcessing, processingMessage, setProcessingMessage, error, setError, paymentMethod, paymentIntentId, setPaymentIntentId } = useOrder();
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

  // prep paypal order (will also handle stripe like this)
	const createOrder = useCallback(async () => {
		if (orderCreationAttempted.current) {
			console.log('orderCreationAttempted', orderCreationAttempted.current);
			return;
		}
		console.log(paymentIntentId ? 'updating existing order' : 'creating new order');
		orderCreationAttempted.current = true;

		try {
			const response = await firebaseFunctionDispatcher({
				action: 'createOrUpdatePaypalOrder',
				email: order.people[0].email,
				data: {
          id: paymentIntentId,
					description: `${EVENT_TITLE}`,
					amount: total,
					idempotencyKey: paymentIntentId ? updateIdempotencyKey : order.idempotencyKey
				}
			});
			if (!response?.data) throw new Error('No data returned');
			const { id, amount } = response.data;
			console.log('id', id, 'amount', amount, 'idempotencyKey', order.idempotencyKey);
      if (amount > 999 * order.people.length) throw new Error('out-of-range');
			setPaymentIntentId(id); // save order id for use with onApprove (capture)
			setAmount(amount); // to show user the actual total from paypal before they enter payment info
		} catch (error) {
			console.log('createOrder error', error);
			orderCreationAttempted.current = false; // allow retry on fail
			setError(`PayPal encountered an error. ${error}. Please try again or contact ${TECH_CONTACT}.`);
		}

	}, [order, total, paymentIntentId, setPaymentIntentId, setError, updateIdempotencyKey]);

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
          <Loading text='Retrieving total from PayPal...' />
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
            name={fullName(order.people[0])}
            email={order.people[0].email}
            processCheckout={processCheckout}
          />
        }

        {paymentMethod === 'paypal' &&
          <PaypalCheckoutButton 
            paypalButtonsLoaded={paypalButtonsLoaded} setPaypalButtonsLoaded={setPaypalButtonsLoaded}
            total={total} 
            setPaying={setPaying} 
            processCheckout={processCheckout}
          />
        }

        {paymentMethod === 'check' && 
          <>
            <Check 
                processCheckout={processCheckout}
              />
          </>
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
