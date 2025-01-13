export const joinArrays = (obj) => {
  const newObj = { ...obj };
  for (let key in obj) {
    if (key !== 'people' && Array.isArray(obj[key])) {
      newObj[key] = obj[key].join(', ');
    }
  }
  return newObj;
};

export const formatCurrency = (amount) => {
  return Number(amount).toFixed(2);
}

export const IS_EMULATOR = !!process.env.FIREBASE_AUTH_EMULATOR_HOST || !!process.env.FIRESTORE_EMULATOR_HOST || !!process.env.FUNCTIONS_EMULATOR;
export const PROJECT_ID = process.env.GCLOUD_PROJECT;
