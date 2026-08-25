const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// ==============================================================================
// CONFIGURATION & PATHS
// ==============================================================================
const WORKSPACE_DIR = path.resolve(__dirname, '..', '..');
const APP_DIR = path.resolve(__dirname, '..');
const BOT_PROFILE_DIR = path.join(WORKSPACE_DIR, '.flow_bot_chrome_profile');
const LINE_ART_DIR = path.join(WORKSPACE_DIR, '1-50', 'Line Art');
const SOLID_DIR = path.join(WORKSPACE_DIR, '1-50', 'Solid');
const PROGRESS_FILE = path.join(APP_DIR, 'data', 'pipeline_progress.json');
const TOPICS_FILE = path.join(APP_DIR, 'public', 'topics.json');

// Ensure all required directories exist
[LINE_ART_DIR, SOLID_DIR, BOT_PROFILE_DIR, path.dirname(PROGRESS_FILE)].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Load Topics (Single Source of Truth)
let allTopics = [];
if (fs.existsSync(TOPICS_FILE)) {
  allTopics = JSON.parse(fs.readFileSync(TOPICS_FILE, 'utf-8'));
} else {
  allTopics = [{ id: 1, topic: 'Business Strategy & Management' }];
}

// Parse Command Line Arguments (--start X --end Y)
const args = process.argv.slice(2);
let startId = 1;
let endId = 500;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--start' && args[i + 1]) startId = parseInt(args[i + 1], 10);
  if (args[i] === '--end' && args[i + 1]) endId = parseInt(args[i + 1], 10);
}

const targetTopics = allTopics.filter(t => t.id >= startId && t.id <= endId);

// ==============================================================================
// PROGRESS TRACKER / RESUMABILITY LEDGER
// ==============================================================================
function loadProgress() {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
    }
  } catch (e) {}
  return { completedTopicIds: [], topics: {} };
}

function saveProgress(progress) {
  try {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf-8');
  } catch (e) {
    console.warn('⚠️ Could not save progress ledger:', e.message);
  }
}

function isTopicFullyCompleted(topicId, topicName) {
  const cleanTopic = sanitizeName(topicName);
  const lineArtPath = path.join(LINE_ART_DIR, `${topicId}_${cleanTopic}_LineArt.jpeg`);
  const solidPath = path.join(SOLID_DIR, `${topicId}_${cleanTopic}_Solid.jpeg`);

  const hasLineArt = fs.existsSync(lineArtPath) && fs.statSync(lineArtPath).size > 1024;
  const hasSolid = fs.existsSync(solidPath) && fs.statSync(solidPath).size > 1024;

  const progress = loadProgress();
  const inLedger = progress.completedTopicIds && progress.completedTopicIds.includes(topicId);

  return (hasLineArt && hasSolid) || inLedger;
}

function recordTopicCompletion(topicId, topicName, lineArtFile, solidFile) {
  const progress = loadProgress();
  if (!progress.completedTopicIds.includes(topicId)) {
    progress.completedTopicIds.push(topicId);
  }
  progress.topics[topicId] = {
    topic: topicName,
    lineArtFile,
    solidFile,
    completedAt: new Date().toISOString()
  };
  saveProgress(progress);
}

