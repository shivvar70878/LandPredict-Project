const fs = require('fs');
const path = require('path');

const rootDir = 'e:/Project';
const frontendDir = path.join(rootDir, 'frontend');

const pages = [
  path.join(rootDir, 'index.html'),
  path.join(frontendDir, 'dashboard.html'),
  path.join(frontendDir, 'projects.html'),
  path.join(frontendDir, 'gisMap.html'),
  path.join(frontendDir, 'createProject.html'),
  path.join(frontendDir, 'Analytics.html'),
  path.join(frontendDir, 'aiPrediction.html'),
  path.join(frontendDir, 'reports.html'),
  path.join(frontendDir, 'settings.html'),
  path.join(frontendDir, 'details.html'),
  path.join(frontendDir, 'login.html'),
  path.join(frontendDir, 'signup.html')
];

console.log('--- Checking all <a> links across all HTML files ---');
let brokenLinks = [];

pages.forEach(p => {
  const html = fs.readFileSync(p, 'utf8');
  const pageDir = path.dirname(p);
  const pageName = path.basename(p);

  const linkRegex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1].trim();
    const text = match[2].replace(/<[^>]*>/g, '').trim();

    if (href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:')) {
      continue;
    }

    // Resolve relative link
    const cleanHref = href.split('?')[0].split('#')[0];
    if (!cleanHref) continue;

    const resolved = path.resolve(pageDir, cleanHref);
    if (!fs.existsSync(resolved)) {
      brokenLinks.push({ page: pageName, href, text, resolved });
    }
  }
});

if (brokenLinks.length === 0) {
  console.log('✓ All <a> links resolve to valid, existing files!');
} else {
  console.log(`✗ Found ${brokenLinks.length} broken links:`);
  brokenLinks.forEach(b => {
    console.log(`   * [${b.page}] -> href="${b.href}" ("${b.text}") [Resolved: ${b.resolved}]`);
  });
}

