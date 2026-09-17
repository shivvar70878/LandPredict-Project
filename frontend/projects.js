/**
 * LandPredict AI - Projects Master Directory
 * Real-time statutory data integration
 */

let projects = [];
let currentPage = 1;
const projectsPerPage = 8;

/* =========================================
   DOM ELEMENTS
========================================= */

const projectsTableBody = document.getElementById("projectsTableBody");
const projectSearch = document.getElementById("projectSearch");
const stateFilter = document.getElementById("stateFilter");
const projectTypeFilter = document.getElementById("projectTypeFilter");
const statusFilter = document.getElementById("statusFilter");

const previousPageBtn = document.getElementById("previousPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");
const currentPageElement = document.getElementById("currentPage");

const emptyState = document.getElementById("emptyState");
const paginationInfo = document.getElementById("paginationInfo");
const projectsTableInfo = document.getElementById("projectsTableInfo");

const projectModal = document.getElementById("projectModal");
const modalProjectDetails = document.getElementById("modalProjectDetails");
const modalProjectTitle = document.getElementById("modalProjectTitle");
const closeModalBtn = document.getElementById("closeModalBtn");

const resetFiltersBtn = document.getElementById("resetFiltersBtn");
const clearEmptyFiltersBtn = document.getElementById("clearEmptyFiltersBtn");
const refreshProjectsBtn = document.getElementById("refreshProjectsBtn");

/* =========================================
   POPULATE DROPDOWNS
========================================= */

function populateFilters() {
  if (!stateFilter || !projectTypeFilter) return;

  const currentState = stateFilter.value;
  const currentType = projectTypeFilter.value;

  // Reset to default option
  stateFilter.innerHTML = '<option value="all">All States</option>';
  projectTypeFilter.innerHTML = '<option value="all">All Types</option>';

  const states = [...new Set(projects.map((p) => p.state).filter(Boolean))].sort();
  const types = [...new Set(projects.map((p) => p.type).filter(Boolean))].sort();

  states.forEach((state) => {
    const opt = document.createElement("option");
    opt.value = state;
    opt.textContent = state;
    stateFilter.appendChild(opt);
  });

  types.forEach((type) => {
    const opt = document.createElement("option");
    opt.value = type;
    opt.textContent = type;
    projectTypeFilter.appendChild(opt);
  });

  // Restore previous selection if still valid
  if (states.includes(currentState)) stateFilter.value = currentState;
  if (types.includes(currentType)) projectTypeFilter.value = currentType;
}

/* =========================================
   FILTER PROJECTS
========================================= */

function getFilteredProjects() {
  const searchValue = projectSearch ? projectSearch.value.toLowerCase().trim() : "";
  const selectedState = stateFilter ? stateFilter.value : "all";
  const selectedType = projectTypeFilter ? projectTypeFilter.value : "all";
  const selectedStatus = statusFilter ? statusFilter.value : "all";

  return projects.filter((project) => {
    const matchesSearch =
      !searchValue ||
      (project.id && project.id.toLowerCase().includes(searchValue)) ||
      (project.name && project.name.toLowerCase().includes(searchValue)) ||
      (project.state && project.state.toLowerCase().includes(searchValue)) ||
      (project.district && project.district.toLowerCase().includes(searchValue)) ||
      (project.type && project.type.toLowerCase().includes(searchValue));

    const matchesState = selectedState === "all" || project.state === selectedState;
    const matchesType = selectedType === "all" || project.type === selectedType;
    const matchesStatus = selectedStatus === "all" || project.status === selectedStatus;

    return matchesSearch && matchesState && matchesType && matchesStatus;
  });
}

/* =========================================
   RENDER PROJECT TABLE
========================================= */

