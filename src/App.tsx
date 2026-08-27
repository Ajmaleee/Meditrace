import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { theme } from '@/theme/theme';
import { AuthProvider } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { AppRoutes } from '@/routes/AppRoutes';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <QueryClientProvider client={queryClient}>
          <ErrorBoundary>
            <NotificationProvider>
              <BrowserRouter>
                <AuthProvider>
                  <AppRoutes />
                </AuthProvider>
              </BrowserRouter>
            </NotificationProvider>
          </ErrorBoundary>
        </QueryClientProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}
