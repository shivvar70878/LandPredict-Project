// Universal Shared Auth & RBAC Controller for LandPredict AI
// Included across ALL pages

// Smart API_BASE_URL Resolution across Local, Railway & Vercel
function resolveApiBaseUrl() {
  try {
    const customUrl = localStorage.getItem("landPredictBackendUrl");
    if (customUrl && customUrl.trim()) return customUrl.trim().replace(/\/+$/, "");
  } catch (e) {}

  if (window.LANDPREDICT_BACKEND_URL) return window.LANDPREDICT_BACKEND_URL.replace(/\/+$/, "");

  const hostname = window.location.hostname;
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0") {
    if (window.location.port === "8000") return window.location.origin;
    return "http://127.0.0.1:8000";
  }

  if (window.API_BASE_URL && !window.API_BASE_URL.includes("127.0.0.1") && !window.API_BASE_URL.includes("localhost")) {
    return window.API_BASE_URL.replace(/\/+$/, "");
  }

  return "";
}

window.API_BASE_URL = resolveApiBaseUrl();

const DEFAULT_USERS_BY_ROLE = {
  "Administrator": {
    id: 1,
    first_name: "Shiv",
    last_name: "Verma",
    full_name: "Shiv Verma",
    email: "shivvar70878@gmail.com",
    organization: "Ministry of Road Transport & Highways",
    role: "Administrator",
    permissions: {
      can_create_project: true,
      can_edit_project: true,
      can_delete_project: true,
      can_predict_delay: true,
      can_access_portals: true,
      can_manage_users: true,
      can_export_reports: true,
      role_badge_color: "#9333ea",
      description: "Full administrative access across all modules and datasets."
    }
  },
  "CALA Project Director": {
    id: 2,
    first_name: "CALA",
    last_name: "Director",
    full_name: "CALA Project Director",
    email: "cala.morth@gov.in",
    organization: "NHAI Land Acquisition CALA Office",
    role: "CALA Project Director",
    permissions: {
      can_create_project: true,
      can_edit_project: true,
      can_delete_project: false,
      can_predict_delay: true,
      can_access_portals: true,
      can_manage_users: false,
      can_export_reports: true,
      role_badge_color: "#0284c7",
      description: "Can create projects, monitor Bhoomi Rashi milestones, and disburse compensation."
    }
  },
  "Revenue Inspector": {
    id: 3,
    first_name: "Revenue",
    last_name: "Inspector",
    full_name: "Revenue Inspector",
    email: "revenue.officer@gov.in",
    organization: "State Revenue Department (DILRMP)",
    role: "Revenue Inspector",
    permissions: {
      can_create_project: false,
      can_edit_project: true,
      can_delete_project: false,
      can_predict_delay: true,
      can_access_portals: true,
      can_manage_users: false,
      can_export_reports: true,
      role_badge_color: "#16a34a",
      description: "Can inspect Khasra records, log land disputes, and run AI prediction."
    }
  },
  "Public Auditor": {
    id: 4,
    first_name: "Public",
    last_name: "Auditor",
    full_name: "Public Auditor",
    email: "auditor@sih.gov.in",
    organization: "Smart India Hackathon Evaluation Council",
    role: "Public Auditor",
    permissions: {
      can_create_project: false,
      can_edit_project: false,
      can_delete_project: false,
      can_predict_delay: true,
      can_access_portals: true,
      can_manage_users: false,
      can_export_reports: true,
      role_badge_color: "#64748b",
      description: "Read-Only Auditor. Can view dashboard metrics, inspect GIS maps, and export reports."
    }
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    setupSharedAuth();
  });
} else {
  setupSharedAuth();
}

function setupSharedAuth() {
  // 1. Get or initialize current user
  let user = getSessionUser();
  if (!user) {
    user = DEFAULT_USERS_BY_ROLE["Administrator"];
    localStorage.setItem("landPredictUser", JSON.stringify(user));
  }

  // 2. Render user profile in header
  updateHeaderProfile(user);

  // 3. Inject Profile Dropdown card
  injectProfileDropdown(user);

  // 4. Inject Notifications Dropdown card
  injectNotificationsDropdown();

  // 5. Start Real-time Notification Engine (time-to-time updates)
  startNotificationEngine();

  // 6. Setup mobile menu toggle & logout listeners
  setupGlobalButtons();

  // 7. Enforce Role-Based UI Access Control
  enforceRoleBasedUI(user);
}

