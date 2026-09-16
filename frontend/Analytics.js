/**
 * LandPredict AI - Analytics Engine
 * Connected directly to PostgreSQL & Supabase Database API (http://127.0.0.1:8000/api/projects)
 * Fallback to CSV Dataset & LocalStorage Cache
 * Feeds Project List Table (with Pagination, Search & Project Details Modal)
 * Real-time Chart.js Visualizations, Pan-India Leaflet Map, Risk Gauges & CSV Export
 */

const ANALYTICS_API_BASE = (typeof window !== "undefined" && window.location && window.location.port === "8000")
  ? window.location.origin
  : (typeof window !== "undefined" && window.API_BASE_URL ? window.API_BASE_URL : "http://127.0.0.1:8000");

// Comprehensive Pan-India State Geographic Coordinates
const STATE_COORDINATES = {
  "Uttar Pradesh": [26.8467, 80.9462],
  "Maharashtra": [19.7515, 75.7139],
  "Gujarat": [22.2587, 71.1924],
  "Rajasthan": [27.0238, 74.2179],
  "Madhya Pradesh": [22.9734, 78.6569],
  "Karnataka": [15.3173, 75.7139],
  "Bihar": [25.0961, 85.3131],
  "Tamil Nadu": [11.1271, 78.6569],
  "Andhra Pradesh": [15.9129, 79.7400],
  "Telangana": [18.1124, 79.0193],
  "West Bengal": [22.9868, 87.8550],
  "Odisha": [20.9517, 85.0985],
  "Haryana": [29.0588, 76.0856],
  "Punjab": [31.1471, 75.3412],
  "Kerala": [10.8505, 76.2711],
  "Assam": [26.2006, 92.9376],
  "Jharkhand": [23.6102, 85.2799],
  "Chhattisgarh": [21.2787, 81.8661],
  "Uttarakhand": [30.0668, 79.0193],
  "Himachal Pradesh": [31.1048, 77.1734],
  "Delhi": [28.7041, 77.1025],
  "Goa": [15.2993, 74.1240],
  "Jammu and Kashmir": [33.7782, 76.5762],
  "Jammu & Kashmir": [33.7782, 76.5762],
  "Tripura": [23.9408, 91.9882],
  "Meghalaya": [25.4670, 91.3662],
  "Manipur": [24.6637, 93.9063],
  "Nagaland": [26.1584, 94.5624],
  "Mizoram": [23.1645, 92.9376],
  "Sikkim": [27.5330, 88.5122],
  "Arunachal Pradesh": [28.2180, 94.7278],
  "Puducherry": [11.9416, 79.8083],
  "Chandigarh": [30.7333, 76.7794]
};


// Robust offline fallback dataset
const FALLBACK_PROJECTS = [
  { id: "LAP-10001", name: "UP Expressway Sector 4", state: "Uttar Pradesh", type: "Highway", landArea: 1250, families: 320, compensation: "Completed", compensationPct: 100, delayDays: 0, status: "completed", legalDisputes: 0, pendingApprovals: 0, courtCases: 0, isDelayed: false, riskLevel: "Low", riskScore: 12 },
  { id: "LAP-10002", name: "Maharashtra Industrial Hub", state: "Maharashtra", type: "Industrial Corridor", landArea: 980, families: 275, compensation: "Pending", compensationPct: 20, delayDays: 78, status: "delayed", legalDisputes: 4, pendingApprovals: 3, courtCases: 1, isDelayed: true, riskLevel: "High", riskScore: 84 },
  { id: "LAP-10003", name: "Gujarat Western DFC Spur", state: "Gujarat", type: "Railway", landArea: 760, families: 190, compensation: "In Progress", compensationPct: 65, delayDays: 0, status: "active", legalDisputes: 1, pendingApprovals: 2, courtCases: 0, isDelayed: false, riskLevel: "Medium", riskScore: 35 },
  { id: "LAP-10004", name: "Rajasthan Solar Corridor", state: "Rajasthan", type: "Renewable Energy", landArea: 1500, families: 145, compensation: "Completed", compensationPct: 95, delayDays: 0, status: "completed", legalDisputes: 0, pendingApprovals: 1, courtCases: 0, isDelayed: false, riskLevel: "Low", riskScore: 15 },
  { id: "LAP-10005", name: "MP Bhopal-Nagpur Corridor", state: "Madhya Pradesh", type: "Highway", landArea: 2100, families: 480, compensation: "Pending", compensationPct: 30, delayDays: 92, status: "delayed", legalDisputes: 6, pendingApprovals: 4, courtCases: 2, isDelayed: true, riskLevel: "High", riskScore: 91 },
  { id: "LAP-10006", name: "Kanpur Metro Extension", state: "Uttar Pradesh", type: "Urban Development", landArea: 640, families: 210, compensation: "In Progress", compensationPct: 70, delayDays: 0, status: "active", legalDisputes: 1, pendingApprovals: 1, courtCases: 0, isDelayed: false, riskLevel: "Low", riskScore: 22 },
  { id: "LAP-10007", name: "Bengaluru High-Tech Node", state: "Karnataka", type: "Industrial Corridor", landArea: 890, families: 260, compensation: "Completed", compensationPct: 100, delayDays: 0, status: "completed", legalDisputes: 0, pendingApprovals: 0, courtCases: 0, isDelayed: false, riskLevel: "Low", riskScore: 10 },
  { id: "LAP-10008", name: "Bihar Freight Bypass", state: "Bihar", type: "Railway", landArea: 1120, families: 350, compensation: "Pending", compensationPct: 15, delayDays: 65, status: "delayed", legalDisputes: 5, pendingApprovals: 3, courtCases: 1, isDelayed: true, riskLevel: "High", riskScore: 82 },
  { id: "LAP-10009", name: "Kolkata Port Link Rd", state: "West Bengal", type: "Highway", landArea: 720, families: 310, compensation: "In Progress", compensationPct: 55, delayDays: 38, status: "delayed", legalDisputes: 3, pendingApprovals: 2, courtCases: 1, isDelayed: true, riskLevel: "Medium", riskScore: 58 },
  { id: "LAP-10010", name: "Odisha Mineral Rail Corridor", state: "Odisha", type: "Railway", landArea: 1400, families: 420, compensation: "In Progress", compensationPct: 40, delayDays: 52, status: "delayed", legalDisputes: 2, pendingApprovals: 5, courtCases: 0, isDelayed: true, riskLevel: "High", riskScore: 75 },
  { id: "LAP-10011", name: "Hyderabad ORR Grid", state: "Telangana", type: "Power Transmission", landArea: 530, families: 110, compensation: "Completed", compensationPct: 90, delayDays: 0, status: "completed", legalDisputes: 0, pendingApprovals: 1, courtCases: 0, isDelayed: false, riskLevel: "Low", riskScore: 18 },
  { id: "LAP-10012", name: "Chennai Port Expressway", state: "Tamil Nadu", type: "Highway", landArea: 840, families: 290, compensation: "In Progress", compensationPct: 60, delayDays: 0, status: "active", legalDisputes: 2, pendingApprovals: 2, courtCases: 0, isDelayed: false, riskLevel: "Medium", riskScore: 42 }
];

