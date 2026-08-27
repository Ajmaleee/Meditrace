import type { Allergy, Medication, Patient, Visit } from '@/types';
import { differenceInYears, format } from 'date-fns';

/**
 * Produces a short clinical summary from a patient's existing records.
 *
 * DEMO MODE: this is a deterministic template — it only restates facts
 * already present in `visits`, `medications`, and `allergies`, in the order
 * described in the product brief. It never infers a diagnosis or invents
 * information that isn't already in the record.
 *
 * PRODUCTION PATH: replace the body of this function with a call to a
 * callable Cloud Function (see functions/src/generateClinicalSummary.ts in
 * this repo) that sends the same structured record to an LLM and returns
 * prose. The UI contract stays identical either way: the caller always
 * receives a list of bullet strings plus a visit count, and the result is
 * always rendered behind the "AI-generated — verify against the original
 * records" banner in ClinicalSummaryPanel. The AI output is never written
 * back to `visits`/`medications`/`allergies` — those collections remain the
 * source of truth.
 */
export function generateClinicalSummaryLocal(params: {
  patient: Patient;
  visits: Visit[];
  medications: Medication[];
  allergies: Allergy[];
}): { visitCount: number; bullets: string[] } {
  const { patient, visits, medications, allergies } = params;
  const bullets: string[] = [];

  const sortedVisits = [...visits].sort((a, b) => a.date.localeCompare(b.date));
  for (const visit of sortedVisits) {
    bullets.push(`${visit.diagnosis} diagnosed ${format(new Date(visit.date), 'MMMM yyyy')} (${visit.doctorName})`);
  }

  const sortedMeds = [...medications].sort((a, b) => a.startDate.localeCompare(b.startDate));
  for (const med of sortedMeds) {
    if (med.status === 'active') {
      bullets.push(`Currently taking ${med.medicineName} (${med.dosage}, ${med.frequency})`);
    } else if (med.status === 'discontinued') {
      bullets.push(
        `${med.medicineName} discontinued${med.endDate ? ` ${format(new Date(med.endDate), 'MMMM yyyy')}` : ''}${
          med.notes ? ` — ${med.notes}` : ''
        }`
      );
    } else {
      bullets.push(`Previously completed a course of ${med.medicineName}`);
    }
  }

  for (const allergy of allergies) {
    bullets.push(`Recorded ${allergy.severity} allergy to ${allergy.substance} (reaction: ${allergy.reaction})`);
  }

  if (sortedVisits.length > 0) {
    const last = sortedVisits[sortedVisits.length - 1];
    bullets.push(`Last consultation: ${format(new Date(last.date), 'd MMMM yyyy')}`);
  }

  void patient; // reserved for future use (e.g. age/comorbidity-aware phrasing server-side)
  return { visitCount: visits.length, bullets };
}

export function patientAgeLabel(patient: Patient): string {
  return `${differenceInYears(new Date(), new Date(patient.dateOfBirth))} years old`;
}
