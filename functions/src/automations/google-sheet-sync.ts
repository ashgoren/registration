import { logger } from 'firebase-functions/v2';
import { initializeApp, getApps } from 'firebase-admin/app';
import { fieldOrder } from '../shared/fields.js';
import { joinArrays } from '../shared/helpers.js';
import { appendAllLines } from '../shared/spreadsheet.js';

import type { FirestoreEvent, Change, QueryDocumentSnapshot } from 'firebase-functions/v2/firestore';
import type { Order, Person } from '../types/order';
type OrderWithKey = Order & { key: string };

if (!getApps().length) initializeApp();

// onDocumentUpdated
export const appendRecordToSpreadsheetHandler = async (event: FirestoreEvent<Change<QueryDocumentSnapshot>>) => {
  const { before, after } = event.data;
  if (before?.data()?.status === 'pending' && after.data().status === 'final') {
    logger.info(`APPEND TO SPREADSHEET: ${after.id}`);
    try {
      const order = { ...after.data(), key: after.id } as OrderWithKey;
      const orders = mapOrderToSpreadsheetLines(order);
      await appendAllLines(orders);
    } catch (err) {
      logger.error(`Error in appendRecordToSpreadsheetHandler for ${after.data().people[0].email}`, err);
    }
  }
};

const mapOrderToSpreadsheetLines = (order: OrderWithKey) => {
  const orders = []
  // const completedAt = order.completedAt.toDate().toLocaleDateString(); // just date
  const completedAt = order.completedAt!.toDate().toLocaleString('sv-SE', {
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
    const stringifiedPerson = joinStrings(updatedPerson);
    if (order.deposit) {
      deposit = order.deposit / people.length;
    } else {
      deposit = 0;
      admission = parseInt(person.admission);
      total = isPurchaser ? admission + (order.donation || 0) : admission;
    }
    const fees = order.fees || 0;
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
      paid = isPurchaser ? deposit + order.donation + fees : deposit;
      status = 'deposit';
    } else {
      paid = isPurchaser ? total! + fees : total;
      status = 'paid';
    }
    const firstPersonPurchaserField = people.length > 1 ? `self (+${people.length - 1})` : 'self';
    const personFieldsBuilder = {
      ...stringifiedPerson,
      key: isPurchaser ? order.key : '-',
      completedAt,
      address: updateAddress(person),
      photo: updatePhoto(person),
      misc: updateMisc(person),
      admission,
      total,
      deposit,
      paid,
      charged: isPurchaser ? order.charged : '-',
      status,
      purchaser: isPurchaser ? firstPersonPurchaserField : `${people[0].first} ${people[0].last}`,
      environment: order.environment === 'prd' ? '' : order.environment
    };
    const personFields = isPurchaser ? { ...orderFields, ...personFieldsBuilder } : personFieldsBuilder;
    const line = fieldOrder.map(field => personFields[field] || '');
    orders.push(line);
    isPurchaser = false;
  }
  return orders;
};

const updateAddress = (person: Person) => {
  const { address, apartment } = person;
  if (!apartment) return address;
  return address + ' ' + (/^\d/.test(apartment) ? `#${apartment}` : apartment);
};

const updatePhoto = (person: Person) => {
  const { photo, photoComments } = person;
  return photo === 'Other' ? photoComments : photo;
};

const updateMisc = (person: Person) => {
  const { misc, miscComments } = person;
  if (!misc) return '';
  return misc.map(item => item === 'minor' ? `minor (${miscComments})` : item).join('; ');
};

const joinStrings = (person: Person) => {
  for (const key in person) {
    if (typeof person[key] === 'string') {
      person[key] = person[key].replace(/\n/g, '; ');
    }
  }
  return person;
};
