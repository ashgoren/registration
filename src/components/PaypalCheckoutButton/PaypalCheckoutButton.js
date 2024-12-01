import { useEffect } from 'react';
import { useOrder } from 'components/OrderContext';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { log } from 'logger';
import Loading from 'components/Loading';
import { Typography, Box } from "@mui/material";
import config from 'config';
const { SANDBOX_MODE, TECH_CONTACT, EVENT_TITLE } = config;

const PaypalCheckoutButton = ({ paypalButtonsLoaded, setPaypalButtonsLoaded, total, setPaying, processCheckout }) => {
	const { processing, setError, order } = useOrder();
	const { email } = order.people[0]; // for logging
	const [, isResolved] = usePayPalScriptReducer();

	// this feels hella hacky, but sometimes the buttons don't render despite isResolved
	const awaitPayPalButtons = (callback) => {
		const checkForElement = () => {
			const element = document.querySelector('.paypal-buttons');
			if (element) {
				callback();
			} else {
				setTimeout(checkForElement, 100);
			}
		};
		checkForElement();
	};

	useEffect(() => {
		awaitPayPalButtons(() => {
			setPaypalButtonsLoaded(true);
		});
	}, [setPaypalButtonsLoaded]);

	// this actually processes the payment
	const processPayment = async ({ actions }) => {
		log('PayPal processing payment', { email });
		try {
			const paypalOrder = await actions.order.capture();
			return paypalOrder.payer.email_address
		} catch (error) {
			setPaying(false);
			log('PayPal process payment error', { email, error });
			setError(`PayPal encountered an error: ${error}. Please try again or contact ${TECH_CONTACT}.`);
		}
	};

	// when user clicks one of the paypal buttons, createOrder launches the PayPal Checkout window
	const createOrder = (data, actions) => {
		return actions.order.create({
			purchase_units: [
				{
					description: `${EVENT_TITLE}`,
					amount: {
						value: total.toString() // must be a string
					}
				}
			],
			application_context: {
        shipping_preference: 'NO_SHIPPING'
      }
		});
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
			{isResolved && (
				<Box sx={ processing ? { display: 'none' } : {} }>
					{SANDBOX_MODE && paypalButtonsLoaded && !processing &&
						<Typography color='error' sx={{ mb: 1 }}>Test card: 4012000077777777</Typography>
					}
					<PayPalButtons className={processing ? 'd-none' : ''}
						style={{ height: 48, tagline: false, shape: "pill" }}
						createOrder={(data, actions) => createOrder(data, actions)}
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
