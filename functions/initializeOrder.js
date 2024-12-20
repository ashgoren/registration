// saves pending order to db; if electronic payment also creates payment intent
//
// for electronic payments it returns:
//  - amount setup in payment intent
//  - payment intent id (for later order updates and/or capture)
//  - (for stripe) client secret for capturing payment in frontend
//
// for non-electronic payments it returns:
//  - order total
//
// errors bubble up to the calling function

const initializeOrder = async (data, savePendingOrder, getStripePaymentIntent, createOrUpdatePaypalOrder) => {
  const { order, paymentId, paymentMethod, idempotencyKey, description } = data;
  const { email, first, last } = order.people[0];
  const amount = Number(order.total) + Number(order.fees);

  await savePendingOrder(order);

  if (!isElectronicPayment(paymentMethod)) {
    return { amount };
  }

  const paymentProcessorFn = paymentMethod === 'paypal' ? createOrUpdatePaypalOrder : getStripePaymentIntent;
  const response = await paymentProcessorFn({
    id: paymentId,
    amount,
    idempotencyKey,
    description,
    email,
    name: `${first} ${last}`
  });
  return response;
};

const isElectronicPayment = (paymentMethod) => ['stripe', 'paypal'].includes(paymentMethod);

export { initializeOrder };
