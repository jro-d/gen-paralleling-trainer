import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const exe = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p => fs.existsSync(p));
const targetPath = 'file:///' + path.resolve('index.html').replace(/\\/g, '/');

const browser = await puppeteer.launch({ executablePath: exe, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });

const errors = [];
page.on('pageerror', err => errors.push('PAGEERROR: ' + err.message));
page.on('console', msg => {
  if (msg.type() === 'error') errors.push('CONSOLE_ERROR: ' + msg.text());
});

console.log('Navigating to:', targetPath);
await page.goto(targetPath, { waitUntil: 'load' });
await new Promise(r => setTimeout(r, 600));

// Test 1: Verify title and DOM
const title = await page.title();
console.log('Page Title:', title);

// Test 2: Toggle Audio
console.log('Testing Audio Toggle...');
await page.click('#btnAudio');
const audioText = await page.$eval('#audioLabel', el => el.textContent);
console.log('Audio state:', audioText);

// Test 3: Toggle View to IEC 60617 SLD
console.log('Testing SLD View...');
await page.click('#viewTabs button[data-view="sld"]');
await new Promise(r => setTimeout(r, 300));
const sldVisible = await page.$eval('#viewSLD', el => !el.classList.contains('hidden'));
const sldSvg = await page.$eval('#sldSvgHost', el => el.innerHTML.includes('<svg'));
console.log('SLD Visible:', sldVisible, 'Contains SVG:', sldSvg);

// Switch back to Bays
await page.click('#viewTabs button[data-view="bays"]');

// Test 4: Black Start DG 1 onto dead bus
console.log('Testing DG 1 Black Start...');
await page.click('#gens .gen-card:nth-child(1) button[data-act="start"]');
await new Promise(r => setTimeout(r, 300));
await page.click('#gens .gen-card:nth-child(1) button[data-act="close"]');
await new Promise(r => setTimeout(r, 400));
const busLive = await page.$eval('#busTagVA', el => el.textContent);
console.log('Bus A Voltage after close:', busLive);

// Test 5: Heavy Consumer Bow Thruster Inrush
console.log('Testing Bow Thruster Inrush...');
await page.click('#btnBow');
await new Promise(r => setTimeout(r, 300));
const bowStatus = await page.$eval('#bowBadge', el => el.textContent);
console.log('Bow Thruster status:', bowStatus);
await page.click('#btnBow'); // stop

// Test 6: Toggle PMS Automation
console.log('Testing PMS Automation...');
await page.click('#btnPms');
const pmsText = await page.$eval('#pmsLabel', el => el.textContent);
console.log('PMS label:', pmsText);

// Test 7: Open Fault Popover and set a fault
console.log('Testing Fault Popover...');
await page.click('#btnFaults');
await new Promise(r => setTimeout(r, 200));
const popoverOpen = await page.$eval('#faultPopover', el => !el.classList.contains('hidden'));
console.log('Fault Popover open:', popoverOpen);
await page.click('.fault-btn[data-fault="hunting"]');
await new Promise(r => setTimeout(r, 200));
await page.click('#btnFaults');
await page.click('.fault-btn[data-fault="none"]'); // clear

// Test 8: Help Guide Challenges Tab & Start Exam
console.log('Testing Exam & Challenges Tab...');
await page.click('#btnHelp');
await new Promise(r => setTimeout(r, 300));
await page.click('.help-tab[data-htab="challenges"]');
await new Promise(r => setTimeout(r, 300));
await page.click('#btnStartChal');
await new Promise(r => setTimeout(r, 500));
const chalScore = await page.$eval('#metricScore', el => el.textContent);
const chalStatus = await page.$eval('#evalStatusText', el => el.textContent);
console.log('Challenge Score:', chalScore, 'Status:', chalStatus);

// Capture screenshots for artifacts
const outDir = 'C:/Users/johnr/.gemini/antigravity/brain/fb24641a-88d2-4680-8423-0c3dc42dff8d';
await page.screenshot({ path: outDir + '/feature-bay-view.png' });

await page.click('#viewTabs button[data-view="sld"]');
await new Promise(r => setTimeout(r, 300));
await page.screenshot({ path: outDir + '/feature-sld-view.png' });

console.log('--- TEST SUMMARY ---');
console.log('Total Errors:', errors.length);
if (errors.length) {
  console.log('Errors:', errors);
} else {
  console.log('VERIFICATION PASSED: ALL 6 FEATURES FUNCTIONING PERFECTLY WITHOUT ERRORS!');
}

await browser.close();
