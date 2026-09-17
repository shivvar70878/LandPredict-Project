let allProjects = [];
let filteredProjects = [];
let currentPage = 1;

const projectsPerPage = 10;
const DATASET_PATH = "land_acquisition_dataset-5.csv";

let delayChartInstance = null;
let stateChartInstance = null;
let compensationChartInstance = null;

document.addEventListener("DOMContentLoaded", () => {
  initializeEventListeners();
  loadUserInformation();
  loadDataset();
});

function loadDataset() {
  const refreshButton = document.getElementById("refreshDataBtn");

  if (refreshButton) {
    refreshButton.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Syncing Mongodb...`;
  }

  // 1. Try the database API first
  const apiBase = typeof window !== "undefined" && window.API_BASE_URL !== undefined ? window.API_BASE_URL : "https://landpredict-project.onrender.com";
  fetch(`${apiBase}/api/projects?limit=600`)
    .then((res) => {
      if (!res.ok) throw new Error("API not available");
      return res.json();
    })
    .then((data) => {
      if (data && data.projects && data.projects.length > 0) {
        allProjects = data.projects;
        filteredProjects = [...allProjects];
        console.log("Loaded from Mongodb Database:", allProjects.length, "Projects");
        initializeDashboard();
        updateDatasetStatus(true, "Mongodb DB Connected");
        if (refreshButton) {
          refreshButton.innerHTML = `<i class="fa-solid fa-rotate"></i> Refresh Data`;
        }
        if (window.showToast) {
          window.showToast(`Synced ${allProjects.length} projects from Mongodb database.`, "success");
        }
      } else {
        throw new Error("Empty DB response");
      }
    })
    .catch((err) => {
      console.warn("Mongodb API fetch fallback to CSV:", err);
      loadFromCsvFallback();
    });
}

function loadFromCsvFallback() {
  const refreshButton = document.getElementById("refreshDataBtn");

  if (typeof Papa === "undefined") {
    console.error("PapaParse library is not loaded.");
    updateDatasetStatus(false);
    if (refreshButton) refreshButton.innerHTML = "Data Error";
    return;
  }

  Papa.parse(DATASET_PATH, {
    download: true,
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
    complete: function (results) {
      if (results.data && results.data.length > 0) {
        allProjects = results.data.filter(
          (project) => project.project_id !== undefined && project.project_id !== null && project.project_id !== ""
        );
        filteredProjects = [...allProjects];
        console.log("Dataset Loaded from CSV:", allProjects.length, "Projects");
        initializeDashboard();
        updateDatasetStatus(true, "CSV Dataset Connected");
        if (refreshButton) refreshButton.innerHTML = `<i class="fa-solid fa-rotate"></i> Refresh Data`;
      } else {
        updateDatasetStatus(false);
        if (refreshButton) refreshButton.innerHTML = "Data Error";
      }
    },
    error: function (error) {
      updateDatasetStatus(false);
      if (refreshButton) refreshButton.innerHTML = "Data Error";
    }
  });
}

function initializeDashboard() {
  populateFilters();
  updateDashboardStatistics();
  renderProjectsTable();
  renderHighRiskProjects();
  createCharts();
  updateNotificationCount();
}

function updateDatasetStatus(isConnected, customLabel = "Mongodb DB Connected") {
  const statusElement = document.querySelector(".dataset-status");

  if (!statusElement) return;

  if (isConnected) {
    statusElement.innerHTML = `
            <span class="status-dot"></span>
            <span>
                ${customLabel} (${allProjects.length.toLocaleString()} Records)
            </span>
        `;
  } else {
    statusElement.innerHTML = `
            <span class="status-dot" style="background:#ef4444;"></span>
            <span>Dataset Not Found</span>
        `;
  }
}

function populateFilters() {
  const stateFilter = document.getElementById("stateFilter");
  const projectTypeFilter = document.getElementById("projectTypeFilter");
  const compensationFilter = document.getElementById("compensationFilter");

  if (stateFilter) {
    stateFilter.innerHTML = '<option value="all">All States</option>';

    const states = [
      ...new Set(allProjects.map((project) => project.state).filter(Boolean)),
    ].sort();

    states.forEach((state) => {
      const option = document.createElement("option");
      option.value = state;
      option.textContent = state;
      stateFilter.appendChild(option);
    });
  }

  if (projectTypeFilter) {
    projectTypeFilter.innerHTML =
      '<option value="all">All Project Types</option>';

    const projectTypes = [
      ...new Set(
        allProjects.map((project) => project.project_type).filter(Boolean),
      ),
    ].sort();

    projectTypes.forEach((type) => {
      const option = document.createElement("option");
      option.value = type;
      option.textContent = type;
      projectTypeFilter.appendChild(option);
    });
  }

  if (compensationFilter) {
    compensationFilter.innerHTML =
      '<option value="all">All Compensation Status</option>';

    const compensationStatuses = [
      ...new Set(
        allProjects
          .map((project) => project.compensation_status)
          .filter(Boolean),
      ),
    ].sort();

    compensationStatuses.forEach((status) => {
      const option = document.createElement("option");
      option.value = status;
      option.textContent = status;
      compensationFilter.appendChild(option);
    });
  }
}

function applyFilters() {
  const stateFilter = document.getElementById("stateFilter");
  const projectTypeFilter = document.getElementById("projectTypeFilter");
  const compensationFilter = document.getElementById("compensationFilter");
  const delayFilter = document.getElementById("delayFilter");
  const searchInput = document.getElementById("searchProject");

  const state = stateFilter ? stateFilter.value : "all";
  const projectType = projectTypeFilter ? projectTypeFilter.value : "all";
  const compensation = compensationFilter ? compensationFilter.value : "all";
  const delayStatus = delayFilter ? delayFilter.value : "all";

  const searchText = searchInput ? searchInput.value.trim().toLowerCase() : "";

  filteredProjects = allProjects.filter((project) => {
    if (state !== "all" && project.state !== state) {
      return false;
    }

    if (projectType !== "all" && project.project_type !== projectType) {
      return false;
    }

    if (
      compensation !== "all" &&
      project.compensation_status !== compensation
    ) {
      return false;
    }

    if (delayStatus === "delayed" && Number(project.is_delayed) !== 1) {
      return false;
    }

    if (delayStatus === "not-delayed" && Number(project.is_delayed) !== 0) {
      return false;
    }

    if (searchText !== "") {
      const searchableText = [
        project.project_id,
        project.state,
        project.project_type,
      ]
        .join(" ")
        .toLowerCase();

      if (!searchableText.includes(searchText)) {
        return false;
      }
    }

    return true;
  });

  currentPage = 1;

  updateDashboardStatistics();
  renderProjectsTable();
  renderHighRiskProjects();
  createCharts();
}

function updateDashboardStatistics() {
  const totalProjects = filteredProjects.length;

  const delayedProjects = filteredProjects.filter(
    (project) => Number(project.is_delayed) === 1,
  );

  const delayedCount = delayedProjects.length;

  const delayPercentage =
    totalProjects > 0 ? (delayedCount / totalProjects) * 100 : 0;

  const totalDelayDays = delayedProjects.reduce(
    (total, project) => total + Number(project.delay_days || 0),
    0,
  );

  const averageDelay = delayedCount > 0 ? totalDelayDays / delayedCount : 0;

  const legalDisputes = filteredProjects.reduce(
    (total, project) => total + Number(project.legal_disputes_count || 0),
    0,
  );

  const affectedFamilies = filteredProjects.reduce(
    (total, project) => total + Number(project.affected_families ?? project.num_affected_families ?? project.families ?? 0),
    0,
  );

  const landArea = filteredProjects.reduce(
    (total, project) => total + Number(project.land_area_acres || 0),
    0,
  );

  const pendingApprovals = filteredProjects.reduce(
    (total, project) => total + Number(project.pending_approvals_count || 0),
    0,
  );

  const publicObjections = filteredProjects.reduce(
    (total, project) => total + Number(project.public_objections_count || 0),
    0,
  );

  setElementText("totalProjects", totalProjects.toLocaleString());

  setElementText("delayedProjects", delayedCount.toLocaleString());

  setElementText(
    "delayPercentage",
    `${delayPercentage.toFixed(1)}% of projects`,
  );

  setElementText("averageDelay", `${averageDelay.toFixed(1)} Days`);

  setElementText("totalLegalDisputes", legalDisputes.toLocaleString());

  setElementText("affectedFamilies", affectedFamilies.toLocaleString());
  const avgFamilies = totalProjects > 0 ? Math.round(affectedFamilies / totalProjects) : 0;
  setElementText("avgFamilies", `${avgFamilies.toLocaleString()} avg / corridor`);

  setElementText(
    "totalLandArea",
    `${landArea.toLocaleString(undefined, {
      maximumFractionDigits: 1,
    })} Acres`,
  );

  setElementText("pendingApprovals", pendingApprovals.toLocaleString());

  setElementText("publicObjections", publicObjections.toLocaleString());

  updateRiskFactors();
}

function setElementText(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}

function updateRiskFactors() {
  if (filteredProjects.length === 0) {
    updateRiskUI("legal", 0);
    updateRiskUI("court", 0);
    updateRiskUI("approval", 0);
    updateRiskUI("objection", 0);
    return;
  }

  const total = filteredProjects.length;

  const legalRisk = filteredProjects.filter(
    (project) => Number(project.legal_disputes_count) > 0,
  ).length;

  const courtRisk = filteredProjects.filter(
    (project) => Number(project.court_case_pending) === 1,
  ).length;

  const approvalRisk = filteredProjects.filter(
    (project) => Number(project.pending_approvals_count) >= 3,
  ).length;

  const objectionRisk = filteredProjects.filter(
    (project) => Number(project.public_objections_count) > 0,
  ).length;

  updateRiskUI("legal", (legalRisk / total) * 100);
  updateRiskUI("court", (courtRisk / total) * 100);
  updateRiskUI("approval", (approvalRisk / total) * 100);
  updateRiskUI("objection", (objectionRisk / total) * 100);
}

function updateRiskUI(riskType, percentage) {
  const percentageElement = document.getElementById(`${riskType}Risk`);

  const progressElement = document.getElementById(`${riskType}Progress`);

  if (percentageElement) {
    percentageElement.textContent = `${percentage.toFixed(1)}%`;
  }

  if (progressElement) {
    progressElement.style.width = `${Math.min(percentage, 100)}%`;
  }
}

function renderProjectsTable() {
  const tableBody = document.getElementById("projectsTableBody");

  if (!tableBody) return;

  const startIndex = (currentPage - 1) * projectsPerPage;

  const currentProjects = filteredProjects.slice(
    startIndex,
    startIndex + projectsPerPage,
  );

  tableBody.innerHTML = "";

  if (currentProjects.length === 0) {
    tableBody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align:center;padding:40px;">
                    No projects found.
                </td>
            </tr>
        `;

    updatePagination();
    return;
  }

  currentProjects.forEach((project) => {
    const actualIndex = allProjects.indexOf(project);

    const isDelayed = Number(project.is_delayed) === 1;

    const statusHTML = isDelayed
      ? '<span class="status-badge status-delayed">Delayed</span>'
      : '<span class="status-badge status-on-track">On Track</span>';

    const compensationClass = getCompensationClass(project.compensation_status);
    const familiesCount = Number(project.affected_families ?? project.num_affected_families ?? project.families ?? 0);

    const row = document.createElement("tr");

    row.innerHTML = `
            <td><strong>${escapeHTML(project.project_id)}</strong></td>
            <td>${escapeHTML(project.state)}</td>
            <td>${escapeHTML(project.project_type)}</td>
            <td>${formatNumber(project.land_area_acres, 1)} Acres</td>
            <td><strong style="color:#0f172a;">${familiesCount.toLocaleString()}</strong></td>
            <td>
                <span class="status-badge ${compensationClass}">
                    ${escapeHTML(project.compensation_status)}
                </span>
            </td>
            <td>${Number(project.legal_disputes_count) || 0}</td>
            <td>${Number(project.delay_days) || 0}</td>
            <td>${statusHTML}</td>
            <td>
                <button
                    class="view-details-btn"
                    data-project-index="${actualIndex}"
                >
                    View Details
                </button>
            </td>
        `;

    tableBody.appendChild(row);
  });

  document.querySelectorAll(".view-details-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const projectIndex = Number(this.dataset.projectIndex);

      openProjectDetails(allProjects[projectIndex]);
    });
  });

  updatePagination();
}

