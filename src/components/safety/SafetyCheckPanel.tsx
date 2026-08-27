import { Alert, Box, Checkbox, FormControlLabel, Paper, Stack, Typography } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import { WarningSeverityChip } from '@/components/common/StatusChip';
import type { SafetyWarning } from '@/types';

interface SafetyCheckPanelProps {
  warnings: SafetyWarning[];
  acknowledged: boolean;
  onAcknowledgeChange: (checked: boolean) => void;
}

export function SafetyCheckPanel({ warnings, acknowledged, onAcknowledgeChange }: SafetyCheckPanelProps) {
  const hasWarnings = warnings.length > 0;

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Safety review</Typography>

      {!hasWarnings && (
        <Alert icon={<CheckCircleOutlineIcon fontSize="small" />} severity="success">
          No allergy conflict or known interaction detected against this patient's recorded allergies and active
          medications.
        </Alert>
      )}

      {hasWarnings && (
        <Stack spacing={1.5}>
          {warnings.map((warning) => (
            <Paper
              key={warning.id}
              variant="outlined"
              sx={{
                p: 2,
                borderColor: warning.severity === 'critical' ? 'error.main' : 'divider',
                borderLeftWidth: 4,
                borderLeftColor: warning.severity === 'critical' ? 'error.main' : 'warning.main',
              }}
            >
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <ReportProblemOutlinedIcon
                  fontSize="small"
                  sx={{ color: warning.severity === 'critical' ? 'error.main' : 'warning.main', mt: 0.25 }}
                />
                <Box sx={{ flexGrow: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                    <Typography variant="subtitle1">{warning.title}</Typography>
                    <WarningSeverityChip severity={warning.severity} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
                    {warning.description}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {warning.recommendation}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      <Alert severity="info" variant="outlined" sx={{ '& .MuiAlert-message': { width: '100%' } }}>
        <Typography variant="body2" sx={{ mb: hasWarnings ? 1 : 0 }}>
          This safety check is decision support only. It does not diagnose, prescribe, or alter treatment
          automatically — the prescribing clinician remains responsible for the final decision.
        </Typography>
        {hasWarnings && (
          <FormControlLabel
            control={
              <Checkbox
                checked={acknowledged}
                onChange={(e) => onAcknowledgeChange(e.target.checked)}
                size="small"
              />
            }
            label={
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                I have reviewed the warning(s) above and confirm this prescription is clinically appropriate.
              </Typography>
            }
          />
        )}
      </Alert>
    </Stack>
  );
}
