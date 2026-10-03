import DOMPurify from 'dompurify';
import MarkdownIt from 'markdown-it';
import Handlebars from 'handlebars';
import { STATE_OPTIONS } from 'config/internal/constants.js';
import type { FormikErrors } from 'formik';
import type { Order, Person } from 'types/order';
import type { ElectronicPaymentDetails } from 'types/payment';

export const clamp = (value: string | number, range: [number, number]) =>
  Math.min(Math.max(Number(value), range[0]), range[1]);

export const formatCurrency = (num: string | number) => {
  num = Number(num);
  if (isNaN(num)) throw new Error('Invalid number');
  return Number.isInteger(num) ? num : num.toFixed(2);
};

// Fee to add so that after the processor takes its cut, exactly `amount` is received.
// The processor charges its percentage on the full charge (including the added fee itself),
// so the fee is grossed up rather than computed as `percent * amount + fixed`:
//   charge - (percent * charge + fixed) = amount  =>  charge = (amount + fixed) / (1 - percent)
// Rounded up to the cent so rounding never leaves the received amount a penny short.
// The small epsilon keeps floating-point noise (e.g. 554.0000000001 cents) from rounding up a whole extra cent.
export const calculateFees = (amount: number, { percent, fixed }: { percent: number; fixed: number }) => {
  const charge = (amount + fixed) / (1 - percent);
  return Math.ceil((charge - amount) * 100 - 1e-9) / 100;
};

export const websiteLink = (link: string) => `https://${link}`;
export const mailtoLink = (email: string) => `mailto:${email}`;

export const cache = (name: string, obj: string | number | Order | ElectronicPaymentDetails | null) => sessionStorage.setItem(name, JSON.stringify(obj));
export const cached = (name: string) => JSON.parse(sessionStorage.getItem(name) ?? 'null');
export const clearCache = (name: string) => name ? sessionStorage.removeItem(name) : sessionStorage.clear();

export const isEmptyOrder = ({ people: [{ email }] }: { people: Person[] }) => email === '';

const trimAndSanitizeValue = (value: unknown) => typeof value === 'string' ? DOMPurify.sanitize(value.trim()) : value;
export const sanitizeObject = <T>(obj: T): T => {
  if (obj === null) {
    return null as T;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item)) as T;
  }
  if (typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => {
        if (typeof value === 'object' || Array.isArray(value)) {
          return [key, sanitizeObject(value)];
        }
        return [key, trimAndSanitizeValue(value)];
      })
    ) as T;
  }
  return trimAndSanitizeValue(obj) as T;
};

// helper for scrolling to first invalid field
export const getFirstInvalidFieldName = (errors: FormikErrors<Order>) => {
  if (errors.people && Array.isArray(errors.people)) {
    for (const i in errors.people) {
      const personErrors = errors.people[i];
      if (personErrors && typeof personErrors === 'object') {
        for (const field in personErrors) {
          return `people[${i}].${field}`;
        }
      }
    }
  }
  return null;
};

export const renderMarkdownTemplate = (template: string, data: Record<string, string | number | boolean>) => {
  const compiled = Handlebars.compile(template);
  const filledTemplate = compiled(data);
  const md = new MarkdownIt();
  return md.render(filledTemplate);
};

export const getCountry = (person: Person) => {
  if (!person.state) return person.country; // in case the state field is not requested/required
  const state = person.state.toLowerCase().trim();
  const stateMatch = STATE_OPTIONS.find(opt => opt.fullName.toLowerCase() === state || opt.abbreviation.toLowerCase() === state)
  const country = (stateMatch?.country || person.country || '').toLowerCase().trim();
  return ['usa', 'us', 'united states', 'united states of america'].includes(country) ? '' : country;
};
