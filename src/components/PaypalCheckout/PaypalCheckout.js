import { log } from 'logger';
import { useEffect } from 'react';
import { useOrder } from 'components/OrderContext';
import { usePaypalPayment } from 'hooks/usePaypalPayment';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import Loading from 'components/Loading';
import { Box } from "@mui/material";
import { TestCardBox } from 'components/Layout/SharedStyles';
import config from 'config';
const { SANDBOX_MODE, TECH_CONTACT } = config;

const PaypalCheckout = ({ paypalButtonsLoaded, setPaypalButtonsLoaded, setPaying, processCheckout }) => {
	const { processing, setError, order, electronicPaymentDetails: { id } } = useOrder();
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

	// when user submits payment details (this does not process the payment yet)
	const onApprove = async () => {
		log('User submitted payment details', { email });
		processCheckout({ paymentProcessorFn: processPayment });
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

// const mapPaymentError = (error) => {
//   const errorMessages = {
//     PAYMENT_AMOUNT_ERROR: `There was a problem initializing the payment: Amount out of range. Please contact ${TECH_CONTACT}.`,
//     PAYMENT_INIT_ERROR: `There was a problem initializing the payment: ${error.message}. Please try again or contact ${TECH_CONTACT}.`,
//     PAYMENT_PROCESS_ERROR: `There was a problem processing the payment: ${error.message}. Please verify your payment details and try again.`,
//     PAYMENT_CONFIRM_ERROR: `There was a problem confirming the payment: ${error.message}. Please contact ${TECH_CONTACT}.`,
//   };
//   return errorMessages[error.code] || `Unexpected payment processing error: ${error.message}. Please contact ${TECH_CONTACT}.`;
// }

export default PaypalCheckout;
