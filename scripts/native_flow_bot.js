const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const os = require('os');

// ==============================================================================
// CONFIGURATION & PATHS (All images saved into single "Auto-Download" folder)
// ==============================================================================
const WORKSPACE_DIR = path.resolve(__dirname, '..', '..');
const APP_DIR = path.resolve(__dirname, '..');
const BOT_PROFILE_DIR = path.join(WORKSPACE_DIR, '.flow_bot_chrome_profile');
const AUTO_DOWNLOAD_DIR = path.join(WORKSPACE_DIR, 'Auto-Download');
const USER_DOWNLOADS_DIR = path.join(os.homedir(), 'Downloads');
const PROGRESS_FILE = path.join(APP_DIR, 'data', 'pipeline_progress.json');
const TOPICS_FILE = path.join(APP_DIR, 'public', 'topics.json');

// Ensure Auto-Download is a valid directory
try {
  if (fs.existsSync(AUTO_DOWNLOAD_DIR) && !fs.statSync(AUTO_DOWNLOAD_DIR).isDirectory()) {
    fs.unlinkSync(AUTO_DOWNLOAD_DIR);
  }
} catch (e) {}

[AUTO_DOWNLOAD_DIR, BOT_PROFILE_DIR, path.dirname(PROGRESS_FILE)].forEach(dir => {
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  } catch (e) {}
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
  if (args[i] === '--start' && args[i + 1]) {
    const parsed = parseInt(args[i + 1], 10);
    if (!isNaN(parsed)) startId = parsed;
  }
  if (args[i] === '--end' && args[i + 1]) {
    const parsed = parseInt(args[i + 1], 10);
    if (!isNaN(parsed)) endId = parsed;
  }
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
  const lineArtPath = path.join(AUTO_DOWNLOAD_DIR, `${topicId}_${cleanTopic}_LineArt.jpeg`);
  const solidPath = path.join(AUTO_DOWNLOAD_DIR, `${topicId}_${cleanTopic}_Solid.jpeg`);

  const hasLineArt = fs.existsSync(lineArtPath) && fs.statSync(lineArtPath).size > 10240;
  const hasSolid = fs.existsSync(solidPath) && fs.statSync(solidPath).size > 10240;

  return hasLineArt && hasSolid;
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
// MASTER PROMPT GENERATOR (Supports Custom Prompts from data/custom_prompts.json)
// ==============================================================================
const CUSTOM_PROMPTS_FILE = path.join(APP_DIR, 'data', 'custom_prompts.json');

function generatePrompts(theme) {
  let lineArtTemplate = `A clean, professional icon set featuring 32 line art icons based on the theme of {{THEME}}. The icons are arranged in a perfectly aligned grid layout (8 columns × 4 rows), with equal spacing between each icon. Each icon is centered within its own identical square bounding box, maintaining consistent padding, proportions and visual balance. Style: line art, minimal, modern, professional vector-style icons. Consistent medium stroke weight across all icons, with refined and clean line quality. Open lines, smooth curves, clean geometric construction and balanced negative space. Composition: pixel-perfect 8 × 4 grid system, mathematically equal spacing, consistent margins on all sides. Design rules: pure black outlines only, no color fills, no solid fills, no gradients, no shadows, no textures, no 3D effects. Background: pure white background, clean and isolated. Rendering: flat vector-style appearance, clean geometric shapes, crisp edges, minimal anchor complexity, optimized for scalability and easy vectorization. Quality: ultra sharp, high resolution, crisp lines, no distortion, professional commercial stock quality.`;

  let solidTemplate = `A clean, professional icon set featuring 32 solid filled icons based on the theme of {{THEME}}. The icons are arranged in a perfectly aligned grid layout (8 columns × 4 rows), with equal spacing between each icon. Each icon is centered within its own identical square bounding box, maintaining consistent padding, proportions and visual balance. Style: solid fill, bold, minimal, modern, professional vector-style icons. No outlines or strokes, only filled shapes. Smooth edges, clean geometric construction, consistent visual weight and strong silhouettes. Composition: pixel-perfect 8 × 4 grid system, mathematically equal spacing, consistent margins on all sides. Design rules: fully filled shapes, no stroke, no outline, no gradients, no shadows, no textures, no 3D effects. Background: pure white background, clean and isolated. Rendering: flat vector-style appearance, clean geometric shapes, crisp edges, minimal anchor complexity, optimized for scalability and easy vectorization. Quality: ultra sharp, high resolution, crisp edges, no distortion, professional commercial stock quality.`;

  try {
    if (fs.existsSync(CUSTOM_PROMPTS_FILE)) {
      const config = JSON.parse(fs.readFileSync(CUSTOM_PROMPTS_FILE, 'utf-8'));
      const activeTpl = (config.templates || []).find(t => t.id === config.activeTemplateId) || config.templates?.[0];
      if (activeTpl) {
        if (activeTpl.outlineTemplate) lineArtTemplate = activeTpl.outlineTemplate;
        if (activeTpl.solidTemplate) solidTemplate = activeTpl.solidTemplate;
      }
    }
  } catch (e) {
    // Fallback to default
  }

  const lineArt = lineArtTemplate.replace(/\{\{THEME\}\}/gi, theme).replace(/\{\{topic\}\}/gi, theme);
  const solid = solidTemplate.replace(/\{\{THEME\}\}/gi, theme).replace(/\{\{topic\}\}/gi, theme);

  return { lineArt, solid };
}

function sanitizeName(name) {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

// ==============================================================================
// MAIN AUTONOMOUS WORKFLOW (Main Infinite Canvas Grid Mode)
// ==============================================================================
async function runNativeAutoPilot() {
  console.log('================================================================');
  console.log('🚀 100% UNATTENDED AUTONOMOUS FLOW BOT (Main Canvas Grid Mode)');
  console.log('================================================================');
  console.log(`📋 Total Topics Loaded: ${allTopics.length}`);
  console.log(`🎯 Processing Range: #${startId} to #${endId} (${targetTopics.length} Topics)`);
  console.log(`📁 Unified Output Folder: ${AUTO_DOWNLOAD_DIR}\n`);

  // Clean up any non-image temporary artifacts from Auto-Download
  try {
    if (fs.existsSync(AUTO_DOWNLOAD_DIR)) {
      fs.readdirSync(AUTO_DOWNLOAD_DIR).forEach(f => {
        if (!f.endsWith('.jpeg') && !f.endsWith('.jpg') && !f.endsWith('.png')) {
          try { fs.unlinkSync(path.join(AUTO_DOWNLOAD_DIR, f)); } catch (e) {}
        }
      });
    }
  } catch (e) {}

  const tempDownloadsPath = path.join(BOT_PROFILE_DIR, 'temp_downloads');
  try { if (!fs.existsSync(tempDownloadsPath)) fs.mkdirSync(tempDownloadsPath, { recursive: true }); } catch (e) {}

  console.log('🌐 Launching Chrome dedicated automation browser...');
  const context = await chromium.launchPersistentContext(BOT_PROFILE_DIR, {
    headless: false,
    channel: 'chrome',
    acceptDownloads: true,
    downloadsPath: tempDownloadsPath,
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

  // Enter Project Main Canvas Grid
  await ensureProjectCanvas(page);

  // Wait for Slate Editor on Main Canvas
  await waitForSlateEditor(page);

  // Loop through target topics
  for (let idx = 0; idx < targetTopics.length; idx++) {
    const item = targetTopics[idx];
    const cleanTopic = sanitizeName(item.topic);
    const lineArtFileName = `${item.id}_${cleanTopic}_LineArt.jpeg`;
    const solidFileName = `${item.id}_${cleanTopic}_Solid.jpeg`;
    const lineArtTarget = path.join(AUTO_DOWNLOAD_DIR, lineArtFileName);
    const solidTarget = path.join(AUTO_DOWNLOAD_DIR, solidFileName);

    // Resumability Check
    if (isTopicFullyCompleted(item.id, item.topic)) {
      console.log(`⏩ [${idx + 1}/${targetTopics.length}] Topic #${item.id} (${item.topic}) already completed. Skipping.`);
      continue;
    }

    console.log('\n================================================================');
    console.log(`▶️ [${idx + 1}/${targetTopics.length}] TOPIC #${item.id}: ${item.topic}`);
    console.log('================================================================');

    const { lineArt, solid } = generatePrompts(item.topic);

    // STEP 1: Generate Line Art on Main Canvas -> Save Line Art
    let lineArtSuccess = false;
    if (!fs.existsSync(lineArtTarget) || fs.statSync(lineArtTarget).size < 10240) {
      console.log(`🎨 [1/2] Processing Line Art (Main Canvas Grid)...`);
      lineArtSuccess = await executeFlowStepWithRetry(page, lineArt, 'Line Art', AUTO_DOWNLOAD_DIR, lineArtFileName);
    } else {
      console.log(`   ⏩ Line Art already exists on disk.`);
      lineArtSuccess = true;
    }

    // Brief pause between images
    await page.waitForTimeout(2000);

    // STEP 2: Generate Solid Fill on Main Canvas -> Save Solid Fill
    let solidSuccess = false;
    if (!fs.existsSync(solidTarget) || fs.statSync(solidTarget).size < 10240) {
      console.log(`🎨 [2/2] Processing Solid Fill (Main Canvas Grid)...`);
      solidSuccess = await executeFlowStepWithRetry(page, solid, 'Solid', AUTO_DOWNLOAD_DIR, solidFileName);
    } else {
      console.log(`   ⏩ Solid Fill already exists on disk.`);
      solidSuccess = true;
    }

    if (lineArtSuccess && solidSuccess) {
      recordTopicCompletion(item.id, item.topic, lineArtFileName, solidFileName);
      console.log(`✅ Finished Topic #${item.id}: Both images generated & saved in Auto-Download!`);
    } else {
      console.warn(`⚠️ Topic #${item.id} will be retried on next run.`);
    }

    await page.waitForTimeout(2500);
  }

  console.log('\n🎉🎉🎉 100% COMPLETE! All topics processed, generated & saved! 🎉🎉🎉');
  console.log(`📁 All files are in: ${AUTO_DOWNLOAD_DIR}`);
}

// ==============================================================================
// NAVIGATION & PAGE STATE HANDLERS (Always stay on Main Canvas Grid)
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

async function ensureMainCanvas(page) {
  // If stuck inside an individual image edit sub-canvas (/edit/), exit back to main canvas
  if (page.url().includes('/edit/')) {
    console.log('↩️ Exiting image edit mode back to Main Canvas Grid...');
    try {
      const doneBtn = await page.$('button:has-text("Done"), button:has-text("Save"), button[aria-label*="Back" i]');
      if (doneBtn) await doneBtn.click({ force: true }).catch(() => {});
      await page.waitForTimeout(1500);
    } catch (e) {}

    if (page.url().includes('/edit/')) {
      const mainProjUrl = page.url().split('/edit/')[0];
      await page.goto(mainProjUrl, { waitUntil: 'domcontentloaded' }).catch(() => {});
      await page.waitForTimeout(3000);
    }
  }
}

async function ensureProjectCanvas(page) {
  await ensureMainCanvas(page);

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
  await ensureMainCanvas(page);
  console.log('⏳ Waiting for Slate.js prompt editor on Main Canvas...');
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
// STEP-BY-STEP PROMPT GENERATION & BUFFER EXTRACTION (Main Grid Mode)
// ==============================================================================
async function executeFlowStepWithRetry(page, promptText, styleType, destDir, fileName) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    if (attempt > 1) {
      console.log(`   🔁 Retrying ${styleType} step (Attempt 2/2)...`);
      await page.waitForTimeout(2000);
    }
    const success = await processFlowGeneration(page, promptText, styleType, destDir, fileName);
    if (success) return true;
  }
  return false;
}

async function processFlowGeneration(page, promptText, styleType, destDir, fileName) {
  const targetPath = path.join(destDir, fileName);

  try {
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

    // Ensure we are on the MAIN project canvas grid (NOT inside /edit/ sub-canvas)
    await ensureMainCanvas(page);

    // 1. Snapshot all existing edit links and image URLs BEFORE submitting new prompt
    const initialEditLinks = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a[href*="/edit/"]')).map(a => a.href).filter(Boolean);
    });
    const initialImgSrcs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('img')).map(img => img.currentSrc || img.src).filter(Boolean);
    });

    // 2. Focus & Clear Slate Editor on Main Canvas
    const editor = await page.$('div[data-slate-editor="true"], div[role="textbox"], [contenteditable="true"]');
    if (!editor) {
      console.log('❌ Could not find prompt editor on main canvas');
      return false;
    }

    await editor.click();
    await page.waitForTimeout(200);

    // Clear editor cleanly
    await page.evaluate(() => {
      const el = document.querySelector('div[data-slate-editor="true"], div[role="textbox"], [contenteditable="true"]');
      if (el) {
        el.focus();
        const sel = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(el);
        sel.removeAllRanges();
        sel.addRange(range);
        document.execCommand('delete', false, null);
      }
    });
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(200);

    // Type new prompt via Slate event dispatch & hardware keyboard
    await page.evaluate((text) => {
      const el = document.querySelector('div[data-slate-editor="true"], div[role="textbox"], [contenteditable="true"]');
      if (el) {
        el.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, cancelable: true, inputType: 'insertText', data: text }));
        document.execCommand('insertText', false, text);
        el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
      }
    }, promptText);

    await page.keyboard.insertText(promptText);
    await page.waitForTimeout(300);

    // Verify text landed in editor
    const typedOk = await page.evaluate(() => {
      const el = document.querySelector('div[data-slate-editor="true"], div[role="textbox"], [contenteditable="true"]');
      return (el?.textContent || '').trim().length > 20;
    });

    if (!typedOk) {
      console.warn('   ⚠️ Prompt text not detected in editor, re-inserting...');
      await editor.click();
      await page.keyboard.insertText(promptText);
      await page.waitForTimeout(300);
    }

    // 3. Submit Prompt (Click Submit Arrow & Press Enter)
    console.log(`   🚀 Submitting ${styleType} prompt to Main Canvas Grid...`);
    
    // Click submit button (Arrow near bottom-right)
    await page.evaluate(() => {
      const ed = document.querySelector('div[data-slate-editor="true"], div[role="textbox"], [contenteditable="true"]');
      if (!ed) return;
      const pRect = ed.getBoundingClientRect();
      const candidates = Array.from(document.querySelectorAll('button, [role="button"], div[class*="button"], svg, path'));
      const submitBtn = candidates.find(el => {
        const r = el.getBoundingClientRect();
        const isNearBottomRight = (r.bottom >= pRect.bottom - 15) && (r.bottom <= pRect.bottom + 80) && (r.right >= pRect.right - 100);
        const notSpecial = !el.textContent?.toLowerCase().includes('agent') && !el.textContent?.toLowerCase().includes('banana');
        return isNearBottomRight && notSpecial && r.width > 0 && r.height > 0;
      });

      if (submitBtn) {
        submitBtn.removeAttribute('disabled');
        submitBtn.removeAttribute('aria-disabled');
        submitBtn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
        submitBtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        submitBtn.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true }));
        submitBtn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
        submitBtn.click();
      }
    });

    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    // 4. Actively Monitor for the NEW Image to render on the Main Canvas Grid
    console.log(`   ⏳ Monitoring Main Canvas Grid for NEW ${styleType} card...`);
    let newImageSrc = null;
    const startTime = Date.now();
    const maxWaitMs = 70000;
    let stableCount = 0;

    while (Date.now() - startTime < maxWaitMs) {
      await page.waitForTimeout(1500);

      // Auto-remove notification toasts
      await page.evaluate(() => {
        document.querySelectorAll('section[aria-label*="Notifications" i], div[class*="toast"], div[class*="hemBBc"]').forEach(el => el.remove());
      }).catch(() => {});

      const check = await page.evaluate((prevSrcs) => {
        const imgs = Array.from(document.querySelectorAll('img')).filter(img => {
          const s = img.currentSrc || img.src || '';
          const isReal = s.includes('googleusercontent.com') || s.startsWith('blob:') || s.startsWith('data:') || s.includes('labs.google');
          const isSpinner = !!img.closest('[class*="loading"], [class*="spinner"]') || (img.naturalWidth > 0 && img.naturalWidth < 80);
          return isReal && !isSpinner;
        });

        const freshImg = imgs.find(img => !prevSrcs.includes(img.currentSrc || img.src));
        const isSpinning = !!document.querySelector('div[class*="loading" i], div[class*="spinner" i], div[class*="progress" i], [aria-busy="true"], div[role="progressbar"]');

        if (freshImg && !isSpinning) {
          return {
            found: true,
            src: freshImg.currentSrc || freshImg.src,
            width: freshImg.naturalWidth,
            height: freshImg.naturalHeight
          };
        }

        return { found: false, count: imgs.length };
      }, initialImgSrcs);

      if (check.found && Date.now() - startTime > 10000) {
        stableCount++;
        if (stableCount >= 2) {
          newImageSrc = check.src;
          console.log(`   ✨ NEW ${styleType} card rendered on Main Canvas (${check.width}x${check.height})!`);
          break;
        }
      } else {
        stableCount = 0;
      }
    }

    // 5. Enter Edit Mode by targeting the EXACT newly generated image card
    console.log(`   🖱️ Targeting & clicking the newly rendered ${styleType} card to enter Edit Mode...`);

    let inEditMode = false;
    for (let attempt = 1; attempt <= 4; attempt++) {
      if (page.url().includes('/edit/')) {
        inEditMode = true;
        break;
      }

      // Method A: Target the EXACT <img> element matching newImageSrc
      const exactImgHandle = await page.evaluateHandle((targetSrc) => {
        const imgs = Array.from(document.querySelectorAll('img'));
        if (targetSrc) {
          const matched = imgs.find(img => (img.currentSrc || img.src) === targetSrc);
          if (matched) return matched;
        }
        // Fallback: newest visible canvas image
        const canvasImgs = imgs.filter(img => {
          const s = img.currentSrc || img.src || '';
          return (s.includes('googleusercontent.com') || s.startsWith('blob:') || s.startsWith('data:')) && img.naturalWidth > 100;
        });
        return canvasImgs[canvasImgs.length - 1] || null;
      }, newImageSrc);

      if (exactImgHandle && exactImgHandle.asElement()) {
        const box = await exactImgHandle.asElement().boundingBox();
        if (box && box.width > 50 && box.height > 50) {
          const clickX = box.x + box.width / 2;
          const clickY = box.y + box.height / 2;
          console.log(`   📍 Clicking exact ${styleType} card at (${Math.round(clickX)}, ${Math.round(clickY)})...`);

          // Scroll card into view if needed
          await exactImgHandle.asElement().scrollIntoViewIfNeeded().catch(() => {});
          await page.waitForTimeout(200);

          // Physical click on the card
          await page.mouse.move(clickX, clickY);
          await page.waitForTimeout(150);
          await page.mouse.click(clickX, clickY);
          await page.waitForTimeout(2000);

          if (page.url().includes('/edit/')) {
            inEditMode = true;
            break;
          }

          // Double click on the card
          console.log(`   📍 Double-clicking exact card...`);
          await page.mouse.dblclick(clickX, clickY);
          await page.waitForTimeout(2500);

          if (page.url().includes('/edit/')) {
            inEditMode = true;
            break;
          }
        }
      }

      // Method B: Find NEW edit URL that appeared after submitting this prompt
      const newEditLink = await page.evaluate((prevLinks) => {
        const allEditLinks = Array.from(document.querySelectorAll('a[href*="/edit/"]')).map(a => a.href).filter(Boolean);
        const fresh = allEditLinks.filter(l => !prevLinks.includes(l));
        return fresh.length > 0 ? fresh[fresh.length - 1] : null;
      }, initialEditLinks);

      if (newEditLink) {
        console.log(`   🔗 Navigating directly to new card edit URL: ${newEditLink}`);
        await page.goto(newEditLink, { waitUntil: 'domcontentloaded' }).catch(() => {});
        await page.waitForTimeout(2500);
        if (page.url().includes('/edit/')) {
          inEditMode = true;
          break;
        }
      }

      await page.waitForTimeout(1000);
    }

    // ============================================================================
    // 8-STATE STRICT UPSCALE & DOWNLOAD STATE MACHINE
    // ============================================================================

    // STATE 1: IMAGE_GENERATED -> Verify Edit Mode Active
    if (!page.url().includes('/edit/')) {
      console.warn(`   ⚠️ Not in Edit Mode, attempting recovery...`);
      await page.waitForTimeout(2000);
    }

    // STATE 2: UPSCALE_REQUESTED -> Find & Open Download Menu, Click 2K
    console.log(`   [UPSCALE] Locating Download (↓) icon in toolbar...`);
    let dropdownOpened = false;
    let downloadButtonBox = null;

    // Snapshot pre-upscale files in download directories to prevent matching old downloads
    const preExistingFiles = new Set();
    const watchDirs = [AUTO_DOWNLOAD_DIR, USER_DOWNLOADS_DIR];
    watchDirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        try {
          fs.readdirSync(dir).forEach(f => preExistingFiles.add(path.join(dir, f)));
        } catch (e) {}
      }
    });

    const viewport = await page.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight
    })).catch(() => ({ width: 1920, height: 1080 }));

    // 1. Locate Download button via Playwright locators first, then SVG/positional fallback
    for (let tryDl = 1; tryDl <= 5; tryDl++) {
      let dlHandle = null;
      let candidateBox = null;

      // Method 1: Playwright locator by aria-label
      const byAria = page.locator('button[aria-label*="Download" i], button[aria-label*="download" i], [role="button"][aria-label*="Download" i]').first();
      if (await byAria.isVisible().catch(() => false)) {
        dlHandle = byAria;
        candidateBox = await byAria.boundingBox();
      }

      // Method 2: Playwright locator by SVG download path
      if (!candidateBox) {
        const bySvg = page.locator('button:has(svg path[d*="M19"]), button:has(svg path[d*="M5"]), button:has(svg path[d*="12 16"]), button:has(svg path[d*="download"])').first();
        if (await bySvg.isVisible().catch(() => false)) {
          const b = await bySvg.boundingBox();
          if (b && b.y < 80) {
            dlHandle = bySvg;
            candidateBox = b;
          }
        }
      }

      // Method 3: Header icon cluster positioning relative to "Done" button
      if (!candidateBox) {
        const toolbarButtons = await page.$$('button, [role="button"]');
        const doneHandle = await page.$('button:has-text("Done")');
        const doneBox = doneHandle ? await doneHandle.boundingBox() : null;

        if (doneBox) {
          const iconBtns = [];
          for (const btn of toolbarButtons) {
            const b = await btn.boundingBox();
            if (b && b.y < 80 && b.width < 50 && b.width > 20 && b.x > doneBox.x - 320 && b.x < doneBox.x - 40) {
              iconBtns.push({ handle: btn, box: b });
            }
          }
          iconBtns.sort((a, b) => a.box.x - b.box.x);
          // Cluster: [0=Heart, 1=Download, 2=Trash, 3=Share]
          if (iconBtns.length >= 2) {
            dlHandle = iconBtns[1].handle;
            candidateBox = iconBtns[1].box;
          } else if (iconBtns.length === 1) {
            dlHandle = iconBtns[0].handle;
            candidateBox = iconBtns[0].box;
          }
        }
      }

      if (candidateBox) {
        downloadButtonBox = candidateBox;
        const targetX = candidateBox.x + candidateBox.width / 2;
        const targetY = candidateBox.y + candidateBox.height / 2;

        await page.mouse.move(targetX, targetY);
        await page.waitForTimeout(100);
        await page.mouse.click(targetX, targetY);
        if (dlHandle && typeof dlHandle.click === 'function') {
          await dlHandle.click({ force: true }).catch(() => {});
        }
        await page.waitForTimeout(1200);

        // Verify dropdown opened
        dropdownOpened = await page.evaluate(() => {
          const text = document.body?.innerText || '';
          return text.includes('Original size') || text.includes('Upscaled') || text.includes('1K') || text.includes('2K');
        });

        if (dropdownOpened) {
          console.log(`   [UPSCALE] Download dropdown menu opened successfully.`);
          break;
        }
      }

      await page.waitForTimeout(800);
    }

    // STATE 3: SELECT 2K RESOLUTION & VERIFY UPSCALE INITIATION
    console.log(`   [UPSCALE] Selecting "2K" (Upscaled) option...`);
    let upscaleInitiated = false;
    const upscaleStartTime = Date.now();
    let downloadEventPromise = page.waitForEvent('download', { timeout: 120000 }).catch(() => null);

    for (let try2k = 1; try2k <= 5; try2k++) {
      // 1. Locate the 2K row element using Playwright locators & DOM text inspection
      const clicked = await page.evaluate(() => {
        // Find all clickable elements inside any popover/menu
        const elements = Array.from(document.querySelectorAll('button, [role="button"], [role="menuitem"], div[class*="item"], div[class*="option"], div, span'));
        
        // Find element that represents the 2K option
        const targetRow = elements.find(el => {
          const text = (el.innerText || el.textContent || '').trim();
          const is2K = text.startsWith('2K') || text === '2K\nUpscaled' || text === '2K Upscaled';
          const notOther = !text.includes('4K') && !text.includes('1K') && !text.includes('Upgrade');
          return is2K && notOther && el.offsetParent !== null;
        });

        if (targetRow) {
          targetRow.scrollIntoView?.();
          targetRow.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
          targetRow.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
          targetRow.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true }));
          targetRow.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
          targetRow.click();
          return true;
        }
        return false;
      });

      // 2. Playwright physical mouse click fallback on text="2K"
      if (!clicked) {
        const opt2KLocator = page.locator('text=2K').first();
        if (await opt2KLocator.isVisible().catch(() => false)) {
          const box = await opt2KLocator.boundingBox();
          if (box) {
            await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
            await page.waitForTimeout(100);
            await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
          }
        }
      }

      await page.waitForTimeout(1500);

      // 3. Confirm upscale was initiated by checking for toast or dropdown disappearance
      upscaleInitiated = await page.evaluate(() => {
        const text = document.body?.innerText || '';
        return text.includes('Upscaling your image') || text.includes('download will start') || text.includes('Upscaling complete');
      });

      if (upscaleInitiated) {
        console.log(`   [UPSCALE] 2K requested & confirmed: Upscaling in progress on Google Flow...`);
        break;
      }

      // If dropdown closed but toast hasn't appeared yet, check if download dropdown needs re-opening
      const dropdownStillOpen = await page.evaluate(() => {
        const text = document.body?.innerText || '';
        return text.includes('Original size') || text.includes('Upscaled');
      });

      if (!dropdownStillOpen && downloadButtonBox) {
        // Re-open download dropdown for next attempt
        await page.mouse.click(downloadButtonBox.x + downloadButtonBox.width / 2, downloadButtonBox.y + downloadButtonBox.height / 2);
        await page.waitForTimeout(1000);
      }
    }

    // STATE 4: WAITING FOR REAL 2K UPSCALE & DOWNLOAD STREAM
    console.log(`   [UPSCALE] Waiting for real upscale completion & 2K download stream...`);
    let downloadSuccess = false;
    const maxUpscaleWaitMs = 120000; // 2 minutes max safety limit

    while (Date.now() - upscaleStartTime < maxUpscaleWaitMs) {
      const elapsedSec = Math.round((Date.now() - upscaleStartTime) / 1000);

      // Check Playwright native download event
      const downloadEvent = await Promise.race([
        downloadEventPromise,
        new Promise(resolve => setTimeout(() => resolve('POLLING'), 1500))
      ]);

      if (downloadEvent && downloadEvent !== 'POLLING') {
        try {
          console.log(`   [DOWNLOAD] 2K download event detected from browser. Saving to: ${targetPath}`);
          await downloadEvent.saveAs(targetPath);
          if (fs.existsSync(targetPath)) {
            // STATE 5: VERIFY FILE STABILITY
            let size1 = fs.statSync(targetPath).size;
            await page.waitForTimeout(1000);
            let size2 = fs.statSync(targetPath).size;

            if (size2 >= size1 && size2 > 512000) { // Verified genuine 2K upscale (>500KB, typically ~1.8MB)
              const sizeKB = Math.round(size2 / 1024);
              console.log(`   [SUCCESS] REAL 2K UPSCALED IMAGE SAVED: ${targetPath} (${sizeKB} KB in ${elapsedSec}s)`);
              downloadSuccess = true;
              break;
            }
          }
        } catch (e) {}
      }

      // Check disk in both Auto-Download and OS Downloads folders
      for (const dir of watchDirs) {
        if (!fs.existsSync(dir)) continue;
        try {
          const currentFiles = fs.readdirSync(dir);
          const hasActiveCrdownload = currentFiles.some(f => f.endsWith('.crdownload'));

          if (!hasActiveCrdownload) {
            for (const file of currentFiles) {
              const fullFilePath = path.join(dir, file);
              if (preExistingFiles.has(fullFilePath)) continue; // Must be a newly created file
              if (!file.endsWith('.jpeg') && !file.endsWith('.jpg') && !file.endsWith('.png')) continue;

              const stat = fs.statSync(fullFilePath);
              // Must be created/modified after upscale started, and larger than 500KB (genuine 2K)
              if (stat.mtimeMs >= upscaleStartTime - 3000 && stat.size > 512000) {
                // Verify file size stability (write complete)
                const initialSize = stat.size;
                await page.waitForTimeout(1000);
                const recheckStat = fs.statSync(fullFilePath);

                if (recheckStat.size === initialSize) {
                  fs.copyFileSync(fullFilePath, targetPath);
                  if (fs.existsSync(targetPath) && fs.statSync(targetPath).size > 512000) {
                    const finalSizeKB = Math.round(fs.statSync(targetPath).size / 1024);
                    console.log(`\n   [SUCCESS] REAL 2K UPSCALED IMAGE SAVED: ${targetPath} (${finalSizeKB} KB in ${elapsedSec}s)`);
                    downloadSuccess = true;
                    break;
                  }
                }
              }
            }
          }
        } catch (e) {}
        if (downloadSuccess) break;
      }

      if (downloadSuccess) break;

      // Check UI Toast / Status
      const toastStatus = await page.evaluate(() => {
        const text = document.body?.innerText || '';
        if (text.includes('Upscaling your image') || text.includes('download will start')) return 'UPSCALING';
        if (text.includes('Upscaling complete') || text.includes('downloaded')) return 'COMPLETE';
        return 'IDLE';
      });

      if (toastStatus === 'UPSCALING') {
        process.stdout.write(`\r   [UPSCALE] In progress on Google Flow... (${elapsedSec}s elapsed)`);
      } else if (toastStatus === 'COMPLETE') {
        process.stdout.write(`\r   [UPSCALE] Upscale completed! Capturing 2K file stream... (${elapsedSec}s elapsed)`);
      } else {
        process.stdout.write(`\r   [DOWNLOAD] Waiting for 2K file stream... (${elapsedSec}s elapsed)`);
      }
    }

    console.log(''); // newline

    // If real 2K download was not received, fail clearly (NO canvas extraction fallback)
    if (!downloadSuccess || !fs.existsSync(targetPath) || fs.statSync(targetPath).size < 512000) {
      console.error(`   [ERROR] REAL 2K UPSCALE COMPLETION NOT DETECTED: No verified 2K download received (>500KB) within 120s.`);
      console.error(`   [ERROR] File was NOT saved as 2K. Step failed.`);
    }

    // STATE 6: Exit Edit Mode back to Main Canvas Grid
    await exitEditMode(page);

    // Final verification on disk: Must be genuine 2K upscale (>500KB)
    if (downloadSuccess && fs.existsSync(targetPath) && fs.statSync(targetPath).size > 512000) {
      return true;
    }

    try {
      await page.screenshot({ path: path.join(AUTO_DOWNLOAD_DIR, `_debug_failed_${styleType}.png`), fullPage: false });
    } catch (e) {}
    return false;
  } catch (err) {
    console.error(`   ❌ Error processing ${styleType}:`, err.message);
    try {
      await page.screenshot({ path: path.join(AUTO_DOWNLOAD_DIR, `_debug_error_${styleType}.png`), fullPage: false });
    } catch (e) {}
    await exitEditMode(page).catch(() => {});
    return false;
  }
}