function renderProjects() {
  if (!projectsTableBody) return;

  const filteredProjects = getFilteredProjects();
  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / projectsPerPage));

  if (currentPage > totalPages) {
    currentPage = totalPages;
  }

  const startIndex = (currentPage - 1) * projectsPerPage;
  const endIndex = startIndex + projectsPerPage;
  const paginatedProjects = filteredProjects.slice(startIndex, endIndex);

  projectsTableBody.innerHTML = "";

  // Update header text based on active filter
  const currentStatus = statusFilter ? statusFilter.value : "all";
  let statusLabel = "Total";
  if (currentStatus === "active") statusLabel = "Active In-Progress";
  else if (currentStatus === "delayed") statusLabel = "Delayed / At-Risk";
  else if (currentStatus === "completed") statusLabel = "Completed";

  if (projectsTableInfo) {
    projectsTableInfo.textContent = `Showing ${filteredProjects.length} ${statusLabel} Projects · Page ${currentPage} of ${totalPages}`;
  }

  if (filteredProjects.length === 0) {
    if (emptyState) emptyState.classList.add("active");
    if (paginationInfo) paginationInfo.textContent = "No projects found";
    if (currentPageElement) currentPageElement.textContent = "1";
    updatePaginationButtons(0);
    return;
  }

  if (emptyState) emptyState.classList.remove("active");

  paginatedProjects.forEach((project) => {
    const row = document.createElement("tr");

    let delayDisplay = `<span style="color:#2563eb; font-weight:600;"><i class="fa-solid fa-circle-check" style="font-size:10px; margin-right:3px;"></i> On Track</span>`;
    if (project.status === "delayed") {
      delayDisplay = `<span style="color:#dc2626; font-weight:600;"><i class="fa-solid fa-clock" style="font-size:10px; margin-right:3px;"></i> ${project.delayDays} Days</span>`;
    } else if (project.status === "completed") {
      delayDisplay = `<span style="color:#16a34a; font-weight:600;"><i class="fa-solid fa-flag-checkered" style="font-size:10px; margin-right:3px;"></i> 0 Days</span>`;
    }

    let statusBadge = `<span class="status-badge status-active"><i class="fa-solid fa-circle-notch fa-spin" style="font-size:8px; margin-right:3px;"></i> Active</span>`;
    if (project.status === "delayed") {
      statusBadge = `<span class="status-badge status-delayed"><i class="fa-solid fa-triangle-exclamation" style="font-size:8px; margin-right:3px;"></i> Delayed</span>`;
    } else if (project.status === "completed") {
      statusBadge = `<span class="status-badge status-completed"><i class="fa-solid fa-check" style="font-size:8px; margin-right:3px;"></i> Completed</span>`;
    }

    const compDisplay = project.compensationPct
      ? `${project.compensation} (${project.compensationPct}%)`
      : project.compensation;

    row.innerHTML = `
      <td><strong>${escapeHTML(project.id)}</strong></td>
      <td>${escapeHTML(project.state)}</td>
      <td>${escapeHTML(project.type)}</td>
      <td>${Number(project.landArea).toLocaleString()} Acres</td>
      <td>${Number(project.families).toLocaleString()}</td>
      <td>${escapeHTML(compDisplay)}</td>
      <td>${delayDisplay}</td>
      <td>${statusBadge}</td>
      <td>
        <div class="action-buttons">
          <button class="action-btn view-btn" data-id="${escapeHTML(project.id)}" title="View Project Dossier">
            <i class="fa-solid fa-eye"></i>
          </button>
          <button class="action-btn edit-btn" data-id="${escapeHTML(project.id)}" title="Open Detailed Analysis">
            <i class="fa-solid fa-arrow-up-right-from-square"></i>
          </button>
          <button class="action-btn delete-btn" data-id="${escapeHTML(project.id)}" title="Delete Project">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    `;

    projectsTableBody.appendChild(row);
  });

  const showingStart = startIndex + 1;
  const showingEnd = Math.min(endIndex, filteredProjects.length);

  if (paginationInfo) {
    paginationInfo.textContent = `Showing ${showingStart}-${showingEnd} of ${filteredProjects.length} projects`;
  }

  if (currentPageElement) {
    currentPageElement.textContent = currentPage;
  }

  updatePaginationButtons(filteredProjects.length);
  addTableButtonEvents();
}

