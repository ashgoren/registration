import backendConfig from '../config/userConfig.js';

const fieldOrder = backendConfig.spreadsheet.fieldOrder;

// additional valid fields for database, not used in spreadsheet
const validFields = [
  ...fieldOrder,
  'createdAt',
  'people',
  'paymentMethod',
  'receipt',
  'apartment',
  'photoComments'
];

export { fieldOrder, validFields };