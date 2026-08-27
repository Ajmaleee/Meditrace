import { List, ListItem, Paper, Stack, Typography } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { SeverityChip } from '@/components/common/StatusChip';
import { EmptyState } from '@/components/common/EmptyState';
import type { Allergy } from '@/types';

export function AllergyList({ allergies }: { allergies: Allergy[] }) {
  if (allergies.length === 0) {
    return (
      <EmptyState
        icon={WarningAmberIcon}
        title="No allergies recorded"
        description="No allergies have been documented for this patient. Confirm with the patient during consultation."
      />
    );
  }

  return (
    <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {allergies.map((allergy) => (
        <ListItem key={allergy.allergyId} disablePadding disableGutters>
          <Paper
            variant="outlined"
            sx={{ p: 2, width: '100%', borderLeftWidth: 4, borderLeftColor: 'error.main' }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center">
                <WarningAmberIcon fontSize="small" sx={{ color: 'error.main' }} />
                <Typography variant="subtitle1">{allergy.substance}</Typography>
              </Stack>
              <SeverityChip severity={allergy.severity} />
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, ml: 3.5 }}>
              Reaction: {allergy.reaction}
            </Typography>
            {allergy.notes && (
              <Typography variant="body2" color="text.secondary" sx={{ ml: 3.5 }}>
                {allergy.notes}
              </Typography>
            )}
            <Typography variant="caption" sx={{ ml: 3.5, display: 'block', mt: 0.5 }}>
              Recorded by {allergy.recordedBy}
            </Typography>
          </Paper>
        </ListItem>
      ))}
    </List>
  );
}
