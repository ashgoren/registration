import type { Order } from '../types/order';

type PaymentParams = {
  amount: number;
  idempotencyKey: string;
  description: string;
  email: string;
  name: string;
  id?: string;
};

export type GetStripePaymentIntentFunction = (params: PaymentParams) => Promise<{
  amount: number;
  id: string;
  clientSecret: string;
}>;

export type CreateOrUpdatePaypalOrderFunction = (params: PaymentParams) => Promise<{
  amount: number;
  id: string;
}>;

export type PaymentData = {
  order: Order;
  paymentId?: string;
  paymentMethod: 'stripe' | 'paypal';
  idempotencyKey: string;
  description: string;
}

type InitializePaymentReturn = Promise<{
  amount: number; // Amount setup in payment intent
  id: string; // Payment intent ID (for later payment updates and/or capture)
  clientSecret?: string; // Required for Stripe front-end payment capture
}>;

const initializePayment = (
  data: PaymentData,
  getStripePaymentIntent: GetStripePaymentIntentFunction,
  createOrUpdatePaypalOrder: CreateOrUpdatePaypalOrderFunction
): InitializePaymentReturn => {
  const { order, paymentId, paymentMethod, idempotencyKey, description } = data;
  const { total, fees, people: [{ email, first, last }] } = order;
  const paymentProcessorFn = paymentMethod === 'paypal' ? createOrUpdatePaypalOrder : getStripePaymentIntent;

  return paymentProcessorFn({
    id: paymentId,
    amount: Number(total) + Number(fees),
    idempotencyKey,
    description,
    email,
    name: `${first} ${last}`
  });
};

export { initializePayment };