function getCompensationClass(status) {
  const value = String(status || "").toLowerCase();

  if (value.includes("fully")) {
    return "compensation-complete";
  }

  if (value.includes("partial")) {
    return "status-pending";
  }

  return "compensation-pending";
}

function updatePagination() {
  const totalPages = Math.ceil(filteredProjects.length / projectsPerPage);

  const currentPageElement = document.getElementById("currentPage");

  const tableInfo = document.getElementById("tableInfo");

  const previousButton = document.getElementById("previousPageBtn");

  const nextButton = document.getElementById("nextPageBtn");

  if (currentPageElement) {
    currentPageElement.textContent = currentPage;
  }

  const start =
    filteredProjects.length === 0 ? 0 : (currentPage - 1) * projectsPerPage + 1;

  const end = Math.min(currentPage * projectsPerPage, filteredProjects.length);

  if (tableInfo) {
    tableInfo.textContent =
      `Showing ${start}-${end} of ` +
      `${filteredProjects.length.toLocaleString()} projects`;
  }

  if (previousButton) {
    previousButton.disabled = currentPage === 1;
  }

  if (nextButton) {
    nextButton.disabled = currentPage >= totalPages || totalPages === 0;
  }
}

function openProjectDetails(project) {
  if (!project) return;

  const modal = document.getElementById("projectModal");

  const modalProjectId = document.getElementById("modalProjectId");

  const modalDetails = document.getElementById("modalProjectDetails");

  if (!modal || !modalDetails) return;

  if (modalProjectId) {
    modalProjectId.textContent = `Project ${project.project_id}`;
  }

  const familiesCount = Number(project.affected_families ?? project.num_affected_families ?? project.families ?? 0);

  const details = [
    ["Project ID", project.project_id],
    ["State", project.state],
    ["District Code", project.district_code || "DIS-01"],
    ["Project Type", project.project_type],
    ["Land Type", project.land_type],
    ["Land Area", `${formatNumber(project.land_area_acres, 2)} Acres`],
    ["Affected Families", `${familiesCount.toLocaleString()} Titleholder Families`],
    ["Departments Involved", project.num_departments_involved],
    ["Notification Age", `${project.notification_age_days} Days`],
    ["Compensation Status", project.compensation_status],
    ["Compensation Disbursed", `${project.compensation_disbursed_pct}%`],
    ["Possession Status", project.possession_status],
    ["Legal Disputes", project.legal_disputes_count],
    [
      "Court Case Pending",
      Number(project.court_case_pending) === 1 ? "Yes" : "No",
    ],
    [
      "Rehabilitation Required",
      Number(project.rehabilitation_required) === 1 || familiesCount > 20 ? "Yes (Mandatory R&R Scheme)" : "No",
    ],
    ["Rehabilitation Progress", `${project.rehabilitation_progress_pct || 0}%`],
    ["Stakeholder Responsiveness", project.stakeholder_responsiveness_score],
    [
      "Historical Department Performance",
      project.historical_dept_performance_score,
    ],
    ["Public Objections", project.public_objections_count],
    ["Pending Approvals", project.pending_approvals_count],
    ["Budget Utilization", `${project.budget_utilization_pct}%`],
    [
      "Monsoon Season Overlap",
      Number(project.monsoon_season_overlap) === 1 ? "Yes" : "No",
    ],
    ["Project Delayed", Number(project.is_delayed) === 1 ? "Yes" : "No"],
    ["Delay Duration", `${project.delay_days} Days`],
  ];

  let detailsHTML = '<div class="project-details-grid">';

  details.forEach((detail) => {
    detailsHTML += `
            <div class="detail-item">
                <span>${escapeHTML(detail[0])}</span>
                <strong>
                    ${escapeHTML(String(detail[1] ?? "N/A"))}
                </strong>
            </div>
        `;
  });

  detailsHTML += "</div>";

  const riskScore = calculateRiskScore(project);

  detailsHTML += `
        <div class="risk-analysis">
            <h3>AI Risk Analysis</h3>
            <p>
                Calculated Risk Score:
                <strong style="color:${getRiskColor(riskScore)};">
                    ${riskScore}%
                </strong>
            </p>
            <p>${getRiskDescription(riskScore)}</p>
        </div>
        <div style="margin-top: 15px;">
            <a href="details.html?id=${encodeURIComponent(project.project_id)}" style="display:flex; align-items:center; justify-content:center; gap:8px; background:#16a34a; color:#ffffff; padding:11px 16px; border-radius:8px; font-weight:600; text-decoration:none; box-shadow:0 4px 12px rgba(22,163,74,0.25);">
                <i class="fa-solid fa-arrow-up-right-from-square"></i> Open Full Detailed Dossier &amp; AI Analysis
            </a>
        </div>
    `;

  modalDetails.innerHTML = detailsHTML;
  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeProjectModal() {
  const modal = document.getElementById("projectModal");

  if (modal) {
    modal.classList.remove("active");
    document.body.style.overflow = "auto";
  }
}

function openFamiliesModal() {
  const modal = document.getElementById("familiesModal");
  const body = document.getElementById("familiesModalBody");
  if (!modal || !body) return;

  const totalFamilies = filteredProjects.reduce(
    (acc, p) => acc + Number(p.affected_families ?? p.num_affected_families ?? p.families ?? 0),
    0
  );
  const totalProjects = filteredProjects.length;
  const avgFamilies = totalProjects > 0 ? Math.round(totalFamilies / totalProjects) : 0;
  const highImpactProjects = filteredProjects.filter(
    (p) => Number(p.affected_families ?? p.num_affected_families ?? p.families ?? 0) >= 150
  );

  const topCorridors = [...filteredProjects]
    .sort((a, b) => {
      const famA = Number(a.affected_families ?? a.num_affected_families ?? a.families ?? 0);
      const famB = Number(b.affected_families ?? b.num_affected_families ?? b.families ?? 0);
      return famB - famA;
    })
    .slice(0, 5);

  let topCorridorsHTML = "";
  topCorridors.forEach((p, idx) => {
    const fam = Number(p.affected_families ?? p.num_affected_families ?? p.families ?? 0);
    const delayed = Number(p.is_delayed) === 1;
    topCorridorsHTML += `
      <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 12px; background:${idx % 2 === 0 ? '#f8fafc' : '#ffffff'}; border-radius:8px; margin-bottom:6px; border:1px solid #e2e8f0;">
        <div>
          <strong style="color:#0f172a; font-size:13px;">${escapeHTML(p.project_id)}</strong>
          <span style="color:#64748b; font-size:12px; margin-left:6px;">${escapeHTML(p.state)} · ${escapeHTML(p.project_type)}</span>
          <div style="font-size:11px; color:#475569; margin-top:2px;">Compensation: ${escapeHTML(p.compensation_status || 'In Progress')} (${p.compensation_disbursed_pct || 0}%)</div>
        </div>
        <div style="text-align:right;">
          <span style="display:inline-block; padding:3px 8px; border-radius:6px; font-weight:700; font-size:12px; background:#dbeafe; color:#1d4ed8;">
            <i class="fa-solid fa-users" style="font-size:10px; margin-right:3px;"></i> ${fam.toLocaleString()} Families
          </span>
          <div style="font-size:11px; margin-top:3px; font-weight:600; color:${delayed ? '#dc2626' : '#16a34a'};">
            ${delayed ? `${p.delay_days}d Delay` : 'On Track'}
          </div>
        </div>
      </div>
    `;
  });

  body.innerHTML = `
    <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px;">
      <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:10px; padding:14px; text-align:center;">
        <span style="font-size:11px; font-weight:700; color:#1e40af; text-transform:uppercase;">Total Titleholders</span>
        <h3 style="font-size:22px; color:#1d4ed8; margin:6px 0 0 0; font-family:'Outfit',sans-serif;">${totalFamilies.toLocaleString()}</h3>
        <small style="color:#64748b; font-size:11px;">Aadhaar &amp; Land Records Linked</small>
      </div>

      <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:14px; text-align:center;">
        <span style="font-size:11px; font-weight:700; color:#166534; text-transform:uppercase;">Average / Corridor</span>
        <h3 style="font-size:22px; color:#15803d; margin:6px 0 0 0; font-family:'Outfit',sans-serif;">${avgFamilies.toLocaleString()}</h3>
        <small style="color:#64748b; font-size:11px;">Families per Project</small>
      </div>

      <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:10px; padding:14px; text-align:center;">
        <span style="font-size:11px; font-weight:700; color:#991b1b; text-transform:uppercase;">High Impact (&ge;150)</span>
        <h3 style="font-size:22px; color:#dc2626; margin:6px 0 0 0; font-family:'Outfit',sans-serif;">${highImpactProjects.length}</h3>
        <small style="color:#64748b; font-size:11px;">Mandatory R&amp;R Oversight</small>
      </div>
    </div>

    <h4 style="font-size:14px; font-weight:700; color:#0f172a; margin:0 0 10px 0;">
      <i class="fa-solid fa-ranking-star" style="color:#f59e0b; margin-right:6px;"></i> Top Corridors with Highest Affected Families
    </h4>
    <div style="max-height: 240px; overflow-y: auto; margin-bottom: 18px;">
      ${topCorridorsHTML}
    </div>

    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:12px 16px; margin-bottom: 18px;">
      <h5 style="margin:0 0 6px 0; color:#334155; font-size:12px; font-weight:700; display:flex; align-items:center; gap:6px;">
        <i class="fa-solid fa-scale-balanced" style="color:#2563eb;"></i> RFCTLARR Act, 2013 Statutory Compliance
      </h5>
      <p style="margin:0; font-size:11.5px; color:#64748b; line-height:1.5;">
        Section 15 (Hearing of Objections) &amp; Section 16 (Rehabilitation Scheme) mandate social impact assessment and direct PFMS compensation disbursement for all affected titleholders and agricultural dependents.
      </p>
    </div>

    <div style="display:flex; justify-content:flex-end; gap:10px;">
      <button id="filterHighImpactBtn" style="padding:9px 16px; border-radius:8px; border:none; background:#2563eb; color:#ffffff; font-weight:600; font-size:12px; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
        <i class="fa-solid fa-filter"></i> Filter Corridors &ge; 100 Families in Table
      </button>
      <button id="modalCloseBtn" style="padding:9px 16px; border-radius:8px; border:1px solid #cbd5e1; background:#ffffff; color:#475569; font-weight:600; font-size:12px; cursor:pointer;">
        Close
      </button>
    </div>
  `;

  const filterHighImpactBtn = document.getElementById("filterHighImpactBtn");
  if (filterHighImpactBtn) {
    filterHighImpactBtn.addEventListener("click", () => {
      filteredProjects = allProjects.filter(
        (p) => Number(p.affected_families ?? p.num_affected_families ?? p.families ?? 0) >= 100
      );
      currentPage = 1;
      updateDashboardStatistics();
      renderProjectsTable();
      renderHighRiskProjects();
      createCharts();
      closeFamiliesModal();
      const tableCard = document.querySelector(".projects-table-card");
      if (tableCard) tableCard.scrollIntoView({ behavior: "smooth" });
      if (window.showToast) {
        window.showToast(`Filtered to ${filteredProjects.length} high-impact corridors (>= 100 families).`, "info");
      }
    });
  }

  const modalCloseBtn = document.getElementById("modalCloseBtn");
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener("click", closeFamiliesModal);
  }

  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeFamiliesModal() {
  const modal = document.getElementById("familiesModal");
  if (modal) {
    modal.classList.remove("active");
    document.body.style.overflow = "auto";
  }
}


function calculateRiskScore(project) {
  let score = 0;

  score += Math.min(Number(project.legal_disputes_count || 0) * 8, 24);

  if (Number(project.court_case_pending) === 1) {
    score += 15;
  }

  score += Math.min(Number(project.pending_approvals_count || 0) * 3, 15);

  score += Math.min(Number(project.public_objections_count || 0) * 3, 12);

  const compensation = Number(project.compensation_disbursed_pct || 0);

  if (compensation < 50) {
    score += 12;
  } else if (compensation < 80) {
    score += 6;
  }

  if (Number(project.rehabilitation_required) === 1) {
    const rehabilitation = Number(project.rehabilitation_progress_pct || 0);

    if (rehabilitation < 50) {
      score += 8;
    }
  }

  const stakeholderScore = Number(
    project.stakeholder_responsiveness_score || 0,
  );

  if (stakeholderScore < 4) {
    score += 8;
  }

  const departmentPerformance = Number(
    project.historical_dept_performance_score || 0,
  );

  if (departmentPerformance < 50) {
    score += 6;
  }

  if (Number(project.monsoon_season_overlap) === 1) {
    score += 4;
  }

  if (Number(project.is_delayed) === 1) {
    score += 10;
  }

  return Math.min(Math.round(score), 100);
}

function getRiskColor(score) {
  if (score >= 70) {
    return "#dc2626";
  }

  if (score >= 40) {
    return "#d97706";
  }

  return "#16a34a";
}

function getRiskDescription(score) {
  if (score >= 70) {
    return "High risk detected. Immediate intervention and detailed project review are recommended.";
  }

  if (score >= 40) {
    return "Moderate risk detected. The project should be monitored carefully.";
  }

  return "Low risk detected. The project currently appears to be progressing normally.";
}

function renderHighRiskProjects() {
  const container = document.getElementById("highRiskProjects");

  if (!container) return;

  const projectsWithRisk = filteredProjects
    .map((project) => ({
      ...project,
      riskScore: calculateRiskScore(project),
    }))
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 5);

  container.innerHTML = "";

  if (projectsWithRisk.length === 0) {
    container.innerHTML = "<p>No project data available.</p>";
    return;
  }

  projectsWithRisk.forEach((project) => {
    const item = document.createElement("div");

    item.className = "high-risk-item";

    item.innerHTML = `
            <div class="risk-project-info">
                <h4>
                    ${escapeHTML(project.project_id)}
                </h4>
                <p>
                    ${escapeHTML(project.state)} •
                    ${escapeHTML(project.project_type)}
                </p>
            </div>

            <div class="risk-score">
                ${project.riskScore}% Risk
            </div>
        `;

    container.appendChild(item);
  });
}

