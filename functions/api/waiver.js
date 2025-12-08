import docuseal from '@docuseal/api';
import { logger } from 'firebase-functions/v2';
import { createError, ErrorType } from '../shared/errorHandler.js';
import { getConfig } from '../config/internal/config.js';

export const createWaiverSubmission = async (data) => {
  const { name, email, phone } = data;
  const { DOCUSEAL_KEY, DOCUSEAL_TEMPLATE_ID } = getConfig();
  docuseal.key = DOCUSEAL_KEY;

  logger.info(`Creating submission for ${email} from template ${DOCUSEAL_TEMPLATE_ID}`);
  try {
    const submission = await docuseal.createSubmission({
      template_id: DOCUSEAL_TEMPLATE_ID,
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
  } catch (error) {
    logger.error(`Error creating waiver submission for ${email}: ${error.message}`);
    throw createError(ErrorType.EXTERNAL_API, 'Error creating waiver submission', { email, error });
  }
};