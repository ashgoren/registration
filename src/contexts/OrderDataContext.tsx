import { createContext, useContext, useState, useReducer, useEffect, useCallback } from 'react';
import { cache, cached } from 'utils/misc';
import { config } from 'config';
import type { ReactNode } from 'react';
import type { Order } from 'types/order';

type OrderAction = { type: 'UPDATE_ORDER'; payload: Partial<Order> } | { type: 'RESET_ORDER' };

type OrderDataContextType = {
  order: Order;
  updateOrder: (updates: Partial<Order>) => void;
  orderId: string | null;
  setOrderId: (id: string | null) => void;
  receipt: string | null;
  setReceipt: (receipt: string | null) => void;
};

const OrderDataContext = createContext<OrderDataContextType | null>(null);

function orderReducer(state: Order, action: OrderAction) {
  switch (action.type) {
    case 'UPDATE_ORDER':
      return { ...state, ...action.payload };
    case 'RESET_ORDER':
      return config.fields.getOrderDefaults();
  }
}

export const OrderDataProvider = ({ children }: { children: ReactNode }) => {
  const initialOrderState = cached('order') || config.fields.getOrderDefaults();
  const [order, dispatch] = useReducer(orderReducer, initialOrderState);
  const [orderId, setOrderId] = useState<string | null>(cached('orderId') || null);
  const [receipt, setReceipt] = useState<string | null>(cached('receipt') || null);

  const updateOrder = useCallback((updates: Partial<Order>) => dispatch({ type: 'UPDATE_ORDER', payload: updates }), []);

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
  if (context === null) {
    throw new Error('useOrderData must be used within an OrderDataProvider');
  }
  return context;
};