function getSessionUser() {
  try {
    const raw = localStorage.getItem("landPredictUser");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function updateHeaderProfile(user) {
  const userNameEl = document.getElementById("userName");
  const userInitialEl = document.getElementById("userInitial");
  const userProfileEl = document.querySelector(".user-profile");

  if (userNameEl) {
    userNameEl.textContent = user.full_name || user.first_name || "Administrator";
  }

  if (userInitialEl) {
    const initial = (user.first_name || user.full_name || "A").charAt(0).toUpperCase();
    userInitialEl.textContent = initial;
  }

  // Subtitle / role badge
  const userDetails = document.querySelector(".user-details");
  if (userDetails) {
    const roleColor = user.permissions?.role_badge_color || "#16a34a";
    const existingSpan = userDetails.querySelector("span");
    if (existingSpan) {
      existingSpan.innerHTML = `
        <span class="role-badge-pill" style="background:${roleColor}22; color:${roleColor}; border:1px solid ${roleColor}44;">
          ${user.role}
        </span>
      `;
    }
  }
}

function injectProfileDropdown(user) {
  const headerRight = document.querySelector(".header-right");
  const userProfile = document.querySelector(".user-profile");
  if (!headerRight || !userProfile) return;

  // Remove existing dropdown if any
  const existing = document.getElementById("profileDropdownCard");
  if (existing) existing.remove();

  const roleColor = user.permissions?.role_badge_color || "#16a34a";
  const initial = (user.first_name || "A").charAt(0).toUpperCase();

  const dropdown = document.createElement("div");
  dropdown.id = "profileDropdownCard";
  dropdown.className = "profile-dropdown-card";
  dropdown.innerHTML = `
    <div class="profile-dropdown-header">
      <div class="profile-large-avatar" style="background:${roleColor};">
        ${initial}
      </div>
      <div class="profile-user-info">
        <h4>${user.full_name || user.first_name}</h4>
        <p>${user.email}</p>
        <span class="role-badge-pill" style="background:#ffffff; color:${roleColor};">
          ${user.role}
        </span>
      </div>
    </div>

    <div class="profile-dropdown-body">
      <div class="profile-org-box">
        <label>Organization / Division</label>
        <span>${user.organization || "National Infrastructure Division"}</span>
      </div>

      <!-- Quick Role Switcher for SIH Presentation -->
      <div class="profile-role-switcher">
        <label><i class="fa-solid fa-user-shield"></i> Switch Role (Demo Simulation)</label>
        <select id="roleSwitcherSelect" class="role-select-box">
          <option value="Administrator" ${user.role === "Administrator" ? "selected" : ""}>👑 Administrator (Full Access)</option>
          <option value="CALA Project Director" ${user.role === "CALA Project Director" ? "selected" : ""}>🏛️ CALA Director (Create & Disburse)</option>
          <option value="Revenue Inspector" ${user.role === "Revenue Inspector" ? "selected" : ""}>🔍 Revenue Inspector (Survey & Audit)</option>
          <option value="Public Auditor" ${user.role === "Public Auditor" ? "selected" : ""}>👁️ Public Auditor (Read-Only Access)</option>
        </select>
      </div>

      <!-- Permissions preview -->
      <div class="profile-perms-list">
        <label>Active Permissions</label>
        <div class="perm-item">
          <i class="fa-solid ${user.permissions?.can_create_project ? "fa-circle-check allowed" : "fa-circle-xmark denied"}"></i>
          <span>Create & Manage Projects: ${user.permissions?.can_create_project ? "Authorized" : "Restricted"}</span>
        </div>
        <div class="perm-item">
          <i class="fa-solid ${user.permissions?.can_delete_project ? "fa-circle-check allowed" : "fa-circle-xmark denied"}"></i>
          <span>Project Deletion: ${user.permissions?.can_delete_project ? "Authorized" : "Restricted"}</span>
        </div>
        <div class="perm-item">
          <i class="fa-solid ${user.permissions?.can_predict_delay ? "fa-circle-check allowed" : "fa-circle-xmark denied"}"></i>
          <span>AI Delay Inference & Gati Shakti: Authorized</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="profile-dropdown-footer">
        <a href="settings.html" class="btn-profile-action">
          <i class="fa-solid fa-gear"></i> Settings
        </a>
        <button id="dropdownLogoutBtn" class="btn-profile-action logout">
          <i class="fa-solid fa-right-from-bracket"></i> Logout
        </button>
      </div>
    </div>
  `;

  userProfile.appendChild(dropdown);

  // Toggle dropdown on profile click (guarded against duplicate listeners)
  if (!userProfile.dataset.hasProfileListener) {
    userProfile.dataset.hasProfileListener = "true";
    userProfile.addEventListener("click", (e) => {
      // If click was inside dropdown, don't close
      if (e.target.closest(".profile-dropdown-card")) return;
      const card = document.getElementById("profileDropdownCard");
      if (card) {
        card.classList.toggle("active");
        // Close notifications if open
        document.getElementById("notificationsDropdownCard")?.classList.remove("active");
      }
    });
  }

  // Handle Role Switcher Change
  const roleSelect = dropdown.querySelector("#roleSwitcherSelect");
  if (roleSelect) {
    roleSelect.addEventListener("change", (e) => {
      const selectedRole = e.target.value;
      switchUserRole(selectedRole);
    });
  }

  // Handle Dropdown Logout
  const dropdownLogout = dropdown.querySelector("#dropdownLogoutBtn");
  if (dropdownLogout) {
    dropdownLogout.addEventListener("click", () => {
      logoutUser();
    });
  }
}

// =========================================================
// REAL-TIME NOTIFICATION ENGINE (CROSS-PAGE & TIME-TO-TIME)
// =========================================================

const INITIAL_SYSTEM_NOTIFICATIONS = [
  {
    id: "notif_1",
    title: "Section 3D Statutory Lapse Alert",
    category: "statutory",
    project_id: "LAP-10002",
    message: "Corridor LAP-10002 (Maharashtra Industrial Hub) has only 29 days remaining for Section 3D declaration before Section 3A expires by law.",
    timestamp: Date.now() - 2 * 60 * 1000,
    unread: true,
    priority: "critical"
  },
  {
    id: "notif_2",
    title: "High Court Stay Registered",
    category: "legal",
    project_id: "LAP-10005",
    message: "High Court interim stay granted on Survey Parcel 214/B for MP Bhopal-Nagpur Corridor. Hearing fixed within 14 days.",
    timestamp: Date.now() - 11 * 60 * 1000,
    unread: true,
    priority: "warning"
  },
  {
    id: "notif_3",
    title: "PFMS Direct DBT Compensation Cleared",
    category: "financial",
    project_id: "LAP-10001",
    message: "₹24.8 Crore disbursed directly via PFMS to 86 verified titleholders for UP Expressway Sector 4.",
    timestamp: Date.now() - 38 * 60 * 1000,
    unread: true,
    priority: "success"
  },
  {
    id: "notif_4",
    title: "PM Gati Shakti NMP Spatial Conflict",
    category: "gis",
    project_id: "LAP-10003",
    message: "Eco-Sensitive Zone 2.4 km buffer intersection detected with Western DFC Spur alignment.",
    timestamp: Date.now() - 90 * 60 * 1000,
    unread: false,
    priority: "info"
  },
  {
    id: "notif_5",
    title: "State Revenue RoR Hub Synchronized",
    category: "statutory",
    project_id: "LAP-10006",
    message: "UP Bhulekh & Mahabhulekh synced 14,200 digitized Khasra plots and updated ownership records.",
    timestamp: Date.now() - 180 * 60 * 1000,
    unread: false,
    priority: "info"
  }
];

const PERIODIC_LIVE_TEMPLATES = [
  {
    title: "Statutory Section 3G Award Finalized",
    category: "statutory",
    project_id: "LAP-10004",
    message: "Competent Authority (CALA) has finalized Section 3G Land Compensation Award for Rajasthan Solar Corridor.",
    priority: "success"
  },
  {
    title: "PFMS Compensation Batch Cleared",
    category: "financial",
    project_id: "LAP-10007",
    message: "PFMS processed ₹14.6 Cr DBT credit for 45 verified landholders under Bengaluru High-Tech Node.",
    priority: "success"
  },
  {
    title: "Bhoomi Rashi Section 3A e-Gazette Live",
    category: "statutory",
    project_id: "LAP-10008",
    message: "MoRTH e-Gazette notification S.O. 1489(E) published under Section 3A for Bihar Freight Bypass.",
    priority: "info"
  },
  {
    title: "Public Objection Logged under Section 3C",
    category: "legal",
    project_id: "LAP-10010",
    message: "18 new land valuation objections submitted to CALA office regarding Odisha Mineral Rail Corridor.",
    priority: "warning"
  },
  {
    title: "12 State Portals Health Ping Complete",
    category: "gis",
    project_id: "National",
    message: "DILRMP RoR Hub: Mahabhulekh (42ms), UP Bhulekh (36ms), Bhoomi Karnataka (48ms) operational. 0 sync errors.",
    priority: "info"
  },
  {
    title: "AI Predictive Delay Alert Triggered",
    category: "statutory",
    project_id: "LAP-10009",
    message: "AI ML Engine identified 65-day projected monsoon delay risk for Kolkata Port Link Rd. Early mitigation recommended.",
    priority: "critical"
  }
];

let currentNotifFilter = "all";
let notificationTimer = null;
let relativeTimeTicker = null;
let templateIndex = 0;

function escapeHTML(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getStoredNotifications() {
  try {
    const raw = localStorage.getItem("landPredictNotifications");
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn("[Notifications] Failed reading localStorage:", e);
  }
  localStorage.setItem("landPredictNotifications", JSON.stringify(INITIAL_SYSTEM_NOTIFICATIONS));
  return [...INITIAL_SYSTEM_NOTIFICATIONS];
}

function saveStoredNotifications(notifs) {
  try {
    localStorage.setItem("landPredictNotifications", JSON.stringify(notifs));
  } catch (e) {
    console.warn("[Notifications] Failed writing localStorage:", e);
  }
  updateNotificationBadge();
}

function formatRelativeTime(ts) {
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 20) return "Just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}d ago`;
}

function updateNotificationBadge() {
  const notifs = getStoredNotifications();
  const unreadCount = notifs.filter((n) => n.unread).length;

  const badges = document.querySelectorAll("#notificationCount, .notification-badge");
  badges.forEach((b) => {
    b.textContent = unreadCount > 99 ? "99+" : unreadCount;
    b.style.display = unreadCount > 0 ? "flex" : "none";
  });

  const countPills = document.querySelectorAll(".notif-count-pill");
  countPills.forEach((p) => {
    p.textContent = `${unreadCount} New`;
  });
}

function updateHeaderAndFooterButtons(notifs) {
  const notifDropdown = document.getElementById("notificationsDropdownCard");
  if (!notifDropdown) return;

  const clearBtn = notifDropdown.querySelector("#btnClearAllNotifs");
  const markReadBtn = notifDropdown.querySelector("#btnMarkAllRead");

  const unreadCount = notifs.filter((n) => n.unread).length;
  const filtered = currentNotifFilter === "all"
    ? notifs
    : notifs.filter((n) => n.category === currentNotifFilter);

  if (clearBtn) {
    if (currentNotifFilter !== "all") {
      const catName = currentNotifFilter.charAt(0).toUpperCase() + currentNotifFilter.slice(1);
      clearBtn.innerHTML = `<i class="fa-solid fa-trash-can" style="font-size:10px;"></i> Clear ${catName}${filtered.length > 0 ? ` (${filtered.length})` : ""}`;
      clearBtn.disabled = filtered.length === 0;
      clearBtn.title = filtered.length === 0 ? `No ${catName} alerts to clear` : `Clear ${filtered.length} ${catName} alert(s)`;
    } else {
      clearBtn.innerHTML = `<i class="fa-solid fa-trash-can" style="font-size:10px;"></i> Clear all`;
      clearBtn.disabled = notifs.length === 0;
      clearBtn.title = notifs.length === 0 ? "No notifications to clear" : `Clear all ${notifs.length} notification(s)`;
    }
  }

  if (markReadBtn) {
    markReadBtn.disabled = unreadCount === 0;
    markReadBtn.style.opacity = unreadCount === 0 ? "0.4" : "1";
    markReadBtn.style.cursor = unreadCount === 0 ? "not-allowed" : "pointer";
    markReadBtn.style.pointerEvents = unreadCount === 0 ? "none" : "auto";
  }
}

function renderNotificationList() {
  const container = document.getElementById("notificationsListContainer");
  if (!container) return;

  const notifs = getStoredNotifications();
  const filtered = currentNotifFilter === "all"
    ? notifs
    : notifs.filter((n) => n.category === currentNotifFilter);

  updateHeaderAndFooterButtons(notifs);

  if (filtered.length === 0) {
    const isFiltered = currentNotifFilter !== "all";
    const catLabel = currentNotifFilter.charAt(0).toUpperCase() + currentNotifFilter.slice(1);
    container.innerHTML = `
      <div class="notif-empty-state">
        <i class="fa-solid fa-bell-slash"></i>
        <p>No active alerts in this category.</p>
        <span style="font-size:11px; color:#94a3b8;">All national corridors operating normally</span>
        <p style="font-weight: 700; color: #334155; margin: 6px 0 4px 0; font-size: 13px;">
          ${isFiltered ? `No ${catLabel} Alerts` : "All Caught Up!"}
        </p>
        <span style="font-size: 11.5px; color: #64748b; display: block; max-width: 270px; margin: 0 auto 12px auto; line-height: 1.4;">
          ${isFiltered ? `There are currently no active alerts under the ${catLabel} category.` : "You have cleared all notifications. Live background feeds remain active."}
        </span>
        ${!isFiltered ? `
          <button id="btnRestoreNotifs" class="btn-restore-notifs">
            <i class="fa-solid fa-rotate-left"></i> Restore Default Alerts
          </button>
        ` : ''}
      </div>
    `;

    const restoreBtn = container.querySelector("#btnRestoreNotifs");
    if (restoreBtn) {
      restoreBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        resetDefaultNotifications();
      });
    }
    return;
  }

  container.innerHTML = filtered
    .map((n) => {
      let iconClass = "fa-solid fa-circle-info";
      let iconBgClass = "statutory";
      if (n.category === "statutory") {
        iconClass = "fa-solid fa-landmark-flag";
        iconBgClass = "statutory";
      } else if (n.category === "legal") {
        iconClass = "fa-solid fa-scale-balanced";
        iconBgClass = "alert";
      } else if (n.category === "financial") {
        iconClass = "fa-solid fa-money-bill-transfer";
        iconBgClass = "pfms";
      } else if (n.category === "gis") {
        iconClass = "fa-solid fa-earth-asia";
        iconBgClass = "gis";
      }

      let tagClass = "tag-info";
      let tagLabel = "UPDATE";
      if (n.priority === "critical") {
        tagClass = "tag-critical";
        tagLabel = "CRITICAL";
      } else if (n.priority === "warning") {
        tagClass = "tag-warning";
        tagLabel = "WARNING";
      } else if (n.priority === "success") {
        tagClass = "tag-success";
        tagLabel = "CLEARED";
      }

      return `
        <div class="notif-item ${n.unread ? "unread" : ""}" data-id="${n.id}">
          ${n.unread ? '<span class="notif-unread-dot"></span>' : ''}
          <div class="notif-icon ${iconBgClass}">
            <i class="${iconClass}"></i>
          </div>
          <div class="notif-body">
            <div class="notif-title-row">
              <strong title="${escapeHTML(n.title)}">${escapeHTML(n.title)}</strong>
              <div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
                <span class="notif-tag ${tagClass}">${tagLabel}</span>
                <button class="notif-dismiss-btn" data-dismiss-id="${n.id}" title="Dismiss alert" aria-label="Dismiss alert">
                  <i class="fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>
            <p>${escapeHTML(n.message)}</p>
            <div class="notif-meta">
              <span style="font-size: 10.5px; font-weight: 600; color: #64748b;">
                ${n.project_id ? escapeHTML(n.project_id) : 'National'}
              </span>
              <span class="notif-time" data-ts="${n.timestamp}">
                <i class="fa-regular fa-clock"></i>
                ${formatRelativeTime(n.timestamp)}
              </span>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  // Attach click listeners to individual notifications (mark as read)
  container.querySelectorAll(".notif-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      if (e.target.closest(".notif-dismiss-btn")) return;
      const notifId = item.getAttribute("data-id");
      markNotificationAsRead(notifId);
    });
  });

  // Attach dismiss button listeners
  container.querySelectorAll(".notif-dismiss-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const notifId = btn.getAttribute("data-dismiss-id");
      dismissSingleNotification(notifId);
    });
  });
}

function markNotificationAsRead(id) {
  const notifs = getStoredNotifications();
  const target = notifs.find((n) => n.id === id);
  if (target && target.unread) {
    target.unread = false;
    saveStoredNotifications(notifs);
    renderNotificationList();
  }
}

function markAllNotificationsAsRead() {
  const notifs = getStoredNotifications();
  notifs.forEach((n) => (n.unread = false));
  saveStoredNotifications(notifs);
  renderNotificationList();
  if (window.showToast) {
    window.showToast("All system alerts marked as read.", "info");
  }
}

function dismissSingleNotification(id) {
  const notifs = getStoredNotifications();
  const target = notifs.find((n) => n.id === id);
  const updated = notifs.filter((n) => n.id !== id);
  saveStoredNotifications(updated);
  renderNotificationList();
  if (window.showToast && target) {
    window.showToast(`Alert dismissed: ${target.title.slice(0, 32)}...`, "info");
  }
}

function resetDefaultNotifications() {
  saveStoredNotifications([...INITIAL_SYSTEM_NOTIFICATIONS]);
  renderNotificationList();
  if (window.showToast) {
    window.showToast("Default system alerts restored.", "success");
  }
}

function clearAllNotifications() {
  if (currentNotifFilter === "all") {
    const prevCount = getStoredNotifications().length;
    saveStoredNotifications([]);
    renderNotificationList();
    if (window.showToast) {
      window.showToast(prevCount > 0 ? `Cleared all ${prevCount} notifications.` : "All notifications cleared.", "info");
    }
  } else {
    const notifs = getStoredNotifications();
    const count = notifs.filter((n) => n.category === currentNotifFilter).length;
    const remaining = notifs.filter((n) => n.category !== currentNotifFilter);
    saveStoredNotifications(remaining);
    renderNotificationList();
    if (window.showToast) {
      const catLabel = currentNotifFilter.charAt(0).toUpperCase() + currentNotifFilter.slice(1);
      window.showToast(`Cleared ${count} ${catLabel} notification(s).`, "info");
    }
  }

  // Reset periodic live streamer interval so user gets peace before next simulated event
  if (notificationTimer) {
    clearInterval(notificationTimer);
    notificationTimer = setInterval(pollOrSimulateLiveNotification, 45000);
  }
}

function updateRelativeTimestamps() {
  const timeElements = document.querySelectorAll(".notif-time[data-ts]");
  timeElements.forEach((el) => {
    const ts = parseInt(el.getAttribute("data-ts"), 10);
    if (!isNaN(ts)) {
      el.innerHTML = `<i class="fa-regular fa-clock"></i> ${formatRelativeTime(ts)}`;
    }
  });
}

// =========================================================
// ON-SCREEN ALERT NOTIFICATION SYSTEM (ALERT FORM ON SCREEN)
// =========================================================

function getOrCreateAlertContainer() {
  let container = document.getElementById("notificationAlertContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "notificationAlertContainer";
    container.className = "notification-alert-stack";
    container.setAttribute("role", "region");
    container.setAttribute("aria-label", "Real-Time System Alerts");
    document.body.appendChild(container);
  }
  return container;
}

function playNotificationChime(priority = "info") {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    if (priority === "critical" || priority === "warning") {
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
    } else {
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12); // E5
    }

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  } catch (e) {
    // Gracefully handle browser autoplay policies
  }
}

function showNotificationAlert(notifOrTitle, msg, cat, pri, proj) {
  let notif = notifOrTitle;
  if (typeof notifOrTitle === "string") {
    notif = {
      id: `notif_alert_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      title: notifOrTitle,
      message: msg || "",
      category: cat || "statutory",
      priority: pri || "info",
      project_id: proj || "National",
      timestamp: Date.now(),
      unread: true
    };
  } else if (!notif || typeof notif !== "object") {
    return;
  }

  const category = notif.category || "statutory";
  const priority = notif.priority || "info";
  const projectId = notif.project_id || "National";
  const title = notif.title || "System Alert";
  const message = notif.message || "";
  const notifId = notif.id || `notif_${Date.now()}`;

  const container = getOrCreateAlertContainer();

  // Limit maximum simultaneous onscreen alert cards to 3
  const existingCards = container.querySelectorAll(".notification-alert-card:not(.dismissing)");
  if (existingCards.length >= 3) {
    const oldest = existingCards[0];
    oldest.classList.add("dismissing");
    setTimeout(() => oldest.remove(), 280);
  }

  // Icons and Labels
  let catIcon = "fa-circle-info";
  let catLabel = "UPDATE";
  if (category === "statutory") {
    catIcon = "fa-landmark-flag";
    catLabel = "STATUTORY";
  } else if (category === "legal") {
    catIcon = "fa-scale-balanced";
    catLabel = "LEGAL";
  } else if (category === "financial") {
    catIcon = "fa-money-bill-transfer";
    catLabel = "PFMS DBT";
  } else if (category === "gis") {
    catIcon = "fa-earth-asia";
    catLabel = "GIS / ROR";
  }

  let priLabel = "NOTICE";
  if (priority === "critical") priLabel = "CRITICAL ALERT";
  else if (priority === "warning") priLabel = "WARNING ALERT";
  else if (priority === "success") priLabel = "RESOLVED";
  else if (priority === "info") priLabel = "GAZETTE / SYNC";

  const card = document.createElement("div");
  card.className = `notification-alert-card priority-${priority}`;
  card.setAttribute("role", "alert");
  card.dataset.id = notifId;

  card.innerHTML = `
    <div class="alert-card-inner">
      <div class="alert-card-header">
        <div class="alert-card-badge-row">
          <span class="alert-category-badge category-${category}">
            <i class="fa-solid ${catIcon}"></i> ${catLabel}
          </span>
          <span class="alert-project-pill">${escapeHTML(projectId)}</span>
          <span class="alert-priority-tag priority-${priority}">
            ${priLabel}
          </span>
        </div>
        <button class="alert-close-btn" title="Dismiss alert" aria-label="Dismiss alert">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="alert-card-body">
        <h5 class="alert-card-title">
          ${priority === "critical" ? '<i class="fa-solid fa-triangle-exclamation" style="color:#dc2626;"></i>' : priority === "warning" ? '<i class="fa-solid fa-triangle-exclamation" style="color:#d97706;"></i>' : priority === "success" ? '<i class="fa-solid fa-circle-check" style="color:#16a34a;"></i>' : '<i class="fa-solid fa-bell" style="color:#2563eb;"></i>'}
          <span>${escapeHTML(title)}</span>
        </h5>
        <p class="alert-card-msg">${escapeHTML(message)}</p>
      </div>

      <div class="alert-card-footer">
        <span class="alert-time-stamp">
          <i class="fa-regular fa-clock"></i> Just now
        </span>
        <div class="alert-card-actions">
          <button class="btn-alert-action view-details" title="Open in Notifications panel">
            <i class="fa-solid fa-arrow-up-right-from-square"></i> Open Alert Center
          </button>
          <button class="btn-alert-action dismiss">Dismiss</button>
        </div>
      </div>

      <div class="alert-progress-bar-wrap">
        <div class="alert-progress-bar priority-${priority}"></div>
      </div>
    </div>
  `;

  // Countdown & auto-dismiss
  const totalDuration = priority === "critical" ? 9500 : 7500;
  let remainingMs = totalDuration;
  let isPaused = false;
  const progressBar = card.querySelector(".alert-progress-bar");

  const dismissCard = () => {
    if (card.classList.contains("dismissing")) return;
    card.classList.add("dismissing");
    clearInterval(progressTimer);
    setTimeout(() => {
      card.remove();
    }, 300);
  };

  const progressTimer = setInterval(() => {
    if (!isPaused) {
      remainingMs -= 60;
      const pct = Math.max(0, (remainingMs / totalDuration) * 100);
      if (progressBar) {
        progressBar.style.width = `${pct}%`;
      }
      if (remainingMs <= 0) {
        dismissCard();
      }
    }
  }, 60);

  // Pause on hover
  card.addEventListener("mouseenter", () => {
    isPaused = true;
  });
  card.addEventListener("mouseleave", () => {
    isPaused = false;
  });

  // Close & Dismiss buttons
  const closeBtn = card.querySelector(".alert-close-btn");
  if (closeBtn) {
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      dismissCard();
    });
  }

  const dismissActionBtn = card.querySelector(".btn-alert-action.dismiss");
  if (dismissActionBtn) {
    dismissActionBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      dismissCard();
    });
  }

  // Open Alert Center action
  const openActionBtn = card.querySelector(".btn-alert-action.view-details");
  if (openActionBtn) {
    openActionBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      dismissCard();

      const notifBtn = document.getElementById("notificationBtn");
      const notifDropdown = document.getElementById("notificationsDropdownCard");
      if (notifDropdown) {
        if (!notifDropdown.classList.contains("active") && notifBtn) {
          notifBtn.click();
        }

        // Filter to category tab if available
        const targetTab = notifDropdown.querySelector(`.notif-tab[data-filter="${category}"]`);
        if (targetTab) {
          targetTab.click();
        }

        // Highlight matching item
        setTimeout(() => {
          const targetItem = notifDropdown.querySelector(`.notif-item[data-id="${notifId}"]`);
          if (targetItem) {
            targetItem.scrollIntoView({ behavior: "smooth", block: "nearest" });
            targetItem.style.outline = "2px solid var(--primary)";
            setTimeout(() => {
              targetItem.style.outline = "none";
            }, 2500);
          }
        }, 150);
      }
    });
  }

  // Play subtle chime
  playNotificationChime(priority);

  // Append to onscreen stack
  container.appendChild(card);
}