function escapeHTML(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function capitalizeFirstLetter(text) {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/* =========================================
   PAGINATION CONTROLS
========================================= */

function updatePaginationButtons(totalProjects) {
  const totalPages = Math.ceil(totalProjects / projectsPerPage);
  if (previousPageBtn) previousPageBtn.disabled = currentPage === 1;
  if (nextPageBtn) nextPageBtn.disabled = currentPage >= totalPages || totalPages === 0;
}

if (previousPageBtn) {
  previousPageBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderProjects();
    }
  });
}

if (nextPageBtn) {
  nextPageBtn.addEventListener("click", () => {
    const filtered = getFilteredProjects();
    const totalPages = Math.ceil(filtered.length / projectsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      renderProjects();
    }
  });
}

/* =========================================
   TABLE BUTTON EVENTS
========================================= */

function addTableButtonEvents() {
  document.querySelectorAll(".view-btn").forEach((button) => {
    button.addEventListener("click", () => {
      showProjectDetails(button.dataset.id);
    });
  });

  document.querySelectorAll(".edit-btn").forEach((button) => {
    button.addEventListener("click", () => {
      window.location.href = `details.html?id=${encodeURIComponent(button.dataset.id)}`;
    });
  });

  document.querySelectorAll(".delete-btn").forEach((button) => {
    button.addEventListener("click", () => {
      deleteProject(button.dataset.id);
    });
  });
}

/* =========================================
   PROJECT DETAILS MODAL
========================================= */

function showProjectDetails(projectId) {
  const project = projects.find((item) => item.id === projectId);
  if (!project) return;

  if (modalProjectTitle) {
    modalProjectTitle.textContent = `${project.id} - ${project.name || project.type}`;
  }

  let statusBadge = `<span class="status-badge status-active">Active (In Progress)</span>`;
  if (project.status === "delayed") {
    statusBadge = `<span class="status-badge status-delayed">Delayed (${project.delayDays} Days Delay)</span>`;
  } else if (project.status === "completed") {
    statusBadge = `<span class="status-badge status-completed">Completed</span>`;
  }

  if (modalProjectDetails) {
    modalProjectDetails.innerHTML = `
      <div class="detail-item">
        <h4>Project ID</h4>
        <p><strong>${escapeHTML(project.id)}</strong></p>
      </div>

      <div class="detail-item">
        <h4>Project Name</h4>
        <p>${escapeHTML(project.name || `${project.state} ${project.type}`)}</p>
      </div>

      <div class="detail-item">
        <h4>State & District</h4>
        <p>${escapeHTML(project.state)} (${escapeHTML(project.district)})</p>
      </div>

      <div class="detail-item">
        <h4>Project Type & Land</h4>
        <p>${escapeHTML(project.type)} · ${escapeHTML(project.landType)}</p>
      </div>

      <div class="detail-item">
        <h4>Statutory Stage</h4>
        <p style="color:#2563eb; font-weight:600;"><i class="fa-solid fa-landmark"></i> ${escapeHTML(project.stage)}</p>
      </div>

      <div class="detail-item">
        <h4>Project Status</h4>
        <p>${statusBadge}</p>
      </div>

      <div class="detail-item">
        <h4>Land Area</h4>
        <p>${Number(project.landArea).toLocaleString()} Acres</p>
      </div>

      <div class="detail-item">
        <h4>Affected Families</h4>
        <p>${Number(project.families).toLocaleString()}</p>
      </div>

      <div class="detail-item">
        <h4>Compensation Status</h4>
        <p>${escapeHTML(project.compensation)} (${project.compensationPct}%)</p>
      </div>

      <div class="detail-item">
        <h4>Possession Status</h4>
        <p>${escapeHTML(project.possessionStatus)}</p>
      </div>

      <div class="detail-item">
        <h4>Legal / Court Disputes</h4>
        <p>${project.legalDisputes > 0 ? `<span style="color:#dc2626; font-weight:600;">${project.legalDisputes} Dispute(s)</span>` : "None (Clear Title)"}</p>
      </div>

      <div class="detail-item">
        <h4>Pending Approvals</h4>
        <p>${project.pendingApprovals} Departmental Approval(s)</p>
      </div>

      <div style="grid-column: 1/-1; margin-top: 15px; display: flex; gap: 10px;">
        <a href="details.html?id=${encodeURIComponent(project.id)}" class="action-btn" style="flex:1; height:44px; text-align:center; text-decoration:none; background:#16a34a; color:#ffffff; padding:10px 14px; border-radius:8px; font-weight:600; display:flex; align-items:center; justify-content:center; gap:8px;">
          <i class="fa-solid fa-arrow-up-right-from-square"></i> Open Full Detailed Dossier & AI Delay Analysis
        </a>
      </div>
    `;
  }

  if (projectModal) {
    projectModal.classList.add("active");
  }
}

