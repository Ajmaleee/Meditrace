/* =========================================================================
   auth.js — TEMPORARY hardcoded auth.
   Session is kept in sessionStorage (cleared when the tab closes) purely
   to keep the demo simple. Swap checkCredentials() for real Firebase Auth
   (or any provider) later; every page only calls Auth.currentUser() /
   Auth.login() / Auth.logout(), so callers won't need to change.
   ========================================================================= */

const Auth = (() => {
  const SESSION_KEY = "meditrace_session";

  async function login(username, password, expectedRole) {
    const user = await DB.getUserByUsername(username.trim());
    if (!user || user.password !== password) {
      return { ok: false, error: "Incorrect username or password." };
    }
    if (expectedRole && user.role !== expectedRole) {
      return { ok: false, error: `That account is registered as "${user.role}", not "${expectedRole}".` };
    }
    const session = { id: user.id, username: user.username, name: user.name, role: user.role, patientId: user.patientId || null };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    await DB.logEvent({
      patientId: user.role === "patient" ? user.patientId : null,
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: "login",
      details: "Signed in to MediTrace",
    });
    return { ok: true, session };
  }

  function currentUser() {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.href = "index.html";
  }

  /** Call at the top of every protected page. Redirects if not logged in
   *  or logged in as the wrong role. */
  function requireRole(role) {
    const user = currentUser();
    if (!user || user.role !== role) {
      window.location.href = "index.html";
      return null;
    }
    return user;
  }

  function initials(name) {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join("");
  }

  return { login, currentUser, logout, requireRole, initials };
})();
