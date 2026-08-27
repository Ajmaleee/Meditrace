// Domain types for MediTrace.
// These mirror the Firestore collections described in the schema
// (see README.md) so the same shapes are used whether data comes from
// Firestore or from the local demo data service.

export type UserRole = 'doctor' | 'patient' | 'admin';

export interface AppUser {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId?: string;
  doctorId?: string;
  patientId?: string;
  status: 'active' | 'suspended';
  createdAt: string;
}

export interface Organization {
  organizationId: string;
  name: string;
  type: 'hospital' | 'clinic';
  city: string;
}

export interface Doctor {
  doctorId: string;
  userId: string;
  name: string;
  specialty: string;
  organizationId: string;
  registrationNumber: string;
}

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Unknown';

export interface Patient {
  patientId: string;
  name: string;
  dateOfBirth: string; // ISO date
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  email?: string;
  bloodGroup: BloodGroup;
  address?: string;
  emergencyContact?: string;
  createdAt: string;
  updatedAt: string;
}

export type MedicationStatus = 'active' | 'completed' | 'discontinued';

export interface Medication {
  medicationId: string;
  patientId: string;
  medicineName: string;
  genericName: string;
  dosage: string;
  frequency: string;
  route: string;
  startDate: string;
  endDate?: string;
  status: MedicationStatus;
  prescribedBy: string; // doctorId
  prescribedByName: string;
  prescriptionId?: string;
  notes?: string;
  createdAt: string;
}

export type AllergySeverity = 'mild' | 'moderate' | 'severe';

export interface Allergy {
  allergyId: string;
  patientId: string;
  substance: string;
  reaction: string;
  severity: AllergySeverity;
  notes?: string;
  recordedBy: string;
  createdAt: string;
}

export interface Visit {
  visitId: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  organizationId: string;
  organizationName: string;
  date: string;
  diagnosis: string;
  symptoms: string;
  notes: string;
  createdAt: string;
}

export interface PrescriptionItem {
  medicineName: string;
  genericName: string;
  dosage: string;
  frequency: string;
  route: string;
  durationDays: number;
  instructions?: string;
}

export interface Prescription {
  prescriptionId: string;
  patientId: string;
  visitId: string;
  doctorId: string;
  doctorName: string;
  items: PrescriptionItem[];
  acknowledgedWarnings: boolean;
  createdAt: string;
}

export type AccessAction =
  | 'viewed_record'
  | 'viewed_medications'
  | 'viewed_allergies'
  | 'added_visit'
  | 'added_medication'
  | 'added_prescription'
  | 'updated_consultation';

export interface AccessLog {
  logId: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  organizationId: string;
  action: AccessAction;
  timestamp: string;
}

export type WarningSeverity = 'critical' | 'caution' | 'info';

export interface SafetyWarning {
  id: string;
  type: 'allergy' | 'interaction';
  severity: WarningSeverity;
  title: string;
  description: string;
  recommendation: string;
  relatedMedicine?: string;
}

export interface DrugInteractionRule {
  drugA: string;
  drugB: string;
  severity: WarningSeverity;
  description: string;
  recommendation: string;
}
