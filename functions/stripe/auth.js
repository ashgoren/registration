import Stripe from 'stripe';
import { getConfig } from '../config.js';

let stripe;
export const getStripe = () => stripe ??= Stripe(getConfig().STRIPE_SECRET_KEY);
