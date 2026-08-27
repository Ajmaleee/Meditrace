import type {
  AccessLog,
  Allergy,
  AppUser,
  Doctor,
  Medication,
  Organization,
  Patient,
  Prescription,
  Visit,
} from '@/types';

/**
 * FICTIONAL DEMO DATA — for local development and the hackathon demo only.
 * No real patient information is used anywhere in this dataset.
 *
 * This module behaves as a tiny in-memory clone of the Firestore collections
 * described in README.md. Swapping USE_DEMO_DATA off in src/services/firebase
 * routes the same service functions (see patients.ts, audit.ts) at real
 * Firestore reads/writes instead — callers do not need to change.
 */

export const organizations: Organization[] = [
  { organizationId: 'org-apollo-blr', name: 'North Star General Hospital', type: 'hospital', city: 'Bengaluru' },
  { organizationId: 'org-city-clinic', name: 'Riverside Family Clinic', type: 'clinic', city: 'Pune' },
];

export const doctors: Doctor[] = [
  {
    doctorId: 'doc-1',
    userId: 'user-doc-1',
    name: 'Dr. Rahul Menon',
    specialty: 'Internal Medicine',
    organizationId: 'org-apollo-blr',
    registrationNumber: 'KMC-88421',
  },
  {
    doctorId: 'doc-2',
    userId: 'user-doc-2',
    name: 'Dr. Priya Nair',
    specialty: 'Endocrinology',
    organizationId: 'org-apollo-blr',
    registrationNumber: 'KMC-77310',
  },
];

export const users: AppUser[] = [
  {
    userId: 'user-doc-1',
    name: 'Dr. Rahul Menon',
    email: 'rahul.menon@northstar.demo',
    role: 'doctor',
    organizationId: 'org-apollo-blr',
    doctorId: 'doc-1',
    status: 'active',
    createdAt: '2024-01-10T09:00:00.000Z',
  },
  {
    userId: 'user-doc-2',
    name: 'Dr. Priya Nair',
    email: 'priya.nair@northstar.demo',
    role: 'doctor',
    organizationId: 'org-apollo-blr',
    doctorId: 'doc-2',
    status: 'active',
    createdAt: '2024-02-01T09:00:00.000Z',
  },
  {
    userId: 'user-patient-1',
    name: 'Ananya Kumar',
    email: 'ananya.kumar@example.demo',
    role: 'patient',
    patientId: 'P-10245',
    status: 'active',
    createdAt: '2023-11-05T09:00:00.000Z',
  },
  {
    userId: 'user-admin-1',
    name: 'System Administrator',
    email: 'admin@northstar.demo',
    role: 'admin',
    organizationId: 'org-apollo-blr',
    status: 'active',
    createdAt: '2023-01-01T09:00:00.000Z',
  },
];

/** Demo password is identical for every seed account: "demo1234". Shown on the login screen. */
export const DEMO_PASSWORD = 'demo1234';

export const patients: Patient[] = [
  {
    patientId: 'P-10245',
    name: 'Ananya Kumar',
    dateOfBirth: '1986-04-12',
    gender: 'Female',
    phone: '+91 98450 11234',
    email: 'ananya.kumar@example.demo',
    bloodGroup: 'B+',
    address: 'HSR Layout, Bengaluru',
    emergencyContact: 'Vikram Kumar (spouse) · +91 98450 99887',
    createdAt: '2023-11-05T09:00:00.000Z',
    updatedAt: '2026-08-12T10:00:00.000Z',
  },
  {
    patientId: 'P-10391',
    name: 'Suresh Rao',
    dateOfBirth: '1958-09-02',
    gender: 'Male',
    phone: '+91 98801 22456',
    bloodGroup: 'O+',
    address: 'Koramangala, Bengaluru',
    createdAt: '2022-06-14T09:00:00.000Z',
    updatedAt: '2026-07-30T10:00:00.000Z',
  },
  {
    patientId: 'P-10508',
    name: 'Fatima Sheikh',
    dateOfBirth: '1994-01-22',
    gender: 'Female',
    phone: '+91 90210 44219',
    bloodGroup: 'A-',
    address: 'Indiranagar, Bengaluru',
    createdAt: '2024-03-19T09:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
  },
];

export const allergies: Allergy[] = [
  {
    allergyId: 'alg-1',
    patientId: 'P-10245',
    substance: 'Penicillin',
    reaction: 'Skin rash, hives',
    severity: 'moderate',
    notes: 'Reported during 2019 dental treatment.',
    recordedBy: 'Dr. Rahul Menon',
    createdAt: '2019-05-02T09:00:00.000Z',
  },
  {
    allergyId: 'alg-2',
    patientId: 'P-10391',
    substance: 'Sulfa drugs',
    reaction: 'Swelling, difficulty breathing',
    severity: 'severe',
    recordedBy: 'Dr. Priya Nair',
    createdAt: '2021-02-11T09:00:00.000Z',
  },
];

