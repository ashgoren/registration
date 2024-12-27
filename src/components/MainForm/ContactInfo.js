import React from 'react';
import ContactInfoInputs from './ContactInfoInputs';
import { Title } from 'components/Layout/SharedStyles';
import config from 'config';
import useScrollToTop from 'hooks/useScrollToTop';
const { PERSON_INPUT_LABELS, PERSON_CONTACT_FIELDS } = config;

function ContactInfo({ index, formikRef }) {
  console.log('ContactInfo rendered');

  useScrollToTop();

  return (
    <section className='contact-section'>
      <Title>{PERSON_INPUT_LABELS[index]}</Title>
      <ContactInfoInputs
        index={index}
        fields={PERSON_CONTACT_FIELDS}
        formikRef={formikRef}
      />
    </section>
  );
}

export default React.memo(ContactInfo);