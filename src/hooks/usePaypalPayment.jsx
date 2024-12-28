import { useRef } from 'react';
import { logError } from 'src/logger';
import { firebaseFunctionDispatcher } from 'src/firebase.jsx';

export const usePaypalPayment = ({ email, id: paymentIntentId }) => {
  const idempotencyKeyRef = useRef(crypto.randomUUID());

	const processPayment = async () => {
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
  if (!data) throw new Error('No data returned');

  if (!data.id || !data.amount) {
    throw new Error('Missing payment ID or amount');
  }
}