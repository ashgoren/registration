import { useCallback } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { logInfo, logError } from 'src/logger';
import * as api from 'src/firebase';
import { useOrderData } from 'contexts/OrderDataContext';
import { useOrderPayment } from 'contexts/OrderPaymentContext';
import { Receipt } from 'components/Receipt';
import type { Order } from '@registration/types';

export const useOrderFinalization = () => {
  const { order, setReceipt } = useOrderData();
  const { paymentMethod } = useOrderPayment();

  const finalizeOrder = useCallback(async ({ orderId, paymentId, paymentEmail, charged }:
    { orderId: string; paymentId: string; paymentEmail?: string; charged: number }
  ) => {
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
      if (!orderId) {
        throw new Error('Cannot save final order: missing orderId');
      }
      const { email } = order.people[0]; // for logging
      logInfo('Saving final order to firebase', { email });
      try {
        await api.saveFinalOrder({ orderId, order });
        logInfo('Final order saved', { email });
      } catch (error) {
        logError('Error saving final order to firebase', { email, error, order });
        throw error;
      }
    };

    const updatedOrder = { ...order, orderId, charged, paymentId, ...(paymentEmail && { paymentEmail }) };
    const finalOrder = appendReceiptsToOrder(updatedOrder);
    await saveFinalOrderToFirebase(finalOrder);
  }, [order, paymentMethod, setReceipt]);

  return { finalizeOrder };
};
