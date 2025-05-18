import * as Yup from 'yup';
import { config } from 'config';
const { FIELD_CONFIG, PERSON_FIELDS, DONATION_MAX } = config;

export const validationSchema = ({ currentPage }) => {

  const personValidationObject = PERSON_FIELDS.reduce((obj, fieldName) => {
    const fieldConfig = FIELD_CONFIG[fieldName];

    // Validate fieldConfig
    if (!fieldConfig || !fieldConfig.validation) {
      throw new Error(`FIELD_CONFIG is missing or incomplete for field: ${fieldName}`);
    }
    if (fieldConfig.conditionalValidation && !fieldConfig.conditionalValidation.testFn) {
      throw new Error(`FIELD_CONFIG is missing testFn for conditionalValidation for field: ${fieldName}`);
    }

    // Start with the base validation schema from FIELD_CONFIG
    let yupValidationChain = fieldConfig.validation;

    // Apply conditional validation if it's defined for this field
    if (fieldConfig.conditionalValidation) {
      const { message='Field is required', testFn } = fieldConfig.conditionalValidation;
      yupValidationChain = yupValidationChain.test(fieldName, message, testFn);
    }

    obj[fieldName] = yupValidationChain;
    return obj;
  }, {});

  const personValidationSchema = Yup.object(personValidationObject);

  const peopleSchema=Yup.object({
    people: Yup.array().of(personValidationSchema)
  });

  const paymentSchema=Yup.object({
    people: Yup.array().of(personValidationSchema),
    donation: Yup.number().min(0).max(DONATION_MAX)
  });

  const validationSchemas = {
    1: peopleSchema,
    2: paymentSchema
  };

  return validationSchemas[currentPage];
};