export const medications: Medication[] = [
  {
    medicationId: 'med-1',
    patientId: 'P-10245',
    medicineName: 'Metformin',
    genericName: 'Metformin hydrochloride',
    dosage: '500 mg',
    frequency: 'Twice daily',
    route: 'Oral',
    startDate: '2026-08-12',
    status: 'active',
    prescribedBy: 'doc-1',
    prescribedByName: 'Dr. Rahul Menon',
    createdAt: '2026-08-12T10:00:00.000Z',
  },
  {
    medicationId: 'med-2',
    patientId: 'P-10245',
    medicineName: 'Amoxicillin',
    genericName: 'Amoxicillin',
    dosage: '250 mg',
    frequency: 'Three times daily',
    route: 'Oral',
    startDate: '2026-06-04',
    endDate: '2026-06-11',
    status: 'discontinued',
    prescribedBy: 'doc-2',
    prescribedByName: 'Dr. Priya Nair',
    notes: 'Discontinued after patient reported rash — see allergy record.',
    createdAt: '2026-06-04T10:00:00.000Z',
  },
  {
    medicationId: 'med-3',
    patientId: 'P-10245',
    medicineName: 'Paracetamol',
    genericName: 'Paracetamol',
    dosage: '650 mg',
    frequency: 'As needed',
    route: 'Oral',
    startDate: '2026-03-18',
    endDate: '2026-03-25',
    status: 'completed',
    prescribedBy: 'doc-1',
    prescribedByName: 'Dr. Rahul Menon',
    createdAt: '2026-03-18T10:00:00.000Z',
  },
];

export const visits: Visit[] = [
  {
    visitId: 'visit-1',
    patientId: 'P-10245',
    doctorId: 'doc-1',
    doctorName: 'Dr. Rahul Menon',
    organizationId: 'org-apollo-blr',
    organizationName: 'North Star General Hospital',
    date: '2026-08-12',
    diagnosis: 'Type 2 Diabetes Mellitus',
    symptoms: 'Increased thirst, fatigue',
    notes: 'Started on Metformin. Advised dietary changes and follow-up in 6 weeks.',
    createdAt: '2026-08-12T10:00:00.000Z',
  },
  {
    visitId: 'visit-2',
    patientId: 'P-10245',
    doctorId: 'doc-2',
    doctorName: 'Dr. Priya Nair',
    organizationId: 'org-apollo-blr',
    organizationName: 'North Star General Hospital',
    date: '2026-06-04',
    diagnosis: 'Bacterial throat infection',
    symptoms: 'Sore throat, fever',
    notes: 'Prescribed Amoxicillin. Patient reported rash on day 3 — discontinued, documented as penicillin-class allergy.',
    createdAt: '2026-06-04T10:00:00.000Z',
  },
  {
    visitId: 'visit-3',
    patientId: 'P-10245',
    doctorId: 'doc-1',
    doctorName: 'Dr. Rahul Menon',
    organizationId: 'org-apollo-blr',
    organizationName: 'North Star General Hospital',
    date: '2026-03-18',
    diagnosis: 'Tension headache',
    symptoms: 'Headache, mild fever',
    notes: 'Symptomatic treatment with Paracetamol.',
    createdAt: '2026-03-18T10:00:00.000Z',
  },
];

export const prescriptions: Prescription[] = [
  {
    prescriptionId: 'rx-1',
    patientId: 'P-10245',
    visitId: 'visit-1',
    doctorId: 'doc-1',
    doctorName: 'Dr. Rahul Menon',
    items: [
      {
        medicineName: 'Metformin',
        genericName: 'Metformin hydrochloride',
        dosage: '500 mg',
        frequency: 'Twice daily',
        route: 'Oral',
        durationDays: 90,
        instructions: 'Take with meals.',
      },
    ],
    acknowledgedWarnings: false,
    createdAt: '2026-08-12T10:00:00.000Z',
  },
];

export const accessLogs: AccessLog[] = [
  {
    logId: 'log-1',
    patientId: 'P-10245',
    doctorId: 'doc-1',
    doctorName: 'Dr. Rahul Menon',
    organizationId: 'org-apollo-blr',
    action: 'viewed_record',
    timestamp: '2026-08-12T09:52:00.000Z',
  },
  {
    logId: 'log-2',
    patientId: 'P-10245',
    doctorId: 'doc-1',
    doctorName: 'Dr. Rahul Menon',
    organizationId: 'org-apollo-blr',
    action: 'added_medication',
    timestamp: '2026-08-12T10:00:00.000Z',
  },
  {
    logId: 'log-3',
    patientId: 'P-10245',
    doctorId: 'doc-2',
    doctorName: 'Dr. Priya Nair',
    organizationId: 'org-apollo-blr',
    action: 'viewed_allergies',
    timestamp: '2026-06-04T09:40:00.000Z',
  },
];

let logIdCounter = accessLogs.length + 1;
let medIdCounter = medications.length + 1;
let visitIdCounter = visits.length + 1;
let rxIdCounter = prescriptions.length + 1;

export function nextLogId() {
  return `log-${logIdCounter++}`;
}
export function nextMedId() {
  return `med-${medIdCounter++}`;
}
export function nextVisitId() {
  return `visit-${visitIdCounter++}`;
}
export function nextRxId() {
  return `rx-${rxIdCounter++}`;
}