// Global runtime variables
let allProjects = [];
let statusChart = null;
let stateDelayChart = null;
let projectTypeChart = null;
let compensationChart = null;
let projectMap = null;
let mapMarkersLayer = null;

// Pagination and Search State for Project List Table
let currentPage = 1;
const projectsPerPage = 10;
let searchQuery = "";

/**
 * HTML Escape Helper
 */
function escapeHTML(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Normalizes project raw record from PostgreSQL / Supabase or CSV into unified schema
 */
function normalizeProject(p) {
  const delayDays = parseInt(p.delay_days !== undefined ? p.delay_days : (p.delayDays || 0), 10);
  const isDelayed = (p.is_delayed === 1 || p.is_delayed === "1" || p.isDelayed === true || delayDays > 0);

  const compStatus = String(p.compensation_status || p.compensation || "").toLowerCase();
  const compPct = parseFloat(p.compensation_disbursed_pct !== undefined ? p.compensation_disbursed_pct : (p.compensationPct || 0));

  let compensation = "Pending";
  if (compStatus.includes("fully") || compStatus.includes("completed") || (compStatus.includes("disbursed") && !compStatus.includes("partial")) || compPct >= 90) {
    compensation = "Completed";
  } else if (compStatus.includes("partial") || compStatus.includes("progress") || (compPct > 0 && compPct < 90)) {
    compensation = "In Progress";
  } else {
    compensation = "Pending";
  }

  let status = "active";
  if (isDelayed) {
    status = "delayed";
  } else if (String(p.status).toLowerCase() === "completed" || (compPct >= 100 && delayDays === 0)) {
    status = "completed";
  } else {
    status = "active";
  }

  const legalDisputes = parseInt(p.legal_disputes_count !== undefined ? p.legal_disputes_count : (p.legalDisputes || 0), 10);
  const pendingApprovals = parseInt(p.pending_approvals_count !== undefined ? p.pending_approvals_count : (p.pendingApprovals || 0), 10);
  const courtCases = parseInt(p.court_case_pending !== undefined ? p.court_case_pending : (p.courtCases || 0), 10);

  let riskLevel = p.risk_level ? String(p.risk_level).toUpperCase() : "LOW";
  if (delayDays >= 45 || legalDisputes >= 3 || courtCases >= 1 || riskLevel === "HIGH") {
    riskLevel = "High";
  } else if (delayDays >= 20 || legalDisputes >= 1 || pendingApprovals >= 3 || riskLevel === "MEDIUM") {
    riskLevel = "Medium";
  } else {
    riskLevel = "Low";
  }

  return {
    id: p.project_id || p.id || `LAP-${Math.floor(1000 + Math.random() * 9000)}`,
    name: p.project_name || p.name || `${p.state || "National"} ${p.project_type || "Infrastructure"} Project`,
    state: (p.state || "National").trim(),
    district: p.district || p.district_code || "",
    districtCode: p.district_code || p.district || "",
    type: (p.project_type || p.type || "Highway").trim(),
    landType: p.land_type || "Private Agricultural",
    landArea: parseFloat(p.land_area_acres || p.landArea || 50),
    families: parseInt(p.affected_families || p.num_affected_families || p.families || 10, 10),
    departmentsCount: parseInt(p.num_departments_involved || 3, 10),
    notificationAgeDays: parseInt(p.notification_age_days || 180, 10),
    compensation: compensation,
    compensationPct: compPct,
    compensationStatusRaw: p.compensation_status || p.compensation || compensation,
    possessionStatus: p.possession_status || "Partial Possession",
    delayDays: delayDays,
    isDelayed: isDelayed,
    status: status,
    legalDisputes: legalDisputes,
    pendingApprovals: pendingApprovals,
    courtCases: courtCases,
    rehabilitationRequired: parseInt(p.rehabilitation_required || 0, 10),
    rehabilitationPct: parseFloat(p.rehabilitation_progress_pct || 0),
    publicObjections: parseInt(p.public_objections_count || 0, 10),
    budgetUtilizationPct: parseFloat(p.budget_utilization_pct || 50),
    monsoonOverlap: parseInt(p.monsoon_season_overlap || 0, 10),
    stakeholderScore: parseFloat(p.stakeholder_responsiveness_score || 7.0),
    deptPerformanceScore: parseFloat(p.historical_dept_performance_score || 60.0),
    riskLevel: riskLevel,
    riskScore: parseFloat(p.risk_score || delayDays * 1.2)
  };
}

/**
 * Loads project data from PapaParse CSV dataset fallback
 */
function loadFromCsvFallback() {
  return new Promise((resolve, reject) => {
    if (typeof Papa === "undefined") {
      return reject(new Error("PapaParse library not available"));
    }
    Papa.parse("land_acquisition_dataset-5.csv", {
      download: true,
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: function (results) {
        if (results.data && results.data.length > 0) {
          const valid = results.data.filter(p => p.project_id || p.state);
          if (valid.length > 0) {
            allProjects = valid.map(normalizeProject);
            localStorage.setItem("landInsightProjects", JSON.stringify(allProjects));
            updateDatasetStatus(true, `CSV Dataset Live (${allProjects.length.toLocaleString()} Records)`);
            return resolve(allProjects);
          }
        }
        reject(new Error("Empty CSV data"));
      },
      error: function (err) {
        reject(err);
      }
    });
  });
}

/**
 * Multi-tier data connection engine
 */
async function loadProjectsData() {
  // Tier 1: Fetch PostgreSQL / Supabase Database via API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(`${ANALYTICS_API_BASE}/api/projects?limit=600`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data && Array.isArray(data.projects) && data.projects.length > 0) {
        allProjects = data.projects.map(normalizeProject);
        localStorage.setItem("landInsightProjects", JSON.stringify(allProjects));
        localStorage.setItem("allProjects", JSON.stringify(allProjects));
        updateDatasetStatus(true, `PostgreSQL Live (${allProjects.length.toLocaleString()} Records)`);
        console.log(`[Analytics] Successfully connected to PostgreSQL DB API. Loaded ${allProjects.length} records.`);
        return;
      }
    }
  } catch (apiErr) {
    console.warn("[Analytics] Backend API fetch failed, trying CSV parser fallback:", apiErr.message);
  }

  // Tier 2: Try CSV Parser Fallback
  try {
    await loadFromCsvFallback();
    console.log(`[Analytics] Successfully loaded ${allProjects.length} records from CSV dataset.`);
    return;
  } catch (csvErr) {
    console.warn("[Analytics] CSV fallback unavailable, trying LocalStorage cache:", csvErr.message);
  }

  // Tier 3: Try LocalStorage Cache
  const cached = localStorage.getItem("landInsightProjects") || localStorage.getItem("allProjects");
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        allProjects = parsed.map(normalizeProject);
        updateDatasetStatus(true, `Cached Dataset (${allProjects.length.toLocaleString()} Records)`);
        console.log(`[Analytics] Loaded ${allProjects.length} records from LocalStorage cache.`);
        return;
      }
    } catch (e) {
      console.error("[Analytics] Local cache parse error:", e);
    }
  }

  // Tier 4: Embedded Curated National Dataset
  allProjects = FALLBACK_PROJECTS.map(normalizeProject);
  updateDatasetStatus(false, `Offline Sample (${allProjects.length} Records)`);
  console.log(`[Analytics] Loaded fallback dataset of ${allProjects.length} records.`);
}

