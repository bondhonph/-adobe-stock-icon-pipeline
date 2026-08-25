const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// ==============================================================================
// CONFIGURATION & PATHS (All images saved into single "Auto-Download" folder)
// ==============================================================================
const WORKSPACE_DIR = path.resolve(__dirname, '..', '..');
const APP_DIR = path.resolve(__dirname, '..');
const BOT_PROFILE_DIR = path.join(WORKSPACE_DIR, '.flow_bot_chrome_profile');
const AUTO_DOWNLOAD_DIR = path.join(WORKSPACE_DIR, 'Auto-Download');
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
// MAIN AUTONOMOUS WORKFLOW (Strict 1-by-1 Generate -> Download Sequence)
// ==============================================================================
async function runNativeAutoPilot() {
  console.log('================================================================');
  console.log('🚀 100% UNATTENDED AUTONOMOUS FLOW BOT (Enhanced New Data Engine)');
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

    // STEP 1: Generate Line Art -> Immediately Download & Save Line Art
    let lineArtSuccess = false;
    if (!fs.existsSync(lineArtTarget) || fs.statSync(lineArtTarget).size < 10240) {
      console.log(`🎨 [1/2] Processing Line Art (Generate ➡️ Download)...`);
      lineArtSuccess = await executeFlowStepWithRetry(page, lineArt, 'Line Art', AUTO_DOWNLOAD_DIR, lineArtFileName);
    } else {
      console.log(`   ⏩ Line Art already exists on disk.`);
      lineArtSuccess = true;
    }

    // Brief pause between images
    await page.waitForTimeout(2000);

    // STEP 2: Generate Solid Fill -> Immediately Download & Save Solid Fill
    let solidSuccess = false;
    if (!fs.existsSync(solidTarget) || fs.statSync(solidTarget).size < 10240) {
      console.log(`🎨 [2/2] Processing Solid Fill (Generate ➡️ Download)...`);
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
// STEP-BY-STEP PROMPT GENERATION & IMMEDIATE DOWNLOAD (With Retry)
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

    // 1. Snapshot all existing image src URLs BEFORE submitting new prompt
    const initialImgSrcs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('img')).map(img => img.currentSrc || img.src).filter(Boolean);
    });

    // 2. Focus & Clear Slate Editor
    const editor = await page.$('div[data-slate-editor="true"], div[role="textbox"], [contenteditable="true"]');
    if (!editor) {
      console.log('❌ Could not find prompt editor');
      return false;
    }

    await editor.click();
    await page.waitForTimeout(200);

    // Clear editor via DOM and keyboard
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
    console.log(`   🚀 Submitting ${styleType} prompt to Google Flow...`);
    
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

    // 4. Actively Monitor for the NEW UNIQUE Image to appear and finish rendering
    console.log(`   ⏳ Monitoring canvas for NEW ${styleType} image (waiting for fresh render)...`);
    let newImageSrc = null;
    const startTime = Date.now();
    const maxWaitMs = 65000;
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
          const isSpinner = !!img.closest('[class*="loading"], [class*="spinner"]') || (img.naturalWidth > 0 && img.naturalWidth < 100);
          return isReal && !isSpinner;
        });

        // Find the newest image that was NOT present before
        const fresh = imgs.find(img => !prevSrcs.includes(img.currentSrc || img.src));
        const isSpinning = !!document.querySelector('div[class*="loading" i], div[class*="spinner" i], div[class*="progress" i], [aria-busy="true"], div[role="progressbar"]');

        if (fresh && fresh.complete && !isSpinning && (fresh.naturalWidth >= 200 || (fresh.src && fresh.src.startsWith('blob:')))) {
          return { found: true, src: fresh.currentSrc || fresh.src, width: fresh.naturalWidth, height: fresh.naturalHeight };
        }

        return { found: false, isSpinning, count: imgs.length };
      }, initialImgSrcs);

      if (check.found && Date.now() - startTime > 12000) {
        stableCount++;
        if (stableCount >= 2) {
          newImageSrc = check.src;
          console.log(`   ✨ NEW ${styleType} image rendered (${check.width}x${check.height})!`);
          break;
        }
      } else {
        stableCount = 0;
      }
    }

    // 5. Trigger 2x Upscale & Download
    console.log(`   💾 Downloading & saving ${styleType} image...`);
    
    // Set up download event listener
    const downloadPromise = page.waitForEvent('download', { timeout: 6000 }).catch(() => null);

    // Try UI 2x / Download buttons
    try {
      const cards = await page.$$('div[class*="node"], div[class*="card"], img, canvas');
      if (cards.length > 0) {
        const latestCard = cards[cards.length - 1];
        await latestCard.hover({ force: true, timeout: 1000 }).catch(() => {});
        await latestCard.click({ force: true, timeout: 1000 }).catch(() => {});
        await page.waitForTimeout(300);

        const menuBtn = await latestCard.$('button');
        if (menuBtn) {
          await menuBtn.click({ force: true, timeout: 1000 }).catch(() => {});
          await page.waitForTimeout(400);

          await page.evaluate(() => {
            const items = Array.from(document.querySelectorAll('div, span, button, li, a'));
            const dl = items.find(el => el.textContent?.trim().toLowerCase() === 'download');
            if (dl) dl.click();
            const it2x = items.find(el => el.textContent?.trim().includes('2x') || el.textContent?.trim().includes('2X') || el.textContent?.trim().includes('Upscale'));
            if (it2x) it2x.click();
          }).catch(() => {});
        }
      }
    } catch (e) {}

    const download = await downloadPromise;
    if (download) {
      try {
        await download.saveAs(targetPath);
        if (fs.existsSync(targetPath) && fs.statSync(targetPath).size > 10240) {
          console.log(`   ✅ Saved via Download Event: ${targetPath} (${Math.round(fs.statSync(targetPath).size / 1024)} KB)`);
          return true;
        }
      } catch (e) {}
    }

    // 6. Direct Extraction of the SPECIFIC NEW IMAGE from browser memory
    console.log(`   🔄 Extracting High-Res Image Buffer from Canvas...`);
    try {
      const base64Data = await page.evaluate(async (targetSrc) => {
        const imgs = Array.from(document.querySelectorAll('img')).filter(img => {
          const src = img.currentSrc || img.src || '';
          return src.includes('googleusercontent.com') || src.startsWith('blob:') || src.startsWith('data:') || src.includes('labs.google');
        });

        const targetImg = (targetSrc ? imgs.find(i => (i.currentSrc || i.src) === targetSrc) : null) || imgs[imgs.length - 1];
        if (targetImg) {
          try {
            const res = await fetch(targetImg.src);
            const blob = await res.blob();
            return new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.readAsDataURL(blob);
            });
          } catch (e) {
            const canvas = document.createElement('canvas');
            canvas.width = targetImg.naturalWidth || 2048;
            canvas.height = targetImg.naturalHeight || 2048;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(targetImg, 0, 0);
            return canvas.toDataURL('image/jpeg', 0.98);
          }
        }
        return null;
      }, newImageSrc);

      if (base64Data && base64Data.includes('base64,')) {
        const dataBuffer = Buffer.from(base64Data.split('base64,')[1], 'base64');
        if (dataBuffer.length > 10240) {
          fs.writeFileSync(targetPath, dataBuffer);
          console.log(`   ✅ Saved High-Res Image: ${targetPath} (${Math.round(dataBuffer.length / 1024)} KB)`);
          return true;
        }
      }
    } catch (extractErr) {
      console.warn(`   ⚠️ Extraction notice: ${extractErr.message}`);
    }

    // Final check
    if (fs.existsSync(targetPath) && fs.statSync(targetPath).size > 10240) {
      console.log(`   ✅ Saved & Verified: ${targetPath}`);
      return true;
    }

    console.warn(`   ⚠️ File verification failed for ${fileName}`);
    return false;
  } catch (err) {
    console.error(`   ❌ Error processing ${styleType}:`, err.message);
    return false;
  }
}

runNativeAutoPilot().catch(console.error);
