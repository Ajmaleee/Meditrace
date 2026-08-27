import { useEffect, useState } from 'react';
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
  Typography,
} from '@mui/material';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import { EmptyState } from '@/components/common/EmptyState';
import { useAuth } from '@/context/AuthContext';
import { getRecentAccessLogsForDoctor, ACCESS_ACTION_LABEL } from '@/services/audit';
import { patients } from '@/services/mockData';
import type { AccessLog } from '@/types';
import { format } from 'date-fns';

export function AccessHistoryPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (user?.doctorId) {
      getRecentAccessLogsForDoctor(user.doctorId).then((l) => {
        setLogs(l);
        setLoaded(true);
      });
    }
  }, [user?.doctorId]);

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="h2" sx={{ mb: 0.5 }}>
          Access history
        </Typography>
        <Typography variant="body2" color="text.secondary">
          A record of your recent access to patient information, for transparency and audit purposes.
        </Typography>
      </Box>

      <Paper variant="outlined">
        {loaded && logs.length === 0 ? (
          <EmptyState
            icon={HistoryOutlinedIcon}
            title="No access history yet"
            description="Actions you take on patient records will be logged here."
          />
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Patient</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Timestamp</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => {
                  const patient = patients.find((p) => p.patientId === log.patientId);
                  return (
                    <TableRow key={log.logId} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {patient?.name ?? log.patientId}
                        </Typography>
                        <Typography variant="caption">{log.patientId}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                          {ACCESS_ACTION_LABEL[log.action]}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{format(new Date(log.timestamp), 'd MMM yyyy, h:mm a')}</Typography>
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
  );
}