function pollOrSimulateLiveNotification() {
  const tmpl = PERIODIC_LIVE_TEMPLATES[templateIndex % PERIODIC_LIVE_TEMPLATES.length];
  templateIndex++;

  const notifs = getStoredNotifications();
  const newNotif = {
    id: `notif_${Date.now()}`,
    title: tmpl.title,
    category: tmpl.category,
    project_id: tmpl.project_id,
    message: tmpl.message,
    timestamp: Date.now(),
    unread: true,
    priority: tmpl.priority
  };

  notifs.unshift(newNotif);
  if (notifs.length > 25) notifs.pop(); // Keep top 25

  saveStoredNotifications(notifs);
  renderNotificationList();

  // Pulse animation on badge
  const badges = document.querySelectorAll(".notification-badge");
  badges.forEach((b) => {
    b.classList.remove("pulse");
    void b.offsetWidth; // Force reflow
    b.classList.add("pulse");
  });

  // Display rich on-screen alert notification form
  showNotificationAlert(newNotif);
}

function pushSystemNotification(title, message, category = "statutory", priority = "info", project_id = "National") {
  const notifs = getStoredNotifications();
  const newNotif = {
    id: `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    title: title,
    category: category,
    project_id: project_id,
    message: message,
    timestamp: Date.now(),
    unread: true,
    priority: priority
  };

  notifs.unshift(newNotif);
  if (notifs.length > 25) notifs.pop();

  saveStoredNotifications(notifs);
  renderNotificationList();

  const badges = document.querySelectorAll(".notification-badge");
  badges.forEach((b) => {
    b.classList.remove("pulse");
    void b.offsetWidth;
    b.classList.add("pulse");
  });

  // Display rich on-screen alert notification form
  showNotificationAlert(newNotif);
}

function injectNotificationsDropdown() {
  const notifBtn = document.getElementById("notificationBtn");
  if (!notifBtn) return;

  const existing = document.getElementById("notificationsDropdownCard");
  if (existing) existing.remove();

  const notifDropdown = document.createElement("div");
  notifDropdown.id = "notificationsDropdownCard";
  notifDropdown.className = "notifications-dropdown-card";
  notifDropdown.innerHTML = `
    <div class="notifications-header">
      <div class="notif-header-top">
        <h4>
          <i class="fa-solid fa-bell" style="color:var(--primary);"></i>
          System Notifications
          <span class="notif-count-pill">0 New</span>
        </h4>
        <div class="notif-header-actions">
          <button class="btn-mark-read" id="btnMarkAllRead" title="Mark all as read">
            <i class="fa-solid fa-check-double"></i> Mark all read
          </button>
        </div>
      </div>

      <div class="notif-category-tabs">
        <button class="notif-tab active" data-filter="all">All Alerts</button>
        <button class="notif-tab" data-filter="statutory">Statutory</button>
        <button class="notif-tab" data-filter="legal">Legal</button>
        <button class="notif-tab" data-filter="financial">Finance</button>
        <button class="notif-tab" data-filter="gis">GIS</button>
      </div>
    </div>

    <div class="notifications-list" id="notificationsListContainer">
      <!-- Dynamic notification items rendered here -->
    </div>

    <div class="notifications-footer">
      <div class="notif-live-indicator">
        <span class="pulse-dot"></span>
        <span>Live auto-sync active</span>
      </div>
      <button class="btn-clear-all" id="btnClearAllNotifs">Clear all</button>
    </div>
  `;

  notifBtn.parentElement.appendChild(notifDropdown);

  // Category filter tabs click listeners
  notifDropdown.querySelectorAll(".notif-tab").forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.stopPropagation();
      notifDropdown.querySelectorAll(".notif-tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      currentNotifFilter = tab.getAttribute("data-filter");
      renderNotificationList();
    });
  });

  // Mark all read button
  const markReadBtn = notifDropdown.querySelector("#btnMarkAllRead");
  if (markReadBtn) {
    markReadBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      markAllNotificationsAsRead();
    });
  }

  // Clear all button
  const clearBtn = notifDropdown.querySelector("#btnClearAllNotifs");
  if (clearBtn) {
    clearBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      clearAllNotifications();
    });
  }

  // Toggle dropdown on button click
  notifBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isActive = notifDropdown.classList.contains("active");
    // Close other dropdowns
    document.getElementById("profileDropdownCard")?.classList.remove("active");
    if (isActive) {
      notifDropdown.classList.remove("active");
    } else {
      notifDropdown.classList.add("active");
      renderNotificationList();
    }
  });

  renderNotificationList();
  updateNotificationBadge();
}

function startNotificationEngine() {
  // 1. Initial render & badge update
  updateNotificationBadge();

  // 2. Relative time ticker every 15 seconds (updates "Just now", "2m ago", etc.)
  if (relativeTimeTicker) clearInterval(relativeTimeTicker);
  relativeTimeTicker = setInterval(updateRelativeTimestamps, 15000);

  // 3. Periodic time-to-time live event streaming every 45 seconds
  if (notificationTimer) clearInterval(notificationTimer);
  notificationTimer = setInterval(pollOrSimulateLiveNotification, 45000);

  // 4. Initial on-screen alert prompt for active critical statutory notifications
  setTimeout(() => {
    try {
      const notifs = getStoredNotifications();
      const urgentAlert = notifs.find((n) => n.unread && (n.priority === "critical" || n.priority === "warning")) || notifs[0];
      if (urgentAlert) {
        showNotificationAlert(urgentAlert);
      }
    } catch (e) {
      console.warn("[Notifications] Initial alert display failed:", e);
    }
  }, 1800);

  // 5. Cross-tab storage sync
  window.addEventListener("storage", (e) => {
    if (e.key === "landPredictNotifications") {
      renderNotificationList();
      updateNotificationBadge();
    }
    if (e.key === "landPredictUser") {
      const updatedUser = getSessionUser();
      if (updatedUser) {
        updateHeaderProfile(updatedUser);
        injectProfileDropdown(updatedUser);
        enforceRoleBasedUI(updatedUser);
      } else {
        window.location.href = "login.html";
      }
    }
  });
}

window.showNotificationAlert = showNotificationAlert;
window.pushSystemNotification = pushSystemNotification;
window.startNotificationEngine = startNotificationEngine;
window.clearAllNotifications = clearAllNotifications;
window.dismissSingleNotification = dismissSingleNotification;
window.resetDefaultNotifications = resetDefaultNotifications;
window.markAllNotificationsAsRead = markAllNotificationsAsRead;
window.getStoredNotifications = getStoredNotifications;
window.testNotificationAlert = function() {
  showNotificationAlert({
    id: `notif_test_${Date.now()}`,
    title: "Section 3D Statutory Alert",
    message: "Urgent: Gazette notification required for Corridor LAP-10002 within 29 days before Section 3A lapses under RFCTLARR Act.",
    category: "statutory",
    priority: "critical",
    project_id: "LAP-10002",
    timestamp: Date.now(),
    unread: true
  });
};


function setupGlobalButtons() {
  // Mobile sidebar menu toggle (robust idempotency)
  const menuBtn = document.getElementById("menuBtn");
  const sidebar = document.getElementById("sidebar");
  if (menuBtn && sidebar && !menuBtn.dataset.boundMenu) {
    menuBtn.dataset.boundMenu = "true";
    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      sidebar.classList.toggle("active");
    });
  }

  // Sidebar navigation link clicks on mobile close menu smoothly
  document.querySelectorAll(".sidebar .nav-link").forEach((link) => {
    if (!link.dataset.boundNav) {
      link.dataset.boundNav = "true";
      link.addEventListener("click", () => {
        if (window.innerWidth <= 900 && sidebar) {
          sidebar.classList.remove("active");
        }
      });
    }
  });

  // Global Sidebar Logout Button
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn && !logoutBtn.dataset.boundLogout) {
    logoutBtn.dataset.boundLogout = "true";
    logoutBtn.addEventListener("click", () => {
      logoutUser();
    });
  }

  // Close dropdowns and mobile sidebar on outside click
  document.addEventListener("click", (e) => {
    if (sidebar && sidebar.classList.contains("active")) {
      if (!e.target.closest("#sidebar") && !e.target.closest("#menuBtn")) {
        sidebar.classList.remove("active");
      }
    }
    if (!e.target.closest(".user-profile")) {
      document.getElementById("profileDropdownCard")?.classList.remove("active");
    }
    if (!e.target.closest(".notification-btn") && !e.target.closest(".notifications-dropdown-card")) {
      document.getElementById("notificationsDropdownCard")?.classList.remove("active");
    }
  });
}

function enforceRoleBasedUI(user) {
  const cannotCreate = !user.permissions?.can_create_project;

  // 1. Check Create Project buttons
  const createBtns = document.querySelectorAll(".create-project-btn, a.btn-create, button.btn-create");
  if (cannotCreate) {
    createBtns.forEach((btn) => {
      btn.style.opacity = "0.45";
      btn.style.pointerEvents = "none";
      btn.title = `Action Restricted: ${user.role} has Read-Only permissions.`;
      if (btn.tagName === "BUTTON") btn.disabled = true;
    });

    // If currently on createProject.html
    if (window.location.pathname.includes("createProject.html")) {
      const submitBtn = document.querySelector(".submit-btn, button[type='submit']");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = `Read-Only Mode (${user.role})`;
        submitBtn.style.background = "#94a3b8";
        submitBtn.style.cursor = "not-allowed";
      }
      showToast(`Notice: You are in Read-Only mode as ${user.role}.`, "info");
    }
  }

  // 2. Restrict delete buttons
  if (!user.permissions?.can_delete_project) {
    const deleteBtns = document.querySelectorAll(".delete-btn, .btn-delete");
    deleteBtns.forEach((btn) => {
      btn.style.display = "none";
    });
  }

}

function switchUserRole(newRole) {
  const newUser = DEFAULT_USERS_BY_ROLE[newRole];
  if (newUser) {
    localStorage.setItem("landPredictUser", JSON.stringify(newUser));
    showToast(`Switched active role to: ${newRole}`, "success");
    setTimeout(() => {
      window.location.reload();
    }, 400);
  }
}

function logoutUser() {
  localStorage.removeItem("landPredictUser");
  localStorage.removeItem("landInsightLoggedIn");
  localStorage.removeItem("loggedIn");
  localStorage.removeItem("userName");
  showToast("Logged out successfully. Redirecting...", "info");
  setTimeout(() => {
    window.location.href = "login.html";
  }, 600);
}

function showToast(message, type = "info") {
  const existingToast = document.querySelector(".landpredict-toast");
  if (existingToast) existingToast.remove();

  const toast = document.createElement("div");
  toast.className = `landpredict-toast ${type}`;
  toast.innerHTML = `
    <i class="fa-solid ${type === 'success' ? 'fa-circle-check' : type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-info'}"></i>
    <span>${message}</span>
  `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3500);
}

window.showToast = showToast;
window.getCurrentUser = getSessionUser;
window.logoutUser = logoutUser;

