import type { Order } from '../types/order';

// export const formatDateTime = (date) => {
//   if (!date) return null;
//   const localDate = new Date(date);
//   return localDate.toLocaleString('sv-SE', {
//     timeZone: 'America/Los_Angeles',
//     year: 'numeric',
//     month: '2-digit',
//     day: '2-digit',
//     hour: '2-digit',
//     minute: '2-digit',
//     hour12: false
//   });
// };

export const getDateChunks = (start: Date, end: Date, days: number) => {
  const chunks = [];
  const now = new Date();
  const current = new Date(start);

  while (current < end) {
    const chunkStart = new Date(current);
    current.setDate(current.getDate() + days); // increment by specified number of days
    const chunkEnd = current > end ? end : new Date(current.getTime() - 1); // subtract 1 ms to avoid overlap
    if (chunkStart < now) {
      chunks.push({ start: chunkStart, end: chunkEnd });
    }
  }
  return chunks;
};

export const formatCurrency = (amount: number) => {
  return Number(amount).toFixed(2);
}

export const getOrderEmail = (order: Order) => {
  return order.people[0].email;
}

export const getOrderDomain = (order: Order) => {
  return getOrderEmail(order).split('@')[1];
}
