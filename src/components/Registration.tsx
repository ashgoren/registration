import { useState } from 'react';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import { Typography, Button } from '@mui/material';
import { Error, Header, Loading } from 'components/layouts';
import { StyledPaper, Paragraph } from 'components/layouts/SharedStyles';
import { useOrderData } from 'contexts/OrderDataContext';
import { useOrderPayment } from 'contexts/OrderPaymentContext';
import { useOrderFlow } from 'contexts/OrderFlowContext';
import { MainForm } from 'components/MainForm';
import { Checkout } from 'components/Checkout';
import { Processing } from 'components/Processing';
import { Confirmation } from 'components/Confirmation';
import { IntroHeader } from 'components/IntroHeader';
import { OrderSummary } from 'components/OrderSummary';
import { WaitlistNote } from 'components/WaitlistNote';
import { PreRegistration } from 'components/Static/PreRegistration';
import { config } from 'config';
const { PAYMENT_METHODS, PAYPAL_OPTIONS, EVENT_TITLE, CONFIRMATION_CHECK_TITLE, CONFIRMATION_ELECTRONIC_TITLE, PRD_LIVE, ENV, SHOW_PRE_REGISTRATION, WAITLIST_MODE } = config;

export const Registration = () => {
  const [registering, setRegistering] = useState(false);

  if (registering) {
    return <RealRegistration />;
  } else if (ENV === 'stg' || (ENV === 'prd' && !PRD_LIVE)) {
    return <TestModeWarning setRegistering={setRegistering} />;
  } else if (SHOW_PRE_REGISTRATION) {
    return <PreRegistration setRegistering={setRegistering} />;
  } else {
    return <RealRegistration />;
  }
};

const TestModeWarning = ({ setRegistering }: {
  setRegistering: (registering: boolean) => void;
}) => {
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
  const { order } = useOrderData();
  const { paymentMethod } = useOrderPayment();
  const { currentPage, error } = useOrderFlow();
  const CONFIRMATION_TITLE = paymentMethod === 'check' ? CONFIRMATION_CHECK_TITLE : CONFIRMATION_ELECTRONIC_TITLE;

  const content = (
    <>
      {error && <Error />}

      <Header titleText={currentPage === 'confirmation' ? CONFIRMATION_TITLE : EVENT_TITLE}>
        {currentPage === 1 && WAITLIST_MODE && <WaitlistNote />}
        {currentPage === 1 && <IntroHeader />}
        {currentPage === 'checkout' && <OrderSummary order={order} />}
      </Header>

      {typeof currentPage === 'number' && <MainForm />}

      {currentPage === 'checkout' && order.total && <Checkout />}
      {currentPage === 'checkout' && !order.total && <Loading />}

      {currentPage === 'processing' && <Processing isPaymentComplete={typeof order.charged === 'number'} />}

      {currentPage === 'confirmation' && <Confirmation />}
    </>
  )

  return PAYMENT_METHODS.includes('paypal') ?
    <PayPalScriptProvider options={PAYPAL_OPTIONS}>
      {content}
    </PayPalScriptProvider>
  : content;
}
