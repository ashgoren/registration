// Receipt templates are markdown files in the templates directory

import purchaserTemplate from 'templates/receipt-purchaser.md?raw';
import additionalPersonTemplate from 'templates/receipt-additional-person.md?raw';
import { Divider, Typography } from '@mui/material';
import { renderToStaticMarkup } from 'react-dom/server';
import { renderMarkdownTemplate, formatCurrency } from 'utils';
import { useScrollToTop } from 'hooks/useScrollToTop';
import { OrderSummary, PersonSummary } from 'components/OrderSummary';
import { config } from 'config';
const { CHECK_TO, CHECK_ADDRESS, EVENT_TITLE, PAYMENT_DUE_DATE, DIRECT_PAYMENT_URL } = config;

// relies on passing order as prop to ensure is updated
export const Receipt = ({ order, paymentMethod, person, isPurchaser }) => {
  useScrollToTop();

  const data = {
    FIRST_NAME: order.people[0].first,
    IS_CHECK_PAYMENT: paymentMethod === 'check',
    IS_ELECTRONIC_PAYMENT: paymentMethod !== 'check',
    IS_DEPOSIT: order.deposit > 0,
    AMOUNT_PAID: formatCurrency(order.charged),
    DEPOSIT_TOTAL: order.deposit,
    ORDER_TOTAL: formatCurrency(order.total),
    CHECK_TO,
    CHECK_ADDRESS: renderToStaticMarkup(CHECK_ADDRESS).replace(/<br\s*\/?>/g, ', '),
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
        ? <OrderSummary order={order} currentPage='confirmation' />
        : <PersonSummary person={person} />
      }
    </>
  );
};
