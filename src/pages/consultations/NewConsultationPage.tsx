import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Breadcrumbs,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Link,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { PatientHeader } from '@/components/patient/PatientHeader';
import { SafetyCheckPanel } from '@/components/safety/SafetyCheckPanel';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/context/AuthContext';
import { getAllergies, getMedications, getPatient, saveConsultation } from '@/services/patients';
import { runSafetyCheck } from '@/services/safety';
import { recordAccess } from '@/services/audit';
import { organizations } from '@/services/mockData';
import { downloadPrescriptionPdf } from '@/utils/pdf';
import { useNotifications } from '@/context/NotificationContext';
import type { Allergy, Medication, Patient, Prescription, PrescriptionItem, SafetyWarning } from '@/types';

const STEPS = ['Symptoms', 'Diagnosis', 'Prescription', 'Safety Check', 'Review'];

const emptyItem = (): PrescriptionItem => ({
  medicineName: '',
  genericName: '',
  dosage: '',
  frequency: '',
  route: 'Oral',
  durationDays: 7,
  instructions: '',
});

export function NewConsultationPage() {
  const { patientId = '' } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width:600px)');
  const { notifyError } = useNotifications();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeStep, setActiveStep] = useState(0);
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<PrescriptionItem[]>([emptyItem()]);
  const [warnings, setWarnings] = useState<SafetyWarning[]>([]);
  const [acknowledged, setAcknowledged] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedPrescription, setSavedPrescription] = useState<Prescription | null>(null);

  useEffect(() => {
    Promise.all([getPatient(patientId), getAllergies(patientId), getMedications(patientId)]).then(
      ([p, a, m]) => {
        setPatient(p);
        setAllergies(a);
        setMedications(m);
        setLoading(false);
      }
    );
  }, [patientId]);

  if (loading) {
    return (
      <Stack alignItems="center" sx={{ py: 8 }}>
        <CircularProgress size={24} />
      </Stack>
    );
  }

  if (!patient) {
    return <Typography>Patient not found.</Typography>;
  }

  const organization = organizations.find((o) => o.organizationId === user?.organizationId);

  const updateItem = (index: number, field: keyof PrescriptionItem, value: string | number) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const canAdvance = () => {
    if (activeStep === 0) return symptoms.trim().length > 0;
    if (activeStep === 1) return diagnosis.trim().length > 0;
    if (activeStep === 2) return items.every((i) => i.medicineName.trim() && i.dosage.trim() && i.frequency.trim());
    if (activeStep === 3) return warnings.length === 0 || acknowledged;
    return true;
  };

  const goNext = () => {
    if (activeStep === 2) {
      const proposed = items.map((i) => i.medicineName);
      setWarnings(runSafetyCheck({ proposedMedicines: proposed, activeMedications: medications, allergies }));
      setAcknowledged(false);
    }
    setActiveStep((s) => s + 1);
  };

  const handleSave = async () => {
    if (!user?.doctorId || !user.organizationId) return;
    setSaving(true);
    try {
      const { prescription } = await saveConsultation({
        patientId,
        doctorId: user.doctorId,
        doctorName: user.name,
        organizationId: user.organizationId,
        organizationName: organization?.name ?? '',
        symptoms,
        diagnosis,
        notes,
        prescriptionItems: items,
        acknowledgedWarnings: acknowledged || warnings.length === 0,
      });
      await recordAccess({
        patientId,
        doctorId: user.doctorId,
        doctorName: user.name,
        organizationId: user.organizationId,
        action: 'added_prescription',
      });
      setSavedPrescription(prescription);
      setSaved(true);
    } catch (err) {
      notifyError(err, 'Unable to save this consultation. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <Stack spacing={2} alignItems="center" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h4">Consultation saved</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
          The visit, prescription, and updated medication history have been recorded for {patient.name}. An access
          log entry has been created.
        </Typography>
        <Stack direction="row" spacing={1.5}>
          {savedPrescription && (
            <Button variant="outlined" onClick={() => downloadPrescriptionPdf(patient, savedPrescription)}>
              Download prescription PDF
            </Button>
          )}
          <Button variant="contained" onClick={() => navigate(ROUTES.patientProfile(patientId))}>
            Return to patient record
          </Button>
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack spacing={2.5}>
      <Breadcrumbs sx={{ fontSize: 13 }}>
        <Link component="button" underline="hover" color="inherit" onClick={() => navigate(ROUTES.patientSearch)}>
          Patients
        </Link>
        <Link
          component="button"
          underline="hover"
          color="inherit"
          onClick={() => navigate(ROUTES.patientProfile(patientId))}
        >
          {patient.name}
        </Link>
        <Typography variant="body2" color="text.primary">
          New consultation
        </Typography>
      </Breadcrumbs>

      <PatientHeader patient={patient} />

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
        <Stepper activeStep={activeStep} alternativeLabel={!isMobile} orientation={isMobile ? 'vertical' : 'horizontal'} sx={{ mb: 4 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === 0 && (
          <Stack spacing={2}>
            <Typography variant="h5">Symptoms</Typography>
            <TextField
              label="Presenting symptoms"
              placeholder="e.g. Sore throat, fever for 2 days"
              multiline
              minRows={4}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              fullWidth
            />
          </Stack>
        )}

        {activeStep === 1 && (
          <Stack spacing={2}>
            <Typography variant="h5">Diagnosis</Typography>
            <TextField
              label="Diagnosis"
              placeholder="e.g. Bacterial throat infection"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              fullWidth
            />
            <TextField
              label="Clinical notes"
              placeholder="Additional observations, follow-up plan, etc."
              multiline
              minRows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              fullWidth
            />
          </Stack>
        )}

        {activeStep === 2 && (
          <Stack spacing={2}>
            <Typography variant="h5">Prescription</Typography>
            {items.map((item, index) => (
              <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                  <Typography variant="subtitle2">Medicine {index + 1}</Typography>
                  {items.length > 1 && (
                    <IconButton size="small" onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  )}
                </Stack>
                <Stack spacing={1.5}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                    <TextField
                      label="Medicine name"
                      value={item.medicineName}
                      onChange={(e) => updateItem(index, 'medicineName', e.target.value)}
                      fullWidth
                    />
                    <TextField
                      label="Generic name"
                      value={item.genericName}
                      onChange={(e) => updateItem(index, 'genericName', e.target.value)}
                      fullWidth
                    />
                  </Stack>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                    <TextField
                      label="Dosage"
                      placeholder="e.g. 500 mg"
                      value={item.dosage}
                      onChange={(e) => updateItem(index, 'dosage', e.target.value)}
                      fullWidth
                    />
                    <TextField
                      label="Frequency"
                      placeholder="e.g. Twice daily"
                      value={item.frequency}
                      onChange={(e) => updateItem(index, 'frequency', e.target.value)}
                      fullWidth
                    />
                    <TextField
                      label="Route"
                      value={item.route}
                      onChange={(e) => updateItem(index, 'route', e.target.value)}
                      fullWidth
                    />
                    <TextField
                      label="Duration (days)"
                      type="number"
                      value={item.durationDays}
                      onChange={(e) => updateItem(index, 'durationDays', Number(e.target.value))}
                      fullWidth
                    />
                  </Stack>
                  <TextField
                    label="Instructions"
                    placeholder="e.g. Take with food"
                    value={item.instructions}
                    onChange={(e) => updateItem(index, 'instructions', e.target.value)}
                    fullWidth
                  />
                </Stack>
              </Paper>
            ))}
            <Button startIcon={<AddOutlinedIcon />} onClick={() => setItems((prev) => [...prev, emptyItem()])} sx={{ alignSelf: 'flex-start' }}>
              Add another medicine
            </Button>
          </Stack>
        )}

        {activeStep === 3 && (
          <SafetyCheckPanel warnings={warnings} acknowledged={acknowledged} onAcknowledgeChange={setAcknowledged} />
        )}

        {activeStep === 4 && (
          <Stack spacing={2.5}>
            <Typography variant="h5">Review</Typography>
            <Box>
              <Typography variant="subtitle2">Symptoms</Typography>
              <Typography variant="body2" color="text.secondary">{symptoms}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2">Diagnosis</Typography>
              <Typography variant="body2" color="text.secondary">{diagnosis}</Typography>
              {notes && <Typography variant="body2" color="text.secondary">{notes}</Typography>}
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Prescription</Typography>
              <Stack spacing={0.5}>
                {items.map((item, idx) => (
                  <Typography key={idx} variant="body2" color="text.secondary">
                    {item.medicineName} — {item.dosage}, {item.frequency}, {item.durationDays} days
                  </Typography>
                ))}
              </Stack>
            </Box>
            <Box>
              <Typography variant="subtitle2">Safety review</Typography>
              <Typography variant="body2" color="text.secondary">
                {warnings.length === 0
                  ? 'No warnings were detected.'
                  : `${warnings.length} warning(s) reviewed and acknowledged.`}
              </Typography>
            </Box>
          </Stack>
        )}

        <Divider sx={{ my: 3 }} />

        <Stack direction="row" justifyContent="space-between">
          <Button disabled={activeStep === 0 || saving} onClick={() => setActiveStep((s) => s - 1)}>
            Back
          </Button>
          {activeStep < STEPS.length - 1 ? (
            <Button variant="contained" disabled={!canAdvance()} onClick={goNext}>
              Continue
            </Button>
          ) : (
            <Button variant="contained" disabled={saving} onClick={handleSave}>
              {saving ? 'Saving…' : 'Save prescription'}
            </Button>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}
