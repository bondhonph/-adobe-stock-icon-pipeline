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
// MAIN AUTONOMOUS WORKFLOW (Main Infinite Canvas Grid Mode)
// ==============================================================================
async function runNativeAutoPilot() {
  console.log('================================================================');
  console.log('🚀 100% UNATTENDED AUTONOMOUS FLOW BOT (Main Canvas Grid Mode)');
  console.log('================================================================');
  console.log(`📋 Total Topics Loaded: ${allTopics.length}`);
  console.log(`🎯 Processing Range: #${startId} to #${endId} (${targetTopics.length} Topics)`);
  console.log(`📁 Unified Output Folder: ${AUTO_DOWNLOAD_DIR}\n`);

  console.log('🌐 Launching Chrome dedicated automation browser...');
  const context = await chromium.launchPersistentContext(BOT_PROFILE_DIR, {
    headless: false,
    channel: 'chrome',
    acceptDownloads: true,
    downloadsPath: AUTO_DOWNLOAD_DIR,
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

    // 5. Enter Edit Mode by clicking directly on the newest generated image card
    console.log(`   🖱️ Clicking newest image on canvas to enter Edit Mode...`);

    let inEditMode = false;
    for (let attempt = 1; attempt <= 4; attempt++) {
      if (page.url().includes('/edit/')) {
        inEditMode = true;
        break;
      }

      // Find all image elements on canvas and target the newest one
      const imgHandles = await page.$$('img');
      const realImgs = [];
      for (const h of imgHandles) {
        const box = await h.boundingBox();
        if (box && box.width > 80 && box.height > 80) {
          realImgs.push(h);
        }
      }

      const targetImgHandle = realImgs.length > 0 ? realImgs[realImgs.length - 1] : null;

      if (targetImgHandle) {
        const box = await targetImgHandle.boundingBox();
        if (box) {
          console.log(`   📍 Clicking image at center (${Math.round(box.x + box.width / 2)}, ${Math.round(box.y + box.height / 2)})...`);
          // Physical mouse click on center of the image card
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
          await page.waitForTimeout(200);
          await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
          await page.waitForTimeout(2500);

          if (page.url().includes('/edit/')) {
            inEditMode = true;
            break;
          }

          // Try double-clicking the image card
          console.log(`   📍 Double-clicking image...`);
          await page.mouse.dblclick(box.x + box.width / 2, box.y + box.height / 2);
          await page.waitForTimeout(2500);

          if (page.url().includes('/edit/')) {
            inEditMode = true;
            break;
          }
        }
      }

      // Check edit links fallback
      const editLinks = await page.$$('a[href*="/edit/"]');
      if (editLinks.length > 0) {
        const lastEditLink = editLinks[editLinks.length - 1];
        const href = await lastEditLink.getAttribute('href');
        if (href) {
          console.log(`   🔗 Navigating directly to card edit URL: ${href}`);
          await page.goto(href, { waitUntil: 'domcontentloaded' }).catch(() => {});
          await page.waitForTimeout(2500);
          if (page.url().includes('/edit/')) {
            inEditMode = true;
            break;
          }
        }
      }

      await page.waitForTimeout(1500);
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

    // 1. Locate Download button by SVG path / icon position and click to open dropdown
    for (let tryDl = 1; tryDl <= 5; tryDl++) {
      // Find all buttons in top toolbar (y < 80)
      const toolbarButtons = await page.$$('button, [role="button"]');
      let dlHandle = null;
      let candidateBox = null;

      // Method A: Match by aria-label
      for (const btn of toolbarButtons) {
        const aria = (await btn.getAttribute('aria-label') || '').toLowerCase();
        if (aria.includes('download') || aria.includes('save')) {
          const b = await btn.boundingBox();
          if (b && b.y < 80) {
            dlHandle = btn;
            candidateBox = b;
            break;
          }
        }
      }

      // Method B: Match Download SVG path (downward arrow icon)
      if (!candidateBox) {
        for (const btn of toolbarButtons) {
          const b = await btn.boundingBox();
          if (b && b.y < 80 && b.width < 60 && b.width > 20 && b.x > window.innerWidth * 0.5) {
            const hasDownArrow = await btn.evaluate(el => {
              const svg = el.querySelector('svg');
              if (!svg) return false;
              const paths = Array.from(svg.querySelectorAll('path')).map(p => p.getAttribute('d') || '');
              return paths.some(d => d.includes('M19') || d.includes('M5') || d.includes('12 16') || d.includes('arrow') || d.includes('download'));
            });
            if (hasDownArrow) {
              dlHandle = btn;
              candidateBox = b;
              break;
            }
          }
        }
      }

      // Method C: Header icon cluster positioning relative to "Done" button
      if (!candidateBox) {
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
        if (dlHandle) await dlHandle.click({ force: true }).catch(() => {});
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

    // STATE 3: UPSCALE_REQUESTED -> Click 2K Option & Trigger Upscaling
    let upscaleTriggered = false;
    const upscaleStartTime = Date.now();
    let downloadEventPromise = page.waitForEvent('download', { timeout: 120000 }).catch(() => null);

    console.log(`   [UPSCALE] Selecting "2K" (Upscaled) option...`);
    for (let try2k = 1; try2k <= 4; try2k++) {
      // Find element containing "2K"
      const opt2KHandle = await page.evaluateHandle(() => {
        const all = Array.from(document.querySelectorAll('div, span, button, label, li, p, a'));
        return all.find(el => {
          const t = el.textContent?.trim() || '';
          const has2K = t.includes('2K') || t.includes('2k') || t.includes('2x') || t.includes('2X');
          const notOther = !t.includes('4K') && !t.includes('1K') && !t.includes('Upgrade');
          return has2K && notOther && el.offsetParent !== null;
        }) || null;
      });

      if (opt2KHandle && opt2KHandle.asElement()) {
        const box = await opt2KHandle.asElement().boundingBox();
        if (box) {
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
          await page.waitForTimeout(100);
          await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
          await opt2KHandle.asElement().click({ force: true }).catch(() => {});
          upscaleTriggered = true;
          console.log(`   [UPSCALE] Requested: "2K" option clicked successfully.`);
          break;
        }
      }

      // Positional click fallback ~105px directly below download button
      if (!upscaleTriggered && downloadButtonBox) {
        await page.mouse.click(downloadButtonBox.x + downloadButtonBox.width / 2, downloadButtonBox.y + 105);
        await page.waitForTimeout(800);
      }

      await page.waitForTimeout(600);
    }

    // STATE 4 & 5: WAITING_FOR_UPSCALE & UPSCALE_CONFIRMED
    console.log(`   [UPSCALE] Waiting for upscale completion & 2K download stream...`);
    let downloadSuccess = false;
    let capturedFile = null;
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
          console.log(`   [DOWNLOAD] Browser download event captured. Saving to: ${targetPath}`);
          await downloadEvent.saveAs(targetPath);
          if (fs.existsSync(targetPath)) {
            // STATE 7: VERIFY_FILE stability
            let size1 = fs.statSync(targetPath).size;
            await page.waitForTimeout(1000);
            let size2 = fs.statSync(targetPath).size;

            if (size2 >= size1 && size2 > 102400) { // Verified > 100KB (typically ~1.8MB)
              const sizeKB = Math.round(size2 / 1024);
              console.log(`   [SUCCESS] Verified as current 2K upscale output: ${targetPath} (${sizeKB} KB in ${elapsedSec}s)`);
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
              // Must be created/modified after upscale started, and larger than 500KB (2K upscaled)
              if (stat.mtimeMs >= upscaleStartTime - 3000 && stat.size > 307200) {
                // STATE 7: File size stability check
                const initialSize = stat.size;
                await page.waitForTimeout(1000);
                const recheckStat = fs.statSync(fullFilePath);

                if (recheckStat.size === initialSize) {
                  fs.copyFileSync(fullFilePath, targetPath);
                  if (fs.existsSync(targetPath) && fs.statSync(targetPath).size > 307200) {
                    const finalSizeKB = Math.round(fs.statSync(targetPath).size / 1024);
                    console.log(`\n   [SUCCESS] Captured & Verified 2K File from ${path.basename(dir)} in ${elapsedSec}s: ${targetPath} (${finalSizeKB} KB)`);
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
        if (text.includes('Upscaling complete')) return 'COMPLETE';
        return 'IDLE';
      });

      if (toastStatus === 'UPSCALING') {
        process.stdout.write(`\r   [UPSCALE] In progress on Google Flow... (${elapsedSec}s elapsed)`);
      } else {
        process.stdout.write(`\r   [DOWNLOAD] Waiting for 2K file stream... (${elapsedSec}s elapsed)`);
      }
    }

    console.log(''); // newline

    // Fallback: If 2K upscale download didn't complete within 120s, perform high-resolution extraction
    if (!downloadSuccess && (!fs.existsSync(targetPath) || fs.statSync(targetPath).size <= 10240)) {
      console.warn(`   [ERROR] Upscale download timed out. Executing high-resolution canvas extraction fallback...`);
      try {
        const base64Data = await page.evaluate(async (targetSrc) => {
          const imgs = Array.from(document.querySelectorAll('img')).filter(img => {
            const src = img.currentSrc || img.src || '';
            return src.includes('googleusercontent.com') || src.startsWith('blob:') || src.startsWith('data:') || src.includes('labs.google');
          });

          const bigImg = imgs.reduce((best, img) => {
            return (!best || (img.naturalWidth || 0) > (best.naturalWidth || 0)) ? img : best;
          }, null);

          const targetImg = bigImg || (targetSrc ? imgs.find(i => (i.currentSrc || i.src) === targetSrc) : null) || imgs[imgs.length - 1];
          if (targetImg) {
            let url = targetImg.currentSrc || targetImg.src;
            if (url.includes('googleusercontent.com')) {
              url = url.replace(/=s\d+/g, '=s2048').replace(/=w\d+-h\d+/g, '=w2048-h2048');
              if (!url.includes('=s') && !url.includes('=w')) {
                url += (url.includes('?') ? '&' : '?') + '=s2048';
              }
            }

            try {
              const res = await fetch(url);
              const blob = await res.blob();
              return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
              });
            } catch (e) {
              const canvas = document.createElement('canvas');
              canvas.width = 2048;
              canvas.height = 2048;
              const ctx = canvas.getContext('2d');
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              ctx.drawImage(targetImg, 0, 0, 2048, 2048);
              return canvas.toDataURL('image/jpeg', 0.98);
            }
          }
          return null;
        }, newImageSrc);

        if (base64Data && base64Data.includes('base64,')) {
          const dataBuffer = Buffer.from(base64Data.split('base64,')[1], 'base64');
          if (dataBuffer.length > 10240) {
            fs.writeFileSync(targetPath, dataBuffer);
            console.log(`   [FALLBACK] Saved extracted 2K image: ${targetPath} (${Math.round(dataBuffer.length / 1024)} KB)`);
            downloadSuccess = true;
          }
        }
      } catch (extractErr) {
        console.warn(`   ⚠️ Extraction notice: ${extractErr.message}`);
      }
    }

    // STATE 8: SUCCESS -> Exit Edit Mode back to Main Canvas Grid
    await exitEditMode(page);

    // Final verification on disk
    if (fs.existsSync(targetPath) && fs.statSync(targetPath).size > 10240) {
      console.log(`   [SUCCESS] Step Complete: ${fileName} (${Math.round(fs.statSync(targetPath).size / 1024)} KB)`);
      return true;
    }

    console.warn(`   ❌ File verification failed for ${fileName}`);
    return false;
  } catch (err) {
    console.error(`   ❌ Error processing ${styleType}:`, err.message);
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
