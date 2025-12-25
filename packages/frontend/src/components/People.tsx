import { useState } from 'react';
import { useBlocker } from 'react-router-dom';
import { Formik, Form } from 'formik';
import { validationSchema } from './validationSchema';
import { Box, Button, Typography, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { StyledPaper, Paragraph } from 'components/layouts/SharedStyles';
import { useWarnBeforeUnload } from 'hooks/useWarnBeforeUnload';
import { useOrderData } from 'contexts/OrderDataContext';
import { usePageNavigation } from 'hooks/usePageNavigation';
import { PersonForm } from './PersonForm';
import { PersonSummary } from 'components/OrderSummary';
import { WaitlistNote } from 'components/WaitlistNote';
import { Header, NavButtons } from 'components/layouts';
import { IntroHeader } from 'components/IntroHeader';
import { config } from 'config';
import type { Order, Person } from 'types/order';
import type { FormikProps } from 'formik';

export const People = () => {
  // logDebug('People rendered');

  const { order, updateOrder } = useOrderData();
  const { goNext } = usePageNavigation();
  const [editIndex, setEditIndex] = useState(order.people[0].email === '' ? 0 : null);
  const [isNewPerson, setIsNewPerson] = useState(false);

  useWarnBeforeUnload();
  
  return (
    <Formik
      initialValues={order}
      validationSchema={validationSchema({ currentPage: 'people' })}
      validateOnBlur={true}
      validateOnChange={false}
      onSubmit={goNext}
    >
      {({ values, setFieldValue, resetForm, dirty }: FormikProps<Order>) => {

        useBlocker(editIndex !== null && dirty);

        const handleAddNew = () => {
          const people = [...values.people, config.fields.personDefaults];
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
              people.push(config.fields.personDefaults);
              setEditIndex(0);
              resetForm({ values: order });
            }
            updateOrder({ people });
            setFieldValue('people', people); // update formik field array
          }
        };

        return (
          <>
            <Header titleText={config.event.title}>
              {config.registration.waitlistMode && <WaitlistNote />}
              <IntroHeader />
            </Header>

            <Form spellCheck='false'>
              {(order.people.length > 1 || order.people[0].email || editIndex === null) &&
                <StyledPaper>
                  <Paragraph sx={{ mb: 4 }}>
                    Please review your information. {order.people.length < config.registration.admissionQuantityMax && 'You may also register an additional person below.'}
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

                  { editIndex === null && order.people.length < config.registration.admissionQuantityMax &&
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
                    />
                  </StyledPaper>
                </>
              }

              {editIndex === null &&
                <NavButtons next={{ text: 'Next' }} />
              }

            </Form>
          </>
        );
      }}
    </Formik>
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
