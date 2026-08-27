# MediTrace

A secure longitudinal patient clinical-history and medication-management platform — an SIH hackathon prototype built to look and behave like a real clinical product, not a generated dashboard.

MediTrace lets authorized doctors see a patient's medication history, allergies, and past visits regardless of which hospital originally recorded them, and checks new prescriptions against recorded allergies and a small demo drug-interaction dataset before they're saved. Every access is logged.

## Running it locally

```bash
npm install
npm run dev
```

The app opens at `http://localhost:5173` and runs entirely on **in-memory demo data** (`src/services/mockData.ts`) by default — no Firebase project is required to try it. Sign in using any of the demo accounts shown on the login screen (password for all of them: `demo1234`).

## Connecting a real Firebase project

1. Create a Firebase project and enable **Authentication (Email/Password)** and **Cloud Firestore**.
2. Copy `.env.example` to `.env.local` and fill in the values from Project settings → General → Your apps.
3. Set `VITE_USE_DEMO_DATA=false` in `.env.local`.
4. Deploy the security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```
   (`firestore.rules` in the repo root — see the file for the access model it enforces.)
5. Create `users/{uid}` documents for each account with `role`, `organizationId`/`doctorId`/`patientId` as appropriate — see the schema below. The app reads this document immediately after Firebase Auth sign-in to determine role-based routing.
6. `npm run build && firebase deploy --only hosting,firestore` deploys the app and rules using the included `firebase.json`.
7. (Optional) `cd functions && npm install && npm run deploy` deploys the `generateClinicalSummary` callable function stub — see [Why the clinical summary is a template, not a live model call](#why-the-clinical-summary-is-a-template-not-a-live-model-call) before wiring in a real model.

Every data-access function in `src/services/` is written to work identically against demo data or real Firestore — nothing in the UI layer needs to change when you switch.

## Firestore schema

```
users/{userId}            { name, email, role, organizationId?, doctorId?, patientId?, status, createdAt }
organizations/{orgId}     { name, type, city }
doctors/{doctorId}        { userId, name, specialty, organizationId, registrationNumber }
patients/{patientId}      { name, dateOfBirth, gender, phone, email?, bloodGroup, address?, emergencyContact?, createdAt, updatedAt }
allergies/{id}            { patientId, substance, reaction, severity, notes?, recordedBy, createdAt }
medications/{id}          { patientId, medicineName, genericName, dosage, frequency, route, startDate, endDate?, status, prescribedBy, prescribedByName, prescriptionId?, notes?, createdAt }
visits/{id}                { patientId, doctorId, doctorName, organizationId, organizationName, date, diagnosis, symptoms, notes, createdAt }
prescriptions/{id}        { patientId, visitId, doctorId, doctorName, items[], acknowledgedWarnings, createdAt }
access_logs/{id}          { patientId, doctorId, doctorName, organizationId, action, timestamp }
drug_interactions/{id}    { drugA, drugB, severity, description, recommendation }
```

Security rules (`firestore.rules`) enforce: patients can only read documents referencing their own `patientId`; doctors can read/write clinical documents but never delete them; access logs are create-only (append-only audit trail); admins manage users/doctors/organizations but do not get blanket clinical-data access. See the comments at the top of that file for the full reasoning.

## Architecture

```
src/
  components/    layout, patient, safety, common — presentational, reusable
  pages/         one file per screen, organized by role/workflow
  services/      firebase/, patients.ts, safety.ts, audit.ts, summary.ts — all data + business logic
  context/       AuthContext, NotificationContext
  routes/        AppRoutes, ProtectedRoute (role-based guards)
  types/         shared domain types
  constants/     route paths, demo drug-interaction dataset
  theme/         MUI theme (palette, typography, component overrides)
  utils/         pdf.ts (prescription export), errorMessages.ts
