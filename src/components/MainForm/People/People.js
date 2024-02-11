import { useState } from 'react';
import { Box } from '@mui/material';
import Person from '../Person';
import ButtonRow from 'components/ButtonRow';
import { StyledPaper } from 'components/Layout/SharedStyles';
import OrderSummary from 'components/OrderSummary';
import config from 'config';
const { ADMISSION_QUANTITY_MAX } = config;

export default function People({ admissionQuantity, setAdmissionQuantity, order, resetForm, saveForm }) {
  const [editIndex, setEditIndex] = useState(order.emailConfirmation === '' ? 0 : null);

  const handleAddNew = () => {
    setEditIndex(admissionQuantity); // new person, since indexing starts at 0
    setAdmissionQuantity(admissionQuantity + 1)
  };

  return (
    <>
      {Array(admissionQuantity).fill().map((_, index) => {
        return (
          <Box key={index}>
            <StyledPaper>
              {index === editIndex ?
                <Person
                  index={index}
                  order={order}
                  setEditIndex={setEditIndex}
                  setAdmissionQuantity={setAdmissionQuantity}
                  resetForm={resetForm}
                  saveForm={saveForm}
                />
              :
                <div onClick={() => editIndex === null && setEditIndex(index)}>
                  <OrderSummary order={order} personIndex={index} />
                </div>
              }
            </StyledPaper>
          </Box>
        );
      })}

      {editIndex === null &&
        <ButtonRow
          backButtonProps = { admissionQuantity < ADMISSION_QUANTITY_MAX && { onClick: handleAddNew, text: 'Add another person' }}
          nextButtonProps = {{ type: 'submit', text: 'Next...' }}
        />
      }
    </>
  );
}
