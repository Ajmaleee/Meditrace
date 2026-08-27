import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Breadcrumbs,
  Button,
  Link,
  Paper,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import MedicationOutlinedIcon from '@mui/icons-material/MedicationOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { downloadPrescriptionPdf } from '@/utils/pdf';
import { PatientHeader } from '@/components/patient/PatientHeader';
import { PatientQrCode } from '@/components/patient/PatientQrCode';
import { ClinicalSummaryPanel } from '@/components/patient/ClinicalSummaryPanel';
import { AllergyList } from '@/components/patient/AllergyList';
import { MedicationTimeline } from '@/components/patient/MedicationTimeline';
import { VisitList } from '@/components/patient/VisitList';
import { EmptyState } from '@/components/common/EmptyState';
import { SeverityChip } from '@/components/common/StatusChip';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/context/AuthContext';
import { getAllergies, getMedications, getPatient, getPrescriptions, getVisits } from '@/services/patients';
import { getAccessLogs, recordAccess, ACCESS_ACTION_LABEL } from '@/services/audit';
import type { AccessLog, Allergy, Medication, Patient, Prescription, Visit } from '@/types';
import { format } from 'date-fns';

const TABS = ['Overview', 'Medical History', 'Medications', 'Allergies', 'Visits', 'Prescriptions', 'Access History'] as const;

export function PatientProfilePage() {
  const { patientId = '' } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<(typeof TABS)[number]>('Overview');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      getPatient(patientId),
      getAllergies(patientId),
      getMedications(patientId),
      getVisits(patientId),
      getPrescriptions(patientId),
      getAccessLogs(patientId),
    ]).then(([p, a, m, v, rx, l]) => {
      if (!active) return;
      setPatient(p);
      setAllergies(a);
      setMedications(m);
      setVisits(v);
      setPrescriptions(rx);
      setLogs(l);
      setLoading(false);
    });

    if (user?.role === 'doctor' && user.doctorId && user.organizationId) {
      recordAccess({
        patientId,
        doctorId: user.doctorId,
        doctorName: user.name,
        organizationId: user.organizationId,
        action: 'viewed_record',
      });
    }
    return () => {
      active = false;
    };
  }, [patientId, user]);

  if (loading) {
    return (
      <Stack spacing={2.5}>
        <Skeleton variant="text" width={160} height={20} />
        <Skeleton variant="rounded" height={92} />
        <Skeleton variant="rounded" height={44} width={280} sx={{ alignSelf: 'flex-end' }} />
        <Skeleton variant="rounded" height={320} />
      </Stack>
    );
  }

  if (!patient) {
    return (
      <EmptyState
        icon={WarningAmberIcon}
        title="Patient not found"
        description={`No patient record was found for ID "${patientId}".`}
      />
    );
  }

  const activeMedications = medications.filter((m) => m.status === 'active');
  const lastVisit = visits[0];

  return (
    <Stack spacing={2.5}>
      <Breadcrumbs sx={{ fontSize: 13 }}>
        <Link component="button" underline="hover" color="inherit" onClick={() => navigate(ROUTES.patientSearch)}>
          Patients
        </Link>
        <Typography variant="body2" color="text.primary">
          {patient.name}
        </Typography>
      </Breadcrumbs>

      <PatientHeader patient={patient} />

      {user?.role === 'doctor' && (
        <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
          <PatientQrCode patientId={patient.patientId} patientName={patient.name} />
          <Button
            variant="contained"
            startIcon={<AddOutlinedIcon />}
            onClick={() => navigate(ROUTES.newConsultation(patient.patientId))}
          >
            New consultation
          </Button>
        </Stack>
      )}

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
          {tab === 'Overview' && (
            <Stack spacing={3}>
              <ClinicalSummaryPanel patient={patient} visits={visits} medications={medications} allergies={allergies} />

              <Box>
                <Typography variant="h5" sx={{ mb: 1.5 }}>
                  Known allergies
                </Typography>
                {allergies.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No allergies recorded.
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {allergies.map((a) => (
                      <Stack key={a.allergyId} direction="row" spacing={1.5} alignItems="center">
                        <WarningAmberIcon fontSize="small" sx={{ color: 'error.main' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {a.substance}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Reaction: {a.reaction}
                        </Typography>
                        <SeverityChip severity={a.severity} />
                      </Stack>
                    ))}
                  </Stack>
                )}
              </Box>

              <Box>
                <Typography variant="h5" sx={{ mb: 1.5 }}>
                  Current medications
                </Typography>
                {activeMedications.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No active medications.
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {activeMedications.map((m) => (
                      <Stack key={m.medicationId} direction="row" spacing={1.5} alignItems="center">
                        <MedicationOutlinedIcon fontSize="small" sx={{ color: 'primary.main' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {m.medicineName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {m.dosage} · {m.frequency}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                )}
              </Box>

              <Box>
                <Typography variant="h5" sx={{ mb: 1.5 }}>
                  Recent diagnosis
                </Typography>
                <Typography variant="body2" color={lastVisit ? 'text.primary' : 'text.secondary'}>
                  {lastVisit ? lastVisit.diagnosis : 'No diagnoses recorded yet.'}
                </Typography>
              </Box>

              <Box>
                <Typography variant="h5" sx={{ mb: 1.5 }}>
                  Last consultation
                </Typography>
                <Typography variant="body2" color={lastVisit ? 'text.primary' : 'text.secondary'}>
                  {lastVisit
                    ? `${format(new Date(lastVisit.date), 'd MMM yyyy')} · ${lastVisit.doctorName}`
                    : 'No consultations recorded yet.'}
                </Typography>
              </Box>
            </Stack>
          )}

          {tab === 'Medical History' && <VisitList visits={visits} />}
          {tab === 'Medications' && <MedicationTimeline medications={medications} />}
          {tab === 'Allergies' && <AllergyList allergies={allergies} />}
          {tab === 'Visits' && <VisitList visits={visits} />}

          {tab === 'Prescriptions' &&
            (prescriptions.length === 0 ? (
              <EmptyState
                icon={ReceiptLongOutlinedIcon}
                title="No prescriptions found"
                description="Prescriptions created during consultations will appear here."
              />
            ) : (
              <Stack spacing={1.5}>
                {prescriptions.map((rx) => (
                  <Paper key={rx.prescriptionId} variant="outlined" sx={{ p: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="subtitle2">{rx.doctorName}</Typography>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Typography variant="caption">{format(new Date(rx.createdAt), 'd MMM yyyy')}</Typography>
                        <Button
                          size="small"
                          startIcon={<FileDownloadOutlinedIcon fontSize="small" />}
                          onClick={() => downloadPrescriptionPdf(patient, rx)}
                        >
                          PDF
                        </Button>
                      </Stack>
                    </Stack>
                    <Stack spacing={0.75}>
                      {rx.items.map((item, idx) => (
                        <Stack key={idx} direction="row" justifyContent="space-between">
                          <Typography variant="body2">{item.medicineName}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {item.dosage} · {item.frequency} · {item.durationDays}d
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            ))}

          {tab === 'Access History' &&
            (logs.length === 0 ? (
              <EmptyState
                icon={HistoryOutlinedIcon}
                title="No access history"
                description="A record of who has viewed or updated this patient's information will appear here."
              />
            ) : (
              <Stack spacing={1}>
                {logs.map((log) => (
                  <Stack key={log.logId} direction="row" justifyContent="space-between" sx={{ py: 0.75, borderBottom: '1px solid', borderColor: 'divider' }}>
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
