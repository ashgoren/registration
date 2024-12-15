import DOMPurify from 'dompurify';

export const clamp = (value, range) => Math.min(Math.max(Number(value), range[0]), range[1]);

export const formatCurrency = (num) => {
  num = Number(num);
  if (isNaN(num)) throw new Error('Invalid number');
  return Number.isInteger(num) ? num : num.toFixed(2);
}

export const scrollToTop = () => window.scrollTo(0,0);

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

export const warnBeforeUserLeavesSite = event => {
  event.preventDefault();
  event.returnValue = '';
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

export const fullName = (person) => `${person.first} ${person.last}`;
