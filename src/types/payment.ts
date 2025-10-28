export type PaymentMethod = 'stripe' | 'paypal' | 'waitlist' | 'check';
export type ElectronicPaymentMethod = 'stripe' | 'paypal';

export type ElectronicPaymentDetails = { id: string | null; clientSecret?: string | null };
