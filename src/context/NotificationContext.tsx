import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Alert, Snackbar } from '@mui/material';
import { toHumanReadableError } from '@/utils/errorMessages';

interface Notice {
  message: string;
  severity: 'success' | 'error' | 'info';
}

interface NotificationContextValue {
  notifyError: (error: unknown, fallbackMessage?: string) => void;
  notifySuccess: (message: string) => void;
  notifyInfo: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<Notice | null>(null);

  const notifyError = useCallback((error: unknown, fallbackMessage?: string) => {
    const message = error instanceof Error && error.message ? error.message : fallbackMessage ?? toHumanReadableError(error);
    setNotice({ message, severity: 'error' });
  }, []);

  const notifySuccess = useCallback((message: string) => {
    setNotice({ message, severity: 'success' });
  }, []);

  const notifyInfo = useCallback((message: string) => {
    setNotice({ message, severity: 'info' });
  }, []);

  const value = useMemo(() => ({ notifyError, notifySuccess, notifyInfo }), [notifyError, notifySuccess, notifyInfo]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={5000}
        onClose={() => setNotice(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {notice ? (
          <Alert severity={notice.severity} onClose={() => setNotice(null)} variant="filled" sx={{ width: '100%' }}>
            {notice.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
}
