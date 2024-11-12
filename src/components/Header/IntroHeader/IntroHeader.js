import { mailtoLink } from "utils";
import { StyledLink, Paragraph } from 'components/Layout/SharedStyles';
import config from 'config';
const { EMAIL_CONTACT, TECH_CONTACT } = config;

export default function IntroHeader() {
  return (
    <>
      <Paragraph>Join us at Really Fun Contra Dance Camp...</Paragraph>
      <Paragraph>Registration system questions? Email <StyledLink to={mailtoLink(TECH_CONTACT)}>{TECH_CONTACT}</StyledLink>.</Paragraph>
      <Paragraph>Any other questions? Email <StyledLink to={mailtoLink(EMAIL_CONTACT)}>{EMAIL_CONTACT}</StyledLink>.</Paragraph>
    </>
  );
}
