import { useFormikContext } from 'formik';
import { Paper, Typography, Table, TableContainer, TableBody, TableRow, TableCell } from '@mui/material';
import { Paragraph } from 'components/layouts/SharedStyles';
import { SelectInput } from 'components/inputs';
import { getCategoryLabel, getOptions } from 'config/configTieredPricing';
import type { SelectChangeEvent } from '@mui/material';
import type { Person } from 'types/order';

export const PaymentFormOptions = ({ people }: { people: Person[] }) => {
  const { setFieldValue, handleChange } = useFormikContext();
  
  function updateAdmissionValue(event: SelectChangeEvent<unknown>) {
    const { name, value } = event.target;
    setFieldValue(name, value);
    handleChange(event); // bubble up to formik
  }

  const validPeople = people as Array<Person & { age: string }>;

  return (
    <>
      <Paragraph>Please read the tiered plan explanation above and select {validPeople.length > 1 ? 'options' : 'an option'} below:</Paragraph>

      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Table>
          <TableBody>
            {validPeople.map((person, index) => (
              <TableRow key={index}>

                <TableCell>
                  <Typography variant='body1'>{person.first} {person.last}</Typography>
                  <Typography variant='body2' sx={{ fontStyle: 'italic' }}>
                    {getCategoryLabel(person)}
                  </Typography>
                </TableCell>

                <TableCell align='right'>
                  {getOptions(person).length === 1 ? (
                    <Typography variant='body1' sx={{ fontStyle: 'italic' }}>
                      {getOptions(person)[0].label}
                    </Typography>
                  ) : (
                    <SelectInput
                      name={`people[${index}].admission`}
                      options={getOptions(person)}
                      onChange={updateAdmissionValue}
                      sx={{ width: '12em' }}
                    />
                  )}
                </TableCell>

              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};
