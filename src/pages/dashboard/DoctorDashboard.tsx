import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import { useAuth } from '@/context/AuthContext';
import { EmptyState } from '@/components/common/EmptyState';
import { ROUTES } from '@/constants/routes';
import { searchPatients } from '@/services/patients';
import { getRecentAccessLogsForDoctor, ACCESS_ACTION_LABEL } from '@/services/audit';
import { patients as allPatients, visits as allVisits } from '@/services/mockData';
import type { AccessLog, Patient } from '@/types';
import { format, formatDistanceToNow, isToday } from 'date-fns';

export function DoctorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [queryText, setQueryText] = useState('');
  const [results, setResults] = useState<Patient[]>([]);
  const [searching, setSearching] = useState(false);
  const [recentLogs, setRecentLogs] = useState<AccessLog[]>([]);

  useEffect(() => {
    if (user?.doctorId) {
      getRecentAccessLogsForDoctor(user.doctorId).then(setRecentLogs);
    }
  }, [user?.doctorId]);

  useEffect(() => {
    if (!queryText.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    const handle = setTimeout(() => {
      searchPatients(queryText).then((r) => {
        setResults(r);
        setSearching(false);
      });
    }, 250);
    return () => clearTimeout(handle);
  }, [queryText]);

  const recentlyAccessedPatientIds = useMemo(
    () => Array.from(new Set(recentLogs.map((l) => l.patientId))).slice(0, 5),
    [recentLogs]
  );
  const recentPatients = recentlyAccessedPatientIds
    .map((id) => allPatients.find((p) => p.patientId === id))
    .filter((p): p is Patient => Boolean(p));

  const todaysConsultations = allVisits.filter((v) => v.doctorId === user?.doctorId && isToday(new Date(v.date)));

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h2" sx={{ mb: 0.5 }}>
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {format(new Date(), 'EEEE, d MMMM yyyy')}
        </Typography>
      </Box>

      <Paper variant="outlined" sx={{ p: 2.5 }}>
        <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
          Find a patient
        </Typography>
        <TextField
          fullWidth
          placeholder="Patient ID, name, or phone number"
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
        {queryText.trim() && (
          <Box sx={{ mt: 2 }}>
            {searching ? (
              <Stack alignItems="center" sx={{ py: 3 }}>
                <CircularProgress size={20} />
              </Stack>
            ) : results.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                No patients matched "{queryText}".
              </Typography>
            ) : (
              <Stack spacing={1}>
                {results.map((p) => (
                  <Paper
                    key={p.patientId}
                    variant="outlined"
                    onClick={() => navigate(ROUTES.patientProfile(p.patientId))}
                    sx={{ p: 1.5, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                  >
                    <Stack direction="row" justifyContent="space-between">
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {p.name}
                        </Typography>
                        <Typography variant="caption">Patient ID: {p.patientId}</Typography>
                      </Box>
                      <Typography variant="caption" sx={{ alignSelf: 'center' }}>
                        {p.phone}
                      </Typography>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}
          </Box>
        )}
      </Paper>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
        <Paper variant="outlined" sx={{ p: 2.5, flex: 1 }}>
          <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
            Today's consultations
          </Typography>
          {todaysConsultations.length === 0 ? (
            <EmptyState
              icon={EventNoteOutlinedIcon}
              title="No consultations today"
              description="Consultations you complete today will appear here."
            />
          ) : (
            <Stack spacing={1}>
              {todaysConsultations.map((v) => (
                <Box key={v.visitId} sx={{ py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {v.diagnosis}
                  </Typography>
                  <Typography variant="caption">Patient {v.patientId}</Typography>
                </Box>
              ))}
            </Stack>
          )}
        </Paper>

        <Paper variant="outlined" sx={{ p: 2.5, flex: 1 }}>
          <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
            Recently viewed patients
          </Typography>
          {recentPatients.length === 0 ? (
            <EmptyState
              icon={PeopleAltOutlinedIcon}
              title="No recent activity"
              description="Patients you view or update will appear here for quick access."
            />
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Patient</TableCell>
                    <TableCell>Last activity</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentPatients.map((p) => {
                    const log = recentLogs.find((l) => l.patientId === p.patientId);
                    return (
                      <TableRow
                        key={p.patientId}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate(ROUTES.patientProfile(p.patientId))}
                      >
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {p.name}
                          </Typography>
                          <Typography variant="caption">{p.patientId}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {log ? formatDistanceToNow(new Date(log.timestamp), { addSuffix: true }) : '—'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Stack>

      {recentLogs.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
            Recent activity
          </Typography>
          <Stack spacing={1}>
            {recentLogs.slice(0, 5).map((log) => (
              <Stack key={log.logId} direction="row" justifyContent="space-between" sx={{ py: 0.5 }}>
                <Typography variant="body2">
                  You {ACCESS_ACTION_LABEL[log.action]} for {log.patientId}
                </Typography>
                <Typography variant="caption">{format(new Date(log.timestamp), 'd MMM, h:mm a')}</Typography>
              </Stack>
            ))}
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}
