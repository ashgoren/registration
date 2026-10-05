import { logger } from 'firebase-functions/v2';
import { sendMail } from '../shared/email.js';
import { sendWaiverRequests } from '../api/waiver.js';
import { getConfig } from '../config/internal/config.js';

import type { FirestoreEvent, Change, QueryDocumentSnapshot } from 'firebase-functions/v2/firestore';
import type { Order } from '../types/order';

// onDocumentUpdated
// Primary registrant signs their waiver during registration. Other attendees need a signing link emailed.
export const sendWaiverRequestsHandler = async (event: FirestoreEvent<Change<QueryDocumentSnapshot> | undefined>) => {
  const { EMAIL_NOTIFY_TO, PROJECT_ID, SHOW_WAIVER } = getConfig();
  const testDomains = ['test.com', 'testing.com', 'example.com', 'example.org', 'example.net'];

  if (!SHOW_WAIVER) return;

  if (!event.data?.before || !event.data?.after) {
    logger.error('Missing before or after data in event');
    return;
  }

  const { before, after } = event.data!;
  if (!(before?.data()?.status === 'pending' && after.data().status === 'final')) return;

  const { people } = after.data() as Order;

  const attendees = people
    .map((person, index) => ({ person, index }))
    .filter(({ person, index }) => {
      if (index === 0) return false;
      const emailDomain = person.email.split('@')[1].toLowerCase();
      if (testDomains.includes(emailDomain)) {
        logger.info(`SKIPPING WAIVER REQUEST (TEST DOMAIN): ${person.email}`);
        return false;
      }
      return true;
    });

  if (!attendees.length) return;

  const results = await sendWaiverRequests({ orderId: after.id, attendees });

  results
    .filter(({ result }) => result.status === 'fulfilled')
    .forEach(({ person }) => logger.info(`WAIVER REQUEST SENT TO: ${person.email}`));

  const failures = results.filter(({ result }) => result.status === 'rejected');
  if (failures.length) {
    // These attendees show as 'emailed' in the spreadsheet but DocuSeal never received the request
    const lines = failures.map(({ person, result }) =>
      `${person.first} ${person.last} <${person.email}>: ${(result as PromiseRejectedResult).reason?.message || result}`
    );
    logger.error(`WAIVER REQUEST FAILED for order ${after.id}`, { failures: lines });
    await sendMail({
      to: EMAIL_NOTIFY_TO,
      subject: `${PROJECT_ID} - Waiver request failed: order ${after.id}`,
      text: `DocuSeal waiver requests could not be sent for order ${after.id}.\n\nSend these waivers manually from DocuSeal:\n\n${lines.join('\n')}`
    });
  }
};
