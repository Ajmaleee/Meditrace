import { DEMO_DRUG_INTERACTIONS, normalizeDrugName } from '@/constants/interactions';
import type { Allergy, Medication, SafetyWarning } from '@/types';

/**
 * Deterministic, rule-based safety check for the prototype.
 *
 * This intentionally does NOT call any external medical knowledge source and
 * does NOT infer anything the reviewer can't trace back to a specific rule.
 * It is a decision-support aid: results must be reviewed and acknowledged by
 * a clinician before a prescription is saved (see SafetyCheckPanel).
 */
export function runSafetyCheck(params: {
  proposedMedicines: string[];
  activeMedications: Medication[];
  allergies: Allergy[];
}): SafetyWarning[] {
  const { proposedMedicines, activeMedications, allergies } = params;
  const warnings: SafetyWarning[] = [];

  const normalizedProposed = proposedMedicines.map(normalizeDrugName).filter(Boolean);
  const normalizedActive = activeMedications
    .filter((m) => m.status === 'active')
    .map((m) => normalizeDrugName(m.medicineName));

  // 1. Allergy conflicts — simple substring match against recorded allergy substances.
  for (const proposed of normalizedProposed) {
    for (const allergy of allergies) {
      const substance = normalizeDrugName(allergy.substance);
      if (proposed.includes(substance) || substance.includes(proposed)) {
        warnings.push({
          id: `allergy-${allergy.allergyId}-${proposed}`,
          type: 'allergy',
          severity: 'critical',
          title: `Recorded allergy: ${allergy.substance}`,
          description: `Patient has a documented ${allergy.severity} allergy to ${allergy.substance} (reaction: ${allergy.reaction}). The proposed medication may be related to this substance.`,
          recommendation: 'Potential allergy conflict detected. Clinical review recommended before proceeding.',
          relatedMedicine: proposed,
        });
      }
    }
  }

  // 2. Drug-drug interactions — check proposed medicines against each other
  //    and against the patient's currently active medications.
  const allCombinationsToCheck: Array<[string, string]> = [];
  for (let i = 0; i < normalizedProposed.length; i += 1) {
    for (let j = i + 1; j < normalizedProposed.length; j += 1) {
      allCombinationsToCheck.push([normalizedProposed[i], normalizedProposed[j]]);
    }
    for (const active of normalizedActive) {
      allCombinationsToCheck.push([normalizedProposed[i], active]);
    }
  }

  for (const [a, b] of allCombinationsToCheck) {
    const rule = DEMO_DRUG_INTERACTIONS.find(
      (r) =>
        (normalizeDrugName(r.drugA) === a && normalizeDrugName(r.drugB) === b) ||
        (normalizeDrugName(r.drugA) === b && normalizeDrugName(r.drugB) === a)
    );
    if (rule) {
      warnings.push({
        id: `interaction-${rule.drugA}-${rule.drugB}-${a}-${b}`,
        type: 'interaction',
        severity: rule.severity,
        title: `Potential interaction: ${rule.drugA} + ${rule.drugB}`,
        description: rule.description,
        recommendation: rule.recommendation,
      });
    }
  }

  // De-duplicate by id, sort critical first.
  const seen = new Set<string>();
  const unique = warnings.filter((w) => (seen.has(w.id) ? false : (seen.add(w.id), true)));
  const severityRank: Record<SafetyWarning['severity'], number> = { critical: 0, caution: 1, info: 2 };
  return unique.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
}