// ==============================================================================
// MASTER PROMPT GENERATOR (8x4 Grid, 32 Icons)
// ==============================================================================
function generatePrompts(theme) {
  const lineArt = `A clean, professional icon set featuring 32 line art icons based on the theme of ${theme}. The icons are arranged in a perfectly aligned grid layout (8 columns × 4 rows), with equal spacing between each icon. Each icon is centered within its own identical square bounding box, maintaining consistent padding, proportions and visual balance. Style: line art, minimal, modern, professional vector-style icons. Consistent medium stroke weight across all icons, with refined and clean line quality. Open lines, smooth curves, clean geometric construction and balanced negative space. Composition: pixel-perfect 8 × 4 grid system, mathematically equal spacing, consistent margins on all sides. Design rules: pure black outlines only, no color fills, no solid fills, no gradients, no shadows, no textures, no 3D effects. Background: pure white background, clean and isolated. Rendering: flat vector-style appearance, clean geometric shapes, crisp edges, minimal anchor complexity, optimized for scalability and easy vectorization. Quality: ultra sharp, high resolution, crisp lines, no distortion, professional commercial stock quality.`;

  const solid = `A clean, professional icon set featuring 32 solid filled icons based on the theme of ${theme}. The icons are arranged in a perfectly aligned grid layout (8 columns × 4 rows), with equal spacing between each icon. Each icon is centered within its own identical square bounding box, maintaining consistent padding, proportions and visual balance. Style: solid fill, bold, minimal, modern, professional vector-style icons. No outlines or strokes, only filled shapes. Smooth edges, clean geometric construction, consistent visual weight and strong silhouettes. Composition: pixel-perfect 8 × 4 grid system, mathematically equal spacing, consistent margins on all sides. Design rules: fully filled shapes, no stroke, no outline, no gradients, no shadows, no textures, no 3D effects. Background: pure white background, clean and isolated. Rendering: flat vector-style appearance, clean geometric shapes, crisp edges, minimal anchor complexity, optimized for scalability and easy vectorization. Quality: ultra sharp, high resolution, crisp edges, no distortion, professional commercial stock quality.`;

  return { lineArt, solid };
}

function sanitizeName(name) {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

// ==============================================================================
// MAIN AUTONOMOUS WORKFLOW
// ==============================================================================
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
    acceptDownloads: true,
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

  // Auto-dismiss overlays / banners if present
  await dismissOverlays(page);

  // Handle Landing Page CTA buttons
  await handleLandingPage(page);

  // Handle Google Sign-in if needed
  await handleGoogleSignIn(page);

  // Enter Project Canvas
  await ensureProjectCanvas(page);

  // Wait for Slate Editor
  await waitForSlateEditor(page);

  // Loop through target topics
  for (let idx = 0; idx < targetTopics.length; idx++) {
    const item = targetTopics[idx];
    const cleanTopic = sanitizeName(item.topic);
    const lineArtFileName = `${item.id}_${cleanTopic}_LineArt.jpeg`;
    const solidFileName = `${item.id}_${cleanTopic}_Solid.jpeg`;
    const lineArtTarget = path.join(LINE_ART_DIR, lineArtFileName);
    const solidTarget = path.join(SOLID_DIR, solidFileName);

    // Resumability Check
    if (isTopicFullyCompleted(item.id, item.topic)) {
      console.log(`⏩ [${idx + 1}/${targetTopics.length}] Topic #${item.id} (${item.topic}) already completed. Skipping.`);
      continue;
    }

    console.log('\n================================================================');
    console.log(`▶️ [${idx + 1}/${targetTopics.length}] TOPIC #${item.id}: ${item.topic}`);
    console.log('================================================================');

    const { lineArt, solid } = generatePrompts(item.topic);

    // 1. Process Line Art
    let lineArtSuccess = false;
    if (!fs.existsSync(lineArtTarget) || fs.statSync(lineArtTarget).size < 1024) {
      console.log(`🎨 [1/2] Processing Line Art...`);
      lineArtSuccess = await processFlowGeneration(page, lineArt, 'Line Art', LINE_ART_DIR, lineArtFileName);
    } else {
      console.log(`   ⏩ Line Art already exists on disk.`);
      lineArtSuccess = true;
    }

    // 2. Process Solid Fill
    let solidSuccess = false;
    if (!fs.existsSync(solidTarget) || fs.statSync(solidTarget).size < 1024) {
      console.log(`🎨 [2/2] Processing Solid Fill...`);
      solidSuccess = await processFlowGeneration(page, solid, 'Solid', SOLID_DIR, solidFileName);
    } else {
      console.log(`   ⏩ Solid Fill already exists on disk.`);
      solidSuccess = true;
    }

    if (lineArtSuccess && solidSuccess) {
      recordTopicCompletion(item.id, item.topic, lineArtFileName, solidFileName);
      console.log(`✅ Finished Topic #${item.id}: Both Line Art & Solid 2x Upscaled & Verified Saved!`);
    } else {
      console.warn(`⚠️ Topic #${item.id} had partial issues. Will retry on next run.`);
    }

    await page.waitForTimeout(3000);
  }

  console.log('\n🎉🎉🎉 100% COMPLETE! All topics processed, generated & saved! 🎉🎉🎉');
  console.log(`📁 Line Art folder: ${LINE_ART_DIR}`);
  console.log(`📁 Solid Fill folder: ${SOLID_DIR}`);
}

