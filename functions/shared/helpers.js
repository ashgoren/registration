import { config } from '../config.js';
const { SANDBOX_MODE } = config;
const { FIREBASE_AUTH_EMULATOR_HOST, FIRESTORE_EMULATOR_HOST, FUNCTIONS_EMULATOR, GCLOUD_PROJECT } = process.env;

export const formatDateTime = (date) => {
  if (!date) return null;
  const localDate = new Date(date);
  return localDate.toLocaleString('sv-SE', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

export const getDateChunks = (start, end, days) => {
  const chunks = [];
  const now = new Date();
  let current = new Date(start);

  while (current < end) {
    const chunkStart = new Date(current);
    current.setDate(current.getDate() + days); // increment by specified number of days
    const chunkEnd = current > end ? end : new Date(current.getTime() - 1); // subtract 1 ms to avoid overlap
    if (chunkStart < now) {
      chunks.push({ start: chunkStart, end: chunkEnd });
    }
  }
  return chunks;
};

export const joinArrays = (obj) => {
  const newObj = { ...obj };
  for (let key in obj) {
    if (key !== 'people' && Array.isArray(obj[key])) {
      newObj[key] = obj[key].join(', ');
    }
  }
  return newObj;
};

export const formatCurrency = (amount) => {
  return Number(amount).toFixed(2);
}

export const getOrderEmail = (order) => {
  return order.people[0].email;
}

export const getOrderDomain = (order) => {
  return getOrderEmail(order).split('@')[1];
}

export const IS_EMULATOR = !!FIREBASE_AUTH_EMULATOR_HOST || !!FIRESTORE_EMULATOR_HOST || !!FUNCTIONS_EMULATOR;
export const IS_SANDBOX = SANDBOX_MODE === 'true';
export const PROJECT_ID = GCLOUD_PROJECT;
