import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { USE_DEMO_DATA, db } from '@/services/firebase/config';
import * as demo from '@/services/mockData';
import type { Allergy, Medication, Patient, Prescription, Visit } from '@/types';

const delay = (ms = 220) => new Promise((resolve) => setTimeout(resolve, ms));

export async function searchPatients(queryText: string): Promise<Patient[]> {
  const normalized = queryText.trim().toLowerCase();

  if (USE_DEMO_DATA) {
    await delay();
    if (!normalized) return [];
    return demo.patients.filter(
      (p) =>
        p.patientId.toLowerCase().includes(normalized) ||
        p.name.toLowerCase().includes(normalized) ||
        p.phone.replace(/\s+/g, '').includes(normalized.replace(/\s+/g, ''))
    );
  }

  if (!db || !normalized) return [];
  // Firestore has no native "contains" text search; a production deployment
  // would back this with Algolia/Typesense or a dedicated search index.
  // For an exact Patient ID lookup (the primary supported search key):
  const snap = await getDocs(
    query(collection(db, 'patients'), where('patientId', '==', queryText.trim()))
  );
  return snap.docs.map((d) => d.data() as Patient);
}

export async function getPatient(patientId: string): Promise<Patient | null> {
  if (USE_DEMO_DATA) {
    await delay(150);
    return demo.patients.find((p) => p.patientId === patientId) ?? null;
  }
  if (!db) return null;
  const snap = await getDoc(doc(db, 'patients', patientId));
  return snap.exists() ? (snap.data() as Patient) : null;
}

export async function getAllergies(patientId: string): Promise<Allergy[]> {
  if (USE_DEMO_DATA) {
    await delay(150);
    return demo.allergies.filter((a) => a.patientId === patientId);
  }
  if (!db) return [];
  const snap = await getDocs(query(collection(db, 'allergies'), where('patientId', '==', patientId)));
  return snap.docs.map((d) => d.data() as Allergy);
}

export async function getMedications(patientId: string): Promise<Medication[]> {
  if (USE_DEMO_DATA) {
    await delay(150);
    return demo.medications
      .filter((m) => m.patientId === patientId)
      .sort((a, b) => b.startDate.localeCompare(a.startDate));
  }
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'medications'), where('patientId', '==', patientId), orderBy('startDate', 'desc'))
  );
  return snap.docs.map((d) => d.data() as Medication);
}

export async function getVisits(patientId: string): Promise<Visit[]> {
  if (USE_DEMO_DATA) {
    await delay(150);
    return demo.visits
      .filter((v) => v.patientId === patientId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'visits'), where('patientId', '==', patientId), orderBy('date', 'desc'))
  );
  return snap.docs.map((d) => d.data() as Visit);
}

export async function getPrescriptions(patientId: string): Promise<Prescription[]> {
  if (USE_DEMO_DATA) {
    await delay(150);
    return demo.prescriptions
      .filter((p) => p.patientId === patientId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'prescriptions'), where('patientId', '==', patientId), orderBy('createdAt', 'desc'))
  );
  return snap.docs.map((d) => d.data() as Prescription);
}

interface CreateConsultationInput {
  patientId: string;
  doctorId: string;
  doctorName: string;
  organizationId: string;
  organizationName: string;
  symptoms: string;
  diagnosis: string;
  notes: string;
  prescriptionItems: Prescription['items'];
  acknowledgedWarnings: boolean;
}

/**
 * Saves a completed consultation: creates the visit, appends new medications
 * to the medication history, and creates the prescription record — mirroring
 * how these writes would be grouped into a single Firestore batch/transaction
 * in production so the longitudinal record never ends up partially updated.
 */
export async function saveConsultation(input: CreateConsultationInput): Promise<{
  visit: Visit;
  prescription: Prescription;
}> {
  const nowIso = new Date().toISOString();

  const visit: Visit = {
    visitId: demo.nextVisitId(),
    patientId: input.patientId,
    doctorId: input.doctorId,
    doctorName: input.doctorName,
    organizationId: input.organizationId,
    organizationName: input.organizationName,
    date: nowIso.slice(0, 10),
    diagnosis: input.diagnosis,
    symptoms: input.symptoms,
    notes: input.notes,
    createdAt: nowIso,
  };

  const prescription: Prescription = {
    prescriptionId: demo.nextRxId(),
    patientId: input.patientId,
    visitId: visit.visitId,
    doctorId: input.doctorId,
    doctorName: input.doctorName,
    items: input.prescriptionItems,
    acknowledgedWarnings: input.acknowledgedWarnings,
    createdAt: nowIso,
  };

  if (USE_DEMO_DATA) {
    await delay(300);
    demo.visits.unshift(visit);
    demo.prescriptions.unshift(prescription);
    for (const item of input.prescriptionItems) {
      demo.medications.unshift({
        medicationId: demo.nextMedId(),
        patientId: input.patientId,
        medicineName: item.medicineName,
        genericName: item.genericName,
        dosage: item.dosage,
        frequency: item.frequency,
        route: item.route,
        startDate: nowIso.slice(0, 10),
        status: 'active',
        prescribedBy: input.doctorId,
        prescribedByName: input.doctorName,
        prescriptionId: prescription.prescriptionId,
        notes: item.instructions,
        createdAt: nowIso,
      });
    }
    return { visit, prescription };
  }

  if (db) {
    await setDoc(doc(db, 'visits', visit.visitId), { ...visit, createdAt: serverTimestamp() });
    await setDoc(doc(db, 'prescriptions', prescription.prescriptionId), {
      ...prescription,
      createdAt: serverTimestamp(),
    });
    for (const item of input.prescriptionItems) {
      const medicationId = doc(collection(db, 'medications')).id;
      await setDoc(doc(db, 'medications', medicationId), {
        medicationId,
        patientId: input.patientId,
        medicineName: item.medicineName,
        genericName: item.genericName,
        dosage: item.dosage,
        frequency: item.frequency,
        route: item.route,
        startDate: nowIso.slice(0, 10),
        status: 'active',
        prescribedBy: input.doctorId,
        prescribedByName: input.doctorName,
        prescriptionId: prescription.prescriptionId,
        notes: item.instructions ?? null,
        createdAt: serverTimestamp(),
      });
    }
  }

  return { visit, prescription };
}
