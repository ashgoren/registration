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
import { config } from 'config';
const { SANDBOX_MODE, TECH_CONTACT } = config;

export const PaypalCheckout = ({ setPaying }: {
	setPaying: (paying: boolean) => void;
}) => {
	const { order, updateOrder } = useOrderData();
	const { electronicPaymentDetails: { id } } = useOrderPayment();
	const { processing, setProcessing, setCurrentPage, setError } = useOrderFlow();
	const { savePendingOrder } = useOrderSaving();
	const { processPayment } = usePaypalPayment({ order, id });
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
		try {
			await savePendingOrder();
		} catch (error: unknown) { // instance of HttpsError from backend or other error from savePendingOrder
			setError(
				<>
					We're sorry, but we experienced an issue saving your order.<br />
					You were not charged.<br />
					Please try again or contact {TECH_CONTACT} for assistance.<br />
					Error: {(error as Error).message || error}
				</>
			);
			setPaying(false);
			setProcessing(false);
			return ; // exit early if pending order save fails
		}

		// Step 2: process payment (only reaches here if pending order saved successfully)
		try {
			const { paymentId, paymentEmail, amount } = await processPayment();
			updateOrder({ paymentId, paymentEmail, charged: amount });
			setCurrentPage('processing');
		} catch (error: unknown) { // instance of HttpsError from backend or other error from processPayment
			setError(
				<>
					We're sorry, but we experienced an issue processing your payment.<br />
					Please try again or contact {TECH_CONTACT} for assistance.<br />
					Error: {(error as Error).message || error}
				</>
			);
			setPaying(false);
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
