import { useState, useEffect, useMemo, useRef } from 'react';
import { Formik, Form } from 'formik';
import { validationSchema } from './validationSchema';
import { useBlocker } from 'react-router-dom';
import { Header, NavButtons } from 'components/layouts';
import { usePageNavigation } from 'hooks/usePageNavigation';
import { Box, Tab, Tabs } from '@mui/material';
import { TabPanel, TabContext } from '@mui/lab';
import { StyledPaper, Title, Paragraph } from 'components/layouts/SharedStyles';
import { clamp, sanitizeObject } from 'utils/misc';
import { logDebug } from 'src/logger';
import { useScrollToTop } from 'hooks/useScrollToTop';
import { useWarnBeforeUnload } from 'hooks/useWarnBeforeUnload';
import { useOrderData } from 'contexts/OrderDataContext';
import { PaymentExplanation } from 'components/Static/PaymentExplanation';
import { PaymentFormDonation } from './PaymentFormDonation';
import { PaymentFormFees } from './PaymentFormFees';
import { PaymentFormTotal } from './PaymentFormTotal';
import { PaymentFormFullPayment } from './PaymentFormFullPayment';
import { config } from 'config';
import type { Order } from 'types/order';
import type { FormikProps } from 'formik';

export const PaymentForm = () => {
  const { order, updateOrder } = useOrderData();
  const { goBack, goNext } = usePageNavigation();
  const [coverFees, setCoverFees] = useState(Number(order.fees) > 0);
  const [paymentTab, setPaymentTab] = useState(order.deposit > 0 ? 'deposit' : 'fullpayment');
  const shouldProceedRef = useRef(false);

  useScrollToTop();
  useWarnBeforeUnload();

  const handleSubmit = (values: Order) => {
    saveForm(values);
    goNext();
  }

  // Triggered only after validation passes
  const saveForm = (values: Order) => {
    const submittedOrder = Object.assign({}, values);
    logDebug('Payment form submitted:', values);
    updateOrder(sanitizeObject({
      ...submittedOrder,
      deposit: submittedOrder.deposit ? submittedOrder.people.length * config.payments.deposit.amount : 0,
      total: order.total,
      fees: order.fees
    }));
    shouldProceedRef.current = true;
  };

  return (
    <Formik
      initialValues={order}
      validationSchema={validationSchema({ currentPage: 'payment' })}
      validateOnBlur={true}
      validateOnChange={false}
      onSubmit={handleSubmit}
    >
      {({ values, setFieldValue, dirty }: FormikProps<Order>) => {

        const blocker = useBlocker(dirty && !shouldProceedRef.current)

        useEffect(() => {
          if (blocker.state === 'blocked') {
            if (shouldProceedRef.current) {
              blocker.proceed();
            } else {
              blocker.reset();
            }
          }
        }, [blocker.state]);

        const handleBack = () => {
          // Note that validation is not run when going back, but there's nothing really to validate on this page.
          saveForm(values);
          goBack();
        }

        const donationTotal = useMemo(() => {
          return Number(values.donation) || 0;
        }, [values.donation]);

        const payingMax = useMemo(() => {
          return Number(values.people[0].admission) === config.admissions.costRange[1];
        }, [values.people]);

        const admissionTotal = useMemo(() => {
          return values.people.reduce((total, person) => total + clampAdmission(person.admission), 0);
        }, [values.people]);

        const depositTotal = useMemo(() => {
          return config.payments.deposit.amount * order.people.length;
        }, [order.people.length]);

        const total = useMemo(() => {
          return paymentTab === 'deposit' ? depositTotal : admissionTotal + donationTotal;
        }, [paymentTab, depositTotal, admissionTotal, donationTotal]);

        const fees = useMemo(() => {
          return (0.0245 * total + 0.5).toFixed(2);
        }, [total]);

        const feesTotal = useMemo(() => {
          return coverFees ? Number(fees) : 0;
        }, [fees, coverFees]);

        const totalWithFees = useMemo(() => {
          return total + feesTotal;
        }, [total, feesTotal]);

        useEffect(() => {
          updateOrder({
            total,
            fees: coverFees ? parseFloat(fees) : 0
          });
        }, [total, fees, coverFees, updateOrder]);

        const handlePaymentTab = (_: React.SyntheticEvent, newTab: string) => {
          setFieldValue('deposit', newTab === 'deposit' ? order.people.length * config.payments.deposit.amount : 0);
          setPaymentTab(newTab);
          if (newTab === 'deposit') setFieldValue('donation', 0);
        };
        
        return (
          <>
            <Header titleText={config.event.title} /> 

            <Form spellCheck='false'>
              <section className='PaymentForm'>

                <PaymentExplanation />

                <div className='admissions-section'>
                  <StyledPaper className='admissions-cost'>

                    <Title>{config.admissions.mode === 'sliding-scale' ? 'Sliding scale' : 'Payment'}</Title>

                    {!config.payments.deposit.enabled && <PaymentFormFullPayment order={order} />}

                    {config.payments.deposit.enabled &&
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
                          <Paragraph>A deposit of ${config.payments.deposit.amount} per person is required to reserve your spot.</Paragraph>
                          <Paragraph color='warning.main' sx={{ my: 2, fontWeight: 'bold' }}>The balance of the payment will be due by {config.payments.paymentDueDate}.</Paragraph>
                        </TabPanel>
                      </TabContext>
                    }

                  </StyledPaper>

                  {config.payments.donation.enabled && paymentTab === 'fullpayment' && (payingMax || values['donation'] > 0) &&
                    <PaymentFormDonation
                      donationAmount={order.donation}
                    />
                  }

                  {config.payments.coverFeesCheckbox &&
                    <PaymentFormFees
                      fees={Number(fees)}
                      coverFees={coverFees}
                      setCoverFees={setCoverFees}
                    />
                  }

                  {config.payments.showPaymentSummary &&
                    <PaymentFormTotal
                      admissionTotal={admissionTotal}
                      depositTotal={depositTotal}
                      isDeposit={paymentTab === 'deposit'}
                      donationTotal={donationTotal}
                      feesTotal={feesTotal}
                      totalWithFees={totalWithFees}
                    />
                  }
                </div>
              </section>

              <NavButtons 
                back={{ text: 'Back', onClick: handleBack }}
                next={{ text: 'Next' }}
              />

            </Form>
          </>
        );
      }}
    </Formik>
  );
};

const clampAdmission = (value: number) => clamp(value || config.admissions.costRange[0], config.admissions.costRange);
