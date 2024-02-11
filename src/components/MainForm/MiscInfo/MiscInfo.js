import { useEffect } from 'react';
import { scrollToTop } from 'utils.js';
import { Input, CheckboxInput } from '../Input';
import { Title } from 'components/Layout/SharedStyles';
import { Box } from '@mui/material';
import config from 'config';
const { SCHOLARSHIP_OPTIONS, VOLUNTEER_OPTIONS, SHARE_OPTIONS, YES_NO_OPTIONS } = config;

export default function MiscInfo({ index }) {
  useEffect(() => { scrollToTop(); },[])

  return (
    <Box className='MiscInfo' sx={{ mt: 4 }}>
      <Box sx={{ mb: 6 }}>
        <Title>What information do you want in the roster?</Title>
        <CheckboxInput
          name={`people[${index}].share`}
          options={SHARE_OPTIONS}
          key={`${index}-share`}
        />
      </Box>

      <Box sx={{ mb: 6 }}>
        <Title>Carpool</Title>
        <CheckboxInput
          label='Do you want your city, state, zip, and email shared for carpooling?'
          name={`people[${index}].carpool`}
          options={YES_NO_OPTIONS}
          key={`${index}-carpool`}
        />
      </Box>

      <Box sx={{ mb: 6 }}>
        <Title>Volunteering</Title>
        <CheckboxInput
          label='Do you want to volunteer to help out over the weekend?  Jobs might include sweeping or checking paper products stashed in the bathrooms.'
          name={`people[${index}].volunteer`}
          options={VOLUNTEER_OPTIONS}
          key={`${index}-volunteer`}
        />
      </Box>

      <Box sx={{ mb: 6 }}>
        <Title>Scholarships (limited availability)</Title>
        <CheckboxInput
          label="We feel we've kept the price of camp remarkably low.  However, if you are limited financially, we have a small number of half price scholarships available for camp. If you'd like to be considered for one of these, please let us know."
          name={`people[${index}].scholarship`}
          options={SCHOLARSHIP_OPTIONS}
          key={`${index}-scholarship`}
        />
      </Box>

      <Title>Comments</Title>
      <Input
        type='textarea'
        name={`people[${index}].comments`}
        label="Please tell us any special requests or information we should know regarding your registration."
        key={`${index}-comments`}
      />
    </Box>
  );
}
