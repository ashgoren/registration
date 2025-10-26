import { useCallback } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { logInfo, logError } from 'src/logger';
import { firebaseFunctionDispatcher } from 'src/firebase.jsx';
import { useOrderData } from 'contexts/OrderDataContext';
import { useOrderPayment } from 'contexts/OrderPaymentContext';
import { Receipt } from 'components/Receipt';
import type { Order } from 'types/order';

export const useOrderFinalization = () => {
  const { orderId, order, setReceipt } = useOrderData();
  const { paymentMethod } = useOrderPayment();

  const finalizeOrder = useCallback(async () => {
    const appendReceiptsToOrder = (order: Order) => {
      const peopleWithReceipts = order.people.map((person, i) => {
        const isPurchaser = i === 0;
        const receipt = <Receipt order={order} paymentMethod={paymentMethod} person={person} isPurchaser={isPurchaser} />;
        const htmlReceipt = renderToStaticMarkup(receipt);
        if (isPurchaser) setReceipt(htmlReceipt); // for displaying on confirmation page
        return { ...person, receipt: htmlReceipt };
      });
      return { ...order, people: peopleWithReceipts };
    };

    const saveFinalOrderToFirebase = async (order: Order) => {
      const { email } = order.people[0] as { email: string }; // for logging
      logInfo('Saving final order to firebase', { email });
      try {
        await firebaseFunctionDispatcher({
          action: 'saveFinalOrder',
          data: { orderId, order },
          email
        });
        logInfo('Final order saved', { email });
      } catch (error) {
        logError('Error saving final order to firebase', { email, error, order });
        throw error;
      }
    };

    const finalOrder = order.paymentId === 'waitlist' ? order : appendReceiptsToOrder(order);
    await saveFinalOrderToFirebase(finalOrder);
  }, [orderId, order, paymentMethod, setReceipt]);

  return { finalizeOrder };
};
