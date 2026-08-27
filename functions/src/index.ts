import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

interface GenerateSummaryRequest {
  patientId: string;
}

/**
 * generateClinicalSummary
 * ------------------------
 * Production counterpart to src/services/summary.ts's local demo template.
 *
 * Runs server-side (never in the browser) so that:
 *  - any LLM API key stays out of client code entirely
 *  - the caller's authorization can be checked against Firestore before any
 *    patient data is read, independent of (and in addition to) the client's
 *    Firestore security rules
 *  - the function reads the patient's visits/medications/allergies directly
 *    and passes only that structured data to the model — the model is not
 *    given open-ended access to the database
 *
 * This is a stub: it assembles the same structured payload the local demo
 * template consumes, and shows where a real LLM call would go. Wire in your
 * provider of choice (e.g. the Anthropic Messages API) and keep the request
 * strictly grounded in the retrieved records — the model should restate and
 * organize existing facts, never introduce new clinical claims.
 *
 * Deploy with: npm run deploy (from functions/), then call from the client
 * via `httpsCallable(functions, 'generateClinicalSummary')({ patientId })`.
 */
export const generateClinicalSummary = onCall<GenerateSummaryRequest>(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in required.');
  }

  const callerSnap = await db.collection('users').doc(request.auth.uid).get();
  const caller = callerSnap.data();
  if (!caller || (caller.role !== 'doctor' && caller.role !== 'admin')) {
    throw new HttpsError('permission-denied', 'Only doctors and admins can generate a clinical summary.');
  }

  const { patientId } = request.data;
  if (!patientId) {
    throw new HttpsError('invalid-argument', 'patientId is required.');
  }

  const [visitsSnap, medsSnap, allergiesSnap] = await Promise.all([
    db.collection('visits').where('patientId', '==', patientId).get(),
    db.collection('medications').where('patientId', '==', patientId).get(),
    db.collection('allergies').where('patientId', '==', patientId).get(),
  ]);

  const visits = visitsSnap.docs.map((d) => d.data());
  const medications = medsSnap.docs.map((d) => d.data());
  const allergies = allergiesSnap.docs.map((d) => d.data());

  // TODO (production): call an LLM here with a prompt that includes ONLY
  // `visits`, `medications`, and `allergies` above, instructing it to
  // summarize — not infer new diagnoses or alter dosing. Example shape:
  //
  //   const summary = await callLlm({
  //     system: 'Summarize the provided clinical records factually...',
  //     data: { visits, medications, allergies },
  //   });
  //
  // For now, this stub returns the same deterministic bullet list the
  // client-side demo template produces, so the callable has a working
  // response shape to build against.
  const bullets = [
    ...visits.map((v) => `${v.diagnosis} (${v.date}) — ${v.doctorName}`),
    ...medications.map((m) =>
      m.status === 'active' ? `Currently taking ${m.medicineName}` : `${m.medicineName}: ${m.status}`
    ),
    ...allergies.map((a) => `Allergy: ${a.substance} (${a.severity})`),
  ];

  return { visitCount: visits.length, bullets, generatedAt: new Date().toISOString() };
});
