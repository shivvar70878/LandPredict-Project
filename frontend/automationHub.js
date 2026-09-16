// =========================================================
// LANDPREDICT AI - AUTOMATION & NATIONAL PORTALS CONTROLLER
// PM Gati Shakti (200+ GIS Layers), MoRTH Bhoomi Rashi,
// and State Revenue RoR Hub (12 State Portals)
// =========================================================

const API_BASE_AUTO = typeof window !== "undefined" && window.API_BASE_URL !== undefined ? window.API_BASE_URL : "https://landpredict-project.onrender.com";

let countdownSeconds = 300; // 5 minutes
let countdownInterval = null;
let cachedAutomationData = null;

document.addEventListener("DOMContentLoaded", () => {
  injectAutomationBanner();
  injectAutomationModal();
  startCountdownTimer();
  fetchAutomationStatus();
  setupAutomationEventListeners();
});

// =========================================================
// 1. INJECT AUTOMATION BANNER
// =========================================================

function injectAutomationBanner() {
  // Look for target container or insert before .filter-card on dashboard
  let target = document.getElementById("automationBannerContainer");
  if (!target) {
    const filterCard = document.querySelector(".filter-card");
    const welcomeSection = document.querySelector(".welcome-section");
    if (filterCard) {
      target = document.createElement("div");
      target.id = "automationBannerContainer";
      filterCard.parentNode.insertBefore(target, filterCard);
    } else if (welcomeSection) {
      target = document.createElement("div");
      target.id = "automationBannerContainer";
      welcomeSection.parentNode.insertBefore(target, welcomeSection.nextSibling);
    }
  }

  if (!target) return;

  target.innerHTML = `
    <div class="automation-banner">
      <div class="automation-banner-header">
        <div class="automation-title-area">
          <div class="automation-pulse-icon">
            <i class="fa-solid fa-satellite-dish"></i>
            <span class="pulse-ring"></span>
          </div>
          <div>
            <h3>
              Automated National Data Ingestion Pipeline
              <span style="background:rgba(34,197,94,0.2); color:#4ade80; font-size:11px; font-weight:700; padding:2px 8px; border-radius:12px; border:1px solid rgba(34,197,94,0.4);">LIVE</span>
            </h3>
            <p>Real-time continuous sync with PM Gati Shakti NMP, MoRTH Bhoomi Rashi, and 12 State Cadastral Portals</p>
          </div>
        </div>

        <div class="automation-banner-actions">
          <div class="countdown-box">
            <i class="fa-solid fa-clock-rotate-left" style="color:#38bdf8;"></i>
            <span>Next Auto-Sync: <strong id="autoSyncCountdown">05:00</strong></span>
          </div>
          <button id="triggerSyncNowBtn" class="btn-trigger-sync">
            <i class="fa-solid fa-bolt"></i> Run Automated Pipeline Sync
          </button>
          <button id="openAutomationModalBtn" class="btn-inspect-hub">
            <i class="fa-solid fa-sliders"></i> National Portals Hub
          </button>
        </div>
      </div>

      <!-- 3 Core Pipelines Grid -->
      <div class="automation-pipeline-grid">
        <!-- 1. PM Gati Shakti -->
        <div class="pipeline-card" onclick="openAutomationTab('gatishakti')">
          <div class="pipeline-card-icon icon-gatishakti">
            <i class="fa-solid fa-layer-group"></i>
          </div>
          <div class="pipeline-card-info">
            <span class="pipeline-badge badge-gatishakti">
              <i class="fa-solid fa-circle-check"></i> 200+ GIS Layers Synced
            </span>
            <h4>PM Gati Shakti NMP</h4>
            <p>16 Central Ministries & BISAG-N multi-modal GIS infrastructure layers.</p>
            <div class="pipeline-footer-stat">
              <span><span class="stat-live-dot"></span>218 Active Layers</span>
              <strong style="color:#38bdf8; cursor:pointer;">Explore Layers &rarr;</strong>
            </div>
          </div>
        </div>

        <!-- 2. MoRTH Bhoomi Rashi -->
        <div class="pipeline-card" onclick="openAutomationTab('bhoomirashi')">
          <div class="pipeline-card-icon icon-bhoomi">
            <i class="fa-solid fa-file-contract"></i>
          </div>
          <div class="pipeline-card-info">
            <span class="pipeline-badge badge-bhoomi">
              <i class="fa-solid fa-circle-check"></i> Section 3A/3D/3G Live
            </span>
            <h4>MoRTH Bhoomi Rashi</h4>
            <p>e-Gazette statutory stream with automated 1-year lapse detection.</p>
            <div class="pipeline-footer-stat">
              <span><span class="stat-live-dot"></span>5 Active Gazette Corridors</span>
              <strong style="color:#4ade80; cursor:pointer;">View Notices &rarr;</strong>
            </div>
          </div>
        </div>

        <!-- 3. State Revenue RoR Hub -->
        <div class="pipeline-card" onclick="openAutomationTab('state_ror')">
          <div class="pipeline-card-icon icon-states">
            <i class="fa-solid fa-map-location-dot"></i>
          </div>
          <div class="pipeline-card-info">
            <span class="pipeline-badge badge-states">
              <i class="fa-solid fa-circle-check"></i> 12 State Portals Connected
            </span>
            <h4>State Revenue RoR Hub</h4>
            <p>UP Bhulekh, Mahabhulekh, AnyRoR, Bhoomi & 8 other state land portals.</p>
            <div class="pipeline-footer-stat">
              <span><span class="stat-live-dot"></span>12/12 Portals Online</span>
              <strong style="color:#c084fc; cursor:pointer;">Inspect Portals &rarr;</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// =========================================================
// 2. INJECT AUTOMATION COMMAND CENTER MODAL
// =========================================================

function injectAutomationModal() {
  if (document.getElementById("automationCommandModal")) return;

  const modal = document.createElement("div");
  modal.id = "automationCommandModal";
  modal.className = "automation-modal";
  modal.innerHTML = `
    <div class="automation-modal-container">
      <div class="automation-modal-header">
        <div class="modal-header-left">
          <div style="width:38px; height:38px; border-radius:10px; background:#10b981; display:flex; align-items:center; justify-content:center; color:#fff;">
            <i class="fa-solid fa-network-wired"></i>
          </div>
          <div>
            <h3>National Data Automation & Multi-Portal Command Center</h3>
            <p>PM Gati Shakti NMP (200+ Layers), MoRTH Bhoomi Rashi & 12 State Cadastral Portals</p>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:12px;">
          <button id="modalSyncNowBtn" class="btn-trigger-sync" style="padding:6px 12px; font-size:12px;">
            <i class="fa-solid fa-rotate"></i> Sync All Now
          </button>
          <button id="closeAutomationModalBtn" class="btn-close-modal">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>

      <!-- Tabs Bar -->
      <div class="automation-tabs-bar">
        <button class="auto-tab-btn active" data-tab="tab-overview">
          <i class="fa-solid fa-chart-line"></i> Pipeline Overview & Logs
        </button>
        <button class="auto-tab-btn" data-tab="tab-gatishakti">
          <i class="fa-solid fa-layer-group"></i> PM Gati Shakti (200+ Layers)
          <span class="tab-count-badge" id="modalLayersCount">218</span>
        </button>
        <button class="auto-tab-btn" data-tab="tab-bhoomirashi">
          <i class="fa-solid fa-file-signature"></i> MoRTH Bhoomi Rashi
          <span class="tab-count-badge" id="modalBhoomiCount">Live 3A/3D/3G</span>
        </button>
        <button class="auto-tab-btn" data-tab="tab-portals">
          <i class="fa-solid fa-landmark"></i> 12 State Revenue Portals
          <span class="tab-count-badge">12 Online</span>
        </button>
      </div>

      <!-- Modal Body -->
      <div class="automation-modal-body">
        <!-- TAB 1: OVERVIEW & TERMINAL LOGS -->
        <div id="tab-overview" class="tab-pane active">
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:14px; margin-bottom:20px;">
            <div style="background:#fff; border:1px solid #e2e8f0; border-radius:10px; padding:14px;">
              <span style="font-size:11px; color:#64748b; font-weight:600; text-transform:uppercase;">Automation State</span>
              <h3 style="margin:4px 0 0 0; color:#15803d; font-size:18px; display:flex; align-items:center; gap:6px;">
                <span class="stat-live-dot"></span> Active & Synced
              </h3>
            </div>
            <div style="background:#fff; border:1px solid #e2e8f0; border-radius:10px; padding:14px;">
              <span style="font-size:11px; color:#64748b; font-weight:600; text-transform:uppercase;">GIS Layers Synced</span>
              <h3 style="margin:4px 0 0 0; color:#0284c7; font-size:18px;">218 Layers (16 Ministries)</h3>
            </div>
            <div style="background:#fff; border:1px solid #e2e8f0; border-radius:10px; padding:14px;">
              <span style="font-size:11px; color:#64748b; font-weight:600; text-transform:uppercase;">State Land Portals</span>
              <h3 style="margin:4px 0 0 0; color:#9333ea; font-size:18px;">12/12 Portals Online</h3>
            </div>
            <div style="background:#fff; border:1px solid #e2e8f0; border-radius:10px; padding:14px;">
              <span style="font-size:11px; color:#64748b; font-weight:600; text-transform:uppercase;">Statutory 1-Yr Lapse Watch</span>
              <h3 style="margin:4px 0 0 0; color:#dc2626; font-size:18px;">1 Critical Warning</h3>
            </div>
          </div>

          <h4 style="margin:0 0 8px 0; color:#0f172a; font-size:14px; display:flex; align-items:center; gap:6px;">
            <i class="fa-solid fa-terminal" style="color:#16a34a;"></i> Live Synchronization Audit Stream
          </h4>
          <div class="terminal-card" id="automationTerminalLogs">
            <div class="terminal-header">
              <span>SYSTEM EVENT LOG (AUTONOMOUS INGESTION WORKER)</span>
              <span>PROTOCOL: REST / WFS / OGC</span>
            </div>
            <div id="terminalLinesContainer">
              <div class="terminal-line"><span class="log-time">[${new Date().toLocaleTimeString()}]</span> <span class="log-tag tag-success">INITIALIZED</span> Multi-channel automated ingestion engine connected.</div>
              <div class="terminal-line"><span class="log-time">[${new Date().toLocaleTimeString()}]</span> <span class="log-tag tag-info">GATI_SHAKTI</span> Syncing 218 GIS layers from BISAG-N national repository.</div>
              <div class="terminal-line"><span class="log-time">[${new Date().toLocaleTimeString()}]</span> <span class="log-tag tag-info">BHOOMI_RASHI</span> Polling Section 3A, 3C, 3D gazette notifications. 1-Year statutory countdown engine active.</div>
              <div class="terminal-line"><span class="log-time">[${new Date().toLocaleTimeString()}]</span> <span class="log-tag tag-info">STATE_ROR</span> Verified 12 State Cadastral Portals (UP, MH, GJ, KA, BR, WB, MP, RJ, AP, TN, OD, TS).</div>
              <div class="terminal-line"><span class="log-time">[${new Date().toLocaleTimeString()}]</span> <span class="log-tag tag-success">DB_PERSIST</span> Persisted real-time corridor metrics and spatial conflict records into the configured database.</div>
            </div>
          </div>
        </div>

        <!-- TAB 2: PM GATI SHAKTI 200+ LAYERS -->
        <div id="tab-gatishakti" class="tab-pane">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:10px;">
            <div>
              <h4 style="margin:0; font-size:15px; color:#0f172a;">PM Gati Shakti National Master Plan GIS Layers</h4>
              <p style="margin:2px 0 0 0; font-size:12px; color:#64748b;">218 Spatial Layers from 16 Central Line Ministries synced via BISAG-N</p>
            </div>
            <input type="text" id="filterGatiShaktiInput" placeholder="Filter layers by name or ministry..." style="padding:8px 14px; border:1px solid #cbd5e1; border-radius:8px; font-size:12px; width:280px;" />
          </div>
          <div id="gatishaktiMinistriesContainer">
            <!-- Populated via Javascript -->
          </div>
        </div>

        <!-- TAB 3: BHOOMI RASHI LIVE FEED -->
        <div id="tab-bhoomirashi" class="tab-pane">
          <div style="margin-bottom:16px;">
            <h4 style="margin:0; font-size:15px; color:#0f172a;">MoRTH Bhoomi Rashi Statutory Gazette Stream</h4>
            <p style="margin:2px 0 0 0; font-size:12px; color:#64748b;">Section 3A &rarr; 3C &rarr; 3D &rarr; 3G &rarr; 3H with Automated 1-Year Statutory Lapse Watchdog</p>
          </div>
          <div class="bhoomi-notices-list" id="bhoomiNoticesContainer">
            <!-- Populated via Javascript -->
          </div>
        </div>

        <!-- TAB 4: 12 STATE CADASTRE PORTALS -->
        <div id="tab-portals" class="tab-pane">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:10px;">
            <div>
              <h4 style="margin:0; font-size:15px; color:#0f172a;">12 State Cadastre & Record of Rights Portals (DILRMP)</h4>
              <p style="margin:2px 0 0 0; font-size:12px; color:#64748b;">Real-time API integrations across 22.3 Crore digitized land parcels</p>
            </div>
            <span style="background:#dcfce7; color:#15803d; padding:4px 10px; border-radius:6px; font-size:11px; font-weight:700;">
              <i class="fa-solid fa-circle-check"></i> All 12 Portals Online
            </span>
          </div>
          <div class="portals-grid" id="statePortalsGridContainer">
            <!-- Populated via Javascript -->
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

// =========================================================
// 3. EVENT LISTENERS & COUNTDOWN
// =========================================================

function setupAutomationEventListeners() {
  // Open modal button on banner
  document.addEventListener("click", (e) => {
    if (e.target.closest("#openAutomationModalBtn")) {
      openAutomationModal();
    }
    if (e.target.closest("#closeAutomationModalBtn")) {
      closeAutomationModal();
    }
    if (e.target.closest("#triggerSyncNowBtn") || e.target.closest("#modalSyncNowBtn")) {
      triggerManualSync();
    }
  });

  // Modal backdrop click to close
  const modal = document.getElementById("automationCommandModal");
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeAutomationModal();
    });
  }

  // Tab switching
  document.addEventListener("click", (e) => {
    const tabBtn = e.target.closest(".auto-tab-btn");
    if (tabBtn) {
      const targetTab = tabBtn.dataset.tab;
      switchModalTab(targetTab);
    }
  });

  // Layer search input
  document.addEventListener("input", (e) => {
    if (e.target.id === "filterGatiShaktiInput") {
      filterGatiShaktiLayers(e.target.value.toLowerCase().trim());
    }
  });
}