function createCharts() {
  if (typeof Chart === "undefined") {
    console.error("Chart.js is not loaded.");
    return;
  }

  createDelayChart();
  createStateChart();
  createCompensationChart();
}

function createDelayChart() {
  const canvas = document.getElementById("delayChart");

  if (!canvas) return;

  if (delayChartInstance) {
    delayChartInstance.destroy();
  }

  const delayed = filteredProjects.filter(
    (project) => Number(project.is_delayed) === 1,
  ).length;

  const onTrack = filteredProjects.length - delayed;

  delayChartInstance = new Chart(canvas, {
    type: "doughnut",

    data: {
      labels: ["Delayed", "On Track"],

      datasets: [
        {
          data: [delayed, onTrack],
          backgroundColor: ["#ef4444", "#22c55e"],
          borderWidth: 0,
        },
      ],
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "65%",

      plugins: {
        legend: {
          position: "bottom",
        },
      },
    },
  });
}

function createStateChart() {
  const canvas = document.getElementById("stateChart");

  if (!canvas) return;

  if (stateChartInstance) {
    stateChartInstance.destroy();
  }

  const stateData = {};

  filteredProjects.forEach((project) => {
    const state = project.state || "Unknown";

    if (!stateData[state]) {
      stateData[state] = {
        total: 0,
        delayed: 0,
      };
    }

    stateData[state].total++;

    if (Number(project.is_delayed) === 1) {
      stateData[state].delayed++;
    }
  });

  const sortedStates = Object.entries(stateData)
    .map(([state, data]) => ({
      state,
      delayed: data.delayed,
    }))
    .sort((a, b) => b.delayed - a.delayed)
    .slice(0, 8);

  stateChartInstance = new Chart(canvas, {
    type: "bar",

    data: {
      labels: sortedStates.map((item) => item.state),

      datasets: [
        {
          label: "Delayed Projects",

          data: sortedStates.map((item) => item.delayed),

          backgroundColor: "#2563eb",
          borderRadius: 6,
        },
      ],
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,

      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0,
          },
        },
      },

      plugins: {
        legend: {
          display: false,
        },
      },
    },
  });
}

