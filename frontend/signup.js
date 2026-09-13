// ==========================================
// LANDPREDICT AI - SIGNUP CONTROLLER
// Direct MySQL backend integration & role provisioning
// ==========================================

window.API_BASE_URL = typeof window !== "undefined" && window.API_BASE_URL && !window.API_BASE_URL.includes("127.0.0.1")
  ? window.API_BASE_URL
  : (localStorage.getItem("landPredictBackendUrl") || (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? "http://127.0.0.1:8000" : ""));

const signupForm = document.getElementById("signupForm");
const firstName = document.getElementById("firstName");
const lastName = document.getElementById("lastName");
const email = document.getElementById("email");
const organization = document.getElementById("organization");
const role = document.getElementById("role");
const password = document.getElementById("password");
const terms = document.getElementById("terms");
const togglePassword = document.getElementById("togglePassword");
const submitBtn = signupForm ? signupForm.querySelector('button[type="submit"]') : null;

// ==========================================
// PASSWORD SHOW / HIDE
// ==========================================
if (togglePassword && password) {
  togglePassword.addEventListener("click", function () {
    if (password.type === "password") {
      password.type = "text";
      togglePassword.classList.remove("fa-eye");
      togglePassword.classList.add("fa-eye-slash");
    } else {
      password.type = "password";
      togglePassword.classList.remove("fa-eye-slash");
      togglePassword.classList.add("fa-eye");
    }
  });
}

function isValidEmail(emailAddress) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(emailAddress);
}

function isValidPassword(passwordValue) {
  return passwordValue && passwordValue.length >= 6;
}

// ==========================================
// SIGNUP FORM SUBMISSION (MySQL Integration)
// ==========================================
if (signupForm) {
  signupForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const firstNameValue = firstName.value.trim();
    const lastNameValue = lastName.value.trim();
    const emailValue = email.value.trim().toLowerCase();
    const organizationValue = organization.value.trim();
    const roleValue = role.value;
    const passwordValue = password.value;

    if (firstNameValue.length < 2) {
      alert("Please enter a valid first name.");
      firstName.focus();
      return;
    }

    if (lastNameValue.length < 2) {
      alert("Please enter a valid last name.");
      lastName.focus();
      return;
    }

    if (!isValidEmail(emailValue)) {
      alert("Please enter a valid email address.");
      email.focus();
      return;
    }

    if (organizationValue.length < 2) {
      alert("Please enter your organization or department.");
      organization.focus();
      return;
    }

    if (!roleValue) {
      alert("Please select your assigned role.");
      role.focus();
      return;
    }

    if (!isValidPassword(passwordValue)) {
      alert("Password must contain at least 6 characters.");
      password.focus();
      return;
    }

    if (!terms.checked) {
      alert("Please accept the Terms of Service and Privacy Policy.");
      return;
    }

    const payload = {
      first_name: firstNameValue,
      last_name: lastNameValue,
      email: emailValue,
      organization: organizationValue,
      role: roleValue,
      password: passwordValue
    };

    const originalBtnHtml = submitBtn ? submitBtn.innerHTML : "";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Creating Account in MySQL...`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Account creation failed.");
      }

      // Store created user & permissions
      localStorage.setItem("landPredictUser", JSON.stringify(data.user));
      localStorage.setItem("landInsightLoggedIn", "true");

      alert(`✅ Account created successfully in LandPredict MySQL Database!\n\nWelcome, ${data.user.full_name} (${data.user.role}).\nRedirecting to Dashboard...`);
      window.location.href = "dashboard.html";

    } catch (err) {
      console.warn("Backend signup error, checking fallback:", err.message);

      if (err.message.includes("already registered")) {
        alert("⚠️ An account with this email already exists. Please Sign In.");
        window.location.href = "login.html";
        return;
      }

      // Offline / LocalStorage Fallback
      const userData = {
        id: Date.now(),
        first_name: firstNameValue,
        last_name: lastNameValue,
        full_name: `${firstNameValue} ${lastNameValue}`,
        email: emailValue,
        organization: organizationValue,
        role: roleValue,
        permissions: {
          can_create_project: roleValue === "Administrator" || roleValue === "CALA Project Director",
          can_edit_project: roleValue !== "Public Auditor",
          can_delete_project: roleValue === "Administrator",
          can_predict_delay: true,
          can_access_portals: true,
          can_manage_users: roleValue === "Administrator",
          can_export_reports: true,
          role_badge_color: roleValue === "Administrator" ? "#9333ea" : roleValue === "CALA Project Director" ? "#0284c7" : roleValue === "Revenue Inspector" ? "#16a34a" : "#64748b"
        }
      };

      localStorage.setItem("landPredictUser", JSON.stringify(userData));
      localStorage.setItem("landInsightLoggedIn", "true");

      alert(`✅ Account registered successfully!\n\nWelcome, ${userData.full_name} (${userData.role}).`);
      window.location.href = "dashboard.html";

    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHtml;
      }
    }
  });
}
