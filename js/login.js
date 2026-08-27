(async function () {
  await DB.init();

  // If already signed in, go straight to the right dashboard.
  const existing = Auth.currentUser();
  if (existing) {
    window.location.href = `${existing.role}.html`;
    return;
  }

  let selectedRole = "patient";
  const demoCreds = {
    patient: [{ label: "Sachin M", user: "sachin.m", pass: "Patient@123" }, { label: "Devika S", user: "devika.s", pass: "Patient@123" }],
    doctor: [{ label: "Dr. Arjun S", user: "dr.arjun", pass: "Doctor@123" }, { label: "Dr. Meera R", user: "dr.meera", pass: "Doctor@123" }],
    admin: [{ label: "Admin", user: "admin", pass: "Admin@123" }],
  };

  const tabsEl = document.getElementById("role-tabs");
  const credsEl = document.getElementById("demo-creds");
  const bannerEl = document.getElementById("login-banner");
  const form = document.getElementById("login-form");
  const loginBtn = document.getElementById("login-btn");

  function renderCreds() {
    credsEl.innerHTML =
      `<div style="font-weight:600;margin-bottom:4px;">Demo credentials (temporary, hardcoded)</div>` +
      demoCreds[selectedRole]
        .map((c) => `<div class="cred-row"><span>${UI.escapeHtml(c.label)} — ${c.user}</span><span>${c.pass}</span></div>`)
        .join("");
  }

  tabsEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-role]");
    if (!btn) return;
    selectedRole = btn.dataset.role;
    [...tabsEl.querySelectorAll("button")].forEach((b) => b.classList.toggle("active", b === btn));
    bannerEl.innerHTML = "";
    renderCreds();
  });

  renderCreds();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    bannerEl.innerHTML = "";
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    loginBtn.disabled = true;
    loginBtn.textContent = "Signing in…";
    try {
      const result = await Auth.login(username, password, selectedRole);
      if (!result.ok) {
        bannerEl.innerHTML = `<div class="banner banner-error"><span class="banner-icon">⚠</span><div>${UI.escapeHtml(result.error)}</div></div>`;
        loginBtn.disabled = false;
        loginBtn.textContent = "Sign in";
        return;
      }
      window.location.href = `${result.session.role}.html`;
    } catch (err) {
      console.error(err);
      bannerEl.innerHTML = `<div class="banner banner-error"><span class="banner-icon">⚠</span><div>Something went wrong. Please try again.</div></div>`;
      loginBtn.disabled = false;
      loginBtn.textContent = "Sign in";
    }
  });
})();
