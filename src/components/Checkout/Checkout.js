import { useState, useEffect, useCallback } from "react";
import { getFunctions, httpsCallable } from 'firebase/functions';
import { renderToStaticMarkup } from 'react-dom/server';
import { scrollToTop, warnBeforeUserLeavesSite, fullName } from 'utils';
import PaypalCheckoutButton from 'components/PaypalCheckoutButton';
import Check from "components/Check";
import Loading from 'components/Loading';
import Receipt, { AdditionalPersonReceipt } from 'components/Receipt';
import TogglePaymentMode from 'components/TogglePaymentMode';
import ButtonRow from 'components/ButtonRow/index.js';
import { StyledPaper, Title } from 'components/Layout/SharedStyles';
import { Hidden } from '@mui/material';
import { MyMobileStepper } from 'components/MyStepper';
import StripeCheckoutWrapper from "components/StripeCheckoutWrapper";
import config from 'config';
const { PAYMENT_METHODS, EMAIL_CONTACT, NUM_PAGES } = config;
const functions = getFunctions();
const createOrder = httpsCallable(functions, 'createOrder');
const updateOrder = httpsCallable(functions, 'updateOrder');

export default function Checkout({ order, setOrder, setError, setCurrentPage }) {
  const [paying, setPaying] = useState(null);
  const [processing, setProcessing] = useState(null);
  const [processingMessage, setProcessingMessage] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [paypalButtonsLoaded, setPaypalButtonsLoaded] = useState(false);

  useEffect(() => { scrollToTop() },[]);

  useEffect(() => {
    if (window.location.hostname !== 'localhost') {
      window.addEventListener('beforeunload', warnBeforeUserLeavesSite);
      return () => window.removeEventListener('beforeunload', warnBeforeUserLeavesSite);
    }
  }, []);

  const updateOrderInFirebase = useCallback(async () => {
    setProcessingMessage(order.paymentId === 'check' ? 'Updating registration...' : 'Payment successful. Updating registration...');
    try {
      await updateOrder({
        token: process.env.REACT_APP_TOKEN,
        id: order.id,
        updates: { paymentId: order.paymentId }
      });
    } catch (err) {
      console.error(`error updating firebase record`, err);
      setError(`Your payment was processed successfully. However, we encountered an error updating your registration. Please contact ${EMAIL_CONTACT}.`);
      setPaying(false);
      setProcessing(false);
      return false;
    }
    setPaying(false);
    setProcessing(false);
    setCurrentPage('confirmation');
  }, [order, setError, setCurrentPage, setPaying, setProcessing, setProcessingMessage]);

  useEffect(() => {
    if (order.id && order.paymentId && order.paymentId !== 'PENDING') {
      updateOrderInFirebase();
    }
  }, [order, updateOrderInFirebase]);

  const total = order.admissionCost * order.people.length + order.donation;

  const handleClickBackButton = () => {
    setError(null);
    setCurrentPage(NUM_PAGES);
  }

	const saveOrderToFirebase = async () => {
    setError(null);
    setProcessingMessage('Saving registration...');
    setProcessing(true);

    const initialOrder = {
      ...order,
      people: order.people.map(updateApartment),
      total,
      deposit: paymentMethod === 'check' ? 0 : total,
      paymentId: 'PENDING'
    };
    const receipt = renderToStaticMarkup(<Receipt order={initialOrder} currentPage='confirmation' checkPayment={paymentMethod === 'check'} />);
    const additionalPersonReceipt = renderToStaticMarkup(<AdditionalPersonReceipt order={initialOrder} />);
    const initialOrderWithReceipt = { ...initialOrder, receipt, additionalPersonReceipt };

    try {
      const { data } = await createOrder({ token: process.env.REACT_APP_TOKEN, order: initialOrderWithReceipt });
      const orderWithId = { ...initialOrderWithReceipt, id: data.id };
      setOrder(orderWithId);
      setProcessingMessage('Processing payment...');
      return orderWithId;
    } catch (err) {
      console.error(`error saving order to firebase`, err);
      setError(`We encountered an error saving your information, so your payment was not processed. Please try again or contact ${EMAIL_CONTACT}.`);
      setPaying(false);
      setProcessing(false);
      return false;
    }
	};

  return (
    <section>
      <StyledPaper align='center'>

        {processing && <Loading processing={true} text={processingMessage} />}

        {!processing &&
          <Title>Amount due: ${total}</Title>
        }

        {paymentMethod === 'stripe' &&
          <StripeCheckoutWrapper
            total={total}
            name={fullName(order.people[0])}
            email={order.people[0].email}
            setError={setError}
            processing={processing} setProcessing={setProcessing}
            saveOrderToFirebase={saveOrderToFirebase}
            setOrder={setOrder}
          />
        }

        {paymentMethod === 'paypal' &&
          <PaypalCheckoutButton 
            paypalButtonsLoaded={paypalButtonsLoaded} setPaypalButtonsLoaded={setPaypalButtonsLoaded}
            total={total} 
            setError={setError} 
            setPaying={setPaying} 
            processing={processing}
            saveOrderToFirebase={saveOrderToFirebase}
            setOrder={setOrder}
          />
        }

        {paymentMethod === 'check' && 
          <>
            <Check 
              processing={processing}
              saveOrderToFirebase={saveOrderToFirebase}
              setOrder={setOrder}
            />
          </>
        }

        {!paying && !processing && (paymentMethod === 'check' || paymentMethod === 'stripe' || paypalButtonsLoaded) &&
          <TogglePaymentMode paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} setError={setError} />
        }
      </StyledPaper>

      {!paying && !processing &&
        <>
          <Hidden smDown>
            <StyledPaper>
              <ButtonRow backButtonProps = {{ onClick: handleClickBackButton, text: 'Back' }} />
            </StyledPaper>
          </Hidden>

          <Hidden smUp>
            <MyMobileStepper currentPage={'checkout'} onClickBack={handleClickBackButton} />
          </Hidden>
        </>
      }
    </section>
  );
}

function updateApartment(person) {
  return (person.apartment && /^\d/.test(person.apartment)) ? { ...person, apartment: `#${person.apartment}` } : person;
}
