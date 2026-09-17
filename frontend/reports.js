// ==========================================
// LANDPREDICT AI - REPORTS CONTROLLER
// Database query, report generator and export engine
// ==========================================

const API_BASE = typeof window !== "undefined" && window.API_BASE_URL !== undefined ? window.API_BASE_URL : "https://landpredict-project.onrender.com";

let cachedProjects = [];
let generatedReports = [];

const DEFAULT_REPORTS = [
  {
    id: "REP-9001",
    name: "MoRTH_National_Highway_Corridor_Delay_Audit_2026.pdf",
    type: "Delay Analysis",
    typeCode: "delay",
    date: new Date(Date.now() - 3600000 * 5).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' }),
    format: "pdf",
    status: "Completed",
    recordCount: 142
  },
  {
    id: "REP-9002",
    name: "High_Risk_Agricultural_Land_Parcels_Q3.csv",
    type: "High Risk Projects",
    typeCode: "risk",
    date: new Date(Date.now() - 3600000 * 24).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' }),
    format: "csv",
    status: "Completed",
    recordCount: 88
  },
  {
    id: "REP-9003",
    name: "Bhoomi_Rashi_Section_3D_Compensation_Status.excel",
    type: "Compensation Summary",
    typeCode: "compensation",
    date: new Date(Date.now() - 3600000 * 48).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' }),
    format: "excel",
    status: "Completed",
    recordCount: 215
  },
  {
    id: "REP-9004",
    name: "Inter_State_Khasra_Legal_Disputes_Review.pdf",
    type: "Legal Dispute Audit",
    typeCode: "legal",
    date: new Date(Date.now() - 3600000 * 96).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' }),
    format: "pdf",
    status: "Completed",
    recordCount: 64
  }
];

document.addEventListener("DOMContentLoaded", async () => {
  await loadProjectsFromDatabase();
  loadReportsLibrary();
  setupReportForm();
  setupSearch();
  setupQuickExport();
});

async function loadProjectsFromDatabase() {
  try {
    const res = await fetch(`${API_BASE}/api/projects?limit=500`);
    if (res.ok) {
      const data = await res.json();
      cachedProjects = data.data || [];
      console.log(`Loaded ${cachedProjects.length} projects from Mongodb.`);
    }
  } catch (err) {
    console.warn("Could not load projects from Mongodb backend, using local fallback:", err);
    const local = localStorage.getItem("landInsightProjects");
    if (local) {
      cachedProjects = JSON.parse(local);
    }
  }
}

function loadReportsLibrary() {
  const saved = localStorage.getItem("landPredictReports");
  if (saved) {
    try {
      generatedReports = JSON.parse(saved);
    } catch (e) {
      generatedReports = [...DEFAULT_REPORTS];
    }
  } else {
    generatedReports = [...DEFAULT_REPORTS];
    saveReports();
  }
  renderReportsTable(generatedReports);
}

function saveReports() {
  localStorage.setItem("landPredictReports", JSON.stringify(generatedReports));
}

