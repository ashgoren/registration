import { Box, Typography } from '@mui/material';
import { StyledPaper } from 'components/layouts/SharedStyles';
import { formatCurrency } from 'utils';

export const PaymentFormTotal = ({ admissionTotal, donationTotal, feesTotal, totalWithFees }) => {
  return (
    <StyledPaper>
      <Box p={2}>
        <Typography variant='h6'>Payment Summary</Typography>

        <Typography variant='body1'>Admissions Total: ${formatCurrency(admissionTotal)}</Typography>

        {donationTotal > 0 && <Typography variant='body1'>Donation: ${formatCurrency(donationTotal)}</Typography>}

        {feesTotal > 0 && <Typography variant='body1'>Covering Fees: ${formatCurrency(feesTotal)}</Typography>}

        <Typography variant='h6' sx={{ mt: 1 }}>Total Amount Due: ${formatCurrency(totalWithFees)}</Typography>
      </Box>
    </StyledPaper>
  )
};