if (closeModalBtn) {
  closeModalBtn.addEventListener("click", () => {
    if (projectModal) projectModal.classList.remove("active");
  });
}

if (projectModal) {
  projectModal.addEventListener("click", (e) => {
    if (e.target === projectModal) {
      projectModal.classList.remove("active");
    }
  });
}

/* =========================================
   DELETE PROJECT
========================================= */

function deleteProject(projectId) {
  const confirmDelete = confirm(`Are you sure you want to delete project ${projectId}?`);
  if (!confirmDelete) return;

  const apiBase = typeof window !== "undefined" && window.API_BASE_URL !== undefined ? window.API_BASE_URL : "https://landpredict-project.onrender.com";
  fetch(`${apiBase}/api/projects/${encodeURIComponent(projectId)}`, {
    method: "DELETE"
  })
    .then((res) => res.json())
    .then((data) => {
      projects = projects.filter((p) => p.id !== projectId);
      updateAllData();
      if (window.showToast) window.showToast(`Project ${projectId} deleted.`, "info");
    })
    .catch((err) => {
      // Local fallback removal
      projects = projects.filter((p) => p.id !== projectId);
      updateAllData();
    });
}

/* =========================================
   UPDATE STATISTICS & COUNTERS
========================================= */

function updateStatistics() {
  const total = projects.length;
  const active = projects.filter((p) => p.status === "active").length;
  const delayed = projects.filter((p) => p.status === "delayed").length;
  const completed = projects.filter((p) => p.status === "completed").length;

  const totalEl = document.getElementById("totalProjects");
  const activeEl = document.getElementById("activeProjects");
  const delayedEl = document.getElementById("delayedProjects");
  const completedEl = document.getElementById("completedProjects");

  if (totalEl) totalEl.textContent = total.toLocaleString();
  if (activeEl) activeEl.textContent = active.toLocaleString();
  if (delayedEl) delayedEl.textContent = delayed.toLocaleString();
  if (completedEl) completedEl.textContent = completed.toLocaleString();

  // Overview cards in the right column
  const ovActive = document.getElementById("overviewActive");
  const ovDelayed = document.getElementById("overviewDelayed");
  const ovCompleted = document.getElementById("overviewCompleted");
  const ovTotal = document.getElementById("overviewTotal");

  if (ovActive) ovActive.textContent = active.toLocaleString();
  if (ovDelayed) ovDelayed.textContent = delayed.toLocaleString();
  if (ovCompleted) ovCompleted.textContent = completed.toLocaleString();
  if (ovTotal) ovTotal.textContent = total.toLocaleString();

  // Quick tab badges
  const bAll = document.getElementById("tabBadgeAll");
  const bActive = document.getElementById("tabBadgeActive");
  const bDelayed = document.getElementById("tabBadgeDelayed");
  const bCompleted = document.getElementById("tabBadgeCompleted");

  if (bAll) bAll.textContent = total.toLocaleString();
  if (bActive) bActive.textContent = active.toLocaleString();
  if (bDelayed) bDelayed.textContent = delayed.toLocaleString();
  if (bCompleted) bCompleted.textContent = completed.toLocaleString();
}

