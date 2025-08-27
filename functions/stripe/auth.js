import Stripe from 'stripe';
const { STRIPE_SECRET_KEY } = process.env;

export const stripe = Stripe(STRIPE_SECRET_KEY);
