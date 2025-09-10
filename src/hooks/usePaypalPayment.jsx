import { useRef } from 'react';
import { logInfo, logError } from 'src/logger';
import { firebaseFunctionDispatcher } from 'src/firebase.jsx';

export const usePaypalPayment = ({ order, id: paymentIntentId }) => {
	const { email } = order.people[0];
	const idempotencyKeyRef = useRef(crypto.randomUUID());

	const processPayment = async () => {
		logInfo('Capturing PayPal payment', { email, order });
		try {
			const { data } = await firebaseFunctionDispatcher({
				action: 'capturePaypalOrder',
				email,
				data: {
					id: paymentIntentId,
					idempotencyKey: idempotencyKeyRef.current,
				}
			});

      validatePaymentResponse(data);

			const { id: paymentId, email: paymentEmail, amount } = data;
			logInfo('Payment captured', { email, paymentEmail, paymentId, amount });
      idempotencyKeyRef.current = crypto.randomUUID(); // reset after successful order creation
			return { paymentId, paymentEmail, amount: Number(amount) };
		} catch (error) {
			idempotencyKeyRef.current = crypto.randomUUID(); // reset after failure as well, since user may change order
			logError('PayPal process payment error', { email, error });
			throw error; // rethrow HttpsError from backend or other error to be handled by PaypalCheckout component
		}
	};
  return { processPayment };
}


// ===== Helpers =====

const validatePaymentResponse = (data) => {
  if (!data) throw new Error('No data returned from capturePaypalOrder');
  if (!data.id || !data.amount) throw new Error('Missing payment ID or amount from capturePaypalOrder');
};