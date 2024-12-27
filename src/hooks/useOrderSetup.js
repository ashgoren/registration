import { useEffect, useRef } from 'react';
import { useOrder } from 'hooks/useOrder';
import { isEqual } from 'lodash';
import { firebaseFunctionDispatcher } from 'firebase.js';
import { log, logError } from 'logger';
import config from 'config';
const { EVENT_TITLE } = config;

export const useOrderSetup = ({ onError }) => {
  const { order, orderId, setOrderId, paymentMethod, electronicPaymentDetails, setElectronicPaymentDetails, setAmountToCharge } = useOrder();
  const isInitialMount = useRef(true);
  const prevOrderRef = useRef(order);
  const prevPaymentMethodRef = useRef(paymentMethod);
  const idempotencyKeyRef = useRef(crypto.randomUUID());

  useEffect(() => {
    if (
      !isInitialMount.current
      && isEqual(prevOrderRef.current, order)
      && isEqual(prevPaymentMethodRef.current, paymentMethod)
    ) return;
    isInitialMount.current = false;
    prevOrderRef.current = order;
    prevPaymentMethodRef.current = paymentMethod;

    const initializeOrderWithPayment = async () => {
      const success = await savePendingOrder();
      if (!success) return;

      if (isElectronicPayment(paymentMethod)) {
        await InitializePayment();
      } else {
        setAmountToCharge(order.total);
      }
    };

    const savePendingOrder = async () => {
      const { email } = order.people[0]; // for logging
      log('Saving pending order', { email, orderId, order });
      try {
        const { data: { id } } = await firebaseFunctionDispatcher({
          action: 'savePendingOrder',
          data: { orderId, order }
        });
        if (!id) throw new Error('Missing orderId from Firestore');
        setOrderId(id);
        log('Pending order saved', { email, id });
        return true;
      } catch (error) {
        logError('Error saving pending order', { email, error, userAgent: USER_AGENT });
        onError('Error saving pending order');
        return false;
      }
    };

    const InitializePayment = async () => {
      const { email } = order.people[0]; // for logging
      log('Initializing payment', { email, order });
      setAmountToCharge(null);

      try {
        const { data } = await firebaseFunctionDispatcher({
          action: 'initializePayment',
          email,
          data: {
            order,
            paymentId: electronicPaymentDetails.id, // pass existing electronic payment intent id; null for new orders
            paymentMethod,
            idempotencyKey: idempotencyKeyRef.current,
            description: EVENT_TITLE
          }
        });

        validatePaymentResponse({ data, paymentMethod, peopleCount: order.people.length });

        const { amount, id, clientSecret } = data;
        setElectronicPaymentDetails({ id, clientSecret }); // save for payment updates and/or capture
        setAmountToCharge(amount); // display total from payment intent

        log('Payment initialized', { id });

        idempotencyKeyRef.current = crypto.randomUUID(); // reset after successful order creation
        return true;
      } catch (error) {
        logError('Error initializing payment', { email, error, userAgent: USER_AGENT });
        idempotencyKeyRef.current = crypto.randomUUID(); // reset after failure as well, since user may change order
        onError('Error initializing payment');
        return false;
      }
    };

    initializeOrderWithPayment();
  }, [order, orderId, setOrderId, setAmountToCharge, electronicPaymentDetails, setElectronicPaymentDetails, paymentMethod, onError]);
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

const USER_AGENT = navigator.userAgent;
