import { useRef } from 'react';
import { log, logError } from 'src/logger';
import { firebaseFunctionDispatcher } from 'src/firebase.jsx';

export const usePaypalPayment = ({ order, id: paymentIntentId }) => {
	const { email } = order.people[0];
	const idempotencyKeyRef = useRef(crypto.randomUUID());

	const processPayment = async () => {
		log('Capturing PayPal payment', { email, order });
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

			const { id, amount } = data;

			log('Payment captured', { email, paymentId: id, amount });
      idempotencyKeyRef.current = crypto.randomUUID(); // reset after successful order creation
			return { id, amount: Number(amount) };
		} catch (error) {
			idempotencyKeyRef.current = crypto.randomUUID(); // reset after failure as well, since user may change order
			logError('PayPal process payment error', { email, error });
			throw new PaymentError(error.message, 'PAYMENT_PROCESS_ERROR');
		}
	};
  return { processPayment };
}


// ===== Helpers =====

class PaymentError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

const validatePaymentResponse = (data) => {
  if (!data) throw new Error('No data returned from payment capturePaypalOrder');

  if (!data.id || !data.amount) {
    throw new Error('Missing payment ID or amount from capturePaypalOrder');
  }
}