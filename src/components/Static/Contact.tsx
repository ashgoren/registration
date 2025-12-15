import { StyledPaper, Paragraph, PageTitle, StyledLink } from 'components/layouts/SharedStyles';
import { mailtoLink } from 'utils/misc';
import { config } from 'config';

export const Contact = () => {
  return (
    <StyledPaper extraStyles={{ maxWidth: 750 }}>
      <PageTitle>
        Contact
      </PageTitle>

      <Paragraph>
        Send us an email at <StyledLink to={mailtoLink(config.contacts.info)}>{config.contacts.info}</StyledLink>!
      </Paragraph>

      <Paragraph>
        Registration issues? <StyledLink to={mailtoLink(config.contacts.tech)}>{config.contacts.tech}</StyledLink>
      </Paragraph>

      <Paragraph>
        Connect to our Facebook group <StyledLink to="https://www.facebook.com/groups/747397092110142/">here</StyledLink>.
      </Paragraph>

      <Paragraph>
        Photography by <StyledLink to="https://www.dougplummer.com/">Doug Plummer</StyledLink>.
      </Paragraph>
    </StyledPaper>
  );
};
