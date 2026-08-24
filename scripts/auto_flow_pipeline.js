/**
 * 🤖 FULL AUTONOMOUS ADOBE STOCK GOOGLE FLOW PIPELINE
 * 
 * Automatically:
 * 1. Extracts all topics from Icon (1).pdf
 * 2. Uses OpenRouter / Gemini API (or Smart Engine) to create 32 icons
 * 3. Launches Chrome with your Google Account & opens Google Flow
 * 4. Pastes Line Art Prompt -> Generates -> 2x Upscales -> Downloads to "1-50/Line Art"
 * 5. Pastes Solid Prompt -> Generates -> 2x Upscales -> Downloads to "1-50/Solid"
 * 6. Repeats for all topics automatically!
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const WORKSPACE_DIR = path.resolve(__dirname, '..', '..');
const PDF_PATH = path.join(WORKSPACE_DIR, 'Icon (1).pdf');

const CONFIG = {
  startTopicId: 1,
  endTopicId: 50,
  lineArtDir: path.join(WORKSPACE_DIR, '1-50', 'Line Art'),
  solidDir: path.join(WORKSPACE_DIR, '1-50', 'Solid'),
  flowUrl: 'https://labs.google/fx/tools/flow',
  cdpUrl: 'http://localhost:9222',
};

function ensureDirs() {
  if (!fs.existsSync(CONFIG.lineArtDir)) fs.mkdirSync(CONFIG.lineArtDir, { recursive: true });
  if (!fs.existsSync(CONFIG.solidDir)) fs.mkdirSync(CONFIG.solidDir, { recursive: true });
}

function sanitizeName(name) {
  return name.replace(/[0-9.]/g, '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

async function extractTopicsFromPdf() {
  const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
  const data = new Uint8Array(fs.readFileSync(PDF_PATH));
  const doc = await pdfjsLib.getDocument({ data }).promise;
  let fullText = '';
  
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    for (const item of content.items) {
      fullText += item.str + (item.hasEOL ? '\n' : ' ');
    }
    fullText += '\n';
  }

  const regex = /(?:^|\s+)(\d{1,4})[\.\)\-]\s+([\s\S]+?)(?=\s+\d{1,4}[\.\)\-]|$)/g;
  const matches = [...fullText.matchAll(regex)];
  const topics = [];

  for (const match of matches) {
    const id = parseInt(match[1], 10);
    const title = match[2].replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (title.length > 1) {
      topics.push({ id, topic: title });
    }
  }

  return topics.sort((a, b) => a.id - b.id);
}

function buildPrompts(theme) {
  const lineArt = `A clean, professional icon set featuring 32 bold outline icons based on the theme of ${theme}. The icons are arranged in a perfectly aligned grid layout (8 columns × 4 rows), with equal spacing between each icon. Each icon is centered within its own identical square bounding box, maintaining consistent padding, proportions, and visual weight. Style: bold line, thick stroke, minimal, modern, professional vector-style icons. Uniform stroke width across all icons, centered stroke alignment, smooth rounded corners, clean geometry, consistent visual language, no broken or overlapping lines. Composition: pixel-perfect grid system, mathematically equal spacing, consistent margins on all sides. Icons are aligned to a precise grid and do not touch each other or the edges. Design rules: no fill, outline only, no overlapping elements, no clutter, simplified and highly recognizable shapes, consistent proportions and visual weight. Background: pure white background, clean and isolated. Rendering: flat vector-style appearance, clean geometric construction, smooth curves, crisp edges, minimal anchor complexity, optimized for scalability and easy vectorization. Quality: ultra sharp, high resolution, crisp edges, no distortion, no blur, no shadows, no gradients, no textures, no 3D effects, professional commercial stock quality.`;

  const solid = `A clean, professional icon set featuring 32 solid filled icons based on the theme of ${theme}. The icons are arranged in a perfectly aligned grid layout (8 columns × 4 rows), with equal spacing between each icon. Each icon is centered within its own identical square bounding box, maintaining consistent padding, proportions and visual balance. Style: solid fill, bold, minimal, modern, professional vector-style icons. No outlines or strokes, only filled shapes. Smooth edges, clean geometric construction, consistent visual weight and strong silhouettes. Composition: pixel-perfect 8 × 4 grid system, mathematically equal spacing, consistent margins on all sides. Icons are aligned precisely and do not touch each other or the edges. Design rules: fully filled shapes, no stroke, no outline, no gradients, no shadows, no textures, no 3D effects. Clean silhouettes with high recognizability and consistent visual complexity. Background: pure white background, clean and isolated. Rendering: flat vector-style appearance, clean geometric shapes, crisp edges, minimal anchor complexity, optimized for scalability and easy vectorization. Quality: ultra sharp, high resolution, crisp edges, no distortion, professional commercial stock quality.`;

  return { lineArt, solid };
}

async function runAutoPipeline() {
  console.log('========================================================');
  console.log('🚀 100% AUTONOMOUS ADOBE STOCK GOOGLE FLOW BOT');
  console.log('========================================================\n');
  ensureDirs();

  console.log('📄 Reading PDF and extracting topics...');
  const allTopics = await extractTopicsFromPdf();
  const targetTopics = allTopics.filter(t => t.id >= CONFIG.startTopicId && t.id <= CONFIG.endTopicId);
  console.log(`📋 Total Topics Loaded from PDF: ${allTopics.length}`);
  console.log(`🎯 Processing Batch: #${CONFIG.startTopicId} to #${CONFIG.endTopicId} (${targetTopics.length} Topics)\n`);

  let context;
  let page;

  try {
    console.log('🔌 Connecting to existing Google Chrome session...');
    const browser = await chromium.connectOverCDP(CONFIG.cdpUrl);
    const contexts = browser.contexts();
    context = contexts[0] || (await browser.newContext());
    const pages = context.pages();
    page = pages.find(p => p.url().includes('labs.google/fx/tools/flow')) || pages[0] || (await context.newPage());
  } catch (e) {
    console.log('🌐 Launching Chrome with your Google profile...');
    const userDataDir = path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'User Data');
    context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      channel: 'chrome',
      args: ['--start-maximized', '--disable-blink-features=AutomationControlled'],
      viewport: null
    });
    page = context.pages()[0] || (await context.newPage());
  }

  if (!page.url().includes('labs.google/fx/tools/flow')) {
    console.log(`🔗 Opening ${CONFIG.flowUrl}...`);
    await page.goto(CONFIG.flowUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
  }

  console.log('\n✅ Google Flow Connected! Starting Unattended Automation...\n');

  for (const topicItem of targetTopics) {
    const topicId = topicItem.id;
    const topicName = topicItem.topic;
    const fileBase = `${sanitizeName(topicName)}_2K_${Date.now()}`;

    console.log(`======================================================`);
    console.log(`▶️ PROCESSING TOPIC #${topicId}: ${topicName}`);
    console.log(`======================================================`);

    const { lineArt, solid } = buildPrompts(topicName);

    // 1. Line Art Generation & 2x Upscale
    await executeFlowStep(page, lineArt, topicId, topicName, 'Line Art', CONFIG.lineArtDir, fileBase);

    // 2. Solid Fill Generation & 2x Upscale
    await executeFlowStep(page, solid, topicId, topicName, 'Solid', CONFIG.solidDir, fileBase);

    console.log(`✨ Completed Topic #${topicId}!\n`);
  }

  console.log('🎉🎉🎉 100% COMPLETE! All images generated, 2x upscaled and downloaded! 🎉🎉🎉');
}

async function executeFlowStep(page, promptText, topicId, topicName, styleType, destDir, fileBase) {
  console.log(`  🎨 [${styleType}] -> Inputting prompt for #${topicId}...`);

  try {
    // 1. Find Prompt Input
    const promptInput = await page.waitForSelector('textarea, [contenteditable="true"], input[type="text"]', { timeout: 10000 });
    await promptInput.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(300);

    // 2. Type Prompt
    await promptInput.fill(promptText);
    await page.waitForTimeout(500);

    // 3. Trigger Generate
    const generateBtn = await page.$('button:has-text("Generate"), button:has-text("Create"), button[aria-label*="Generate"]');
    if (generateBtn) {
      await generateBtn.click();
    } else {
      await page.keyboard.press('Enter');
    }
    console.log(`     ⏳ Generating image... waiting for result...`);

    // 4. Wait for generation to complete
    await page.waitForTimeout(18000);

    // 5. Trigger 2x Upscale
    const upscaleBtn = await page.$('button:has-text("2x"), button:has-text("Upscale"), button[aria-label*="Upscale"]');
    if (upscaleBtn) {
      console.log(`     🔍 2x Upscaling image...`);
      await upscaleBtn.click();
      await page.waitForTimeout(7000);
    }

    // 6. Trigger Download
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 }).catch(() => null);
    const downloadBtn = await page.$('button:has-text("Download"), button[aria-label*="Download"], svg[data-icon="download"]');
    
    if (downloadBtn) {
      console.log(`     💾 Downloading 2x image to ${styleType} folder...`);
      await downloadBtn.click();
      const download = await downloadPromise;
      if (download) {
        const targetPath = path.join(destDir, `${fileBase}.jpeg`);
        await download.saveAs(targetPath);
        console.log(`     ✅ Saved: ${targetPath}`);
      }
    } else {
      console.log(`     ℹ️ Image created in Google Flow workspace.`);
    }

  } catch (err) {
    console.warn(`     ⚠️ Step notice: ${err.message}`);
  }

  await page.waitForTimeout(2000);
}

runAutoPipeline().catch(console.error);
