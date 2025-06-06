import DOMPurify from 'dompurify';
import MarkdownIt from 'markdown-it';
import Handlebars from 'handlebars';
import { STATE_OPTIONS } from 'config/constants';

export const clamp = (value, range) => Math.min(Math.max(Number(value), range[0]), range[1]);

export const formatCurrency = (num) => {
  num = Number(num);
  if (isNaN(num)) throw new Error('Invalid number');
  return Number.isInteger(num) ? num : num.toFixed(2);
}

export const websiteLink = (link) => `https://${link}`;
export const mailtoLink = (email) => `mailto:${email}`;

export const cache = (name, obj) => sessionStorage.setItem(name, JSON.stringify(obj));
export const cached = (name) => JSON.parse(sessionStorage.getItem(name));
export const clearCache = (name) => name ? sessionStorage.removeItem(name) : sessionStorage.clear();

export const isEmptyOrder = ({ people: [{ email }] }) => email === '';

const trimAndSanitizeValue = (value) => typeof value === 'string' ? DOMPurify.sanitize(value.trim()) : value;
export const sanitizeObject = (obj) => {
  if (obj === null) return null;
  if (Array.isArray(obj)) return obj.map(item => sanitizeObject(item));
  if (typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => {
        if (typeof value === 'object' || Array.isArray(value)) {
          return [key, sanitizeObject(value)];
        }
        return [key, trimAndSanitizeValue(value)];
      })
    );
  }
  return trimAndSanitizeValue(obj);
};

// helper for scrolling to first invalid field
export const getFirstInvalidFieldName = (errors) => {
  if (errors.people) {
    for (const i in errors.people) {
      if (errors.people[i] !== null) {
        for (const field in errors.people[i]) {
          return `people[${i}].${field}`;
        }
      }
    }
  }
  return null;
};

export const renderMarkdownTemplate = (template, data) => {
  const compiled = Handlebars.compile(template);
  const filledTemplate = compiled(data);
  const md = new MarkdownIt();
  return md.render(filledTemplate);
};

export const getCountry = (person) => {
  if (!person.state) return person.country; // in case the state field is not requested/required
  const state = person.state.toLowerCase().trim();
  const stateMatch = STATE_OPTIONS.find(opt => opt.fullName.toLowerCase() === state || opt.abbreviation.toLowerCase() === state)
  const country = stateMatch?.country || person.country;
  if (['usa', 'us', 'united states', 'united states of america'].includes(country?.toLowerCase())) {
    return '';
  } else {
    return country;
  }
};
