import { createContext, useContext, useState, useEffect } from 'react';
import { cache, cached } from 'utils';
import type { ReactNode } from 'react';

type OrderFlowContextType = {
  currentPage: number | string;
  setCurrentPage: (page: number | string) => void;
  processing: boolean | null;
  setProcessing: (processing: boolean | null) => void;
  processingMessage: string | null;
  setProcessingMessage: (message: string | null) => void;
  error: string | ReactNode | null;
  setError: (error: string | ReactNode | null) => void;
};

const OrderFlowContext = createContext<OrderFlowContextType | null>(null);

export const OrderFlowProvider = ({ children }: { children: ReactNode }) => {
  const [currentPage, setCurrentPage] = useState<number | string>(cached('currentPage') || 1);
  const [processing, setProcessing] = useState<boolean | null>(null);
  const [processingMessage, setProcessingMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | ReactNode | null>(null);

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
  if (context === null) {
    throw new Error('useOrderFlow must be used within an OrderFlowProvider');
  }
  return context;
};
