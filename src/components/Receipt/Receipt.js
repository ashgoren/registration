import { useEffect } from 'react';
import { scrollToTop, websiteLink } from 'utils';
import OrderSummary from 'components/OrderSummary';
import { Divider, Typography } from '@mui/material';
import { StyledLink } from 'components/Layout/SharedStyles';
import config from 'config';
const { COVID_POLICY_URL, CHECK_TO, CHECK_ADDRESS, EVENT_TITLE } = config;

export default function Receipt({ order, checkPayment }) {
  checkPayment ??= order.paymentId === 'check'
  useEffect(() => { scrollToTop() },[]);
  return(
    <>
      <p>Thanks, {order.people[0].first}!</p>
      {checkPayment ? <CheckPaymentReceipt order={order}/> : <ElectronicPaymentReceipt order={order }/>}
    </>
  );
}

function CheckPaymentReceipt({ order }) {
  return (
    <>
      <Typography component='p' color='error'>
        <strong>You are not yet registered!</strong><br />
        Paying on time can increase your chance of being accepted.<br />
        Please send a check for ${order.total}.
      </Typography>

      <Typography component='p' sx={{ mt: 2 }}>
        Make your check out to {CHECK_TO}
      </Typography>

      <Typography component='p' sx={{ mt: 2 }}>
        <span dangerouslySetInnerHTML={{ __html: CHECK_ADDRESS }}></span>
      </Typography>

      <Typography component='p' sx={{ mt: 2 }}>
        We will be in touch soon to confirm your acceptance into camp, once we receive your payment!
      </Typography>

      <SharedReceipt />
      
      <Divider component="hr" sx={{borderBottomWidth: 4, my: 4}}/>
      <Typography component='p' variant="h6" gutterBottom={true}>Registration Information:</Typography>
      <OrderSummary order={order} currentPage='confirmation' />
    </>
  );
}

function ElectronicPaymentReceipt({ order }) {
  return (
    <>
      <Typography component='p' sx={{ mt: 2 }}>
        Thank you for registering for the {EVENT_TITLE}!<br />
        Your payment for ${order.total} has been successfully processed.<br />
      </Typography>

      <SharedReceipt />

      <Divider component="hr" sx={{borderBottomWidth: 4, my: 4}}/>
      <Typography component='p' variant="h6" gutterBottom={true}>Registration Information:</Typography>
      <OrderSummary order={order} currentPage='confirmation' />
    </>
  );
}

export function AdditionalPersonReceipt({ order }) {
  return (
    <>
      <Typography component='p' sx={{ mt: 2 }}>
        Thank you for registering for the {EVENT_TITLE}.
      </Typography>

      <SharedReceipt />
    </>
  )
}

function SharedReceipt() {
  return (
    <>
      <Typography component='p' sx={{ mt: 2 }}>
        Masking will be required.<br />
        See <StyledLink to={websiteLink(COVID_POLICY_URL)}>here</StyledLink> for the full Covid policy.<br />
      </Typography>

      <Typography component='p' sx={{ mt: 2 }}>
        {EVENT_TITLE} is a fragrance-free event.<br />
        Please use only fragrance-free products.
      </Typography>

      <Typography component='p' sx={{ mt: 2 }}>
        Hope to dance with you soon at the {EVENT_TITLE}!
      </Typography>
    </>
  );
}
