import { Chip } from '@mui/material';
import type { MedicationStatus, AllergySeverity, WarningSeverity } from '@/types';

const MEDICATION_STYLES: Record<MedicationStatus, { label: string; bg: string; color: string }> = {
  active: { label: 'Active', bg: '#E6F2EB', color: '#276B47' },
  completed: { label: 'Completed', bg: '#EEF0F2', color: '#5B6470' },
  discontinued: { label: 'Discontinued', bg: '#FCEBEA', color: '#B3261E' },
};

const SEVERITY_STYLES: Record<AllergySeverity, { label: string; bg: string; color: string }> = {
  mild: { label: 'Mild', bg: '#DCEBF1', color: '#0F5C7A' },
  moderate: { label: 'Moderate', bg: '#FCF3DE', color: '#8A5A00' },
  severe: { label: 'Severe', bg: '#FCEBEA', color: '#B3261E' },
};

const WARNING_STYLES: Record<WarningSeverity, { label: string; bg: string; color: string }> = {
  critical: { label: 'Critical', bg: '#FCEBEA', color: '#B3261E' },
  caution: { label: 'Caution', bg: '#FCF3DE', color: '#8A5A00' },
  info: { label: 'Informational', bg: '#DCEBF1', color: '#0F5C7A' },
};

export function MedicationStatusChip({ status }: { status: MedicationStatus }) {
  const s = MEDICATION_STYLES[status];
  return <Chip label={s.label} size="small" sx={{ bgcolor: s.bg, color: s.color }} />;
}

export function SeverityChip({ severity }: { severity: AllergySeverity }) {
  const s = SEVERITY_STYLES[severity];
  return <Chip label={s.label} size="small" sx={{ bgcolor: s.bg, color: s.color }} />;
}

export function WarningSeverityChip({ severity }: { severity: WarningSeverity }) {
  const s = WARNING_STYLES[severity];
  return <Chip label={s.label} size="small" sx={{ bgcolor: s.bg, color: s.color, fontWeight: 700 }} />;
}
