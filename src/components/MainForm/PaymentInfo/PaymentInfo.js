import { useEffect } from 'react';
import { scrollToTop } from 'utils';
import { RightAlignedInput } from '../Input';
import { StyledPaper, Title, Paragraph } from 'components/Layout/SharedStyles';
import { InputAdornment, Typography } from '@mui/material';
import { useFormikContext } from 'formik';
// import PaymentExplanation from 'components/static/PaymentExplanation';
import config from 'config';
const { ADMISSION_COST_RANGE, DONATION_OPTION, DONATION_RANGE } = config;

export default function PaymentInfo({ order, donate, setDonate, clampValue }) {
  const { values } = useFormikContext();

  useEffect(() => { scrollToTop(); },[])

  return (
    <section className='PaymentInfo'>

      {/* <PaymentExplanation /> */}

      <div className='admissions-section'>
        <StyledPaper className='admissions-cost'>
            {ADMISSION_COST_RANGE[0] < ADMISSION_COST_RANGE[1] ?
              <>
                <Title>Sliding scale</Title>
                <RightAlignedInput
                  sx={{ width: '5em' }}
                  label={`How much are you able to pay${order.people.length > 1 ? ' *per person*' : ''}? ($${ADMISSION_COST_RANGE[0]}-${ADMISSION_COST_RANGE[1]})`}
                  name="admissionCost"
                  pattern='###'
                  range={ADMISSION_COST_RANGE}
                  onBlur={(event) => clampValue({ event: event, range: ADMISSION_COST_RANGE})}
                  InputProps={{ startAdornment: <InputAdornment position='start'>$</InputAdornment> }}
                />
                <Typography>$100 (standard fee)</Typography>
                <Typography>$120 (a nice donation)</Typography>
                <Typography>$150 (a generous donation)</Typography>
                <Paragraph>If you requested a scholarship, just leave it at $100, select "pay by check" at checkout, and we will be in touch with you.</Paragraph>
              </>
            :
              <>
              <Title>Admission cost</Title>
                <p>
                  Number of admissions: {order.people.length}<br />
                  Price per admission: ${ADMISSION_COST_RANGE[0]}
                </p>
                <p>
                  Admissions total: ${order.people.length * ADMISSION_COST_RANGE[0]}
                </p>
              </>
            }
        </StyledPaper>

        {DONATION_OPTION &&
          <StyledPaper className='donation-section'>
            <Title>Additional contribution</Title>
            {!donate && 
              <RightAlignedInput
                label="Would you like to make an additional contribution?"
                name="donate"
                buttonText="Yes"
                onClick={() => setDonate(true)}
              />
            }

            {donate && 
              <RightAlignedInput
                sx={{ minWidth: '6rem', maxWidth: '6rem' }}
                label="How much would you like to add as an additional contribution?"
                name="donation" 
                pattern='###'
                range={DONATION_RANGE}
                onBlur={(event) => clampValue({ event: event, range: DONATION_RANGE})}
                InputProps={{ startAdornment: <InputAdornment position='start'>$</InputAdornment> }}
                autoFocus={values['donation'] === 0}
                // onFocus={(e) => e.target.select()}
              />
            }
          </StyledPaper>
        }
      </div>      
    </section>
  );
}
