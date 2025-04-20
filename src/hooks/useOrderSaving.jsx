import { useState, useCallback } from 'react';
import { useOrder } from 'hooks/useOrder';
import { firebaseFunctionDispatcher } from 'src/firebase.jsx';
import { log, logError } from 'src/logger';
import { config } from 'config';
const { TECH_CONTACT } = config;

export class OrderSavingError extends Error {
  constructor(message, { email, error }) {
    super(message);
    this.email = email;
    this.error = error;
  }
}

export const useOrderSaving = () => {
  const { order, orderId, setOrderId, setError } = useOrder();
  const [isSaving, setIsSaving] = useState(false);

  const savePendingOrder = useCallback(async () => {
    setIsSaving(true);
    setError(null);
    const { email } = order.people[0];
    log('Saving pending order', { email, orderId, order });

    try {
      const { data: { id } } = await firebaseFunctionDispatcher({
        action: 'savePendingOrder',
        data: { orderId, order }
      });

      if (!id) throw new Error('Missing orderId from Firestore.');
      setOrderId(id);
      log('Pending order saved', { email, id });
      setIsSaving(false);
      return id;
    } catch (error) {
      logError('Error saving pending order', { email, error, userAgent: navigator.userAgent });
      setError(
        <>
          We're sorry, but we experienced an issue saving your order:<br />
          Error saving pending order.<br />
          You were not charged.<br />
          Please try again or contact {TECH_CONTACT} for assistance.
        </>
      );
      setIsSaving(false);
      throw new OrderSavingError('Error saving pending order', { email, error });
    }
  }, [order, orderId, setOrderId, setError]);

  return { savePendingOrder, isSaving };
};
