import { createContext, useState, useReducer, useEffect, useCallback } from 'react';
import { cache, cached } from 'src/utils';
import { config } from 'src/config';
import type { ReactNode } from 'react';
const { getOrderDefaults, PAYMENT_METHODS, WAITLIST_MODE } = config;

export const OrderContext = createContext(null);

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

export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const initialOrderState = cached('order') || getOrderDefaults();
  const [order, dispatch] = useReducer(orderReducer, initialOrderState);
  const [orderId, setOrderId] = useState<string | null>(cached('orderId') || null);
  const [amountToCharge, setAmountToCharge] = useState<number | null>(null);
  const [electronicPaymentDetails, setElectronicPaymentDetails] = useState<{ id: string | null; clientSecret: string | null; }>(cached('electronicPaymentDetails') || { id: null, clientSecret: null });
  const [currentPage, setCurrentPage] = useState<number | string>(cached('currentPage') || 1);
  const [processing, setProcessing] = useState<boolean>(false);
  const [processingMessage, setProcessingMessage] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>(WAITLIST_MODE ? 'waitlist' : PAYMENT_METHODS[0]);
  const [error, setError] = useState<string | null>(null);
  const [warmedUp, setWarmedUp] = useState<boolean>(false);
  const [receipt, setReceipt] = useState<string | null>(cached('receipt') || null);

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
    warmedUp, setWarmedUp,
    amountToCharge, setAmountToCharge,
    electronicPaymentDetails, setElectronicPaymentDetails,
    receipt, setReceipt
  };
  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
};
