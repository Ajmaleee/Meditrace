import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// AdapterDateFnsV3 (not AdapterDateFns) is required here: AdapterDateFns targets
// date-fns v2 and reaches into an internal path (date-fns/_lib/format/longFormatters)
// that date-fns v3's package.json "exports" map no longer allows external code to
// import. Since this project depends on date-fns ^3.x, it must use the V3 adapter.
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
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
