import { PAYPAL_ME_URL, EMAIL_CONTACT } from 'config';
import { websiteLink, mailtoLink } from 'utils';
import { PageTitle, Paragraph, StyledPaper, StyledLink } from 'components/Layout/SharedStyles';

export default function Payment() {
  return (
    <StyledPaper>
      <PageTitle>
        Ways to Pay
      </PageTitle>

      <Paragraph>
        <strong>1. Pay as part of online registration</strong><br />
        The preferred method of paying for the Ball is to pay electronically as part of the online registration process. 
        You will be able to do this by credit card, debit card, or with PayPal. 
        If you don't pay online at registration time, just use one of the other methods below.
      </Paragraph>

      <Paragraph>
        <strong>2. Pay electronically at a later date via PayPal.Me</strong><br />
          If you prefer to pay electronically at a later date, you can pay via PayPal.Me <StyledLink to={websiteLink(PAYPAL_ME_URL)}>here</StyledLink>. 
          This requires you to have a PayPal account, but you can sign up for one on the spot. You can then pay by credit card, debit card, or your bank account. 
          Please specify the registration amount and "Add a Note" to include your name. 
      </Paragraph>

      <Paragraph>
        <strong>3. Write a paper check</strong><br />
        <em>Make your check out to PCDC</em>, write your name in the memo area, and mail to:<br />
        Portland ECD Ball<br />
        David Macemon<br />
        19936 Derby St<br />
        West Linn, OR 97068
      </Paragraph>

      <Paragraph>
        Questions? Concerns? Email David Macemon at <StyledLink to={mailtoLink(EMAIL_CONTACT)}>{EMAIL_CONTACT}</StyledLink>.
      </Paragraph>
    </StyledPaper>
  )
}