/**
 * Updates the dataset status badge in the header
 */
function updateDatasetStatus(isLive, labelText) {
  const statusElem = document.querySelector(".dataset-status");
  if (!statusElem) return;

  if (isLive) {
    statusElem.innerHTML = `
      <span class="status-dot"></span>
      <span>${labelText}</span>
    `;
  } else {
    statusElem.innerHTML = `
      <span class="status-dot" style="background:#f59e0b;"></span>
      <span>${labelText}</span>
    `;
  }
}

/**
 * Populates state and type filter dropdowns dynamically from real records
 */
function populateFilters() {
  const stateFilter = document.getElementById("stateFilter");
  const typeFilter = document.getElementById("typeFilter");

  if (!stateFilter || !typeFilter) return;

  const currentState = stateFilter.value;
  const currentType = typeFilter.value;

  const states = [...new Set(allProjects.map((p) => p.state).filter(Boolean))].sort();
  const types = [...new Set(allProjects.map((p) => p.type).filter(Boolean))].sort();

  stateFilter.innerHTML = `<option value="all">All States (${states.length})</option>`;
  states.forEach((st) => {
    const opt = document.createElement("option");
    opt.value = st;
    opt.textContent = st;
    if (st === currentState) opt.selected = true;
    stateFilter.appendChild(opt);
  });

  typeFilter.innerHTML = `<option value="all">All Project Types (${types.length})</option>`;
  types.forEach((tp) => {
    const opt = document.createElement("option");
    opt.value = tp;
    opt.textContent = tp;
    if (tp === currentType) opt.selected = true;
    typeFilter.appendChild(opt);
  });
}

/**
 * Returns filtered projects matching current UI criteria
 */
function getFilteredProjects() {
  const stateFilter = document.getElementById("stateFilter");
  const typeFilter = document.getElementById("typeFilter");
  const statusFilter = document.getElementById("statusFilter");

  const selectedState = stateFilter ? stateFilter.value : "all";
  const selectedType = typeFilter ? typeFilter.value : "all";
  const selectedStatus = statusFilter ? statusFilter.value : "all";

  return allProjects.filter((p) => {
    const stateMatch = selectedState === "all" || p.state.toLowerCase() === selectedState.toLowerCase();
    const typeMatch = selectedType === "all" || p.type.toLowerCase() === selectedType.toLowerCase();

    let statusMatch = true;
    if (selectedStatus === "delayed") {
      statusMatch = p.status === "delayed" || p.isDelayed || p.delayDays > 0;
    } else if (selectedStatus === "active") {
      statusMatch = p.status === "active" && !p.isDelayed && p.delayDays === 0;
    } else if (selectedStatus === "completed") {
      statusMatch = p.status === "completed" || p.compensation === "Completed" || p.compensationPct >= 100;
    }

    return stateMatch && typeMatch && statusMatch;
  });
}

/**
 * Updates KPI statistics cards
 */
function updateStatistics(filtered) {
  const total = filtered.length;
  const delayed = filtered.filter((p) => p.status === "delayed" || p.isDelayed).length;
  const totalDelay = filtered.reduce((acc, p) => acc + (p.delayDays || 0), 0);
  const averageDelay = total > 0 ? Math.round(totalDelay / total) : 0;
  const highRisk = filtered.filter((p) => p.riskLevel === "High" || p.delayDays >= 45 || p.legalDisputes >= 3 || p.courtCases >= 1).length;

  const totalElem = document.getElementById("totalProjects");
  const delayedElem = document.getElementById("delayedProjects");
  const avgDelayElem = document.getElementById("averageDelay");
  const riskElem = document.getElementById("highRiskCount");

  if (totalElem) totalElem.textContent = total.toLocaleString();
  if (delayedElem) delayedElem.textContent = delayed.toLocaleString();
  if (avgDelayElem) avgDelayElem.textContent = `${averageDelay} Days`;
  if (riskElem) riskElem.textContent = highRisk.toLocaleString();

  // Notification badge in header: managed universally by sharedAuth notification engine
  if (!window.startNotificationEngine) {
    const badge = document.querySelector(".notification-badge");
    if (badge) {
      badge.textContent = delayed;
      badge.style.display = delayed > 0 ? "flex" : "none";
    }
  }
}

