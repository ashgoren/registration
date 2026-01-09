// SCHEDULED FUNCTIONS

// missingFromSpreadsheet: list orders in db but not spreadsheet (based on firestore key)
// duplicateEmailsInSpreadsheet: list duplicate emails in the spreadsheet

// local testing: run functions from `firebase functions:shell`

import { logger } from 'firebase-functions/v2';
import { getOrders } from '../shared/orders.js';
import { readSheet } from '../shared/spreadsheet.js';
import { sendMail } from '../shared/email.js';
import { getOrderEmail, getOrderDomain } from '../shared/helpers.js';
import { getConfig } from '../config/internal/config.js';
import type { ScheduledEvent } from 'firebase-functions/v2/scheduler';

// Scheduled function to check for missing orders in the spreadsheet
export const missingFromSpreadsheetHandler = async (_event: ScheduledEvent) => {
  const { EMAIL_IGNORE_TEST_DOMAINS, SHEETS_KEY_COLUMN, EMAIL_NOTIFY_TO, PROJECT_ID } = getConfig();
  const testDomains = EMAIL_IGNORE_TEST_DOMAINS ? EMAIL_IGNORE_TEST_DOMAINS.split(',').map(domain => domain.trim()) : [];

  try {
    const response = await readSheet();
    // console.log('Spreadsheet read response:', response);
    const rows = response.values?.slice(2) ?? [];
    const keys = rows.map((row) => row[SHEETS_KEY_COLUMN]).filter((key) => key !== '-');

    const orders = await getOrders({ pending: false });
    const missingOrders = orders.filter((order) => !keys.includes(order.key));
    const missingOrdersFiltered = missingOrders.filter(order => !testDomains.includes(getOrderDomain(order)));

    if (missingOrdersFiltered.length === 0) {
      logger.info('No final orders missing from spreadsheet :)');
      return;
    }
    logger.info(`Final orders missing from spreadsheet: ${missingOrdersFiltered.length}`);

    await sendMail({
      to: EMAIL_NOTIFY_TO,
      subject: `${PROJECT_ID}: Orders missing from spreadsheet`,
      text: missingOrdersFiltered.map((order) => `${order.key} ${getOrderEmail(order)}`).join('\n')
    });

  } catch (error) {
    logger.error('Error in missingFromSpreadsheet', error);
  }
};

// Scheduled function to check for duplicate emails in the spreadsheet
export const duplicateEmailsInSpreadsheetHandler = async (_event: ScheduledEvent) => {
  const { EMAIL_IGNORE_TEST_DOMAINS, SHEETS_KEY_COLUMN, SHEETS_EMAIL_COLUMN, EMAIL_NOTIFY_TO, PROJECT_ID } = getConfig();
  const testDomains = EMAIL_IGNORE_TEST_DOMAINS ? EMAIL_IGNORE_TEST_DOMAINS.split(',').map(domain => domain.trim()) : [];

  try {
    const response = await readSheet();
    const rows = response.values?.slice(2) ?? [];
    const rowsWithIdCol = rows.filter(row => row[SHEETS_KEY_COLUMN] !== '-');
    const emails = rowsWithIdCol.map((row) => row[SHEETS_EMAIL_COLUMN]?.toLowerCase()).filter((email) => email);

    const duplicateEmails = emails.sort().filter((email, index, array) => email === array[index + 1]);
    const uniqueDuplicateEmails = [...new Set(duplicateEmails)];
    const duplicateEmailsFiltered = uniqueDuplicateEmails.filter(email => !testDomains.includes(email.split('@')[1]));

    if (duplicateEmailsFiltered.length === 0) {
      logger.info('No duplicate emails in spreadsheet :)');
      return;
    }
    logger.info(`Duplicate emails in spreadsheet: ${duplicateEmailsFiltered.length}`);

    await sendMail({
      to: EMAIL_NOTIFY_TO,
      subject: `${PROJECT_ID}: Duplicate emails in spreadsheet`,
      text: duplicateEmailsFiltered.map((email) => email).join('\n')
    });

  } catch (error) {
    logger.error('Error in duplicateEmails', error);
  }
};
