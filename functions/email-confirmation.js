import { logger } from 'firebase-functions/v2';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { sendMail } from './shared/email.js';
import { IS_EMULATOR } from './helpers.js';
const testDomains = process.env.EMAIL_IGNORE_TEST_DOMAINS ? process.env.EMAIL_IGNORE_TEST_DOMAINS.split(',').map(domain => domain.trim()) : [];

export const sendEmailConfirmations = onDocumentUpdated(`orders/{ITEM}`, async (event) => {
  const { before, after } = event.data;
  if (before?.data()?.status === 'pending' && after.data().status === 'final') {
    const { people } = after.data();
    for (const person of people) {
      const { email, receipt } = person;
      if (testDomains.includes(email.split('@')[1])) {
        logger.info(`SKIPPING RECEIPT SEND: ${email}`);
      } else {
        await sendMail({
          from: process.env.EMAIL_FROM,
          to: email,
          subject: process.env.EMAIL_SUBJECT,
          html: receipt,
          replyTo: process.env.EMAIL_REPLY_TO
        });
        logger.info((IS_EMULATOR ? 'SKIPPED: ' : '') + `RECEIPT SENT TO: ${email}`);
      }
    }
  }
});
