'use strict';

import * as functions from 'firebase-functions';
import { google } from 'googleapis';
import admin from 'firebase-admin';
import { fieldOrder } from './fields.js';

const SERVICE_ACCOUNT_KEYS = functions.config().sheets.googleapi_service_account;
const SHEET_ID = functions.config().sheets.sheet_id;
const PAYMENT_ID_COLUMN = functions.config().sheets.payment_id_column;
const DATA_PATH = '/orders';
const RANGE = 'A:AP';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;

if (admin.apps.length === 0) admin.initializeApp();
const client = new google.auth.JWT(SERVICE_ACCOUNT_KEYS.client_email, null, SERVICE_ACCOUNT_KEYS.private_key, ['https://www.googleapis.com/auth/spreadsheets']);


// ******** ADD LINE(S) TO SPREADSHEET ********

export const appendrecordtospreadsheet = functions.database.ref(`${DATA_PATH}/{ITEM}`).onCreate(
  async (snap) => {
    try {
      const key = snap.key;
      const newRecord = snap.val();
      const orders = mapOrderToSpreadsheetLines({ ...newRecord, key });
      const promises = orders.map(orderLine => appendPromise(orderLine));
      await Promise.all(promises);
    } catch (err) {
      handleError(`Error in appendrecordtospreadsheet for ${snap.val().emailConfirmation}`, err);
    }
  }
);

const mapOrderToSpreadsheetLines = (order) => {
  const orders = []
  const createdAt = new Date(order.createdAt).toLocaleDateString();
  const purchaser = `${order.people[0].first} ${order.people[0].last}`;
  const admissionQuantity = order.people.length;
  const owed = order.total - order.deposit;
  const updatedOrder = joinArrays(order);
  const { people, ...orderFields } = updatedOrder
  let isPurchaser = true;
  for (const person of people) {
    if (person.email === '') continue; // this should never trigger, but skip empty person objects just in case
    const address = person.apartment ? `${person.address} ${person.apartment}` : person.address;
    const updatedPerson = person.share ? joinArrays(person) : { ...joinArrays(person), share: 'do not share' };
    const personFieldsBuilder = isPurchaser ? { ...updatedPerson, ...orderFields, owed, admissionQuantity } : updatedPerson;
    const personFields = { ...personFieldsBuilder, address, purchaser, createdAt };
    const line = fieldOrder.map(field => personFields[field] || '');
    orders.push(line);
    isPurchaser = false;
  }
  return orders;
};

async function appendPromise(orderLine, attempt = 0) {
  try {
    return await googleSheetsOperation({
      operation: 'append',
      params: {
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        resource: {
          values: [orderLine]
        }
      }
    });
  } catch (err) {
    if (attempt < MAX_RETRIES) {
      const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
      return appendPromise(orderLine, attempt + 1);
    } else {
      handleError(`Error appending orderLine ${orderLine} to spreadsheet`, err);
    }
  }
}


// ******** UPDATE SPREADSHEET LINE ********

export const updaterecordinspreadsheet = functions.database.ref(`${DATA_PATH}/{ITEM}`).onUpdate(
  async (change) => {
    try {
      const key = change.after.key;
      const record = change.after.val();
      const paymentId = record.paymentId;
      const rowToUpdate = await findRowByKey({ key });
      if (rowToUpdate) {
        await updateSpreadsheetRow({ row: rowToUpdate, value: paymentId });
      }
    } catch (err) {
      handleError(`Error updating paymentId for key ${key}`, err);
    }
  }
);

async function findRowByKey({ key }) {
  try {
    const response = await googleSheetsOperation({ 
      operation: 'read',
      params: {}
    });
    const rows = response.data.values;
    if (rows.length) {
      for (let i = 0; i < rows.length; i++) {
        if (rows[i][0] === key) {
          return i + 1;
        }
      }
    }
    return null; // Key not found
  } catch (err) {
    handleError('Error in findRowByKey', err);
  }
}

async function updateSpreadsheetRow({ row, value }) {
  try {
    await googleSheetsOperation({ 
      operation: 'update',
      params: {
        range: `${PAYMENT_ID_COLUMN}${row}`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: [[value]] }
      }
    });
  } catch (err) {
    handleError('Error in updateSpreadsheetRow', err);
  }
}


// ******** GOOGLE SHEETS API ********

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
    handleError(`Google Sheets API operation (${operation}) failed`, err);
  }
}


// ******** HELPERS ********

const joinArrays = (obj) => {
  const newObj = { ...obj };
  for (let key in obj) {
    if (key !== 'people' && Array.isArray(obj[key])) {
      newObj[key] = obj[key].join(', ');
    }
  }
  return newObj;
};

function handleError(message, err) {
  functions.logger.error(message, err);
  throw err;
}
