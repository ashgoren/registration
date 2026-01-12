export const fields: { 
  [key: string]: { 
    required?: boolean;
    type?: 'text' | 'checkbox' | 'radio' | 'textarea';
    options?: string[];
  } 
} = {
  first: { required: true, type: 'text' },
  last: { required: true, type: 'text' },
  nametag: { required: true, type: 'text' },
  pronouns: { required: false, type: 'text' },
  email: { required: true, type: 'text' },
  emailConfirmation: { required: true, type: 'text' },
  phone: { required: true, type: 'text' },
  address: { required: true, type: 'text' },
  apartment: { required: false, type: 'text' },
  city: { required: true, type: 'text' },
  state: { required: true, type: 'text' },
  zip: { required: true, type: 'text' },
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