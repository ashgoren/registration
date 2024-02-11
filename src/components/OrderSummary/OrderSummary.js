import { Box, Typography } from '@mui/material';
import config from 'config';
const { SCHOLARSHIP_OPTIONS } = config;

export default function OrderSummary({ order, currentPage, personIndex }) {
  const total = order.admissionCost * order.admissionQuantity + order.donation;
  if (!isNaN(personIndex)) {
    const person = order.people[personIndex];
    return (
      <PersonSummary person={person} key={personIndex} />
    );
  } else {
    return (
      <>
        <Typography variant="body" gutterBottom sx={{ fontWeight: 'bold' }}>
          {order.admissionQuantity > 1 ? 'Admissions' : 'Your info'}
        </Typography>

        {order.people.slice(0, order.admissionQuantity).map((person, index) => (
          <PersonSummary person={person} key={index} />
        ))}

        {isNaN(currentPage) &&
          <Box sx={{ mt: 5 }}>
            <Typography variant="body" gutterBottom sx={{ fontWeight: 'bold' }}>
              {currentPage === 'confirmation' && order.paymentId !== 'check' ? 'Amount paid' : 'Amount due'}
            </Typography>
            <p>
              Admissions: {order.admissionQuantity} x ${order.admissionCost} = ${order.admissionQuantity * order.admissionCost}<br />
              {order.donation > 0 &&
                <>
                  Additional donation: ${order.donation}<br />
                  Total: ${total}
                </>
              }
            </p>
          </Box>
        }
      </>
    );
  }
}

function PersonSummary({ person }) {
  return (
    <>
      <Box sx={{border: 'dotted', p: 2, m: 2}}>
        <Box sx={{ mt: 3 }}>
          <Typography variant="body" gutterBottom sx={{ fontWeight: 'bold' }}>
            {person.first} {person.last}
          </Typography>
          <p>
            Nametag: {person.nametag ? <>{person.nametag}</> : <>{person.first}</>} {person.pronouns && <>({person.pronouns})</>}<br />
            {person.email && <>{person.email}<br /></>}
            {person.phone && <>{person.phone}<br /></>}
            {person.address && <>{displayAddress(person.address, person.apartment)}<br /></>}
            {person.city && <>{person.city}, {person.state} {person.zip}<br /></>}
            {person.country !== 'USA' && <>{person.country}</>}
          </p>
        </Box>

        <Box sx={{ mt: 3 }}>
          {/* <Typography variant="body" gutterBottom sx={{ fontWeight: 'bold' }}>
            Miscellanea
          </Typography> */}
          <p>
            Include on roster: {!!person.share.length ? person.share.join(', ') : 'do not share'}<br />
            Include on carpool list: {!!person.carpool.length ? person.carpool.join(', ') : 'no'}<br />
            Volunteering: {!!person.volunteer.length ? person.volunteer.join(', ') : 'not signed up'}<br />
            Scholarship: {!!person.scholarship.length ? getCheckboxTitles({ property: person.scholarship, options: SCHOLARSHIP_OPTIONS }).join(', ').toLowerCase() : 'not requesting'}<br />
            {person.comments && <>Comments: {person.comments}<br /></>}
          </p>
        </Box>
      </Box>
    </>
  );
}

function displayAddress(address, apartment) {
  const displayApartment = apartment?.length > 0 && isFinite(apartment.slice(0,1)) ? `#${apartment}` : apartment;
  return apartment ? `${address} ${displayApartment}` : address;
}

function getCheckboxTitles({ property, options }) {
  let checkboxTitles = property.map(property => {
    const checkboxOption = options.find(option => option.value === property);
    return checkboxOption ? checkboxOption.label : property;
  });
  checkboxTitles.sort((a, b) => {
    const aIndex = options.findIndex(option => option.label === a);
    const bIndex = options.findIndex(option => option.label === b);
    return aIndex - bIndex;
  });
  return checkboxTitles;
}