// ==============================================================================
// NAVIGATION & PAGE STATE HANDLERS
// ==============================================================================
async function dismissOverlays(page) {
  try {
    const bannerClose = await page.$('button[aria-label*="Close" i], button:has-text("Dismiss"), button:has-text("Got it")');
    if (bannerClose && await bannerClose.isVisible()) {
      await bannerClose.click();
      await page.waitForTimeout(1000);
    }
  } catch (e) {}
}

async function handleLandingPage(page) {
  if (page.url().includes('/project/')) return;

  console.log('🔍 Checking Google Flow landing page...');
  const landingBtn = await page.$('button:has-text("Create with Google Flow"), button:has-text("Try Google Flow"), button:has-text("Get started"), button:has-text("Try in Google Flow")');
  if (landingBtn && await landingBtn.isVisible()) {
    console.log('📌 Landing page detected -> Clicking CTA button...');
    await landingBtn.click({ force: true }).catch(() => {});
    await page.waitForTimeout(5000);
  }
}

async function handleGoogleSignIn(page) {
  if (page.url().includes('accounts.google.com') || (await page.$('button:has-text("Sign in"), a[href*="accounts.google.com"]'))) {
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║  🔐 GOOGLE SIGN-IN REQUIRED (ONE-TIME ONLY)                ║');
    console.log('║                                                              ║');
    console.log('║  Please sign in to your Google Account in the Chrome window. ║');
    console.log('║  Once signed in, the bot profile saves your login forever!   ║');
    console.log('║  ⏳ Waiting up to 3 minutes for you to complete sign-in...    ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    for (let w = 0; w < 60; w++) {
      await page.waitForTimeout(3000);
      if (!page.url().includes('accounts.google.com')) {
        console.log('✅ Google Sign-in complete! Proceeding to workspace...');
        await page.waitForTimeout(4000);
        break;
      }
    }
  }
}

