import { Alert, Typography } from '@mui/material';
import { StyledLink, Paragraph } from 'components/layouts/SharedStyles';
import { mailtoLink } from 'utils/misc';
import { config } from 'config';

export const IntroHeader = () => {
  return (
    <>
      <Paragraph>Join us at {config.event.title}!</Paragraph>
      <Paragraph>Camp is {config.event.date} at {config.event.location}.</Paragraph>
      <Paragraph>It'll be another amazing weekend of contra dance, three days with two great bands, Example Awesome Band and Example Amazing Band, and two fantastic callers, Example Fabulous Human and Example Fantastic Human.</Paragraph>
      <Paragraph>This year's theme is Example Excellent Theme!</Paragraph>
      <Paragraph>
        Registration system questions? Email <StyledLink to={mailtoLink(config.contacts.tech)}>{config.contacts.tech}</StyledLink>.<br />
        Any other questions? Email <StyledLink to={mailtoLink(config.contacts.info)}>{config.contacts.info}</StyledLink>.
      </Paragraph>
      <Alert severity='info' sx={{ my: 3 }}>
        <Typography variant='body1'>After hitting save, there will be an opportunity to add additional attendees.</Typography>
      </Alert>
      {config.registration.showWaiver && (
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
