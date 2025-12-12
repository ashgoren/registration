import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { Box } from '@mui/material';
import { Loading } from 'components/layouts';
import { TestCardBox } from 'components/layouts/SharedStyles';
import { logInfo } from 'src/logger';
import { useOrderData } from 'contexts/OrderDataContext';
import { useOrderPayment } from 'contexts/OrderPaymentContext';
import { useOrderFlow } from 'contexts/OrderFlowContext';
import { useOrderSaving } from 'hooks/useOrderSaving';
import { usePaypalPayment } from 'hooks/usePaypalPayment';
import { useOrderFinalization } from 'hooks/useOrderFinalization';
import { usePageNavigation } from 'hooks/usePageNavigation';
import { logDebug } from 'src/logger';
import { config } from 'config';
const { SANDBOX_MODE, TECH_CONTACT } = config;

export const PaypalCheckout = ({ setPaying }: {
	setPaying: (paying: boolean) => void;
}) => {
	const { order, updateOrder } = useOrderData();
	const { electronicPaymentDetails: { id } } = useOrderPayment();
	const { processing, setProcessing, setError } = useOrderFlow();
	const { savePendingOrder } = useOrderSaving();
	const { processPayment } = usePaypalPayment({ order, id });
	const { finalizeOrder } = useOrderFinalization();
	const { goNext } = usePageNavigation();
	const [{ isResolved }] = usePayPalScriptReducer();

	const onClick=() => {
		setError(null);
		setPaying(true);
	};

	const onCancel=() => {
		setPaying(false);
	};

	const onError = (error: unknown) => {
		logInfo('PayPal onError', { email: order.people[0].email, error });
		setPaying(false);
		setError(`PayPal encountered an error: ${error}. Please try again or contact ${TECH_CONTACT}.`);
	};

	// when user submits payment details
	const onApprove = async () => {
		setProcessing(true);
		setError(null);

		// Step 1: save pending order
		let orderId: string;
		try {
			orderId = await savePendingOrder();
			if (!orderId) {
				throw new Error('Failed to obtain orderId after saving pending order.');
			}
			logDebug('Pending order saved successfully');
		} catch (error: unknown) { // instance of HttpsError from backend or other error from savePendingOrder
			const { code, message } = error as { code?: string; message?: string };
			setError(
				<>
					We're sorry, but we experienced an issue saving your order.<br />
					You were not charged.<br />
					Please try again or contact {TECH_CONTACT} for assistance.<br />
					Error: {code} {message || error}
				</>
			);
			setPaying(false);
			setProcessing(false);
			return ; // exit early if pending order save fails
		}

		// Step 2: process payment (only reaches here if pending order saved successfully)
		let paymentId: string;
		let paymentEmail: string;
		let charged: number;
		try {
			({ paymentId, paymentEmail, amount: charged } = await processPayment());
			updateOrder({ paymentId, paymentEmail, charged });
			logDebug('Payment processed successfully');
		} catch (error: unknown) { // instance of HttpsError from backend or other error from processPayment
			const { code, message } = error as { code?: string; message?: string };
			setError(
				<>
					We're sorry, but we experienced an issue processing your payment.<br />
					Please try again or contact {TECH_CONTACT} for assistance.<br />
					Error: {code} {message || error}
				</>
			);
			setPaying(false);
			setProcessing(false);
			return ; // exit early if payment processing fails
		}

		// Step 3: Save final order
		try {
			await finalizeOrder({ orderId, paymentId, paymentEmail, charged });
			logDebug('Final order saved successfully');
			goNext();
		} catch (error: unknown) { // instance of HttpsError from backend or other error from finalizeOrder
			const { code, message } = error as { code?: string; message?: string };
			setError(
				<>
					Your payment was processed successfully. However, we encountered an error updating your registration. Please contact {TECH_CONTACT}.
					<br />
					Error: {code} {message || error}
				</>
			);
			setProcessing(false);
		}
	};
	

	return (
		<section className='paypal-buttons-wrapper'>
			{!isResolved && 
				<Box sx={{ textAlign: 'center', my: 4 }}>
					<Loading isHeading={false} text='Loading payment options...' />
					<p>(If this takes more than a few seconds, please refresh the page.)</p>
				</Box>
			}
			{isResolved && id && (
				<Box sx={ processing ? { display: 'none' } : {} }>
					{SANDBOX_MODE && !processing &&
						<TestCardBox number={4012000077777777} />
					}
					<PayPalButtons className={processing ? 'd-none' : ''}
						style={{ height: 48, tagline: false, shape: "pill", label: 'paypal' }}
						createOrder={() => Promise.resolve(id)}
						onApprove={() => onApprove()}
						onClick={() => onClick()}
						onError={(err) => onError(err)}
						onCancel={onCancel} 
					/>
				</Box>
			)}
		</section>
	);
};
