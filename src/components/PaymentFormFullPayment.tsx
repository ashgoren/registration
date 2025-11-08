import { PaymentFormSlidingScale } from './PaymentFormSlidingScale';
import { PaymentFormFixedCost } from './PaymentFormFixedCost';
import { PaymentFormOptions } from './PaymentFormOptions';
import { config } from 'config';
import type { Order } from 'types/order';

const { ADMISSIONS_MODE } = config;

export const PaymentFormFullPayment = ({ order }: { order: Order }) => {
  if (ADMISSIONS_MODE === 'fixed') {
    return <PaymentFormFixedCost numPeople={order.people.length} />;
  } else if (ADMISSIONS_MODE === 'sliding-scale') {
    return <PaymentFormSlidingScale people={order.people} />;
  } else if (ADMISSIONS_MODE === 'tiered') {
    return <PaymentFormOptions people={order.people} />;
  }
};
