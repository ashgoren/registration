// errors are handled in the calling function
import stripeModule from "stripe";

const stripe = stripeModule(process.env.STRIPE_SECRET_KEY);
const statement_descriptor_suffix = process.env.STRIPE_STATEMENT_DESCRIPTOR_SUFFIX; // appended to statement descriptor set in Stripe dashboard

export const getStripePaymentIntent = async ({ email, name, amount, idempotencyKey, paymentIntentId }) => {
  let paymentIntent;
  try {
    if (paymentIntentId) {
      paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (paymentIntent.amount !== amount) {
        paymentIntent = await stripe.paymentIntents.update(paymentIntentId, { amount });
      }
    } else {
      paymentIntent = await stripe.paymentIntents.create(
        {
          amount,
          currency: "usd",
          customer: await findOrCreateCustomer(email, name),
          ...(statement_descriptor_suffix && { statement_descriptor_suffix })
        },
        { idempotencyKey }
      );
    }
  } catch (error) {
    console.error("Error in getStripePaymentIntent:", error, email, name, amount, idempotencyKey, paymentIntentId);
    throw error;
  }
  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id
  };
};

async function findOrCreateCustomer(email, name) {
  let customer;
  const existingCustomers = await stripe.customers.list({ email, limit: 1 });
  if (existingCustomers.data.length) {
    customer = existingCustomers.data[0].id;
  } else {
    const newCustomer = await stripe.customers.create({ name, email });
    customer = newCustomer.id;
  }
  return customer;
}
