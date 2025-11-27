import * as Yup from 'yup';
import { StyledLink } from 'components/layouts/SharedStyles';
import { websiteLink } from 'utils';
import { STATE_OPTIONS } from './internal/constants';
import { NAME_VALIDATION, PRONOUNS_VALIDATION, EMAIL_VALIDATION, PHONE_VALIDATION } from './internal/configValidations';
import configBasics from './internal/configBasics';
import type { JSX } from 'react';

const { ADMISSION_COST_DEFAULT, ADMISSION_COST_RANGE, EVENT_TITLE, SAFETY_POLICY_URL } = configBasics;

type FieldType = 'text' | 'email' | 'pattern' | 'address' | 'radio' | 'checkbox' | 'textarea' | 'autocomplete';

export interface FormFieldConfig {
  label?: string | JSX.Element;
  title?: string;
  type?: FieldType;
  pattern?: string;
  placeholder?: string;
  options?: { label: string; value: string }[];
  validation: Yup.AnySchema;
  conditionalValidation?: {
    message: string;
    testFn: (this: Yup.TestContext, value: string) => boolean;
  };
  defaultValue: number | string | string[];
  width?: number;
  rows?: number;
  required?: boolean;
  autoComplete?: string;
  suggestions?: readonly { id: string; fullName: string; abbreviation: string; country: string }[];
  hidden?: boolean;
}

type FieldConfig = { [key: string]: FormFieldConfig };

