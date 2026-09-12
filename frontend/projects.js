let projects = [
  {
    id: "LP-001",
    state: "Uttar Pradesh",
    type: "Highway",
    landArea: 1250,
    families: 320,
    compensation: "Completed",
    delayDays: 0,
    status: "completed",
    legalDisputes: 0,
    pendingApprovals: 0,
  },
  {
    id: "LP-002",
    state: "Maharashtra",
    type: "Industrial",
    landArea: 980,
    families: 275,
    compensation: "Pending",
    delayDays: 45,
    status: "delayed",
    legalDisputes: 4,
    pendingApprovals: 3,
  },
  {
    id: "LP-003",
    state: "Gujarat",
    type: "Railway",
    landArea: 760,
    families: 190,
    compensation: "In Progress",
    delayDays: 12,
    status: "active",
    legalDisputes: 1,
    pendingApprovals: 2,
  },
  {
    id: "LP-004",
    state: "Rajasthan",
    type: "Solar Plant",
    landArea: 1500,
    families: 145,
    compensation: "Completed",
    delayDays: 0,
    status: "completed",
    legalDisputes: 0,
    pendingApprovals: 0,
  },
  {
    id: "LP-005",
    state: "Madhya Pradesh",
    type: "Highway",
    landArea: 2100,
    families: 480,
    compensation: "Pending",
    delayDays: 72,
    status: "delayed",
    legalDisputes: 6,
    pendingApprovals: 4,
  },
  {
    id: "LP-006",
    state: "Uttar Pradesh",
    type: "Metro",
    landArea: 640,
    families: 210,
    compensation: "In Progress",
    delayDays: 8,
    status: "active",
    legalDisputes: 1,
    pendingApprovals: 1,
  },
  {
    id: "LP-007",
    state: "Karnataka",
    type: "Industrial",
    landArea: 890,
    families: 260,
    compensation: "Completed",
    delayDays: 0,
    status: "completed",
    legalDisputes: 0,
    pendingApprovals: 0,
  },
  {
    id: "LP-008",
    state: "Bihar",
    type: "Railway",
    landArea: 1120,
    families: 350,
    compensation: "Pending",
    delayDays: 55,
    status: "delayed",
    legalDisputes: 5,
    pendingApprovals: 3,
  },
];

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

const projectModal = document.getElementById("projectModal");
const modalProjectDetails = document.getElementById("modalProjectDetails");
const modalProjectTitle = document.getElementById("modalProjectTitle");

const closeModalBtn = document.getElementById("closeModalBtn");

const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");

/* =========================================
     PAGINATION VARIABLES
  ========================================= */

let currentPage = 1;
const projectsPerPage = 6;

/* =========================================
     POPULATE FILTERS
  ========================================= */

function populateFilters() {
  const states = [...new Set(projects.map((project) => project.state))];

  const types = [...new Set(projects.map((project) => project.type))];

  states.sort().forEach((state) => {
    const option = document.createElement("option");

    option.value = state;
    option.textContent = state;

    stateFilter.appendChild(option);
  });

  types.sort().forEach((type) => {
    const option = document.createElement("option");

    option.value = type;
    option.textContent = type;

    projectTypeFilter.appendChild(option);
  });
}

/* =========================================
     FILTER PROJECTS
  ========================================= */

function getFilteredProjects() {
  const searchValue = projectSearch.value.toLowerCase().trim();

  const selectedState = stateFilter.value;
  const selectedType = projectTypeFilter.value;
  const selectedStatus = statusFilter.value;

  return projects.filter((project) => {
    const matchesSearch =
      project.id.toLowerCase().includes(searchValue) ||
      project.state.toLowerCase().includes(searchValue) ||
      project.type.toLowerCase().includes(searchValue);

    const matchesState =
      selectedState === "all" || project.state === selectedState;

    const matchesType = selectedType === "all" || project.type === selectedType;

    const matchesStatus =
      selectedStatus === "all" || project.status === selectedStatus;

    return matchesSearch && matchesState && matchesType && matchesStatus;
  });
}

/* =========================================
     RENDER PROJECT TABLE
  ========================================= */

