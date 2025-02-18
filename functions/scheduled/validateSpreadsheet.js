// missingFromSpreadsheet: list orders in db but not spreadsheet (based on firestore key)
// duplicateEmailsInSpreadsheet: list duplicate emails in the spreadsheet

// local testing: run functions from `firebase functions:shell`

import { logger } from 'firebase-functions/v2';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFinalOrders } from '../shared/orders.js';
import { readSheet } from '../shared/spreadsheet.js';
import { sendMail } from '../shared/email.js';
import { getOrderEmail, getOrderDomain } from '../helpers.js';
const testDomains = process.env.EMAIL_IGNORE_TEST_DOMAINS ? process.env.EMAIL_IGNORE_TEST_DOMAINS.split(',').map(domain => domain.trim()) : [];

const KEY_COLUMN = process.env.SHEETS_KEY_COLUMN;
const EMAIL_COLUMN = process.env.SHEETS_EMAIL_COLUMN;

export const missingFromSpreadsheet = onSchedule(
  {
    schedule: '1 2 * * *', // daily at 2:01am pacific time
    timeZone: 'America/Los_Angeles',
  },
  async () => {
    try {
      const response = await readSheet();
      const rows = response.data.values.slice(2);
      const keys = rows.map((row) => row[KEY_COLUMN]).filter((key) => key !== '-');

      const orders = await getFinalOrders();
      const missingOrders = orders.filter((order) => !keys.includes(order.key));
      const missingOrdersFiltered = missingOrders.filter(order => !testDomains.includes(getOrderDomain(order)));

      if (missingOrdersFiltered.length === 0) {
        logger.info('No final orders missing from spreadsheet :)');
        return;
      }
      logger.info(`Final orders missing from spreadsheet: ${missingOrdersFiltered.length}`);

      await sendMail({
        to: process.env.EMAIL_NOTIFY_TO,
        subject: `${process.env.GCLOUD_PROJECT}: Orders missing from spreadsheet`,
        text: missingOrdersFiltered.map((order) => `${order.key} ${getOrderEmail(order)}`).join('\n')
      });

    } catch (error) {
      logger.error('Error in missingFromSpreadsheet', error);
    }
  }
)

export const duplicateEmailsInSpreadsheet = onSchedule(
  {
    schedule: '2 2 * * *', // daily at 2:02am pacific time
    timeZone: 'America/Los_Angeles',
  },
  async () => {
    try {
      const response = await readSheet();
      const rows = response.data.values.slice(2);
      const rowsWithIdCol = rows.filter(row => row[KEY_COLUMN] !== '-');
      const emails = rowsWithIdCol.map((row) => row[EMAIL_COLUMN]?.toLowerCase()).filter((email) => email);

      const duplicateEmails = emails.sort().filter((email, index, array) => email === array[index + 1]);
      const uniqueDuplicateEmails = [...new Set(duplicateEmails)];
      const duplicateEmailsFiltered = uniqueDuplicateEmails.filter(email => !testDomains.includes(email.split('@')[1]));

      if (duplicateEmailsFiltered.length === 0) {
        logger.info('No duplicate emails in spreadsheet :)');
        return;
      }
      logger.info(`Duplicate emails in spreadsheet: ${duplicateEmailsFiltered.length}`);

      await sendMail({
        to: process.env.EMAIL_NOTIFY_TO,
        subject: `${process.env.GCLOUD_PROJECT}: Duplicate emails in spreadsheet`,
        text: duplicateEmailsFiltered.map((email) => email).join('\n')
      });

    } catch (error) {
      logger.error('Error in duplicateEmails', error);
    }
  }
)
