import { Box, List, ListItem } from '@mui/material';
import { StyledLink, StyledPaper, PageTitle, Paragraph, Header } from 'components/Layout/SharedStyles';
import { mailtoLink } from 'utils';
import config from 'config';
const { EMAIL_CONTACT } = config;

export default function About() {

  return (
    <StyledPaper extraStyles={{ maxWidth: 750 }}>
      <PageTitle>
        About
      </PageTitle>

      <Box mt={-5} mb={4}>
        <img src={process.env.PUBLIC_URL + '/some_event/hands.jpg'} alt='' style={{ width: "100%", height: "auto" }} />
      </Box>

      <Header>
        Seven Characteristics of some_event Dancers
      </Header>

      <List>
        <ListItem>Are aware of the community on the floor: dance with an awareness of one's movements, one's frame, the proper giving of weight, and the space within the hall.</ListItem>
        <ListItem>Dance with a variety of partners regardless of age, body type, gender expression.</ListItem>
        <ListItem>Are role models of consensual behavior on the dance floor.</ListItem>
        <ListItem>Swap roles or engage in other play when it is done with the utmost regard for the integrity of the dance and the line and with partner consent.</ListItem>
        <ListItem>Take time and effort to appreciate the talent of the callers and the bands.</ListItem>
        <ListItem>Avoid pre-booking and enjoy the spontaneity of seeking a new partner for each dance for a variety of experiences.</ListItem>
        <ListItem>Ensure our clothes and selves are 100% fragrance-free when attending some_event.</ListItem>
      </List>

      <Header id='covid'>
        Covid Policy for attendees
      </Header>
      <Paragraph sx={{ mb: 2 }}>
        some_event Contra Dance Weekend will follow the mask guidelines of the weekly Seattle contra dances.
        As of November 1, well-fitting face masks are required. 
        Masks will be provided for those who don't have one. 
        No proof of vaccination or testing will be required.
        Any updates to this policy will be announced in email and on the website.
        If you feel unwell, please do not attend. 
        If you feel unwell during the weekend, please notify the organizers immediately, leave the dance as soon as possible, and then send a follow-up email within 24 hours if you wish to receive a refund. 
        Full refunds will be given minus any transaction fees incurred. 
      </Paragraph>

      <Header id='waiver'>
        Waiver
      </Header>
      <Paragraph>
        You will need to sign a <StyledLink to={process.env.PUBLIC_URL + '/some_event/some_event-waiver.pdf'}>waiver</StyledLink> and email it to <StyledLink to={mailtoLink(EMAIL_CONTACT)}>{EMAIL_CONTACT}</StyledLink>.<br />
      </Paragraph>

      <Header id='refund'>
        Refund Policy
      </Header>
      <Paragraph>
        Registration is not transferable. 
        Please contact <StyledLink to={mailtoLink(EMAIL_CONTACT)}>{EMAIL_CONTACT}</StyledLink> if you need to cancel. 
        Cancellations will be issued in full minus any bank/Stripe transaction fees incurred. Refunds may take up to 7 days to process.
      </Paragraph>

      <Header>
        Food and Water
      </Header>
      <Paragraph>This is a high-energy weekend with only a few official breaks. Meals are your own responsibility and we encourage you to enjoy the many restaurants Ballard has to offer. Snacks will be provided throughout the weekend. Water will be available, but please bring your own water bottle.</Paragraph>
      <Paragraph>A list of restaurants around the area of the hall is available <StyledLink internal={true} to="/seattle">here</StyledLink>.</Paragraph>

      <Header>
        Housing Accomodations
      </Header>
      <Paragraph>This dance weekend is in Seattle. We will do our best to find housing for out-of-town guests. Please remember that we are all volunteers, so adjust expectations accordingly. If you have attended other dance weekends in Seattle, you are strongly encouraged to make your own arrangements with friends you have stayed with before.</Paragraph>
      <Paragraph>Do you need housing or can you offer housing to visiting dancers? Please be sure to include this as a part of your some_event registration.</Paragraph>
      <Paragraph>If you have any other questions about housing or hosting guests, please email Kristin at housing@some_eventcontra.com</Paragraph>
    </StyledPaper>
  );
}
