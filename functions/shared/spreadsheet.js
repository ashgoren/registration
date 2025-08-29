import { logger } from 'firebase-functions/v2';
import { google } from 'googleapis';
import { getConfig } from '../config.js';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;

const SHEET_OPERATIONS = {
  READ: 'read',
  APPEND: 'append',
  UPDATE: 'update',
};

async function readSheet() {
  return googleSheetsOperation({
    operation: SHEET_OPERATIONS.READ,
    params: {
      range: 'Orders'
    }
  });
}

async function appendAllLines(lines) {
  return googleSheetsOperation({
    operation: SHEET_OPERATIONS.APPEND,
    params: {
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: lines
      }
    }
  });
}

async function googleSheetsOperation({ operation, params }, attempt = 0) {
  const { SHEETS_SHEET_ID, SHEETS_SHEET_RANGE, SHEETS_SERVICE_ACCOUNT_CLIENT_EMAIL, SHEETS_SERVICE_ACCOUNT_PRIVATE_KEY } = getConfig();
  const SHEETS_AUTH_URL = 'https://www.googleapis.com/auth/spreadsheets';
  const key = SHEETS_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n');
  const client = new google.auth.JWT(SHEETS_SERVICE_ACCOUNT_CLIENT_EMAIL, null, key, [SHEETS_AUTH_URL]);

  try {
    const operationParams = {
      ...params,
      spreadsheetId: SHEETS_SHEET_ID,
      range: params.range || SHEETS_SHEET_RANGE
    };
    
    await client.authorize();
    const sheets = google.sheets({ version: 'v4', auth: client });

    switch (operation) {
      case SHEET_OPERATIONS.READ:
        return await sheets.spreadsheets.values.get(operationParams);
      case SHEET_OPERATIONS.APPEND:
        return await sheets.spreadsheets.values.append(operationParams);
      case SHEET_OPERATIONS.UPDATE:
        return await sheets.spreadsheets.values.update(operationParams);
      default:
        throw new Error('Invalid operation');
    }
  } catch (err) {
    if (attempt < MAX_RETRIES) {
      logger.warn(`Google Sheets API operation (${operation}) failed, attempt ${attempt + 1}/${MAX_RETRIES}`, err);
      const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
      return googleSheetsOperation({ operation, params }, attempt + 1);
    } else {
      logger.error(`Google Sheets API operation (${operation}) failed after ${MAX_RETRIES} attempts`, err);
      throw err;
    }
  }
}

export { appendAllLines, readSheet };
