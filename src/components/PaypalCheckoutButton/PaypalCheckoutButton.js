import { useEffect } from "react";
import { useOrder } from 'components/OrderContext';
import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import Loading from 'components/Loading';
import { Typography, Box } from "@mui/material";
import config from 'config';
const { SANDBOX_MODE, TECH_CONTACT, EVENT_TITLE } = config;

const PaypalCheckoutButton = ({ paypalButtonsLoaded, setPaypalButtonsLoaded, total, setPaying, processCheckout }) => {
	const { processing, setError } = useOrder();
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

	const processPayment = async ({ actions }) => {
		try {
			const paypalOrder = await actions.order.capture();
			return paypalOrder.payer.email_address
		} catch (err) {
			setPaying(false);
			setError(`PayPal encountered an error: ${err}. Please try again or contact ${TECH_CONTACT}.`);
		}
	};

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

	const onApprove = async (data, actions) => {
		processCheckout({ paymentProcessorFn: processPayment, paymentParams: { actions } });
	};

	const onError = (err) => {
		setPaying(false);
		setError(`PayPal encountered an error: ${err}. Please try again or contact ${TECH_CONTACT}.`);
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
