// Receipt templates are markdown files in the templates directory

import purchaserTemplate from 'templates/receipt-purchaser.md?raw';
import additionalPersonTemplate from 'templates/receipt-additional-person.md?raw';
import waitlistTemplate from 'templates/receipt-waitlist.md?raw';
import { Divider, Typography } from '@mui/material';
import { renderMarkdownTemplate, formatCurrency } from 'utils/misc';
import { useScrollToTop } from 'hooks/useScrollToTop';
import { OrderSummary, PersonSummary } from 'components/OrderSummary';
import { config } from 'config';
import type { Order, Person } from 'types/order';

// relies on passing order as prop to ensure is updated
export const Receipt = ({ order, paymentMethod, person, isPurchaser }: {
  order: Order;
  paymentMethod: string;
  person?: Person;
  isPurchaser: boolean;
}) => {
  useScrollToTop();

  // Additional attendees are emailed a waiver to sign after registration (see sendWaiverRequests)
  const showWaiverNote = config.registration.showWaiver && !isPurchaser;
  // Attendees sharing the purchaser's email get no receipt of their own, so the
  // purchaser's receipt explains the waiver emails that arrive for them
  const showAttendeeWaiverNote = config.registration.showWaiver && isPurchaser && order.people.length > 1;

  let data, template;
  if (paymentMethod === 'waitlist') {
    template = waitlistTemplate;
    data = {
      FIRST_NAME: person!.first,
      EVENT_TITLE: config.event.title
    };
  } else {
    template = isPurchaser ? purchaserTemplate : additionalPersonTemplate;
    data = {
      FIRST_NAME: order.people[0].first,
      EVENT_TITLE: config.event.title,
      IS_CHECK_PAYMENT: paymentMethod === 'check',
      IS_ELECTRONIC_PAYMENT: paymentMethod !== 'check',
      IS_DEPOSIT: order.deposit > 0,
      AMOUNT_PAID: formatCurrency(order.charged!),
      DEPOSIT_TOTAL: order.deposit,
      ORDER_TOTAL: formatCurrency(order.total!),
      SHOW_CHECK_ADDRESS: config.payments.checks.showPostalAddress,
      CHECK_TO: config.payments.checks.payee,
      CHECK_ADDRESS: config.payments.checks.address?.join(', '),
      PAYMENT_DUE_DATE: config.payments.paymentDueDate,
      DIRECT_PAYMENT_URL: config.payments.directPaymentUrl,
      SHOW_WAIVER_NOTE: showWaiverNote,
      SHOW_ATTENDEE_WAIVER_NOTE: showAttendeeWaiverNote
    };
  }

  const content = renderMarkdownTemplate(template, data);

  return (
    <>
      <Typography component='div' dangerouslySetInnerHTML={{ __html: content }} />
      <br />
      <Divider component='hr' />
      <br />
      {isPurchaser
        ? <OrderSummary order={order} />
        : <PersonSummary person={person!} />
      }
    </>
  );
};
