import {
  Box,
  Chip,
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
import { doctors, organizations, users, accessLogs } from '@/services/mockData';
import { ACCESS_ACTION_LABEL } from '@/services/audit';
import { format } from 'date-fns';

export function AdminDashboard() {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h2" sx={{ mb: 0.5 }}>
          Administration
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage doctors, organizations, and review system-wide audit activity.
        </Typography>
      </Box>

      <Paper variant="outlined">
        <Box sx={{ p: 2.5, pb: 1.5 }}>
          <Typography variant="subtitle1">Doctors</Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Specialty</TableCell>
                <TableCell>Organization</TableCell>
                <TableCell>Registration no.</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {doctors.map((doc) => {
                const org = organizations.find((o) => o.organizationId === doc.organizationId);
                const account = users.find((u) => u.doctorId === doc.doctorId);
                return (
                  <TableRow key={doc.doctorId} hover>
                    <TableCell>{doc.name}</TableCell>
                    <TableCell>{doc.specialty}</TableCell>
                    <TableCell>{org?.name}</TableCell>
                    <TableCell>{doc.registrationNumber}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={account?.status === 'active' ? 'Active' : 'Suspended'}
                        sx={{
                          bgcolor: account?.status === 'active' ? '#E6F2EB' : '#EEF0F2',
                          color: account?.status === 'active' ? '#276B47' : '#5B6470',
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Paper variant="outlined">
        <Box sx={{ p: 2.5, pb: 1.5 }}>
          <Typography variant="subtitle1">Organizations</Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>City</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {organizations.map((org) => (
                <TableRow key={org.organizationId} hover>
                  <TableCell>{org.name}</TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>{org.type}</TableCell>
                  <TableCell>{org.city}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Paper variant="outlined">
        <Box sx={{ p: 2.5, pb: 1.5 }}>
          <Typography variant="subtitle1">Recent audit activity</Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Doctor</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Timestamp</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {accessLogs.slice(0, 20).map((log) => (
                <TableRow key={log.logId} hover>
                  <TableCell>{log.doctorName}</TableCell>
                  <TableCell>{log.patientId}</TableCell>
                  <TableCell>{ACCESS_ACTION_LABEL[log.action]}</TableCell>
                  <TableCell>{format(new Date(log.timestamp), 'd MMM yyyy, h:mm a')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Stack>
  );
}
