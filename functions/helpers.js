export const joinArrays = (obj) => {
  const newObj = { ...obj };
  for (let key in obj) {
    if (key !== 'people' && Array.isArray(obj[key])) {
      newObj[key] = obj[key].join(', ');
    }
  }
  return newObj;
};
