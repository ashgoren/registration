import { logger } from 'firebase-functions/v2';
import { google } from 'googleapis';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;
const SHEET_ID = process.env.SHEETS_SHEET_ID;
const RANGE = process.env.SHEETS_SHEET_RANGE;
const SHEETS_SERVICE_ACCOUNT_CLIENT_EMAIL = process.env.SHEETS_SERVICE_ACCOUNT_CLIENT_EMAIL;
const SHEETS_SERVICE_ACCOUNT_PRIVATE_KEY = process.env.SHEETS_SERVICE_ACCOUNT_PRIVATE_KEY;
const SHEETS_AUTH_URL = 'https://www.googleapis.com/auth/spreadsheets';
const client = new google.auth.JWT(SHEETS_SERVICE_ACCOUNT_CLIENT_EMAIL, null, SHEETS_SERVICE_ACCOUNT_PRIVATE_KEY, [SHEETS_AUTH_URL]);

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
  try {
    const operationParams = {
      ...params,
      spreadsheetId: SHEET_ID,
      range: params.range || RANGE
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