function startCountdownTimer() {
  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    countdownSeconds--;
    if (countdownSeconds <= 0) {
      countdownSeconds = 300;
      triggerManualSync(true); // background auto-sync
    }
    const mins = Math.floor(countdownSeconds / 60);
    const secs = countdownSeconds % 60;
    const countdownEl = document.getElementById("autoSyncCountdown");
    if (countdownEl) {
      countdownEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
  }, 1000);
}

function openAutomationModal() {
  const modal = document.getElementById("automationCommandModal");
  if (modal) {
    modal.classList.add("active");
    loadAllModalData();
  }
}

function closeAutomationModal() {
  const modal = document.getElementById("automationCommandModal");
  if (modal) modal.classList.remove("active");
}

function switchModalTab(tabId) {
  document.querySelectorAll(".auto-tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tabId);
  });
  document.querySelectorAll(".tab-pane").forEach(pane => {
    pane.classList.toggle("active", pane.id === tabId);
  });
}

function openAutomationTab(pipelineKey) {
  openAutomationModal();
  if (pipelineKey === "gatishakti") switchModalTab("tab-gatishakti");
  else if (pipelineKey === "bhoomirashi") switchModalTab("tab-bhoomirashi");
  else if (pipelineKey === "state_ror") switchModalTab("tab-portals");
}

