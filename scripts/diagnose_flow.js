const { chromium } = require('playwright');
const path = require('path');

async function diagnoseWorkspace() {
  const botProfileDir = path.join(__dirname, '..', '.chrome-flow-bot-profile');
  
  console.log('🌐 Connecting to bot Chrome profile...');
  
  const context = await chromium.launchPersistentContext(botProfileDir, {
    headless: false,
    channel: 'chrome',
    args: ['--start-maximized', '--disable-blink-features=AutomationControlled', '--no-first-run', '--no-default-browser-check'],
    viewport: null,
    ignoreDefaultArgs: ['--enable-automation']
  });

  const pages = context.pages();
  let page = pages[0] || (await context.newPage());

  console.log('🔗 Navigating to Google Flow...');
  await page.goto('https://labs.google/fx/tools/flow', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(6000);

  console.log(`📍 URL: ${page.url()}`);

  // Click "Try Google Flow" if visible
  const tryBtn = await page.$('button:has-text("Try Google Flow")');
  if (tryBtn && await tryBtn.isVisible()) {
    console.log('📌 Clicking "Try Google Flow"...');
    await tryBtn.click({ force: true });
    await page.waitForTimeout(6000);
    console.log(`📍 After click URL: ${page.url()}`);
  }

  // Click "Get started" if visible
  const getStartedBtn = await page.$('button:has-text("Get started")');
  if (getStartedBtn && await getStartedBtn.isVisible()) {
    console.log('📌 Clicking "Get started"...');
    await getStartedBtn.click({ force: true });
    await page.waitForTimeout(6000);
    console.log(`📍 After Get started URL: ${page.url()}`);
  }

  // Take screenshot
  await page.screenshot({ path: path.join(__dirname, '..', 'flow_after_click.png') });
  console.log('📸 Screenshot saved: flow_after_click.png');

  // Dump ALL elements on current page
  const elements = await page.evaluate(() => {
    const results = [];
    
    // All textareas
    document.querySelectorAll('textarea').forEach(el => {
      results.push({ tag: 'textarea', visible: el.offsetParent !== null, placeholder: el.placeholder || '', id: el.id, class: el.className?.substring(0, 100) });
    });

    // All contenteditable
    document.querySelectorAll('[contenteditable]').forEach(el => {
      results.push({ tag: `${el.tagName}[contenteditable=${el.contentEditable}]`, visible: el.offsetParent !== null, text: el.textContent?.substring(0, 50), class: el.className?.substring(0, 100), ariaLabel: el.getAttribute('aria-label') || '' });
    });

    // All role="textbox"
    document.querySelectorAll('[role="textbox"]').forEach(el => {
      results.push({ tag: `${el.tagName}[role=textbox]`, visible: el.offsetParent !== null, class: el.className?.substring(0, 100), ariaLabel: el.getAttribute('aria-label') || '' });
    });

    // All inputs
    document.querySelectorAll('input').forEach(el => {
      if (el.type !== 'hidden') {
        results.push({ tag: `input[type=${el.type}]`, visible: el.offsetParent !== null, placeholder: el.placeholder || '', name: el.name, class: el.className?.substring(0, 100) });
      }
    });

    // All buttons (limit to 15)
    let btnCount = 0;
    document.querySelectorAll('button').forEach(el => {
      if (el.offsetParent !== null && btnCount < 15) {
        results.push({ tag: 'button', text: el.textContent?.trim().substring(0, 80), ariaLabel: el.getAttribute('aria-label') || '' });
        btnCount++;
      }
    });

    // Check for iframes
    document.querySelectorAll('iframe').forEach(el => {
      results.push({ tag: 'iframe', src: el.src?.substring(0, 150), visible: el.offsetParent !== null });
    });

    return results;
  });

  console.log('\n🔎 Elements found on workspace page:\n');
  console.log(JSON.stringify(elements, null, 2));

  await context.close();
}

diagnoseWorkspace().catch(console.error);
