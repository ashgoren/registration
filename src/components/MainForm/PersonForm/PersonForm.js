import { useFormikContext } from 'formik';
import { Box } from '@mui/material';
import ContactInfo from '../ContactInfo';
import MiscInfo from '../MiscInfo';
import ButtonRow from 'components/ButtonRow';

export default function PersonForm({ editIndex, setEditIndex, saveForm, order, resetForm, isNewPerson, setIsNewPerson }) {
  const formik = useFormikContext();
  const { values, setFieldValue } = formik;

  function handleCancelButton() {
    setEditIndex(null);
    resetForm();
    if (isNewPerson) {
      const people = values.people.slice(0, -1);
      setFieldValue('people', people);
      setIsNewPerson(false);
    }
  }

  async function handleSaveButton() {
    const success = await saveForm();
    if (success) {
      setEditIndex(null);
      setIsNewPerson(false);
    }
  }

  return (
    <>
      <ContactInfo index={editIndex} />
      <MiscInfo index={editIndex} />
      <Box sx={{ mt: 5, mb: 2 }}>
        <ButtonRow
          cancelButtonProps = { order.emailConfirmation !== '' && { onClick: handleCancelButton, text: 'Cancel' }}
          saveButtonProps = {{ onClick: handleSaveButton, text: 'Save'  }}
        />
      </Box>
    </>
  );
}
