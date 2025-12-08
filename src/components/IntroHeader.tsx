import { Alert, Typography } from '@mui/material';
import { StyledLink, Paragraph } from 'components/layouts/SharedStyles';
import { mailtoLink } from 'utils/misc';
import { config } from 'config';
const { EMAIL_CONTACT, TECH_CONTACT, EVENT_TITLE, EVENT_LOCATION, EVENT_DATE, SHOW_WAIVER } = config;

export const IntroHeader = () => {
  return (
    <>
      <Paragraph>Join us at {EVENT_TITLE}!</Paragraph>
      <Paragraph>Camp is {EVENT_DATE} at {EVENT_LOCATION}.</Paragraph>
      <Paragraph>It'll be another amazing weekend of contra dance, three days with two great bands, Example Awesome Band and Example Amazing Band, and two fantastic callers, Example Fabulous Human and Example Fantastic Human.</Paragraph>
      <Paragraph>This year's theme is Example Excellent Theme!</Paragraph>
      <Paragraph>
        Registration system questions? Email <StyledLink to={mailtoLink(TECH_CONTACT)}>{TECH_CONTACT}</StyledLink>.<br />
        Any other questions? Email <StyledLink to={mailtoLink(EMAIL_CONTACT)}>{EMAIL_CONTACT}</StyledLink>.
      </Paragraph>
      <Alert severity='info' sx={{ my: 3 }}>
        <Typography variant='body1'>After hitting save, there will be an opportunity to add additional attendees.</Typography>
      </Alert>
      {SHOW_WAIVER && (
        <Alert severity='warning' sx={{ my: 2 }}>
          <Typography variant='body1' sx={{ fontWeight: 'bold' }}>
            Important note regarding waivers:
          </Typography>
          <Typography variant='body1'>
            Each individual attending must complete their own waiver.
            If you are registering multiple people, please ensure each person is present to complete their waiver.
          </Typography>
        </Alert>
      )}
    </>
  );
};
