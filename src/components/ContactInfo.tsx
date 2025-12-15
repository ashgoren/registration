import { memo } from 'react';
import { useScrollToTop } from 'hooks/useScrollToTop';
import { Title } from 'components/layouts/SharedStyles';
import { ContactInfoInputs } from './ContactInfoInputs';
import { config } from 'config';
// import { logDebug } from 'src/logger';

export const ContactInfo = memo(({ index }:{ index: number }) => {
  // logDebug('ContactInfo rendered');

  useScrollToTop();

  return (
    <section className='contact-section'>
      <Title>{config.fields.personInputLabels[index]}</Title>
      <ContactInfoInputs
        index={index}
        fields={config.fields.contactFields}
      />
    </section>
  );
});
