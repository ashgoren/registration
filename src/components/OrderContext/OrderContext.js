import 'firebase.js'; // initializes firebase
import { createContext, useState, useReducer, useContext, useEffect, useCallback } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { renderToStaticMarkup } from 'react-dom/server';
import Receipt from 'components/Receipt';
import { cache, cached } from 'utils';
import config from 'config';
const { getOrderDefaults, PAYMENT_METHODS, TECH_CONTACT } = config;
const functions = getFunctions();
const firebaseFunctionDispatcher = httpsCallable(functions, 'firebaseFunctionDispatcher');

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
  const [paymentIntentId, setPaymentIntentId] = useState(cached('paymentIntentId'));
  const [currentPage, setCurrentPage] = useState(cached('currentPage') || 1);
  const [processing, setProcessing] = useState(null);
  const [processingMessage, setProcessingMessage] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [error, setError] = useState(null);
  const [warmedUp, setWarmedUp] = useState(false);

  useEffect(() => { cache('order', order) }, [order]);
  useEffect(() => { cache('paymentIntentId', paymentIntentId) }, [paymentIntentId]);
  useEffect(() => { cache('currentPage', currentPage) }, [currentPage]);

  // wait for order to be updated before moving on to checkout page
  useEffect(() => {
    if (order.status === 'checkout') setCurrentPage('checkout');
  }, [order.status]);

  const updateOrder = useCallback((updates) => dispatch({ type: 'UPDATE_ORDER', payload: updates }), []);

  const startOver = () => {
    dispatch({ type: 'RESET_ORDER' });
    setPaymentIntentId(null);
    setPaymentMethod(PAYMENT_METHODS[0]);
    setProcessingMessage(null);
    setCurrentPage(1);
  }

  const value = {
    startOver,
    order, updateOrder,
    paymentIntentId, setPaymentIntentId,
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

  // fire-and-forget; save bkup in case user closes browser halfway thru payment processing
  const savePendingOrderToFirebase = (order) => {
    setProcessingMessage('Saving registration...');
    firebaseFunctionDispatcher({
      action: 'savePendingOrder',
      data: order
    });
  };

  const saveFinalOrderToFirebase = async (order) => {
    setProcessingMessage(order.paymentId === 'check' ? 'Updating registration...' : 'Payment successful. Updating registration...');
    try {
      const startTime = new Date();
      await firebaseFunctionDispatcher({
        action: 'saveFinalOrder',
        data: order
      });
      console.log('Final order saved in', new Date() - startTime, 'ms');
      return true
    } catch (err) {
      console.error(`error updating firebase record`, err);
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
      data: emailReceiptPairs
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