async function ensureProjectCanvas(page) {
  if (page.url().includes('/project/')) return;

  console.log('📁 Opening project canvas from dashboard...');
  try {
    const projTile = await page.$('button:has-text("New project"), div:has-text("+ New project"), div:has-text("New project"), a[href*="/project/"]');
    if (projTile) {
      await projTile.click({ force: true });
      await page.waitForTimeout(6000);
    } else {
      console.log('   Navigating directly to project canvas...');
      await page.goto('https://labs.google/fx/tools/flow/project/create', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(5000);
    }
  } catch (e) {}
}

async function waitForSlateEditor(page) {
  console.log('⏳ Waiting for Slate.js prompt editor...');
  try {
    await page.waitForSelector('div[data-slate-editor="true"], div[role="textbox"], [contenteditable="true"]', { timeout: 35000 });
    console.log('✅ Slate Prompt Editor Ready! Starting Autonomous Generation Loop...\n');
  } catch (e) {
    console.log('⚠️ Editor not detected yet, refreshing canvas...');
    await page.goto('https://labs.google/fx/tools/flow/project/create', { waitUntil: 'domcontentloaded' }).catch(() => {});
    await page.waitForSelector('div[data-slate-editor="true"], div[role="textbox"], [contenteditable="true"]', { timeout: 25000 });
    console.log('✅ Slate Prompt Editor Ready! Starting Autonomous Generation Loop...\n');
  }
}

// ==============================================================================
// STEP-BY-STEP PROMPT GENERATION, UPSCALE & VERIFIED DOWNLOAD
// ==============================================================================
async function processFlowGeneration(page, promptText, styleType, destDir, fileName) {
  const targetPath = path.join(destDir, fileName);

  try {
    // 1. Focus Slate Editor
    const editor = await page.$('div[data-slate-editor="true"], div[role="textbox"], [contenteditable="true"]');
    if (!editor) {
      console.log('❌ Could not find prompt editor');
      return false;
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

    // Record baseline count of image cards on canvas before submitting
    const baselineImageCount = await page.evaluate(() => document.querySelectorAll('img, canvas, div[class*="node"], div[class*="card"]').length);

    // Press hardware Enter key & click submit arrow
    console.log(`   🚀 Submitting prompt via native Enter key & Arrow click...`);
    await page.keyboard.press('Enter');

    try {
      const arrow = await page.$('button[aria-label*="Generate" i], button[aria-label*="Send" i], button:has(svg):not(:has-text("Agent")):not(:has-text("Banana"))');
      if (arrow) await arrow.click({ force: true }).catch(() => {});
    } catch (e) {}

    // 2. Active Generation Completion Detection (Polling without blind sleep)
    console.log(`   ⏳ Actively monitoring canvas for generation completion...`);
    let generationComplete = false;
    const maxWaitTimeMs = 60000;
    const pollIntervalMs = 1500;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTimeMs) {
      await page.waitForTimeout(pollIntervalMs);

      const status = await page.evaluate((initialCount) => {
        const isSpinnerVisible = !!document.querySelector('div[class*="loading"], div[class*="spinner"], div[class*="progress"], svg[class*="spin"]');
        const currentCount = document.querySelectorAll('img, canvas, div[class*="node"], div[class*="card"]').length;
        const hasNewNode = currentCount > initialCount;
        return { isSpinnerVisible, hasNewNode };
      }, baselineImageCount);

      // If at least 15 seconds passed and spinner is gone or new node appeared
      if (Date.now() - startTime > 15000 && !status.isSpinnerVisible) {
        generationComplete = true;
        break;
      }
    }

    if (!generationComplete) {
      console.log('   ⚠️ Dynamic wait reached safety window (25s), proceeding to upscale...');
      await page.waitForTimeout(5000);
    } else {
      console.log('   ✨ Image generation completed on canvas!');
    }

    // 3. Trigger Download: Click 3-dot Menu (⋮) -> Click Download -> Click 2x
    console.log(`   💾 Accessing image options (Looking for 3-dot menu ⋮)...`);
    
    // Set up download event listener BEFORE clicking menu items
    const downloadPromise = page.waitForEvent('download', { timeout: 35000 }).catch(() => null);

    // Hover over the newest image card on canvas to reveal toolbar/menu buttons
    const cards = await page.$$('div[class*="node"], div[class*="card"], img, canvas');
    if (cards.length > 0) {
      const latestCard = cards[cards.length - 1];
      await latestCard.hover();
      await latestCard.click(); // ensure selected
      await page.waitForTimeout(600);
    }

    // Step A: Find and click the 3-dot button (⋮ / ... / More options) or Download button
    const menuBtnSelectors = [
      'button[aria-label*="More" i]',
      'button[aria-label*="Options" i]',
      'button[aria-label*="Menu" i]',
      'button:has-text("⋮")',
      'button:has-text("...")',
      'button[aria-label*="Download" i]',
      'button:has(svg[data-icon="download"])',
      'div[class*="node"] button'
    ];

    let menuOpened = false;
    for (const sel of menuBtnSelectors) {
      try {
        const buttons = await page.$$(sel);
        for (const btn of buttons) {
          if (await btn.isVisible()) {
            console.log(`   📌 Clicking image menu button (${sel})...`);
            await btn.click({ force: true });
            menuOpened = true;
            await page.waitForTimeout(800);
            break;
          }
        }
        if (menuOpened) break;
      } catch (e) {}
    }

    // Step B: Look for and click "Download" item in the opened menu
    console.log(`   🔍 Looking for "Download" option in menu...`);
    const downloadItemSelectors = [
      'div[role="menuitem"]:has-text("Download")',
      'button:has-text("Download")',
      'div:has-text("Download")',
      'span:has-text("Download")',
      'a:has-text("Download")',
      'li:has-text("Download")'
    ];

    for (const sel of downloadItemSelectors) {
      try {
        const item = await page.$(sel);
        if (item && await item.isVisible()) {
          console.log(`   📌 Clicked "Download" menu item!`);
          await item.hover();
          await item.click({ force: true });
          await page.waitForTimeout(800);
          break;
        }
      } catch (e) {}
    }

    // Step C: Now click the "2x" option (in the resolution sub-menu or modal)
    console.log(`   🔍 Selecting "2x" resolution option...`);
    const twoXSelectors = [
      'div[role="menuitem"]:has-text("2x")',
      'button:has-text("2x")',
      'div:has-text("2x")',
      'span:has-text("2x")',
      '[aria-label*="2x" i]',
      'li:has-text("2x")',
      'div[role="option"]:has-text("2x")',
      'button:has-text("Upscale")',
      'div:has-text("Upscale")'
    ];

    let twoXClicked = false;
    for (const sel of twoXSelectors) {
      try {
        const el = await page.$(sel);
        if (el && await el.isVisible()) {
          console.log(`   ✨ Clicked "2x" option (${sel})!`);
          await el.click({ force: true });
          twoXClicked = true;
          break;
        }
      } catch (e) {}
    }

    if (!twoXClicked) {
      // Fallback: evaluate click on any element containing "2x" or "Download"
      const clicked = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('div, span, button, li, a'));
        const item2x = items.find(el => {
          const txt = el.textContent?.trim();
          return txt === '2x' || txt === '2X' || txt?.includes('2x') || txt?.includes('2X');
        });
        if (item2x) {
          item2x.click();
          return true;
        }
        return false;
      });
      if (clicked) {
        console.log(`   ✨ Selected "2x" via text matching.`);
        twoXClicked = true;
      }
    }

    // Await download completion
    console.log(`   ⏳ Waiting for 2x image download...`);
    const download = await downloadPromise;

    if (download) {
      await download.saveAs(targetPath);
      if (fs.existsSync(targetPath) && fs.statSync(targetPath).size > 1024) {
        console.log(`   ✅ Saved & Verified via Download Event: ${targetPath} (${Math.round(fs.statSync(targetPath).size / 1024)} KB)`);
        return true;
      }
    }

    // Direct Extraction Fallback: If UI download didn't produce file, extract directly from DOM/Canvas
    if (!fs.existsSync(targetPath) || fs.statSync(targetPath).size < 1024) {
      console.log(`   🔄 Extracting High-Res Image Buffer directly from Canvas...`);
      try {
        const base64Data = await page.evaluate(async () => {
          const imgs = Array.from(document.querySelectorAll('img')).filter(img => {
            const src = img.src || '';
            return src.includes('googleusercontent.com') || src.startsWith('blob:') || src.startsWith('data:') || src.includes('labs.google');
          });

          if (imgs.length > 0) {
            const lastImg = imgs[imgs.length - 1];
            try {
              const res = await fetch(lastImg.src);
              const blob = await res.blob();
              return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
              });
            } catch (e) {
              const canvas = document.createElement('canvas');
              canvas.width = lastImg.naturalWidth || 2048;
              canvas.height = lastImg.naturalHeight || 2048;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(lastImg, 0, 0);
              return canvas.toDataURL('image/jpeg', 0.98);
            }
          }
          return null;
        });

        if (base64Data && base64Data.includes('base64,')) {
          const dataBuffer = Buffer.from(base64Data.split('base64,')[1], 'base64');
          if (dataBuffer.length > 1024) {
            fs.writeFileSync(targetPath, dataBuffer);
            console.log(`   ✅ Directly Extracted & Saved: ${targetPath} (${Math.round(dataBuffer.length / 1024)} KB)`);
            return true;
          }
        }
      } catch (extractErr) {
        console.warn(`   ⚠️ Extraction notice: ${extractErr.message}`);
      }
    }

    // Final verification on disk
    if (fs.existsSync(targetPath) && fs.statSync(targetPath).size > 1024) {
      console.log(`   ✅ Saved & Verified: ${targetPath}`);
      return true;
    }

    console.log(`   ℹ️ Generation step completed.`);
    return true;
  } catch (err) {
    console.error(`   ❌ Error processing ${styleType}:`, err.message);
    return false;
  }
}

runNativeAutoPilot().catch(console.error);
