import { logger } from 'firebase-functions/v2';
import { initializeApp, getApps } from 'firebase-admin/app';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { fieldOrder } from './fields.js';
import { joinArrays } from './helpers.js';
import { appendAllLines } from './shared/spreadsheet.js';

if (!getApps().length) initializeApp();

export const appendrecordtospreadsheet = onDocumentUpdated(`orders/{ITEM}`, async (event) => {
  const { before, after } = event.data;
  if (before?.data()?.status === 'pending' && after.data().status === 'final') {
    logger.info(`APPEND TO SPREADSHEET: ${after.id}`);
    try {
      const order = { ...after.data(), key: after.id };
      const orders = mapOrderToSpreadsheetLines(order);
      await appendAllLines(orders);
    } catch (err) {
      logger.error(`Error in appendrecordtospreadsheet for ${after.data().people[0].email}`, err);
    }
  }
});

const mapOrderToSpreadsheetLines = (order) => {
  const orders = []
  // const completedAt = order.completedAt.toDate().toLocaleDateString(); // just date
  const completedAt = order.completedAt.toDate().toLocaleString('sv-SE', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const updatedOrder = joinArrays(order);
  const { people, ...orderFields } = updatedOrder
  let isPurchaser = true;
  for (const person of people) {
    let admission, total, deposit;
    const updatedPerson = person.share ? joinArrays(person) : { ...joinArrays(person), share: 'do not share' };
    if (order.deposit) {
      deposit = order.deposit / people.length;
    } else {
      admission = parseInt(person.admission);
      total = isPurchaser ? admission + order.donation : admission;
    }
    let paid, status;
    if (order.paymentId === 'waitlist') {
      admission = 0;
      total = 0;
      paid = 0;
      status = 'waitlist';
    } else if (order.paymentId === 'check') {
      paid = 0;
      status = 'awaiting check';
    } else if (deposit > 0) {
      paid = isPurchaser ? deposit + order.donation + order.fees : deposit;
      status = 'deposit';
    } else {
      paid = isPurchaser ? total + order.fees : total;
      status = 'paid';
    }
    const firstPersonPurchaserField = people.length > 1 ? `self (+${people.length - 1})` : 'self';
    const personFieldsBuilder = {
      ...updatedPerson,
      key: isPurchaser ? order.key : '-',
      completedAt,
      address: updateAddress(person),
      photo: updatePhoto(person),
      admission,
      total,
      deposit,
      paid,
      charged: isPurchaser ? order.charged : '-',
      status,
      purchaser: isPurchaser ? firstPersonPurchaserField : `${people[0].first} ${people[0].last}`
    };
    const personFields = isPurchaser ? { ...orderFields, ...personFieldsBuilder } : personFieldsBuilder;
    const line = fieldOrder.map(field => personFields[field] || '');
    orders.push(line);
    isPurchaser = false;
  }
  return orders;
};

const updateAddress = (person) => {
  const { address, apartment } = person;
  if (!apartment) return address;
  return address + ' ' + (/^\d/.test(apartment) ? `#${apartment}` : apartment);
};

const updatePhoto = (person) => {
  const { photo, photoComments } = person;
  return photo === 'Other' ? photoComments : photo;
};
