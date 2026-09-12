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
    refreshButton.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Syncing MySQL...`;
  }

  // 1. Try MySQL Database API first
  fetch("http://127.0.0.1:8000/api/projects?limit=600")
    .then((res) => {
      if (!res.ok) throw new Error("API not available");
      return res.json();
    })
    .then((data) => {
      if (data && data.projects && data.projects.length > 0) {
        allProjects = data.projects;
        filteredProjects = [...allProjects];
        console.log("Loaded from MySQL Database:", allProjects.length, "Projects");
        initializeDashboard();
        updateDatasetStatus(true, "MySQL DB Connected");
        if (refreshButton) {
          refreshButton.innerHTML = `<i class="fa-solid fa-rotate"></i> Refresh Data`;
        }
        if (window.showToast) {
          window.showToast(`Synced ${allProjects.length} projects from MySQL database.`, "success");
        }
      } else {
        throw new Error("Empty DB response");
      }
    })
    .catch((err) => {
      console.warn("MySQL API fetch fallback to CSV:", err);
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

function updateDatasetStatus(isConnected, customLabel = "MySQL DB Connected") {
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
    (total, project) => total + Number(project.num_affected_families || 0),
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
                <td colspan="9" style="text-align:center;padding:40px;">
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

    const row = document.createElement("tr");

    row.innerHTML = `
            <td><strong>${escapeHTML(project.project_id)}</strong></td>
            <td>${escapeHTML(project.state)}</td>
            <td>${escapeHTML(project.project_type)}</td>
            <td>${formatNumber(project.land_area_acres, 1)} Acres</td>
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

  const details = [
    ["Project ID", project.project_id],
    ["State", project.state],
    ["District Code", project.district_code],
    ["Project Type", project.project_type],
    ["Land Type", project.land_type],
    ["Land Area", `${formatNumber(project.land_area_acres, 2)} Acres`],
    ["Affected Families", formatNumber(project.num_affected_families)],
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
      Number(project.rehabilitation_required) === 1 ? "Yes" : "No",
    ],
    ["Rehabilitation Progress", `${project.rehabilitation_progress_pct}%`],
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

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeProjectModal();
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
      if (confirm("Are you sure you want to logout?")) {
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
  const userName = localStorage.getItem("userName") || "User";

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
