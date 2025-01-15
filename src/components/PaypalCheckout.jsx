import { useEffect } from 'react';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { Box } from '@mui/material';
import { Loading } from 'components/layouts';
import { TestCardBox } from 'components/layouts/SharedStyles';
import { log } from 'src/logger';
import { useOrder } from 'hooks/useOrder';
import { usePaypalPayment } from 'hooks/usePaypalPayment';
import { config } from 'config';
const { SANDBOX_MODE, TECH_CONTACT } = config;

export const PaypalCheckout = ({ paypalButtonsLoaded, setPaypalButtonsLoaded, setPaying }) => {
	const { processing, setProcessing, setCurrentPage, setError, order, updateOrder, electronicPaymentDetails: { id } } = useOrder();
	const { email } = order.people[0]; // for logging
	const { processPayment } = usePaypalPayment({ email, id });
	const [, isResolved] = usePayPalScriptReducer();

	// this feels hella hacky, but sometimes the buttons don't render despite isResolved
	const awaitPayPalButtons = (callback) => {
		const checkForElement = () => {
			const element = document.querySelector('.paypal-buttons');
			element ? callback() : setTimeout(checkForElement, 100);
		};
		checkForElement();
	};

	useEffect(() => {
		awaitPayPalButtons(() => setPaypalButtonsLoaded(true));
	}, [setPaypalButtonsLoaded]);

	const onClick=() => {
		setError(null);
		setPaying(true);
	};

	const onCancel=() => {
		setPaying(false);
	};

	const onError = (error) => {
		log('PayPal onError', { email, error });
		setPaying(false);
		setError(`PayPal encountered an error: ${error}. Please try again or contact ${TECH_CONTACT}.`);
	};

	// when user submits payment details
	const onApprove = async () => {
		setProcessing(true);
		log('User submitted payment details', { email });
		try {
			const { id, amount } = await processPayment();
			updateOrder({ paymentId: id, charged: amount });
			setCurrentPage('processing');
		} catch (error) {
			const errorMessage = mapPaymentError(error);
			setError(errorMessage);
			setPaying(false);
			setProcessing(false);
		}
	};

	return (
		<section className='paypal-buttons-wrapper'>
			{(!paypalButtonsLoaded) && 
				<Box align='center'>
					<Loading isHeading={false} text='Loading payment options...' />
					<p>(If this takes more than a few seconds, please refresh the page.)</p>
				</Box>
			}
			{isResolved && id && (
				<Box sx={ processing ? { display: 'none' } : {} }>
					{SANDBOX_MODE && paypalButtonsLoaded && !processing &&
						<TestCardBox number='4012000077777777' />
					}
					<PayPalButtons className={processing ? 'd-none' : ''}
						style={{ height: 48, tagline: false, shape: "pill" }}
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

const mapPaymentError = (error) => {
  const errorMessages = {
    PAYMENT_AMOUNT_ERROR: `There was a problem initializing the payment: Amount out of range. Please contact ${TECH_CONTACT}.`,
    PAYMENT_INIT_ERROR: `There was a problem initializing the payment: ${error.message}. Please try again or contact ${TECH_CONTACT}.`,
    PAYMENT_PROCESS_ERROR: `There was a problem processing the payment: ${error.message}. Please verify your payment details and try again.`,
    PAYMENT_CONFIRM_ERROR: `There was a problem confirming the payment: ${error.message}. Please contact ${TECH_CONTACT}.`,
  };
  return errorMessages[error.code] || `Unexpected payment processing error: ${error.message}. Please contact ${TECH_CONTACT}.`;
}
