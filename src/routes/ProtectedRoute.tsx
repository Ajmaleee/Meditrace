import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/constants/routes';
import type { UserRole } from '@/types';

export function ProtectedRoute({ allowedRoles }: { allowedRoles: UserRole[] }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to={ROUTES.login} state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    const fallback =
      user.role === 'doctor' ? ROUTES.doctorDashboard : user.role === 'patient' ? ROUTES.patientDashboard : ROUTES.adminDashboard;
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}