/* =========================================
   HIGH RISK PROJECTS WIDGET
========================================= */

function renderHighRiskProjects() {
  const highRiskContainer = document.getElementById("highRiskProjects");
  if (!highRiskContainer) return;

  const highRiskProjects = [...projects]
    .filter((p) => p.status === "delayed" || p.legalDisputes >= 2)
    .sort((a, b) => b.delayDays + b.legalDisputes * 10 - (a.delayDays + a.legalDisputes * 10))
    .slice(0, 4);

  highRiskContainer.innerHTML = "";

  if (highRiskProjects.length === 0) {
    highRiskContainer.innerHTML = "<p style='color:#64748b; padding:10px;'>No high-risk bottlenecks detected.</p>";
    return;
  }

  highRiskProjects.forEach((project) => {
    const riskScore = project.delayDays + project.legalDisputes * 10;
    highRiskContainer.innerHTML += `
      <div class="high-risk-item" style="cursor:pointer;" onclick="showProjectDetails('${escapeHTML(project.id)}')">
        <div>
          <h4>${escapeHTML(project.id)}</h4>
          <p>${escapeHTML(project.state)} · ${project.delayDays} delay days</p>
        </div>
        <span class="risk-label" style="background:#fee2e2; color:#dc2626; padding:4px 8px; border-radius:6px; font-size:11px; font-weight:700;">
          Risk: ${riskScore}
        </span>
      </div>
    `;
  });
}

/* =========================================
   SYNC UI (STAT CARDS & TABS)
========================================= */

function syncStatusUi(selectedStatus) {
  // Update Dropdown value
  if (statusFilter && statusFilter.value !== selectedStatus) {
    statusFilter.value = selectedStatus;
  }

  // Update Stat Cards highlight
  const cards = [
    { id: "cardTotal", status: "all", class: "selected-card" },
    { id: "cardActive", status: "active", class: "active-card" },
    { id: "cardDelayed", status: "delayed", class: "delayed-card" },
    { id: "cardCompleted", status: "completed", class: "completed-card" }
  ];

  cards.forEach((c) => {
    const el = document.getElementById(c.id);
    if (el) {
      el.classList.remove("selected-card", "active-card", "delayed-card", "completed-card");
      if (selectedStatus === c.status) {
        el.classList.add("selected-card", c.class);
      }
    }
  });

  // Update Quick Tabs
  document.querySelectorAll(".status-tab").forEach((tab) => {
    if (tab.dataset.status === selectedStatus) {
      tab.classList.add("active");
    } else {
      tab.classList.remove("active");
    }
  });
}

/* =========================================
   FILTER & STATUS EVENT LISTENERS
========================================= */

function resetPagination() {
  currentPage = 1;
  renderProjects();
}

if (projectSearch) projectSearch.addEventListener("input", resetPagination);
if (stateFilter) stateFilter.addEventListener("change", resetPagination);
if (projectTypeFilter) projectTypeFilter.addEventListener("change", resetPagination);

if (statusFilter) {
  statusFilter.addEventListener("change", (e) => {
    syncStatusUi(e.target.value);
    resetPagination();
  });
}

// Stat Cards Click to Filter
const statCardMapping = [
  { id: "cardTotal", status: "all" },
  { id: "cardActive", status: "active" },
  { id: "cardDelayed", status: "delayed" },
  { id: "cardCompleted", status: "completed" }
];

