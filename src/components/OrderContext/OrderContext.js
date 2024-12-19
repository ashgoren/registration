import { createContext, useState, useReducer, useContext, useEffect, useCallback, useRef } from 'react';
import { log, logError, logDivider } from 'logger';
import { firebaseFunctionDispatcher } from 'firebase.js';
import { renderToStaticMarkup } from 'react-dom/server';
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
  useEffect(() => { cache('amountToCharge', amountToCharge) }, [amountToCharge]);
  useEffect(() => { cache('electronicPaymentDetails', electronicPaymentDetails) }, [electronicPaymentDetails]);
  useEffect(() => { cache('currentPage', currentPage) }, [currentPage]);

  const startOver = () => {
    dispatch({ type: 'RESET_ORDER' });
    setAmountToCharge(null);
    setElectronicPaymentDetails({ id: null, clientSecret: null });
    setPaymentMethod(WAITLIST_MODE ? 'waitlist' : PAYMENT_METHODS[0]);
    setProcessingMessage(null);
    setCurrentPage(1);
  }

  const value = {
    startOver,
    order, updateOrder,
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

export const useOrderOperations = () => {
  const { order, setProcessingMessage, paymentMethod, electronicPaymentDetails, setElectronicPaymentDetails, setAmountToCharge } = useOrder();
  const { email } = order.people[0]; // for logging
  const idempotencyKeyRef = useRef(crypto.randomUUID());

  const savePendingOrderAndInitializePayment = useCallback(async () => {
    log('Saving pending order and initializing payment', { email, order });

    try {
      const data = await initializeOrderWithPayment({
        order,
        paymentId: electronicPaymentDetails.id, // pass existing electronic payment intent id; null for new orders
        paymentMethod,
        idempotencyKey: idempotencyKeyRef.current
      });

      validatePaymentResponse({ data, paymentMethod, peopleCount: order.people.length });

      const { amount, id, clientSecret } = data;
      if (isElectronicPayment(paymentMethod)) {
        setElectronicPaymentDetails({ id, clientSecret }); // save for payment updates and/or capture
        setAmountToCharge(amount); // display total from payment intent
        log('Pending order saved and payment initialized', { email });
      } else {
        setAmountToCharge(amount);
        log('Pending order saved; no payment processing', { email });
      }

      idempotencyKeyRef.current = crypto.randomUUID(); // reset after successful order creation
    } catch (error) {
      logError('Error saving pending order and initializing payment', {
        email,
        error,
        userAgent: navigator.userAgent
      });
      idempotencyKeyRef.current = crypto.randomUUID(); // reset after failure as well, since user may change order
      throw error;
    }
  }, [order, email, paymentMethod, electronicPaymentDetails.id, setElectronicPaymentDetails, setAmountToCharge]);

  const saveFinalOrderToFirebase = async (order) => {
    log('Saving final order to firebase', { email });
    setProcessingMessage(paymentMethod === 'check' || paymentMethod === 'waitlist'
      ? 'Updating registration...'
      : 'Payment successful. Updating registration...'
    );
    try {
      await firebaseFunctionDispatcher({
        action: 'saveFinalOrder',
        data: order,
        email
      });
      log('Final order saved', { email });
      setTimeout(() => logDivider(), 1000);
    } catch (error) {
      logError('Error saving final order to firebase', { email, error, order });
      throw error;
      // setError(`Your payment was processed successfully. However, we encountered an error updating your registration. Please contact ${TECH_CONTACT}.`);
      // return false;
    }
  };

  // fire-and-forget
  const sendReceipts = (order) => {
    setProcessingMessage('Sending email confirmation...');
    const emailReceiptPairs = generateReceipts({ order, paymentMethod });
    firebaseFunctionDispatcher({
      action: 'sendEmailConfirmations',
      data: emailReceiptPairs,
      email
    });
  };

  return { savePendingOrderAndInitializePayment, saveFinalOrderToFirebase, sendReceipts };
};

function generateReceipts({ order, paymentMethod }) {
  return order.people.map((person, i) => {
    const receipt = <Receipt order={order} paymentMethod={paymentMethod} person={person} isPurchaser={i === 0} />;
    return {
      email: person.email,
      receipt: renderToStaticMarkup(receipt)
    };
  });
}


// ===== Helpers =====

/**
 * @param {Object} order - Order object
 * @param {string} paymentId - Payment ID from payment processor previously stored in state, or null for new orders
 * @param {string} paymentMethod - Payment method (stripe/paypal/check/waitlist)
 * @param {string} idempotencyKey - Unique key to prevent duplicate orders
 * @returns {Object} Payment details object containing:
 *  - {number} amount: Total returned from payment processor to show user before they click pay
 *  - {string|null} id: Payment intent ID (for electronic payments)
 *  - {string|null} clientSecret: Required for Stripe front-end payment capture
 */
const initializeOrderWithPayment = async ({ order, paymentId, paymentMethod, idempotencyKey }) => {
  const { data } = await firebaseFunctionDispatcher({
    action: 'initializeOrder',
    email: order.people[0].email,
    data: {
      order,
      paymentId,
      paymentMethod,
      idempotencyKey,
      description: EVENT_TITLE
    }
  });
  return data;
};

const PAYMENT_VALIDATION_RULES = {
  stripe: {
    requiredFields: ['amount', 'id', 'clientSecret'],
    validateAmount: true
  },
  paypal: {
    requiredFields: ['amount', 'id'],
    validateAmount: true
  },
  check: {
    requiredFields: ['amount'],
    validateAmount: false
  },
  waitlist: {
    requiredFields: [],
    validateAmount: false
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
