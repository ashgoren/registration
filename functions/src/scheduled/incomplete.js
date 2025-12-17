// SCHEDULED FUNCTION

// list of incomplete orders (status === 'pending')

// local testing: run `emailIncompleteOrders()` from `firebase functions:shell`

import { logger } from 'firebase-functions/v2';
import { getPendingOrdersMissingFromFinalOrders } from '../shared/orders.js';
import { getOrderEmail, getOrderDomain } from '../shared/helpers.js';
import { sendMail } from '../shared/email.js';
import { getConfig } from '../config/internal/config.js';

// Scheduled function to email list of pending orders missing from final orders
export const emailIncompleteOrdersHandler = async () => {
  logger.info('emailIncompleteOrders triggered');

  const { EMAIL_IGNORE_TEST_DOMAINS, EMAIL_NOTIFY_TO, PROJECT_ID } = getConfig();
  const testDomains = EMAIL_IGNORE_TEST_DOMAINS ? EMAIL_IGNORE_TEST_DOMAINS.split(',').map(domain => domain.trim()) : [];

  const orders = await getPendingOrdersMissingFromFinalOrders();
  const filteredOrders = orders.filter(order => !testDomains.includes(getOrderDomain(order)));

  if (filteredOrders.length === 0) {
    logger.info('No pending orders missing from orders :)');
    return;
  }

  logger.info(`Pending orders missing from orders: ${filteredOrders.length}`);
  await sendMail({
    to: EMAIL_NOTIFY_TO,
    subject: `${PROJECT_ID}: Incomplete Orders`,
    text: filteredOrders.map((order) => `${order.key} ${getOrderEmail(order)}`).join('\n')
  });
};
