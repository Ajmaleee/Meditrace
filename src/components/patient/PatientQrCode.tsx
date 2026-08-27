import { useEffect, useRef, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';
import QrCode2OutlinedIcon from '@mui/icons-material/QrCode2Outlined';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import * as QRCode from 'qrcode';

/**
 * Renders a QR code that encodes ONLY the patient's non-sensitive Patient ID
 * (e.g. "P-10245") — never medical history, medications, diagnoses, or any
 * other personal information. Scanning it is equivalent to typing the
 * Patient ID into search; the scanning doctor still needs their own
 * authorization to view the record it points to.
 */
export function PatientQrCode({ patientId, patientName }: { patientId: string; patientName: string }) {
  const [open, setOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (open && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, patientId, { width: 220, margin: 1, color: { dark: '#1D2226', light: '#FFFFFF' } });
    }
  }, [open]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `${patientId}-qr.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <>
      <Button startIcon={<QrCode2OutlinedIcon />} variant="outlined" onClick={() => setOpen(true)}>
        Patient QR code
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Patient identification QR
          <IconButton size="small" onClick={() => setOpen(false)} aria-label="Close">
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} alignItems="center" sx={{ py: 1 }}>
            <Box component="canvas" ref={canvasRef} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }} />
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle2">{patientName}</Typography>
              <Typography variant="caption">Patient ID: {patientId}</Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
              This code encodes only the Patient ID. Scanning it identifies the patient — it does not grant access
              to their record or contain any medical information.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleDownload}>Download</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
