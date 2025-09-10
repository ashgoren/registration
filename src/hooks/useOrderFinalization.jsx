import { useCallback } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { logInfo, logError } from 'src/logger';
import { firebaseFunctionDispatcher } from 'src/firebase.jsx';
import { useOrder } from 'hooks/useOrder';
import { Receipt } from 'components/Receipt';

export const useOrderFinalization = () => {
  const { orderId, order, paymentMethod, setReceipt } = useOrder();

  const finalizeOrder = useCallback(async () => {
    const appendReceiptsToOrder = (order) => {
      const peopleWithReceipts = order.people.map((person, i) => {
        const isPurchaser = i === 0;
        const receipt = <Receipt order={order} paymentMethod={paymentMethod} person={person} isPurchaser={isPurchaser} />;
        const htmlReceipt = renderToStaticMarkup(receipt);
        if (isPurchaser) setReceipt(htmlReceipt); // for displaying on confirmation page
        return { ...person, receipt: htmlReceipt };
      });
      return { ...order, people: peopleWithReceipts };
    };

    const saveFinalOrderToFirebase = async (order) => {
      const { email } = order.people[0]; // for logging
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
