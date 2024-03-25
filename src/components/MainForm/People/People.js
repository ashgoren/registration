import { useState } from 'react';
import { useOrder } from 'components/OrderContext';
import { useFormikContext } from 'formik';
import { Box, Button, Typography, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PersonForm from '../PersonForm';
import NavButtons from 'components/NavButtons';
import { StyledPaper } from 'components/Layout/SharedStyles';
import config from 'config';
import { PersonSummary } from 'components/OrderSummary';
const { ADMISSION_QUANTITY_MAX, PERSON_DEFAULTS } = config;

export default function People() {
  const { order, updateOrder } = useOrder();
  const [editIndex, setEditIndex] = useState(order.people[0].email === '' ? 0 : null);
  const [isNewPerson, setIsNewPerson] = useState(false);

  const formik = useFormikContext();
  const { values, setFieldValue } = formik;

  const resetForm = () => {
    formik.resetForm({ values: order });
  };

  const handleAddNew = () => {
    const people = [...values.people, PERSON_DEFAULTS];
    setEditIndex(order.people.length);
    setFieldValue('people', people); // update formik field array
    setIsNewPerson(true);
  };

  const handleEdit = (personIndex) => {
    setEditIndex(personIndex);
  };

  const handleDelete = (personIndex) => {
    const person = order.people[personIndex];
    if (window.confirm(`Remove ${person.first} ${person.last} from registration?`)) {
      let people = order.people.filter((_, index) => index !== personIndex);
      if (people.length === 0) {
        people.push(PERSON_DEFAULTS);
        setEditIndex(0);
        resetForm();
      }
      updateOrder({ people });
      setFieldValue('people', people); // update formik field array
    }
  };

  return (
    <>
      {(order.people.length > 1 || order.people[0].email || editIndex === null) &&
        <StyledPaper>
          {order.people.map((person, index) => (
            <Box key={index}>
              {index !== editIndex && person.email && 
                <PersonContainerAccordion
                  person={person}
                  personIndex={index}
                  showButtons={editIndex === null}
                  setEditIndex={setEditIndex} 
                  handleEdit={handleEdit} handleDelete={handleDelete}
                />
              }
            </Box>
          ))}

          { editIndex === null && order.people.length < ADMISSION_QUANTITY_MAX &&
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <div />
              <Button onClick={handleAddNew} variant='text' color='warning'>Add another person</Button>
              <div />
            </Box>
          }
        </StyledPaper>
      }

      {editIndex !== null &&
        <>
          <StyledPaper>
            <PersonForm
              editIndex={editIndex} setEditIndex={setEditIndex}
              isNewPerson={isNewPerson} setIsNewPerson={setIsNewPerson}
              resetForm={resetForm}
            />
          </StyledPaper>
        </>
      }

      {editIndex === null &&
        <NavButtons nextButtonProps = {{ text: 'Next' }} />
      }
    </>
  );
}

function PersonContainerAccordion({ person, personIndex, showButtons, handleEdit, handleDelete }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Box sx={{ mt: 2 }}>
      <Accordion expanded={expanded} onChange={ () => setExpanded(!expanded) }>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1a-content" id="panel1a-header">
          <Typography><strong>{person.first} {person.last}</strong></Typography>
        </AccordionSummary>
        <AccordionDetails>
          <PersonSummary person={person} skipCost={true} skipFirstLastHeading={true} />
          {showButtons &&
            <Box sx={{ my: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <div />
                <Button onClick={() => handleDelete(personIndex)} variant='contained' color='error'>Delete</Button>
                <div />
                <Button onClick={() => handleEdit(personIndex)} variant='contained' color='info'>Edit</Button>
                <div />
              </Box>
            </Box>
          }
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
