import * as Yup from 'yup';

const NAME_REGEX = "^[^<>&@]+$";
const PRONOUNS_REGEX = "^[^<>&@]+$";
const PHONE_REGEX = "^[2-9][0-9-() ]*$";
export const NAME_VALIDATION = Yup.string().matches(NAME_REGEX, 'Invalid characters :(');
export const PRONOUNS_VALIDATION = Yup.string().matches(PRONOUNS_REGEX, 'Invalid characters :(');
export const EMAIL_VALIDATION = Yup.string().email('Invalid email address');
export const PHONE_VALIDATION = Yup.string().matches(PHONE_REGEX, 'Please enter a valid phone number.');
