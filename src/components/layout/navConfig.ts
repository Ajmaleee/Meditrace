import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import QrCodeScannerOutlinedIcon from '@mui/icons-material/QrCodeScannerOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined';
import MedicationOutlinedIcon from '@mui/icons-material/MedicationOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import type { SvgIconComponent } from '@mui/icons-material';
import { ROUTES } from '@/constants/routes';
import type { UserRole } from '@/types';

export interface NavItem {
  label: string;
  path: string;
  icon: SvgIconComponent;
}

export const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  doctor: [
    { label: 'Dashboard', path: ROUTES.doctorDashboard, icon: DashboardOutlinedIcon },
    { label: 'Patients', path: ROUTES.patientSearch, icon: PeopleAltOutlinedIcon },
    { label: 'Scan patient', path: ROUTES.scanPatient, icon: QrCodeScannerOutlinedIcon },
    { label: 'Access history', path: ROUTES.accessHistory, icon: HistoryOutlinedIcon },
  ],
  patient: [
    { label: 'My record', path: ROUTES.patientDashboard, icon: LocalHospitalOutlinedIcon },
  ],
  admin: [
    { label: 'Overview', path: ROUTES.adminDashboard, icon: DashboardOutlinedIcon },
    { label: 'Doctors', path: ROUTES.adminDashboard, icon: MedicationOutlinedIcon },
    { label: 'Audit logs', path: ROUTES.adminDashboard, icon: ReceiptLongOutlinedIcon },
  ],
};
