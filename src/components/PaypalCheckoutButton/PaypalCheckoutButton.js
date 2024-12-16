import { useState, useEffect } from 'react';
import { useOrder } from 'components/OrderContext';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { firebaseFunctionDispatcher } from 'firebase.js';
import { log } from 'logger';
import Loading from 'components/Loading';
import { Typography, Box } from "@mui/material";
import config from 'config';
const { SANDBOX_MODE, TECH_CONTACT } = config;

const PaypalCheckoutButton = ({ paypalButtonsLoaded, setPaypalButtonsLoaded, setPaying, processCheckout }) => {
	const { processing, setError, order, paymentInfo } = useOrder();
	const { email } = order.people[0]; // for logging
	const [, isResolved] = usePayPalScriptReducer();
	const [captureIdempotencyKey, setCaptureIdempotencyKey] = useState(null);

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

	// this actually processes the payment
	const processPayment = async () => {
		if (!paymentInfo.id) {
			setPaying(false);
			setError('No payment intent ID found. Please try again or contact support.');
			return;
		}
		try {
			const response = await firebaseFunctionDispatcher({
				action: 'capturePaypalOrder',
				email,
				data: {
					id: paymentInfo.id,
					idempotencyKey: captureIdempotencyKey
				}
			});
			if (!response?.data) throw new Error('No data returned');
			const { id, amount } = response.data;
			return { id, amount: Number(amount) };
		} catch (error) {
			setPaying(false);
			log('PayPal process payment error', { email, error });
			setError(`PayPal encountered an error: ${error}. Please try again or contact ${TECH_CONTACT}.`);
		}
	};

	// when user submits payment details (this does not process the payment yet)
	const onApprove = async (data, actions) => {
		log('User submitted payment details', { email });
		processCheckout({ paymentProcessorFn: processPayment, paymentParams: { actions } });
	};

	const onError = (error) => {
		log('PayPal onError', { email, error });
		setPaying(false);
		setError(`PayPal encountered an error: ${error}. Please try again or contact ${TECH_CONTACT}.`);
	};

	const onCancel=() => {
		setPaying(false);
	};

	const onClick=(data, actions) => {
		setCaptureIdempotencyKey(crypto.randomUUID()); // generate a new idempotency key for each attempt to capture
		setError(null);
		setPaying(true);
	};

	return (
		<section className='paypal-buttons-wrapper'>
			{(!paypalButtonsLoaded) && 
				<Box align='center'>
					<Loading isHeading={false} text='Loading payment options...' />
					<p>(If this takes more than a few seconds, please refresh the page.)</p>
				</Box>
			}
			{isResolved && paymentInfo.id && (
				<Box sx={ processing ? { display: 'none' } : {} }>
					{SANDBOX_MODE && paypalButtonsLoaded && !processing &&
						<Typography color='error' sx={{ mb: 1 }}>Test card: 4012000077777777</Typography>
					}
					<PayPalButtons className={processing ? 'd-none' : ''}
						style={{ height: 48, tagline: false, shape: "pill" }}
						createOrder={(data, actions) => Promise.resolve(paymentInfo.id)}
						onApprove={(data, actions) => onApprove(data, actions)}
						onClick={(data, actions) => onClick(data, actions)}
						onError={(err) => onError(err)}
						onCancel={onCancel} 
					/>
				</Box>
			)}
		</section>
	);
};

export default PaypalCheckoutButton;
