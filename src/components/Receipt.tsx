// Receipt templates are markdown files in the templates directory

import purchaserTemplate from 'templates/receipt-purchaser.md?raw';
import additionalPersonTemplate from 'templates/receipt-additional-person.md?raw';
import { Divider, Typography } from '@mui/material';
import { renderMarkdownTemplate, formatCurrency } from 'utils';
import { useScrollToTop } from 'hooks/useScrollToTop';
import { OrderSummary, PersonSummary } from 'components/OrderSummary';
import { config } from 'config';
import type { Order, Person } from 'types/order';

const { SHOW_CHECK_ADDRESS, CHECK_TO, CHECK_ADDRESS, EVENT_TITLE, PAYMENT_DUE_DATE, DIRECT_PAYMENT_URL } = config;

// relies on passing order as prop to ensure is updated
export const Receipt = ({ order, paymentMethod, person, isPurchaser }: {
  order: Order;
  paymentMethod: string;
  person?: Person;
  isPurchaser: boolean;
}) => {
  useScrollToTop();

  const data = {
    FIRST_NAME: order.people[0].first,
    IS_CHECK_PAYMENT: paymentMethod === 'check',
    IS_ELECTRONIC_PAYMENT: paymentMethod !== 'check',
    IS_DEPOSIT: order.deposit > 0,
    AMOUNT_PAID: formatCurrency(order.charged!),
    DEPOSIT_TOTAL: order.deposit,
    ORDER_TOTAL: formatCurrency(order.total!),
    SHOW_CHECK_ADDRESS,
    CHECK_TO,
    CHECK_ADDRESS: CHECK_ADDRESS.join(', '),
    EVENT_TITLE,
    PAYMENT_DUE_DATE,
    DIRECT_PAYMENT_URL
  };

  const template = isPurchaser ? purchaserTemplate : additionalPersonTemplate;
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