/**
 * Chart 1: Project Status Distribution (Doughnut)
 */
function createStatusChart(filtered) {
  const canvas = document.getElementById("statusChart");
  if (!canvas || typeof Chart === "undefined") return;

  const delayed = filtered.filter((p) => p.status === "delayed" || p.isDelayed).length;
  const completed = filtered.filter((p) => !p.isDelayed && (p.status === "completed" || p.compensationPct >= 100)).length;
  const active = Math.max(0, filtered.length - delayed - completed);

  if (statusChart) {
    statusChart.destroy();
  }

  statusChart = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: ["Active (On Schedule)", "Delayed", "Completed"],
      datasets: [
        {
          data: [active, delayed, completed],
          backgroundColor: ["#22c55e", "#ef4444", "#15803d"],
          borderColor: "#ffffff",
          borderWidth: 2,
          hoverOffset: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "68%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            padding: 16,
            usePointStyle: true,
            font: { family: "Inter", size: 12 }
          }
        },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              const val = ctx.parsed;
              const total = active + delayed + completed;
              const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
              return ` ${ctx.label}: ${val} (${pct}%)`;
            }
          }
        }
      }
    }
  });
}

/**
 * Chart 2: Average Delay by State (Bar)
 */
function createStateDelayChart(filtered) {
  const canvas = document.getElementById("stateDelayChart");
  if (!canvas || typeof Chart === "undefined") return;

  const stateData = {};
  filtered.forEach((p) => {
    if (!stateData[p.state]) {
      stateData[p.state] = { totalDelay: 0, count: 0 };
    }
    stateData[p.state].totalDelay += p.delayDays;
    stateData[p.state].count++;
  });

  const sortedStates = Object.keys(stateData)
    .map((st) => ({
      state: st,
      avgDelay: Math.round(stateData[st].totalDelay / stateData[st].count),
      count: stateData[st].count
    }))
    .sort((a, b) => b.avgDelay - a.avgDelay)
    .slice(0, 10);

  const labels = sortedStates.map((s) => s.state);
  const data = sortedStates.map((s) => s.avgDelay);
  const backgroundColors = data.map((d) => (d >= 45 ? "#ef4444" : d >= 20 ? "#f59e0b" : "#22c55e"));

  if (stateDelayChart) {
    stateDelayChart.destroy();
  }

  stateDelayChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Avg Delay (Days)",
          data: data,
          backgroundColor: backgroundColors,
          borderRadius: 6,
          borderSkipped: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` Average Delay: ${ctx.parsed.y} Days`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { family: "Inter", size: 11 } }
        },
        y: {
          beginAtZero: true,
          title: { display: true, text: "Days" },
          grid: { color: "#f1f5f9" }
        }
      }
    }
  });
}

/**
 * Chart 3: Project Type Distribution (Bar)
 */
function createProjectTypeChart(filtered) {
  const canvas = document.getElementById("projectTypeChart");
  if (!canvas || typeof Chart === "undefined") return;

  const typeCounts = {};
  filtered.forEach((p) => {
    typeCounts[p.type] = (typeCounts[p.type] || 0) + 1;
  });

  const sortedTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
  const labels = sortedTypes.map((item) => item[0]);
  const data = sortedTypes.map((item) => item[1]);

  if (projectTypeChart) {
    projectTypeChart.destroy();
  }

  projectTypeChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Projects",
          data: data,
          backgroundColor: "#059669",
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: "y",
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { precision: 0 },
          grid: { color: "#f1f5f9" }
        },
        y: {
          grid: { display: false },
          ticks: { font: { family: "Inter", size: 11 } }
        }
      }
    }
  });
}

/**
 * Chart 4: Compensation Status (Pie)
 */
function createCompensationChart(filtered) {
  const canvas = document.getElementById("compensationChart");
  if (!canvas || typeof Chart === "undefined") return;

  const completed = filtered.filter((p) => p.compensation === "Completed").length;
  const inProgress = filtered.filter((p) => p.compensation === "In Progress").length;
  const pending = filtered.filter((p) => p.compensation === "Pending").length;

  if (compensationChart) {
    compensationChart.destroy();
  }

  compensationChart = new Chart(canvas, {
    type: "pie",
    data: {
      labels: ["Completed", "In Progress", "Pending"],
      datasets: [
        {
          data: [completed, inProgress, pending],
          backgroundColor: ["#22c55e", "#f59e0b", "#ef4444"],
          borderWidth: 2,
          borderColor: "#ffffff"
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            padding: 16,
            usePointStyle: true,
            font: { family: "Inter", size: 12 }
          }
        },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              const val = ctx.parsed;
              const total = completed + inProgress + pending;
              const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
              return ` ${ctx.label}: ${val} (${pct}%)`;
            }
          }
        }
      }
    }
  });
}

/**
 * Updates Risk Factor Progress Bars
 */
function updateRiskFactors(filtered) {
  const total = filtered.length;
  if (total === 0) {
    ["legal", "approval", "delay", "compensation"].forEach((key) => {
      const valElem = document.getElementById(`${key}RiskValue`);
      const progElem = document.getElementById(`${key}RiskProgress`);
      if (valElem) valElem.textContent = "0%";
      if (progElem) progElem.style.width = "0%";
    });
    return;
  }

  const legalCount = filtered.filter((p) => p.legalDisputes > 0 || p.courtCases > 0).length;
  const approvalCount = filtered.filter((p) => p.pendingApprovals >= 3).length;
  const delayCount = filtered.filter((p) => p.delayDays > 0 || p.status === "delayed" || p.isDelayed).length;
  const compCount = filtered.filter((p) => p.compensation !== "Completed").length;

  const legalPct = Math.min(100, Math.round((legalCount / total) * 100));
  const approvalPct = Math.min(100, Math.round((approvalCount / total) * 100));
  const delayPct = Math.min(100, Math.round((delayCount / total) * 100));
  const compPct = Math.min(100, Math.round((compCount / total) * 100));

  function setBar(idVal, idProg, pct) {
    const valElem = document.getElementById(idVal);
    const progElem = document.getElementById(idProg);
    if (valElem) valElem.textContent = `${pct}%`;
    if (progElem) {
      progElem.style.width = `${pct}%`;
      progElem.style.backgroundColor = pct >= 50 ? "#ef4444" : pct >= 25 ? "#f59e0b" : "#22c55e";
    }
  }

  setBar("legalRiskValue", "legalRiskProgress", legalPct);
  setBar("approvalRiskValue", "approvalRiskProgress", approvalPct);
  setBar("delayRiskValue", "delayRiskProgress", delayPct);
  setBar("compensationRiskValue", "compensationRiskProgress", compPct);
}

