import { memo } from 'react';
import { useScrollToTop } from 'hooks/useScrollToTop';
import { Title } from 'components/layouts/SharedStyles';
import { ContactInfoInputs } from './ContactInfoInputs';
import { config } from 'config';
import { logDebug } from 'src/logger';
const { PERSON_INPUT_LABELS, PERSON_CONTACT_FIELDS } = config;

export const ContactInfo = memo(({ index, formikRef }) => {
  logDebug('ContactInfo rendered');

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
});