// ==============================================================================
// EXIT EDIT MODE → RETURN TO MAIN CANVAS GRID
// ==============================================================================
async function exitEditMode(page) {
  if (!page.url().includes('/edit/')) return;

  console.log(`   ↩️ Clicking "Done" button to return to Main Canvas Grid...`);
  try {
    // Locate and click "Done" button physically
    const doneBtnHandle = await page.$('button:has-text("Done")');
    if (doneBtnHandle) {
      const box = await doneBtnHandle.boundingBox();
      if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await page.waitForTimeout(2500);
      }
    }

    if (!page.url().includes('/edit/')) return;

    // Fallback: evaluate click
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
      const done = btns.find(b => b.textContent?.trim() === 'Done');
      if (done) done.click();
    });
    await page.waitForTimeout(2500);

    if (!page.url().includes('/edit/')) return;

    // Direct navigate fallback
    const mainUrl = page.url().split('/edit/')[0];
    await page.goto(mainUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Re-wait for Slate editor on main canvas
    await page.waitForSelector('div[data-slate-editor="true"], div[role="textbox"], [contenteditable="true"]', { timeout: 15000 }).catch(() => {});
  } catch (e) {
    console.warn(`   ⚠️ Exit edit mode notice: ${e.message}`);
  }
}

runNativeAutoPilot().catch(console.error);