/**
 * Renders Key Dynamic Data Insights
 */
function renderInsights(filtered) {
  const container = document.getElementById("insightsContainer");
  if (!container) return;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="insight-item">
        <div class="insight-icon" style="background: rgba(148, 163, 184, 0.2); color: #64748b;">
          <i class="fa-solid fa-circle-info"></i>
        </div>
        <div>
          <h4>No Records Found</h4>
          <p>No projects match your active filter selection. Try selecting 'All States' or resetting filters.</p>
        </div>
      </div>
    `;
    return;
  }

  const sortedByDelay = [...filtered].sort((a, b) => b.delayDays - a.delayDays);
  const highestDelay = sortedByDelay[0];

  const sortedByLegal = [...filtered].sort((a, b) => b.legalDisputes - a.legalDisputes);
  const highestLegal = sortedByLegal[0];

  const delayedTotal = filtered.filter((p) => p.status === "delayed" || p.delayDays > 0 || p.isDelayed).length;

  const stateDelaySums = {};
  filtered.forEach((p) => {
    if (p.delayDays > 0 || p.isDelayed) {
      stateDelaySums[p.state] = (stateDelaySums[p.state] || 0) + 1;
    }
  });

  let maxDelayState = "None";
  let maxDelayCount = 0;
  Object.entries(stateDelaySums).forEach(([st, cnt]) => {
    if (cnt > maxDelayCount) {
      maxDelayState = st;
      maxDelayCount = cnt;
    }
  });

  container.innerHTML = `
    <div class="insight-item">
      <div class="insight-icon" style="background: rgba(239, 68, 68, 0.15); color: #ef4444;">
        <i class="fa-solid fa-clock"></i>
      </div>
      <div>
        <h4>Critical Delay Hotspot</h4>
        <p>
          <strong>${highestDelay ? highestDelay.id : "N/A"}</strong> (${highestDelay ? highestDelay.state : ""}) 
          records the highest delay at <strong>${highestDelay ? highestDelay.delayDays : 0} days</strong>, 
          involving ${highestDelay ? highestDelay.families : 0} affected titleholders.
        </p>
      </div>
    </div>

    <div class="insight-item">
      <div class="insight-icon" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b;">
        <i class="fa-solid fa-scale-balanced"></i>
      </div>
      <div>
        <h4>Litigation & Legal Obstacle</h4>
        <p>
          <strong>${highestLegal ? highestLegal.id : "N/A"}</strong> has 
          <strong>${highestLegal ? highestLegal.legalDisputes : 0} registered legal disputes</strong>. 
          State of <strong>${maxDelayState}</strong> leads the cluster with ${maxDelayCount} active delay issues.
        </p>
      </div>
    </div>

    <div class="insight-item">
      <div class="insight-icon" style="background: rgba(34, 197, 94, 0.15); color: #16a34a;">
        <i class="fa-solid fa-triangle-exclamation"></i>
      </div>
      <div>
        <h4>National SLA Watchdog</h4>
        <p>
          <strong>${delayedTotal} of ${filtered.length} projects (${Math.round((delayedTotal / filtered.length) * 100)}%)</strong> 
          currently exceed scheduled timelines. Recommended: Trigger PM Gati Shakti inter-ministerial resolution protocol.
        </p>
      </div>
    </div>
  `;
}

/**
 * State-wise Performance Table
 */
function renderStatePerformance(filtered) {
  const tableBody = document.getElementById("statePerformanceBody");
  if (!tableBody) return;

  const stateData = {};
  filtered.forEach((p) => {
    if (!stateData[p.state]) {
      stateData[p.state] = {
        totalProjects: 0,
        delayedProjects: 0,
        totalDelay: 0,
        legalDisputes: 0
      };
    }
    const item = stateData[p.state];
    item.totalProjects++;
    if (p.status === "delayed" || p.delayDays > 0 || p.isDelayed) {
      item.delayedProjects++;
    }
    item.totalDelay += p.delayDays;
    item.legalDisputes += p.legalDisputes;
  });

  tableBody.innerHTML = "";
  const sortedStateNames = Object.keys(stateData).sort();

  if (sortedStateNames.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: #64748b; padding: 24px;">
          No state records available for this filter.
        </td>
      </tr>
    `;
    return;
  }

  sortedStateNames.forEach((st) => {
    const data = stateData[st];
    const avgDelay = data.totalProjects > 0 ? Math.round(data.totalDelay / data.totalProjects) : 0;
    const riskScore = avgDelay + data.legalDisputes * 4;

    let riskLevel = "Low";
    let riskClass = "risk-low";

    if (riskScore >= 45 || data.delayedProjects >= 4) {
      riskLevel = "High";
      riskClass = "risk-high";
    } else if (riskScore >= 20 || data.delayedProjects >= 1) {
      riskLevel = "Medium";
      riskClass = "risk-medium";
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${escapeHTML(st)}</strong></td>
      <td>${data.totalProjects}</td>
      <td><span style="color: ${data.delayedProjects > 0 ? '#ef4444' : '#16a34a'}; font-weight: 600;">${data.delayedProjects}</span></td>
      <td>${avgDelay} Days</td>
      <td>${data.legalDisputes}</td>
      <td><span class="risk-badge ${riskClass}">${riskLevel}</span></td>
    `;
    tableBody.appendChild(tr);
  });
}

/**
 * =========================================================
 * FEED PROJECT LIST TABLE (LIKE DASHBOARD)
 * =========================================================
 */
function renderProjectsTable(filtered) {
  const tableBody = document.getElementById("projectsTableBody");
  if (!tableBody) return;

  // Apply search query filter if user entered text
  let list = filtered;
  if (searchQuery && searchQuery.trim() !== "") {
    const q = searchQuery.toLowerCase().trim();
    list = filtered.filter(p => 
      p.id.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.state.toLowerCase().includes(q) ||
      p.type.toLowerCase().includes(q) ||
      p.district.toLowerCase().includes(q)
    );
  }

  const total = list.length;
  const totalPages = Math.ceil(total / projectsPerPage) || 1;
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const startIndex = (currentPage - 1) * projectsPerPage;
  const currentSlice = list.slice(startIndex, startIndex + projectsPerPage);

  tableBody.innerHTML = "";

  if (currentSlice.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="10" style="text-align: center; color: #64748b; padding: 32px;">
          <i class="fa-solid fa-folder-open" style="font-size: 24px; color: #cbd5e1; margin-bottom: 8px; display: block;"></i>
          No matching projects found. Try changing your search query or filters.
        </td>
      </tr>
    `;
    updateTablePagination(0, 0, 0, 1);
    return;
  }

  currentSlice.forEach((p) => {
    const row = document.createElement("tr");

    // Status HTML
    let statusClass = "status-on-track";
    let statusLabel = "On Track";
    if (p.status === "delayed" || p.isDelayed || p.delayDays > 0) {
      statusClass = "status-delayed";
      statusLabel = "Delayed";
    } else if (p.status === "completed") {
      statusClass = "status-completed";
      statusLabel = "Completed";
    }

    // Compensation HTML
    let compClass = "compensation-pending";
    if (p.compensation === "Completed") {
      compClass = "compensation-complete";
    } else if (p.compensation === "In Progress") {
      compClass = "compensation-progress";
    }

    row.innerHTML = `
      <td><strong>${escapeHTML(p.id)}</strong></td>
      <td>${escapeHTML(p.name)}</td>
      <td>${escapeHTML(p.state)}</td>
      <td>${escapeHTML(p.type)}</td>
      <td>${p.landArea.toLocaleString(undefined, { maximumFractionDigits: 1 })} Acres</td>
      <td>
        <span class="status-badge ${compClass}">
          ${escapeHTML(p.compensation)}
        </span>
      </td>
      <td>
        <span style="color: ${p.legalDisputes > 0 ? '#ef4444' : '#64748b'}; font-weight: ${p.legalDisputes > 0 ? '700' : '400'};">
          ${p.legalDisputes}
        </span>
      </td>
      <td>
        <span style="color: ${p.delayDays > 0 ? '#ef4444' : '#16a34a'}; font-weight: ${p.delayDays > 0 ? '700' : '400'};">
          ${p.delayDays}
        </span>
      </td>
      <td>
        <span class="status-badge ${statusClass}">
          ${statusLabel}
        </span>
      </td>
      <td>
        <button class="view-details-btn" data-project-id="${escapeHTML(p.id)}">
          <i class="fa-solid fa-eye"></i> View Details
        </button>
      </td>
    `;

    tableBody.appendChild(row);
  });

  // Attach View Details Click Listener
  tableBody.querySelectorAll(".view-details-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const projId = btn.getAttribute("data-project-id");
      const targetProject = allProjects.find(p => p.id === projId);
      if (targetProject) {
        openProjectDetails(targetProject);
      }
    });
  });

  const start = startIndex + 1;
  const end = Math.min(startIndex + projectsPerPage, total);
  updateTablePagination(start, end, total, totalPages);
}

