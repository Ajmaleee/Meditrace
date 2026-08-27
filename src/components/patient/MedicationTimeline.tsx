import { Box, Paper, Stack, Typography } from '@mui/material';
import MedicationOutlinedIcon from '@mui/icons-material/MedicationOutlined';
import { format } from 'date-fns';
import { EmptyState } from '@/components/common/EmptyState';
import { MedicationStatusChip } from '@/components/common/StatusChip';
import type { Medication } from '@/types';

export function MedicationTimeline({ medications }: { medications: Medication[] }) {
  if (medications.length === 0) {
    return (
      <EmptyState
        icon={MedicationOutlinedIcon}
        title="No medication history found"
        description="No previous medications have been recorded for this patient."
      />
    );
  }

  const byYear = medications.reduce<Record<string, Medication[]>>((acc, med) => {
    const year = med.startDate.slice(0, 4);
    acc[year] = acc[year] ?? [];
    acc[year].push(med);
    return acc;
  }, {});

  const years = Object.keys(byYear).sort((a, b) => Number(b) - Number(a));

  return (
    <Stack spacing={3}>
      {years.map((year) => (
        <Box key={year}>
          <Typography variant="overline" color="text.secondary">
            {year}
          </Typography>
          <Stack sx={{ mt: 1 }}>
            {byYear[year].map((med, idx) => (
              <Box key={med.medicationId} sx={{ display: 'flex', gap: 2 }}>
                <Stack alignItems="center" sx={{ width: 16, flexShrink: 0 }}>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: med.status === 'active' ? 'success.main' : 'divider',
                      border: '2px solid',
                      borderColor: med.status === 'active' ? 'success.main' : 'text.disabled',
                      mt: 0.75,
                    }}
                  />
                  {idx < byYear[year].length - 1 && (
                    <Box sx={{ width: '1px', flexGrow: 1, bgcolor: 'divider', minHeight: 32 }} />
                  )}
                </Stack>
                <Paper variant="outlined" sx={{ p: 1.5, mb: 1.5, flexGrow: 1 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ color: 'text.primary', fontWeight: 600 }}>
                        {med.medicineName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {med.dosage} · {med.frequency} · {med.route}
                      </Typography>
                      <Typography variant="caption">
                        {format(new Date(med.startDate), 'd MMM yyyy')}
                        {med.endDate ? ` – ${format(new Date(med.endDate), 'd MMM yyyy')}` : ''} · Prescribed by{' '}
                        {med.prescribedByName}
                      </Typography>
                      {med.notes && (
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          {med.notes}
                        </Typography>
                      )}
                    </Box>
                    <MedicationStatusChip status={med.status} />
                  </Stack>
                </Paper>
              </Box>
            ))}
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}
