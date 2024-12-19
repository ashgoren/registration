import { useEffect } from 'react';
import { scrollToTop, websiteLink } from 'utils';
import OrderSummary, { PersonSummary } from 'components/OrderSummary';
import { Divider, Typography } from '@mui/material';
import { StyledLink } from 'components/Layout/SharedStyles';
import config from 'config';
const { CHECK_TO, CHECK_ADDRESS, EVENT_TITLE, PAYMENT_DUE_DATE, DIRECT_PAYMENT_URL } = config;

// relies on passing order as prop to ensure is updated
export default function Receipt({ order, paymentMethod, person, isPurchaser }) {
  const isCheckPayment = paymentMethod === 'check';
  const isElectronicPayment = !isCheckPayment;
  const isDeposit = order.deposit > 0;
  const isFullPayment = !isDeposit;
  const purchaserName = order.people[0].first;

  useEffect(() => { scrollToTop() },[]);

  const purchaserCheckPaymentContent = (
    <>
      <Typography component='p' color='error' sx={{ mt: 2 }}>
        <strong>You are not yet registered.</strong>
      </Typography>
      <Typography component='p'>
        We must receive a check from you in the next two weeks to hold your spot.<br />
        Please send a check for {isDeposit ? `at least $${order.deposit} to hold` : `$${order.total} to secure`} your spot.<br />
        (Or you can still pay electronically <StyledLink to={websiteLink(DIRECT_PAYMENT_URL)}>here</StyledLink>.)
      </Typography>
      <Typography component='p' sx={{ mt: 2 }}>
        Make your check out to {CHECK_TO}:<br />
        {CHECK_ADDRESS}
      </Typography>
      <Typography component='p' sx={{ mt: 2 }}>
        Once we receive your payment we will be in touch to confirm your acceptance into camp!
      </Typography>
    </>
  );

  const purchaserElectronicPaymentContent = (
    <Typography component='p' sx={{ mt: 2 }}>
      Thank you for registering for the {EVENT_TITLE}!<br />
      Your payment for ${order.charged} has been successfully processed.<br />
      {isDeposit &&
        <strong>
          Your balance is due by {PAYMENT_DUE_DATE}.<br />
          To pay it, please go to <StyledLink to={websiteLink(DIRECT_PAYMENT_URL)}>{DIRECT_PAYMENT_URL}</StyledLink>.
        </strong>
      }
    </Typography>
  );

  const additionalPersonPaymentContent = (
    <>
      <Typography component='p' sx={{ mt: 2 }}>
        Someone has signed you up for the {EVENT_TITLE}!
      </Typography>
      <Typography component='p' sx={{ mt: 2 }}>
        {isElectronicPayment && isFullPayment && "We've received payment for your registration."}
        {isElectronicPayment && isDeposit && `We are holding your spot in camp. The balance of your registration fee is due by ${PAYMENT_DUE_DATE}.`}
        {isCheckPayment && <strong>Your spot in camp will be confirmed once we receive payment for your registration.</strong>}
      </Typography>
    </>
  );

  return(
    <>
      {isPurchaser ?
        <>
          <Typography component='p'>Thanks {purchaserName}!</Typography>
          {isCheckPayment ? purchaserCheckPaymentContent : purchaserElectronicPaymentContent}
        </>
      :
        additionalPersonPaymentContent
      }

      <Typography component='p' sx={{ mt: 2 }}>
        We look forward to dancing with you at {EVENT_TITLE}!
      </Typography>

      <Divider component="hr" sx={{borderBottomWidth: 4, my: 4}}/>

      <Typography component='p' variant="h6" gutterBottom={true}>
        Registration Information:
      </Typography>

      {isPurchaser ?
        <OrderSummary order={order} currentPage='confirmation' />
      :
        <PersonSummary person={person} />
      }
    </>
  );
}
