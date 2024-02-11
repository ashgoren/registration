import * as Yup from 'yup';
import config from 'config';
const { FIELD_CONFIG, PERSON_CONTACT_FIELDS, ADMISSION_COST_RANGE, ADMISSION_QUANTITY_MAX, DONATION_RANGE } = config;

export function validationSchema({ currentPage, admissionQuantity }) {

  const page1Schema=Yup.object({
    people: Yup.array().of(
      Yup.lazy((value) => {
        return value.index < admissionQuantity ? personValidationSchema(value.index) : Yup.mixed().notRequired();
      })
    ),
    emailConfirmation: FIELD_CONFIG.emailConfirmation.validation,
    admissionQuantity: Yup.number().min(1).max(ADMISSION_QUANTITY_MAX).required()
  });
  
  const page2Schema=Yup.object({
    admissionCost: Yup.number()
      .min(ADMISSION_COST_RANGE[0])
      .max(ADMISSION_COST_RANGE[1])
      .required(),
    donation: Yup.number()
      .min(DONATION_RANGE[0])
      .max(DONATION_RANGE[1])
  });

  const validationSchemas = {
    1: page1Schema,
    2: page2Schema,
  };

  return validationSchemas[currentPage];
}

function personValidationSchema(index) {
  return Yup.object(Object.keys(FIELD_CONFIG).reduce((obj, field) => {
    return PERSON_CONTACT_FIELDS.includes(field) ?
      { ...obj, [field]: FIELD_CONFIG[field].validation }
      : obj;
  }, {}));
}
