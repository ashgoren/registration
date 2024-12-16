'use strict';

import { logger } from 'firebase-functions/v2';
import { initializeApp, getApps } from 'firebase-admin/app';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { google } from 'googleapis';
import { fieldOrder } from './fields.js';
import { joinArrays } from './helpers.js';

const SHEET_ID = process.env.SHEETS_SHEET_ID;
const CONFIG_DATA_COLLECTION = 'orders';
const RANGE = 'A:AP';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;

if (!getApps().length) initializeApp();

const client = new google.auth.JWT(process.env.SHEETS_SERVICE_ACCOUNT_CLIENT_EMAIL, null, process.env.SHEETS_SERVICE_ACCOUNT_PRIVATE_KEY, ['https://www.googleapis.com/auth/spreadsheets']);

export const appendrecordtospreadsheet = onDocumentCreated(`${CONFIG_DATA_COLLECTION}/{ITEM}`, async (event) => {
  const snap = event.data;
  logger.info(`APPEND TO SPREADSHEET: ${snap.id}`);
  try {
    const order = { ...snap.data(), key: snap.id };
    const orders = mapOrderToSpreadsheetLines(order);
    await appendAllLines(orders);
  } catch (err) {
    logger.error(`Error in appendrecordtospreadsheet for ${snap.data().people[0].email}`, err);
  }
});

const mapOrderToSpreadsheetLines = (order) => {
  const orders = []
  // const createdAt = order.createdAt.toDate().toLocaleDateString(); // just date
  const createdAt = order.createdAt.toDate().toLocaleString('sv-SE', {
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
      createdAt,
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

async function appendAllLines(orderLines, attempt = 0) {
  try {
    return await googleSheetsOperation({
      operation: 'append',
      params: {
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        resource: {
          values: orderLines
        }
      }
    });
  } catch (err) {
    if (attempt < MAX_RETRIES) {
      const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
      return appendAllLines(orderLines, attempt + 1);
    } else {
      logger.error(`Error appending order to spreadsheet`, err);
      throw err;
    }
  }
}

async function googleSheetsOperation({ operation, params }) {
  try {
    const operationParams = {
      ...params,
      spreadsheetId: SHEET_ID,
      range: params.range || RANGE
    };
    
    await client.authorize();
    const sheets = google.sheets({ version: 'v4', auth: client });

    switch (operation) {
      case 'read':
        return await sheets.spreadsheets.values.get(operationParams);
      case 'append':
        return await sheets.spreadsheets.values.append(operationParams);
      case 'update':
        return await sheets.spreadsheets.values.update(operationParams);
      default:
        throw new Error('Invalid operation');
    }
  } catch (err) {
    logger.error(`Google Sheets API operation (${operation}) failed`, err);
    throw err;
  }
}

const updateAddress = (person) => {
  const { address, apartment } = person;
  if (!apartment) return address;
  return address + ' ' + (/^\d/.test(apartment) ? `#${apartment}` : apartment);
};

const updatePhoto = (person) => {
  const { photo, photoComments } = person;
  return photo === 'Other' ? photoComments : photo;
};
