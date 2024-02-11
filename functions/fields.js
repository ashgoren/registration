// field names must be in same order as spreadsheet columns
export const fieldOrder = [
  'key',
  'first',
  'last',
  'nametag',
  'pronouns',
  'email',
  'phone',
  'address',
  'city',
  'state',
  'zip',
  'country',
  'volunteer',
  'scholarship',
  'share',
  'carpool',
  'comments',
  'admissionQuantity',
  'admissionCost',
  'donation',
  'total',
  'deposit',
  'owed',
  'purchaser',
  'createdAt',
  'paymentId'
];

export const otherFields = [
  'people', // key for people array itself
  'index', // required for people array
  'receipt',
  'additionalPersonReceipt',
  'emailConfirmation',
];

export const validFields = [...fieldOrder, ...otherFields];
