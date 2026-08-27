# CareContinuum

A patient case-taking system built to solve one specific problem: a patient
sees Doctor A, gets a prescription, then sees Doctor B for something
unrelated — and Doctor B has no idea what Doctor A prescribed, or what the
patient is allergic to. CareContinuum keeps one shared, cross-hospital
record so that history travels with the patient.

Plain HTML/CSS/JS, no build step, no framework. Open `index.html` and it
works today, using a small demo dataset stored in the browser. Point it at
a real Firestore project whenever you're ready and it switches over with
no other code changes.

## Running it

Just open `index.html` in a browser, or serve the folder statically:

```
python3 -m http.server 8000
```

then visit `http://localhost:8000`.

## Sign in (temporary, hardcoded credentials)

Real authentication isn't wired up yet, as requested — passwords are
hardcoded in `js/seed-data.js` for now so the app is usable. Replace
`Auth.login()`'s check in `js/auth.js` with real auth later (Firebase Auth
is the natural fit alongside Firestore); every page only calls
`Auth.currentUser()` / `Auth.login()` / `Auth.logout()`, so nothing else
needs to change.

| Role    | Username    | Password      |
|---------|-------------|---------------|
| Patient | `sachin.m`  | `Patient@123` |
| Patient | `devika.s`  | `Patient@123` |
| Doctor  | `dr.arjun`  | `Doctor@123`  |
| Doctor  | `dr.meera`  | `Doctor@123`  |
| Admin   | `admin`     | `Admin@123`   |

The login screen also shows these credentials inline.

## Connecting real Firestore

1. Create a Firestore project in the Firebase console.
2. Open `js/config.js` and paste in your project's config values.
3. Reload the app. `js/database.js` detects the real keys and every
   `DB.*` call (get patients, add a case record, read the audit log, etc.)
   starts reading and writing real Firestore documents instead of
   `localStorage` — no other file needs to change.
4. On a brand-new empty project, CareContinuum seeds the same demo data
   you see locally, so the two environments start out identical.

Collections used: `users`, `patients`, `appointments`, `medicalRecords`,
`auditLog`. Field shapes are documented directly above each function in
`js/database.js`.

**Before going anywhere near real patient data:** the current setup has no
real authentication and no Firestore security rules, so anyone with the
API key could read or write everything. Add Firebase Auth and
role-based Firestore security rules (a patient can read only their own
documents; a doctor can read patients but only write records they
authored; only admin can read `auditLog` in full) before this touches
real people.

## What's in each role

- **Patient** — a cross-hospital care timeline with medicines explained in
  plain language, appointment booking, and a log of exactly who has
  viewed or edited their record and when.
- **Doctor** — an appointment queue, a searchable patient lookup that
  surfaces allergies and full history before a consult, and a case-record
  form that flags a name-based allergy conflict as medicines are typed in.
- **Admin** — every patient, every doctor, every appointment, and the full
  system-wide audit log, filterable and searchable.

## Structure

```
index.html          Login
patient.html         Patient dashboard
doctor.html          Doctor dashboard
admin.html           Admin dashboard
css/style.css        Material-style design system (no gradients/glass/neon)
js/config.js          Firebase config placeholder
js/seed-data.js       Demo dataset (Kerala names, no caste-signalling surnames)
js/database.js        DB abstraction: Firestore when configured, localStorage otherwise
js/auth.js             Temporary hardcoded-credential auth + session handling
js/ui.js                Shared formatting/toast helpers
js/login.js, js/patient.js, js/doctor.js, js/admin.js   Per-page logic
```

## Design notes

Material Design 3 token system: teal/blue primary for a clinical, calm
feel, amber for pending/caution states, red reserved for allergy and
critical flags. Elevation is done with layered box-shadows only — no
gradients, no glassmorphism, no glow. Roboto for UI text, Roboto Mono for
record IDs, timestamps, and the audit log, so scannable data reads
differently from prose. Fully responsive: a side nav on desktop collapses
to a bottom nav below 800px, and the patient/doctor/admin layouts all
reflow to a single column on phones.
