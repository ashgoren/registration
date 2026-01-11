export const fields: { 
  [key: string]: { 
    required?: boolean;
    type?: 'text' | 'checkbox' | 'radio' | 'textarea';
    options?: string[];
  } 
} = {
  first: { required: true },
  last: { required: true },
  nametag: { required: true },
  pronouns: { required: false },
  email: { required: true },
  emailConfirmation: { required: true },
  phone: { required: true },
  address: { required: true },
  apartment: { required: false },
  city: { required: true },
  state: { required: true },
  zip: { required: true },
  share: { 
    required: false,
    type: 'checkbox',
    options: ['name', 'pronouns', 'email', 'phone', 'address']
  },
  allergies: { required: false, type: 'textarea' },
  carpool: {
    required: false,
    type: 'checkbox',
    options: ['offer-ride', 'offer-ride-maybe', 'need-ride', 'need-ride-maybe', 'rent-car', 'offer-housing', 'need-housing']
  },
  bedding: {
    required: false,
    type: 'checkbox',
    options: ['offer-bedding', 'offer-bedding-maybe', 'need-bedding', 'need-bedding-maybe']
  },
  volunteer: {
    required: false,
    type: 'checkbox',
    options: ['setup', 'strike', 'lead', 'pre']
  },
  housing: { required: false, type: 'textarea' },
  roommate: { required: false, type: 'textarea' },
  misc: {
    required: false,
    type: 'checkbox',
    options: ['minor', 'beginner', 'no-photos']
  },
  agreement: {
    required: true,
    type: 'checkbox',
    options: ['yes']
  },
  comments: { required: false, type: 'textarea' }
};