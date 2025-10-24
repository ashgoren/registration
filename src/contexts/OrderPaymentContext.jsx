import { createContext, useContext, useState, useEffect } from 'react';
import { cache, cached } from 'utils';
import { config } from 'config';
const { PAYMENT_METHODS, WAITLIST_MODE } = config;

const OrderPaymentContext = createContext();

export const OrderPaymentProvider = ({ children }) => {
  const [paymentMethod, setPaymentMethod] = useState(WAITLIST_MODE ? 'waitlist' : PAYMENT_METHODS[0]);
  const [amountToCharge, setAmountToCharge] = useState(null);
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
  if (context === undefined) {
    throw new Error('useOrderPayment must be used within an OrderPaymentProvider');
  }
  return context;
};
