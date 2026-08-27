/* =========================================================================
   seed-data.js — demo dataset used to pre-fill localStorage (or a brand
   new empty Firestore project) on first run.

   Names follow the common Kerala convention of first-name + single
   initial (e.g. "Arjun S") rather than spelled-out surnames, so no
   community/caste is implied by any name here.

   AUTH IS TEMPORARY: passwords are hardcoded in plain text purely so the
   app is usable before real authentication (e.g. Firebase Auth) is wired
   up. Replace js/auth.js's checkCredentials() with real auth later —
   nothing else in the app needs to change.
   ========================================================================= */

window.MEDITRACE_SEED = {
  users: [
    { id: "usr_admin", username: "admin", password: "Admin@123", role: "admin", name: "Admin User" },

    { id: "usr_doc1", username: "dr.arjun", password: "Doctor@123", role: "doctor",
      name: "Dr. Arjun S", specialty: "Cardiology",
      hospital: "Amrita Institute of Medical Sciences", place: "Kochi" },

    { id: "usr_doc2", username: "dr.meera", password: "Doctor@123", role: "doctor",
      name: "Dr. Meera R", specialty: "General Medicine",
      hospital: "Government Medical College Hospital", place: "Thiruvananthapuram" },

    { id: "usr_doc3", username: "dr.vishnu", password: "Doctor@123", role: "doctor",
      name: "Dr. Vishnu K", specialty: "Dermatology",
      hospital: "Baby Memorial Hospital", place: "Kozhikode" },

    { id: "usr_doc4", username: "dr.anjali", password: "Doctor@123", role: "doctor",
      name: "Dr. Anjali T", specialty: "Endocrinology",
      hospital: "Lakeshore Hospital", place: "Kochi" },

    { id: "usr_pat1", username: "sachin.m", password: "Patient@123", role: "patient",
      name: "Sachin M", patientId: "pat_1" },

    { id: "usr_pat2", username: "devika.s", password: "Patient@123", role: "patient",
      name: "Devika S", patientId: "pat_2" },

    { id: "usr_pat3", username: "nikhil.t", password: "Patient@123", role: "patient",
      name: "Nikhil T", patientId: "pat_3" },
  ],

  patients: [
    {
      id: "pat_1", name: "Sachin M", dob: "1988-03-14", gender: "Male",
      phone: "9847012345", place: "Thrissur", bloodGroup: "O+",
      allergies: ["Penicillin"],
    },
    {
      id: "pat_2", name: "Devika S", dob: "1995-07-22", gender: "Female",
      phone: "9846098765", place: "Kollam", bloodGroup: "B+",
      allergies: ["Sulfa drugs", "Dust"],
    },
    {
      id: "pat_3", name: "Nikhil T", dob: "1979-11-02", gender: "Male",
      phone: "9895011223", place: "Kozhikode", bloodGroup: "A+",
      allergies: [],
    },
  ],

  appointments: [
    {
      id: "apt_1", patientId: "pat_1", patientName: "Sachin M",
      doctorId: "usr_doc1", doctorName: "Dr. Arjun S",
      hospital: "Amrita Institute of Medical Sciences", place: "Kochi",
      date: "2026-09-02", time: "10:30",
      symptoms: "Occasional chest tightness after climbing stairs, mild breathlessness",
      notes: "", status: "confirmed", createdAt: "2026-08-20T05:12:00.000Z",
    },
    {
      id: "apt_2", patientId: "pat_2", patientName: "Devika S",
      doctorId: "usr_doc3", doctorName: "Dr. Vishnu K",
      hospital: "Baby Memorial Hospital", place: "Kozhikode",
      date: "2026-08-30", time: "16:00",
      symptoms: "Recurring skin rash on forearms, itching for a week",
      notes: "", status: "pending", createdAt: "2026-08-24T09:40:00.000Z",
    },
    {
      id: "apt_3", patientId: "pat_3", patientName: "Nikhil T",
      doctorId: "usr_doc2", doctorName: "Dr. Meera R",
      hospital: "Government Medical College Hospital", place: "Thiruvananthapuram",
      date: "2026-08-18", time: "09:15",
      symptoms: "Fever and body ache for 3 days",
      notes: "", status: "completed", createdAt: "2026-08-16T03:05:00.000Z",
    },
  ],

  // The whole point of the app, illustrated: Sachin was treated for an
  // infection in Thiruvananthapuram and given an antibiotic. Weeks later he
  // sees a cardiologist in Kochi for something unrelated — who now has no
  // excuse not to know about the earlier prescription and his penicillin
  // allergy.
  records: [
    {
      id: "rec_1", patientId: "pat_1",
      doctorId: "usr_doc2", doctorName: "Dr. Meera R",
      hospital: "Government Medical College Hospital", place: "Thiruvananthapuram",
      date: "2026-06-11", time: "11:00",
      symptoms: ["Sore throat", "Fever", "Difficulty swallowing"],
      diagnosis: "Acute bacterial tonsillitis",
      allergiesNoted: ["Penicillin"],
      medicines: [
        { name: "Azithromycin", dosage: "500 mg", frequency: "Once daily", duration: "3 days", purpose: "Antibiotic (penicillin substitute given documented allergy)" },
        { name: "Paracetamol", dosage: "650 mg", frequency: "Every 6 hours as needed", duration: "3 days", purpose: "Fever and throat pain relief" },
      ],
      notes: "Advised warm saline gargles. Review if fever persists beyond 3 days.",
      createdAt: "2026-06-11T05:35:00.000Z",
    },
    {
      id: "rec_2", patientId: "pat_1",
      doctorId: "usr_doc4", doctorName: "Dr. Anjali T",
      hospital: "Lakeshore Hospital", place: "Kochi",
      date: "2026-07-20", time: "15:20",
      symptoms: ["Fatigue", "Increased thirst", "Frequent urination"],
      diagnosis: "Type 2 Diabetes Mellitus (newly diagnosed)",
      allergiesNoted: ["Penicillin"],
      medicines: [
        { name: "Metformin", dosage: "500 mg", frequency: "Twice daily, after meals", duration: "Ongoing", purpose: "Blood sugar control" },
      ],
      notes: "HbA1c 7.8%. Dietary counselling given. Recheck HbA1c in 3 months.",
      createdAt: "2026-07-20T09:55:00.000Z",
    },
    {
      id: "rec_3", patientId: "pat_2",
      doctorId: "usr_doc3", doctorName: "Dr. Vishnu K",
      hospital: "Baby Memorial Hospital", place: "Kozhikode",
      date: "2026-08-05", time: "12:10",
      symptoms: ["Skin rash", "Itching"],
      diagnosis: "Contact dermatitis",
      allergiesNoted: ["Sulfa drugs", "Dust"],
      medicines: [
        { name: "Cetirizine", dosage: "10 mg", frequency: "Once daily at night", duration: "7 days", purpose: "Antihistamine for itching" },
        { name: "Calamine lotion", dosage: "Apply thin layer", frequency: "Twice daily", duration: "7 days", purpose: "Soothe irritated skin" },
      ],
      notes: "Suspected reaction to a new detergent. Avoid known irritant.",
      createdAt: "2026-08-05T06:45:00.000Z",
    },
    {
      id: "rec_4", patientId: "pat_3",
      doctorId: "usr_doc2", doctorName: "Dr. Meera R",
      hospital: "Government Medical College Hospital", place: "Thiruvananthapuram",
      date: "2026-08-18", time: "09:30",
      symptoms: ["Fever", "Body ache"],
      diagnosis: "Viral fever",
      allergiesNoted: [],
      medicines: [
        { name: "Paracetamol", dosage: "650 mg", frequency: "Every 6 hours as needed", duration: "5 days", purpose: "Fever and pain relief" },
        { name: "ORS", dosage: "1 sachet in 1 L water", frequency: "As needed", duration: "5 days", purpose: "Hydration" },
      ],
      notes: "Rest advised. Return if fever exceeds 102°F or persists beyond 5 days.",
      createdAt: "2026-08-18T04:10:00.000Z",
    },
  ],

  auditLog: [
    {
      id: "aud_seed_1", patientId: "pat_1", actorId: "usr_doc4", actorName: "Dr. Anjali T",
      actorRole: "doctor", action: "view",
      details: "Opened full medical history before consultation",
      timestamp: "2026-07-20T09:50:00.000Z",
    },
    {
      id: "aud_seed_2", patientId: "pat_1", actorId: "usr_doc2", actorName: "Dr. Meera R",
      actorRole: "doctor", action: "create",
      details: "Added case record at Government Medical College Hospital: Acute bacterial tonsillitis",
      timestamp: "2026-06-11T05:35:00.000Z",
    },
    {
      id: "aud_seed_3", patientId: "pat_1", actorId: "usr_admin", actorName: "Admin User",
      actorRole: "admin", action: "view",
      details: "Reviewed patient record during system audit",
      timestamp: "2026-08-10T07:00:00.000Z",
    },
  ],
};
