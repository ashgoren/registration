import type { Timestamp } from 'firebase-admin/firestore';
import type { AgeGroup } from './tieredPricing';

export type Person = {
  email: string;
  phone: string;
  first: string;
  last: string;
  state?: string;
  country?: string;
  share?: string[];
  admission: number;
  apartment?: string;
  age?: AgeGroup;
  misc?: string[];
  [key: string]: unknown;
};

export type Order = {
  people: Person[];
  donation: number;
  deposit: number;
  paymentId: string | null;
  paymentEmail: string | null;
  charged: number | null;
  total: number | null;
  fees: number | null;
  completedAt?: Timestamp | null;
  environment: 'dev' | 'stg' | 'prd';
};
