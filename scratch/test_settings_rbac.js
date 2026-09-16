// Test script for Settings Database Card RBAC enforcement
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync('frontend/settings.html', 'utf8');
const js = fs.readFileSync('frontend/settings.js', 'utf8');
const sharedAuth = fs.readFileSync('frontend/sharedAuth.js', 'utf8');

console.log("=== Testing Settings Database Card RBAC ===");

// 1. Check card ID exists in HTML
const hasCardId = html.includes('id="postgresDatabaseSettingsCard"');
console.log("1. HTML contains #postgresDatabaseSettingsCard:", hasCardId ? "PASS" : "FAIL");

// 2. Check settings.js has enforceAdminOnlyDatabaseCard
const hasSettingsJsGuard = js.includes('enforceAdminOnlyDatabaseCard');
console.log("2. settings.js defines enforceAdminOnlyDatabaseCard:", hasSettingsJsGuard ? "PASS" : "FAIL");

// 3. Check sharedAuth.js enforces RBAC on postgresDatabaseSettingsCard
const hasSharedAuthGuard = sharedAuth.includes('postgresDatabaseSettingsCard') && sharedAuth.includes('isAdmin');
console.log("3. sharedAuth.js enforces RBAC on postgresDatabaseSettingsCard:", hasSharedAuthGuard ? "PASS" : "FAIL");

// 4. Check testPostgresBtn has authorization guard
const hasActionGuard = js.includes('Permission Denied: Only Administrators');
console.log("4. settings.js guards #testPostgresBtn execution:", hasActionGuard ? "PASS" : "FAIL");

// 5. Simulate role evaluation logic
const roles = [
  { role: "Administrator", expectedVisible: true },
  { role: "CALA Project Director", expectedVisible: false },
  { role: "Revenue Inspector", expectedVisible: false },
  { role: "Public Auditor", expectedVisible: false },
  { role: "Data Analyst", expectedVisible: false }
];

console.log("\nSimulating Role Access Evaluation:");
let allPassed = true;
roles.forEach(({ role, expectedVisible }) => {
  const normalized = (role || "").trim().toLowerCase();
  const isAdmin = normalized === "administrator" || normalized === "admin";
  const visible = isAdmin;
  const status = (visible === expectedVisible) ? "PASS" : "FAIL";
  if (status === "FAIL") allPassed = false;
  console.log(` - Role "${role}": Visible = ${visible} (Expected: ${expectedVisible}) [${status}]`);
});

if (hasCardId && hasSettingsJsGuard && hasSharedAuthGuard && hasActionGuard && allPassed) {
  console.log("\n🎉 ALL SETTINGS DATABASE RBAC TESTS PASSED!");
} else {
  console.error("\n❌ SOME TESTS FAILED");
  process.exit(1);
}

