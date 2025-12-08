import { useState, useCallback } from 'react';
import { Box } from '@mui/material';
import { Title } from 'components/layouts/SharedStyles';
import { useScrollToTop } from 'hooks/useScrollToTop';
import { Field } from 'components/inputs';
import { logDebug } from 'src/logger';
import { config } from 'config';
import type { RefObject, ChangeEvent, } from 'react';
import type { FormikProps } from 'formik';
import type { Order } from 'types/order';
import type { CustomFieldProps } from 'components/inputs/Field';

const { FIELD_CONFIG, PERSON_MISC_FIELDS } = config;

export const MiscInfo = ({ index, formikRef }: { index: number; formikRef: RefObject<FormikProps<Order> | null> }) => {
  logDebug('MiscInfo rendered');
  
  const [showPhotoCommentsField, setShowPhotoCommentsField] = useState(formikRef?.current?.values?.people?.[index]?.photo === 'Other');
  const [showMiscCommentsField, setShowMiscCommentsField] = useState((formikRef?.current?.values?.people?.[index]?.misc as string[])?.includes('minor'));

  const fields = index === 0 ? PERSON_MISC_FIELDS : PERSON_MISC_FIELDS.filter(f => f !== 'agreement');
  
  useScrollToTop();

  const updatePhotoCommentsField = useCallback((e: ChangeEvent<HTMLInputElement>) => {
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

  const updateMiscCommentsField = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (!formikRef.current) return;
    const { name, value, checked } = e.target;
    logDebug('updateMiscCommentsField', name, value, checked);
    const { setFieldValue, setFieldError, handleChange, values } = formikRef.current;
    const currentMisc = values.people[index].misc as string[];
    let newMisc;
    if (checked) {
      newMisc = [...currentMisc, value];
    } else {
      newMisc = currentMisc.filter(option => option !== value);
    }
    if (newMisc.includes('minor')) {
      setShowMiscCommentsField(true);
    } else {
      setShowMiscCommentsField(false);
      setFieldValue(`people[${index}].miscComments`, '');
    }
    handleChange(e); // update formik values
    setFieldError(name, '');
  }, [formikRef, index]);

  const updateShareCheckboxOptions = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (!formikRef.current) return;
    const { name: field, value, checked } = e.target;
    const { setFieldValue } = formikRef.current;
    const { share } = formikRef.current.values.people[index];
    if (!Array.isArray(share)) {
      throw new Error(`Expected share to be an array, got: ${share}`);
    }
    logDebug('Updating share field:', field, value, checked, share);
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

  const updateAgreementField = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    if (!formikRef.current) return;
    const { name, checked } = e.target;
    const { setFieldValue, setFieldTouched } = formikRef.current;
    await setFieldValue(name, checked ? ['yes'] : []);
    setFieldTouched(name, true);
  }, [formikRef]);

  const getOnChangeHandler = (field: string) => {
    if (field === 'share') return updateShareCheckboxOptions;
    if (field === 'photo') return updatePhotoCommentsField;
    if (field === 'misc') return updateMiscCommentsField;
    if (field === 'agreement') return updateAgreementField;
    return undefined; // use default onChange handler for that input field
  };

  return (
    <Box className='MiscInfo' sx={{ mt: 4 }}>
      {fields
        .map(field => {
          const { validation: _, conditionalValidation: __, ...domProps } = FIELD_CONFIG[field];
          return { field, ...domProps };
        })
        .map((input) => {
          const { field, type, title, label, options, ...props } = input;
          if (field === 'photoComments' && !showPhotoCommentsField) return null;
          if (field === 'miscComments' && !showMiscCommentsField) return null;
          const fieldProps = {
            type,
            label,
            name: `people[${index}].${field}`,
            options: type === 'checkbox' || type === 'radio' ? options : undefined,
            onChange: getOnChangeHandler(field),
          ...props
          } as CustomFieldProps;
          return (
            <Box sx={{ mb: 6 }} key={field}>
              <Title>{title}</Title>
              <Field {...fieldProps} />
            </Box>
          );
        })
      }
    </Box>
  );
};