/**
 * Updates Pagination Controls for the Project List Table
 */
function updateTablePagination(start, end, total, totalPages) {
  const tableInfo = document.getElementById("tableInfo");
  const currentPageElem = document.getElementById("currentPage");
  const prevBtn = document.getElementById("previousPageBtn");
  const nextBtn = document.getElementById("nextPageBtn");

  if (tableInfo) {
    tableInfo.textContent = total > 0
      ? `Showing ${start}-${end} of ${total.toLocaleString()} projects`
      : `Showing 0 projects`;
  }

  if (currentPageElem) {
    currentPageElem.textContent = currentPage;
  }

  if (prevBtn) {
    prevBtn.disabled = currentPage <= 1;
  }

  if (nextBtn) {
    nextBtn.disabled = currentPage >= totalPages || total === 0;
  }
}

/**
 * Opens Project Details Modal (Like Dashboard)
 */
function openProjectDetails(p) {
  if (!p) return;

  const modal = document.getElementById("projectModal");
  const modalTitle = document.getElementById("modalProjectId");
  const modalBody = document.getElementById("modalProjectDetails");

  if (!modal || !modalBody) return;

  if (modalTitle) {
    modalTitle.textContent = `${p.id} - ${p.name}`;
  }

  const riskScore = Math.min(100, Math.round(
    (p.delayDays * 0.8) +
    (p.legalDisputes * 12) +
    (p.courtCases * 20) +
    (p.pendingApprovals * 6) +
    (p.compensation !== "Completed" ? 15 : 0)
  ));

  let riskColor = "#22c55e";
  let riskDescription = "Project is on track with low statutory and legal liability.";
  if (riskScore >= 60) {
    riskColor = "#ef4444";
    riskDescription = "High risk project requiring CALA intervention, PFMS compensation acceleration, and litigation management.";
  } else if (riskScore >= 30) {
    riskColor = "#f59e0b";
    riskDescription = "Moderate risk. Inter-departmental approvals or compensation disbursement requires monitoring.";
  }

  const details = [
    ["Project ID", p.id],
    ["Project Name", p.name],
    ["State", p.state],
    ["District / Code", p.district || p.districtCode || "N/A"],
    ["Project Type", p.type],
    ["Land Classification", p.landType],
    ["Land Area", `${p.landArea.toLocaleString(undefined, { maximumFractionDigits: 2 })} Acres`],
    ["Affected Titleholders", `${p.families.toLocaleString()} Families`],
    ["Line Departments", p.departmentsCount],
    ["Notification Age", `${p.notificationAgeDays} Days`],
    ["Compensation Status", p.compensation],
    ["Compensation Disbursed", `${p.compensationPct.toFixed(1)}%`],
    ["Possession Status", p.possessionStatus],
    ["Active Legal Disputes", p.legalDisputes],
    ["Pending Court Proceedings", p.courtCases === 1 ? "Yes (Active Stay/Notice)" : "No"],
    ["Rehabilitation Required", p.rehabilitationRequired === 1 ? `Yes (${p.rehabilitationPct}% complete)` : "No"],
    ["Stakeholder Responsiveness", `${p.stakeholderScore} / 10`],
    ["Historical Dept Performance", `${p.deptPerformanceScore} / 100`],
    ["Public Objections Count", p.publicObjections],
    ["Pending Approvals", p.pendingApprovals],
    ["Budget Utilization", `${p.budgetUtilizationPct}%`],
    ["Monsoon Season Impact", p.monsoonOverlap === 1 ? "High Seasonal Interruption" : "Normal"],
    ["Statutory Delay", `${p.delayDays} Days`],
    ["Current Pipeline Status", p.status.toUpperCase()]
  ];

  let html = '<div class="project-details-grid">';
  details.forEach(([label, value]) => {
    html += `
      <div class="detail-item">
        <span>${escapeHTML(label)}</span>
        <strong>${escapeHTML(String(value ?? "N/A"))}</strong>
      </div>
    `;
  });
  html += '</div>';

  html += `
    <div class="risk-analysis">
      <h3>
        <i class="fa-solid fa-brain" style="color: ${riskColor};"></i>
        AI Predictive Risk Evaluation
      </h3>
      <p>
        Calculated Acquisition Risk Index: 
        <strong style="color: ${riskColor}; font-size: 15px;">${riskScore}% (${p.riskLevel} Risk)</strong>
      </p>
      <p>${riskDescription}</p>
    </div>
  `;

  modalBody.innerHTML = html;
  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

/**
 * Closes the Project Details Modal
 */
function closeProjectModal() {
  const modal = document.getElementById("projectModal");
  if (modal) {
    modal.classList.remove("active");
    document.body.style.overflow = "auto";
  }
}

/**
 * Initializes and updates the Leaflet Map with Project Markers
 */
function updateProjectMap(filtered) {
  const mapElement = document.getElementById("projectMap");
  if (!mapElement || typeof L === "undefined") return;

  if (!projectMap) {
    projectMap = L.map("projectMap", {
      scrollWheelZoom: false
    }).setView([22.5937, 78.9629], 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: "&copy; OpenStreetMap contributors | PM Gati Shakti NMP"
    }).addTo(projectMap);

    mapMarkersLayer = L.layerGroup().addTo(projectMap);
  }

  if (mapMarkersLayer) {
    mapMarkersLayer.clearLayers();
  }

  // Plot markers for filtered projects
  filtered.forEach((p, idx) => {
    const baseCoords = STATE_COORDINATES[p.state] || [22.5937, 78.9629];
    // Deterministic jitter around state center based on project id/index to prevent stacking
    const offsetLat = ((idx * 17) % 25 - 12) * 0.04;
    const offsetLng = ((idx * 23) % 25 - 12) * 0.04;
    const coords = [baseCoords[0] + offsetLat, baseCoords[1] + offsetLng];

    let markerColor = "#22c55e";
    if (p.status === "delayed" || p.isDelayed) {
      markerColor = "#ef4444";
    } else if (p.status === "active") {
      markerColor = "#f59e0b";
    }

    const marker = L.circleMarker(coords, {
      radius: 8,
      fillColor: markerColor,
      color: "#ffffff",
      weight: 2,
      opacity: 1,
      fillOpacity: 0.85
    });

    marker.bindPopup(`
      <div style="font-family: 'Inter', sans-serif; font-size: 13px; line-height: 1.5; min-width: 200px;">
        <h4 style="margin: 0 0 6px 0; color: #0f172a; font-size: 14px; font-weight: 700;">${escapeHTML(p.name)}</h4>
        <div style="color: #475569;"><strong>ID:</strong> ${escapeHTML(p.id)}</div>
        <div style="color: #475569;"><strong>State:</strong> ${escapeHTML(p.state)}</div>
        <div style="color: #475569;"><strong>Type:</strong> ${escapeHTML(p.type)}</div>
        <div style="color: #475569;"><strong>Area:</strong> ${p.landArea} Acres</div>
        <div style="color: #475569;"><strong>Compensation:</strong> ${escapeHTML(p.compensation)} (${p.compensationPct}%)</div>
        <div style="margin-top: 6px; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; display: inline-block; background: ${markerColor}22; color: ${markerColor};">
          ${p.status.toUpperCase()}: ${p.delayDays} Days Delay
        </div>
      </div>
    `);

    mapMarkersLayer.addLayer(marker);
  });

  // Dynamic zoom/pan based on state filter
  const stateFilter = document.getElementById("stateFilter");
  const selectedState = stateFilter ? stateFilter.value : "all";
  if (selectedState !== "all" && STATE_COORDINATES[selectedState]) {
    projectMap.flyTo(STATE_COORDINATES[selectedState], 7, { duration: 0.8 });
  } else if (selectedState === "all") {
    projectMap.flyTo([22.5937, 78.9629], 5, { duration: 0.8 });
  }

  setTimeout(() => {
    if (projectMap) {
      projectMap.invalidateSize();
    }
  }, 250);
}

