import { useState, useCallback } from 'react';
import { Field } from 'components/inputs';
import { Title } from 'components/Layout/SharedStyles';
import { Box } from '@mui/material';
import { useScrollToTop } from 'hooks/useScrollToTop';
import { config } from 'config';
const { FIELD_CONFIG, PERSON_MISC_FIELDS } = config;

export const MiscInfo = ({ index, formikRef }) => {
  console.log('MiscInfo rendered');
  
  const [showPhotoCommentsField, setShowPhotoCommentsField] = useState(false);
  
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

  const getOnChangeHandler = (field) => {
    if (field === 'share') return updateShareCheckboxOptions;
    if (field === 'photo') return updatePhotoCommentsField;
    return undefined; // use default onChange handler for that input field
  };

  return (
    <Box className='MiscInfo' sx={{ mt: 4 }}>
      {PERSON_MISC_FIELDS
        .map(field => ({ field, ...FIELD_CONFIG[field] }))
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
