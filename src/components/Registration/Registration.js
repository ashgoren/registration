import { useState, useEffect } from "react";
import 'firebase.js'; // initializes firebase
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import MainForm from "components/MainForm";
import Checkout from "components/Checkout";
import Confirmation from "components/Confirmation";
import Error from "components/Error";
import Header from 'components/Header';
import IntroHeader from 'components/Header/IntroHeader';
import OrderSummary from "components/OrderSummary";
import Receipt from "components/Receipt";
import { cache, cached } from 'utils';
import { Typography, Button } from "@mui/material";
import { StyledPaper, Paragraph } from 'components/Layout/SharedStyles';
import config from 'config';
const { PAYMENT_METHODS, PAYPAL_OPTIONS, ORDER_DEFAULTS, TITLE, CONFIRMATION_CHECK_TITLE, CONFIRMATION_PAYPAL_TITLE, SANDBOX_MODE, SHOW_PRE_REGISTRATION } = config;

export default function Registration() {
  const [registering, setRegistering] = useState(false);
  return (
    SHOW_PRE_REGISTRATION || SANDBOX_MODE ? (
      registering ? <RealRegistration /> : <PreRegistration setRegistering={setRegistering} />
    ) : <RealRegistration />
  );
}

const PreRegistration = ({ setRegistering }) => {
  return(
    <StyledPaper>
      <Typography variant="h4" color="red" sx={{ fontWeight: "bold"}}>TEST MODE ONLY</Typography>
      <Typography variant="h6">DO NOT USE FOR ACTUAL REGISTRATION</Typography>
      <Paragraph sx={{ lineHeight: 2, mt: 4 }}>
      <Button variant='contained' color='secondary' onClick={() => setRegistering(true)}>Continue</Button>
        {/* <Checkbox onChange={() => setRegistering(true)} /> */}
      </Paragraph>
    </StyledPaper>
  );
}

const RealRegistration = () => {
  const [order, setOrder] = useState(cached('order') || ORDER_DEFAULTS);
  // const [order, setOrder] = useOrder();
  const [currentPage, setCurrentPage] = useState(cached('currentPage') || 1);
  const [error, setError] = useState(null);
  const CONFIRMATION_TITLE = order.paymentId === 'check' ? CONFIRMATION_CHECK_TITLE : CONFIRMATION_PAYPAL_TITLE;

  useEffect(() => { cache('order', order) }, [order]);
  useEffect(() => { cache('currentPage', currentPage) }, [currentPage]);

  const content = (
    <>
      {/* {SANDBOX_MODE &&
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '3rem', backgroundColor: 'var(--color-error)' }}>
          TEST MODE ONLY - DO NOT USE FOR REAL REGISTRATION
        </Box>
      } */}
      {error && <Error error={error} />}

      <Header
        titleText={currentPage === 'confirmation' ? CONFIRMATION_TITLE : TITLE}
        currentPage={currentPage}
      >
        {currentPage === 1 && <IntroHeader />}
        {currentPage === 2 && <OrderSummary order={order} currentPage={currentPage} />}
        {currentPage === 3 && <OrderSummary order={order} currentPage={currentPage} />}
        {currentPage === 'checkout' && <OrderSummary order={order} currentPage={currentPage} />}
        {currentPage === 'confirmation' && <Receipt order={order} />}
      </Header>

      {isFinite(currentPage) &&
        <MainForm
          order={order} setOrder={setOrder}
          currentPage={currentPage} setCurrentPage={setCurrentPage}
        />
      }

      {currentPage === 'checkout' &&
        <Checkout
          order={order} setOrder={setOrder}
          setCurrentPage={setCurrentPage}
          setError={setError}
        />
      }

      {currentPage === 'confirmation' &&
        <Confirmation
          setOrder={setOrder}
          setCurrentPage={setCurrentPage}
        />
      }
    </>
  )

  return PAYMENT_METHODS.includes('paypal') ?
    <PayPalScriptProvider options={PAYPAL_OPTIONS}>
      {content}
    </PayPalScriptProvider>
  : content;
}
