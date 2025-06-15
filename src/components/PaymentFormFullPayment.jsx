import { PaymentFormSlidingScale } from './PaymentFormSlidingScale';
import { PaymentFormFixedCost } from './PaymentFormFixedCost';
import { config } from 'config';
const { ADMISSION_COST_RANGE } = config;

const isSlidingScale = ADMISSION_COST_RANGE[0] < ADMISSION_COST_RANGE[1];

export const PaymentFormFullPayment = ({ order }) => {
  return (
    isSlidingScale ?
      <PaymentFormSlidingScale people={order.people} />
      :
      <PaymentFormFixedCost numPeople={order.people.length} />
  );
};
