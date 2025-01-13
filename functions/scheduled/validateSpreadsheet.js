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
    schedule: '0 1 * * *', // daily at 12:01am pacific time
    timeZone: 'America/Los_Angeles',
  },
  async () => {
    try {
      const response = await readSheet();
      const rows = response.data.values.slice(2);
      const keys = rows.map((row) => row[KEY_COLUMN]).filter((key) => key !== '-');

      const orders = await getFinalOrders();
      const missingOrders = orders.filter((order) => !keys.includes(order.key));
      
      if (missingOrders.length === 0) {
        logger.info('No final orders missing from spreadsheet :)');
        return;
      }
      logger.info(`Final orders missing from spreadsheet: ${missingOrders.length}`);

      await sendMail({
        to: process.env.EMAIL_NOTIFY_TO,
        subject: `${process.env.GCLOUD_PROJECT}: Orders missing from spreadsheet`,
        text: missingOrders.map((order) => `${order.key} ${order.people[0].email}`).join('\n')
      });

    } catch (error) {
      logger.error('Error in missingFromSpreadsheet', error);
    }
  }
)

export const duplicateEmailsInSpreadsheet = onSchedule(
  {
    schedule: '0 2 * * *', // daily at 12:02am pacific time
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
        text: uniqueDuplicateEmails.map((email) => email).join('\n')
      });

    } catch (error) {
      logger.error('Error in duplicateEmails', error);
    }
  }
)
