import { log, logError, logDivider } from 'logger';
import { firebaseFunctionDispatcher } from 'firebase.js';
import { renderToStaticMarkup } from 'react-dom/server';
import { useOrder } from 'hooks/useOrder';
import { Receipt } from 'components/Receipt';

export const useOrderFinalization = () => {
  const { orderId, order, paymentMethod } = useOrder();
  const { email } = order.people[0]; // for logging

  const finalizeOrder = async () => {
    const finalOrder = appendReceiptsToOrder(order);
    await saveFinalOrderToFirebase(finalOrder);
  };

  const appendReceiptsToOrder = (order) => {
    const peopleWithReceipts = order.people.map((person, i) => {
      const receipt = <Receipt order={order} paymentMethod={paymentMethod} person={person} isPurchaser={i === 0} />;
      const htmlReceipt = renderToStaticMarkup(receipt);
      return { ...person, receipt: htmlReceipt };
    });
    return { ...order, people: peopleWithReceipts };
  };

  const saveFinalOrderToFirebase = async (order) => {
    log('Saving final order to firebase', { email });
    try {
      await firebaseFunctionDispatcher({
        action: 'saveFinalOrder',
        data: { orderId, order },
        email
      });
      log('Final order saved', { email });
      setTimeout(() => logDivider(), 1000);
    } catch (error) {
      logError('Error saving final order to firebase', { email, error, order });
      throw error;
    }
  };

  return { finalizeOrder };
};
