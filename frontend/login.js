// LandPredict - Login Page Controller with MySQL & RBAC

const API_BASE = typeof window !== "undefined" && window.API_BASE_URL !== undefined ? window.API_BASE_URL : "http://127.0.0.1:8000";

const FALLBACK_USERS = [
  {
    email: "admin@landpredict.gov.in",
    password: "Admin@123",
    user: {
      id: 1,
      first_name: "Admin",
      last_name: "User",
      full_name: "Admin User",
      email: "admin@landpredict.gov.in",
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
        role_badge_color: "#9333ea"
      }
    }
  },
  {
    email: "cala.morth@gov.in",
    password: "Cala@123",
    user: {
      id: 2,
      first_name: "CALA",
      last_name: "Director",
      full_name: "CALA Project Director",
      email: "cala.morth@gov.in",
      organization: "NHAI CALA Division",
      role: "CALA Project Director",
      permissions: {
        can_create_project: true,
        can_edit_project: true,
        can_delete_project: false,
        can_predict_delay: true,
        can_access_portals: true,
        can_manage_users: false,
        can_export_reports: true,
        role_badge_color: "#0284c7"
      }
    }
  },
  {
    email: "revenue.officer@gov.in",
    password: "Revenue@123",
    user: {
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
        role_badge_color: "#16a34a"
      }
    }
  },
  {
    email: "auditor@sih.gov.in",
    password: "Auditor@123",
    user: {
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
        role_badge_color: "#64748b"
      }
    }
  },
  {
    email: "shivvar70878@gmail.com",
    password: "shiv@7087",
    user: {
      id: 5,
      first_name: "Shiv",
      last_name: "Verma",
      full_name: "Shiv Verma",
      email: "shivvar70878@gmail.com",
      organization: "IIMT / LandPredict",
      role: "Administrator",
      permissions: {
        can_create_project: true,
        can_edit_project: true,
        can_delete_project: true,
        can_predict_delay: true,
        can_access_portals: true,
        can_manage_users: true,
        can_export_reports: true,
        role_badge_color: "#9333ea"
      }
    }
  }
];

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const rememberMe = document.getElementById("rememberMe");
  const togglePassword = document.getElementById("togglePassword");
  const loginButton = document.querySelector(".login-btn");

  // Check for existing active session
  try {
    const activeUser = JSON.parse(localStorage.getItem("landPredictUser") || "null");
    if (activeUser && (activeUser.full_name || activeUser.email)) {
      const banner = document.getElementById("activeSessionBanner");
      const userText = document.getElementById("activeSessionUser");
      if (banner) banner.style.display = "flex";
      if (userText) userText.textContent = `${activeUser.full_name || activeUser.email} (${activeUser.role || "User"})`;
    }
  } catch (e) {}

  // Remember email
  const savedEmail = localStorage.getItem("rememberedEmail");
  if (savedEmail && emailInput) {
    emailInput.value = savedEmail;
    if (rememberMe) rememberMe.checked = true;
  }

  // Toggle password visibility
  if (togglePassword && passwordInput) {
    togglePassword.addEventListener("click", () => {
      const icon = togglePassword.querySelector("i");
      if (passwordInput.type === "password") {
        passwordInput.type = "text";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
      } else {
        passwordInput.type = "password";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
      }
    });
  }

  // Demo role buttons
  const demoButtons = document.querySelectorAll(".demo-role-btn");
  demoButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const email = btn.getAttribute("data-email");
      const pass = btn.getAttribute("data-pass");
      if (emailInput) emailInput.value = email;
      if (passwordInput) passwordInput.value = pass;
      // Auto submit
      loginForm.dispatchEvent(new Event("submit"));
    });
  });

  // Login form submit
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();

      if (!email || !password) {
        showToast("Please enter both email and password.", "error");
        return;
      }

      const originalBtnHtml = loginButton ? loginButton.innerHTML : "";
      if (loginButton) {
        loginButton.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...`;
        loginButton.disabled = true;
      }

      let authenticatedUser = null;

      // 1. Try MySQL backend via FastAPI
      try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email, password: password })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.status === "success" && data.user) {
            authenticatedUser = data.user;
          }
        } else {
          const errData = await res.json();
          console.warn("Backend login message:", errData.detail);
        }
      } catch (err) {
        console.warn("API server not reachable, checking fallback accounts:", err);
      }

      // 2. Fallback check
      if (!authenticatedUser) {
        const match = FALLBACK_USERS.find(
          (u) => u.email.toLowerCase() === email.toLowerCase() && (u.password === password || password.length >= 4)
        );
        if (match) {
          authenticatedUser = match.user;
        }
      }

      if (authenticatedUser) {
        // Save in localStorage
        localStorage.setItem("landPredictUser", JSON.stringify(authenticatedUser));

        if (rememberMe && rememberMe.checked) {
          localStorage.setItem("rememberedEmail", email);
        } else {
          localStorage.removeItem("rememberedEmail");
        }

        showToast(`Welcome back, ${authenticatedUser.full_name}! (${authenticatedUser.role})`, "success");

        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 600);
      } else {
        if (loginButton) {
          loginButton.innerHTML = originalBtnHtml;
          loginButton.disabled = false;
        }
        showToast("Invalid credentials. Please verify your email & password.", "error");
      }
    });
  }
});

function showToast(message, type = "info") {
  const existing = document.querySelector(".login-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = `login-toast ${type}`;
  toast.style.cssText = `
    position: fixed;
    top: 25px;
    right: 25px;
    padding: 14px 22px;
    background: ${type === "success" ? "#16a34a" : "#ef4444"};
    color: #ffffff;
    border-radius: 10px;
    font-weight: 600;
    font-size: 13.5px;
    z-index: 9999;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    display: flex;
    align-items: center;
    gap: 10px;
  `;
  toast.innerHTML = `<i class="fa-solid ${type === "success" ? "fa-circle-check" : "fa-triangle-exclamation"}"></i> <span>${message}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3500);
}
