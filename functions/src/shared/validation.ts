import sanitizeHtml from 'sanitize-html';
import { createError, ErrorType } from './errorHandler.js';
import type { Order } from '../types/order';

// re-apply the frontend's constraints on the server.
const MAX_PEOPLE = 4; // matches frontend admissionQuantityMax
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;
const MAX_FIELD_LENGTH = 5000; // ceiling for free-text fields (e.g. comments)
const MAX_RECEIPT_LENGTH = 100000; // this is the only check that runs after payment, so it leaves wide margin

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const invalid = (message: string, details: Record<string, unknown> = {}) =>
  createError(ErrorType.INVALID_ARGUMENT, message, details);

// Throws on the first violation. Runs before any payment is taken (savePendingOrder) so a rejected order
// never leaves a registrant charged, and again on finalization since that call can be made directly.
export const validateOrder = (order: Order) => {
  const { people } = order ?? {};
  if (!Array.isArray(people) || people.length < 1 || people.length > MAX_PEOPLE) {
    throw invalid(`Order must include between 1 and ${MAX_PEOPLE} people`, { peopleCount: people?.length });
  }

  people.forEach((person, index) => {
    // first is inserted into the DocuSeal waiver email body, which doesn't pass through the receipt sanitizer
    for (const field of ['first', 'last'] as const) {
      const value = person[field];
      if (typeof value !== 'string' || !value.trim() || value.length > MAX_NAME_LENGTH) {
        throw invalid(`Invalid ${field} for person ${index + 1}`);
      }
    }

    const { email } = person;
    if (typeof email !== 'string' || !EMAIL_REGEX.test(email) || email.length > MAX_EMAIL_LENGTH) {
      throw invalid(`Invalid email for person ${index + 1}`);
    }

    // receipt has its own, larger limit (checked in sanitizeReceipts); every other text field shares one ceiling
    Object.entries(person).forEach(([key, value]) => {
      if (key === 'receipt') return;
      const strings = Array.isArray(value) ? value : [value];
      if (strings.some(item => typeof item === 'string' && item.length > MAX_FIELD_LENGTH)) {
        throw invalid(`Field ${key} is too long for person ${index + 1}`);
      }
    });
  });
};

const RECEIPT_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ['h1', 'h2', 'h3', 'h4', 'p', 'strong', 'em', 'ul', 'ol', 'li', 'blockquote', 'br', 'div', 'span', 'hr'],
  allowedAttributes: {}
};

export const sanitizeReceipts = (order: Order): Order => ({
  ...order,
  people: order.people.map((person, index) => {
    const { receipt } = person;
    if (receipt === undefined) return person;
    if (typeof receipt !== 'string' || receipt.length > MAX_RECEIPT_LENGTH) {
      throw invalid(`Invalid receipt for person ${index + 1}`);
    }
    return { ...person, receipt: sanitizeHtml(receipt, RECEIPT_SANITIZE_OPTIONS) };
  })
});
