import { useState } from 'react';
import { useFormikContext } from 'formik';
import { Box } from '@mui/material';
import PersonForm from '../PersonForm';
import ButtonRow from 'components/ButtonRow';
import { StyledPaper } from 'components/Layout/SharedStyles';
import config from 'config';
import { PersonContainerAccordion } from 'components/OrderSummary';
const { ADMISSION_QUANTITY_MAX, PERSON_DEFAULTS } = config;

export default function People({ order, setOrder, resetForm, saveForm }) {
  const [editIndex, setEditIndex] = useState(order.emailConfirmation === '' ? 0 : null);
  const [isNewPerson, setIsNewPerson] = useState(false);

  const formik = useFormikContext();
  const { values, setFieldValue } = formik;

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
      const people = order.people.filter((_, index) => index !== personIndex);
      if (people.length === 0) {
        people.push(PERSON_DEFAULTS);
        setEditIndex(0);
        resetForm();
      }
      setOrder({
        ...order,
        people,
        emailConfirmation: people[0].email 
      });
      setFieldValue('people', people); // update formik field array
      setFieldValue('emailConfirmation', people[0].email); // update formik field
    }
  };

  return (
    <>
      {(order.people.length > 1 || editIndex === null) &&
        <StyledPaper>
          {order.people.map((person, index) => (
            <Box key={index}>
              {index !== editIndex && person.email && 
                <PersonContainerAccordion
                  order={order}
                  personIndex={index}
                  showButtons={editIndex === null}
                  setEditIndex={setEditIndex} 
                  handleEdit={handleEdit} handleDelete={handleDelete}
                />
              }
            </Box>
          ))}
        </StyledPaper>
      }

      {editIndex !== null &&
        <>
          <StyledPaper>
            <PersonForm
              order={order}
              editIndex={editIndex} setEditIndex={setEditIndex}
              resetForm={resetForm}
              saveForm={saveForm}
              isNewPerson={isNewPerson} setIsNewPerson={setIsNewPerson}
            />
          </StyledPaper>
        </>
      }

      {editIndex === null &&
        <StyledPaper>
          <ButtonRow
            backButtonProps = { order.people.length < ADMISSION_QUANTITY_MAX && { onClick: handleAddNew, text: 'Add another person' }}
            nextButtonProps = {{ text: 'Next...' }}
          />
        </StyledPaper>
      }
    </>
  );
}
