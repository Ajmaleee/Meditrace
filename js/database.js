/* =========================================================================
   database.js
   One async API (`DB`) used by every page. Two interchangeable backends:

     - LOCAL   : browser localStorage, active today, zero setup.
     - FIRESTORE: real Cloud Firestore, activates the moment config.js
                  contains a real apiKey. No other file needs to change.

   To switch on Firestore later:
     1. Paste the project keys into js/config.js
     2. Reload the app. database.js detects FIREBASE_CONFIGURED and the
        exact same DB.getPatients() / DB.addMedicalRecord() / etc. calls
        will read and write real Firestore documents instead of
        localStorage. The collection layout it uses is documented next
        to each function below.
   ========================================================================= */

const DB = (() => {
  const LOCAL_KEY = "meditrace_db_v1";
  let backend = "local"; // 'local' | 'firestore'
  let fsApp, fsDb, fsFns; // populated only if firestore backend loads
  let readyResolve;
  const readyPromise = new Promise((res) => (readyResolve = res));

  // ---------------------------------------------------------------------
  // small utilities
  // ---------------------------------------------------------------------
  function uid(prefix) {
    return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  }
  function nowIso() {
    return new Date().toISOString();
  }
  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // ---------------------------------------------------------------------
  // LOCAL (localStorage) backend
  // ---------------------------------------------------------------------
  function localReadAll() {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error("MediTrace: corrupt local DB, resetting.", e);
      return null;
    }
  }
  function localWriteAll(data) {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
  }
  function localEnsureSeeded() {
    let data = localReadAll();
    if (!data) {
      data = clone(window.MEDITRACE_SEED);
      localWriteAll(data);
    }
    return data;
  }

  // ---------------------------------------------------------------------
  // FIRESTORE backend (dynamic ESM import — only touched if configured)
  // ---------------------------------------------------------------------
  async function firestoreInit() {
    const APP_URL = "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
    const FS_URL = "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
    const { initializeApp } = await import(APP_URL);
    const fs = await import(FS_URL);
    fsFns = fs;
    fsApp = initializeApp(firebaseConfig);
    fsDb = fs.getFirestore(fsApp);

    // Seed once if the `users` collection is completely empty, so a fresh
    // Firestore project behaves the same as the local demo on first run.
    const usersSnap = await fsFns.getDocs(fsFns.collection(fsDb, "users"));
    if (usersSnap.empty) {
      const seed = window.MEDITRACE_SEED;
      for (const key of ["users", "patients", "appointments", "records", "auditLog"]) {
        const colName = key === "records" ? "medicalRecords" : key;
        for (const item of seed[key]) {
          const { id, ...rest } = item;
          await fsFns.setDoc(fsFns.doc(fsDb, colName, id), rest);
        }
      }
    }
  }

  async function fsGetCollection(colName) {
    const snap = await fsFns.getDocs(fsFns.collection(fsDb, colName));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  async function fsGetDoc(colName, id) {
    const ref = fsFns.doc(fsDb, colName, id);
    const snap = await fsFns.getDoc(ref);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  }
  async function fsAddDoc(colName, data) {
    const id = uid(colName.slice(0, 3));
    await fsFns.setDoc(fsFns.doc(fsDb, colName, id), data);
    return { id, ...data };
  }
  async function fsUpdateDoc(colName, id, patch) {
    await fsFns.updateDoc(fsFns.doc(fsDb, colName, id), patch);
  }

  // ---------------------------------------------------------------------
  // init — chooses backend, waits until ready
  // ---------------------------------------------------------------------
  async function init() {
    if (typeof firebaseConfig !== "undefined" && FIREBASE_CONFIGURED) {
      try {
        await firestoreInit();
        backend = "firestore";
      } catch (err) {
        console.warn("MediTrace: Firestore init failed, falling back to local storage.", err);
        backend = "local";
        localEnsureSeeded();
      }
    } else {
      backend = "local";
      localEnsureSeeded();
    }
    readyResolve();
    return backend;
  }

  async function whenReady() {
    return readyPromise;
  }

  // ---------------------------------------------------------------------
  // AUDIT LOG — every view/create/edit of patient-linked data is recorded
  // here, keyed by patientId so a patient can see their own full trail.
  // Collection: auditLog
  // ---------------------------------------------------------------------
  async function logEvent({ patientId, actorId, actorName, actorRole, action, details }) {
    const entry = {
      patientId,
      actorId,
      actorName,
      actorRole,
      action, // 'view' | 'create' | 'edit' | 'login'
      details,
      timestamp: nowIso(),
    };
    if (backend === "local") {
      const data = localReadAll();
      entry.id = uid("aud");
      data.auditLog.unshift(entry);
      localWriteAll(data);
      return entry;
    }
    return fsAddDoc("auditLog", entry);
  }

  // ---------------------------------------------------------------------
  // USERS — collection: users
  // { id, username, password, role: 'patient'|'doctor'|'admin', name,
  //   hospital?, specialty?, patientId? (link to patients doc) }
  // ---------------------------------------------------------------------
  async function getUsers() {
    if (backend === "local") return clone(localReadAll().users);
    return fsGetCollection("users");
  }
  async function getUserByUsername(username) {
    const users = await getUsers();
    return users.find((u) => u.username.toLowerCase() === username.toLowerCase()) || null;
  }

  // ---------------------------------------------------------------------
  // Username generation — "firstname.x" from a full name, de-duplicated
  // against whatever usernames already exist.
  // ---------------------------------------------------------------------
  function slugPart(s) {
    return (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  }
  async function uniqueUsername(fullName) {
    const parts = (fullName || "user").trim().split(/\s+/).filter(Boolean);
    const first = slugPart(parts[0]) || "user";
    const lastInitial = parts.length > 1 ? slugPart(parts[parts.length - 1])[0] || "" : "";
    const base = lastInitial ? `${first}.${lastInitial}` : first;
    const existing = new Set((await getUsers()).map((u) => u.username.toLowerCase()));
    if (!existing.has(base)) return base;
    let n = 2;
    while (existing.has(`${base}${n}`)) n++;
    return `${base}${n}`;
  }

  // ---------------------------------------------------------------------
  // ADD DOCTOR — creates a `users` doc with role 'doctor'. Only an admin
  // is expected to call this (enforced by the calling page's Auth.requireRole).
  // Returns the created record, including the auto-generated username /
  // password so the admin can hand them to the doctor.
  // ---------------------------------------------------------------------
  async function addDoctor(doctorData, actor) {
    const username = doctorData.username && doctorData.username.trim() ? doctorData.username.trim() : await uniqueUsername(doctorData.name);
    const password = doctorData.password && doctorData.password.trim() ? doctorData.password.trim() : "Doctor@123";
    const record = {
      username,
      password,
      role: "doctor",
      name: doctorData.name.trim(),
      specialty: doctorData.specialty.trim(),
      hospital: doctorData.hospital.trim(),
      place: doctorData.place.trim(),
    };
    let created;
    if (backend === "local") {
      const data = localReadAll();
      created = { id: uid("usr"), ...record };
      data.users.push(created);
      localWriteAll(data);
    } else {
      created = await fsAddDoc("users", record);
    }
    await logEvent({
      patientId: null,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: "create",
      details: `Added new doctor account: ${record.name} (${record.specialty}) at ${record.hospital}`,
    });
    return created;
  }

  // ---------------------------------------------------------------------
  // ADD PATIENT — creates a `patients` doc plus a linked `users` doc
  // (role 'patient') so the patient can sign in. A doctor or admin calls
  // this when registering someone new to the system.
  // Returns { patient, user } — `user` carries the generated username /
  // password so the caller can hand them to the patient.
  // ---------------------------------------------------------------------
  async function addPatient(patientData, actor) {
    const patientRecord = {
      name: patientData.name.trim(),
      dob: patientData.dob,
      gender: patientData.gender,
      phone: (patientData.phone || "").trim(),
      place: patientData.place.trim(),
      bloodGroup: patientData.bloodGroup || "",
      allergies: patientData.allergies || [],
    };
    let createdPatient;
    if (backend === "local") {
      const data = localReadAll();
      createdPatient = { id: uid("pat"), ...patientRecord };
      data.patients.push(createdPatient);
      localWriteAll(data);
    } else {
      createdPatient = await fsAddDoc("patients", patientRecord);
    }

    const username = patientData.username && patientData.username.trim() ? patientData.username.trim() : await uniqueUsername(patientRecord.name);
    const password = patientData.password && patientData.password.trim() ? patientData.password.trim() : "Patient@123";
    const userRecord = { username, password, role: "patient", name: patientRecord.name, patientId: createdPatient.id };
    let createdUser;
    if (backend === "local") {
      const data = localReadAll();
      createdUser = { id: uid("usr"), ...userRecord };
      data.users.push(createdUser);
      localWriteAll(data);
    } else {
      createdUser = await fsAddDoc("users", userRecord);
    }

    await logEvent({
      patientId: createdPatient.id,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: "create",
      details: `Registered new patient: ${patientRecord.name}`,
    });
    return { patient: createdPatient, user: createdUser };
  }

  // ---------------------------------------------------------------------
  // PATIENTS — collection: patients
  // { id, name, dob, gender, phone, place, bloodGroup, allergies: [string] }
  // ---------------------------------------------------------------------
  async function getPatients() {
    if (backend === "local") return clone(localReadAll().patients);
    return fsGetCollection("patients");
  }
  async function getPatient(patientId) {
    if (backend === "local") {
      const data = localReadAll();
      return clone(data.patients.find((p) => p.id === patientId) || null);
    }
    return fsGetDoc("patients", patientId);
  }
  async function updatePatientProfile(patientId, patch, actor) {
    if (backend === "local") {
      const data = localReadAll();
      const p = data.patients.find((x) => x.id === patientId);
      if (!p) throw new Error("Patient not found");
      Object.assign(p, patch);
      localWriteAll(data);
    } else {
      await fsUpdateDoc("patients", patientId, patch);
    }
    await logEvent({
      patientId,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: "edit",
      details: `Updated profile fields: ${Object.keys(patch).join(", ")}`,
    });
  }

  // ---------------------------------------------------------------------
  // APPOINTMENTS — collection: appointments
  // { id, patientId, patientName, doctorId, doctorName, hospital, place,
  //   date, time, symptoms, notes, status: 'pending'|'confirmed'|'completed'|'cancelled',
  //   createdAt }
  // ---------------------------------------------------------------------
  async function getAppointments(filter = {}) {
    let list;
    if (backend === "local") {
      list = clone(localReadAll().appointments);
    } else {
      list = await fsGetCollection("appointments");
    }
    if (filter.patientId) list = list.filter((a) => a.patientId === filter.patientId);
    if (filter.doctorId) list = list.filter((a) => a.doctorId === filter.doctorId);
    return list.sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
  }
  async function addAppointment(appt, actor) {
    const record = { ...appt, status: "pending", createdAt: nowIso() };
    let created;
    if (backend === "local") {
      const data = localReadAll();
      created = { id: uid("apt"), ...record };
      data.appointments.unshift(created);
      localWriteAll(data);
    } else {
      created = await fsAddDoc("appointments", record);
    }
    await logEvent({
      patientId: appt.patientId,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: "create",
      details: `Booked appointment with ${appt.doctorName} at ${appt.hospital} on ${appt.date}`,
    });
    return created;
  }
  async function updateAppointment(apptId, patch, actor, patientId) {
    if (backend === "local") {
      const data = localReadAll();
      const a = data.appointments.find((x) => x.id === apptId);
      if (!a) throw new Error("Appointment not found");
      Object.assign(a, patch);
      localWriteAll(data);
    } else {
      await fsUpdateDoc("appointments", apptId, patch);
    }
    await logEvent({
      patientId,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: "edit",
      details: `Appointment ${apptId} updated: ${Object.entries(patch).map(([k, v]) => `${k}=${v}`).join(", ")}`,
    });
  }

  // ---------------------------------------------------------------------
  // MEDICAL RECORDS — collection: medicalRecords (stored as `records` key locally)
  // { id, patientId, doctorId, doctorName, hospital, place, date, time,
  //   symptoms: [string], diagnosis, allergiesNoted: [string],
  //   medicines: [{ name, dosage, frequency, duration, purpose }],
  //   notes, createdAt }
  // ---------------------------------------------------------------------
  async function getMedicalRecords(filter = {}) {
    let list;
    if (backend === "local") {
      list = clone(localReadAll().records);
    } else {
      list = await fsGetCollection("medicalRecords");
    }
    if (filter.patientId) list = list.filter((r) => r.patientId === filter.patientId);
    if (filter.doctorId) list = list.filter((r) => r.doctorId === filter.doctorId);
    return list.sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
  }
  async function addMedicalRecord(record, actor) {
    const full = { ...record, createdAt: nowIso() };
    let created;
    if (backend === "local") {
      const data = localReadAll();
      created = { id: uid("rec"), ...full };
      data.records.unshift(created);
      localWriteAll(data);
    } else {
      created = await fsAddDoc("medicalRecords", full);
    }
    await logEvent({
      patientId: record.patientId,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: "create",
      details: `Added case record at ${record.hospital}: ${record.diagnosis || record.symptoms.join(", ")}`,
    });
    return created;
  }

  // ---------------------------------------------------------------------
  // AUDIT LOG READ — collection: auditLog
  // ---------------------------------------------------------------------
  async function getAuditLog(filter = {}) {
    let list;
    if (backend === "local") {
      list = clone(localReadAll().auditLog);
    } else {
      list = await fsGetCollection("auditLog");
    }
    if (filter.patientId) list = list.filter((e) => e.patientId === filter.patientId);
    return list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  return {
    init,
    whenReady,
    get backend() {
      return backend;
    },
    getUsers,
    getUserByUsername,
    addDoctor,
    addPatient,
    getPatients,
    getPatient,
    updatePatientProfile,
    getAppointments,
    addAppointment,
    updateAppointment,
    getMedicalRecords,
    addMedicalRecord,
    getAuditLog,
    logEvent,
  };
})();
