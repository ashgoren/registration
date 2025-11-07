import { useEffect, useState, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { Loading, Error, NavButtons } from 'components/layouts';
import { StyledPaper, Title } from 'components/layouts/SharedStyles';
import { formatCurrency } from 'utils';
import { useScrollToTop } from 'hooks/useScrollToTop';
import { useWarnBeforeUnload } from 'hooks/useWarnBeforeUnload';
import { useOrderData } from 'contexts/OrderDataContext';
import { useOrderPayment } from 'contexts/OrderPaymentContext';
import { useOrderFlow } from 'contexts/OrderFlowContext';
import { usePaymentInitialization } from 'hooks/usePaymentInitialization';
import { TogglePaymentMode } from 'components/TogglePaymentMode';
import { StripeCheckout } from 'components/StripeCheckout';
import { PaypalCheckout } from 'components/PaypalCheckout';
import { Check } from 'components/Check';
import { logDebug } from 'src/logger';
import { config } from 'config';
import type { Order } from 'types/order';

const { NUM_PAGES, TECH_CONTACT } = config;

export const Checkout = () => {
  logDebug('RENDER Checkout');

  const { order } = useOrderData();
  const { paymentMethod, amountToCharge } = useOrderPayment();
  const { setCurrentPage, processing, processingMessage, error, setError } = useOrderFlow();
  const { initializePayment, isInitializing } = usePaymentInitialization();
  const [paying, setPaying] = useState(null);
  const [paypalButtonsLoaded, setPaypalButtonsLoaded] = useState(false);

  useScrollToTop();
  useWarnBeforeUnload();

  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;

    const initialize = async () => {
      try {
        setError(null);
        await initializePayment();
        hasInitialized.current = true;
      } catch (err) {
        setError(
          <>
            We're sorry, but we experienced an issue initializing your registration:<br />
            Error initializing payment<br />
            Please close this tab and start over.<br />
            If this error persists, please contact {TECH_CONTACT}.<br />
            Error: {getErrorMessage(err)}
          </>
        );

      }
    };

    initialize();
  }, [initializePayment, setError]);

  const handleClickBackButton = () => {
    setError(null);
    setCurrentPage(NUM_PAGES);
  };

  if (!isValidTotal(order)) {
    setError('Possible payment amount discrepancy. Please verify total is correct!');
  }

  if (!amountToCharge || isInitializing) {
    return (
      <>
        <StyledPaper sx={{ textAlign: 'center' }}>
          {error && <Box sx={{ mb: 4 }}><Error /></Box>}
          <Loading text={`Retrieving total from ${paymentMethod}...`} />
        </StyledPaper>
        <NavButtons backButtonProps = {{ onClick: handleClickBackButton, text: 'Back' }} />
      </>
    );
  }

  return (
    <section>
      <StyledPaper sx={{ textAlign: 'center' }}>

        {processing && <Loading processing={true} text={processingMessage} />}
        {error && <Box sx={{ mb: 4 }}><Error /></Box>}

        {!processing &&
          <>
            <Typography variant='h6' gutterBottom><em>Please confirm the amount shown is correct!</em></Typography>
            <Title>Amount due: ${formatCurrency(amountToCharge)}</Title>
          </>

        }

        {paymentMethod === 'stripe' &&
          <StripeCheckout total={amountToCharge} />
        }

        {paymentMethod === 'paypal' &&
          <PaypalCheckout
            paypalButtonsLoaded={paypalButtonsLoaded} setPaypalButtonsLoaded={setPaypalButtonsLoaded}
            setPaying={setPaying}
          />
        }

        {paymentMethod === 'check' && 
          <Check />
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
};

function isValidTotal(order: Order): boolean {
  const orderTotal = Number(order.total) + Number(order.fees);
  const isDeposit = order.deposit > 0;
  const admissions = order.people.map(person => Number(person.admission));
  const admissionsTotal = admissions.reduce((total, admission) => total + admission, 0);
  const donation = order.donation;
  const fees = order.fees;
  return isDeposit || orderTotal === admissionsTotal + donation + Number(fees);
}

const getErrorMessage = (err: unknown): string => {
  const error = err as Error | string;
  return error instanceof Error ? error.message : String(error);
};
