import { pending, pendingOrders, orders, log } from './shared.js';

console.log(pending ? '\nPENDING ORDERS\n' : '\nFINAL ORDERS\n');
const theOrders = pending ? pendingOrders : orders;

try {
  for (const order of theOrders) {
    const { key, createdAt, people, paymentId } = order;
    // console.log(order);
    const date = createdAt.toDate().toLocaleDateString();
    const purchaser = people[0];
    const email = purchaser.email;
    const formattedPeople = formatPeople(people);
    log({
      message: `${formattedPeople}, ${key}, ${date}, ${email}, ${paymentId}`,
      email
    });
  }
} catch (error) {
  console.error(error);
}
console.log('');


// helper function
function formatPeople(people) {
  return people.map((person) => {
    return `${person.first} ${person.last}`;
  }).join(';');
}
