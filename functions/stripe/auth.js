import Stripe from 'stripe';
import { IS_SANDBOX, IS_EMULATOR } from '../helpers.js';
const { STRIPE_SECRET_KEY_SANDBOX, STRIPE_SECRET_KEY_LIVE } = process.env;

const useSandbox = IS_SANDBOX || IS_EMULATOR;
const stripeSecretKey = useSandbox ? STRIPE_SECRET_KEY_SANDBOX : STRIPE_SECRET_KEY_LIVE;

export const stripe = Stripe(stripeSecretKey);
