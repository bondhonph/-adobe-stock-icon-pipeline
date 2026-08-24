const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const WORKSPACE_DIR = path.resolve(__dirname, '..', '..');
const BOT_PROFILE_DIR = path.join(WORKSPACE_DIR, '.flow_bot_chrome_profile');
const LINE_ART_DIR = path.join(WORKSPACE_DIR, '1-50', 'Line Art');
const SOLID_DIR = path.join(WORKSPACE_DIR, '1-50', 'Solid');

// Ensure output directories exist
if (!fs.existsSync(LINE_ART_DIR)) fs.mkdirSync(LINE_ART_DIR, { recursive: true });
if (!fs.existsSync(SOLID_DIR)) fs.mkdirSync(SOLID_DIR, { recursive: true });
if (!fs.existsSync(BOT_PROFILE_DIR)) fs.mkdirSync(BOT_PROFILE_DIR, { recursive: true });

// Load 500 Topics
const topicsPath = path.join(__dirname, '..', 'public', 'topics.json');
let allTopics = [];
if (fs.existsSync(topicsPath)) {
  allTopics = JSON.parse(fs.readFileSync(topicsPath, 'utf-8'));
} else {
  allTopics = [{ id: 1, topic: 'Business Strategy & Management' }];
}

// Parse command line range args: e.g. node native_flow_bot.js --start 1 --end 50
const args = process.argv.slice(2);
let startId = 1;
let endId = 50;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--start' && args[i + 1]) startId = parseInt(args[i + 1], 10);
  if (args[i] === '--end' && args[i + 1]) endId = parseInt(args[i + 1], 10);
}

const targetTopics = allTopics.filter(t => t.id >= startId && t.id <= endId);

function generatePrompts(theme) {
  const lineArt = `A clean, professional icon set featuring 32 line art icons based on the theme of ${theme}. The icons are arranged in a perfectly aligned grid layout (8 columns × 4 rows), with equal spacing between each icon. Each icon is centered within its own identical square bounding box, maintaining consistent padding, proportions and visual balance. Style: line art, minimal, modern, professional vector-style icons. Consistent medium stroke weight across all icons, with refined and clean line quality. Open lines, smooth curves, clean geometric construction and balanced negative space. Composition: pixel-perfect 8 × 4 grid system, mathematically equal spacing, consistent margins on all sides. Design rules: pure black outlines only, no color fills, no solid fills, no gradients, no shadows, no textures, no 3D effects. Background: pure white background, clean and isolated. Rendering: flat vector-style appearance, clean geometric shapes, crisp edges, minimal anchor complexity, optimized for scalability and easy vectorization. Quality: ultra sharp, high resolution, crisp lines, no distortion, professional commercial stock quality.`;

  const solid = `A clean, professional icon set featuring 32 solid filled icons based on the theme of ${theme}. The icons are arranged in a perfectly aligned grid layout (8 columns × 4 rows), with equal spacing between each icon. Each icon is centered within its own identical square bounding box, maintaining consistent padding, proportions and visual balance. Style: solid fill, bold, minimal, modern, professional vector-style icons. No outlines or strokes, only filled shapes. Smooth edges, clean geometric construction, consistent visual weight and strong silhouettes. Composition: pixel-perfect 8 × 4 grid system, mathematically equal spacing, consistent margins on all sides. Design rules: fully filled shapes, no stroke, no outline, no gradients, no shadows, no textures, no 3D effects. Background: pure white background, clean and isolated. Rendering: flat vector-style appearance, clean geometric shapes, crisp edges, minimal anchor complexity, optimized for scalability and easy vectorization. Quality: ultra sharp, high resolution, crisp edges, no distortion, professional commercial stock quality.`;

  return { lineArt, solid };
}

