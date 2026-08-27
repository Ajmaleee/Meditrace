import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  CircularProgress,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonSearchOutlinedIcon from '@mui/icons-material/PersonSearchOutlined';
import { EmptyState } from '@/components/common/EmptyState';
import { ROUTES } from '@/constants/routes';
import { searchPatients } from '@/services/patients';
import type { Patient } from '@/types';
import { format } from 'date-fns';

/** Masks a patient name to first-letter-only tokens, e.g. "Ananya Kumar" -> "A**** K****". */
function maskName(name: string): string {
  return name
    .split(' ')
    .map((part) => (part.length <= 1 ? part : part[0] + '*'.repeat(part.length - 1)))
    .join(' ');
}

export function PatientSearchPage() {
  const navigate = useNavigate();
  const [queryText, setQueryText] = useState('');
  const [results, setResults] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!queryText.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    const handle = setTimeout(() => {
      searchPatients(queryText).then((r) => {
        setResults(r);
        setLoading(false);
        setSearched(true);
      });
    }, 250);
    return () => clearTimeout(handle);
  }, [queryText]);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h2" sx={{ mb: 0.5 }}>
          Patients
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Search by Patient ID, name, or phone number. Results show only identifying details until you open a
          record.
        </Typography>
      </Box>

      <Paper variant="outlined" sx={{ p: 2.5 }}>
        <TextField
          fullWidth
          autoFocus
          placeholder="e.g. P-10245, Ananya Kumar, or 98450 11234"
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {loading && (
        <Stack alignItems="center" sx={{ py: 4 }}>
          <CircularProgress size={22} />
        </Stack>
      )}

      {!loading && searched && results.length === 0 && (
        <EmptyState
          icon={PersonSearchOutlinedIcon}
          title="No matching patients"
          description="Check the Patient ID or try searching by name or phone number instead."
        />
      )}

      {!loading && results.length > 0 && (
        <Stack spacing={1}>
          {results.map((p) => (
            <Paper
              key={p.patientId}
              variant="outlined"
              onClick={() => navigate(ROUTES.patientProfile(p.patientId))}
              sx={{ p: 2, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="subtitle1">{maskName(p.name)}</Typography>
                  <Typography variant="caption">Patient ID: {p.patientId}</Typography>
                </Box>
                <Typography variant="caption">
                  Last updated {format(new Date(p.updatedAt), 'd MMM yyyy')}
                </Typography>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      {!queryText.trim() && (
        <EmptyState
          icon={PersonSearchOutlinedIcon}
          title="Search for a patient"
          description="Enter a Patient ID, name, or phone number above to find a record."
        />
      )}
    </Stack>
  );
}
