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
  'share',
  'dietaryPreferences',
  'dietaryRestrictions',
  'allergies',
  'carpool',
  'bedding',
  'volunteer',
  'housing',
  'roommate',
  'photo',
  'comments',
  'admission',
  'donation',
  'total',
  'deposit',
  'fees',
  'paid',
  'charged',
  'status',
  'purchaser',
  'completedAt',
  'paymentId'
];

// additional valid fields for database, not used in spreadsheet
export const validFields = [
  ...fieldOrder,
  'createdAt',
  'people',
  'paymentMethod',
  'receipt',
  'apartment',
  'photoComments'
];
