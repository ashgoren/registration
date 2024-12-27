import { createContext, useState, useReducer, useContext, useEffect, useCallback, useRef } from 'react';
import { log, logError, logDivider } from 'logger';
import { firebaseFunctionDispatcher } from 'firebase.js';
import { renderToStaticMarkup } from 'react-dom/server';
import { isEqual } from 'lodash';
import Receipt from 'components/Receipt';
import { cache, cached } from 'utils';
import config from 'config';
const { getOrderDefaults, PAYMENT_METHODS, WAITLIST_MODE, EVENT_TITLE } = config;

const OrderContext = createContext();

function orderReducer(state, action) {
  switch (action.type) {
    case 'UPDATE_ORDER':
      return { ...state, ...action.payload };
    case 'RESET_ORDER':
      return getOrderDefaults();
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}

export const OrderProvider = ({ children }) => {
  const initialOrderState = cached('order') || getOrderDefaults();
  const [order, dispatch] = useReducer(orderReducer, initialOrderState);
  const [orderId, setOrderId] = useState(cached('orderId') || null);
  const [amountToCharge, setAmountToCharge] = useState(null);
  const [electronicPaymentDetails, setElectronicPaymentDetails] = useState(cached('electronicPaymentDetails') || { id: null, clientSecret: null });
  const [currentPage, setCurrentPage] = useState(cached('currentPage') || 1);
  const [processing, setProcessing] = useState(null);
  const [processingMessage, setProcessingMessage] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(WAITLIST_MODE ? 'waitlist' : PAYMENT_METHODS[0]);
  const [error, setError] = useState(null);
  const [warmedUp, setWarmedUp] = useState(false);

  const updateOrder = useCallback((updates) => dispatch({ type: 'UPDATE_ORDER', payload: updates }), []);

  useEffect(() => { cache('order', order) }, [order]);
  useEffect(() => { cache('orderId', orderId) }, [orderId]);
  useEffect(() => { cache('electronicPaymentDetails', electronicPaymentDetails) }, [electronicPaymentDetails]);
  useEffect(() => { cache('currentPage', currentPage) }, [currentPage]);

  const value = {
    order, updateOrder,
    orderId, setOrderId,
    currentPage, setCurrentPage,
    processing, setProcessing,
    processingMessage, setProcessingMessage,
    error, setError,
    paymentMethod, setPaymentMethod,
    warmedUp, setWarmedUp,
    amountToCharge, setAmountToCharge,
    electronicPaymentDetails, setElectronicPaymentDetails
  };
  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
};

export const useOrder = () => useContext(OrderContext);

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

export const useOrderFinalization = () => {
  const { orderId, order, paymentMethod } = useOrder();
  const { email } = order.people[0]; // for logging

  const finalizeOrder = async () => {
    const finalOrder = appendReceiptsToOrder(order);
    await saveFinalOrderToFirebase(finalOrder);
  };

  const appendReceiptsToOrder = (order) => {
    const peopleWithReceipts = order.people.map((person, i) => {
      const receipt = <Receipt order={order} paymentMethod={paymentMethod} person={person} isPurchaser={i === 0} />;
      const htmlReceipt = renderToStaticMarkup(receipt);
      return { ...person, receipt: htmlReceipt };
    });
    return { ...order, people: peopleWithReceipts };
  };

  const saveFinalOrderToFirebase = async (order) => {
    log('Saving final order to firebase', { email });
    try {
      await firebaseFunctionDispatcher({
        action: 'saveFinalOrder',
        data: { orderId, order },
        email
      });
      log('Final order saved', { email });
      setTimeout(() => logDivider(), 1000);
    } catch (error) {
      logError('Error saving final order to firebase', { email, error, order });
      throw error;
    }
  };

  return { finalizeOrder };
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
