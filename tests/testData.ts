export type PersonData = Record<string, string | string[]>;

export const person1: PersonData = {
  first: 'Person',
  last: 'One',
  email: 'one@example.com',
  emailConfirmation: 'one@example.com',
  phone: '503-111-1111',
  address: '3229 NW Pittock Drive',
  city: 'Portland',
  state: 'OR',
  zip: '97210',
  agreement: 'yes'
}

export const person2: PersonData = {
  first: 'Person',
  last: 'Two',
  email: 'two@example.com',
  emailConfirmation: 'two@example.com',
  phone: '222-222-2222',
  address: '175 Fifth Avenue',
  city: 'New York',
  state: 'NY',
  zip: '10010'
}

export const personWithAllFields: PersonData = {
  ...person1,
  pronouns: 'they/them',
  apartment: 'ADU',
  share: ['name', 'email'],
  allergies: 'mold',
  carpool: ['offer-ride', 'offer-housing'],
  bedding: ['offer-bedding'],
  volunteer: ['setup', 'strike'],
  housing: 'I have a floor.',
  roommate: 'no snoring please',
  misc: ['beginner'],
  comments: 'Yay dancing!'
};
