/* ***********************************************************************************************************
** NOTE: This component uses some vanilla html becuase it's used in the confirmation email.                 **
** -------------------------------------------------------------------------------------------------------  **
** NOTE: order is passed as prop to be sure it is most up-to-date when this is used in receipt generation.  **
*********************************************************************************************************** */

import { Box, Typography } from '@mui/material';
import { formatCurrency } from 'utils';
import { config } from 'config';
const { ORDER_SUMMARY_OPTIONS, ADMISSION_COST_RANGE, PAYMENT_DUE_DATE, INCLUDE_PRONOUNS_ON_NAMETAG, WAITLIST_MODE } = config;

export const OrderSummary = ({ order }) => {
  const admissions = order.people.map(person => person.admission);
  const admissionsTotal = admissions.reduce((total, admission) => total + admission, 0);
  const isDeposit = order.deposit > 0;
  const isFullPayment = !isDeposit;
  const fees = parseFloat(order.fees);

  return (
    <>
      <Typography variant="body" gutterBottom>
        <strong>{order.people.length > 1 ? 'Registration' : 'Your info'}</strong>
      </Typography>

      {order.people.map((person, index) => person.email && (
        <Box sx={{ border: 'dotted', p: 2, m: 2 }} style={{ marginTop: '1em' }} key={index}>
          <PersonSummary person={person} />
        </Box>
      ))}

      {!WAITLIST_MODE &&
        <Box style={{ marginTop: '2em' }}>
          <Typography variant="body" gutterBottom>
            <strong>Payment Info</strong>
          </Typography>

          <Typography component='p' style={{ marginTop: '1em' }}>
            {isFullPayment &&
              <>
                Registration:&nbsp;
                {admissions.length > 1 && admissions.map((cost, index) => (
                  <span key={index}>
                    ${cost} {index < admissions.length - 1 ? '+ ' : '= '}
                  </span>
                ))}
                ${admissionsTotal}<br />
              </>
            }
            {order.donation > 0 &&
              <>Additional donation: ${order.donation}<br /></>
            }

            {isDeposit &&
              <>
                Deposit {order.charged ? 'paid' : 'due now'}: ${order.deposit}<br />
              </>
            }

            {fees > 0 &&
              <>PayPal fees: ${formatCurrency(fees)}<br /></>
            }

            {isDeposit &&
              <><strong><font color='orange'>The balance of your registration fee is due by {PAYMENT_DUE_DATE}.</font></strong><br /></>
            }
          </Typography>
        </Box>
      }
    </>
  );
};

export const PersonSummary = ({ person, skipCost=false, skipFirstLastHeading=false }) => {
  return (
    <>
      {!skipFirstLastHeading &&
        <Typography variant='body' sx={{ fontWeight: 'bold' }}>{person.first} {person.last}</Typography>
      }
      {ORDER_SUMMARY_OPTIONS
        .map((option) => {
          const { property, label, mapping, defaultValue } = option;
          if (skipCost && property === 'admission') return null;
          return (
            <Box key={option.property}>
              {renderConditionalData({ person, property, label, mapping, defaultValue })}
            </Box>
          );
        })
      }
    </>
  );
};

// data formatting helpers

function renderConditionalData ({ person, property, label, mapping, defaultValue }) {
  let data = person[property];
  let content;
  if (property === 'admission') {
    content = formatCost(data);
  } else if (property === 'nametag') {
    content = formatNametag(person);
  } else if (property === 'address') {
    content = formatAddress(person);
  } else if (property === 'photo') {
    content = person.photo === 'Other' ? person.photoComments : person.photo;
  } else if (Array.isArray(data)) {
    content = formatArray(data, defaultValue, mapping);
  } else if (data) {
    content = formatSimpleDataTypes(data, defaultValue);
  } else {
    content = defaultValue;
  }
  return content ? <>{label && <strong>{label}: </strong>}{content}<br /></> : null;
}

function formatCost(cost) {
  return cost < ADMISSION_COST_RANGE[0] ? <>${cost}<br /><strong><font color='orange'>The balance of this payment will be due by {PAYMENT_DUE_DATE}.</font></strong></> : <>${cost}</>;
}

function formatNametag(person) {
  const { nametag, pronouns } = person;
  const formattedPronouns = pronouns ? `(${pronouns})` : '';
  return INCLUDE_PRONOUNS_ON_NAMETAG ? `${nametag} ${formattedPronouns}` : nametag;
}

function formatAddress(person) {
  const { address, apartment, city, state, zip, country } = person;
  if (!address && !city && !state && !zip) return null;
  let streetAddress;
  if (address) {
    const displayApartment = apartment?.length > 0 && isFinite(apartment.slice(0,1)) ? `#${apartment}` : apartment;
    streetAddress = apartment ? `${address} ${displayApartment}` : address;
  }
  const cityStateZip = city ? `${city}, ${state} ${zip}` : `${state} ${zip}`;
  const cityStateZipWithCountry = country === 'USA' || country === 'United States' ? cityStateZip : `${cityStateZip}, ${country}`;
  return <>{streetAddress && <>{streetAddress}, </>}{cityStateZipWithCountry}</>
}

function formatArray(data, defaultValue, mapping) {
  if (!data.length) return defaultValue;
  if (mapping) {
    const checkboxTitles = data
      .map(item => mapping.find(option => option.value === item)?.label || item)
      .sort((a, b) => {
        const aIndex = mapping.findIndex(option => option.label === a);
        const bIndex = mapping.findIndex(option => option.label === b);
        return aIndex - bIndex;
      });
    return checkboxTitles.join(', ');
  } else {
    return data.join(', ');
  }
}

function formatSimpleDataTypes(data, defaultValue) {
  const formattedData = String(data).trim();
  return formattedData || defaultValue;
}