functions/       optional Cloud Functions codebase — production home for a real LLM-backed clinical summary
```

Business logic is kept out of components: pages call functions in `services/`, which decide whether to hit Firestore or the in-memory demo store based on `USE_DEMO_DATA`. The medication safety engine (`services/safety.ts`) is a pure function — it takes a proposed medicine list, active medications, and allergies, and returns warnings; it has no UI or network dependency, so it's straightforward to unit test or later swap for a real interaction database.

### Why the demo interaction engine is deliberately simple

`src/constants/interactions.ts` holds five clearly-labelled, fictional example interaction rules. This is a rule-based, deterministic lookup — not a medical knowledge base and not an AI model — and the UI never claims otherwise. Every warning shown in the app says "clinical review recommended," never "safe" or "unsafe." A real deployment would replace this file with a licensed drug-interaction API reviewed by a clinical pharmacist; the calling code (`runSafetyCheck`) would not need to change shape.

### Why the clinical summary is a template, not a live model call

`services/summary.ts` restates facts already present in the patient's own visits/medications/allergies — it never infers a diagnosis. The UI always shows it behind an "AI-generated — verify against original records" banner and never writes it back into the record. `functions/src/index.ts` is the documented seam for plugging in a real LLM server-side (so an API key never ships to the browser) without changing what the client expects back.

## Demo flow (~4 minutes)

1. Sign in as **Dr. Rahul Menon**.
2. Open patient **P-10245** (Ananya Kumar) from the dashboard search, or via **Scan patient** using the QR code generated from that patient's profile.
3. Review the Overview tab: recorded Penicillin allergy, active Metformin, the discontinued Amoxicillin (with the note explaining why), and generate the clinical summary.
4. Click **New consultation** → walk through Symptoms → Diagnosis → Prescription (try prescribing something containing "penicillin" to see the allergy warning fire) → Safety Check (acknowledge the warning) → Review → Save.
5. Download the prescription PDF from the confirmation screen.
6. Return to the patient record — the new visit, prescription, and medication now appear in history.
7. Open **Access history** to see the logged action.
8. Sign out, sign in as **Dr. Priya Nair**, and open the same patient to show how the second doctor immediately sees the full history, including what the first doctor just did.

## Implemented

- Email/password auth with role-based routing (doctor / patient / admin)
- Patient search (masked results), patient profile with 7 tabs
- Medication timeline grouped by year with active/completed/discontinued states
- Allergy records with severity
- Multi-step consultation workflow (Material Stepper, vertical on mobile)
- Rule-based allergy + drug-interaction safety check with required doctor acknowledgement before saving
- Append-only access/audit log, visible to doctors, patients (their own record), and admins
- Patient portal: own history, medications, allergies, and who has accessed their record
- Admin overview: doctors, organizations, recent audit activity
- Firestore security rules enforcing the access model above, plus composite indexes in `firestore.indexes.json`
- QR patient identification: `PatientQrCode` encodes only the Patient ID (never medical data); `ScanPatientPage` resolves a scanned or manually entered ID to a record via camera (`html5-qrcode`) with a manual-entry fallback
- Clinical summary: on-demand, template-based bullet summary of a patient's existing visits/medications/allergies, always shown behind an "AI-generated — verify against original records" banner; `functions/src/index.ts` has the production callable-function stub for swapping in a real LLM call server-side without changing the client contract
- Prescription PDF export (`jspdf` + `autotable`), available from the Prescriptions tab and the consultation save confirmation screen
- Global notification system (`NotificationContext`) and a top-level `ErrorBoundary` so failures surface as a readable message instead of a blank screen; raw Firebase error codes are mapped to plain language in `utils/errorMessages.ts`
- Loading, empty, and error states throughout (skeleton loaders on the patient profile; no fabricated statistics)
- Responsive Material Design layout; keyboard-operable account menu, skip-to-content link, and a light/restrained visual language with no gradients, glassmorphism, or decorative animation
- `firebase.json` + `functions/` scaffold for deploying hosting, Firestore rules/indexes, and the summary function together

## Not yet implemented (natural next steps)

- Wiring a real LLM provider into `functions/src/index.ts` (the stub currently returns the same deterministic bullets as the client-side demo template, so the callable has a working response shape to build against)
- Making the visit+prescription+medication+log write atomic in production via a Cloud Function transaction (currently sequential client writes; the demo-data path already applies them together)
- Full-text/fuzzy patient search backed by a search index (Firestore alone only supports the exact-ID match used here)
- Consent/authorization records scoping which doctors can access which patients, beyond "any doctor in the organization"
- Real drug-interaction data source in place of the demo dataset in `constants/interactions.ts`
- Automated tests for `services/safety.ts` and the Firestore rules (`@firebase/rules-unit-testing`)
- CI pipeline (lint + typecheck + rules tests) before Firebase deploy

## Important safety note

This prototype is a clinical **information and decision-support** tool. It never diagnoses, auto-prescribes, auto-adjusts dosage, or claims guaranteed medication safety — every warning is phrased as "potential issue detected, clinical review recommended," and the prescribing doctor's acknowledgement is required before any prescription with warnings can be saved. All patient data in this repository is fictional demo data.
