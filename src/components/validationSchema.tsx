import * as Yup from 'yup';
import { VALIDATION_PAGES } from 'utils/pageFlow';
import { config } from 'config';

const { FIELD_CONFIG, PERSON_FIELDS, DONATION_MAX } = config;

export const validationSchema = ({ currentPage }: { currentPage: string }) => {
  if (!VALIDATION_PAGES.find(page => page.key === currentPage)) return null;

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
  }, {} as Record<string, Yup.AnySchema>);

  const personValidationSchema = Yup.object(personValidationObject);

  const peopleSchema=Yup.object({
    people: Yup.array().of(personValidationSchema)
  });

  const waiverSchema=Yup.object({
    people: Yup.array().of(
      personValidationSchema.shape({
        waiver: Yup.string().required()
      })
    )
  });

  const paymentSchema=Yup.object({
    people: Yup.array().of(personValidationSchema),
    donation: Yup.number().min(0).max(DONATION_MAX)
  });

  const validationSchemas: Record<string, Yup.AnyObjectSchema> = {
    'people': peopleSchema,
    'waiver': waiverSchema,
    'payment': paymentSchema
  };

  return validationSchemas[currentPage];
};