function createCompensationChart() {
  const canvas = document.getElementById("compensationChart");

  if (!canvas) return;

  if (compensationChartInstance) {
    compensationChartInstance.destroy();
  }

  const compensationData = {};

  filteredProjects.forEach((project) => {
    const status = project.compensation_status || "Unknown";

    compensationData[status] = (compensationData[status] || 0) + 1;
  });

  compensationChartInstance = new Chart(canvas, {
    type: "pie",

    data: {
      labels: Object.keys(compensationData),

      datasets: [
        {
          data: Object.values(compensationData),

          backgroundColor: [
            "#22c55e",
            "#f59e0b",
            "#ef4444",
            "#2563eb",
            "#7c3aed",
          ],

          borderWidth: 0,
        },
      ],
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,

      plugins: {
        legend: {
          position: "bottom",
        },
      },
    },
  });
}

function updateNotificationCount() {
  const notificationCount = document.getElementById("notificationCount");

  if (!notificationCount) return;

  // If universal live notification engine is active in sharedAuth, delegate to it
  if (window.startNotificationEngine) return;

  const highRiskCount = allProjects.filter(
    (project) => calculateRiskScore(project) >= 70,
  ).length;

  notificationCount.textContent = highRiskCount > 99 ? "99+" : highRiskCount;
}

