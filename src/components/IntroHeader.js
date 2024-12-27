import { useTheme } from '@mui/system';
import { Box } from '@mui/material';
import { mailtoLink } from "utils";
import { StyledLink, Paragraph } from 'components/Layout/SharedStyles';
import { config } from 'config';
const { EMAIL_CONTACT, TECH_CONTACT, EVENT_TITLE, EVENT_LOCATION, EVENT_DATE, WAITLIST_MODE } = config;

export const IntroHeader = () => {
  const theme = useTheme();

  return (
    <>
      {WAITLIST_MODE &&
        <Box sx={{ my: 4, p: 2, backgroundColor: theme.palette.background.sticky, display: 'flex', justifyContent: 'center', alignItems: 'center'  }}>
          <strong>{EVENT_TITLE} is full; sign up here for the waitlist.</strong>
        </Box>
      }

      <Paragraph>Join us at {EVENT_TITLE}!</Paragraph>
      <Paragraph>Camp is {EVENT_DATE} at {EVENT_LOCATION}.</Paragraph>
      <Paragraph>It'll be another amazing weekend of contra dance, three days with two great bands, Example Awesome Band and Example Amazing Band, and two fantastic callers, Example Fabulous Human and Example Fantastic Human.</Paragraph>
      <Paragraph>This year's theme is Example Excellent Theme!</Paragraph>
      <Paragraph>Registration system questions? Email <StyledLink to={mailtoLink(TECH_CONTACT)}>{TECH_CONTACT}</StyledLink>.</Paragraph>
      <Paragraph>Any other questions? Email <StyledLink to={mailtoLink(EMAIL_CONTACT)}>{EMAIL_CONTACT}</StyledLink>.</Paragraph>
    </>
  );
};
