import * as Yup from 'yup';
import { config } from 'config';

export const validationSchema = ({ currentPage }: { currentPage: string }) => {
  if (!config.navigation.validationPages.find((page: { key: string }) => page.key === currentPage)) return null;

  const personValidationObject = config.fields.personFields.reduce((obj: Record<string, Yup.AnySchema>, fieldName: string) => {
    const fieldConfig = config.fields.fieldsConfig[fieldName];

    // Validate fieldConfig
    if (!fieldConfig || !fieldConfig.validation) {
      throw new Error(`fieldsConfig is missing or incomplete for field: ${fieldName}`);
    }
    if (fieldConfig.conditionalValidation && !fieldConfig.conditionalValidation.testFn) {
      throw new Error(`fieldsConfig is missing testFn for conditionalValidation for field: ${fieldName}`);
    }

    // Start with the base validation schema from fieldsConfig
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

  const paymentSchema=Yup.object({
    people: Yup.array().of(personValidationSchema),
    donation: Yup.number().min(0).max(config.payments.donation.max || 0)
  });

  const validationSchemas: Record<string, Yup.AnyObjectSchema> = {
    'people': peopleSchema,
    'payment': paymentSchema,
    'waitlist': paymentSchema
  };

  return validationSchemas[currentPage];
};
