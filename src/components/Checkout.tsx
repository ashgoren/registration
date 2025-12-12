import { useEffect, useState, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { Header, Loading, Error, NavButtons } from 'components/layouts';
import { StyledPaper, Title } from 'components/layouts/SharedStyles';
import { formatCurrency } from 'utils/misc';
import { usePageNavigation } from 'hooks/usePageNavigation';
import { useScrollToTop } from 'hooks/useScrollToTop';
import { useWarnBeforeUnload } from 'hooks/useWarnBeforeUnload';
import { useOrderData } from 'contexts/OrderDataContext';
import { useOrderPayment } from 'contexts/OrderPaymentContext';
import { useOrderFlow } from 'contexts/OrderFlowContext';
import { usePaymentInitialization } from 'hooks/usePaymentInitialization';
import { TogglePaymentMode } from 'components/TogglePaymentMode';
import { StripeCheckout } from 'components/StripeCheckout';
import { PaypalCheckout } from 'components/PaypalCheckout';
import { OrderSummary } from 'components/OrderSummary';
import { Check } from 'components/Check';
import { config } from 'config';
import type { Order } from 'types/order';

const { TECH_CONTACT, EVENT_TITLE } = config;

export const Checkout = () => {
  // logDebug('RENDER Checkout');

  const { order } = useOrderData();
  const { paymentMethod, amountToCharge } = useOrderPayment();
  const { processing, processingMessage, error, setError } = useOrderFlow();
  const { goBack } = usePageNavigation();
  const { initializePayment, isInitializing } = usePaymentInitialization();
  const [paying, setPaying] = useState(false);

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
            We're sorry, but we experienced an issue initializing payment.<br />
            Please hit the back button, refresh the page, and try again.<br />
            If that fails, please close this tab and start over.<br />
            If this error persists, please contact {TECH_CONTACT}.<br /><br />
            Error message:<br />
            {getErrorMessage(err)}
          </>
        );

      }
    };

    initialize();
  }, [initializePayment, setError]);

  const handleClickBackButton = () => {
    setError(null);
    goBack();
  };

  if (!isValidTotal(order)) {
    setError('Possible payment amount discrepancy. Please verify total is correct!');
  }

  return (
    <section>
      <Header titleText={EVENT_TITLE}>
        <OrderSummary order={order} />
      </Header>

      <StyledPaper extraStyles={{ textAlign: 'center' }}>

        {isInitializing || !amountToCharge || !order.total
        ? <Loading text={`Retrieving total from ${paymentMethod}...`} />
        : <>
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
              <PaypalCheckout setPaying={setPaying} />
            }

            {paymentMethod === 'check' && 
              <Check />
            }

            {!paying && !processing &&
              <TogglePaymentMode />
            }
          </>
        }

      </StyledPaper>

      {!paying && !processing &&
        <NavButtons back={{ text: 'Back', onClick: handleClickBackButton }} />
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