statCardMapping.forEach((item) => {
  const card = document.getElementById(item.id);
  if (card) {
    card.addEventListener("click", () => {
      syncStatusUi(item.status);
      resetPagination();
    });
  }
});

// Quick Tabs Click to Filter
document.querySelectorAll(".status-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const st = tab.dataset.status || "all";
    syncStatusUi(st);
    resetPagination();
  });
});

/* =========================================
   CLEAR FILTERS
========================================= */

function clearFilters() {
  if (projectSearch) projectSearch.value = "";
  if (stateFilter) stateFilter.value = "all";
  if (projectTypeFilter) projectTypeFilter.value = "all";
  if (statusFilter) statusFilter.value = "all";

  syncStatusUi("all");
  currentPage = 1;
  renderProjects();
}

if (resetFiltersBtn) resetFiltersBtn.addEventListener("click", clearFilters);
if (clearEmptyFiltersBtn) clearEmptyFiltersBtn.addEventListener("click", clearFilters);

/* =========================================
   DATA INGESTION (POSTGRESQL API + CSV FALLBACK)
========================================= */

async function fetchProjectsFromDb() {
  if (refreshProjectsBtn) {
    refreshProjectsBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Syncing PostgreSQL...`;
  }

  const apiBase = typeof window !== "undefined" && window.API_BASE_URL !== undefined
    ? window.API_BASE_URL
    : "https://landpredict-project.onrender.com";

  try {
    const res = await fetch(`${apiBase}/api/projects?limit=600`);
    if (res.ok) {
      const data = await res.json();
      if (data.projects && data.projects.length > 0) {
        projects = data.projects.map((p) => {
          let computedStatus = "active";
          const isDelayed =
            Number(p.is_delayed) === 1 ||
            Number(p.delay_days) > 0 ||
            (p.status && p.status.toLowerCase() === "delayed");

          const isCompleted =
            (p.possession_status === "Full Possession" && !isDelayed) ||
            (p.compensation_status === "Fully Disbursed" && p.possession_status === "Full Possession") ||
            (p.status && p.status.toLowerCase() === "completed");

          if (isDelayed) {
            computedStatus = "delayed";
          } else if (isCompleted) {
            computedStatus = "completed";
          } else {
            computedStatus = "active";
          }

          return {
            id: p.project_id,
            name: p.project_name || `${p.state} ${p.project_type} Corridor`,
            state: p.state,
            district: p.district || "District-1",
            type: p.project_type,
            landType: p.land_type || "Agricultural",
            landArea: Number(p.land_area_acres || 0),
            families: Number(p.affected_families || 0),
            stage: p.acquisition_stage || "Section 3D",
            compensation: p.compensation_status || "In Progress",
            compensationPct: Number(p.compensation_disbursed_pct || 0),
            possessionStatus: p.possession_status || "Partial Possession",
            delayDays: Number(p.delay_days || 0),
            status: computedStatus,
            isDelayed: isDelayed,
            legalDisputes: Number(p.legal_disputes_count || 0),
            pendingApprovals: Number(p.pending_approvals_count || 0),
            rehabilitation: Number(p.rehabilitation_progress_pct || 0),
            riskScore: p.risk_score || (isDelayed ? 65 : 20),
            riskLevel: p.risk_level || (isDelayed ? "High" : "Low")
          };
        });

        console.log(`[Projects] Successfully synced ${projects.length} projects from PostgreSQL.`);
        populateFilters();
        updateAllData();

        const activeCount = projects.filter((p) => p.status === "active").length;
        if (window.showToast) {
          window.showToast(`Synced ${projects.length} corridors (${activeCount} Active In-Progress).`, "success");
        }
        return;
      }
    }
  } catch (err) {
    console.warn("[Projects] PostgreSQL API fetch failed, trying local fallback:", err);
  } finally {
    if (refreshProjectsBtn) {
      refreshProjectsBtn.innerHTML = `<i class="fa-solid fa-rotate"></i>`;
    }
  }

  // Fallback to sample dataset if database is offline
  if (projects.length === 0) {
    loadFallbackProjects();
  }
}

function loadFallbackProjects() {
  projects = [
    { id: "LAP-10001", name: "Delhi-Dehradun Expressway", state: "Uttar Pradesh", district: "Saharanpur", type: "Highway", landType: "Private Agricultural", landArea: 840, families: 210, stage: "Section 3D", compensation: "Partially Disbursed", compensationPct: 45, possessionStatus: "Partial Possession", delayDays: 0, status: "active", isDelayed: false, legalDisputes: 1, pendingApprovals: 2, rehabilitation: 30, riskScore: 25, riskLevel: "Low" },
    { id: "LAP-10002", name: "Vadodara-Mumbai Expressway", state: "Gujarat", district: "Surat", type: "Expressway", landType: "Private Agricultural", landArea: 1120, families: 340, stage: "Section 3D", compensation: "In Progress", compensationPct: 30, possessionStatus: "Partial Possession", delayDays: 78, status: "delayed", isDelayed: true, legalDisputes: 4, pendingApprovals: 4, rehabilitation: 15, riskScore: 78, riskLevel: "High" },
    { id: "LAP-10003", name: "Bengaluru-Chennai Expressway", state: "Karnataka", district: "Kolar", type: "Highway", landType: "Mixed", landArea: 620, families: 180, stage: "Section 3G", compensation: "Fully Disbursed", compensationPct: 100, possessionStatus: "Full Possession", delayDays: 0, status: "completed", isDelayed: false, legalDisputes: 0, pendingApprovals: 0, rehabilitation: 100, riskScore: 10, riskLevel: "Low" },
    { id: "LAP-10004", name: "Raipur-Visakhapatnam Corridor", state: "Odisha", district: "Koraput", type: "Economic Corridor", landType: "Forest / Tribal", landArea: 950, families: 290, stage: "Section 3A", compensation: "Not Started", compensationPct: 0, possessionStatus: "Survey Complete", delayDays: 0, status: "active", isDelayed: false, legalDisputes: 0, pendingApprovals: 3, rehabilitation: 0, riskScore: 35, riskLevel: "Medium" },
    { id: "LAP-10005", name: "Ganga Expressway Package-4", state: "Uttar Pradesh", district: "Unnao", type: "Expressway", landType: "Private Agricultural", landArea: 1450, families: 480, stage: "Section 3D", compensation: "Partially Disbursed", compensationPct: 60, possessionStatus: "Partial Possession", delayDays: 0, status: "active", isDelayed: false, legalDisputes: 1, pendingApprovals: 1, rehabilitation: 45, riskScore: 20, riskLevel: "Low" },
    { id: "LAP-10006", name: "Amritsar-Jamnagar Corridor", state: "Rajasthan", district: "Bikaner", type: "Highway", landType: "Barren / Agricultural", landArea: 1680, families: 220, stage: "Section 3H", compensation: "Fully Disbursed", compensationPct: 100, possessionStatus: "Full Possession", delayDays: 0, status: "completed", isDelayed: false, legalDisputes: 0, pendingApprovals: 0, rehabilitation: 100, riskScore: 5, riskLevel: "Low" }
  ];
  populateFilters();
  updateAllData();
}

if (refreshProjectsBtn) {
  refreshProjectsBtn.addEventListener("click", () => {
    fetchProjectsFromDb();
  });
}

/* =========================================
   UPDATE ALL DATA
========================================= */

function updateAllData() {
  updateStatistics();
  renderProjects();
  renderHighRiskProjects();
}

/* =========================================
   INITIALIZATION
========================================= */

document.addEventListener("DOMContentLoaded", () => {
  fetchProjectsFromDb();
});

// Immediate execution if DOM is already ready
if (document.readyState === "complete" || document.readyState === "interactive") {
  fetchProjectsFromDb();
}
