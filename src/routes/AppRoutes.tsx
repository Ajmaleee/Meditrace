import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/constants/routes';
import { LoginPage } from '@/pages/auth/LoginPage';
import { DoctorDashboard } from '@/pages/dashboard/DoctorDashboard';
import { PatientSearchPage } from '@/pages/patients/PatientSearchPage';
import { PatientProfilePage } from '@/pages/patients/PatientProfilePage';
import { NewConsultationPage } from '@/pages/consultations/NewConsultationPage';
import { AccessHistoryPage } from '@/pages/access/AccessHistoryPage';
import { PatientPortalDashboard } from '@/pages/patientPortal/PatientPortalDashboard';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';

export function AppRoutes() {
  const { user } = useAuth();

  const roleHome = user
    ? user.role === 'doctor'
      ? ROUTES.doctorDashboard
      : user.role === 'patient'
      ? ROUTES.patientDashboard
      : ROUTES.adminDashboard
    : ROUTES.login;

  return (
    <Routes>
      <Route path={ROUTES.login} element={user ? <Navigate to={roleHome} replace /> : <LoginPage />} />

      <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
        <Route element={<AppShell />}>
          <Route path={ROUTES.doctorDashboard} element={<DoctorDashboard />} />
          <Route path={ROUTES.patientSearch} element={<PatientSearchPage />} />
          <Route path="/patients/:patientId" element={<PatientProfilePage />} />
          <Route path="/patients/:patientId/consultation/new" element={<NewConsultationPage />} />
          <Route path={ROUTES.accessHistory} element={<AccessHistoryPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
        <Route element={<AppShell />}>
          <Route path={ROUTES.patientDashboard} element={<PatientPortalDashboard />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<AppShell />}>
          <Route path={ROUTES.adminDashboard} element={<AdminDashboard />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={roleHome} replace />} />
    </Routes>
  );
}
