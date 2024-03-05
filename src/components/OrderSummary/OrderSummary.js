// NOTE: this component uses some vanilla html becuase it's used in the confirmation email

import { useState } from 'react';
import { Box, Typography, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import ButtonRow from 'components/ButtonRow';
import config from 'config';
const { ORDER_SUMMARY_OPTIONS, ADMISSION_COST_RANGE, PAYMENT_DUE_DATE } = config;

// order is passed as prop to be sure it is most up-to-date when coming from receipt
export default function OrderSummary({ order, currentPage }) {
  const admissions = order.people.map(person => person.admissionCost);
  const admissionsTotal = admissions.reduce((total, admission) => total + admission, 0);
  // console.log('typoeof admissionsTotal', typeof admissionsTotal);
  const total = admissionsTotal + order.donation;
  const splitPayment = order.people.some(person => person.admissionCost * order.people.length !== admissionsTotal);
  const isPayingDeposit = order.people.some(person => person.admissionCost < ADMISSION_COST_RANGE[0]);

  return (
    <>
      <Typography variant="body" gutterBottom>
        <strong>{order.people.length > 1 ? 'Admissions' : 'Your info'}</strong>
      </Typography>

      {order.people.map((person, index) => person.email && (
        <Box key={index}>
          <PersonContainerDotted person={person} />
        </Box>
      ))}

      <Box style={{ marginTop: '2em' }}>
        <Typography variant="body" gutterBottom>
          <strong>{currentPage === 'confirmation' && order.paymentId !== 'check' ? 'Amount paid' : 'Amount due'}</strong>
        </Typography>
        <p>
          {splitPayment ?
            <>
              Admissions:&nbsp;
              {admissions.map((cost, index) => (
                <span key={index}>
                  ${cost} {index < admissions.length - 1 ? '+ ' : '= '}
                </span>
              ))}
              ${admissionsTotal}
            </>
            :
            <>
              Admissions: {order.people.length} x ${order.people[0].admissionCost} = ${admissionsTotal}
            </>
          }
          {isPayingDeposit && <><br /><strong><font color='orange'>The balance of the payment will be due by {PAYMENT_DUE_DATE}.</font></strong></>}

          {order.donation > 0 &&
            <>
              <br />
              Additional donation: ${order.donation}<br />
              Total: ${total}
            </>
          }
        </p>
      </Box>
    </>
  );
}

function PersonContainerDotted({ person }) {
  return (
    <Box sx={{ border: 'dotted', p: 2, m: 2 }} style={{ marginTop: '1em' }}>
      <Typography variant='body' sx={{ fontWeight: 'bold' }}>{person.first} {person.last}</Typography>
      <PersonSummary person={person} />
    </Box>
  );
}

export function PersonContainerAccordion({ person, personIndex, showButtons, handleEdit, handleDelete }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Box sx={{ mt: 2 }}>
      <Accordion expanded={expanded} onChange={ () => setExpanded(!expanded) }>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1a-content" id="panel1a-header">
          <Typography>{person.first} {person.last}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <PersonSummary person={person} skipCost={true} />
          {showButtons &&
            <Box sx={{ my: 4 }}>
              <ButtonRow
                deleteButtonProps={{ onClick: () => handleDelete(personIndex), text: 'Delete' }}
                editButtonProps={{ onClick: () => handleEdit(personIndex), text: 'Edit' }}
              />
            </Box>
          }
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}

function PersonSummary({ person, skipCost=false }) {
  return (
    <>
      {ORDER_SUMMARY_OPTIONS
        .map((option) => {
          const { property, label, mapping, defaultValue } = option;
          if (skipCost && property === 'admissionCost') return null;
          return (
            <Box key={option.property}>
              {renderConditionalData({ person, property, label, mapping, defaultValue })}
            </Box>
          );
        })
      }
    </>
  );
}

// data formatting helpers

function renderConditionalData ({ person, property, label, mapping, defaultValue }) {
  let data = person[property];
  let content;
  if (property === 'admissionCost') {
    content = formatCost(data);
    label = data < ADMISSION_COST_RANGE[0] ? 'Deposit Amount' : label;
  } else if (property === 'nametag') {
    content = formatNametag(person);
  } else if (property === 'address') {
    content = formatAddress(person);
  } else if (Array.isArray(data)) {
    content = formatArray(data, defaultValue, mapping);
  } else if (data) {
    content = formatSimpleDataTypes(data, defaultValue);
  } else {
    content = defaultValue;
  }
  return content ? <>{label && `${label}: `}{content}<br /></> : null;
}

function formatCost(cost) {
  return cost < ADMISSION_COST_RANGE[0] ? <>${cost}<br /><strong><font color='orange'>The balance of this payment will be due by {PAYMENT_DUE_DATE}.</font></strong></> : <>${cost}</>;
}

function formatNametag(person) {
  const { nametag, first, pronouns } = person;
  const formattedName = nametag || first;
  const formattedPronouns = pronouns ? `(${pronouns})` : '';
  return `${formattedName} ${formattedPronouns}`;
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
  return <>{streetAddress && <>{streetAddress}<br /></>}{cityStateZipWithCountry}</>
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
