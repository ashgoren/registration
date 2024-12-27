import { StyledPaper, Paragraph, PageTitle, StyledLink } from 'components/Layout/SharedStyles';
import { mailtoLink } from 'utils';
import config from 'config';
const { EMAIL_CONTACT } = config;

export default function Contact() {
  return (
    <StyledPaper extraStyles={{ maxWidth: 750 }}>
      <PageTitle>
        Contact
      </PageTitle>

      <Paragraph>
        Send us an email at <StyledLink to={mailtoLink(EMAIL_CONTACT)}>{EMAIL_CONTACT}</StyledLink>!
      </Paragraph>

      <Paragraph>
        Connect to our Facebook group <StyledLink to="https://www.facebook.com/groups/747397092110142/">here</StyledLink>.
      </Paragraph>

      <Paragraph>
        Photography by <StyledLink to="https://www.dougplummer.com/">Doug Plummer</StyledLink>.
      </Paragraph>
    </StyledPaper>
  );
}
