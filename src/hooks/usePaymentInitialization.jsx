import { useState, useCallback } from 'react';
import { log, logError } from 'src/logger';
import { firebaseFunctionDispatcher } from 'src/firebase.jsx';
import { useOrder } from 'hooks/useOrder';
import { config } from 'config';
const { EVENT_TITLE, ENV } = config;

export const usePaymentInitialization = () => {
  const { order, paymentMethod, electronicPaymentDetails, setElectronicPaymentDetails, setAmountToCharge } = useOrder();
  const [isInitializing, setIsInitializing] = useState(false);

  const initializePayment = useCallback(async () => {

    // Early return for check/waitlist since no payment init needed
    if (!isElectronicPayment(paymentMethod)) {
      setAmountToCharge(order.total);
      return;
    }

    setIsInitializing(true);
    const { email } = order.people[0]; // for logging
    log('Initializing payment', { email, order });
    setAmountToCharge(null);

    const idempotencyKey = crypto.randomUUID(); // generate a new idempotency key for each call

    try {
      const { data } = await firebaseFunctionDispatcher({
        action: 'initializePayment',
        email,
        data: {
          order,
          paymentId: electronicPaymentDetails?.id, // pass existing payment intent id; null for new orders
          paymentMethod,
          idempotencyKey,
          description: ENV === 'prd' ? EVENT_TITLE : `${EVENT_TITLE} - ${ENV}`
        }
      });

      validatePaymentResponse({ data, paymentMethod, peopleCount: order.people.length });

      const { amount, id, clientSecret } = data;
      setElectronicPaymentDetails({ id, clientSecret }); // save for payment updates and/or capture
      setAmountToCharge(amount); // display total from payment intent

      log('Payment initialized', { id });
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
};

/**
 * @param {Object} data - Response data from payment processor
 * @param {string} paymentMethod - Payment method (stripe/paypal/check/waitlist)
 * @param {number} peopleCount - Number of people in the order
 * @throws {Error} - If required fields are missing or amount is out of range
 * @returns {void}
 */
const validatePaymentResponse = ({ data, paymentMethod, peopleCount }) => {
  const { requiredFields, validateAmount } = PAYMENT_VALIDATION_RULES[paymentMethod];
  for (const field of requiredFields) {
    if (!data[field]) throw new Error(`Missing ${field} from payment processor`);
  }
  if (validateAmount && data.amount > 999 * peopleCount) {
    throw new Error('out-of-range');
  }
};

const isElectronicPayment = (paymentMethod) => ['stripe', 'paypal'].includes(paymentMethod);
