import { websiteLink } from "utils";
import { StyledLink, StyledPaper, Title } from 'components/Layout/SharedStyles';
import { Typography } from '@mui/material';
import { Paragraph } from 'components/Layout/SharedStyles';
import config from 'config';
const { DIRECT_PAYMENT_URL, PAYMENT_DUE_DATE } = config;

export function PaymentExplanation() {
  return (
    <StyledPaper>
      <Title>What Queer Contra Dance Camp Costs</Title>
      <Paragraph>
        Queer Contra Dance Camp is very dear to many of us. As a sleep away, full food service camp, it is on the medium to higher end of dance camp prices. We are transparent about our costs and use sliding-scale registration to make camp accessible for everyone and financially sustainable. After reading the explanations below, choose how much you can afford to pay to attend camp, starting with a minimum of $125.00.
      </Paragraph>

      <Paragraph>
        The lovely venue that hosts us is $239 per person for two nights of lodging and five hot meals. We spend about $13,000 booking premier artists so camp can have such fabulous bands, callers, and sound. While our organizers are volunteers, there are other miscellaneous costs such as snacks, insurance, and general supplies. All in all, it costs us about $380 per person to make camp run.
      </Paragraph>

      <Title sx={{mt: 4}}>Sliding-scale suggestions</Title>
      <Paragraph>
        If you can't afford to pay $380, that's fine. We want the weekend to be available to as many people as possible, including you. Some payment suggestions are below. Please consider where you fairly fall on the scale and be as generous as you can. If everyone paid under $380, we would lose $8,000-14,000.
      </Paragraph>

      <Paragraph>
        If you are young, possibly a student, with little spending money but plenty of financial assistance from your parents, try to work with your parents to pay the full $380.
      </Paragraph>

      <Paragraph>
        If you are unemployed or underemployed and student loans are crushing your spirit, you sound like a great candidate for paying around $125-$200.
      </Paragraph>

      <Paragraph>
        If you have a steady job but finances are tough and you don't really have non-liquid assets, maybe pay $200-$300 to help sustain camp without over-stressing.
      </Paragraph>

      <Paragraph>
        If you are comfortably employed, please pay at least $380.
      </Paragraph>

      <Paragraph>
        If life is good and you treasure the magic of QCDC, that's wonderful to hear! Consider becoming an angel and sponsoring other dancers by paying $500-$600 or more! $635 covers your cost and completely offsets the cost of one low-income ticket. Our angels are what ensure a financially possible future for Queer Contra Dance Camp and a fun weekend for all.
      </Paragraph>

      <Title sx={{mt: 4}}>Deposit</Title>
      <Paragraph>
        If paying the full price at time of registration is stressful, you can pay $50 to hold your spot and send the remainder via PayPal to <StyledLink to={websiteLink(DIRECT_PAYMENT_URL)}>here</StyledLink> as soon as possible, and no later than {PAYMENT_DUE_DATE}.
      </Paragraph>

      <Title sx={{mt: 4}}>Cancellations</Title>
      <Paragraph>
        Cancellations are fully refundable through January 31st or in the case of communicable illness. 
        After Febraury 1st, refunds (minus a $50 fee) are not guaranteed but may be available if your vacant spot is filled. 
        If a health concern comes up before the weekend, contact us directly and we'll work with you.
      </Paragraph>

    </StyledPaper>
  );
}

export function SlidingScaleSummaryExplanation() {
  return (
    <>
      <Typography>$100 (standard fee)</Typography>
      <Typography>$120 (nice)</Typography>
      <Typography>$150 (real nice)</Typography>
    </>
  )
}
