import docuseal from '@docuseal/api';
import { logger } from 'firebase-functions/v2';
import { createError, ErrorType } from '../shared/errorHandler.js';
import { getConfig } from '../config/internal/config.js';

interface DocuSealAPI {
  key: string;
  createSubmission: (params: DocuSealSubmissionParams) => Promise<DocuSealSubmission>;
}

interface DocuSealSubmissionParams {
  template_id: string;
  send_email: boolean;
  send_sms: boolean;
  submitters: {
    email: string;
    role: string;
    fields: {
      name: string;
      default_value: string;
      readonly?: boolean;
    }[];
  }[];
}

interface DocuSealSubmission {
  submitters: { slug: string }[];
}

export const createWaiverSubmission = async (data: { name: string; email: string; phone: string }) => {
  const { name, email, phone } = data;
  const { DOCUSEAL_KEY, DOCUSEAL_TEMPLATE_ID } = getConfig();

  const ds = docuseal as unknown as DocuSealAPI;
  ds.key = DOCUSEAL_KEY!;

  logger.info(`Creating submission for ${email} from template ${DOCUSEAL_TEMPLATE_ID}`);
  try {
    const submission = await ds.createSubmission({
      template_id: DOCUSEAL_TEMPLATE_ID!,
      send_email: false,
      send_sms: false,
      submitters: [
        {
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
        },
      ],
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
