import { useState, useCallback } from 'react';
import { useOrderData } from 'contexts/OrderDataContext';
import * as api from 'src/firebase';
import { logInfo, logError } from 'src/logger';

export const useOrderSaving = () => {
  const { order, orderId, setOrderId } = useOrderData();
  const [isSaving, setIsSaving] = useState(false);

  const savePendingOrder = useCallback(async () => {
    setIsSaving(true);
    const { email } = order.people[0];
    logInfo('Saving pending order', { email, orderId, order });

    try {
      const { id } = await api.savePendingOrder({ orderId, order });

      if (!id) throw new Error('Missing orderId from Firestore.');
      setOrderId(id);
      logInfo('Pending order saved', { email, id });
      setIsSaving(false);
      return id;
    } catch (error) {
      logError('Error saving pending order', { email, error, userAgent: navigator.userAgent });
      setIsSaving(false);
      throw error; // rethrow HttpsError from backend or other error to be handled by the components using this hook
    }
  }, [order, orderId, setOrderId]);

  return { savePendingOrder, isSaving };
};
