import { PaymentFormSlidingScale } from './PaymentFormSlidingScale';
import { PaymentFormFixedCost } from './PaymentFormFixedCost';
import { PaymentFormOptions } from './PaymentFormOptions';
import { config } from 'config';
import type { Order } from '@registration/types';

export const PaymentFormFullPayment = ({ order }: { order: Order }) => {
  if (config.admissions.mode === 'fixed') {
    return <PaymentFormFixedCost numPeople={order.people.length} />;
  } else if (config.admissions.mode === 'sliding-scale') {
    return <PaymentFormSlidingScale people={order.people} />;
  } else if (config.admissions.mode === 'tiered') {
    return <PaymentFormOptions people={order.people} />;
  }
};
