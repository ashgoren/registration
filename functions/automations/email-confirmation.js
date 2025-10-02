import { logger } from 'firebase-functions/v2';
import { sendMail } from '../shared/email.js';
import { getConfig } from '../config/internal/config.js';

// onDocumentUpdated
export const sendEmailConfirmationsHandler = async (event) => {
  const { EMAIL_IGNORE_TEST_DOMAINS, EMAIL_FROM, EMAIL_SUBJECT, EMAIL_REPLY_TO, IS_EMULATOR, ENV } = getConfig();
  const testDomains = EMAIL_IGNORE_TEST_DOMAINS ? EMAIL_IGNORE_TEST_DOMAINS.split(',').map(domain => domain.trim()) : [];

  const { before, after } = event.data;
  if (before?.data()?.status === 'pending' && after.data().status === 'final') {
    const { people } = after.data();
    const firstPerson = people[0];
    for (const [index, person] of people.entries()) {
      const { email, receipt } = person;
      const [emailUsername, emailDomain] = email.split('@');
      if (testDomains.includes(emailDomain) && !emailUsername.includes('receipt') && ENV !== 'prd') {
        logger.info(`SKIPPING RECEIPT SEND (TEST DOMAIN): ${email}`);
      } else if (person.email === firstPerson.email && index > 0) {
        logger.info(`SKIPPING RECEIPT SEND (DUPLICATE EMAIL): ${email}`);
      } else {
        await sendMail({
          from: EMAIL_FROM,
          to: email,
          subject: EMAIL_SUBJECT,
          html: receipt,
          replyTo: EMAIL_REPLY_TO
        });
        logger.info((IS_EMULATOR ? 'SKIPPED: ' : '') + `RECEIPT SENT TO: ${email}`);
      }
    }
  }
};
