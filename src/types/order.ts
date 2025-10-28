export type Person = {
  email: string;
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
  environment: 'dev' | 'stg' | 'prd';
};
