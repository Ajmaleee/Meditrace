import { Box, Paper, Stack, Typography } from '@mui/material';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import { format } from 'date-fns';
import { EmptyState } from '@/components/common/EmptyState';
import type { Visit } from '@/types';

export function VisitList({ visits }: { visits: Visit[] }) {
  if (visits.length === 0) {
    return (
      <EmptyState
        icon={EventNoteOutlinedIcon}
        title="No previous visits"
        description="No consultations have been recorded for this patient yet."
      />
    );
  }

  return (
    <Stack spacing={1.5}>
      {visits.map((visit) => (
        <Paper key={visit.visitId} variant="outlined" sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
            <Box>
              <Typography variant="subtitle1">{visit.diagnosis}</Typography>
              <Typography variant="body2" color="text.secondary">
                {visit.doctorName} · {visit.organizationName}
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ whiteSpace: 'nowrap' }}>
              {format(new Date(visit.date), 'd MMM yyyy')}
            </Typography>
          </Stack>
          <Typography variant="body2" sx={{ mt: 1 }}>
            <strong>Symptoms:</strong> {visit.symptoms}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            {visit.notes}
          </Typography>
        </Paper>
      ))}
    </Stack>
  );
}
