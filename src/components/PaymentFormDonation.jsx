import { useState } from 'react';
import { useFormikContext } from 'formik';
import { InputAdornment } from '@mui/material';
import { StyledPaper, Title } from 'components/layouts/SharedStyles';
import { Field } from 'components/inputs';
import { clamp } from 'utils';
import { config } from 'config';
const { DONATION_MAX } = config;

export const PaymentFormDonation = ({ donationAmount }) => {
  const { values, setFieldValue, handleBlur } = useFormikContext();
  const [donate, setDonate] = useState(donationAmount > 0);

  function updateDonationValue(event) {
    const { name, value } = event.target;
    setFieldValue(name, clampDonation(value));
    handleBlur(event); // bubble up to formik
    // setDonationTotal(parseInt(values['donation'] || 0));
  }

  return (
    <StyledPaper className='donation-section'>
      <Title>Additional contribution</Title>
      {!donate &&
        <Field
          alignRight
          type='button'
          label='Would you like to make an additional contribution?'
          name='donate'
          buttonText='Yes'
          onClick={() => setDonate(true)}
        />
      }

      {donate &&
        <Field
          alignRight
          sx={{ minWidth: '6rem', maxWidth: '6rem' }}
          label='How much would you like to add as an additional contribution?'
          name='donation'
          type='pattern'
          pattern='###'
          range={[0, DONATION_MAX]}
          onBlur={updateDonationValue}
          InputProps={{
            startAdornment: <InputAdornment position='start'>$</InputAdornment>,
            onFocus: (e) => e.target.select()
          }}
          autoFocus={values['donation'] === 0 || !values['donation']}
          // value={values['donation'] === 0 ? '' : values['donation']}
        />
      }
    </StyledPaper>
  )
};

const clampDonation = (value) => clamp(value || 0, [0, DONATION_MAX]);