/**
 * Main Controller: Recalculates all analytics, charts, maps, and tables
 */
function updateAnalytics() {
  const filtered = getFilteredProjects();

  try { updateStatistics(filtered); } catch (e) { console.error("updateStatistics error:", e); }
  try { createStatusChart(filtered); } catch (e) { console.error("createStatusChart error:", e); }
  try { createStateDelayChart(filtered); } catch (e) { console.error("createStateDelayChart error:", e); }
  try { createProjectTypeChart(filtered); } catch (e) { console.error("createProjectTypeChart error:", e); }
  try { createCompensationChart(filtered); } catch (e) { console.error("createCompensationChart error:", e); }
  try { updateRiskFactors(filtered); } catch (e) { console.error("updateRiskFactors error:", e); }
  try { renderInsights(filtered); } catch (e) { console.error("renderInsights error:", e); }
  try { renderStatePerformance(filtered); } catch (e) { console.error("renderStatePerformance error:", e); }
  try { renderProjectsTable(filtered); } catch (e) { console.error("renderProjectsTable error:", e); }
  try { updateProjectMap(filtered); } catch (e) { console.error("updateProjectMap error:", e); }
}

/**
 * Exports current State Analytics Table to CSV
 */
function exportAnalyticsCSV() {
  const filtered = getFilteredProjects();
  if (filtered.length === 0) {
    alert("No projects available to export.");
    return;
  }

  const stateData = {};
  filtered.forEach((p) => {
    if (!stateData[p.state]) {
      stateData[p.state] = {
        total: 0,
        delayed: 0,
        totalDelay: 0,
        legal: 0,
        families: 0,
        area: 0
      };
    }
    const st = stateData[p.state];
    st.total++;
    if (p.status === "delayed" || p.delayDays > 0 || p.isDelayed) st.delayed++;
    st.totalDelay += p.delayDays;
    st.legal += p.legalDisputes;
    st.families += p.families;
    st.area += p.landArea;
  });

  let csvContent = "State,Total Projects,Delayed Projects,Average Delay (Days),Legal Disputes,Total Affected Families,Total Land Area (Acres),Risk Level\n";

  Object.keys(stateData).sort().forEach((stName) => {
    const d = stateData[stName];
    const avgDelay = d.total > 0 ? Math.round(d.totalDelay / d.total) : 0;
    const risk = avgDelay >= 45 ? "High" : avgDelay >= 20 ? "Medium" : "Low";
    csvContent += `"${stName}",${d.total},${d.delayed},${avgDelay},${d.legal},${d.families},${d.area.toFixed(1)},"${risk}"\n`;
  });

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `LandPredict_Analytics_State_Summary_${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Toast Notification Helper
 */
function showToast(message, type = "success") {
  const existing = document.getElementById("analyticsToast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "analyticsToast";
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: #0f172a;
    color: #ffffff;
    padding: 14px 22px;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.3);
    font-size: 14px;
    font-family: 'Inter', sans-serif;
    display: flex;
    align-items: center;
    gap: 12px;
    z-index: 99999;
    border-left: 4px solid ${type === "success" ? "#22c55e" : "#ef4444"};
    animation: slideInToast 0.3s ease-out;
  `;

  toast.innerHTML = `
    <i class="fa-solid ${type === "success" ? "fa-circle-check" : "fa-triangle-exclamation"}" style="color: ${type === "success" ? "#22c55e" : "#ef4444"}; font-size: 18px;"></i>
    <span>${message}</span>
  `;

  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.5s ease";
    setTimeout(() => toast.remove(), 500);
  }, 3500);
}

