import { useState, useEffect, useMemo } from 'react';
import { useOrder } from 'hooks/useOrder';
import { useScrollToTop } from 'hooks/useScrollToTop';
import { useWarnBeforeUnload } from 'hooks/useWarnBeforeUnload';
import { clamp } from 'utils';
import { Field } from 'components/inputs';
import { StyledPaper, Title, Paragraph } from 'components/Layout/SharedStyles';
import { InputAdornment, Box, Tab, Tabs, FormControlLabel, Checkbox } from '@mui/material';
import { TabPanel, TabContext } from '@mui/lab';
import { useFormikContext } from 'formik';
import { PaymentExplanation } from 'components/Static/PaymentExplanation';
import { NavButtons } from 'components/Layout/NavButtons';
import { config } from 'config';
const { DEPOSIT_OPTION, COVER_FEES_OPTION, DEPOSIT_COST, ADMISSION_COST_RANGE, DONATION_OPTION, DONATION_MAX, PAYMENT_DUE_DATE } = config;

const isSlidingScale = ADMISSION_COST_RANGE[0] < ADMISSION_COST_RANGE[1];

export const PaymentInfo = ({ handleClickBackButton }) => {
  const { order, updateOrder } = useOrder();
  const { values, setFieldValue, handleBlur } = useFormikContext();
  const [payingMax, setPayingMax] = useState(order.people[0].admission === ADMISSION_COST_RANGE[1]);
  const [donate, setDonate] = useState(order.donation > 0);
  const [donationTotal, setDonationTotal] = useState(order.donation);
  const [coverFees, setCoverFees] = useState(order.fees > 0);
  const [paymentTab, setPaymentTab] = useState(order.deposit > 0 ? 'deposit' : 'fullpayment');
  const isMultiplePeople = order.people.length > 1;

  useScrollToTop();
  useWarnBeforeUnload();

  const admissionTotal = useMemo(() => {
    return values.people.reduce((total, person) => total + clampAdmission(person.admission), 0);
  }, [values.people]);

  const depositTotal = useMemo(() => {
    return DEPOSIT_COST * order.people.length;
  }, [order.people.length]);

  const total = useMemo(() => {
    return paymentTab === 'deposit' ? depositTotal : admissionTotal + donationTotal;
  }, [paymentTab, depositTotal, admissionTotal, donationTotal]);

  const fees = useMemo(() => {
    return (0.0245 * total + 0.5).toFixed(2);
  }, [total]);

  useEffect(() => {
    updateOrder({
      total,
      fees: coverFees ? parseFloat(fees) : 0
    });
  }, [total, fees, coverFees, updateOrder]);

  const handlePaymentTab = (_, newTab) => {
    setFieldValue('deposit', newTab === 'deposit' ? order.people.length * DEPOSIT_COST : 0);
    setPaymentTab(newTab);
    if (newTab === 'deposit') setFieldValue('donation', 0);
  };

  function updateAdmissionValue(event) {
    const { name, value } = event.target;
    setFieldValue(name, clampAdmission(value));
    handleBlur(event); // bubble up to formik
    setPayingMax(clampAdmission(values['people'][0]['admission']) === ADMISSION_COST_RANGE[1] ? true : false)
  }

  function updateDonationValue(event) {
    const { name, value } = event.target;
    setFieldValue(name, clampDonation(value));
    handleBlur(event); // bubble up to formik
    setDonationTotal(parseInt(values['donation'] || 0));
  }

  const setAdmissionCostContent = (
    <>
      <Title>Admission cost</Title>
      <Paragraph>
        Number of admissions: {order.people.length}<br />
        Price per admission: ${ADMISSION_COST_RANGE[0]}
      </Paragraph>
      <Paragraph>
        Admissions total: ${order.people.length * ADMISSION_COST_RANGE[0]}
      </Paragraph>
    </>
  );

  const slidingScaleContent = (
    <>
      {isMultiplePeople && <Paragraph>How much is each person able to pay?</Paragraph>}
      {order.people.map((person, index) =>
        <Field
          alignRight
          key={index}
          sx={{ width: '5em', mb: 1 }}
          label={isMultiplePeople ? `${person.first} ${person.last}` : 'How much are you able to pay?'}
          name={`people[${index}].admission`}
          type='pattern'
          pattern='###'
          range={ADMISSION_COST_RANGE}
          onBlur={updateAdmissionValue}
          InputProps={{ startAdornment: <InputAdornment position='start'>$</InputAdornment> }}
        />
      )}
    </>
  );

  return (
    <section className='PaymentInfo'>

      <PaymentExplanation />

      <div className='admissions-section'>
        <StyledPaper className='admissions-cost'>

          <Title>Sliding scale</Title>
          <Paragraph>Please read the sliding scale and deposit explanations above.</Paragraph>

          {DEPOSIT_OPTION &&
            <TabContext value={paymentTab}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={paymentTab} onChange={handlePaymentTab} aria-label="payment options tabs">
                  <Tab label="Full Payment" value="fullpayment" sx={{ '&:hover': { bgcolor: 'primary.light', color: 'primary.contrastText' } }} />
                  <Tab label="Deposit" value="deposit" sx={{ '&:hover': { bgcolor: 'primary.light', color: 'primary.contrastText' } }} />
                </Tabs>
              </Box>
              <TabPanel value="fullpayment" sx={{ pl: 1, pr: 0 }}>
                {isSlidingScale ? slidingScaleContent : setAdmissionCostContent}
              </TabPanel>
              <TabPanel value="deposit" sx={{ pl: 1, pr: 0 }}>
                <Paragraph>A deposit of ${DEPOSIT_COST} per person is required to reserve your spot.</Paragraph>
                <Paragraph color='warning.main' sx={{ my: 2, fontWeight: 'bold' }}>The balance of the payment will be due by {PAYMENT_DUE_DATE}.</Paragraph>
              </TabPanel>
            </TabContext>
          }

          {!DEPOSIT_OPTION &&
          <>
            {isSlidingScale ? slidingScaleContent : setAdmissionCostContent}
          </>
          }

        </StyledPaper>

        {DONATION_OPTION && paymentTab === 'fullpayment' && (payingMax || values['donation'] > 0) &&
          <StyledPaper className='donation-section'>
            <Title>Additional contribution</Title>
            {!donate && 
              <Field
                alignRight
                type='button'
                label="Would you like to make an additional contribution?"
                name="donate"
                buttonText="Yes"
                onClick={() => setDonate(true)}
              />
            }

            {donate && 
              <Field
                alignRight
                sx={{ minWidth: '6rem', maxWidth: '6rem' }}
                label="How much would you like to add as an additional contribution?"
                name="donation" 
                type='pattern'
                pattern='###'
                range={[0, DONATION_MAX]}
                onBlur={updateDonationValue}
                InputProps={{ startAdornment: <InputAdornment position='start'>$</InputAdornment> }}
                autoFocus={values['donation'] === 0}
                // onFocus={(e) => e.target.select()}
              />
            }
          </StyledPaper>
        }

        {COVER_FEES_OPTION &&
          <StyledPaper>
            <FormControlLabel
              control={<Checkbox checked={coverFees} onChange={(e) => setCoverFees(e.target.checked)} />}
              label={`I would like to add ${fees} to cover the transaction fees.`}
            />
          </StyledPaper>
        }

      </div>

      <NavButtons
        backButtonProps = {{ text: 'Back', onClick: handleClickBackButton }}
        nextButtonProps = {{ text: 'Checkout' }}
      />

    </section>
  );
};

const clampAdmission = (value) => clamp(value || ADMISSION_COST_RANGE[0], ADMISSION_COST_RANGE);
const clampDonation = (value) => clamp(value || 0, [0, DONATION_MAX]);
