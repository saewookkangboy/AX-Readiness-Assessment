import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const required = ["index.html", "examples.html", "privacy.html", "robots.txt", "sitemap.xml", "_headers", "content-protection.js", "2026-07-09-AX-Readiness-ROI-og-image.png"];
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

for (const file of required) {
  const full = path.join(root, file);
  check(fs.existsSync(full), `missing file: ${file}`);
  if (fs.existsSync(full)) check(fs.statSync(full).size > 0, `empty file: ${file}`);
}

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const examples = fs.readFileSync(path.join(root, "examples.html"), "utf8");
const privacy = fs.readFileSync(path.join(root, "privacy.html"), "utf8");
const protection = fs.readFileSync(path.join(root, "content-protection.js"), "utf8");
const headers = fs.readFileSync(path.join(root, "_headers"), "utf8");
const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1] || "";

try { new Function(script); } catch (error) { failures.push(`JavaScript syntax: ${error.message}`); }
try { new Function(protection); } catch (error) { failures.push(`Content protection JavaScript syntax: ${error.message}`); }
const examplesScript = examples.match(/<script>([\s\S]*?)<\/script>/)?.[1] || "";
try { new Function(examplesScript); } catch (error) { failures.push(`Examples JavaScript syntax: ${error.message}`); }

const ids = [...html.matchAll(/id="([^"]+)"/g)].map(match => match[1]);
const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
check(duplicateIds.length === 0, `duplicate ids: ${duplicateIds.join(", ")}`);

const functions = new Set([...script.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(/g)].map(match => match[1]));
const clickCalls = [...new Set([...html.matchAll(/onclick="(?:return )?([A-Za-z_$][\w$]*)\(/g)].map(match => match[1]))];
const missingFunctions = clickCalls.filter(name => !functions.has(name));
check(missingFunctions.length === 0, `missing onclick functions: ${missingFunctions.join(", ")}`);

const expectations = [
  [html.includes('content="index, follow, max-image-preview:large"'), "robots meta is not public"],
  [html.includes('href="https://ax.allrounder.im/"'), "canonical domain mismatch"],
  [html.includes('content="https://ax.allrounder.im/2026-07-09-AX-Readiness-ROI-og-image.png"'), "absolute OG image missing"],
  [html.includes('href="./privacy.html"'), "privacy link missing"],
  [html.includes('id="leadOverseasConsent"'), "overseas-transfer consent missing"],
  [html.includes('role="progressbar"'), "progressbar semantics missing"],
  [html.includes('role="dialog"'), "dialog semantics missing"],
  [html.includes('role="alert"'), "error announcement missing"],
  [html.includes('ROI 계산에 사용할 반복 업무를 한 개 이상 입력해주세요.'), "empty ROI guard missing"],
  [html.includes('초기 투자비와 월 운영비는 0원 이상으로 입력해주세요.'), "negative ROI guard missing"],
  [html.includes('clearProgress(); return null;'), "expired localStorage deletion missing"],
  [html.includes('src="./content-protection.js"') && examples.includes('src="./content-protection.js"'), "shared content protection script missing"],
  [protection.includes('contextmenu') && protection.includes('selectstart') && protection.includes('dragstart'), "content protection handlers missing"],
  [protection.includes('content-protected') && protection.includes('screenshot-guard'), "screenshot protection missing"],
  [html.includes('body.content-protected') && examples.includes('body.content-protected'), "text-selection protection styles missing"],
  [html.includes('href="./examples.html"'), "examples link missing from index"],
  [examples.includes('href="./index.html"'), "diagnosis back link missing from examples"],
  [examples.includes('data-domain="marketing"') && examples.includes('data-domain="distribution"'), "domain tabs missing"],
  [examples.includes('href="./privacy.html"'), "privacy link missing from examples"],
  [!html.includes('proofTimer') && !html.includes('setInterval('), "testimonial autoplay remains"],
  [!html.includes('—') && !html.includes('–') && !privacy.includes('—') && !privacy.includes('–'), "visible AI-style dash punctuation remains"],
  [html.includes('<meta name="theme-color" content="#F5F7FA">'), "browser theme color does not match the light interface"],
  [html.includes('.hero{background:var(--canvas);'), "landing hero is not using the restrained single-theme surface"],
  [privacy.includes('Google LLC'), "Google processor disclosure missing"],
  [privacy.includes('최대 14일'), "localStorage retention disclosure missing"],
  [headers.includes('Strict-Transport-Security'), "HSTS header missing"],
  [headers.includes('Content-Security-Policy'), "CSP header missing"]
];
for (const [condition, message] of expectations) check(condition, message);

if (failures.length) {
  console.error(`FAIL (${failures.length})`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`PASS: ${required.length} required files, ${ids.length} unique IDs, ${clickCalls.length} click handlers, privacy/SEO/security guards verified.`);
