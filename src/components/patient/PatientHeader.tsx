import { Avatar, Box, Paper, Stack, Typography } from '@mui/material';
import { differenceInYears } from 'date-fns';
import type { Patient } from '@/types';

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('');
}

export function PatientHeader({ patient }: { patient: Patient }) {
  const age = differenceInYears(new Date(), new Date(patient.dateOfBirth));

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 } }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
        <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main', fontSize: 20 }}>
          {initials(patient.name)}
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" sx={{ mb: 0.25 }}>
            {patient.name}
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" rowGap={0.5}>
            <Typography variant="body2" color="text.secondary">
              Patient ID: <strong>{patient.patientId}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {age} yrs · {patient.gender}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Blood group: <strong>{patient.bloodGroup}</strong>
            </Typography>
          </Stack>
        </Box>
        <Stack spacing={0.25} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
          <Typography variant="body2" color="text.secondary">
            {patient.phone}
          </Typography>
          {patient.email && (
            <Typography variant="body2" color="text.secondary">
              {patient.email}
            </Typography>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}
