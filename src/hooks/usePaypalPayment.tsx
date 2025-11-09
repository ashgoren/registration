import { useRef } from 'react';
import { logInfo, logError } from 'src/logger';
import * as api from 'src/firebase';
import type { Order } from 'types/order';

export const usePaypalPayment = ({ order, id }: {
  order: Order;
  id: string | null; // payment intent id
}) => {
	const { email } = order.people[0];
	const idempotencyKeyRef = useRef(crypto.randomUUID());

	const processPayment = async () => {
		logInfo('Capturing PayPal payment', { email, order });
		if (!id) {
			throw new Error('Missing PayPal order ID for payment capture');
		}
		try {
			const response = await api.capturePaypalOrder({
				id,
				idempotencyKey: idempotencyKeyRef.current,
				email
			});

			const {
				id: paymentId,
				email: paymentEmail,
				amount
			} = response || {};

			if (!paymentId || !amount) {
				throw new Error('Invalid payment capture response: missing payment ID or amount');
			}

			logInfo('Payment captured', { email, paymentEmail, paymentId, amount });

			return {
				paymentId,
				paymentEmail,
				amount: Number(amount)
			};

		} catch (error) {
			logError('PayPal process payment error', { email, error });
			throw error; // rethrow from backend or above to be handled by PaypalCheckout component
		} finally {
			idempotencyKeyRef.current = crypto.randomUUID(); // reset after success, but also after failure since user may change order
		}
	};

  return { processPayment };
}
