import { createContext, useContext, useState, useReducer, useEffect, useCallback } from 'react';
import { cache, cached } from 'utils';
import { config } from 'config';
const { getOrderDefaults } = config;

const OrderDataContext = createContext();

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

export const OrderDataProvider = ({ children }) => {
  const initialOrderState = cached('order') || getOrderDefaults();
  const [order, dispatch] = useReducer(orderReducer, initialOrderState);
  const [orderId, setOrderId] = useState(cached('orderId') || null);
  const [receipt, setReceipt] = useState(cached('receipt') || null);

  const updateOrder = useCallback((updates) => dispatch({ type: 'UPDATE_ORDER', payload: updates }), []);

  useEffect(() => { cache('order', order) }, [order]);
  useEffect(() => { cache('orderId', orderId) }, [orderId]);
  useEffect(() => { cache('receipt', receipt) }, [receipt]);

  return (
    <OrderDataContext.Provider value={{
      order, updateOrder,
      orderId, setOrderId,
      receipt, setReceipt
    }}>
      {children}
    </OrderDataContext.Provider>
  );
};

export const useOrderData = () => {
  const context = useContext(OrderDataContext);
  if (context === undefined) {
    throw new Error('useOrderData must be used within an OrderDataProvider');
  }
  return context;
};
