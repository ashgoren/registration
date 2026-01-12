import { useState, useCallback, useEffect } from 'react';
import { useFormikContext } from 'formik';
import { Box } from '@mui/material';
import { Title } from 'components/layouts/SharedStyles';
import { useScrollToTop } from 'hooks/useScrollToTop';
import { Field } from 'components/inputs';
import { logDebug } from 'src/logger';
import { config } from 'config';
import type { ChangeEvent, } from 'react';
import type { Order } from 'types/order';
import type { CustomFieldProps } from 'components/inputs/Field';

export const MiscInfo = ({ index }: { index: number }) => {
  // logDebug('MiscInfo rendered');

  const { values, setFieldValue, setFieldTouched } = useFormikContext<Order>();

  const [showPhotoCommentsField, setShowPhotoCommentsField] = useState(values.people?.[index]?.photo === 'Other');
  const [showMiscCommentsField, setShowMiscCommentsField] = useState((values.people?.[index]?.misc as string[])?.includes('minor'));

  useEffect(() => {
    setShowPhotoCommentsField(values.people?.[index]?.photo === 'Other');
    setShowMiscCommentsField((values.people?.[index]?.misc as string[])?.includes('minor'));
  }, [values.people, index]);

  const fields: string[] = index === 0
    ? config.fields.miscFields
    : config.fields.miscFields.filter((field: string) => field !== 'agreement');

  const firstPersonAgeOptions = fields.includes('age')
    ? config.fields.fieldsConfig.age.options?.filter(option => option.value === 'adult' || option.value === '13-17')
    : null;
  
  useScrollToTop();

  const updateShareCheckboxOptions = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name: field, value, checked } = e.target;
    const { share } = values.people[index];
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
  }, [index, values.people]);

  const updateAgreementField = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    await setFieldValue(name, checked ? ['yes'] : []);
    setFieldTouched(name, true);
  }, [setFieldValue, setFieldTouched]);

  const getOnChangeHandler = (field: string) => {
    if (field === 'share') return updateShareCheckboxOptions;
    if (field === 'agreement') return updateAgreementField;
    return undefined; // use default onChange handler for that input field
  };

  return (
    <Box className='MiscInfo' sx={{ mt: 4 }}>
      {fields
        .map(field => {
          const { validation: _, conditionalValidation: __, ...domProps } = config.fields.fieldsConfig[field];
          return { field, ...domProps };
        })
        .map((input) => {
          const { field, type, title, label, options, ...props } = input;
          if (field === 'photoComments' && !showPhotoCommentsField) return null;
          if (field === 'miscComments' && !showMiscCommentsField) return null;
          const updatedOptions = (field === 'age' && index === 0) ? firstPersonAgeOptions : options;
          const fieldProps = {
            type,
            label,
            name: `people[${index}].${field}`,
            options: type === 'checkbox' || type === 'radio' ? updatedOptions : undefined,
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