/**
 * Initialize on DOM Loaded or immediate if already interactive
 */
async function initAnalytics() {
  const stateFilter = document.getElementById("stateFilter");
  const typeFilter = document.getElementById("typeFilter");
  const statusFilter = document.getElementById("statusFilter");
  const resetFiltersBtn = document.getElementById("resetFiltersBtn");
  const refreshAnalyticsBtn = document.getElementById("refreshAnalyticsBtn");
  const exportAnalyticsBtn = document.getElementById("exportAnalyticsBtn");
  const searchInput = document.getElementById("searchProject");
  const viewAllBtn = document.getElementById("viewAllProjectsBtn");
  const prevBtn = document.getElementById("previousPageBtn");
  const nextBtn = document.getElementById("nextPageBtn");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const projectModal = document.getElementById("projectModal");
  const menuBtn = document.getElementById("menuBtn");
  const sidebar = document.getElementById("sidebar");

  // Mobile menu toggle
  if (menuBtn && sidebar) {
    menuBtn.addEventListener("click", () => {
      sidebar.classList.toggle("active");
    });
  }

  // Filter change listeners
  if (stateFilter) stateFilter.addEventListener("change", () => {
    currentPage = 1;
    updateAnalytics();
  });

  if (typeFilter) typeFilter.addEventListener("change", () => {
    currentPage = 1;
    updateAnalytics();
  });

  if (statusFilter) statusFilter.addEventListener("change", () => {
    currentPage = 1;
    updateAnalytics();
  });

  // Search input for project list
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value;
      currentPage = 1;
      renderProjectsTable(getFilteredProjects());
    });
  }

  // View All Projects button
  if (viewAllBtn) {
    viewAllBtn.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      searchQuery = "";
      if (stateFilter) stateFilter.value = "all";
      if (typeFilter) typeFilter.value = "all";
      if (statusFilter) statusFilter.value = "all";
      currentPage = 1;
      updateAnalytics();
      showToast("Displaying all land acquisition projects.", "success");
    });
  }

  // Table Pagination
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        renderProjectsTable(getFilteredProjects());
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      currentPage++;
      renderProjectsTable(getFilteredProjects());
    });
  }

  // Modal Close Listeners
  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", closeProjectModal);
  }

  if (projectModal) {
    projectModal.addEventListener("click", (e) => {
      if (e.target === projectModal) closeProjectModal();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeProjectModal();
  });

  // Reset filters
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener("click", () => {
      if (stateFilter) stateFilter.value = "all";
      if (typeFilter) typeFilter.value = "all";
      if (statusFilter) statusFilter.value = "all";
      if (searchInput) searchInput.value = "";
      searchQuery = "";
      currentPage = 1;
      updateAnalytics();
      showToast("Filters reset to default view.", "success");
    });
  }

  // Refresh analytics
  if (refreshAnalyticsBtn) {
    refreshAnalyticsBtn.addEventListener("click", async () => {
      const icon = refreshAnalyticsBtn.querySelector("i");
      if (icon) icon.classList.add("fa-spin");
      refreshAnalyticsBtn.disabled = true;

      await loadProjectsData();
      populateFilters();
      currentPage = 1;
      updateAnalytics();

      if (icon) icon.classList.remove("fa-spin");
      refreshAnalyticsBtn.disabled = false;
      showToast("Analytics & PostgreSQL Dataset refreshed successfully!", "success");
    });
  }

  // Export Analytics CSV
  if (exportAnalyticsBtn) {
    exportAnalyticsBtn.addEventListener("click", exportAnalyticsCSV);
  }

  // Initial Load & Render
  await loadProjectsData();
  populateFilters();
  updateAnalytics();
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAnalytics);
  } else {
    initAnalytics();
  }
}
