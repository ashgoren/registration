import { useFormikContext } from 'formik';
import { Checkbox, FormControlLabel } from '@mui/material';
import { StyledPaper } from 'components/layouts/SharedStyles';
import { formatCurrency } from 'utils/misc';
import type { Order } from 'types/order';

export const PaymentFormFees = ({ fees, coverFees, setCoverFees }:
  { fees: number; coverFees: boolean; setCoverFees: (value: boolean) => void }
) => {
  const { setFieldValue, handleBlur } = useFormikContext<Order>();

  const updateFeesValue = (event: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = event.target.checked;
    setCoverFees(isChecked);
    setFieldValue('fees', isChecked ? fees : 0);
    handleBlur(event); // bubble up to formik
  };

  return (
    <StyledPaper>
      <FormControlLabel
        control={<Checkbox checked={coverFees} onChange={updateFeesValue} />}
        label={`I would like to add ${formatCurrency(fees)} to cover the transaction fees.`}
      />
    </StyledPaper>
  )
};
