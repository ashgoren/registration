import { createContext, useContext, useState, useEffect } from 'react';
import { cache, cached } from 'utils';

const OrderFlowContext = createContext();

export const OrderFlowProvider = ({ children }) => {
  const [currentPage, setCurrentPage] = useState(cached('currentPage') || 1);
  const [processing, setProcessing] = useState(null);
  const [processingMessage, setProcessingMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => { cache('currentPage', currentPage) }, [currentPage]);

  return (
    <OrderFlowContext.Provider value={{
      currentPage, setCurrentPage,
      processing, setProcessing,
      processingMessage, setProcessingMessage,
      error, setError
    }}>
      {children}
    </OrderFlowContext.Provider>
  );
};

export const useOrderFlow = () => {
  const context = useContext(OrderFlowContext);
  if (context === undefined) {
    throw new Error('useOrderFlow must be used within an OrderFlowProvider');
  }
  return context;
};
