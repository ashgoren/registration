// list of incomplete orders (status === 'pending')

// local testing: run `emailIncompleteOrders()` from `firebase functions:shell`

import { logger } from 'firebase-functions/v2';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getPendingOrdersMissingFromFinalOrders } from '../shared/orders.js';
import { getOrderEmail, getOrderDomain } from '../helpers.js';
import { sendMail } from '../shared/email.js';
import { PROJECT_ID } from '../helpers.js';
const testDomains = process.env.EMAIL_IGNORE_TEST_DOMAINS ? process.env.EMAIL_IGNORE_TEST_DOMAINS.split(',').map(domain => domain.trim()) : [];

export const emailIncompleteOrders = onSchedule(
  {
    schedule: '0 2 * * *', // daily at 2am pacific time
    timeZone: 'America/Los_Angeles',
  },
  async () => {
    logger.info('emailIncompleteOrders triggered');

    const orders = await getPendingOrdersMissingFromFinalOrders();
    const filteredOrders = orders.filter(order => !testDomains.includes(getOrderDomain(order)));

    if (filteredOrders.length === 0) {
      logger.info('No pending orders missing from orders :)');
      return;
    }

    logger.info(`Pending orders missing from orders: ${filteredOrders.length}`);
    await sendMail({
      to: process.env.EMAIL_NOTIFY_TO,
      subject: `${PROJECT_ID}: Incomplete Orders`,
      text: filteredOrders.map((order) => `${order.key} ${getOrderEmail(order)}`).join('\n')
    });  
  }
);
