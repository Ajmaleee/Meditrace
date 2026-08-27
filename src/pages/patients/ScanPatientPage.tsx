import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { ROUTES } from '@/constants/routes';
import { getPatient } from '@/services/patients';

const SCANNER_ELEMENT_ID = 'meditrace-qr-scanner';

export function ScanPatientPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'camera' | 'manual'>('camera');
  const [manualId, setManualId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<import('html5-qrcode').Html5Qrcode | null>(null);

  useEffect(() => {
    if (mode !== 'camera') return;
    let cancelled = false;

    import('html5-qrcode').then(({ Html5Qrcode }) => {
      if (cancelled) return;
      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
      scannerRef.current = scanner;
      scanner
        .start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText) => {
            resolvePatientId(decodedText.trim());
          },
          () => {
            // per-frame scan miss — expected while aiming the camera, ignore
          }
        )
        .catch(() => {
          setCameraError('Camera access is unavailable. Enter the Patient ID manually instead.');
          setMode('manual');
        });
    });

    return () => {
      cancelled = true;
      scannerRef.current?.stop().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const resolvePatientId = async (patientId: string) => {
    const patient = await getPatient(patientId);
    if (!patient) {
      setError(`No patient found for ID "${patientId}".`);
      return;
    }
    scannerRef.current?.stop().catch(() => {});
    navigate(ROUTES.patientProfile(patient.patientId));
  };

  const handleManualSubmit = () => {
    setError(null);
    if (!manualId.trim()) return;
    resolvePatientId(manualId.trim());
  };

  return (
    <Stack spacing={2.5} sx={{ maxWidth: 480, mx: 'auto' }}>
      <Box>
        <Typography variant="h2" sx={{ mb: 0.5 }}>
          Scan patient
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Scan a patient's QR code, or enter their Patient ID directly. This only identifies the patient — your
          existing authorization still determines what you can view.
        </Typography>
      </Box>

      <Paper variant="outlined">
        <Tabs value={mode} onChange={(_, v) => setMode(v)} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
          <Tab value="camera" label="Camera" />
          <Tab value="manual" label="Enter ID" />
        </Tabs>

        <Box sx={{ p: 2.5 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {mode === 'camera' ? (
            <Stack spacing={1.5} alignItems="center">
              {cameraError && <Alert severity="warning">{cameraError}</Alert>}
              <Box
                id={SCANNER_ELEMENT_ID}
                sx={{
                  width: '100%',
                  minHeight: 260,
                  borderRadius: 1,
                  overflow: 'hidden',
                  bgcolor: '#111',
                }}
              />
              <Typography variant="caption" color="text.secondary">
                Point the camera at the patient's QR code.
              </Typography>
            </Stack>
          ) : (
            <Stack spacing={2}>
              <TextField
                label="Patient ID"
                placeholder="e.g. P-10245"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                fullWidth
                autoFocus
              />
              <Button variant="contained" onClick={handleManualSubmit} disabled={!manualId.trim()}>
                Open record
              </Button>
            </Stack>
          )}
        </Box>
      </Paper>
    </Stack>
  );
}