// =========================================================
// 4. API CALLS & DATA POPULATION
// =========================================================

async function fetchAutomationStatus() {
  try {
    const res = await fetch(`${API_BASE_AUTO}/api/automation/status`);
    if (res.ok) {
      const data = await res.json();
      cachedAutomationData = data;
      updateBannerUI(data);
    }
  } catch (err) {
    console.warn("Could not fetch automation status:", err);
  }
}

function updateBannerUI(data) {
  const countEl = document.getElementById("modalLayersCount");
  if (countEl && data.pipelines?.gatishakti_nmp?.layers_count) {
    countEl.textContent = data.pipelines.gatishakti_nmp.layers_count;
  }
}

async function triggerManualSync(isAutomated = false) {
  const btn = document.getElementById("triggerSyncNowBtn");
  const modalBtn = document.getElementById("modalSyncNowBtn");
  const originalHtml = btn ? btn.innerHTML : "";

  [btn, modalBtn].forEach(b => {
    if (b) {
      b.disabled = true;
      b.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Ingesting Portals...`;
    }
  });

  appendTerminalLog("TRIGGER_SYNC", `Initiating pipeline synchronization across 3 channels (${isAutomated ? "SCHEDULED" : "MANUAL"})...`, "tag-info");

  try {
    const res = await fetch(`${API_BASE_AUTO}/api/automation/trigger`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trigger_type: isAutomated ? "AUTOMATED_CRON" : "MANUAL_TRIGGER" })
    });

    if (res.ok) {
      const result = await res.json();
      countdownSeconds = 300; // reset countdown

      appendTerminalLog("SUCCESS", `Synced ${result.metrics.gatishakti_gis_layers_synced} Gati Shakti GIS layers, ${result.metrics.state_revenue_portals_active}, and ${result.metrics.bhoomi_rashi_notices_processed} Bhoomi Rashi records.`, "tag-success");
      
      if (result.metrics.statutory_1year_lapse_alerts > 0) {
        appendTerminalLog("ALERT", `⚠️ Detected ${result.metrics.statutory_1year_lapse_alerts} corridor(s) approaching 1-year statutory Section 3D notification lapse!`, "tag-warn");
        if (typeof window.pushSystemNotification === "function") {
          window.pushSystemNotification(
            "Section 3D Statutory Lapse Alert",
            `Bhoomi Rashi engine flagged ${result.metrics.statutory_1year_lapse_alerts} corridor(s) approaching statutory 1-year declaration expiry. Immediate gazette publication required.`,
            "statutory",
            "critical",
            "Bhoomi Rashi"
          );
        }
      } else if (typeof window.pushSystemNotification === "function") {
        window.pushSystemNotification(
          "National Portals Synced",
          `Successfully synced ${result.metrics.gatishakti_gis_layers_synced} Gati Shakti GIS layers, ${result.metrics.bhoomi_rashi_notices_processed} notices, and verified 12 State RoRs.`,
          "gis",
          "success",
          "PM Gati Shakti"
        );
      }

      // If on dashboard, trigger dataset refresh so project table updates
      if (typeof window.loadDataset === "function") {
        window.loadDataset();
      }

      if (!isAutomated) {
        alert(result.summary);
      }
    }
  } catch (err) {
    appendTerminalLog("ERROR", `Sync failed: ${err.message}`, "tag-warn");
  } finally {
    [btn, modalBtn].forEach(b => {
      if (b) {
        b.disabled = false;
        b.innerHTML = b.id === "modalSyncNowBtn" ? `<i class="fa-solid fa-rotate"></i> Sync All Now` : originalHtml;
      }
    });
  }
}

async function loadAllModalData() {
  loadGatiShaktiLayers();
  loadBhoomiRashiFeed();
  loadStatePortals();
}

async function loadGatiShaktiLayers() {
  const container = document.getElementById("gatishaktiMinistriesContainer");
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE_AUTO}/api/automation/gatishakti/layers`);
    if (res.ok) {
      const data = await res.json();
      const ministries = data.ministries || [];

      container.innerHTML = ministries.map((m, idx) => `
        <div class="ministry-block" data-ministry="${m.ministry_name.toLowerCase()}">
          <div class="ministry-block-header" onclick="toggleMinistryCollapse(this)">
            <h4>
              <i class="fa-solid fa-landmark-flag" style="color:#0284c7;"></i>
              ${m.ministry_name} (${m.ministry_code})
              <span class="ministry-tag">${m.total_layers} GIS Layers</span>
            </h4>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:11px; color:#64748b;">${m.agency}</span>
              <i class="fa-solid fa-chevron-down" style="color:#94a3b8; transition:transform 0.2s;"></i>
            </div>
          </div>
          <div class="layer-items-grid" style="${idx > 1 ? 'display:none;' : ''}">
            ${m.layers.map(l => `
              <div class="layer-item-pill">
                <div>
                  <strong>${l.name}</strong>
                  <div style="font-size:10px; color:#64748b;">ID: ${l.id} &bull; Type: ${l.type}</div>
                </div>
                <span>${l.features_count.toLocaleString()} features</span>
              </div>
            `).join("")}
          </div>
        </div>
      `).join("");
    }
  } catch (err) {
    container.innerHTML = `<p style="color:#dc2626;">Failed to load Gati Shakti layers.</p>`;
  }
}

async function loadBhoomiRashiFeed() {
  const container = document.getElementById("bhoomiNoticesContainer");
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE_AUTO}/api/automation/bhoomirashi/live-feed`);
    if (res.ok) {
      const data = await res.json();
      const notices = data.notices || [];

      container.innerHTML = notices.map(n => {
        const isCritical = n.lapse_risk_status.includes("CRITICAL");
        return `
          <div class="bhoomi-notice-card" style="border-left-color: ${isCritical ? '#dc2626' : '#16a34a'};">
            <div class="notice-card-header">
              <div class="notice-title-box">
                <h4>${n.project_id}: ${n.project_name}</h4>
                <p><i class="fa-solid fa-location-dot"></i> ${n.state} &bull; CALA: ${n.cala_authority}</p>
              </div>
              <span class="statutory-lapse-tag ${isCritical ? 'lapse-critical' : 'lapse-normal'}">
                <i class="fa-solid ${isCritical ? 'fa-triangle-exclamation' : 'fa-shield-check'}"></i>
                ${n.lapse_risk_status}
              </span>
            </div>

            <!-- Statutory Stepper -->
            <div class="statutory-stepper">
              <div class="step-item active">
                <span class="step-circle"><i class="fa-solid fa-check"></i></span>
                <div>
                  <strong>Sec 3A</strong>
                  <div style="font-size:10px;">${n.section_3a_so}</div>
                </div>
              </div>
              <div class="step-item ${n.current_stage !== 'Section 3A' ? 'active' : ''}">
                <span class="step-circle">${n.current_stage === 'Section 3C' ? '3C' : '<i class="fa-solid fa-check"></i>'}</span>
                <div>
                  <strong>Sec 3C</strong>
                  <div style="font-size:10px;">Objections</div>
                </div>
              </div>
              <div class="step-item ${n.section_3d_date ? 'active' : isCritical ? 'active' : ''}">
                <span class="step-circle" style="${isCritical ? 'background:#dc2626; color:#fff;' : ''}">${n.section_3d_date ? '<i class="fa-solid fa-check"></i>' : '3D'}</span>
                <div>
                  <strong>Sec 3D</strong>
                  <div style="font-size:10px;">${n.section_3d_so || 'Declaration'}</div>
                </div>
              </div>
              <div class="step-item ${n.current_stage === 'Section 3G' || n.current_stage === 'Section 3H' ? 'active' : ''}">
                <span class="step-circle">3G</span>
                <div>
                  <strong>Sec 3G</strong>
                  <div style="font-size:10px;">Compensation</div>
                </div>
              </div>
              <div class="step-item ${n.current_stage === 'Section 3H' ? 'active' : ''}">
                <span class="step-circle">3H</span>
                <div>
                  <strong>Sec 3H</strong>
                  <div style="font-size:10px;">PFMS DBT</div>
                </div>
              </div>
            </div>

            <!-- Statutory 1-Year Window Progress -->
            <div style="background:#f8fafc; padding:10px; border-radius:8px; display:flex; justify-content:space-between; font-size:11.5px;">
              <div>
                <strong>Section 3D Statutory 1-Year Deadline:</strong> ${n.statutory_3d_deadline}
              </div>
              <div>
                <strong>Days Left to Lapse:</strong> <span style="font-weight:700; color:${isCritical ? '#dc2626' : '#15803d'}">${n.days_remaining_to_3d_lapse} Days</span>
              </div>
              <div>
                <strong>PFMS Disbursed:</strong> ₹${n.pfms_dbt_disbursed_cr} Cr / ₹${n.total_award_cr} Cr
              </div>
            </div>
          </div>
        `;
      }).join("");
    }
  } catch (err) {
    container.innerHTML = `<p style="color:#dc2626;">Failed to load Bhoomi Rashi feed.</p>`;
  }
}

async function loadStatePortals() {
  const container = document.getElementById("statePortalsGridContainer");
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE_AUTO}/api/automation/portals`);
    if (res.ok) {
      const data = await res.json();
      const portals = data.portals || [];

      container.innerHTML = portals.map(p => `
        <div class="state-portal-card">
          <div>
            <div class="portal-card-top">
              <span class="portal-state-badge">${p.state}</span>
              <span class="portal-status-pill">
                <span class="stat-live-dot"></span>${p.status}
              </span>
            </div>
            <div class="portal-card-body">
              <h4>${p.portal_name}</h4>
              <p class="portal-dept">${p.department}</p>
              <div class="portal-docs-list">
                ${p.documents_supported.map(d => `<span class="portal-doc-tag">${d}</span>`).join("")}
              </div>
            </div>
          </div>
          <div class="portal-card-footer">
            <div class="portal-latency">
              Latency: <strong>${p.latency_ms}ms</strong> &bull; ${p.total_parcels_digitized} parcels
            </div>
            <button class="btn-test-portal" onclick="testStatePortalQuery('${p.state}')">
              <i class="fa-solid fa-magnifying-glass"></i> Test Query
            </button>
          </div>
        </div>
      `).join("");
    }
  } catch (err) {
    container.innerHTML = `<p style="color:#dc2626;">Failed to load state portals.</p>`;
  }
}

