import { useState } from 'react';
import { Box, Button, Typography, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { NavButtons } from 'components/layouts';
import { StyledPaper, Paragraph } from 'components/layouts/SharedStyles';
import { useWarnBeforeUnload } from 'hooks/useWarnBeforeUnload';
import { useOrderData } from 'contexts/OrderDataContext';
import { PersonForm } from './PersonForm';
import { PersonSummary } from 'components/OrderSummary';
import { logDebug } from 'src/logger';
import { config } from 'config';
import type { RefObject } from 'react';
import type { Order, Person } from 'types/order';
import type { FormikProps } from 'formik';

const { ADMISSION_QUANTITY_MAX, PERSON_DEFAULTS } = config;

export const People = ({ formikRef }: { formikRef: RefObject<FormikProps<Order> | null> }) => {
  logDebug('People rendered');

  const { order, updateOrder } = useOrderData();
  const [editIndex, setEditIndex] = useState(order.people[0].email === '' ? 0 : null);
  const [isNewPerson, setIsNewPerson] = useState(false);

  useWarnBeforeUnload();

  const resetForm = () => {
    formikRef.current!.resetForm({ values: order });
  };

  const handleAddNew = () => {
    const { values, setFieldValue } = formikRef.current!
    const people = [...values.people, PERSON_DEFAULTS];
    setEditIndex(order.people.length);
    setFieldValue('people', people); // update formik field array
    setIsNewPerson(true);
  };

  const handleEdit = (personIndex: number) => {
    setEditIndex(personIndex);
  };

  const handleDelete = (personIndex: number) => {
    const person = order.people[personIndex];
    if (window.confirm(`Remove ${person.first} ${person.last} from registration?`)) {
      const people = order.people.filter((_, index) => index !== personIndex);
      if (personIndex === 0 && people.length > 0) {
        people[0].agreement = ['yes'];
      } else if (people.length === 0) {
        people.push(PERSON_DEFAULTS);
        setEditIndex(0);
        resetForm();
      }
      updateOrder({ people });
      formikRef.current!.setFieldValue('people', people); // update formik field array
    }
  };

  return (
    <>
      {(order.people.length > 1 || order.people[0].email || editIndex === null) &&
        <StyledPaper>
          <Paragraph sx={{ mb: 4 }}>
            Please review your information. {order.people.length < ADMISSION_QUANTITY_MAX && 'You may also register an additional person below.'}
          </Paragraph>
          {order.people.map((person, index) => (
            <Box key={index}>
              {index !== editIndex && person.email && 
                <PersonContainerAccordion
                  person={person}
                  personIndex={index}
                  showButtons={editIndex === null}
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
              formikRef={formikRef}
            />
          </StyledPaper>
        </>
      }

      {editIndex === null &&
        <NavButtons nextText='Next' onNextClick={() => formikRef.current?.submitForm()} />
      }
    </>
  );
}

function PersonContainerAccordion({ person, personIndex, showButtons, handleEdit, handleDelete }: {
  person: Person;
  personIndex: number;
  showButtons: boolean;
  handleEdit: (personIndex: number) => void;
  handleDelete: (personIndex: number) => void;
}) {
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
};