function renderProjects() {
  const filteredProjects = getFilteredProjects();

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProjects.length / projectsPerPage),
  );

  if (currentPage > totalPages) {
    currentPage = totalPages;
  }

  const startIndex = (currentPage - 1) * projectsPerPage;

  const endIndex = startIndex + projectsPerPage;

  const paginatedProjects = filteredProjects.slice(startIndex, endIndex);

  projectsTableBody.innerHTML = "";

  if (filteredProjects.length === 0) {
    if (emptyState) {
      emptyState.classList.add("active");
    }

    if (paginationInfo) {
      paginationInfo.textContent = "No projects found";
    }

    currentPageElement.textContent = "1";

    updatePaginationButtons(0);

    return;
  }

  if (emptyState) {
    emptyState.classList.remove("active");
  }

  paginatedProjects.forEach((project) => {
    const row = document.createElement("tr");

    row.innerHTML = `
        <td><strong>${project.id}</strong></td>
        <td>${project.state}</td>
        <td>${project.type}</td>
        <td>${project.landArea.toLocaleString()} Acres</td>
        <td>${project.families.toLocaleString()}</td>
        <td>${project.compensation}</td>
        <td>${project.delayDays} Days</td>

        <td>
          <span class="status-badge status-${project.status}">
            ${capitalizeFirstLetter(project.status)}
          </span>
        </td>

        <td>
          <div class="action-buttons">

            <button
              class="action-btn view-btn"
              data-id="${project.id}"
              title="View Details"
            >
              <i class="fa-solid fa-eye"></i>
            </button>

            <button
              class="action-btn edit-btn"
              data-id="${project.id}"
              title="Edit Project"
            >
              <i class="fa-solid fa-pen"></i>
            </button>

            <button
              class="action-btn delete-btn"
              data-id="${project.id}"
              title="Delete Project"
            >
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

  currentPageElement.textContent = currentPage;

  updatePaginationButtons(filteredProjects.length);

  addTableButtonEvents();
}

/* =========================================
     CAPITALIZE TEXT
  ========================================= */

function capitalizeFirstLetter(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/* =========================================
     PAGINATION
  ========================================= */

function updatePaginationButtons(totalProjects) {
  const totalPages = Math.ceil(totalProjects / projectsPerPage);

  previousPageBtn.disabled = currentPage === 1;

  nextPageBtn.disabled = currentPage >= totalPages || totalPages === 0;
}

previousPageBtn.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;

    renderProjects();
  }
});

nextPageBtn.addEventListener("click", () => {
  const filteredProjects = getFilteredProjects();

  const totalPages = Math.ceil(filteredProjects.length / projectsPerPage);

  if (currentPage < totalPages) {
    currentPage++;

    renderProjects();
  }
});

/* =========================================
     TABLE BUTTON EVENTS
  ========================================= */

function addTableButtonEvents() {
  document.querySelectorAll(".view-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const projectId = button.dataset.id;

      showProjectDetails(projectId);
    });
  });

  document.querySelectorAll(".edit-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const projectId = button.dataset.id;
      window.location.href = `details.html?id=${encodeURIComponent(projectId)}`;
    });
  });

  document.querySelectorAll(".delete-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const projectId = button.dataset.id;

      deleteProject(projectId);
    });
  });
}

/* =========================================
     PROJECT DETAILS MODAL
  ========================================= */

function showProjectDetails(projectId) {
  const project = projects.find((item) => item.id === projectId);

  if (!project) return;

  modalProjectTitle.textContent = project.id;

  modalProjectDetails.innerHTML = `
      <div class="detail-item">
        <h4>Project ID</h4>
        <p>${project.id}</p>
      </div>

      <div class="detail-item">
        <h4>State</h4>
        <p>${project.state}</p>
      </div>

      <div class="detail-item">
        <h4>Project Type</h4>
        <p>${project.type}</p>
      </div>

      <div class="detail-item">
        <h4>Land Area</h4>
        <p>
          ${project.landArea.toLocaleString()} Acres
        </p>
      </div>

      <div class="detail-item">
        <h4>Affected Families</h4>
        <p>
          ${project.families.toLocaleString()}
        </p>
      </div>

      <div class="detail-item">
        <h4>Compensation Status</h4>
        <p>${project.compensation}</p>
      </div>

      <div class="detail-item">
        <h4>Delay Days</h4>
        <p>${project.delayDays} Days</p>
      </div>

      <div class="detail-item">
        <h4>Legal Disputes</h4>
        <p>${project.legalDisputes}</p>
      </div>

      <div class="detail-item">
        <h4>Pending Approvals</h4>
        <p>${project.pendingApprovals}</p>
      </div>

      <div class="detail-item">
        <h4>Project Status</h4>
        <p>
          ${capitalizeFirstLetter(project.status)}
        </p>
      </div>

      <div style="grid-column: 1/-1; margin-top: 15px; display: flex; gap: 10px;">
        <a href="details.html?id=${project.id}" class="action-btn" style="flex:1; text-align:center; text-decoration:none; background:#16a34a; color:#ffffff; padding:10px 14px; border-radius:8px; font-weight:600; display:flex; align-items:center; justify-content:center; gap:8px;">
          <i class="fa-solid fa-arrow-up-right-from-square"></i> Open Full Detailed Dossier & AI Risk Analysis
        </a>
      </div>
    `;

  projectModal.classList.add("active");
}

/* =========================================
     CLOSE MODAL
  ========================================= */

closeModalBtn.addEventListener("click", () => {
  projectModal.classList.remove("active");
});

projectModal.addEventListener("click", (event) => {
  if (event.target === projectModal) {
    projectModal.classList.remove("active");
  }
});

/* =========================================
     DELETE PROJECT
  ========================================= */

function deleteProject(projectId) {
  const confirmDelete = confirm(
    `Are you sure you want to delete ${projectId}?`,
  );

  if (!confirmDelete) return;

  projects = projects.filter((project) => project.id !== projectId);

  currentPage = 1;

  updateAllData();
}

/* =========================================
     UPDATE STATISTICS
  ========================================= */

function updateStatistics() {
  const total = projects.length;

  const active = projects.filter(
    (project) => project.status === "active",
  ).length;

  const delayed = projects.filter(
    (project) => project.status === "delayed",
  ).length;

  const completed = projects.filter(
    (project) => project.status === "completed",
  ).length;

  const totalElement = document.getElementById("totalProjects");

  const activeElement = document.getElementById("activeProjects");

  const delayedElement = document.getElementById("delayedProjects");

  const completedElement = document.getElementById("completedProjects");

  if (totalElement) {
    totalElement.textContent = total;
  }

  if (activeElement) {
    activeElement.textContent = active;
  }

  if (delayedElement) {
    delayedElement.textContent = delayed;
  }

  if (completedElement) {
    completedElement.textContent = completed;
  }

  const overviewActive = document.getElementById("overviewActive");

  const overviewDelayed = document.getElementById("overviewDelayed");

  const overviewCompleted = document.getElementById("overviewCompleted");

  const overviewTotal = document.getElementById("overviewTotal");

  if (overviewActive) {
    overviewActive.textContent = active;
  }

  if (overviewDelayed) {
    overviewDelayed.textContent = delayed;
  }

  if (overviewCompleted) {
    overviewCompleted.textContent = completed;
  }

  if (overviewTotal) {
    overviewTotal.textContent = total;
  }
}

/* =========================================
     HIGH RISK PROJECTS
  ========================================= */

function renderHighRiskProjects() {
  const highRiskContainer = document.getElementById("highRiskProjects");

  if (!highRiskContainer) return;

  const highRiskProjects = [...projects]
    .filter(
      (project) => project.status === "delayed" || project.legalDisputes >= 3,
    )
    .sort(
      (a, b) =>
        b.delayDays +
        b.legalDisputes * 10 -
        (a.delayDays + a.legalDisputes * 10),
    )
    .slice(0, 4);

  highRiskContainer.innerHTML = "";

  if (highRiskProjects.length === 0) {
    highRiskContainer.innerHTML = "<p>No high-risk projects detected.</p>";

    return;
  }

  highRiskProjects.forEach((project) => {
    const riskScore = project.delayDays + project.legalDisputes * 10;

    highRiskContainer.innerHTML += `
          <div class="high-risk-item">
            <div>
              <h4>${project.id}</h4>

              <p>
                ${project.state} ·
                ${project.delayDays} delay days
              </p>
            </div>

            <span class="risk-label">
              Risk Score: ${riskScore}
            </span>
          </div>
        `;
  });
}

/* =========================================
     FILTER EVENTS
  ========================================= */

function resetPagination() {
  currentPage = 1;

  renderProjects();
}

projectSearch.addEventListener("input", resetPagination);

stateFilter.addEventListener("change", resetPagination);

projectTypeFilter.addEventListener("change", resetPagination);

statusFilter.addEventListener("change", resetPagination);

/* =========================================
     CLEAR FILTERS
  ========================================= */

function clearFilters() {
  projectSearch.value = "";
  stateFilter.value = "all";
  projectTypeFilter.value = "all";
  statusFilter.value = "all";

  currentPage = 1;

  renderProjects();
}

const resetFiltersBtn = document.getElementById("resetFiltersBtn");

const clearEmptyFiltersBtn = document.getElementById("clearEmptyFiltersBtn");

if (resetFiltersBtn) {
  resetFiltersBtn.addEventListener("click", clearFilters);
}

if (clearEmptyFiltersBtn) {
  clearEmptyFiltersBtn.addEventListener("click", clearFilters);
}

/* =========================================
     REFRESH PROJECTS VIA MYSQL DATABASE
  ========================================= */

async function fetchProjectsFromDb() {
  const refreshBtn = document.getElementById("refreshProjectsBtn");
  if (refreshBtn) refreshBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Syncing MySQL...`;

  try {
    const res = await fetch("http://127.0.0.1:8000/api/projects?limit=300");
    if (res.ok) {
      const data = await res.json();
      if (data.projects && data.projects.length > 0) {
        projects = data.projects.map((p) => ({
          id: p.project_id,
          state: p.state,
          type: p.project_type,
          landArea: p.land_area_acres,
          families: p.affected_families,
          compensation: p.compensation_status,
          delayDays: p.delay_days,
          status: p.is_delayed === 1 ? "delayed" : "completed",
          legalDisputes: p.legal_disputes_count,
          pendingApprovals: p.pending_approvals_count,
          rehabilitation: p.rehabilitation_progress_pct
        }));
        console.log(`Loaded ${projects.length} projects from MySQL database.`);
        populateFilters();
        updateAllData();
        if (window.showToast) window.showToast(`Synced ${projects.length} projects from MySQL.`, "success");
      }
    }
  } catch (err) {
    console.warn("API not reachable, using local projects list:", err);
  } finally {
    if (refreshBtn) refreshBtn.innerHTML = `<i class="fa-solid fa-rotate"></i> Refresh Data`;
  }
}

const refreshProjectsBtn = document.getElementById("refreshProjectsBtn");

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
     INITIALIZE PAGE
  ========================================= */

populateFilters();
updateAllData();
fetchProjectsFromDb();

