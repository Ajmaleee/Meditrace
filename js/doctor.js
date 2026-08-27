(async function () {
  await DB.init();
  const user = Auth.requireRole("doctor");
  if (!user) return;

  document.getElementById("backend-indicator").textContent =
    DB.backend === "firestore" ? " · live Firestore" : " · local demo data";
  document.getElementById("user-avatar").textContent = Auth.initials(user.name);
  document.getElementById("user-name").textContent = user.name;
  document.getElementById("logout-btn").addEventListener("click", Auth.logout);

  const usersInfo = (await DB.getUsers()).find((u) => u.id === user.id) || {};
  document.getElementById("doc-context").textContent = `${usersInfo.specialty || ""} · ${usersInfo.hospital || ""}, ${usersInfo.place || ""}`;

  function goto(section) {
    document.querySelectorAll(".page-section").forEach((s) => (s.style.display = s.id === `section-${section}` ? "" : "none"));
    document.querySelectorAll(".nav-item[data-section]").forEach((b) => b.classList.toggle("active", b.dataset.section === section));
    window.scrollTo(0, 0);
  }
  document.querySelectorAll(".nav-item[data-section], [data-goto]").forEach((btn) =>
    btn.addEventListener("click", () => goto(btn.dataset.section || btn.dataset.goto))
  );

  let allPatients = [], myAppointments = [], allRecords = [];

  async function loadAll() {
    [allPatients, myAppointments, allRecords] = await Promise.all([
      DB.getPatients(),
      DB.getAppointments({ doctorId: user.id }),
      DB.getMedicalRecords({ doctorId: user.id }),
    ]);
  }

  const statusLabel = { pending: "Pending", confirmed: "Confirmed", completed: "Completed", cancelled: "Cancelled" };
  const statusChipClass = { pending: "chip-warning", confirmed: "chip-primary", completed: "chip-success", cancelled: "" };

  // ---------------- Overview ----------------
  function renderOverview() {
    const today = new Date().toISOString().slice(0, 10);
    const todaysCount = myAppointments.filter((a) => a.date === today && a.status !== "cancelled").length;
    const pendingCount = myAppointments.filter((a) => a.status === "pending").length;
    const uniquePatients = new Set(myAppointments.map((a) => a.patientId).concat(allRecords.map((r) => r.patientId))).size;
    const stats = [
      { label: "Today's appointments", value: todaysCount },
      { label: "Awaiting confirmation", value: pendingCount },
      { label: "Patients you've treated", value: uniquePatients },
      { label: "Case records filed", value: allRecords.length },
    ];
    document.getElementById("stat-cards").innerHTML = stats
      .map((s) => `<div class="stat-card"><span class="stat-value">${s.value}</span><span class="stat-label">${s.label}</span></div>`)
      .join("");
    document.getElementById("greeting").textContent = `Welcome, ${user.name}`;

    const upcoming = myAppointments.filter((a) => a.date >= today && a.status !== "cancelled").slice(0, 5);
    document.getElementById("upcoming-list").innerHTML = upcoming.length
      ? upcoming.map(apptRow).join("")
      : `<div class="empty-state"><div class="empty-icon">📅</div><h3>Nothing scheduled</h3></div>`;
    wireApptActions(document.getElementById("upcoming-list"));
  }

  function apptRow(a) {
    return `<div class="card" style="margin-top:10px;">
      <div class="card-title-row">
        <div><span class="badge-dot ${a.status}"></span> <strong>${UI.escapeHtml(a.patientName)}</strong> <span class="text-faint text-sm">${UI.formatDate(a.date)} · ${UI.formatTime(a.time)}</span></div>
        <span class="chip ${statusChipClass[a.status]}">${statusLabel[a.status]}</span>
      </div>
      <p class="text-sm text-variant">${UI.escapeHtml(a.symptoms)}</p>
      <div class="flex gap-8">
        ${a.status === "pending" ? `<button class="btn btn-tonal btn-sm" data-confirm="${a.id}" data-pid="${a.patientId}">Confirm</button><button class="btn btn-outlined btn-sm" data-cancel="${a.id}" data-pid="${a.patientId}">Decline</button>` : ""}
        ${a.status === "confirmed" ? `<button class="btn btn-tonal btn-sm" data-complete="${a.id}" data-pid="${a.patientId}">Mark completed</button>` : ""}
        <button class="btn btn-text btn-sm" data-view-patient="${a.patientId}">View patient history</button>
      </div>
    </div>`;
  }

  function wireApptActions(scope) {
    scope.querySelectorAll("[data-confirm]").forEach((b) => b.addEventListener("click", () => updateAppt(b.dataset.confirm, b.dataset.pid, { status: "confirmed" })));
    scope.querySelectorAll("[data-cancel]").forEach((b) => b.addEventListener("click", () => updateAppt(b.dataset.cancel, b.dataset.pid, { status: "cancelled" })));
    scope.querySelectorAll("[data-complete]").forEach((b) => b.addEventListener("click", () => updateAppt(b.dataset.complete, b.dataset.pid, { status: "completed" })));
    scope.querySelectorAll("[data-view-patient]").forEach((b) =>
      b.addEventListener("click", () => {
        goto("lookup");
        document.getElementById("patient-search").value = "";
        renderPatientCards();
        showPatientDetail(b.dataset.viewPatient);
      })
    );
  }

  async function updateAppt(id, patientId, patch) {
    await DB.updateAppointment(id, patch, user, patientId);
    UI.toast("Appointment updated.");
    await loadAll();
    renderOverview();
    renderAppointments();
  }

  // ---------------- Appointments queue ----------------
  function renderAppointments() {
    const q = (document.getElementById("appt-search").value || "").toLowerCase();
    const list = myAppointments.filter((a) => a.patientName.toLowerCase().includes(q));
    const el = document.getElementById("appointments-list");
    el.innerHTML = list.length ? list.map(apptRow).join("") : `<div class="card empty-state"><div class="empty-icon">📅</div><h3>No matching appointments</h3></div>`;
    wireApptActions(el);
  }
  document.getElementById("appt-search").addEventListener("input", renderAppointments);

  // ---------------- Patient lookup ----------------
  function renderPatientCards() {
    const q = (document.getElementById("patient-search").value || "").toLowerCase();
    const list = allPatients.filter((p) => p.name.toLowerCase().includes(q) || p.place.toLowerCase().includes(q));
    document.getElementById("patient-cards").innerHTML = list
      .map(
        (p) => `<div class="card">
          <div class="card-title-row">
            <div><strong>${UI.escapeHtml(p.name)}</strong><div class="text-sm text-faint">${UI.escapeHtml(p.place)} · ${UI.calcAge(p.dob)} yrs · ${UI.escapeHtml(p.gender)}</div></div>
            <button class="btn btn-tonal btn-sm" data-open-patient="${p.id}">Open</button>
          </div>
          ${p.allergies && p.allergies.length ? `<div>${p.allergies.map((a) => `<span class="chip chip-allergy" style="margin:2px 4px 0 0;">${UI.escapeHtml(a)}</span>`).join("")}</div>` : `<span class="text-sm text-faint">No known allergies</span>`}
        </div>`
      )
      .join("") || `<div class="card empty-state"><div class="empty-icon">🔎</div><h3>No patients match</h3></div>`;
    document.getElementById("patient-cards").querySelectorAll("[data-open-patient]").forEach((b) =>
      b.addEventListener("click", () => showPatientDetail(b.dataset.openPatient))
    );
  }
  document.getElementById("patient-search").addEventListener("input", renderPatientCards);

  function medicineList(medicines) {
    if (!medicines || !medicines.length) return `<p class="text-sm text-faint">No medicines prescribed at this visit.</p>`;
    return `<ul class="med-list">${medicines
      .map((m) => `<li class="med-item"><div><div class="med-name">${UI.escapeHtml(m.name)}</div><div class="text-sm text-faint">${UI.escapeHtml(m.purpose || "")}</div></div><div class="med-dose">${UI.escapeHtml(m.dosage)} · ${UI.escapeHtml(m.frequency)} · ${UI.escapeHtml(m.duration)}</div></li>`)
      .join("")}</ul>`;
  }

  function timelineEntry(r) {
    const flagged = r.allergiesNoted && r.allergiesNoted.length;
    return `<div class="timeline-entry ${flagged ? "entry-alert" : ""}">
      <div class="timeline-card">
        <div class="timeline-meta"><span>${UI.formatDate(r.date)}</span><span>·</span><span>${UI.formatTime(r.time)}</span></div>
        <h4>${UI.escapeHtml(r.diagnosis || "Consultation")}</h4>
        <div class="hospital-line">${UI.escapeHtml(r.doctorName)} · ${UI.escapeHtml(r.hospital)}, ${UI.escapeHtml(r.place)}</div>
        <div style="margin-bottom:8px;">${(r.symptoms || []).map((s) => `<span class="chip" style="margin:0 6px 6px 0;">${UI.escapeHtml(s)}</span>`).join("")}</div>
        ${medicineList(r.medicines)}
        ${r.notes ? `<p class="text-sm text-variant" style="margin-top:10px;">${UI.escapeHtml(r.notes)}</p>` : ""}
      </div>
    </div>`;
  }

  async function showPatientDetail(patientId) {
    const patient = allPatients.find((p) => p.id === patientId);
    const records = await DB.getMedicalRecords({ patientId });
    await DB.logEvent({ patientId, actorId: user.id, actorName: user.name, actorRole: "doctor", action: "view", details: "Viewed full medical history" });

    document.getElementById("patient-detail").innerHTML = `
      <div class="card" style="margin-top:16px;">
        <div class="card-title-row">
          <div>
            <h3 style="margin-bottom:2px;">${UI.escapeHtml(patient.name)}</h3>
            <span class="text-sm text-faint">${UI.escapeHtml(patient.place)} · ${UI.calcAge(patient.dob)} yrs · ${UI.escapeHtml(patient.gender)} · Blood group ${UI.escapeHtml(patient.bloodGroup || "—")} · ${UI.escapeHtml(patient.phone || "—")}</span>
          </div>
          <button class="btn btn-filled btn-sm" data-add-record-for="${patient.id}">＋ Add case record</button>
        </div>
        ${patient.allergies && patient.allergies.length ? `<div class="banner banner-warning" style="margin-top:10px;"><span class="banner-icon">⚠</span><div><strong>Known allergies</strong>${patient.allergies.map((a) => `<span class="chip chip-allergy" style="margin:4px 6px 0 0;">${UI.escapeHtml(a)}</span>`).join("")}</div></div>` : ""}
        <h4 style="margin-top:16px;">Care timeline (all hospitals)</h4>
        <div class="timeline">${records.length ? records.map(timelineEntry).join("") : `<p class="text-faint text-sm">No visits recorded yet.</p>`}</div>
      </div>`;
    document.getElementById("patient-detail").querySelector("[data-add-record-for]").addEventListener("click", (e) => {
      goto("newrecord");
      document.getElementById("r-patient").value = e.target.dataset.addRecordFor;
      onPatientPickedForRecord();
    });
  }

  // ---------------- Add case record ----------------
  function populateRecordPatientSelect() {
    const sel = document.getElementById("r-patient");
    sel.innerHTML = `<option value="">Select a patient…</option>` + allPatients.map((p) => `<option value="${p.id}">${UI.escapeHtml(p.name)} — ${UI.escapeHtml(p.place)}</option>`).join("");
  }

  function checkAllergyAgainst(medName, allergies) {
    if (!medName || !allergies || !allergies.length) return null;
    const lower = medName.toLowerCase();
    const hit = allergies.find((a) => lower.includes(a.toLowerCase()) || a.toLowerCase().includes(lower));
    return hit || null;
  }

  function refreshMedicineAllergyWarnings() {
    const sel = document.getElementById("r-patient");
    const patient = allPatients.find((p) => p.id === sel.value);
    document.querySelectorAll(".medicine-row").forEach((row) => {
      const nameVal = row.querySelector(".med-name-input").value;
      const warnEl = row.querySelector(".med-allergy-warn");
      const hit = patient ? checkAllergyAgainst(nameVal, patient.allergies) : null;
      warnEl.innerHTML = hit
        ? `<div class="banner banner-error" style="margin:8px 0 0;padding:8px 12px;"><span class="banner-icon">⚠</span><div>This patient has a recorded allergy to <strong>${UI.escapeHtml(hit)}</strong> — double-check before prescribing ${UI.escapeHtml(nameVal)}.</div></div>`
        : "";
    });
  }

  function onPatientPickedForRecord() {
    const sel = document.getElementById("r-patient");
    const patient = allPatients.find((p) => p.id === sel.value);
    const banner = document.getElementById("r-allergy-banner");
    banner.innerHTML =
      patient && patient.allergies && patient.allergies.length
        ? `<div class="banner banner-warning"><span class="banner-icon">⚠</span><div><strong>${UI.escapeHtml(patient.name)}'s known allergies</strong>${patient.allergies.map((a) => `<span class="chip chip-allergy" style="margin:4px 6px 0 0;">${UI.escapeHtml(a)}</span>`).join("")}</div></div>`
        : patient
        ? `<div class="banner banner-success"><span class="banner-icon">✓</span><div>No known allergies on file for ${UI.escapeHtml(patient.name)}.</div></div>`
        : "";
    refreshMedicineAllergyWarnings();
  }
  document.getElementById("r-patient").addEventListener("change", onPatientPickedForRecord);

  const medRowsEl = document.getElementById("medicine-rows");
  const medTemplate = document.getElementById("medicine-row-template");
  function addMedicineRow() {
    const node = medTemplate.content.cloneNode(true);
    const row = node.querySelector(".medicine-row");
    row.querySelector("[data-remove]").addEventListener("click", () => { row.remove(); });
    row.querySelector(".med-name-input").addEventListener("input", refreshMedicineAllergyWarnings);
    medRowsEl.appendChild(row);
  }
  document.getElementById("add-medicine").addEventListener("click", addMedicineRow);

  document.getElementById("record-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const patientId = document.getElementById("r-patient").value;
    if (!patientId) { UI.toast("Please select a patient first."); return; }
    const patient = allPatients.find((p) => p.id === patientId);
    const medicines = [...document.querySelectorAll(".medicine-row")].map((row) => ({
      name: row.querySelector(".med-name-input").value.trim(),
      dosage: row.querySelector(".med-dosage-input").value.trim(),
      frequency: row.querySelector(".med-freq-input").value.trim(),
      duration: row.querySelector(".med-duration-input").value.trim(),
      purpose: row.querySelector(".med-purpose-input").value.trim(),
    }));

    const saveBtn = document.getElementById("save-record-btn");
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving…";
    try {
      await DB.addMedicalRecord(
        {
          patientId,
          doctorId: user.id,
          doctorName: user.name,
          hospital: usersInfo.hospital,
          place: usersInfo.place,
          date: document.getElementById("r-date").value,
          time: document.getElementById("r-time").value,
          symptoms: document.getElementById("r-symptoms").value.split(",").map((s) => s.trim()).filter(Boolean),
          diagnosis: document.getElementById("r-diagnosis").value.trim(),
          allergiesNoted: patient.allergies || [],
          medicines,
          notes: document.getElementById("r-notes").value.trim(),
        },
        user
      );
      UI.toast("Case record saved to the patient's shared history.");
      document.getElementById("record-form").reset();
      medRowsEl.innerHTML = "";
      addMedicineRow();
      document.getElementById("r-allergy-banner").innerHTML = "";
      await loadAll();
      renderOverview();
      renderAppointments();
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "Save case record";
    }
  });

  await loadAll();
  populateRecordPatientSelect();
  addMedicineRow();
  renderOverview();
  renderAppointments();
  renderPatientCards();
})();
