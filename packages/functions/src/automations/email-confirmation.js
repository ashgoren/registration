import { logger } from 'firebase-functions/v2';
import { sendMail } from '../shared/email.js';
import { getConfig } from '../config/internal/config.js';

// onDocumentUpdated
export const sendEmailConfirmationsHandler = async (event) => {
  const { EMAIL_FROM, EMAIL_REPLY_TO, EVENT_TITLE, IS_EMULATOR, WAITLIST_MODE } = getConfig();
  const testDomains = ['test.com', 'testing.com', 'example.com', 'example.org', 'example.net'];

  const { before, after } = event.data;
  if (before?.data()?.status === 'pending' && after.data().status === 'final') {
    const { people } = after.data();
    const firstPerson = people[0];
    for (const [index, person] of people.entries()) {
      const { email, receipt } = person;
      const emailDomain = email.split('@')[1].toLowerCase();
      if (testDomains.includes(emailDomain)) {
        logger.info(`SKIPPING RECEIPT SEND (TEST DOMAIN): ${email}`);
      } else if (person.email === firstPerson.email && index > 0) {
        logger.info(`SKIPPING RECEIPT SEND (DUPLICATE EMAIL): ${email}`);
      } else {
        await sendMail({
          from: EMAIL_FROM,
          to: email,
          subject: `${EVENT_TITLE} ${WAITLIST_MODE ? 'Waitlist' : 'Registration'}`,
          html: receipt,
          replyTo: EMAIL_REPLY_TO
        });
        logger.info((IS_EMULATOR ? 'SKIPPED: ' : '') + `RECEIPT SENT TO: ${email}`);
      }
    }
  }
};
