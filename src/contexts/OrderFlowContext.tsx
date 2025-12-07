import { createContext, useContext, useState, useEffect } from 'react';
import { cache, cached } from 'utils/misc';
import type { ReactNode } from 'react';

type OrderFlowContextType = {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  processing: boolean;
  setProcessing: (processing: boolean) => void;
  processingMessage: string | null;
  setProcessingMessage: (message: string | null) => void;
  error: string | ReactNode | null;
  setError: (error: string | ReactNode | null) => void;
  waitlistThresholdReached: boolean;
  setWaitlistThresholdReached: (reached: boolean) => void;
  showNavButtons: boolean;
  setShowNavButtons: (show: boolean) => void;
};

const OrderFlowContext = createContext<OrderFlowContextType | null>(null);

export const OrderFlowProvider = ({ children }: { children: ReactNode }) => {
  const [currentPage, setCurrentPage] = useState<string>(cached('currentPage') || 'people');
  const [processing, setProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | ReactNode | null>(null);
  const [waitlistThresholdReached, setWaitlistThresholdReached] = useState(false);
  const [showNavButtons, setShowNavButtons] = useState(true);

  useEffect(() => { cache('currentPage', currentPage) }, [currentPage]);

  return (
    <OrderFlowContext.Provider value={{
      currentPage, setCurrentPage,
      processing, setProcessing,
      processingMessage, setProcessingMessage,
      error, setError,
      waitlistThresholdReached, setWaitlistThresholdReached,
      showNavButtons, setShowNavButtons,
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
