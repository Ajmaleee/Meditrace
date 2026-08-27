/* =========================================================================
   ui.js — small shared helpers (formatting, toasts, escaping).
   ========================================================================= */

const UI = (() => {
  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatDate(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr + "T00:00:00");
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }

  function formatTime(timeStr) {
    if (!timeStr) return "";
    const [h, m] = timeStr.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${String(m).padStart(2, "0")} ${period}`;
  }

  function formatDateTime(isoStr) {
    if (!isoStr) return "—";
    const d = new Date(isoStr);
    return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  function timeAgo(isoStr) {
    const diffMs = Date.now() - new Date(isoStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;
    return formatDateTime(isoStr);
  }

  function calcAge(dob) {
    if (!dob) return "—";
    const birth = new Date(dob);
    const diff = Date.now() - birth.getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
  }

  let toastRegion;
  function toast(message, kind = "default") {
    if (!toastRegion) {
      toastRegion = document.createElement("div");
      toastRegion.id = "toast-region";
      document.body.appendChild(toastRegion);
    }
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = message;
    toastRegion.appendChild(el);
    setTimeout(() => el.remove(), 3400);
  }

  function actionIcon(action) {
    const name = { view: "visibility", edit: "edit", create: "add_circle", login: "login" }[action] || "info";
    return `<span class="material-symbols-outlined icon-sm">${name}</span>`;
  }

  return { escapeHtml, formatDate, formatTime, formatDateTime, timeAgo, calcAge, toast, actionIcon };
})();
