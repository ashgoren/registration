import DOMPurify from 'dompurify';
import MarkdownIt from 'markdown-it';
import Handlebars from 'handlebars';
import { STATE_OPTIONS } from 'config/internal/constants.js';
import type { FormikErrors } from 'formik';
import type { Order, Person } from '@registration/types';
import type { ElectronicPaymentDetails } from '@registration/types';

export const clamp = (value: string | number, range: [number, number]) =>
  Math.min(Math.max(Number(value), range[0]), range[1]);

export const formatCurrency = (num: string | number) => {
  num = Number(num);
  if (isNaN(num)) throw new Error('Invalid number');
  return Number.isInteger(num) ? num : num.toFixed(2);
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
