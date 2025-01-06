import { pendingOrders, log } from './shared.js';

if (pendingOrders.length === 0) {
  console.log('\nNo pending orders missing from orders :)\n');
  process.exit();
}

for (const order of pendingOrders) {
  log({
    message: `${order.key} ${order.people[0].email}`,
    email: order.people[0].email
  });
}
