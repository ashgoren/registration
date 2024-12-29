import { useEffect, useState } from 'react';
import { useOrder } from 'hooks/useOrder';
import { initializeFirebaseAppCheck } from 'src/firebase.jsx';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import { Typography, Button, Box } from '@mui/material';
import { StyledPaper, Paragraph } from 'components/Layout/SharedStyles';
import { MainForm } from 'components/MainForm/MainForm';
import { Checkout } from 'components/Checkout';
import { Processing } from 'components/Processing';
import { Confirmation } from 'components/Confirmation';
import { Error } from 'components/Layout/Error';
import { Header } from 'components/Layout/Header';
import { IntroHeader } from 'components/IntroHeader';
import { OrderSummary } from 'components/OrderSummary';
import { Loading } from 'components/Layout/Loading';
import { config } from 'config';
const { PAYMENT_METHODS, PAYPAL_OPTIONS, TITLE, CONFIRMATION_CHECK_TITLE, CONFIRMATION_PAYPAL_TITLE, SANDBOX_MODE, SHOW_PRE_REGISTRATION, TECH_CONTACT } = config;

export const Registration = () => {
  const { setError } = useOrder();
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    const validateAppCheck = async () => {
      const result = await initializeFirebaseAppCheck();
      if (!result) {
        setError(
          <Box>
            <Typography variant='h6' sx={{ fontWeight: 'bold' }}>Error: Browser or add-ons are blocking recaptcha verification.</Typography>
            <Typography variant='h6'>Please disable the <em>uBlock Origin</em> extension, if installed, or try a different browser.</Typography>
            <Typography variant='h6'>Please contact {TECH_CONTACT} if you continue to encounter this message even after trying the above steps.</Typography>
          </Box>
        );
      }
    }
    validateAppCheck();
  }, [setError]);

  return (
    SHOW_PRE_REGISTRATION || (SANDBOX_MODE && window.location.hostname !== 'localhost') ? (
      registering ? <RealRegistration /> : <PreRegistration setRegistering={setRegistering} />
    ) : <RealRegistration />
  );
};

const PreRegistration = ({ setRegistering }) => {
  return(
    <StyledPaper>
      <Typography variant="h4" color='error' sx={{ fontWeight: "bold"}}>TEST MODE ONLY</Typography>
      <Typography variant="h6">DO NOT USE FOR ACTUAL REGISTRATION</Typography>
      <Paragraph sx={{ lineHeight: 2, mt: 4 }}>
      <Button variant='contained' color='secondary' onClick={() => setRegistering(true)}>Continue</Button>
        {/* <Checkbox onChange={() => setRegistering(true)} /> */}
      </Paragraph>
    </StyledPaper>
  );
}

const RealRegistration = () => {
  const { order, paymentMethod, currentPage, error } = useOrder();
  const CONFIRMATION_TITLE = paymentMethod === 'check' ? CONFIRMATION_CHECK_TITLE : CONFIRMATION_PAYPAL_TITLE;

  const content = (
    <>
      {error && <Error />}

      <Header titleText={currentPage === 'confirmation' ? CONFIRMATION_TITLE : TITLE}>
        {currentPage === 1 && <IntroHeader />}
        {currentPage === 'checkout' && <OrderSummary order={order} currentPage={currentPage} />}
      </Header>

      {isFinite(currentPage) && <MainForm />}

      {currentPage === 'checkout' && order.total && <Checkout />}
      {currentPage === 'checkout' && !order.total && <Loading />}

      {currentPage === 'processing' && <Processing isPaymentComplete={isFinite(order.charged)} />}

      {currentPage === 'confirmation' && <Confirmation />}
    </>
  )

  return PAYMENT_METHODS.includes('paypal') ?
    <PayPalScriptProvider options={PAYPAL_OPTIONS}>
      {content}
    </PayPalScriptProvider>
  : content;
}
