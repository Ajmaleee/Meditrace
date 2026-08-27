(async function () {
  await DB.init();
  const user = Auth.requireRole("admin");
  if (!user) return;

  document.getElementById("backend-indicator").textContent =
    DB.backend === "firestore" ? " · live Firestore" : " · local demo data";
  document.getElementById("user-avatar").textContent = Auth.initials(user.name);
  document.getElementById("user-name").textContent = user.name;
  document.getElementById("logout-btn").addEventListener("click", Auth.logout);

  function goto(section) {
    document.querySelectorAll(".page-section").forEach((s) => (s.style.display = s.id === `section-${section}` ? "" : "none"));
    document.querySelectorAll(".nav-item[data-section]").forEach((b) => b.classList.toggle("active", b.dataset.section === section));
    window.scrollTo(0, 0);
  }
  document.querySelectorAll(".nav-item[data-section], [data-goto]").forEach((btn) =>
    btn.addEventListener("click", () => goto(btn.dataset.section || btn.dataset.goto))
  );

  let users, patients, appointments, records, auditLog;

  async function loadAll() {
    [users, patients, appointments, records, auditLog] = await Promise.all([
      DB.getUsers(),
      DB.getPatients(),
      DB.getAppointments(),
      DB.getMedicalRecords(),
      DB.getAuditLog(),
    ]);
  }

  const doctors = () => users.filter((u) => u.role === "doctor");
  const statusChipClass = { pending: "chip-warning", confirmed: "chip-primary", completed: "chip-success", cancelled: "" };
  const statusLabel = { pending: "Pending", confirmed: "Confirmed", completed: "Completed", cancelled: "Cancelled" };

  function auditRow(e) {
    return `<div class="audit-row action-${e.action}">
      <div class="audit-icon">${UI.actionIcon(e.action)}</div>
      <div style="flex:1;">
        <div><strong>${UI.escapeHtml(e.actorName)}</strong> <span class="text-faint">(${UI.escapeHtml(e.actorRole)})</span> — ${UI.escapeHtml(e.details)}
          ${e.patientId ? `<span class="chip" style="margin-left:6px;">${UI.escapeHtml((patients.find((p) => p.id === e.patientId) || {}).name || e.patientId)}</span>` : ""}
        </div>
        <div class="audit-time">${UI.timeAgo(e.timestamp)} · ${UI.formatDateTime(e.timestamp)}</div>
      </div>
    </div>`;
  }

  // ---------------- Overview ----------------
  function renderOverview() {
    const hospitals = new Set(doctors().map((d) => d.hospital));
    const stats = [
      { label: "Registered patients", value: patients.length },
      { label: "Active doctors", value: doctors().length },
      { label: "Hospitals in network", value: hospitals.size },
      { label: "Total case records", value: records.length },
    ];
    document.getElementById("stat-cards").innerHTML = stats
      .map((s) => `<div class="stat-card"><span class="stat-value">${s.value}</span><span class="stat-label">${s.label}</span></div>`)
      .join("");
    document.getElementById("latest-activity").innerHTML = auditLog.slice(0, 8).map(auditRow).join("") || `<p class="text-faint text-sm">No activity yet.</p>`;
  }

  // ---------------- Patients ----------------
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

  function renderPatientCards() {
    const q = (document.getElementById("patient-search").value || "").toLowerCase();
    const list = patients.filter((p) => p.name.toLowerCase().includes(q) || p.place.toLowerCase().includes(q));
    document.getElementById("patient-cards").innerHTML =
      list
        .map(
          (p) => `<div class="card">
        <div class="card-title-row">
          <div><strong>${UI.escapeHtml(p.name)}</strong><div class="text-sm text-faint">${UI.escapeHtml(p.place)} · ${UI.calcAge(p.dob)} yrs · ${UI.escapeHtml(p.gender)}</div></div>
          <button class="btn btn-tonal btn-sm" data-open-patient="${p.id}">Open</button>
        </div>
        ${p.allergies && p.allergies.length ? `<div>${p.allergies.map((a) => `<span class="chip chip-allergy" style="margin:2px 4px 0 0;">${UI.escapeHtml(a)}</span>`).join("")}</div>` : `<span class="text-sm text-faint">No known allergies</span>`}
      </div>`
        )
        .join("") || `<div class="card empty-state"><div class="empty-icon material-symbols-outlined icon-lg">person_search</div><h3>No patients match</h3></div>`;
    document.getElementById("patient-cards").querySelectorAll("[data-open-patient]").forEach((b) => b.addEventListener("click", () => showPatientDetail(b.dataset.openPatient)));
  }
  document.getElementById("patient-search").addEventListener("input", renderPatientCards);

  async function showPatientDetail(patientId) {
    const patient = patients.find((p) => p.id === patientId);
    const patRecords = records.filter((r) => r.patientId === patientId);
    const patAudit = auditLog.filter((e) => e.patientId === patientId).slice(0, 6);
    await DB.logEvent({ patientId, actorId: user.id, actorName: user.name, actorRole: "admin", action: "view", details: "Reviewed patient record via admin console" });
    await loadAll();

    document.getElementById("patient-detail").innerHTML = `
      <div class="card" style="margin-top:16px;">
        <h3 style="margin-bottom:2px;">${UI.escapeHtml(patient.name)}</h3>
        <span class="text-sm text-faint">${UI.escapeHtml(patient.place)} · ${UI.calcAge(patient.dob)} yrs · ${UI.escapeHtml(patient.gender)} · Blood group ${UI.escapeHtml(patient.bloodGroup || "—")} · ${UI.escapeHtml(patient.phone || "—")}</span>
        ${patient.allergies && patient.allergies.length ? `<div class="banner banner-warning" style="margin-top:10px;"><span class="banner-icon material-symbols-outlined icon-sm">warning</span><div><strong>Known allergies</strong>${patient.allergies.map((a) => `<span class="chip chip-allergy" style="margin:4px 6px 0 0;">${UI.escapeHtml(a)}</span>`).join("")}</div></div>` : ""}
        <h4 style="margin-top:16px;">Care timeline</h4>
        <div class="timeline">${patRecords.length ? patRecords.map(timelineEntry).join("") : `<p class="text-faint text-sm">No visits recorded yet.</p>`}</div>
        <h4 style="margin-top:16px;">Recent access to this record</h4>
        ${patAudit.length ? patAudit.map(auditRow).join("") : `<p class="text-faint text-sm">No recorded access yet.</p>`}
      </div>`;
  }

  // ---------------- Doctors ----------------
  function renderDoctors() {
    const rows = doctors()
      .map(
        (d) => `<tr>
        <td><strong>${UI.escapeHtml(d.name)}</strong></td>
        <td>${UI.escapeHtml(d.specialty)}</td>
        <td>${UI.escapeHtml(d.hospital)}</td>
        <td>${UI.escapeHtml(d.place)}</td>
        <td class="cell-mono">${UI.escapeHtml(d.username)}</td>
      </tr>`
      )
      .join("");
    document.getElementById("doctors-table").innerHTML = `<table class="data-table">
      <thead><tr><th>Name</th><th>Specialty</th><th>Hospital</th><th>Place</th><th>Username</th></tr></thead>
      <tbody>${rows}</tbody></table>`;
  }

  // ---------------- Appointments ----------------
  function renderAppointmentsTable() {
    const rows = appointments
      .map(
        (a) => `<tr>
        <td><strong>${UI.escapeHtml(a.patientName)}</strong></td>
        <td>${UI.escapeHtml(a.doctorName)}</td>
        <td>${UI.escapeHtml(a.hospital)}</td>
        <td>${UI.formatDate(a.date)}, ${UI.formatTime(a.time)}</td>
        <td><span class="chip ${statusChipClass[a.status]}">${statusLabel[a.status]}</span></td>
      </tr>`
      )
      .join("");
    document.getElementById("appointments-table").innerHTML = `<table class="data-table">
      <thead><tr><th>Patient</th><th>Doctor</th><th>Hospital</th><th>When</th><th>Status</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="5" class="text-faint">No appointments yet.</td></tr>`}</tbody></table>`;
  }

  // ---------------- Audit log ----------------
  function renderAudit() {
    const q = (document.getElementById("audit-search").value || "").toLowerCase();
    const actionFilter = document.getElementById("audit-filter").value;
    let list = auditLog;
    if (actionFilter) list = list.filter((e) => e.action === actionFilter);
    if (q) {
      list = list.filter((e) => {
        const patientName = ((patients.find((p) => p.id === e.patientId) || {}).name || "").toLowerCase();
        return e.actorName.toLowerCase().includes(q) || e.details.toLowerCase().includes(q) || patientName.includes(q);
      });
    }
    document.getElementById("audit-list").innerHTML = list.length ? list.map(auditRow).join("") : `<div class="empty-state"><div class="empty-icon material-symbols-outlined icon-lg">search_off</div><h3>No matching activity</h3></div>`;
  }
  document.getElementById("audit-search").addEventListener("input", renderAudit);
  document.getElementById("audit-filter").addEventListener("change", renderAudit);

  await loadAll();
  renderOverview();
  renderPatientCards();
  renderDoctors();
  renderAppointmentsTable();
  renderAudit();
})();
