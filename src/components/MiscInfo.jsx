import { useState, useCallback } from 'react';
import { Box } from '@mui/material';
import { Title } from 'components/layouts/SharedStyles';
import { useScrollToTop } from 'hooks/useScrollToTop';
import { Field } from 'components/inputs';
import { logDebug } from 'src/logger';
import { config } from 'config';
const { FIELD_CONFIG, PERSON_MISC_FIELDS } = config;

export const MiscInfo = ({ index, formikRef }) => {
  logDebug('MiscInfo rendered');
  
  const [showPhotoCommentsField, setShowPhotoCommentsField] = useState(formikRef?.current?.values?.people?.[index]?.photo === 'Other');
  const fields = index === 0 ? PERSON_MISC_FIELDS : PERSON_MISC_FIELDS.filter(f => f !== 'agreement');
  
  useScrollToTop();

  const updatePhotoCommentsField = useCallback((e) => {
    if (!formikRef.current) return;
    const { name, value } = e.target;
    const { setFieldValue, setFieldError, handleChange } = formikRef.current;
    if (value === 'Other') {
      setShowPhotoCommentsField(true);
    } else {
      setShowPhotoCommentsField(false);
      setFieldValue(`people[${index}].photoComments`, '');
    }
    handleChange(e); // update formik values
    setFieldError(name, '');
  }, [formikRef, index]);

  const updateShareCheckboxOptions = useCallback((e) => {
    if (!formikRef.current) return;
    const { name: field, value, checked } = e.target;
    const { setFieldValue } = formikRef.current;
    const { share } = formikRef.current.values.people[index];
    if (value === 'name') {
      // if 'name' gets unchecked, uncheck all options
      setFieldValue(field, checked ? ['name'] : []);
    } else {
      // if any other option gets checked, check 'name' as well
      setFieldValue(field, checked ?
        [...new Set(['name', ...share, value])] :
        share.filter(option => option !== value)
      );
    }
  }, [formikRef, index]);

  const updateAgreementField = useCallback(async (e) => {
    if (!formikRef.current) return;
    const { name, checked } = e.target;
    const { setFieldValue, setFieldTouched } = formikRef.current;
    await setFieldValue(name, checked ? ['yes'] : []);
    setFieldTouched(name, true);
  }, [formikRef]);

  const getOnChangeHandler = (field) => {
    if (field === 'share') return updateShareCheckboxOptions;
    if (field === 'photo') return updatePhotoCommentsField;
    if (field === 'agreement') return updateAgreementField;
    return undefined; // use default onChange handler for that input field
  };

  return (
    <Box className='MiscInfo' sx={{ mt: 4 }}>
      {fields
        .map(field => {
          const { validation, conditionalValidation, ...domProps } = FIELD_CONFIG[field];
          return { field, ...domProps };
        })
        .map((input) => {
          const { field, type, title, label, options, hidden, ...props } = input;
          if (field === 'photoComments' && !showPhotoCommentsField) return null;
          return (
            <Box sx={{ mb: 6 }} key={field}>
              <Title>{title}</Title>
              <Field
                type={type}
                label={label}
                name={`people[${index}].${field}`}
                field={field}
                index={index}
                options={type === 'checkbox' || type === 'radio' ? options : undefined}
                onChange={getOnChangeHandler(field)}
                {...props}
              />
            </Box>
          );
        })
      }
    </Box>
  );
};
