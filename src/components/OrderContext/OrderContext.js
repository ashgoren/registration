import { createContext, useState, useReducer, useContext, useEffect, useCallback } from 'react';
import { log, logError, logDivider } from 'logger';
import { firebaseFunctionDispatcher } from 'firebase.js';
import { renderToStaticMarkup } from 'react-dom/server';
import Receipt from 'components/Receipt';
import { cache, cached } from 'utils';
import config from 'config';
const { getOrderDefaults, PAYMENT_METHODS, TECH_CONTACT } = config;

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
  const [paymentInfo, setPaymentInfo] = useState(cached('paymentInfo') || { id: null, clientSecret: null });
  const [currentPage, setCurrentPage] = useState(cached('currentPage') || 1);
  const [processing, setProcessing] = useState(null);
  const [processingMessage, setProcessingMessage] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [error, setError] = useState(null);
  const [warmedUp, setWarmedUp] = useState(false);

  useEffect(() => { cache('order', order) }, [order]);
  useEffect(() => { cache('paymentInfo', paymentInfo) }, [paymentInfo]);
  useEffect(() => { cache('currentPage', currentPage) }, [currentPage]);

  // wait for order to be updated before moving on to checkout page
  useEffect(() => {
    if (order.status === 'checkout') setCurrentPage('checkout');
  }, [order.status]);

  const updateOrder = useCallback((updates) => dispatch({ type: 'UPDATE_ORDER', payload: updates }), []);

  const startOver = () => {
    dispatch({ type: 'RESET_ORDER' });
    setPaymentInfo({ id: null, clientSecret: null });
    setPaymentMethod(PAYMENT_METHODS[0]);
    setProcessingMessage(null);
    setCurrentPage(1);
  }

  const value = {
    startOver,
    order, updateOrder,
    paymentInfo, setPaymentInfo,
    currentPage, setCurrentPage,
    processing, setProcessing,
    processingMessage, setProcessingMessage,
    error, setError,
    paymentMethod, setPaymentMethod,
    warmedUp, setWarmedUp
  };
  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
};

export const useOrder = () => useContext(OrderContext);

export const useOrderOperations = () => {
  const { order, updateOrder, paymentMethod, setError, setProcessingMessage } = useOrder();
  const { email } = order.people[0]; // for logging

  const prepOrderForFirebase = () => {
    const updates = {
      people: order.people.map(updateApartment).map(updatePhoto),
      paymentMethod,
      paymentId: 'PENDING',
      status: 'pendingInitialSave'
    };
    updateOrder(updates);
    return { ...order, ...updates };
  };

  const savePendingOrderToFirebase = async (order) => {
    setProcessingMessage('Saving registration...');
    log('Saving pending order to firebase', { email, order });
    try {
      await firebaseFunctionDispatcher({
        action: 'savePendingOrder',
        data: order,
        email
      });
      log('Pending order saved', { email });
      return true;
    } catch (error) {
      logError('Error saving pending order to firebase', { email, error, userAgent: navigator.userAgent });
      setError(`We're sorry, but we experienced an issue saving your registration. You have not been charged. If you use the uBlock origin extension, try disabling it for this page. You can also try reloading the page. If that doesn't work, please close this tab and start over. If this error persists, please contact ${TECH_CONTACT}.`);
      return false;
    }
  };

  const saveFinalOrderToFirebase = async (order) => {
    log('Saving final order to firebase', { email });
    setProcessingMessage(order.paymentId === 'check' || order.paymentMethod === 'waitlist'
      ? 'Updating registration...'
      : 'Payment successful. Updating registration...'
    );
    try {
      await firebaseFunctionDispatcher({
        action: 'saveFinalOrder',
        data: { ...order, status: 'final' },
        email
      });
      log('Final order saved', { email });
      setTimeout(() => logDivider(), 1000);
      return true;
    } catch (error) {
      logError('Error saving final order to firebase', { email, error, order });
      setError(`Your payment was processed successfully. However, we encountered an error updating your registration. Please contact ${TECH_CONTACT}.`);
      return false;
    }
  };

  // fire-and-forget
  const sendReceipts = (order) => {
    setProcessingMessage('Sending email confirmation...');
    const emailReceiptPairs = generateReceipts({ order });
    firebaseFunctionDispatcher({
      action: 'sendEmailConfirmations',
      data: emailReceiptPairs,
      email
    });
  };

  return { prepOrderForFirebase, savePendingOrderToFirebase, saveFinalOrderToFirebase, sendReceipts };
};

function updateApartment(person) {
  return (person.apartment && /^\d/.test(person.apartment)) ? { ...person, apartment: `#${person.apartment}` } : person;
}

function updatePhoto(person) {
  return person.photo === 'Other' ? { ...person, photo: person.photoComments } : person;
}

function generateReceipts({ order }) {
  return order.people.map((person, i) => {
    const receipt = <Receipt order={order} person={person} isPurchaser={i === 0} />;
    return {
      email: person.email,
      receipt: renderToStaticMarkup(receipt)
    };
  });
}
