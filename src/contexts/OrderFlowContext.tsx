import { createContext, useContext, useState, useEffect } from 'react';
import { cache, cached } from 'utils/misc';
import type { ReactNode } from 'react';

type OrderFlowContextType = {
  furthestPageReached: string;
  setFurthestPageReached: (page: string) => void;
  processing: boolean;
  setProcessing: (processing: boolean) => void;
  processingMessage: string | null;
  setProcessingMessage: (message: string | null) => void;
  error: string | ReactNode | null;
  setError: (error: string | ReactNode | null) => void;
  isNavigating: boolean;
  setIsNavigating: (navigating: boolean) => void;
};

const OrderFlowContext = createContext<OrderFlowContextType | null>(null);

export const OrderFlowProvider = ({ children }: { children: ReactNode }) => {
  const [furthestPageReached, setFurthestPageReached] = useState<string>(cached('furthestPageReached') || 'people');
  const [processing, setProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | ReactNode | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => { cache('furthestPageReached', furthestPageReached) }, [furthestPageReached]);

  return (
    <OrderFlowContext.Provider value={{
      furthestPageReached, setFurthestPageReached,
      processing, setProcessing,
      processingMessage, setProcessingMessage,
      error, setError,
      isNavigating, setIsNavigating
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