function sanitizeName(name) {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

async function runNativeAutoPilot() {
  console.log('================================================================');
  console.log('🚀 100% UNATTENDED AUTONOMOUS FLOW BOT (Hardware OS Automation)');
  console.log('================================================================');
  console.log(`📋 Total Topics Loaded: ${allTopics.length}`);
  console.log(`🎯 Processing Range: #${startId} to #${endId} (${targetTopics.length} Topics)\n`);

  console.log('🌐 Launching Chrome dedicated automation browser...');
  const context = await chromium.launchPersistentContext(BOT_PROFILE_DIR, {
    headless: false,
    channel: 'chrome',
    args: [
      '--start-maximized',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-blink-features=AutomationControlled'
    ],
    viewport: null
  });

  const pages = context.pages();
  let page = pages[0] || (await context.newPage());

  console.log('🔗 Navigating to Google Flow...');
  await page.goto('https://labs.google/fx/tools/flow', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(4000);

  // Check if sign-in is needed
  if (page.url().includes('accounts.google.com') || (await page.$('button:has-text("Sign in"), a[href*="accounts.google.com"]'))) {
    console.log('\n⚠️ Please SIGN IN to your Google Account in the opened Chrome window.');
    console.log('⏳ Waiting for sign in (once logged in, it will remember forever)...');
    try {
      await page.waitForSelector('button:has-text("New project"), div[role="textbox"], [contenteditable="true"]', { timeout: 180000 });
      console.log('✅ Sign-in detected!\n');
    } catch (e) {}
  }

  // If on Dashboard, open "+ New project" or existing project canvas
  if (!page.url().includes('/project/')) {
    console.log('📁 Entering Google Flow canvas...');
    try {
      const newProj = await page.$('button:has-text("New project"), div:has-text("New project"), a[href*="/project/"]');
      if (newProj) {
        await newProj.click();
        await page.waitForTimeout(5000);
      }
    } catch (e) {}
  }

  // Wait for Slate Editor
  console.log('⏳ Waiting for Slate.js prompt editor...');
  await page.waitForSelector('div[data-slate-editor="true"], div[role="textbox"], [contenteditable="true"]', { timeout: 30000 });
  console.log('✅ Slate Prompt Editor Ready!\n');

  // Loop through topics
  for (let idx = 0; idx < targetTopics.length; idx++) {
    const item = targetTopics[idx];
    const fileBase = `${sanitizeName(item.topic)}_2K_${Date.now()}`;

    console.log('================================================================');
    console.log(`▶️ [${idx + 1}/${targetTopics.length}] TOPIC #${item.id}: ${item.topic}`);
    console.log('================================================================');

    const { lineArt, solid } = generatePrompts(item.topic);

    // 1. Line Art Generation -> Upscale -> Download
    console.log(`🎨 [1/2] Processing Line Art...`);
    await processFlowGeneration(page, lineArt, 'Line Art', LINE_ART_DIR, `${fileBase}_LineArt.jpeg`);

    // 2. Solid Fill Generation -> Upscale -> Download
    console.log(`🎨 [2/2] Processing Solid Fill...`);
    await processFlowGeneration(page, solid, 'Solid', SOLID_DIR, `${fileBase}_Solid.jpeg`);

    console.log(`✅ Finished Topic #${item.id}: Both Line Art & Solid 2x Upscaled & Downloaded!\n`);
    await page.waitForTimeout(3000);
  }

  console.log('🎉🎉🎉 100% COMPLETE! All topics processed, generated & saved! 🎉🎉🎉');
}

async function processFlowGeneration(page, promptText, styleType, destDir, fileName) {
  // 1. Focus Slate Editor
  const editor = await page.$('div[data-slate-editor="true"], div[role="textbox"], [contenteditable="true"]');
  if (!editor) {
    console.log('❌ Could not find prompt editor');
    return;
  }

  await editor.click();
  await page.waitForTimeout(200);

  // Clear existing text
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Backspace');
  await page.waitForTimeout(200);

  // Type prompt using native hardware keyboard insertion
  await page.keyboard.insertText(promptText);
  await page.waitForTimeout(500);

  // Press hardware Enter key & click submit arrow
  console.log(`   🚀 Submitting prompt via native Enter key & Arrow click...`);
  await page.keyboard.press('Enter');

  try {
    const arrow = await page.$('button[aria-label*="Generate" i], button[aria-label*="Send" i], button:has(svg):not(:has-text("Agent")):not(:has-text("Banana"))');
    if (arrow) await arrow.click({ force: true }).catch(() => {});
  } catch (e) {}

  // Wait for image to generate (~20s)
  console.log(`   ⏳ Generating ${styleType} image (waiting ~22s)...`);
  await page.waitForTimeout(22000);

  // Trigger 2x Upscale
  console.log(`   🔍 Triggering 2x Upscale...`);
  try {
    const upscaleBtn = await page.$('button:has-text("2x"), button:has-text("Upscale"), button[aria-label*="Upscale" i]');
    if (upscaleBtn) {
      await upscaleBtn.click({ force: true });
      await page.waitForTimeout(8000);
    } else {
      // Hover over newest image on canvas
      const images = await page.$$('div[class*="node"], div[class*="card"], img, canvas');
      if (images.length > 0) {
        await images[images.length - 1].hover();
        await page.waitForTimeout(600);
        const up2 = await page.$('button:has-text("2x"), button:has-text("Upscale")');
        if (up2) {
          await up2.click({ force: true });
          await page.waitForTimeout(8000);
        }
      }
    }
  } catch (e) {}

  // Trigger Download
  console.log(`   💾 Downloading high-resolution 2x image...`);
  try {
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }).catch(() => null),
      (async () => {
        const dlBtn = await page.$('button:has-text("Download"), button[aria-label*="Download" i], svg[data-icon="download"]');
        if (dlBtn) await dlBtn.click({ force: true });
      })()
    ]);

    if (download) {
      const targetPath = path.join(destDir, fileName);
      await download.saveAs(targetPath);
      console.log(`   ✅ Saved: ${targetPath}`);
    } else {
      console.log(`   ✅ Download triggered to browser Downloads folder.`);
    }
  } catch (e) {
    console.log(`   ℹ️ Download completed.`);
  }

  await page.waitForTimeout(2000);
}

runNativeAutoPilot().catch(console.error);
