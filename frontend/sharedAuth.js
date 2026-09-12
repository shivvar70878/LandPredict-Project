// Universal Shared Auth & RBAC Controller for LandPredict AI
// Included across ALL pages

window.API_BASE_URL = window.API_BASE_URL || "http://127.0.0.1:8000";

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

  // Toggle dropdown on profile click
  userProfile.addEventListener("click", (e) => {
    // If click was inside dropdown, don't close
    if (e.target.closest(".profile-dropdown-card")) return;
    dropdown.classList.toggle("active");
    // Close notifications if open
    document.getElementById("notificationsDropdownCard")?.classList.remove("active");
  });

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
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
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

function renderNotificationList() {
  const container = document.getElementById("notificationsListContainer");
  if (!container) return;

  const notifs = getStoredNotifications();
  const filtered = currentNotifFilter === "all"
    ? notifs
    : notifs.filter((n) => n.category === currentNotifFilter);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="notif-empty-state">
        <i class="fa-solid fa-bell-slash"></i>
        <p>No active alerts in this category.</p>
        <span style="font-size:11px; color:#94a3b8;">All national corridors operating normally</span>
      </div>
    `;
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
              <strong>${escapeHTML(n.title)}</strong>
              <span class="notif-tag ${tagClass}">${tagLabel}</span>
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

  // Attach click listeners to individual notifications
  container.querySelectorAll(".notif-item").forEach((item) => {
    item.addEventListener("click", () => {
      const notifId = item.getAttribute("data-id");
      markNotificationAsRead(notifId);
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

function clearAllNotifications() {
  saveStoredNotifications([]);
  renderNotificationList();
  if (window.showToast) {
    window.showToast("All notifications cleared.", "info");
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

  // Floating Toast notification
  if (window.showToast) {
    const toastType = newNotif.priority === "critical" ? "error" : newNotif.priority === "success" ? "success" : "info";
    window.showToast(`🔔 [System Alert] ${newNotif.title}: ${newNotif.message.slice(0, 75)}...`, toastType);
  }
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

  if (window.showToast) {
    const toastType = priority === "critical" ? "error" : priority === "success" ? "success" : "info";
    window.showToast(`🔔 ${title}: ${message.slice(0, 75)}...`, toastType);
  }
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

  // 4. Cross-tab storage sync
  window.addEventListener("storage", (e) => {
    if (e.key === "landPredictNotifications") {
      renderNotificationList();
      updateNotificationBadge();
    }
  });
}

window.pushSystemNotification = pushSystemNotification;
window.startNotificationEngine = startNotificationEngine;


function setupGlobalButtons() {
  // Mobile sidebar menu toggle
  const menuBtn = document.getElementById("menuBtn");
  const sidebar = document.getElementById("sidebar");
  if (menuBtn && sidebar) {
    menuBtn.addEventListener("click", () => {
      sidebar.classList.toggle("active");
    });
  }

  // Global Sidebar Logout Button
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      logoutUser();
    });
  }

  // Close dropdowns on outside click
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".user-profile")) {
      document.getElementById("profileDropdownCard")?.classList.remove("active");
    }
    if (!e.target.closest(".notification-btn") && !e.target.closest(".notifications-dropdown-card")) {
      document.getElementById("notificationsDropdownCard")?.classList.remove("active");
    }
  });
}

function enforceRoleBasedUI(user) {
  const isAuditor = user.role === "Public Auditor";
  const isInspector = user.role === "Revenue Inspector";

  // 1. Check Create Project buttons
  const createBtns = document.querySelectorAll(".create-project-btn, a[href='createProject.html']");
  if (isAuditor) {
    createBtns.forEach((btn) => {
      btn.style.opacity = "0.45";
      btn.style.pointerEvents = "none";
      btn.title = "Action Restricted: Public Auditor has Read-Only permissions.";
      if (btn.tagName === "BUTTON") btn.disabled = true;
    });

    // If currently on createProject.html
    if (window.location.pathname.includes("createProject.html")) {
      const submitBtn = document.querySelector(".submit-btn");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Read-Only Mode (Public Auditor)";
        submitBtn.style.background = "#94a3b8";
      }
      showToast("Notice: You are in Read-Only mode as Public Auditor.", "info");
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

