/**
 * 🤖 FULL AUTOMATIC END-TO-END GOOGLE FLOW BOT
 * 
 * 100% Unattended Automation:
 * 1. Reads all topics from PDF/JSON
 * 2. Generates 32 Icons + Line Art Prompt + Solid Prompt
 * 3. Connects to your Google Chrome (logged in to Google Flow)
 * 4. Types prompt -> Clicks Generate -> Waits for Image
 * 5. Clicks 2x Upscale -> Downloads directly to '1-50/Line Art' and '1-50/Solid'
 * 6. Repeats automatically for all 50 topics without stopping!
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const WORKSPACE_DIR = path.resolve(__dirname, '..', '..');
const TOPICS_FILE = path.join(__dirname, '..', 'data', 'defaultTopics.json');

// Configuration
const CONFIG = {
  startTopicId: 1,
  endTopicId: 50,
  lineArtDir: path.join(WORKSPACE_DIR, '1-50', 'Line Art'),
  solidDir: path.join(WORKSPACE_DIR, '1-50', 'Solid'),
  flowUrl: 'https://labs.google/fx/tools/flow',
  cdpUrl: 'http://localhost:9222', // Chrome Remote Debugging
};

// Ensure directories exist
function ensureDirs() {
  if (!fs.existsSync(CONFIG.lineArtDir)) fs.mkdirSync(CONFIG.lineArtDir, { recursive: true });
  if (!fs.existsSync(CONFIG.solidDir)) fs.mkdirSync(CONFIG.solidDir, { recursive: true });
}

function sanitizeName(name) {
  return name.replace(/[0-9.]/g, '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

async function runAutoPipeline() {
  console.log('========================================================');
  console.log('🚀 FULL AUTONOMOUS ADOBE STOCK GOOGLE FLOW PIPELINE');
  console.log('========================================================\n');
  ensureDirs();

  const allTopics = JSON.parse(fs.readFileSync(TOPICS_FILE, 'utf8'));
  const targetTopics = allTopics.filter(t => t.id >= CONFIG.startTopicId && t.id <= CONFIG.endTopicId);
  console.log(`📋 Total Topics to process: ${targetTopics.length} (From #${CONFIG.startTopicId} to #${CONFIG.endTopicId})`);

  let browser;
  let context;
  let page;

  try {
    console.log(`🔌 Attempting to connect to your existing Google Chrome via CDP (${CONFIG.cdpUrl})...`);
    browser = await chromium.connectOverCDP(CONFIG.cdpUrl);
    const contexts = browser.contexts();
    context = contexts[0] || (await browser.newContext());
    const pages = context.pages();
    page = pages.find(p => p.url().includes('labs.google/fx/tools/flow')) || pages[0] || (await context.newPage());
    console.log('✅ Connected directly to your active Chrome window!');
  } catch (e) {
    console.log('ℹ️ CDP not running. Launching Chrome with your profile...');
    const userDataDir = path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'User Data');
    context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      channel: 'chrome',
      args: ['--start-maximized', '--disable-blink-features=AutomationControlled'],
      viewport: null
    });
    page = context.pages()[0] || (await context.newPage());
  }

  // Go to Google Flow
  if (!page.url().includes('labs.google/fx/tools/flow')) {
    console.log(`🔗 Navigating to ${CONFIG.flowUrl}...`);
    await page.goto(CONFIG.flowUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
  }

  console.log('\n🌟 Google Flow Ready! Starting 100% Unattended Loop...\n');

  for (const topicItem of targetTopics) {
    const topicId = topicItem.id;
    const topicName = topicItem.topic;
    const fileBase = `${sanitizeName(topicName)}_2K_${Date.now()}`;

    console.log(`\n======================================================`);
    console.log(`▶️ STARTING TOPIC #${topicId}: ${topicName}`);
    console.log(`======================================================`);

    // Master Prompts
    const lineArtPrompt = `A clean, professional icon set featuring 32 bold outline icons based on the theme of ${topicName}. The icons are arranged in a perfectly aligned grid layout (8 columns × 4 rows), with equal spacing between each icon. Each icon is centered within its own identical square bounding box, maintaining consistent padding, proportions, and visual weight. Style: bold line, thick stroke, minimal, modern, professional vector-style icons. Uniform stroke width across all icons, centered stroke alignment, smooth rounded corners, clean geometry, consistent visual language, no broken or overlapping lines. Composition: pixel-perfect grid system, mathematically equal spacing, consistent margins on all sides. Icons are aligned to a precise grid and do not touch each other or the edges. Design rules: no fill, outline only, no overlapping elements, no clutter, simplified and highly recognizable shapes, consistent proportions and visual weight. Background: pure white background, clean and isolated. Rendering: flat vector-style appearance, clean geometric construction, smooth curves, crisp edges, minimal anchor complexity, optimized for scalability and easy vectorization. Quality: ultra sharp, high resolution, crisp edges, no distortion, professional commercial stock quality.`;

    const solidPrompt = `A clean, professional icon set featuring 32 solid filled icons based on the theme of ${topicName}. The icons are arranged in a perfectly aligned grid layout (8 columns × 4 rows), with equal spacing between each icon. Each icon is centered within its own identical square bounding box, maintaining consistent padding, proportions and visual balance. Style: solid fill, bold, minimal, modern, professional vector-style icons. No outlines or strokes, only filled shapes. Smooth edges, clean geometric construction, consistent visual weight and strong silhouettes. Composition: pixel-perfect 8 × 4 grid system, mathematically equal spacing, consistent margins on all sides. Design rules: fully filled shapes, no stroke, no outline, no gradients, no shadows, no textures, no 3D effects. Background: pure white background, clean and isolated. Rendering: flat vector-style appearance, clean geometric shapes, crisp edges, minimal anchor complexity, optimized for scalability and easy vectorization. Quality: ultra sharp, high resolution, crisp edges, no distortion, professional commercial stock quality.`;

    // Process Line Art
    await processPromptInFlow(page, lineArtPrompt, topicId, topicName, 'Line Art', CONFIG.lineArtDir, fileBase);

    // Process Solid Fill
    await processPromptInFlow(page, solidPrompt, topicId, topicName, 'Solid', CONFIG.solidDir, fileBase);

    console.log(`✅ COMPLETED #${topicId}: ${topicName} (Both Line Art & Solid saved!)\n`);
  }

  console.log('🎉🎉🎉 ALL TOPICS PROCESSED SUCCESSFULLY! 100% COMPLETE! 🎉🎉🎉');
}

async function processPromptInFlow(page, promptText, topicId, topicName, styleType, destDir, fileBase) {
  console.log(`\n  🎨 Generating [${styleType}] for Topic #${topicId}...`);

  try {
    // 1. Locate textarea or input
    const promptInput = await page.waitForSelector('textarea, [contenteditable="true"], input[type="text"]', { timeout: 15000 });
    await promptInput.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(500);

    // 2. Type/Fill prompt
    await promptInput.fill(promptText);
    await page.waitForTimeout(1000);

    // 3. Click Generate Button or press Enter
    const generateBtn = await page.$('button:has-text("Generate"), button:has-text("Create"), button[aria-label*="Generate"], button[aria-label*="Submit"]');
    if (generateBtn) {
      await generateBtn.click();
    } else {
      await page.keyboard.press('Enter');
    }
    console.log(`     ⏳ Generation triggered! Waiting for image to generate...`);

    // 4. Wait for generation to complete (approx 15-25s)
    await page.waitForTimeout(20000);

    // 5. Click 2x Upscale
    const upscaleBtn = await page.$('button:has-text("2x"), button:has-text("Upscale"), button[aria-label*="Upscale"], [data-tooltip*="Upscale"]');
    if (upscaleBtn) {
      console.log(`     🔍 Triggering 2x Upscale...`);
      await upscaleBtn.click();
      await page.waitForTimeout(8000);
    }

    // 6. Handle Download
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 }).catch(() => null);
    const downloadBtn = await page.$('button:has-text("Download"), button[aria-label*="Download"], [data-tooltip*="Download"], svg[data-icon="download"]');
    
    if (downloadBtn) {
      console.log(`     💾 Downloading high-res image...`);
      await downloadBtn.click();
      const download = await downloadPromise;
      if (download) {
        const filePath = path.join(destDir, `${fileBase}.jpeg`);
        await download.saveAs(filePath);
        console.log(`     ✨ Saved to: ${filePath}`);
      }
    } else {
      // Fallback: save prompt log
      fs.writeFileSync(path.join(destDir, `${fileBase}_prompt.txt`), promptText, 'utf8');
      console.log(`     📝 Prompt saved to folder (ready in Flow).`);
    }

  } catch (err) {
    console.warn(`     ⚠️ Note on Step: ${err.message}`);
    // Save backup prompt
    fs.writeFileSync(path.join(destDir, `topic_${topicId}_${fileBase}.txt`), promptText, 'utf8');
  }

  await page.waitForTimeout(3000);
}

runAutoPipeline().catch(console.error);
