import * as Yup from 'yup';
import config from 'config';
const { FIELD_CONFIG, PERSON_CONTACT_FIELDS, ADMISSION_COST_RANGE, DONATION_RANGE } = config;

export function validationSchema({ currentPage }) {

  const personValidationSchema = Yup.object(
    PERSON_CONTACT_FIELDS.reduce((obj, field) => ({ ...obj, [field]: FIELD_CONFIG[field].validation }), {})
  );

  const peopleSchema=Yup.object({
    people: Yup.array().of(personValidationSchema),
    emailConfirmation: FIELD_CONFIG.emailConfirmation.validation,
  });
  
  const paymentSchema=Yup.object({
    admissionCost: Yup.number().min(ADMISSION_COST_RANGE[0]).max(ADMISSION_COST_RANGE[1]).required(),
    donation: Yup.number().min(DONATION_RANGE[0]).max(DONATION_RANGE[1])
  });

  const validationSchemas = {
    1: peopleSchema,
    2: paymentSchema
  };

  return validationSchemas[currentPage];
}
