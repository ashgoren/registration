import { useState, useEffect, useMemo } from 'react';
import { useFormikContext } from 'formik';
import { Box, Tab, Tabs } from '@mui/material';
import { TabPanel, TabContext } from '@mui/lab';
import { NavButtons } from 'components/layouts';
import { StyledPaper, Title, Paragraph } from 'components/layouts/SharedStyles';
import { clamp } from 'utils';
import { useScrollToTop } from 'hooks/useScrollToTop';
import { useWarnBeforeUnload } from 'hooks/useWarnBeforeUnload';
import { useOrder } from 'hooks/useOrder';
import { PaymentExplanation } from 'components/Static/PaymentExplanation';
import { PaymentFormDonation } from './PaymentFormDonation';
import { PaymentFormFees } from './PaymentFormFees';
import { PaymentFormFullPayment } from './PaymentFormFullPayment';
import { config } from 'config';
const { DEPOSIT_OPTION, COVER_FEES_OPTION, DEPOSIT_COST, ADMISSION_COST_RANGE, DONATION_OPTION, PAYMENT_DUE_DATE } = config;

export const isSlidingScale = ADMISSION_COST_RANGE[0] < ADMISSION_COST_RANGE[1];

export const PaymentForm = ({ handleClickBackButton }) => {
  const { order, updateOrder } = useOrder();
  const { values, setFieldValue } = useFormikContext();
  const [coverFees, setCoverFees] = useState(order.fees > 0);
  const [paymentTab, setPaymentTab] = useState(order.deposit > 0 ? 'deposit' : 'fullpayment');

  useScrollToTop();
  useWarnBeforeUnload();

  const donationTotal = useMemo(() => {
    return Number(values.donation) || 0;
  }, [values.donation]);

  const payingMax = useMemo(() => {
    return Number(values.people[0].admission) === ADMISSION_COST_RANGE[1];
  }, [values.people]);

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

  return (
    <section className='PaymentForm'>

      <PaymentExplanation />

      <div className='admissions-section'>
        <StyledPaper className='admissions-cost'>

          <Title>Sliding scale</Title>
          <Paragraph>Please read the sliding scale and deposit explanations above.</Paragraph>

          {!DEPOSIT_OPTION && <PaymentFormFullPayment order={order} />}

          {DEPOSIT_OPTION &&
            <TabContext value={paymentTab}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={paymentTab} onChange={handlePaymentTab} aria-label="payment options tabs">
                  <Tab label="Full Payment" value="fullpayment" sx={{ '&:hover': { bgcolor: 'primary.light', color: 'primary.contrastText' } }} />
                  <Tab label="Deposit" value="deposit" sx={{ '&:hover': { bgcolor: 'primary.light', color: 'primary.contrastText' } }} />
                </Tabs>
              </Box>
              <TabPanel value="fullpayment" sx={{ pl: 1, pr: 0 }}>
                <PaymentFormFullPayment order={order} />
              </TabPanel>
              <TabPanel value="deposit" sx={{ pl: 1, pr: 0 }}>
                <Paragraph>A deposit of ${DEPOSIT_COST} per person is required to reserve your spot.</Paragraph>
                <Paragraph color='warning.main' sx={{ my: 2, fontWeight: 'bold' }}>The balance of the payment will be due by {PAYMENT_DUE_DATE}.</Paragraph>
              </TabPanel>
            </TabContext>
          }

        </StyledPaper>

        {DONATION_OPTION && paymentTab === 'fullpayment' && (payingMax || values['donation'] > 0) &&
          <PaymentFormDonation
            donationAmount={order.donation}
          />
        }

        {COVER_FEES_OPTION &&
          <PaymentFormFees
            fees={fees}
            coverFees={coverFees}
            setCoverFees={setCoverFees}
          />
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
