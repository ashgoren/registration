import { useState, useCallback } from 'react';
import { logInfo, logError } from 'src/logger';
import * as api from 'src/firebase';
import { useOrderData } from 'contexts/OrderDataContext';
import { useOrderPayment } from 'contexts/OrderPaymentContext';
import { config } from 'config';
import type { PaymentMethod, ElectronicPaymentMethod } from 'types/payment';
import type { FirebaseFunctionReturn } from 'src/firebase';

const { EVENT_TITLE_WITH_YEAR, ENV } = config;

export const usePaymentInitialization = () => {
  const { order } = useOrderData();
  const { paymentMethod, electronicPaymentDetails, setElectronicPaymentDetails, setAmountToCharge } = useOrderPayment();
  const [isInitializing, setIsInitializing] = useState(false);

  const initializePayment = useCallback(async () => {

    // Early return for check/waitlist since no payment init needed
    if (!isElectronicPayment(paymentMethod)) {
      setAmountToCharge(order.total);
      return;
    }

    setIsInitializing(true);
    const { email } = order.people[0]; // for logging
    logInfo('Initializing payment', { email, order });
    setAmountToCharge(null);

    const idempotencyKey = crypto.randomUUID(); // generate a new idempotency key for each call

    try {
      const data = await api.initializePayment({
        order,
        paymentId: electronicPaymentDetails?.id, // pass existing payment intent id; null for new orders
        paymentMethod: paymentMethod as ElectronicPaymentMethod,
        idempotencyKey,
        description: ENV === 'prd' ? EVENT_TITLE_WITH_YEAR : `${EVENT_TITLE_WITH_YEAR} - ${ENV}`,
        email
      });

      validatePaymentResponse({ data, paymentMethod, peopleCount: order.people.length });

      const { amount, id, clientSecret } = data;
      setElectronicPaymentDetails({ id, clientSecret }); // save for payment updates and/or capture
      setAmountToCharge(amount); // display total from payment intent

      logInfo('Payment initialized', { id });
      setIsInitializing(false);
    } catch (error) {
      logError('Error initializing payment', { email, error, userAgent: navigator.userAgent });
      setIsInitializing(false);
      throw error; // re-throw HttpsError from backend or other error to be handled by Checkout component
    }
  }, [order, paymentMethod, electronicPaymentDetails, setElectronicPaymentDetails, setAmountToCharge]);

  return { initializePayment, isInitializing };
};

// ===== Helpers =====

const PAYMENT_VALIDATION_RULES = {
  stripe: {
    requiredFields: ['amount', 'id', 'clientSecret'],
    validateAmount: true
  },
  paypal: {
    requiredFields: ['amount', 'id'],
    validateAmount: true
  }
} as const;

const validatePaymentResponse = ({ data, paymentMethod, peopleCount }: {
  data: FirebaseFunctionReturn['initializePayment'];
  paymentMethod: ElectronicPaymentMethod;
  peopleCount: number
}): void => {
  const { requiredFields, validateAmount } = PAYMENT_VALIDATION_RULES[paymentMethod];
  for (const field of requiredFields) {
    if (!data[field]) throw new Error(`Missing ${field} from payment processor`);
  }
  if (validateAmount && data.amount > 999 * peopleCount) {
    throw new Error('out-of-range');
  }
};

const isElectronicPayment = (paymentMethod: PaymentMethod): paymentMethod is ElectronicPaymentMethod => ['stripe', 'paypal'].includes(paymentMethod);
