import { orders, readSheet, log } from './shared.js';

const EMAIL_COLUMN = 5;

try {
  const response = await readSheet();
  const rows = response.data.values.slice(2);
  const emails = rows.map((row) => row[EMAIL_COLUMN]?.toLowerCase()).filter((email) => email);

  console.log('\nOrders missing from sheet:');
  const ordersMissingFromSheet = orders.filter((order) => !emails.includes(order.people[0].email.toLowerCase()));
  for (const order of ordersMissingFromSheet) {
    log({
      message: `${order.key} ${order.people[0].email}`,
      email: order.people[0].email
    });
  }

  console.log('\nDuplicate emails in spreadsheet:');
  const duplicateEmails = emails.sort().filter((email, index, array) => email === array[index + 1]);
  for (const email of duplicateEmails) {
    log({
      message: email,
      email
    });
  }

} catch (error) {
  console.error(error);
}
console.log('');
