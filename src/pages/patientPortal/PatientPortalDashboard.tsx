import { useEffect, useState } from 'react';
import { Box, CircularProgress, Paper, Stack, Tab, Tabs, Typography } from '@mui/material';
import { PatientHeader } from '@/components/patient/PatientHeader';
import { AllergyList } from '@/components/patient/AllergyList';
import { MedicationTimeline } from '@/components/patient/MedicationTimeline';
import { VisitList } from '@/components/patient/VisitList';
import { EmptyState } from '@/components/common/EmptyState';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import { useAuth } from '@/context/AuthContext';
import { getAllergies, getMedications, getPatient, getVisits } from '@/services/patients';
import { getAccessLogs, ACCESS_ACTION_LABEL } from '@/services/audit';
import type { AccessLog, Allergy, Medication, Patient, Visit } from '@/types';
import { format } from 'date-fns';

const TABS = ['Medical History', 'Medications', 'Allergies', 'Who accessed my record'] as const;

export function PatientPortalDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState<(typeof TABS)[number]>('Medical History');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.patientId) return;
    Promise.all([
      getPatient(user.patientId),
      getAllergies(user.patientId),
      getMedications(user.patientId),
      getVisits(user.patientId),
      getAccessLogs(user.patientId),
    ]).then(([p, a, m, v, l]) => {
      setPatient(p);
      setAllergies(a);
      setMedications(m);
      setVisits(v);
      setLogs(l);
      setLoading(false);
    });
  }, [user?.patientId]);

  if (loading) {
    return (
      <Stack alignItems="center" sx={{ py: 8 }}>
        <CircularProgress size={24} />
      </Stack>
    );
  }

  if (!patient) {
    return <Typography>Your record could not be loaded.</Typography>;
  }

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="h2" sx={{ mb: 0.5 }}>
          My record
        </Typography>
        <Typography variant="body2" color="text.secondary">
          This is the information healthcare professionals see when they access your record.
        </Typography>
      </Box>

      <PatientHeader patient={patient} />

      <Paper variant="outlined">
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 1 }}
        >
          {TABS.map((t) => (
            <Tab key={t} value={t} label={t} />
          ))}
        </Tabs>
        <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
          {tab === 'Medical History' && <VisitList visits={visits} />}
          {tab === 'Medications' && <MedicationTimeline medications={medications} />}
          {tab === 'Allergies' && <AllergyList allergies={allergies} />}
          {tab === 'Who accessed my record' &&
            (logs.length === 0 ? (
              <EmptyState
                icon={HistoryOutlinedIcon}
                title="No access history"
                description="A record of which doctors have viewed or updated your information will appear here."
              />
            ) : (
              <Stack spacing={1}>
                {logs.map((log) => (
                  <Stack
                    key={log.logId}
                    direction="row"
                    justifyContent="space-between"
                    sx={{ py: 0.75, borderBottom: '1px solid', borderColor: 'divider' }}
                  >
                    <Typography variant="body2">
                      {log.doctorName} {ACCESS_ACTION_LABEL[log.action]}
                    </Typography>
                    <Typography variant="caption">{format(new Date(log.timestamp), 'd MMM yyyy, h:mm a')}</Typography>
                  </Stack>
                ))}
              </Stack>
            ))}
        </Box>
      </Paper>
    </Stack>
  );
}
