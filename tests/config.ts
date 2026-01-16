import config from './configGenerated.json' with { type: 'json' };

export const BUTTON_TEXT = {
  SAVE: 'SAVE',
  EDIT: 'EDIT',
  DELETE: 'DELETE',
  CANCEL: 'CANCEL',
  NEXT: 'NEXT',
  BACK: 'BACK',
  ADD_ANOTHER_PERSON: 'ADD ANOTHER PERSON'
} as const;

export const PAGE_TEXT = {
  REVIEW_INFO: 'Please review your information',
} as const;

export const PAGE_URLS = {
  REGISTRATION: /\/(registration|)$/,
  PAYMENT: /\/payment$/,
  CHECKOUT: /\/checkout$/
} as const;

type FieldConfig = typeof config.fields.fieldsConfig;
type FieldConfigKeys = keyof FieldConfig;

// const fieldsConfig = Object.entries(config.fields.fieldsConfig).reduce((acc, [key, value]) => {
//   if (allFields.includes(key)) {
//     acc[key as FieldConfigKeys] = value;
//   }
//   return acc;
// }, {} as Record<FieldConfigKeys, FieldConfig[FieldConfigKeys]>);

export const fields = [...config.fields.contactFields, ...config.fields.miscFields];
export const fieldsConfig = config.fields.fieldsConfig;

export const getFieldConfig = (field: string) => {
  return fieldsConfig[field as FieldConfigKeys];
};

// export const getFieldOrderSummaryConfig = (field: string) => {
//   const option = config.order.orderSummaryOptions.find(opt => opt.property === field);
//   if (!option) {
//     throw new Error(`No order summary option found for field: ${field}`);
//   }
//   const { label, mapping, defaultValue } = option;
//   return { label, mapping, defaultValue };
// };

export const isTextField = (field: string) => {
  const config = getFieldConfig(field);
  return ['text', 'email', 'pattern', 'address', 'autocomplete'].includes(config.type);
}

export const isTextAreaField = (field: string) => {
  const config = getFieldConfig(field);
  return config.type === 'textarea';
}

export const isCheckboxOrRadioField = (field: string) => {
  const config = getFieldConfig(field);
  return ['checkbox', 'radio'].includes(config.type) && 'options' in config;
}

export const getOptions = (field: string) => {
  const config = getFieldConfig(field);
  if ('options' in config) {
    return config.options;
  } else {
    throw new Error(`Field ${field} does not have options`);
  }
}

export default config;