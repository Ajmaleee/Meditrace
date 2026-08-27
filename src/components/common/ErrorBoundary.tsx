import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In production this would report to an error-tracking service.
    // eslint-disable-next-line no-console
    console.error('MediTrace encountered an unexpected error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
          <Paper variant="outlined" sx={{ p: 4, maxWidth: 420, textAlign: 'center' }}>
            <Stack spacing={2} alignItems="center">
              <ReportProblemOutlinedIcon sx={{ fontSize: 32, color: 'warning.main' }} />
              <Typography variant="h5">Something went wrong</Typography>
              <Typography variant="body2" color="text.secondary">
                An unexpected error occurred. Your data has not been affected. Try reloading the page.
              </Typography>
              <Button variant="contained" onClick={() => window.location.reload()}>
                Reload
              </Button>
            </Stack>
          </Paper>
        </Box>
      );
    }
    return this.props.children;
  }
}
