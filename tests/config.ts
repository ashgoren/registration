import config from './configGenerated.json' with { type: 'json' };
const { fields } = config;
const contactFields = fields.contactFields;
const miscFields = fields.miscFields;
const allFields = [...contactFields, ...miscFields];

type FieldConfig = typeof fields.fieldsConfig;
type FieldConfigKeys = keyof FieldConfig;

const fieldsConfig = Object.entries(fields.fieldsConfig).reduce((acc, [key, value]) => {
  if (allFields.includes(key)) {
    acc[key as FieldConfigKeys] = value;
  }
  return acc;
}, {} as Record<FieldConfigKeys, FieldConfig[FieldConfigKeys]>);

export const getFieldConfig = (field: string) => {
  return fieldsConfig[field as FieldConfigKeys];
};

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
