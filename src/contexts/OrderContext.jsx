import { createContext, useState, useReducer, useEffect, useCallback } from 'react';
import { cache, cached } from 'utils';
import { config } from 'config';
const { getOrderDefaults, PAYMENT_METHODS, WAITLIST_MODE } = config;

export const OrderContext = createContext();

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
  const [receipt, setReceipt] = useState(cached('receipt') || null);

  const updateOrder = useCallback((updates) => dispatch({ type: 'UPDATE_ORDER', payload: updates }), []);

  useEffect(() => { cache('order', order) }, [order]);
  useEffect(() => { cache('orderId', orderId) }, [orderId]);
  useEffect(() => { cache('electronicPaymentDetails', electronicPaymentDetails) }, [electronicPaymentDetails]);
  useEffect(() => { cache('currentPage', currentPage) }, [currentPage]);
  useEffect(() => { cache('receipt', receipt) }, [receipt]);

  const value = {
    order, updateOrder,
    orderId, setOrderId,
    currentPage, setCurrentPage,
    processing, setProcessing,
    processingMessage, setProcessingMessage,
    error, setError,
    paymentMethod, setPaymentMethod,
    amountToCharge, setAmountToCharge,
    electronicPaymentDetails, setElectronicPaymentDetails,
    receipt, setReceipt
  };
  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
};
