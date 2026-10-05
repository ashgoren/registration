import docuseal from '@docuseal/api';
import { logger } from 'firebase-functions/v2';
import { createError, ErrorType } from '../shared/errorHandler.js';
import { getConfig } from '../config/internal/config.js';
import type { CreateSubmissionData } from '@docuseal/api';
import type { Person } from '../types/order.js';

type DocuSealSubmitter = CreateSubmissionData['submitters'][number];
type WaiverPerson = { name: string; email: string; phone: string };

const getDocuSeal = () => {
  docuseal.configure({ key: getConfig().DOCUSEAL_KEY });
  return docuseal;
};

const toBareAddress = (address: string) => address.match(/<([^>]+)>/)?.[1] ?? address.trim();

// Shared by the embedded (registrant) and emailed (additional attendee) flows so both waivers are prefilled identically
const buildSubmitter = ({ name, email, phone }: WaiverPerson): DocuSealSubmitter => ({
  email,
  role: 'Signer',
  fields: [
    {
      name: 'Full Legal Name',
      default_value: name
    },
    {
      name: 'Phone',
      default_value: phone,
      readonly: true
    },
    {
      name: 'Email',
      default_value: email,
      readonly: true
    }
  ]
});

// Embedded flow: registrant signs in-browser so docuseal sends no email and only the signing slug is returned for <DocusealForm>
export const createWaiverSubmission = async (data: WaiverPerson) => {
  const { email } = data;
  const { DOCUSEAL_TEMPLATE_ID } = getConfig();

  logger.info(`Creating submission for ${email} from template ${DOCUSEAL_TEMPLATE_ID}`);
  try {
    const submission = await getDocuSeal().createSubmission({
      template_id: Number(DOCUSEAL_TEMPLATE_ID),
      send_email: false,
      send_sms: false,
      submitters: [buildSubmitter(data)],
    });

    const slug = submission.submitters[0].slug;
    logger.info(`Waiver submission created for ${email}: ${slug}`);
    return { slug };
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Error creating waiver submission for ${email}: ${err.message}`);
    throw createError(ErrorType.EXTERNAL_API, 'Error creating waiver submission', { email, error });
  }
};

// Email flow: DocuSeal emails each additional attendee their own signing link.
// The template has a single 'Signer' role, so each person gets a separate submission.
export const sendWaiverRequests = async ({ orderId, attendees }: {
  orderId: string;
  attendees: { person: Person; index: number }[];
}) => {
  const { DOCUSEAL_TEMPLATE_ID, EVENT_TITLE, EMAIL_FROM, EMAIL_REPLY_TO, IS_EMULATOR } = getConfig();

  if (IS_EMULATOR) {
    attendees.forEach(({ person }) => logger.info(`SKIPPED (EMULATOR): waiver request to ${person.email} for order ${orderId}`));
    return [];
  }

  const ds = getDocuSeal();

  // allSettled so one rejected address doesn't stop the remaining requests
  const results = await Promise.allSettled(attendees.map(({ person, index }) => {
    const { first, last, email, phone } = person;
    logger.info(`Sending waiver request to ${email} for order ${orderId}`);
    return ds.createSubmission({
      template_id: Number(DOCUSEAL_TEMPLATE_ID),
      send_email: true,
      send_sms: false,
      reply_to: toBareAddress(EMAIL_REPLY_TO || EMAIL_FROM),
      message: {
        subject: `${EVENT_TITLE} waiver`,
        body: `Hi ${first},\n\n` +
          `Someone registered you for ${EVENT_TITLE}. ` +
          `Each attendee must sign their own waiver. Please read and sign yours here:\n\n` +
          `{{submitter.link}}\n\n` +
          `Thank you!`
      },
      submitters: [{
        ...buildSubmitter({ name: `${first} ${last}`, email, phone }),
        external_id: `${orderId}-${index}` // shows up in docuseal to identify order + person index
      }]
    });
  }));

  return results.map((result, i) => ({ ...attendees[i], result }));
};