function renderReportsTable(reports) {
  const tbody = document.getElementById("reportsTableBody");
  if (!tbody) return;

  if (reports.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; padding:30px; color:#64748b;">
          <i class="fa-solid fa-folder-open" style="font-size:2rem; margin-bottom:8px; display:block;"></i>
          No reports found matching your search.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = reports.map((rep) => {
    let formatClass = "format-pdf";
    let formatLabel = "PDF";
    let icon = "fa-file-pdf";

    if (rep.format === "csv") {
      formatClass = "format-csv";
      formatLabel = "CSV";
      icon = "fa-file-csv";
    } else if (rep.format === "excel") {
      formatClass = "format-excel";
      formatLabel = "EXCEL";
      icon = "fa-file-excel";
    }

    return `
      <tr>
        <td>
          <div style="display:flex; align-items:center; gap:10px;">
            <i class="fa-solid ${icon}" style="font-size:1.2rem; color:${rep.format === 'csv' ? '#15803d' : rep.format === 'excel' ? '#0284c7' : '#dc2626'}"></i>
            <div>
              <strong style="color:var(--dark); font-size:13px;">${rep.name}</strong>
              <div style="font-size:11px; color:#64748b;">${rep.recordCount ? rep.recordCount + " project records included" : "Intelligence Summary"}</div>
            </div>
          </div>
        </td>
        <td><span style="font-weight:600; color:#334155;">${rep.type}</span></td>
        <td>${rep.date}</td>
        <td><span class="format-badge ${formatClass}">${formatLabel}</span></td>
        <td><span class="status-badge status-completed"><i class="fa-solid fa-circle-check" style="margin-right:4px;"></i>${rep.status}</span></td>
        <td>
          <button class="download-btn" onclick="downloadReport('${rep.id}')">
            <i class="fa-solid fa-download"></i> Download
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

function setupReportForm() {
  const form = document.getElementById("reportForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const reportType = document.getElementById("reportType").value;
    const formatType = document.getElementById("formatType").value;
    const timeRange = document.getElementById("timeRange").value;
    const submitBtn = form.querySelector('button[type="submit"]');

    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Querying Mongodb & Generating...`;
    submitBtn.disabled = true;

    // Simulate query & report compilation
    await new Promise(r => setTimeout(r, 900));

    let typeTitle = "Delay Analysis Report";
    let prefix = "Delay_Audit";
    if (reportType === "risk") {
      typeTitle = "High Risk Projects Report";
      prefix = "High_Risk_Parcels";
    } else if (reportType === "compensation") {
      typeTitle = "Compensation Status Summary";
      prefix = "Compensation_Summary";
    } else if (reportType === "legal") {
      typeTitle = "Legal Dispute Audit";
      prefix = "Legal_Dispute_Audit";
    }

    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const ext = formatType === "csv" ? ".csv" : formatType === "excel" ? ".xlsx" : ".pdf";
    const reportName = `LandPredict_${prefix}_${timestamp}${ext}`;

    const newReport = {
      id: "REP-" + Date.now().toString().slice(-4),
      name: reportName,
      type: typeTitle,
      typeCode: reportType,
      date: new Date().toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' }),
      format: formatType,
      status: "Completed",
      recordCount: cachedProjects.length || 150
    };

    generatedReports.unshift(newReport);
    saveReports();
    renderReportsTable(generatedReports);

    submitBtn.innerHTML = `<i class="fa-solid fa-circle-check"></i> Report Generated!`;
    setTimeout(() => {
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }, 1800);

    // Prompt user to immediately download
    if (confirm(`✅ Report "${reportName}" generated successfully!\n\nWould you like to download it now?`)) {
      downloadReport(newReport.id);
    }
  });
}

function downloadReport(reportId) {
  const rep = generatedReports.find(r => r.id === reportId);
  if (!rep) return;

  if (rep.format === "csv") {
    downloadCSV(rep);
  } else {
    // For PDF / Excel, render printable intelligence summary
    renderPrintableSummary(rep);
  }
}

function downloadCSV(rep) {
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Project ID,State,Project Type,Land Area (Acres),Affected Families,Compensation Status,Delay Days,Status,Legal Disputes,Pending Approvals\n";

  const rows = cachedProjects.length > 0 ? cachedProjects : [
    { id: "LAP-10001", state: "Uttar Pradesh", type: "Expressway", landArea: 240, families: 45, compensation: "Disbursed", delayDays: 0, status: "completed", legalDisputes: 0, pendingApprovals: 0 },
    { id: "LAP-10002", state: "Gujarat", type: "Industrial Corridor", landArea: 680, families: 120, compensation: "Pending", delayDays: 145, status: "delayed", legalDisputes: 4, pendingApprovals: 3 },
    { id: "LAP-10003", state: "Maharashtra", type: "High-Speed Rail", landArea: 510, families: 85, compensation: "In Progress", delayDays: 60, status: "in-progress", legalDisputes: 2, pendingApprovals: 1 }
  ];

  rows.forEach(p => {
    const row = [
      p.id,
      `"${p.state || 'N/A'}"`,
      `"${p.type || p.project_type || 'N/A'}"`,
      p.landArea || p.land_area_acres || 0,
      p.families || p.num_affected_families || 0,
      `"${p.compensation || p.compensation_status || 'N/A'}"`,
      p.delayDays || p.delay_days || 0,
      `"${p.status || 'Active'}"`,
      p.legalDisputes || p.legal_disputes_count || 0,
      p.pendingApprovals || p.pending_approvals_count || 0
    ].join(",");
    csvContent += row + "\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", rep.name);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function renderPrintableSummary(rep) {
  const win = window.open("", "_blank");
  if (!win) {
    alert(`Downloading ${rep.name}...\n\n(Pop-up was blocked, please enable popups for PDF printing)`);
    return;
  }

  const printHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${rep.name}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e293b; }
          .header { border-bottom: 3px solid #16a34a; padding-bottom: 15px; margin-bottom: 25px; }
          .header h1 { margin: 0; color: #0f172a; font-size: 24px; }
          .header p { margin: 5px 0 0 0; color: #64748b; font-size: 13px; }
          .badge { display: inline-block; padding: 4px 10px; background: #dcfce7; color: #15803d; border-radius: 4px; font-weight: 700; font-size: 12px; }
          .meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px; background: #f8fafc; padding: 15px; border-radius: 8px; }
          .meta-item label { display: block; font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600; }
          .meta-item span { font-size: 15px; font-weight: 700; color: #0f172a; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
          th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
          th { background: #f1f5f9; color: #334155; font-weight: 700; }
          tr:nth-child(even) { background: #f8fafc; }
          .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <h1>LandPredict AI | Statutory Land Acquisition Report</h1>
            <span class="badge">OFFICIAL AUDIT</span>
          </div>
          <p>Ministry of Road Transport & Highways | PM Gati Shakti NMP Integrated Analytics</p>
        </div>

        <div class="meta-grid">
          <div class="meta-item"><label>Report Title</label><span>${rep.name}</span></div>
          <div class="meta-item"><label>Report Classification</label><span>${rep.type}</span></div>
          <div class="meta-item"><label>Date Generated</label><span>${rep.date}</span></div>
          <div class="meta-item"><label>Format</label><span>${rep.format.toUpperCase()}</span></div>
          <div class="meta-item"><label>Projects Evaluated</label><span>${cachedProjects.length || 300} Corridors</span></div>
          <div class="meta-item"><label>Compliance Authority</label><span>CALA / DILRMP Portal</span></div>
        </div>

        <h3>Sample Corridor Delay & Acquisition Records</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>State</th>
              <th>Type</th>
              <th>Land Area</th>
              <th>Families</th>
              <th>Compensation</th>
              <th>Delay</th>
              <th>Legal Disputes</th>
            </tr>
          </thead>
          <tbody>
            ${(cachedProjects.slice(0, 15)).map(p => `
              <tr>
                <td><strong>${p.id}</strong></td>
                <td>${p.state || 'Uttar Pradesh'}</td>
                <td>${p.type || p.project_type || 'Highway'}</td>
                <td>${p.landArea || p.land_area_acres || 0} Acres</td>
                <td>${p.families || p.num_affected_families || 0}</td>
                <td>${p.compensation || p.compensation_status || 'In Progress'}</td>
                <td><span style="color:${(p.delayDays || 0) > 0 ? '#dc2626' : '#16a34a'}; font-weight:700;">${p.delayDays || 0} Days</span></td>
                <td>${p.legalDisputes || p.legal_disputes_count || 0}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <div class="footer">
          <span>Generated by LandPredict AI - SIH 2026</span>
          <span>Certified Confidential & Statutory Document</span>
        </div>

        <script>
          window.onload = function() {
            setTimeout(() => { window.print(); }, 400);
          };
        </script>
      </body>
    </html>
  `;

  win.document.open();
  win.document.write(printHtml);
  win.document.close();
}

function setupQuickExport() {
  const btn = document.getElementById("quickExportAllBtn");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Fetching Mongodb Records...`;
    btn.disabled = true;

    try {
      if (cachedProjects.length === 0) {
        await loadProjectsFromDatabase();
      }
      downloadCSV({
        name: `LandPredict_PostgreSQL_Full_Projects_Export_${Date.now()}.csv`
      });
    } catch (e) {
      alert("Export failed. Please check database connectivity.");
    } finally {
      btn.innerHTML = `<i class="fa-solid fa-file-csv"></i> Export Full Mongodb Dataset`;
      btn.disabled = false;
    }
  });
}

function setupSearch() {
  const searchInput = document.getElementById("searchReport");
  if (!searchInput) return;

  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (!query) {
      renderReportsTable(generatedReports);
      return;
    }

    const filtered = generatedReports.filter(rep =>
      rep.name.toLowerCase().includes(query) ||
      rep.type.toLowerCase().includes(query) ||
      rep.format.toLowerCase().includes(query)
    );
    renderReportsTable(filtered);
  });
}

window.downloadReport = downloadReport;

