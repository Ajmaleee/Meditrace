import type { DrugInteractionRule } from '@/types';

/**
 * DEMO DATASET — NOT REAL MEDICAL DATA.
 *
 * This is a small, clearly-labelled, deterministic rule set used to power
 * the prototype's medication safety check. It exists to demonstrate the
 * *workflow* of interaction checking (normalize -> compare -> warn ->
 * require acknowledgement), not to provide clinically valid interaction
 * data. A production system would source this from a licensed drug
 * interaction database (e.g. a pharmacy compendium API) reviewed by a
 * clinical pharmacist.
 */
export const DEMO_DRUG_INTERACTIONS: DrugInteractionRule[] = [
  {
    drugA: 'warfarin',
    drugB: 'aspirin',
    severity: 'critical',
    description: 'Combined use may substantially increase bleeding risk.',
    recommendation: 'Avoid combination unless specifically directed by a specialist. Clinical review required.',
  },
  {
    drugA: 'metformin',
    drugB: 'contrast dye',
    severity: 'caution',
    description: 'Concurrent use has been associated with rare risk of lactic acidosis in patients with renal impairment.',
    recommendation: 'Consider holding metformin around contrast administration. Clinical review recommended.',
  },
  {
    drugA: 'lisinopril',
    drugB: 'ibuprofen',
    severity: 'caution',
    description: 'NSAIDs may reduce the antihypertensive effect and affect renal function.',
    recommendation: 'Monitor blood pressure and renal function if co-prescribed.',
  },
  {
    drugA: 'sertraline',
    drugB: 'tramadol',
    severity: 'critical',
    description: 'Combined serotonergic activity may increase risk of serotonin syndrome.',
    recommendation: 'Avoid combination. Clinical review required before proceeding.',
  },
  {
    drugA: 'simvastatin',
    drugB: 'clarithromycin',
    severity: 'caution',
    description: 'May increase statin plasma concentration and risk of myopathy.',
    recommendation: 'Consider temporary statin suspension during antibiotic course.',
  },
];

/** Normalizes a medicine name for comparison (case/whitespace only — demo scope). */
export function normalizeDrugName(name: string): string {
  return name.trim().toLowerCase();
}