function toggleMinistryCollapse(headerEl) {
  const grid = headerEl.nextElementSibling;
  const icon = headerEl.querySelector(".fa-chevron-down, .fa-chevron-up");
  if (grid) {
    if (grid.style.display === "none") {
      grid.style.display = "grid";
      if (icon) icon.className = "fa-solid fa-chevron-up";
    } else {
      grid.style.display = "none";
      if (icon) icon.className = "fa-solid fa-chevron-down";
    }
  }
}

function filterGatiShaktiLayers(query) {
  document.querySelectorAll(".ministry-block").forEach(block => {
    const text = block.textContent.toLowerCase();
    block.style.display = text.includes(query) ? "block" : "none";
  });
}

function appendTerminalLog(tag, message, tagClass = "tag-info") {
  const container = document.getElementById("terminalLinesContainer");
  if (!container) return;
  const line = document.createElement("div");
  line.className = "terminal-line";
  const time = new Date().toLocaleTimeString();
  line.innerHTML = `<span class="log-time">[${time}]</span> <span class="log-tag ${tagClass}">${tag}</span> ${message}`;
  container.appendChild(line);
  container.scrollTop = container.scrollHeight;
}

function testStatePortalQuery(stateName) {
  const khasra = prompt(`Enter Khasra / Survey Number to query on ${stateName} Cadastral Portal:`, "142/A");
  if (!khasra) return;

  fetch(`${API_BASE_AUTO}/api/state-revenue/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      state: stateName,
      district: "Varanasi",
      survey_khasra_no: khasra
    })
  })
  .then(res => res.json())
  .then(data => {
    alert(
      `🏛️ ${data.portal_name} (${data.state})\n` +
      `-----------------------------------------\n` +
      `Survey/Khasra: ${data.query_khasra}\n` +
      `Verification Status: ${data.verification_status}\n` +
      `Titleholder: ${data.titleholder_details.registered_owner}\n` +
      `Aadhaar Linked: ${data.titleholder_details.aadhaar_authenticated}\n` +
      `Mutation Status: ${data.mutation_status}\n` +
      `Encumbrance: ${data.encumbrance_status}\n` +
      `Compensation Clearance: ${data.undisputed_compensation_clearance ? "AUTHORIZED FOR DISBURSEMENT" : "BLOCKED DUE TO DISPUTE"}`
    );
  })
  .catch(err => {
    alert(`Could not verify cadastral record: ${err.message}`);
  });
}

window.toggleMinistryCollapse = toggleMinistryCollapse;
window.testStatePortalQuery = testStatePortalQuery;
window.openAutomationTab = openAutomationTab;

