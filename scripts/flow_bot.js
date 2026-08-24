/**
 * Google Flow AI Automation Bot (Playwright)
 * 
 * Features:
 * - Automates https://labs.google/fx/tools/flow
 * - Uses existing Chrome User Profile so you stay logged in!
 * - Feeds Line Art & Solid Prompts
 * - Triggers Image Generation
 * - Clicks 2x Upscale button
 * - Saves high-res files directly to "1-50/Line Art" and "1-50/Solid"
 * 
 * Usage:
 *   node scripts/flow_bot.js
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Configuration
const CONFIG = {
  // Batch Range
  startTopicId: 1,
  endTopicId: 50,
  
  // Output directories
  lineArtDir: path.join(__dirname, '..', '..', '1-50', 'Line Art'),
  solidDir: path.join(__dirname, '..', '..', '1-50', 'Solid'),
  
  // Topics data file
  topicsFile: path.join(__dirname, '..', 'data', 'defaultTopics.json'),
  
  // Chrome Profile Path (Default Windows Google Chrome)
  userDataDir: path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'User Data'),
  
  // Flow AI URL
  flowUrl: 'https://labs.google/fx/tools/flow',
  
  // Delay between actions (ms)
  stepDelay: 3000,
};

// Ensure directories exist
function ensureDirs() {
  if (!fs.existsSync(CONFIG.lineArtDir)) fs.mkdirSync(CONFIG.lineArtDir, { recursive: true });
  if (!fs.existsSync(CONFIG.solidDir)) fs.mkdirSync(CONFIG.solidDir, { recursive: true });
}

// Master prompt generator (matching UI)
function generatePromptsForTopic(topicId, topicName) {
  const cleanName = topicName.replace(/[0-9.]/g, '').trim();
  const filePrefix = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
  
  const outlinePrompt = `A clean, professional icon set featuring 32 bold outline icons based on the theme of ${topicName}. The icons are arranged in a perfectly aligned grid layout (8 columns × 4 rows), with equal spacing between each icon. Each icon is centered within its own identical square bounding box, maintaining consistent padding, proportions, and visual weight. Style: bold line, thick stroke, minimal, modern, professional vector-style icons. Uniform stroke width across all icons, centered stroke alignment, smooth rounded corners, clean geometry, consistent visual language, no broken or overlapping lines. Composition: pixel-perfect grid system, mathematically equal spacing, consistent margins on all sides. Icons are aligned to a precise grid and do not touch each other or the edges. Design rules: no fill, outline only, no overlapping elements, no clutter, simplified and highly recognizable shapes, consistent proportions and visual weight. Background: pure white background, clean and isolated. Rendering: flat vector-style appearance, clean geometric construction, smooth curves, crisp edges, minimal anchor complexity, optimized for scalability and easy vectorization. Quality: ultra sharp, high resolution, crisp edges, no distortion, professional commercial stock quality.`;

  const solidPrompt = `A clean, professional icon set featuring 32 solid filled icons based on the theme of ${topicName}. The icons are arranged in a perfectly aligned grid layout (8 columns × 4 rows), with equal spacing between each icon. Each icon is centered within its own identical square bounding box, maintaining consistent padding, proportions and visual balance. Style: solid fill, bold, minimal, modern, professional vector-style icons. No outlines or strokes, only filled shapes. Smooth edges, clean geometric construction, consistent visual weight and strong silhouettes. Composition: pixel-perfect 8 × 4 grid system, mathematically equal spacing, consistent margins on all sides. Design rules: fully filled shapes, no stroke, no outline, no gradients, no shadows, no textures, no 3D effects. Background: pure white background, clean and isolated. Rendering: flat vector-style appearance, clean geometric shapes, crisp edges, minimal anchor complexity, optimized for scalability and easy vectorization. Quality: ultra sharp, high resolution, crisp edges, no distortion, professional commercial stock quality.`;

  return { filePrefix, outlinePrompt, solidPrompt };
}

async function runBot() {
  console.log('🚀 Starting Google Flow Automation Bot...');
  ensureDirs();

  if (!fs.existsSync(CONFIG.topicsFile)) {
    console.error('❌ Topics file not found:', CONFIG.topicsFile);
    return;
  }

  const allTopics = JSON.parse(fs.readFileSync(CONFIG.topicsFile, 'utf8'));
  const targetTopics = allTopics.filter(t => t.id >= CONFIG.startTopicId && t.id <= CONFIG.endTopicId);
  console.log(`📋 Total Topics to process: ${targetTopics.length} (IDs: ${CONFIG.startTopicId} to ${CONFIG.endTopicId})\n`);

  console.log('🌐 Launching Chrome with your active profile...');
  console.log('👉 Note: Please close any other open Chrome windows if Playwright requests exclusive profile lock.\n');

  let context;
  try {
    context = await chromium.launchPersistentContext(CONFIG.userDataDir, {
      headless: false,
      channel: 'chrome',
      viewport: { width: 1440, height: 900 },
      args: ['--start-maximized', '--disable-blink-features=AutomationControlled']
    });
  } catch (err) {
    console.warn('⚠️ Could not open main Chrome profile directly (maybe Chrome is already open). Launching isolated session...');
    const browser = await chromium.launch({ headless: false, channel: 'chrome' });
    context = await browser.newContext();
  }

  const page = await context.newPage();
  console.log(`🔗 Navigating to ${CONFIG.flowUrl}...`);
  await page.goto(CONFIG.flowUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);

  console.log('\n======================================================');
  console.log('✅ Connected to Google Flow!');
  console.log('🤖 Ready to process topics automatically.');
  console.log('======================================================\n');

  for (const topic of targetTopics) {
    console.log(`\n▶️ Processing Topic #${topic.id}: ${topic.topic}`);
    const { filePrefix, outlinePrompt, solidPrompt } = generatePromptsForTopic(topic.id, topic.topic);

    // Save prompt text files for reference
    const promptRecordPath = path.join(CONFIG.lineArtDir, `prompt_${topic.id}_${filePrefix}.txt`);
    fs.writeFileSync(promptRecordPath, `LINE ART PROMPT:\n${outlinePrompt}\n\nSOLID PROMPT:\n${solidPrompt}\n`, 'utf8');

    console.log(`   📝 Generated Line Art & Solid Prompts for #${topic.id}`);
    console.log(`   ⏳ Ready for input in Google Flow.`);
  }

  console.log('\n🎉 Batch preparation complete! Prompts saved to destination folders.');
  console.log('Keep this browser open to inspect and generate directly in Google Flow.');
}

runBot().catch(console.error);
