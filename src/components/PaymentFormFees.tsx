import { Checkbox, FormControlLabel } from '@mui/material';
import { StyledPaper } from 'components/layouts/SharedStyles';

export const PaymentFormFees = ({ fees, coverFees, setCoverFees }:
  { fees: number; coverFees: boolean; setCoverFees: (value: boolean) => void }
) => {
  return (
    <StyledPaper>
      <FormControlLabel
        control={<Checkbox checked={coverFees} onChange={(e) => setCoverFees(e.target.checked)} />}
        label={`I would like to add ${fees} to cover the transaction fees.`}
      />
    </StyledPaper>
  )
};
