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
6. `npm run build && firebase deploy --only hosting` to deploy to Firebase Hosting (add a `firebase.json` pointing `public` at `dist` if one isn't already present).

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
  services/      firebase/, patients.ts, safety.ts, audit.ts — all data + business logic
  context/       AuthContext
  routes/        AppRoutes, ProtectedRoute (role-based guards)
  types/         shared domain types
  constants/     route paths, demo drug-interaction dataset
  theme/         MUI theme (palette, typography, component overrides)
```

Business logic is kept out of components: pages call functions in `services/`, which decide whether to hit Firestore or the in-memory demo store based on `USE_DEMO_DATA`. The medication safety engine (`services/safety.ts`) is a pure function — it takes a proposed medicine list, active medications, and allergies, and returns warnings; it has no UI or network dependency, so it's straightforward to unit test or later swap for a real interaction database.

### Why the demo interaction engine is deliberately simple

`src/constants/interactions.ts` holds five clearly-labelled, fictional example interaction rules. This is a rule-based, deterministic lookup — not a medical knowledge base and not an AI model — and the UI never claims otherwise. Every warning shown in the app says "clinical review recommended," never "safe" or "unsafe." A real deployment would replace this file with a licensed drug-interaction API reviewed by a clinical pharmacist; the calling code (`runSafetyCheck`) would not need to change shape.

## Demo flow (~4 minutes)

1. Sign in as **Dr. Rahul Menon**.
2. Open patient **P-10245** (Ananya Kumar) from the dashboard search.
3. Review the Overview tab: recorded Penicillin allergy, active Metformin, and the discontinued Amoxicillin (with the note explaining why).
4. Click **New consultation** → walk through Symptoms → Diagnosis → Prescription (try prescribing something containing "penicillin" to see the allergy warning fire) → Safety Check (acknowledge the warning) → Review → Save.
5. Return to the patient record — the new visit, prescription, and medication now appear in history.
6. Open **Access history** to see the logged action.
7. Sign out, sign in as **Dr. Priya Nair**, and open the same patient to show how the second doctor immediately sees the full history, including what the first doctor just did.

## Implemented

- Email/password auth with role-based routing (doctor / patient / admin)
- Patient search (masked results), patient profile with 7 tabs
- Medication timeline grouped by year with active/completed/discontinued states
- Allergy records with severity
- Multi-step consultation workflow (Material Stepper)
- Rule-based allergy + drug-interaction safety check with required doctor acknowledgement before saving
- Append-only access/audit log, visible to doctors, patients (their own record), and admins
- Patient portal: own history, medications, allergies, and who has accessed their record
- Admin overview: doctors, organizations, recent audit activity
- Firestore security rules enforcing the access model above
- Loading, empty, and error states throughout (no fabricated statistics)
- Responsive Material Design layout; light/restrained visual language with no gradients, glassmorphism, or decorative animation

## Not yet implemented (natural next steps)

- QR patient identification (`patientId`-only QR encoding, per the design brief) — the data model already supports looking up a patient purely by `patientId`, which is what a scanned QR would resolve to
- AI-generated clinical summary (clearly labelled "AI-generated — verify against original records," never editable, never a source of truth)
- PDF prescription/report export
- Cloud Function to make the visit+prescription+medication+log write atomic in production (currently sequential client writes; the demo-data path already applies them together)
- Full-text/fuzzy patient search backed by a search index (Firestore alone only supports the exact-ID and prefix-style matches used here)
- Consent/authorization records scoping which doctors can access which patients, beyond "any doctor in the organization"
- Real drug-interaction data source in place of the demo dataset
- Automated tests for `services/safety.ts` and Firestore rules (`@firebase/rules-unit-testing`)

## Important safety note

This prototype is a clinical **information and decision-support** tool. It never diagnoses, auto-prescribes, auto-adjusts dosage, or claims guaranteed medication safety — every warning is phrased as "potential issue detected, clinical review recommended," and the prescribing doctor's acknowledgement is required before any prescription with warnings can be saved. All patient data in this repository is fictional demo data.
