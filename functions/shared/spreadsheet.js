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

async function readSheet() {
  try {
    return await googleSheetsOperation({
      operation: 'read',
      params: {
        range: 'Orders'
      }
    });
  } catch (err) {
    logger.error(`Error reading spreadsheet`, err);
    throw err;
  }
}

async function appendAllLines(lines, attempt = 0) {
  try {
    return await googleSheetsOperation({
      operation: 'append',
      params: {
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        resource: {
          values: lines
        }
      }
    });
  } catch (err) {
    if (attempt < MAX_RETRIES) {
      const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
      return appendAllLines(lines, attempt + 1);
    } else {
      logger.error(`Error appending lines to spreadsheet`, err);
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

export { appendAllLines, readSheet };
