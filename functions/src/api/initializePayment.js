/**
  * Initialize payment with Stripe or PayPal
  * @param {Object} data - Payment data (order, paymentId (if any), paymentMethod, idempotencyKey, description)
  * @param {Function} getStripePaymentIntent - Stripe create payment intent function
  * @param {Function} createOrUpdatePaypalOrder - PayPal create order function
  * @returns {Object} Payment data
  *  - {number} amount - Amount setup in payment intent
  *  - {string} id - Payment intent ID (for later payment updates and/or capture)
  *  - {string} clientSecret - Required for Stripe front-end payment capture
  * 
  * errors bubble up to index.js for logging and re-throwing to client
  */
const initializePayment = async (data, getStripePaymentIntent, createOrUpdatePaypalOrder) => {
  const { order, paymentId, paymentMethod, idempotencyKey, description } = data;
  const { total, fees, people: [{ email, first, last }] } = order;
  const paymentProcessorFn = paymentMethod === 'paypal' ? createOrUpdatePaypalOrder : getStripePaymentIntent;
  return await paymentProcessorFn({
    id: paymentId,
    amount: Number(total) + Number(fees),
    idempotencyKey,
    description,
    email,
    name: `${first} ${last}`
  });
};

export { initializePayment };
