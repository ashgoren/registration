import ContactInfo from '../ContactInfo';
import MiscInfo from '../MiscInfo';
import ButtonRow from 'components/ButtonRow';

export default function Person({ index, setEditIndex, saveForm, setAdmissionQuantity, order, resetForm }) {

  function handleCancelButton() {
    setEditIndex(null);
    setAdmissionQuantity(order.admissionQuantity)
    resetForm();
  }

  async function handleSaveButton() {
    const success = await saveForm();
    if (success) {
      setEditIndex(null);
    }
  }

  return (
    <>
      <ContactInfo index={index} />
      <MiscInfo index={index} />
      <ButtonRow
        cancelButtonProps = { order.emailConfirmation !== '' && { onClick: handleCancelButton, text: 'Cancel' }}
        saveButtonProps = {{ onClick: handleSaveButton, text: 'Save'  }}
      />
    </>
  );
}
