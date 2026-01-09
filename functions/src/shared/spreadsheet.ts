import { logger } from 'firebase-functions/v2';
import { google } from 'googleapis';
import { getConfig } from '../config/internal/config.js';
import type { sheets_v4 } from 'googleapis';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;

const SHEET_OPERATIONS = {
  READ: 'read',
  APPEND: 'append',
  UPDATE: 'update',
};

async function readSheet(): Promise<sheets_v4.Schema$ValueRange> {
  const { SHEETS_ORDERS_TAB_NAME } = getConfig();
  const response = await googleSheetsOperation({
    operation: SHEET_OPERATIONS.READ,
    params: {
      range: SHEETS_ORDERS_TAB_NAME || 'Orders'
    }
  });
  return response.data as sheets_v4.Schema$ValueRange;
}

async function appendAllLines(lines: string[][]) {
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

async function googleSheetsOperation({ operation, params }: { operation: string; params: Record<string, unknown> }, attempt = 0) {
  const { SHEETS_SHEET_ID, SHEETS_SHEET_RANGE, SHEETS_SERVICE_ACCOUNT_KEY } = getConfig();
  const SHEETS_AUTH_URL = 'https://www.googleapis.com/auth/spreadsheets';
  const serviceAccountKey = JSON.parse(SHEETS_SERVICE_ACCOUNT_KEY);
  const client = new google.auth.JWT({
    email: serviceAccountKey.client_email,
    key: serviceAccountKey.private_key,
    scopes: [SHEETS_AUTH_URL],
  });

  try {
    const operationParams: {
      spreadsheetId: string;
      range: string;
      [key: string]: unknown;
    } = {
      ...params,
      spreadsheetId: SHEETS_SHEET_ID,
      range: params.range as string || SHEETS_SHEET_RANGE
    };
    
    await client.authorize();
    const sheets = google.sheets({ version: 'v4', auth: client });

    switch (operation) {
      case SHEET_OPERATIONS.READ:
        return sheets.spreadsheets.values.get(operationParams);
      case SHEET_OPERATIONS.APPEND:
        return sheets.spreadsheets.values.append(operationParams);
      case SHEET_OPERATIONS.UPDATE:
        return sheets.spreadsheets.values.update(operationParams);
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
