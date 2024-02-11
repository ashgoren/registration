import { useEffect } from 'react';
import { scrollToTop } from 'utils';
import ContactInfoInputs from '../ContactInfoInputs';
import { Title } from 'components/Layout/SharedStyles';
import config from 'config';
const { PERSON_INPUT_LABELS, PERSON_CONTACT_FIELDS } = config;

export default function ContactInfo({ index }) {
  useEffect(() => { scrollToTop(); },[])

  return (
    <section className='contact-section'>
      <Title>{PERSON_INPUT_LABELS[index]}</Title>
      <ContactInfoInputs
        index={index}
        fields={PERSON_CONTACT_FIELDS}
      />
    </section>
  );
}
