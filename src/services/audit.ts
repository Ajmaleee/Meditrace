import { collection, doc, getDocs, orderBy, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { USE_DEMO_DATA, db } from '@/services/firebase/config';
import * as demo from '@/services/mockData';
import type { AccessAction, AccessLog } from '@/types';

export async function recordAccess(entry: {
  patientId: string;
  doctorId: string;
  doctorName: string;
  organizationId: string;
  action: AccessAction;
}): Promise<void> {
  const timestamp = new Date().toISOString();

  if (USE_DEMO_DATA) {
    demo.accessLogs.unshift({ logId: demo.nextLogId(), ...entry, timestamp });
    return;
  }

  if (!db) return;
  const logId = doc(collection(db, 'access_logs')).id;
  await setDoc(doc(db, 'access_logs', logId), { logId, ...entry, timestamp: serverTimestamp() });
}

export async function getAccessLogs(patientId: string): Promise<AccessLog[]> {
  if (USE_DEMO_DATA) {
    return demo.accessLogs
      .filter((l) => l.patientId === patientId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'access_logs'), where('patientId', '==', patientId), orderBy('timestamp', 'desc'))
  );
  return snap.docs.map((d) => d.data() as AccessLog);
}

export async function getRecentAccessLogsForDoctor(doctorId: string): Promise<AccessLog[]> {
  if (USE_DEMO_DATA) {
    return demo.accessLogs
      .filter((l) => l.doctorId === doctorId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, 10);
  }
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'access_logs'), where('doctorId', '==', doctorId), orderBy('timestamp', 'desc'))
  );
  return snap.docs.map((d) => d.data() as AccessLog).slice(0, 10);
}

export const ACCESS_ACTION_LABEL: Record<AccessAction, string> = {
  viewed_record: 'viewed patient record',
  viewed_medications: 'viewed medication history',
  viewed_allergies: 'viewed allergy records',
  added_visit: 'added a consultation',
  added_medication: 'added a medication',
  added_prescription: 'added a prescription',
  updated_consultation: 'updated a consultation',
};
