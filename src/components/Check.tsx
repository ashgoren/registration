import { useState } from 'react';
import { Typography, Button } from '@mui/material';
import { Loading } from 'components/layouts';
import { useOrderData } from 'contexts/OrderDataContext';
import { useOrderFlow } from 'contexts/OrderFlowContext';
import { useOrderSaving } from 'hooks/useOrderSaving';
import { useOrderFinalization } from 'hooks/useOrderFinalization';
import { usePageNavigation } from 'hooks/usePageNavigation';
import { StyledLink } from 'components/layouts/SharedStyles';
import { mailtoLink } from 'utils/misc';
import { logDebug, logErrorDebug } from 'src/logger';
import { config } from 'config';

export const Check = () => {
  const { updateOrder } = useOrderData();
  const { processing, error, setError } = useOrderFlow();
  const { savePendingOrder, isSaving } = useOrderSaving();
  const { finalizeOrder } = useOrderFinalization();
  const { goNext } = usePageNavigation();
  const [ready, setReady] = useState(config.env === 'dev');

  setTimeout(() => {
    setReady(true);
  }, 5000);

  const handleRegister = async () => {
    try {
      const orderId = await savePendingOrder();
      logDebug('Pending order saved successfully');
      const paymentId = 'check';
      const charged = 0;
      updateOrder({ paymentId, charged });
      await finalizeOrder({ orderId, paymentId, charged });
      logDebug('Final order saved successfully');
      goNext();
    } catch (error) { // instance of HttpsError from backend or other error
      logErrorDebug('Error saving order:', error);
      const { code, message } = error as { code?: string; message?: string };
      setError(
				<>
					We're sorry, but we experienced an issue saving your order.<br />
					Please try again or contact {config.contacts.tech} for assistance.<br />
					Error: {code} {message || error}
				</>
      );
      return;
    }
  }

  return (
    <section>
      {error && <Typography color='error' sx={{ mb: 4 }}>Error: {error}</Typography>}
      {!processing &&
        <>
          {config.payments.checks.showPostalAddress ?
            <>
              <Typography sx={{ mt: 2 }}>
                Make your check out to {config.payments.checks.payee}<br />
                Write your name in the memo area, and mail to:
              </Typography>
              <Typography sx={{ mt: 2 }}>
                { config.payments.checks.address.map(line => (<span key={line}>{line}<br /></span>)) }
              </Typography>
            </>
          :
            <Typography sx={{ mt: 2 }}>
              Email <StyledLink to={mailtoLink(config.contacts.info)}>{config.contacts.info}</StyledLink> for info on filling out and mailing your check.
            </Typography>
          }

          <Typography sx={{ mt: 2 }}>
            Your registration will be processed once we receive your check.<br />
            If you have any questions, please contact <StyledLink to={mailtoLink(config.contacts.info)}>{config.contacts.info}</StyledLink>.
          </Typography>

          {!ready && <Loading />}
          <Button variant='contained' color='success' disabled={!ready} onClick={handleRegister} sx={{ mt: 4, mb: 2 }}>
            {isSaving ? 'Saving...' : 'Register and agree to send a check'}
          </Button>
        </>
      }
    </section>
  );
};
