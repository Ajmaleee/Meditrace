export const ROUTES = {
  login: '/login',

  doctorDashboard: '/dashboard',
  patientSearch: '/patients',
  scanPatient: '/patients/scan',
  patientProfile: (patientId: string) => `/patients/${patientId}`,
  newConsultation: (patientId: string) => `/patients/${patientId}/consultation/new`,
  accessHistory: '/access-history',

  patientDashboard: '/patient/dashboard',

  adminDashboard: '/admin/dashboard',
} as const;
