// missingFromSpreadsheet: list orders in db but not spreadsheet (based on firestore key)
// duplicateEmailsInSpreadsheet: list duplicate emails in the spreadsheet

// local testing: run functions from `firebase functions:shell`

import { logger } from 'firebase-functions/v2';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFinalOrders } from '../shared/orders.js';
import { readSheet } from '../shared/spreadsheet.js';
import { sendMail } from '../shared/email.js';

const KEY_COLUMN = 0;
const EMAIL_COLUMN = 5;

export const missingFromSpreadsheet = onSchedule(
  {
    schedule: '0 0 * * *', // daily at midnight pacific time
    timeZone: 'America/Los_Angeles',
  },
  async () => {
    try {
      const response = await readSheet();
      const rows = response.data.values.slice(2);
      const keys = rows.map((row) => row[KEY_COLUMN]).filter((key) => key !== '-');

      const orders = await getFinalOrders();
      const ordersMissingFromSheet = orders.filter((order) => !keys.includes(order.key));
      const missingKeys = ordersMissingFromSheet.map((order) => order.key);
      
      if (missingKeys.length === 0) {
        logger.info('No final orders missing from spreadsheet :)');
        return;
      }
      logger.info(`Final orders missing from spreadsheet: ${missingKeys.length}`);

      await sendMail({
        to: process.env.EMAIL_NOTIFY_TO,
        subject: `${process.env.GCLOUD_PROJECT}: Orders missing from spreadsheet`,
        html: missingKeys.map((key) => `<p>${key}</p>`).join(''),
      });

    } catch (error) {
      logger.error('Error in missingFromSpreadsheet', error);
    }
  }
)

export const duplicateEmailsInSpreadsheet = onSchedule(
  {
    schedule: '0 0 * * *', // daily at midnight pacific time
    timeZone: 'America/Los_Angeles',
  },
  async () => {
    try {
      const response = await readSheet();
      const rows = response.data.values.slice(2);
      const emails = rows.map((row) => row[EMAIL_COLUMN]?.toLowerCase()).filter((email) => email);

      const duplicateEmails = emails.sort().filter((email, index, array) => email === array[index + 1]);
      const uniqueDuplicateEmails = [...new Set(duplicateEmails)];

      if (uniqueDuplicateEmails.length === 0) {
        logger.info('No duplicate emails in spreadsheet :)');
        return;
      }
      logger.info(`Duplicate emails in spreadsheet: ${uniqueDuplicateEmails.length}`);

      await sendMail({
        to: process.env.EMAIL_NOTIFY_TO,
        subject: `${process.env.GCLOUD_PROJECT}: Duplicate emails in spreadsheet`,
        html: uniqueDuplicateEmails.map((email) => `<p>${email}</p>`).join(''),
      });

    } catch (error) {
      logger.error('Error in duplicateEmails', error);
    }
  }
)
