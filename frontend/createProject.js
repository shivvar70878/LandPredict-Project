document.addEventListener("DOMContentLoaded", () => {
  /* =========================================
       DOM ELEMENTS
    ========================================= */

  const createProjectForm = document.getElementById("createProjectForm");

  const menuBtn = document.getElementById("menuBtn");

  const sidebar = document.getElementById("sidebar");

  const logoutBtn = document.getElementById("logoutBtn");

  const saveDraftBtn = document.getElementById("saveDraftBtn");

  const resetProjectBtn = document.getElementById("resetProjectBtn");

  const successModal = document.getElementById("successModal");

  const successMessage = document.getElementById("successMessage");

  const viewProjectsBtn = document.getElementById("viewProjectsBtn");

  const createAnotherBtn = document.getElementById("createAnotherBtn");

  const projectIdInput = document.getElementById("projectId");

  /* =========================================
       GENERATE PROJECT ID
    ========================================= */

  function generateProjectId() {
    const savedProjects =
      JSON.parse(localStorage.getItem("landPredictProjects")) || [];

    const projectNumber = savedProjects.length + 9;

    return `LP-${String(projectNumber).padStart(3, "0")}`;
  }

  /* =========================================
       AUTO PROJECT ID
    ========================================= */

  if (projectIdInput && projectIdInput.value === "") {
    projectIdInput.value = generateProjectId();
  }

  /* =========================================
       MOBILE SIDEBAR
    ========================================= */

  if (menuBtn && sidebar) {
    menuBtn.addEventListener("click", () => {
      sidebar.classList.toggle("active");
    });
  }

  /* =========================================
       LOGOUT
    ========================================= */

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      if (window.logoutUser) {
        window.logoutUser();
      } else {
        localStorage.removeItem("landPredictUser");
        window.location.href = "login.html";
      }
    });
  }

  /* =========================================
       GET FORM DATA
    ========================================= */

  function getFormData() {
    const project = {
      id: document.getElementById("projectId").value.trim(),

      name: document.getElementById("projectName").value.trim(),

      state: document.getElementById("state").value,

      district: document.getElementById("district").value.trim(),

      type: document.getElementById("projectType").value,

      status: document.getElementById("projectStatus").value,

      landArea: Number(document.getElementById("landArea").value),

      families: Number(document.getElementById("families").value),

      acquisitionStage: document.getElementById("acquisitionStage").value,

      compensation: document.getElementById("compensation").value,

      delayDays: Number(document.getElementById("delayDays").value) || 0,

      legalDisputes:
        Number(document.getElementById("legalDisputes").value) || 0,

      pendingApprovals:
        Number(document.getElementById("pendingApprovals").value) || 0,

      publicObjections:
        Number(document.getElementById("publicObjections").value) || 0,

      description: document.getElementById("description").value.trim(),

      createdAt: new Date().toISOString(),
    };

    return project;
  }

  /* =========================================
       CHECK DUPLICATE PROJECT ID
    ========================================= */

  function projectIdExists(projectId) {
    const savedProjects =
      JSON.parse(localStorage.getItem("landPredictProjects")) || [];

    return savedProjects.some(
      (project) => project.id.toLowerCase() === projectId.toLowerCase(),
    );
  }

  /* =========================================
       FORM SUBMIT
    ========================================= */

  if (createProjectForm) {
    createProjectForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      // Check Role Permission
      const user = window.getCurrentUser ? window.getCurrentUser() : null;
      if (user && user.role === "Public Auditor") {
        if (window.showToast) window.showToast("Permission Denied: Public Auditor has Read-Only access.", "error");
        else alert("Permission Denied: Public Auditor has Read-Only access.");
        return;
      }

      /* Browser Validation */
      if (!createProjectForm.checkValidity()) {
        createProjectForm.reportValidity();
        return;
      }

      const project = getFormData();

      // Try PostgreSQL & Supabase Cloud Backend API first
      try {
        const payload = {
          project_id: project.id,
          project_name: project.name,
          state: project.state,
          district: project.district,
          district_code: project.district || "DIS-01",
          project_type: project.type,
          land_type: "Private Agricultural",
          land_area_acres: project.landArea || 50,
          affected_families: project.families || 10,
          num_departments_involved: 3,
          notification_age_days: 120,
          acquisition_stage: project.acquisitionStage || "Section 3D",
          compensation_status: project.compensation || "In Progress",
          compensation_disbursed_pct: project.compensation === "Completed" ? 100 : project.compensation === "Pending" ? 10 : 50,
          possession_status: project.status === "completed" ? "Full Possession" : "Partial Possession",
          legal_disputes_count: project.legalDisputes || 0,
          court_case_pending: (project.legalDisputes > 0) ? 1 : 0,
          rehabilitation_required: (project.families > 20) ? 1 : 0,
          rehabilitation_progress_pct: 50.0,
          stakeholder_responsiveness_score: 7.5,
          historical_dept_performance_score: 65.0,
          public_objections_count: project.publicObjections || 0,
          pending_approvals_count: project.pendingApprovals || 0,
          budget_utilization_pct: 60.0,
          monsoon_season_overlap: 0,
          description: project.description || ""
        };

        const apiBase = typeof window !== "undefined" && window.API_BASE_URL !== undefined ? window.API_BASE_URL : "http://127.0.0.1:8000";
        const res = await fetch(`${apiBase}/api/projects`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const resData = await res.json();
          console.log("Saved to PostgreSQL & Supabase Database:", resData);
          if (window.showToast) window.showToast("Project saved to PostgreSQL database!", "success");
        }
      } catch (apiErr) {
        console.warn("PostgreSQL API save offline, saved to local cache:", apiErr);
      }

      /* Save to Local Storage Cache */
      const savedProjects = JSON.parse(localStorage.getItem("landPredictProjects")) || [];
      savedProjects.unshift(project);
      localStorage.setItem("landPredictProjects", JSON.stringify(savedProjects));
      localStorage.removeItem("landPredictDraft");

      /* Show Success */
      showSuccessModal(project);
    });
  }

  /* =========================================
       SUCCESS MODAL
    ========================================= */

  function showSuccessModal(project) {
    if (!successModal) return;

    if (successMessage) {
      successMessage.textContent = `${project.name} (${project.id}) has been successfully added to the system.`;
    }

    successModal.classList.add("active");
  }

  /* =========================================
       VIEW PROJECTS
    ========================================= */

  if (viewProjectsBtn) {
    viewProjectsBtn.addEventListener("click", () => {
      window.location.href = "projects.html";
    });
  }

  /* =========================================
       CREATE ANOTHER PROJECT
    ========================================= */

  if (createAnotherBtn) {
    createAnotherBtn.addEventListener("click", () => {
      successModal.classList.remove("active");

      createProjectForm.reset();

      projectIdInput.value = generateProjectId();

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  }

  /* =========================================
       SAVE DRAFT
    ========================================= */

  if (saveDraftBtn) {
    saveDraftBtn.addEventListener("click", () => {
      const projectDraft = getFormData();

      localStorage.setItem("landPredictDraft", JSON.stringify(projectDraft));

      alert("Project draft saved successfully!");
    });
  }

  /* =========================================
       LOAD DRAFT
    ========================================= */

  function loadDraft() {
    const savedDraft = localStorage.getItem("landPredictDraft");

    if (!savedDraft) return;

    const draft = JSON.parse(savedDraft);

    const shouldLoadDraft = confirm(
      "A saved project draft was found. Would you like to continue editing it?",
    );

    if (!shouldLoadDraft) {
      localStorage.removeItem("landPredictDraft");

      return;
    }

    document.getElementById("projectId").value = draft.id || "";

    document.getElementById("projectName").value = draft.name || "";

    document.getElementById("state").value = draft.state || "";

    document.getElementById("district").value = draft.district || "";

    document.getElementById("projectType").value = draft.type || "";

    document.getElementById("projectStatus").value = draft.status || "active";

    document.getElementById("landArea").value = draft.landArea || "";

    document.getElementById("families").value = draft.families || "";

    document.getElementById("acquisitionStage").value =
      draft.acquisitionStage || "Planning";

    document.getElementById("compensation").value =
      draft.compensation || "In Progress";

    document.getElementById("delayDays").value = draft.delayDays || 0;

    document.getElementById("legalDisputes").value = draft.legalDisputes || 0;

    document.getElementById("pendingApprovals").value =
      draft.pendingApprovals || 0;

    document.getElementById("publicObjections").value =
      draft.publicObjections || 0;

    document.getElementById("description").value = draft.description || "";
  }

  /* =========================================
       RESET FORM
    ========================================= */

  if (resetProjectBtn) {
    resetProjectBtn.addEventListener("click", () => {
      setTimeout(() => {
        if (projectIdInput) {
          projectIdInput.value = generateProjectId();
        }
      }, 0);
    });
  }

  /* =========================================
       CLOSE MODAL ON OUTSIDE CLICK
    ========================================= */

  if (successModal) {
    successModal.addEventListener("click", (event) => {
      if (event.target === successModal) {
        successModal.classList.remove("active");
      }
    });
  }

  /* =========================================
       INITIALIZE DRAFT
    ========================================= */

  loadDraft();
});
