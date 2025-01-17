// list of incomplete orders (status === 'pending')

// local testing: run `emailIncompleteOrders()` from `firebase functions:shell`

import { logger } from 'firebase-functions/v2';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getPendingOrders } from '../shared/orders.js';
import { sendMail } from '../shared/email.js';
import { PROJECT_ID } from '../helpers.js';

export const emailIncompleteOrders = onSchedule(
  {
    schedule: '0 0 * * *', // daily at midnight pacific time
    timeZone: 'America/Los_Angeles',
  },
  async () => {
    logger.info('emailIncompleteOrders triggered');

    const orders = await getPendingOrders();

    if (orders.length === 0) {
      logger.info('No pending orders missing from orders :)');
      return;
    }
    logger.info(`Pending orders missing from orders: ${orders.length}`);
  
    await sendMail({
      to: process.env.EMAIL_NOTIFY_TO,
      subject: `${PROJECT_ID}: Incomplete Orders`,
      text: orders.map((order) => `${order.key} ${order.people[0].email}`).join('\n')
    });  
  }
);
