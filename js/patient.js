(async function () {
  await DB.init();
  const user = Auth.requireRole("patient");
  if (!user) return;

  document.getElementById("backend-indicator").textContent =
    DB.backend === "firestore" ? " · live Firestore" : " · local demo data";
  document.getElementById("user-avatar").textContent = Auth.initials(user.name);
  document.getElementById("user-name").textContent = user.name;
  document.getElementById("logout-btn").addEventListener("click", Auth.logout);

  // ---- section navigation (side-nav + bottom-nav mirrored) -------------
  function goto(section) {
    document.querySelectorAll(".page-section").forEach((s) => (s.style.display = s.id === `section-${section}` ? "" : "none"));
    document.querySelectorAll(".nav-item[data-section]").forEach((b) => b.classList.toggle("active", b.dataset.section === section));
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }
  document.querySelectorAll(".nav-item[data-section], [data-goto]").forEach((btn) => {
    btn.addEventListener("click", () => goto(btn.dataset.section || btn.dataset.goto));
  });

  let patient, records, appointments, auditLog, doctors;

  async function loadAll() {
    [patient, records, appointments, auditLog, doctors] = await Promise.all([
      DB.getPatient(user.patientId),
      DB.getMedicalRecords({ patientId: user.patientId }),
      DB.getAppointments({ patientId: user.patientId }),
      DB.getAuditLog({ patientId: user.patientId }),
      DB.getUsers().then((u) => u.filter((x) => x.role === "doctor")),
    ]);
  }

  // ---- rendering helpers -------------------------------------------------
  function renderAllergyBanner() {
    const el = document.getElementById("allergy-banner");
    if (patient.allergies && patient.allergies.length) {
      el.innerHTML = `<div class="banner banner-warning"><span class="banner-icon">⚠</span><div><strong>Known allergies on file</strong>${patient.allergies
        .map((a) => `<span class="chip chip-allergy" style="margin:4px 6px 0 0;">${UI.escapeHtml(a)}</span>`)
        .join("")}</div></div>`;
    } else {
      el.innerHTML = "";
    }
  }

  function renderStats() {
    const hospitals = new Set(records.map((r) => r.hospital));
    const today = new Date().toISOString().slice(0, 10);
    const upcoming = appointments.filter((a) => a.date >= today && a.status !== "cancelled" && a.status !== "completed").length;
    const stats = [
      { label: "Recorded visits", value: records.length },
      { label: "Hospitals on file", value: hospitals.size },
      { label: "Known allergies", value: (patient.allergies || []).length },
      { label: "Upcoming appointments", value: upcoming },
    ];
    document.getElementById("stat-cards").innerHTML = stats
      .map((s) => `<div class="stat-card"><span class="stat-value">${s.value}</span><span class="stat-label">${s.label}</span></div>`)
      .join("");
    document.getElementById("greeting").textContent = `Welcome, ${patient.name.split(" ")[0]}`;
  }

  function medicineList(medicines) {
    if (!medicines || !medicines.length) return `<p class="text-sm text-faint">No medicines prescribed at this visit.</p>`;
    return `<ul class="med-list">${medicines
      .map(
        (m) => `<li class="med-item">
          <div>
            <div class="med-name">${UI.escapeHtml(m.name)}</div>
            <div class="text-sm text-faint">${UI.escapeHtml(m.purpose || "")}</div>
          </div>
          <div class="med-dose">${UI.escapeHtml(m.dosage)} · ${UI.escapeHtml(m.frequency)} · ${UI.escapeHtml(m.duration)}</div>
        </li>`
      )
      .join("")}</ul>`;
  }

  function timelineEntry(r) {
    const hasAllergyFlag = r.allergiesNoted && r.allergiesNoted.length;
    return `<div class="timeline-entry ${hasAllergyFlag ? "entry-alert" : ""}">
      <div class="timeline-card">
        <div class="timeline-meta">
          <span>${UI.formatDate(r.date)}</span><span>·</span><span>${UI.formatTime(r.time)}</span>
        </div>
        <h4>${UI.escapeHtml(r.diagnosis || "Consultation")}</h4>
        <div class="hospital-line">${UI.escapeHtml(r.doctorName)} · ${UI.escapeHtml(r.hospital)}, ${UI.escapeHtml(r.place)}</div>
        <div style="margin-bottom:8px;">
          ${(r.symptoms || []).map((s) => `<span class="chip" style="margin:0 6px 6px 0;">${UI.escapeHtml(s)}</span>`).join("")}
        </div>
        ${hasAllergyFlag ? `<div class="banner banner-warning" style="margin:0 0 10px;padding:8px 12px;"><span class="banner-icon">⚠</span><div>Allergy considered while prescribing: ${r.allergiesNoted.map(UI.escapeHtml).join(", ")}</div></div>` : ""}
        ${medicineList(r.medicines)}
        ${r.notes ? `<p class="text-sm text-variant" style="margin-top:10px;">${UI.escapeHtml(r.notes)}</p>` : ""}
      </div>
    </div>`;
  }

  function renderTimeline() {
    document.getElementById("full-timeline").innerHTML = records.length
      ? records.map(timelineEntry).join("")
      : `<div class="empty-state"><div class="empty-icon">🗂️</div><h3>No visits recorded yet</h3><p>Once a doctor adds a case record, it will show up here.</p></div>`;
    document.getElementById("recent-timeline").innerHTML = records.length
      ? records.slice(0, 3).map(timelineEntry).join("")
      : `<div class="empty-state"><div class="empty-icon">🗂️</div><h3>No visits yet</h3></div>`;
  }

  const statusLabel = { pending: "Pending confirmation", confirmed: "Confirmed", completed: "Completed", cancelled: "Cancelled" };

  function renderAppointments() {
    const el = document.getElementById("appointments-list");
    if (!appointments.length) {
      el.innerHTML = `<div class="card empty-state"><div class="empty-icon">📅</div><h3>No appointments yet</h3><p>Book one to get started.</p></div>`;
      return;
    }
    el.innerHTML = appointments
      .map(
        (a) => `<div class="card">
        <div class="card-title-row">
          <div>
            <span class="badge-dot ${a.status}"></span>
            <strong>${UI.escapeHtml(a.doctorName)}</strong> <span class="text-faint text-sm">— ${UI.escapeHtml(a.hospital)}, ${UI.escapeHtml(a.place)}</span>
          </div>
          <span class="chip ${a.status === "cancelled" ? "" : a.status === "completed" ? "chip-success" : a.status === "confirmed" ? "chip-primary" : "chip-warning"}">${statusLabel[a.status]}</span>
        </div>
        <p class="text-sm"><strong>${UI.formatDate(a.date)}</strong> at ${UI.formatTime(a.time)}</p>
        <p class="text-sm text-variant">${UI.escapeHtml(a.symptoms)}</p>
        ${a.status === "pending" ? `<button class="btn btn-outlined btn-sm" data-cancel="${a.id}">Cancel request</button>` : ""}
      </div>`
      )
      .join("");
    el.querySelectorAll("[data-cancel]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        btn.disabled = true;
        await DB.updateAppointment(btn.dataset.cancel, { status: "cancelled" }, user, user.patientId);
        UI.toast("Appointment request cancelled.");
        await loadAll();
        renderEverything();
      })
    );
  }

  function renderAudit() {
    const el = document.getElementById("audit-list");
    if (!auditLog.length) {
      el.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><h3>No activity yet</h3></div>`;
      return;
    }
    el.innerHTML = auditLog
      .map(
        (e) => `<div class="audit-row action-${e.action}">
        <div class="audit-icon">${UI.actionIcon(e.action)}</div>
        <div style="flex:1;">
          <div><strong>${UI.escapeHtml(e.actorName)}</strong> <span class="text-faint">(${UI.escapeHtml(e.actorRole)})</span> — ${UI.escapeHtml(e.details)}</div>
          <div class="audit-time">${UI.timeAgo(e.timestamp)} · ${UI.formatDateTime(e.timestamp)}</div>
        </div>
      </div>`
      )
      .join("");
  }

  function renderProfile() {
    document.getElementById("p-name").value = patient.name;
    document.getElementById("p-dob").value = `${UI.formatDate(patient.dob)} (age ${UI.calcAge(patient.dob)})`;
    document.getElementById("p-phone").value = patient.phone || "";
    document.getElementById("p-place").value = patient.place || "";
    document.getElementById("p-allergies").value = (patient.allergies || []).join(", ");
  }

  function renderEverything() {
    renderAllergyBanner();
    renderStats();
    renderTimeline();
    renderAppointments();
    renderAudit();
    renderProfile();
  }

  // ---- booking modal ------------------------------------------------------
  const modal = document.getElementById("booking-modal");
  function openModal() {
    const sel = document.getElementById("b-doctor");
    sel.innerHTML = doctors
      .map((d) => `<option value="${d.id}">${UI.escapeHtml(d.name)} — ${UI.escapeHtml(d.specialty)}, ${UI.escapeHtml(d.hospital)} (${UI.escapeHtml(d.place)})</option>`)
      .join("");
    document.getElementById("b-date").min = new Date().toISOString().slice(0, 10);
    modal.style.display = "flex";
  }
  function closeModal() {
    modal.style.display = "none";
    document.getElementById("booking-form").reset();
  }
  document.getElementById("btn-open-booking").addEventListener("click", () => {
    goto("appointments");
    openModal();
  });
  document.getElementById("fab-book").addEventListener("click", () => {
    goto("appointments");
    openModal();
  });
  document.getElementById("close-booking").addEventListener("click", closeModal);
  document.getElementById("cancel-booking").addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

  document.getElementById("booking-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const doc = doctors.find((d) => d.id === document.getElementById("b-doctor").value);
    await DB.addAppointment(
      {
        patientId: user.patientId,
        patientName: patient.name,
        doctorId: doc.id,
        doctorName: doc.name,
        hospital: doc.hospital,
        place: doc.place,
        date: document.getElementById("b-date").value,
        time: document.getElementById("b-time").value,
        symptoms: document.getElementById("b-symptoms").value.trim(),
      },
      user
    );
    UI.toast("Appointment requested.");
    closeModal();
    await loadAll();
    renderEverything();
  });

  // ---- profile form ---------------------------------------------------
  document.getElementById("profile-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const allergies = document
      .getElementById("p-allergies")
      .value.split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    await DB.updatePatientProfile(
      user.patientId,
      { phone: document.getElementById("p-phone").value.trim(), place: document.getElementById("p-place").value.trim(), allergies },
      user
    );
    UI.toast("Profile updated.");
    await loadAll();
    renderEverything();
  });

  await loadAll();
  renderEverything();
})();