// config for all form fields (which may include fields not used in this instance)
export const fieldConfig: FieldConfig = {
  first: {
    label: 'First name',
    validation: NAME_VALIDATION.required('Please enter first name.'),
    defaultValue: '',
    width: 6,
    required: true,
    autoComplete: 'given-name'
  },
  last: {
    label: 'Last name',
    validation: NAME_VALIDATION.required('Please enter last name.'),
    defaultValue: '',
    width: 6,
    required: true,
    autoComplete: 'family-name'
  },
  pronouns: {
    label: 'Pronouns',
    validation: PRONOUNS_VALIDATION,
    defaultValue: '',
    width: 12
  },
  nametag: {
    label: 'Name for roster', // to handle aggressive autocomplete use 'First name for button' if only want first name
    validation: NAME_VALIDATION.required('Please enter name for roster.'),
    defaultValue: '',
    required: true,
    width: 12,
    // autoComplete: 'nickname'
  },
  email: {
    label: 'Email',
    type: 'email',
    validation: EMAIL_VALIDATION.required('Please enter email address.'),
    defaultValue: '',
    width: 6,
    required: true,
    autoComplete: 'email'
  },
  emailConfirmation: {
    label: 'Re-enter email',
    type: 'email',
    validation: EMAIL_VALIDATION.required('Please re-enter your email address.').equals([Yup.ref('email')], 'Email addresses must match.'),
    defaultValue: '',
    width: 6,
    required: true,
    autoComplete: 'email'
  },
  phone: {
    label: 'Phone',
    type: 'pattern',
    pattern: '###-###-####',
    placeholder: 'e.g. 555-555-5555',
    validation: PHONE_VALIDATION.required('Please enter phone number.'),
    defaultValue: '',
    width: 12,
    // width: 4,
    required: true,
    autoComplete: 'tel-national'
  },
  address: {
    label: 'Street address',
    type: 'address',
    validation: Yup.string().required('Please enter street address.'),
    defaultValue: '',
    width: 9,
    required: true,
    autoComplete: 'street-address'
  },
  apartment: {
    label: 'Apt, Suite, etc.',
    validation: Yup.string(),
    defaultValue: '',
    width: 3,
    autoComplete: 'address-line2'
  },
  city: {
    label: 'City',
    validation: Yup.string().required('Please enter city.'),
    defaultValue: '',
    width: 5,
    required: true,
    autoComplete: 'address-level2'
  },
  state: {
    label: 'State / Province',
    type: 'autocomplete',
    suggestions: STATE_OPTIONS,
    validation: Yup.string().required('Please enter state or province.'),
    defaultValue: '',
    width: 4,
    required: true,
    autoComplete: 'address-level1'
  },
  zip: {
    label: 'Zip code',
    validation: Yup.string().required('Please enter zip/postal code.'),
    defaultValue: '',
    width: 3,
    required: true,
    autoComplete: 'postal-code'
  },
  country: {
    label: 'Country',
    validation: Yup.string(),
    defaultValue: '',
    width: 12,
    autoComplete: 'country',
    hidden: true
  },
  age: {
    type: 'radio',
    title: "Age",
    label: "Please choose one.",
    options: [
      { label: 'Adult', value: 'adult' },
      { label: '13-17 yr old', value: '13-17' },
      { label: '6-12 yr old', value: '6-12' },
      { label: '3-5 yr old', value: '3-5' },
      { label: '0-2 yr old', value: '0-2' },
    ],
    required: true,
    validation: Yup.string().required('Please select age range.'),
    defaultValue: '',
  },
  share: {
    title: "Roster",
    type: 'checkbox',
    label: "What information do you want shared in the roster?",
    options: [
      { label: 'Include my name in the roster', value: 'name' },
      { label: 'Include my pronouns in the roster', value: 'pronouns' },
      { label: 'Include my email in the roster', value: 'email' },
      { label: 'Include my phone number in the roster', value: 'phone' },
      { label: 'Include my address in the roster', value: 'address' },
    ],
    validation: Yup.array(),
    defaultValue: ['name', 'pronouns', 'email', 'phone', 'address'],
  },
  carpool: {
    type: 'checkbox',
    title: "Transportation and Hosting",
    label: "If you check any of these boxes we will be in touch closer to camp to coordinate. We will do our best to meet everyone's carpool needs. For housing, we will put people directly in touch with possible matches if there are any.  NOTE: historically, carpools and housing are tight. If you are able to offer a ride or a place to stay, please check the box!",
    options: [
      { label: "I can offer a ride to camp", value: 'offer-ride' },
      { label: "I might be able to give a ride to camp", value: 'offer-ride-maybe' },
      { label: "I need a ride to camp", value: 'need-ride' },
      { label: "I might need a ride to camp", value: 'need-ride-maybe' },
      { label: "I am willing and able to rent a car to drive to camp if necessary", value: 'rent-car' },
      { label: "I can offer a place to stay in the Bay Area before or after camp", value: 'offer-housing' },
      { label: "I could use help finding a place to stay in the Bay Area before or after camp", value: 'need-housing' },
    ],
    validation: Yup.array(),
    defaultValue: [],
  },
  volunteer: {
    type: 'checkbox',
    title: "Volunteering",
    label: "Everyone will be asked to help with camp, but we need a few people who can commit in advance or in larger ways.",
    options: [
      { label: "I can come early to help with camp set up", value: 'setup' },
      { label: "I can stay late to help with camp take down", value: 'strike' },
      { label: "I can take on a lead volunteer role during camp (e.g. button maker or snack coordinator)", value: 'lead' },
      { label: "I can help coordinate in the months before camp", value: 'pre' },
    ],
    validation: Yup.array(),
    defaultValue: [],
  },
  dietaryPreferences: {
    type: 'radio',
    title: "Dietary Preferences",
    label: "Please choose one.",
    options: [
      { label: 'Vegan', value: 'Vegan' },
      { label: 'Vegetarian', value: 'Vegetarian' },
      { label: 'No Red Meat', value: 'No Red Meat' },
      { label: 'Omnivore', value: 'Omnivore' },
    ],
    required: true,
    validation: Yup.string().required('Please select dietary preference.'),
    defaultValue: '',
  },
  dietaryRestrictions: {
    type: 'checkbox',
    title: "Additional Dietary Restrictions",
    label: "Please note, we will try out best to accommodate you with the prepared meals, but the kitchen has limited options. They do their best,  but if you're very worried about your restrictions (if highly allergic, or highly specific requirements) we recommend bringing your own food as well. We have a refrigerator and storage space available for personal use that campers who need it may use. There's room to elaborate on allergies or safety needs below.",
    options: [
      { label: 'Gluten-free', value: 'gluten' },
      { label: 'Soy-free', value: 'soy' },
      { label: 'Dairy-free', value: 'dairy' },
      { label: 'Kosher for Passover (stringent)', value: 'kosher-strict' },
      { label: "Kosher for Passover (chill, just won't eat bread)", value: 'kosher' },
      { label: 'Other (please explain in comments below)', value: 'other' },
    ],
    validation: Yup.array(),
    defaultValue: [],
  },
  allergies: {
    type: 'textarea',
    title: 'Allergy / Safety Information',
    label: "So there's \"I don't eat gluten\" and then there's \"if a single crumb of gluten cross-contaminates my food I will be sick all weekend.\" Please elaborate as much are you need to feel comfortable that we know your safety and allergy needs. This can include non-food things as well.",
    defaultValue: '',
    rows: 2,
    validation: Yup.string(),
    conditionalValidation: {
      message: 'Please provide relevant details about dietary restrictions.',
      testFn: function (this: Yup.TestContext, value: string) { // `value` is the value of 'allergies'
        const { dietaryRestrictions } = this.parent; // `this.parent` is the person object
        if (dietaryRestrictions?.includes('other')) {
          return !!value && value.trim() !== ''; // Required and must not be only whitespace
        }
        return true; // Not required in other cases
      }
    }
  },
  housing: {
    type: 'textarea',
    title: 'Camp housing needs or requests',
    label: "(e.g. accessibility needs, I plan on camping, etc.)",
    validation: Yup.string(),
    defaultValue: '',
    rows: 2
  },
  roommate: {
    type: 'textarea',
    title: 'Room sharing preferences',
    label: "We now pre-assign housing and try our best to meet everyone's needs and preferences. If there are people you would like to room with, list their names here.",
    validation: Yup.string(),
    defaultValue: '',
    rows: 2
  },
  photo: {
    type: 'radio',
    title: "Photo Consent",
    label: "People at Queer Camp take photos. Please let us know if you have any concerns about your photo being taken or posted publicly.",
    options: [
      { label: "Photos are fine!", value: 'Yes' },
      { label: "Photos are fine, but I don't want to be tagged online", value: 'No tags' },
      { label: "Please do not post photos of me.", value: 'No' },
      { label: "Other", value: 'Other' },
    ],
    required: true,
    validation: Yup.string().required('Please select photo consent preference.'),
    defaultValue: '',
  },
  photoComments: {
    type: 'textarea',
    label: "Please explain any concerns or requests about photos here.",
    defaultValue: '',
    rows: 2,
    validation: Yup.string(),
    conditionalValidation: {
      message: 'Please provide details for your photo consent preferences.',
      testFn: function (this: Yup.TestContext, value: string) { // `value` is the value of 'photoComments'
        const { photo } = this.parent;
        if (photo === 'Other') {
          return !!value && value.trim() !== ''; // Required and must not be only whitespace
        }
        return true; // Not required
      }
    }
  },
  bedding: {
    type: 'checkbox',
    title: "Bedding and Towels",
    label: "Campers will need a pillow, a towel, and sheets and blanket or a sleeping bag. If at all possible, please bring your own or arrange with a friend directly to borrow.",
    options: [
      { label: 'I can offer bedding and a towel to a camper from out of town', value: 'offer-bedding' },
      { label: 'I might be able to offer bedding and a towel', value: 'offer-bedding-maybe' },
      { label: 'I am coming from out of town and will need help finding bedding and a towel', value: 'need-bedding' },
      { label: 'I might need bedding and a towel', value: 'need-bedding-maybe' },
    ],
    validation: Yup.array(),
    defaultValue: [],
  },
  hospitality: {
    type: 'checkbox',
    title: "Housing",
    label: "Do you need housing or can you offer housing?",
    options: [
      { label: 'I can offer housing', value: 'offering' },
      { label: 'I need housing (limited availability)', value: 'requesting' },
    ],
    validation: Yup.array(),
    defaultValue: [],
  },
  scholarship: {
    type: 'checkbox',
    title: "Scholarships (limited availability)",
    label: "We feel we've kept the price of camp remarkably low.  However, if you are limited financially, we have a small number of half price scholarships available for camp. If you'd like to be considered for one of these, please let us know.",
    options: [
      { label: 'Yes, please consider me for a scholarship', value: 'yes' },
    ],
    validation: Yup.array(),
    defaultValue: [],
  },
  tests: {
    type: 'checkbox',
    title: "Covid Tests",
    label: "You will need to test shortly before arriving at camp AND again on Saturday afternoon. Please also bring an extra test or two, for your own use if you should feel ill during the weekend. If you can not bring your own tests, please let us know here.",
    options: [
      { label: 'I need 1 test', value: '1' },
      { label: 'I need 2 tests', value: '2' },
    ],
    validation: Yup.array(),
    defaultValue: [],
  },
  comments: {
    type: 'textarea',
    title: "Anything else?",
    label: "Tell us anything else you'd like us to know. We want to be sure we don't miss anything that could make the weekend welcoming and enjoyable.",
    validation: Yup.string(),
    defaultValue: '',
    rows: 5,
  },
  misc: {
    type: 'checkbox',
    title: "Do any of the following apply to you?",
    options: [
      { label: "I am under 18 years old", value: 'minor' },
      { label: "I am new to contra and interested in a beginner's lesson", value: 'beginner' },
      { label: "I do not want photos of me to be posted online (note that we already ask that no one tag photos)", value: 'no-photos' },
    ],
    validation: Yup.array(),
    defaultValue: [],
  },
  miscComments: {
    type: 'textarea',
    label: "What is your age?",
    defaultValue: '',
    required: true,
    rows: 1,
    validation: Yup.string(),
    conditionalValidation: {
      message: 'Please provide your age if you are under 18.',
      testFn: function (value) { // `value` is the value of 'miscComments'
        const { misc } = this.parent;
        if (misc.includes('minor')) {
          return !!value && value.trim() !== ''; // Required and must not be only whitespace
        }
        return true; // Not required
      }
    }
  },
  agreement: {
    type: 'checkbox',
    title: 'Values and Expectations',
    label: <>Do you agree that everyone you are registering will follow {EVENT_TITLE}'s <StyledLink to={websiteLink(SAFETY_POLICY_URL)}>values and expectations</StyledLink>?</>,
    required: true,
    options: [
      { label: 'Yes', value: 'yes' }
    ],
    validation: Yup.array(),
    conditionalValidation: {
      message: `You must agree to the values and expectations.`,
      testFn: function (this: Yup.TestContext, value: string) {
        const personIndex = this.path.match(/people\[(\d+)\]/)?.[1];
        if (Number(personIndex) === 0) { // required for primary registrant only
          return Array.isArray(value) && value.includes('yes');
        } else {
          return true; // not required for additional members of party
        }
      }
    },
    defaultValue: [],
  },
  admission: {
    validation: Yup.number().min(ADMISSION_COST_RANGE[0]).max(ADMISSION_COST_RANGE[1]).required(),
    defaultValue: ADMISSION_COST_DEFAULT,
  },
  deposit: {
    validation: Yup.number().min(0),
    defaultValue: 0,
  },
} as const satisfies FieldConfig;
