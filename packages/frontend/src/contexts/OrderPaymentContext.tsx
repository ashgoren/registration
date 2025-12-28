import { createContext, useContext, useState, useEffect } from 'react';
import { cache, cached } from 'utils/misc';
import { config } from 'config';
import type { ReactNode } from 'react';
import type { PaymentMethod, ElectronicPaymentDetails } from '@registration/types';

type OrderPaymentContextType = {
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  amountToCharge: number | null;
  setAmountToCharge: (amount: number | null) => void;
  electronicPaymentDetails: ElectronicPaymentDetails;
  setElectronicPaymentDetails: (details: ElectronicPaymentDetails) => void;
};

const OrderPaymentContext = createContext<OrderPaymentContextType | null>(null);

export const OrderPaymentProvider = ({ children }: { children: ReactNode }) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(config.registration.waitlistMode ? 'waitlist' : config.payments.methods[0] as PaymentMethod);
  const [amountToCharge, setAmountToCharge] = useState<number | null>(null);
  const [electronicPaymentDetails, setElectronicPaymentDetails] = useState<ElectronicPaymentDetails>(cached('electronicPaymentDetails') || { id: null, clientSecret: null });

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