function initializeEventListeners() {
  const filterIds = [
    "stateFilter",
    "projectTypeFilter",
    "compensationFilter",
    "delayFilter",
  ];

  filterIds.forEach((id) => {
    const element = document.getElementById(id);

    if (element) {
      element.addEventListener("change", applyFilters);
    }
  });

  const searchInput = document.getElementById("searchProject");

  if (searchInput) {
    searchInput.addEventListener("input", debounce(applyFilters, 300));
  }

  const previousButton = document.getElementById("previousPageBtn");

  if (previousButton) {
    previousButton.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        renderProjectsTable();
      }
    });
  }

  const nextButton = document.getElementById("nextPageBtn");

  if (nextButton) {
    nextButton.addEventListener("click", () => {
      const totalPages = Math.ceil(filteredProjects.length / projectsPerPage);

      if (currentPage < totalPages) {
        currentPage++;
        renderProjectsTable();
      }
    });
  }

  const closeModalButton = document.getElementById("closeModalBtn");

  if (closeModalButton) {
    closeModalButton.addEventListener("click", closeProjectModal);
  }

  const modal = document.getElementById("projectModal");

  if (modal) {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        closeProjectModal();
      }
    });
  }

  // Affected Families Card & Modal
  const cardAffectedFamilies = document.getElementById("cardAffectedFamilies");
  if (cardAffectedFamilies) {
    cardAffectedFamilies.addEventListener("click", openFamiliesModal);
  }

  const closeFamiliesModalBtn = document.getElementById("closeFamiliesModalBtn");
  if (closeFamiliesModalBtn) {
    closeFamiliesModalBtn.addEventListener("click", closeFamiliesModal);
  }

  const familiesModal = document.getElementById("familiesModal");
  if (familiesModal) {
    familiesModal.addEventListener("click", (event) => {
      if (event.target === familiesModal) {
        closeFamiliesModal();
      }
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeProjectModal();
      closeFamiliesModal();
    }
  });

  const refreshButton = document.getElementById("refreshDataBtn");

  if (refreshButton) {
    refreshButton.addEventListener("click", () => location.reload());
  }

  const menuButton = document.getElementById("menuBtn");

  const sidebar = document.getElementById("sidebar");

  if (menuButton && sidebar) {
    menuButton.addEventListener("click", () => {
      sidebar.classList.toggle("show");
    });
  }

  const viewAllButton = document.getElementById("viewAllProjectsBtn");

  if (viewAllButton) {
    viewAllButton.addEventListener("click", () => {
      const stateFilter = document.getElementById("stateFilter");

      const projectTypeFilter = document.getElementById("projectTypeFilter");

      const compensationFilter = document.getElementById("compensationFilter");

      const delayFilter = document.getElementById("delayFilter");

      const searchProject = document.getElementById("searchProject");

      if (stateFilter) {
        stateFilter.value = "all";
      }

      if (projectTypeFilter) {
        projectTypeFilter.value = "all";
      }

      if (compensationFilter) {
        compensationFilter.value = "all";
      }

      if (delayFilter) {
        delayFilter.value = "all";
      }

      if (searchProject) {
        searchProject.value = "";
      }

      filteredProjects = [...allProjects];

      currentPage = 1;

      updateDashboardStatistics();
      renderProjectsTable();
      renderHighRiskProjects();
      createCharts();

      const tableCard = document.querySelector(".projects-table-card");

      if (tableCard) {
        tableCard.scrollIntoView({
          behavior: "smooth",
        });
      }
    });
  }

  const logoutButton = document.getElementById("logoutBtn");

  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      if (window.logoutUser) {
        window.logoutUser();
      } else {
        localStorage.removeItem("landPredictUser");
        localStorage.removeItem("loggedIn");
        localStorage.removeItem("userName");
        window.location.href = "login.html";
      }
    });
  }

  const predictionButton = document.getElementById("viewPredictionsBtn");

  if (predictionButton) {
    predictionButton.addEventListener("click", () => {
      window.location.href = "aiPrediction.html";
    });
  }
}

function loadUserInformation() {
  const user = window.getCurrentUser ? window.getCurrentUser() : null;
  const userName = (user && (user.full_name || user.first_name)) || localStorage.getItem("userName") || "Shiv Verma";

  const userNameElement = document.getElementById("userName");

  const userInitial = document.getElementById("userInitial");

  if (userNameElement) {
    userNameElement.textContent = userName;
  }

  if (userInitial) {
    userInitial.textContent = userName.charAt(0).toUpperCase();
  }
}

function formatNumber(value, decimals = 0) {
  const number = Number(value);

  if (isNaN(number)) {
    return "0";
  }

  return number.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function escapeHTML(value) {
  if (value === null || value === undefined) {
    return "N/A";
  }

  const div = document.createElement("div");

  div.textContent = value;

  return div.innerHTML;
}

function debounce(functionToExecute, delay) {
  let timeout;

  return function () {
    clearTimeout(timeout);

    timeout = setTimeout(functionToExecute, delay);
  };
}
