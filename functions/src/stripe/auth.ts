import Stripe from 'stripe';
import { getConfig } from '../config/internal/config.js';

let stripe;
export const getStripe = () => stripe ??= new Stripe(getConfig().STRIPE_SECRET_KEY!)
