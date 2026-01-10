import { logger } from 'firebase-functions/v2';
import { initializeApp, getApps } from 'firebase-admin/app';
import { fieldOrder } from '../shared/fields.js';
import { appendAllLines } from '../shared/spreadsheet.js';
import type { FirestoreEvent, Change, QueryDocumentSnapshot } from 'firebase-functions/v2/firestore';
import type { Order, Person } from '../types/order';
import { getConfig } from '../config/internal/config.js';

type OrderWithKey = Order & { key: string };

if (!getApps().length) initializeApp();

// onDocumentUpdated
export const appendRecordToSpreadsheetHandler = async (event: FirestoreEvent<Change<QueryDocumentSnapshot> | undefined>) => {
  if (!event.data?.after) {
    logger.error('Missing after data in event');
    return;
  }

  const { before, after } = event.data!;
  if (before?.data()?.status === 'pending' && after.data().status === 'final') {
    logger.info(`APPEND TO SPREADSHEET: ${after.id}`);
    try {
      const order = { ...after.data(), key: after.id } as OrderWithKey;
      const lines = mapOrderToSpreadsheetLines(order);
      await appendAllLines(lines);
    } catch (err) {
      logger.error(`Error in appendRecordToSpreadsheetHandler for ${after.data().people[0].email}`, err);
    }
  }
};

const mapOrderToSpreadsheetLines = (order: OrderWithKey) => {
  const { people, ...orderFields } = order;
  
  const lines: string[][] = [];
  people.forEach((person, index) => {
    const isPurchaser = index === 0;

    // Build person fields
    const personFieldsBuilder = buildPersonLine({
      person,
      order,
      isPurchaser,
      people,
      completedAt: order.completedAt!.toDate().toLocaleString('sv-SE', getConfig().TIMESTAMP_FORMAT),
      environment: order.environment === 'prd' ? '' : order.environment
    });

    // Include order fields only for purchaser
    const personFields = isPurchaser
      ? { ...orderFields, ...personFieldsBuilder }
      : personFieldsBuilder;

    // Put fields in correct order, replace undefined/null/0 with empty string
    const line = fieldOrder.map(field => String(personFields[field] || ''));
    lines.push(line);
  });

  return lines;
};

const buildPersonLine = ({ person, order, isPurchaser, people, completedAt, environment }: {
  person: Person;
  order: OrderWithKey;
  isPurchaser: boolean;
  people: Person[];
  completedAt: string;
  environment: string 
}): Record<string, unknown> => {
  const paymentFields = calculatePaymentFields({
    order,
    person,
    isPurchaser,
    peopleCount: people.length
  });

  const normalizedPerson = normalizePersonForSpreadsheet(person); // join arrays, replace newlines

  const purchaserField = isPurchaser
    ? (people.length > 1 ? `self (+${people.length - 1})` : 'self')
    : `${people[0].first} ${people[0].last}`;

  return {
    ...normalizedPerson,
    ...paymentFields,
    key: isPurchaser ? order.key : '-',
    address: formatAddress(normalizedPerson),
    photo: formatPhoto(normalizedPerson),
    misc: formatMisc(normalizedPerson),
    share: formatShare(normalizedPerson),
    purchaser: purchaserField,
    completedAt,
    environment
  };
};

const calculatePaymentFields = ({ order, person, isPurchaser, peopleCount}: {
  order: OrderWithKey,
  person: Person,
  isPurchaser: boolean,
  peopleCount: number
}) => {
  if (order.paymentId === 'waitlist') {
    return { admission: 0, donation: 0, total: 0, deposit: 0, fees: 0, paid: 0, charged: 0, status: 'waitlist' as const };
  }

  const fees = isPurchaser ? (order.fees || 0) : 0;
  const donation = isPurchaser ? (order.donation || 0) : 0;
  const charged = isPurchaser ? order.charged : '-';
  const admission = Number(person.admission);
  const total = isPurchaser ? admission + donation : admission;

  if (order.deposit) {
    const deposit = order.deposit / peopleCount;
    const paid = isPurchaser ? deposit + donation + fees : deposit;
    return { admission: 0, donation, total: 0, deposit, fees, paid, charged, status: 'deposit' as const };
  }

  if (order.paymentId === 'check') {
    return { admission, donation, total, deposit: 0, fees: 0, paid: 0, charged, status: 'awaiting check' as const };
  }

  const paid = isPurchaser ? total + fees : total;
  return { admission, donation, total, deposit: 0, fees, paid, charged, status: 'paid' as const };
};


// Person field formatters

const formatAddress = (person: PersonForSpreadsheet) => {
  const { address, apartment } = person;
  if (!apartment) return address;
  return address + ' ' + (/^\d/.test(apartment) ? `#${apartment}` : apartment);
};

const formatPhoto = (person: PersonForSpreadsheet) => {
  const { photo, photoComments } = person;
  return photo === 'Other' ? photoComments : photo;
};

const formatMisc = (person: PersonForSpreadsheet) => {
  const { misc, miscComments } = person;
  if (!misc) return '';
  return (misc as unknown as string).replace('minor', `minor (${miscComments})`);
};

const formatShare = (person: PersonForSpreadsheet) => {
  return person.share || 'do not share';
};

type PersonForSpreadsheet = {
  [K in keyof Person]: Person[K] extends unknown[] ? string : Person[K];
};

const normalizePersonForSpreadsheet = (person: Person): PersonForSpreadsheet => {
  return Object.fromEntries(
    Object.entries(person).map(([key, value]) => {
      if (Array.isArray(value)) return [key, value.join(', ')];
      if (typeof value === 'string') return [key, value.replace(/\n/g, '; ')];
      return [key, value];
    })
  ) as PersonForSpreadsheet;
};
