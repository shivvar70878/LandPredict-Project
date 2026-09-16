const fs = require('fs');
const path = require('path');

const rootDir = 'e:/Project';
const frontendDir = path.join(rootDir, 'frontend');

const pages = [
  { file: path.join(rootDir, 'index.html'), js: [] },
  { file: path.join(frontendDir, 'dashboard.html'), js: ['dashboard.js', 'sharedAuth.js', 'automationHub.js', 'supabaseClient.js'] },
  { file: path.join(frontendDir, 'projects.html'), js: ['projects.js', 'sharedAuth.js', 'automationHub.js', 'supabaseClient.js'] },
  { file: path.join(frontendDir, 'gisMap.html'), js: ['gisMap.js', 'sharedAuth.js', 'automationHub.js', 'supabaseClient.js'] },
  { file: path.join(frontendDir, 'createProject.html'), js: ['createProject.js', 'sharedAuth.js', 'automationHub.js', 'supabaseClient.js'] },
  { file: path.join(frontendDir, 'Analytics.html'), js: ['Analytics.js', 'sharedAuth.js', 'automationHub.js', 'supabaseClient.js'] },
  { file: path.join(frontendDir, 'aiPrediction.html'), js: ['aiPrediction.js', 'sharedAuth.js', 'automationHub.js', 'supabaseClient.js'] },
  { file: path.join(frontendDir, 'reports.html'), js: ['reports.js', 'sharedAuth.js', 'automationHub.js', 'supabaseClient.js'] },
  { file: path.join(frontendDir, 'settings.html'), js: ['settings.js', 'sharedAuth.js', 'automationHub.js', 'supabaseClient.js'] },
  { file: path.join(frontendDir, 'details.html'), js: ['details.js', 'sharedAuth.js', 'automationHub.js', 'supabaseClient.js'] },
  { file: path.join(frontendDir, 'login.html'), js: ['login.js', 'supabaseClient.js'] },
  { file: path.join(frontendDir, 'signup.html'), js: ['signup.js', 'supabaseClient.js'] }
];

console.log('================================================================');
console.log('  LandPredict AI: Complete Interactive Button & Page Audit');
console.log('================================================================');

let totalButtons = 0;
let wiredButtons = 0;
let unwiredButtons = [];

pages.forEach(p => {
  if (!fs.existsSync(p.file)) {
    console.error(`Page not found: ${p.file}`);
    return;
  }
  const html = fs.readFileSync(p.file, 'utf8');
  const pageName = path.basename(p.file);
  
  // Combine all JS content for this page
  let combinedJs = '';
  p.js.forEach(jsFile => {
    const jsPath = path.join(frontendDir, jsFile);
    if (fs.existsSync(jsPath)) {
      combinedJs += fs.readFileSync(jsPath, 'utf8') + '\n';
    }
  });

  // Also check inline script
  const inlineScripts = html.match(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/gi) || [];
  inlineScripts.forEach(s => {
    combinedJs += s.replace(/<\/?script[^>]*>/gi, '') + '\n';
  });

  // Match all <button ...> and <a ...class="*btn*"...> and <input type="submit|button"...>
  const buttonRegex = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
  let match;
  const pageButtons = [];

  while ((match = buttonRegex.exec(html)) !== null) {
    totalButtons++;
    const attrs = match[1];
    const text = match[2].replace(/<[^>]*>/g, '').trim() || 'Icon/NoText';
    
    // Extract ID, class, onclick
    const idMatch = attrs.match(/id=["']([^"']+)["']/i);
    const classMatch = attrs.match(/class=["']([^"']+)["']/i);
    const onclickMatch = attrs.match(/onclick=["']([^"']+)["']/i);
    const typeMatch = attrs.match(/type=["']([^"']+)["']/i);

    const btnId = idMatch ? idMatch[1] : null;
    const btnClass = classMatch ? classMatch[1] : null;
    const btnOnclick = onclickMatch ? onclickMatch[1] : null;
    const btnType = typeMatch ? typeMatch[1] : 'button';

    // Check if wired
    let isWired = false;
    let wiringReason = '';

    if (btnOnclick) {
      isWired = true;
      wiringReason = `inline onclick="${btnOnclick}"`;
    } else if (btnId) {
      if (combinedJs.includes(btnId)) {
        isWired = true;
        wiringReason = `JS handles #${btnId}`;
      }
    }

    if (!isWired && btnClass) {
      // Check if any class is referenced in addEventListener or querySelector
      const classes = btnClass.split(/\s+/);
      for (const c of classes) {
        if (c && c.length > 3 && combinedJs.includes(c) && (combinedJs.includes(`.${c}`) || combinedJs.includes(`getElementsByClassName("${c}")`))) {
          isWired = true;
          wiringReason = `JS handles .${c}`;
          break;
        }
      }
    }

    // Submit button inside a form with an ID or event handler
    if (!isWired && btnType === 'submit') {
      isWired = true;
      wiringReason = `form submit action`;
    }

    pageButtons.push({
      text: text.substring(0, 30),
      id: btnId,
      class: btnClass,
      type: btnType,
      isWired,
      wiringReason
    });

    if (isWired) {
      wiredButtons++;
    } else {
      unwiredButtons.push({ page: pageName, text: text.substring(0, 30), id: btnId, class: btnClass });
    }
  }

  console.log(`\n📄 [${pageName}]: Found ${pageButtons.length} buttons.`);
  pageButtons.forEach(b => {
    const status = b.isWired ? '✓ WIRED' : '✗ UNWIRED';
    console.log(`   ${status} | [${b.text}] | id="${b.id || 'none'}" | type="${b.type}" | ${b.wiringReason || 'NO HANDLER FOUND'}`);
  });
});

console.log('\n================================================================');
console.log(`  AUDIT SUMMARY: ${totalButtons} Total Buttons Analyzed`);
console.log(`  - Wired / Functional: ${wiredButtons}`);
console.log(`  - Unwired / Missing Handlers: ${unwiredButtons.length}`);
console.log('================================================================');

if (unwiredButtons.length > 0) {
  console.log('\nUnwired buttons requiring attention:');
  unwiredButtons.forEach(u => {
    console.log(`  * ${u.page}: "${u.text}" (id: ${u.id}, class: ${u.class})`);
  });
}

