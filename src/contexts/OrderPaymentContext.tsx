import { createContext, useContext, useState, useEffect } from 'react';
import { cache, cached } from 'utils';
import { config } from 'config';
import type { ReactNode } from 'react';

const { PAYMENT_METHODS, WAITLIST_MODE } = config;

type PaymentMethod = 'stripe' | 'paypal' | 'waitlist' | 'check';

type OrderPaymentContextType = {
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  amountToCharge: number | null;
  setAmountToCharge: (amount: number | null) => void;
  electronicPaymentDetails: { id: string | null; clientSecret: string | null };
  setElectronicPaymentDetails: (details: { id: string | null; clientSecret: string | null }) => void;
};

const OrderPaymentContext = createContext<OrderPaymentContextType | null>(null);

export const OrderPaymentProvider = ({ children }: { children: ReactNode }) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(WAITLIST_MODE ? 'waitlist' : PAYMENT_METHODS[0] as PaymentMethod);
  const [amountToCharge, setAmountToCharge] = useState<number | null>(null);
  const [electronicPaymentDetails, setElectronicPaymentDetails] = useState(cached('electronicPaymentDetails') || { id: null, clientSecret: null });

  useEffect(() => { cache('electronicPaymentDetails', electronicPaymentDetails) }, [electronicPaymentDetails]);

  return (
    <OrderPaymentContext.Provider value={{
      paymentMethod, setPaymentMethod,
      amountToCharge, setAmountToCharge,
      electronicPaymentDetails, setElectronicPaymentDetails
    }}>
      {children}
    </OrderPaymentContext.Provider>
  );
};

export const useOrderPayment = () => {
  const context = useContext(OrderPaymentContext);
  if (context === null) {
    throw new Error('useOrderPayment must be used within an OrderPaymentProvider');
  }
  return context;
};
