import Stripe from 'stripe';
import { config } from '../config.js';

const { STRIPE_SECRET_KEY } = config;

export const stripe = Stripe(STRIPE_SECRET_KEY);
