import { useState } from 'react';
import { Typography, Button } from '@mui/material';
import { Loading } from 'components/layouts';
import { useOrder } from 'hooks/useOrder';
import { useOrderSaving } from 'hooks/useOrderSaving';
import { StyledLink } from 'components/layouts/SharedStyles';
import { mailtoLink } from 'utils';
import { logErrorDebug } from 'src/logger';
import { config } from 'config';
const { SHOW_CHECK_ADDRESS, CHECK_ADDRESS, CHECK_TO, ENV, TECH_CONTACT, EMAIL_CONTACT } = config;

export const Check = () => {
  const { processing, setCurrentPage, updateOrder, error, setError } = useOrder();
  const { savePendingOrder, isSaving } = useOrderSaving();
  const [ready, setReady] = useState(ENV === 'dev');

  setTimeout(() => {
    setReady(true);
  }, 5000);

  const handleRegister = async () => {
    try {
      await savePendingOrder();
      updateOrder({ paymentId: 'check', charged: 0 });
      setCurrentPage('processing');
    } catch (error) { // instance of HttpsError from backend or other error
      logErrorDebug('Error saving pending order:', error);
      setError(
				<>
					We're sorry, but we experienced an issue saving your order.<br />
					Please try again or contact {TECH_CONTACT} for assistance.<br />
					Error: {error.message || error}
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
          {SHOW_CHECK_ADDRESS ?
            <>
              <Typography sx={{ mt: 2 }}>
                Make your check out to {CHECK_TO}<br />
                Write your name in the memo area, and mail to:
              </Typography>
              <Typography sx={{ mt: 2 }}>
                { CHECK_ADDRESS.map(line => (<span key={line}>{line}<br /></span>)) }
              </Typography>
            </>
          :
            <Typography sx={{ mt: 2 }}>
              Email <StyledLink to={mailtoLink(EMAIL_CONTACT)}>{EMAIL_CONTACT}</StyledLink> for info on filling out and mailing your check.
            </Typography>
          }

          <Typography sx={{ mt: 2 }}>
            Your registration will be processed once we receive your check.<br />
            If you have any questions, please contact <StyledLink to={mailtoLink(EMAIL_CONTACT)}>{EMAIL_CONTACT}</StyledLink>.
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
