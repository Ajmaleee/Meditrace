import { useState } from 'react';
import { Alert, Box, Button, List, ListItem, ListItemIcon, ListItemText, Paper, Skeleton, Stack, Typography } from '@mui/material';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { generateClinicalSummaryLocal } from '@/services/summary';
import type { Allergy, Medication, Patient, Visit } from '@/types';

interface ClinicalSummaryPanelProps {
  patient: Patient;
  visits: Visit[];
  medications: Medication[];
  allergies: Allergy[];
}

/**
 * Generates and displays a short clinical summary on demand. The summary is
 * always shown behind an explicit "AI-generated" disclaimer and is never
 * editable or saved back into the patient's record — it is a reading aid
 * over the existing, authoritative data.
 */
export function ClinicalSummaryPanel({ patient, visits, medications, allergies }: ClinicalSummaryPanelProps) {
  const [summary, setSummary] = useState<{ visitCount: number; bullets: string[] } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = () => {
    setLoading(true);
    // Simulated latency to reflect where a real LLM call would happen
    // (see services/summary.ts for the production Cloud Function path).
    setTimeout(() => {
      setSummary(generateClinicalSummaryLocal({ patient, visits, medications, allergies }));
      setLoading(false);
    }, 500);
  };

  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: summary || loading ? 2 : 0 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <AutoAwesomeOutlinedIcon fontSize="small" sx={{ color: 'secondary.main' }} />
          <Typography variant="subtitle1">Clinical summary</Typography>
        </Stack>
        {!summary && !loading && (
          <Button size="small" variant="outlined" onClick={handleGenerate}>
            Generate summary
          </Button>
        )}
      </Stack>

      {loading && (
        <Stack spacing={1}>
          <Skeleton variant="text" width="80%" />
          <Skeleton variant="text" width="65%" />
          <Skeleton variant="text" width="70%" />
        </Stack>
      )}

      {summary && !loading && (
        <Stack spacing={1.5}>
          <Alert severity="info" variant="outlined" icon={<AutoAwesomeOutlinedIcon fontSize="small" />}>
            <Typography variant="body2">
              AI-generated summary — verify against the original records. This does not modify the patient's
              record in any way.
            </Typography>
          </Alert>
          <Typography variant="body2" color="text.secondary">
            The patient has {summary.visitCount} recorded visit{summary.visitCount === 1 ? '' : 's'}.
          </Typography>
          <List dense disablePadding>
            {summary.bullets.map((bullet, idx) => (
              <ListItem key={idx} disableGutters sx={{ py: 0.25 }}>
                <ListItemIcon sx={{ minWidth: 20 }}>
                  <FiberManualRecordIcon sx={{ fontSize: 6, color: 'text.secondary' }} />
                </ListItemIcon>
                <ListItemText primaryTypographyProps={{ variant: 'body2' }} primary={bullet} />
              </ListItem>
            ))}
          </List>
          <Box>
            <Button size="small" onClick={handleGenerate}>
              Regenerate
            </Button>
          </Box>
        </Stack>
      )}
    </Paper>
  );
}
