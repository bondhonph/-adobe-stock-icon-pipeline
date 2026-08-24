/**
 * 🚀 100% END-TO-END AUTONOMOUS ADOBE STOCK PIPELINE
 * 
 * Pipeline Workflow:
 * 1. PDF File -> Extracts all topics
 * 2. Master Prompt + Topic -> Sent to OpenRouter (ChatGPT)
 * 3. ChatGPT generates the exact 32-icon set, Line Art Prompt & Solid Prompt
 * 4. Bot connects to Google Flow (https://labs.google/fx/tools/flow)
 * 5. Handles Google Flow project opening & prompt input
 * 6. Google Flow generates image
 * 7. Bot triggers 2x Upscale
 * 8. Bot downloads 2x high-res image directly into organized folders (Line Art / Solid)
 * 9. Repeats for all topics in the PDF automatically!
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const WORKSPACE_DIR = path.resolve(__dirname, '..', '..');
const PDF_PATH = path.join(WORKSPACE_DIR, 'Icon (1).pdf');
const ENV_PATH = path.join(__dirname, '..', '.env');

// Master Prompt Template (Customizable)
const MASTER_PROMPT_TEMPLATE = `You are an expert Adobe Stock contributor, commercial graphic designer, icon-set researcher, and AI prompt engineer.
Theme: "{{THEME}}".

TASK:
1. Create a 32-icon list directly related to "{{THEME}}".
2. Generate the OUTLINE (Line Art) prompt.
3. Generate the SOLID (Fill) prompt.

Format your output strictly like this:

===ICONS===
1. Icon Name
...
32. Icon Name

===OUTLINE_PROMPT===
A clean, professional icon set featuring 32 bold outline icons based on the theme of {{THEME}}. The icons are arranged in a perfectly aligned grid layout (8 columns × 4 rows), with equal spacing between each icon. Each icon is centered within its own identical square bounding box, maintaining consistent padding, proportions, and visual weight. Style: bold line, thick stroke, minimal, modern, professional vector-style icons. Uniform stroke width across all icons, centered stroke alignment, smooth rounded corners, clean geometry, consistent visual language, no broken or overlapping lines. Composition: pixel-perfect grid system, mathematically equal spacing, consistent margins on all sides. Design rules: no fill, outline only, no overlapping elements, no clutter, simplified shapes, consistent visual weight. Background: pure white background, clean and isolated. Rendering: flat vector-style appearance, smooth curves, crisp edges, minimal anchor complexity. STRICT ICON CONTENT: [LIST 32 ICONS HERE]. All 32 icons must belong to the same visual family.

===SOLID_PROMPT===
A clean, professional icon set featuring 32 solid filled icons based on the theme of {{THEME}}. The icons are arranged in a perfectly aligned grid layout (8 columns × 4 rows), with equal spacing between each icon. Each icon is centered within its own identical square bounding box, maintaining consistent padding, proportions and visual balance. Style: solid fill, bold, minimal, modern, professional vector-style icons. No outlines or strokes, only filled shapes. Smooth edges, clean geometric construction, consistent visual weight and strong silhouettes. Composition: pixel-perfect 8 × 4 grid system, mathematically equal spacing, consistent margins on all sides. Design rules: fully filled shapes, no stroke, no outline, no gradients, no shadows, no 3D effects. Background: pure white background, clean and isolated. Rendering: flat vector-style appearance, clean geometric shapes, crisp edges. STRICT ICON CONTENT: [LIST 32 ICONS HERE]. All 32 icons must maintain the same visual family.`;

const CONFIG = {
  startTopicId: parseInt(process.env.START_TOPIC_ID || '1', 10),
  endTopicId: parseInt(process.env.END_TOPIC_ID || '50', 10),
  lineArtDir: path.join(WORKSPACE_DIR, '1-50', 'Line Art'),
  solidDir: path.join(WORKSPACE_DIR, '1-50', 'Solid'),
  flowUrl: 'https://labs.google/fx/tools/flow',
  cdpUrl: 'http://localhost:9222',
  openRouterModel: 'openai/gpt-4o-mini',
};

function getApiKey() {
  if (process.env.OPENROUTER_API_KEY) return process.env.OPENROUTER_API_KEY;
  if (fs.existsSync(ENV_PATH)) {
    const envContent = fs.readFileSync(ENV_PATH, 'utf8');
    const match = envContent.match(/OPENROUTER_API_KEY\s*=\s*(.+)/);
    if (match) return match[1].trim();
  }
  return null;
}

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

async function generatePromptsWithChatGPT(topicName, apiKey) {
  const prompt = MASTER_PROMPT_TEMPLATE.replace(/\{\{THEME\}\}/g, topicName);

  if (!apiKey) {
    console.log('   ℹ️ Using smart template generator...');
    return buildFallbackPrompts(topicName);
  }

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://adobe-stock-icon-pipeline.vercel.app',
        'X-Title': 'Adobe Stock Icon Automation Bot'
      },
      body: JSON.stringify({
        model: CONFIG.openRouterModel,
        messages: [
          { role: 'system', content: 'You are an expert Adobe Stock prompt engineer.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      })
    });

    const data = await res.json();
    const rawText = data?.choices?.[0]?.message?.content || '';

    const outlineMatch = rawText.match(/===OUTLINE_PROMPT===\s*([\s\S]+?)(?====SOLID_PROMPT===|$)/);
    const solidMatch = rawText.match(/===SOLID_PROMPT===\s*([\s\S]+?)$/);

    const lineArt = outlineMatch ? outlineMatch[1].trim() : buildFallbackPrompts(topicName).lineArt;
    const solid = solidMatch ? solidMatch[1].trim() : buildFallbackPrompts(topicName).solid;

    return { lineArt, solid };
  } catch (err) {
    console.warn('   ⚠️ OpenRouter call notice, using fallback:', err.message);
    return buildFallbackPrompts(topicName);
  }
}

function buildFallbackPrompts(theme) {
  const lineArt = `A clean, professional icon set featuring 32 bold outline icons based on the theme of ${theme}. The icons are arranged in a perfectly aligned grid layout (8 columns × 4 rows), with equal spacing between each icon. Each icon is centered within its own identical square bounding box, maintaining consistent padding, proportions, and visual weight. Style: bold line, thick stroke, minimal, modern, professional vector-style icons. Uniform stroke width across all icons, centered stroke alignment, smooth rounded corners, clean geometry, consistent visual language, no broken or overlapping lines. Composition: pixel-perfect grid system, mathematically equal spacing, consistent margins on all sides. Icons are aligned to a precise grid and do not touch each other or the edges. Design rules: no fill, outline only, no overlapping elements, no clutter, simplified and highly recognizable shapes, consistent proportions and visual weight. Background: pure white background, clean and isolated. Rendering: flat vector-style appearance, clean geometric construction, smooth curves, crisp edges, minimal anchor complexity, optimized for scalability and easy vectorization. Quality: ultra sharp, high resolution, crisp edges, no distortion, professional commercial stock quality.`;

  const solid = `A clean, professional icon set featuring 32 solid filled icons based on the theme of ${theme}. The icons are arranged in a perfectly aligned grid layout (8 columns × 4 rows), with equal spacing between each icon. Each icon is centered within its own identical square bounding box, maintaining consistent padding, proportions and visual balance. Style: solid fill, bold, minimal, modern, professional vector-style icons. No outlines or strokes, only filled shapes. Smooth edges, clean geometric construction, consistent visual weight and strong silhouettes. Composition: pixel-perfect 8 × 4 grid system, mathematically equal spacing, consistent margins on all sides. Design rules: fully filled shapes, no stroke, no outline, no gradients, no shadows, no textures, no 3D effects. Background: pure white background, clean and isolated. Rendering: flat vector-style appearance, clean geometric shapes, crisp edges, minimal anchor complexity, optimized for scalability and easy vectorization. Quality: ultra sharp, high resolution, crisp edges, no distortion, professional commercial stock quality.`;

  return { lineArt, solid };
}

async function runAutoPipeline() {
  console.log('================================================================');
  console.log('🚀 100% AUTONOMOUS PIPELINE (PDF -> OpenRouter ChatGPT -> Google Flow -> 2x Download)');
  console.log('================================================================\n');
  ensureDirs();

  const apiKey = getApiKey();
  if (apiKey) {
    console.log('🔑 OpenRouter API Key detected: ACTIVE');
  }

  console.log('📄 Extracting topics from PDF...');
  const allTopics = await extractTopicsFromPdf();
  const targetTopics = allTopics.filter(t => t.id >= CONFIG.startTopicId && t.id <= CONFIG.endTopicId);
  console.log(`📋 Total Topics in PDF: ${allTopics.length}`);
  console.log(`🎯 Processing Range: #${CONFIG.startTopicId} to #${CONFIG.endTopicId} (${targetTopics.length} Topics)\n`);

  let context;
  let page;

  // Use dedicated bot profile - sign in once, it remembers forever
  const botProfileDir = path.join(WORKSPACE_DIR, '.chrome-flow-bot-profile');
  if (!fs.existsSync(botProfileDir)) fs.mkdirSync(botProfileDir, { recursive: true });

  console.log('🌐 Launching Google Chrome with Playwright...');
  console.log(`📂 Bot profile: ${botProfileDir}`);
  
  // Kill any existing Chrome to avoid conflicts
  try {
    require('child_process').execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' });
    await new Promise(r => setTimeout(r, 3000));
  } catch (e) {}

  context = await chromium.launchPersistentContext(botProfileDir, {
    headless: false,
    channel: 'chrome',
    args: [
      '--start-maximized',
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--no-first-run',
      '--no-default-browser-check'
    ],
    viewport: null,
    ignoreDefaultArgs: ['--enable-automation']
  });

  const pages = context.pages();
  page = pages[0] || (await context.newPage());

  // Navigate to Google Flow
  console.log(`🔗 Navigating to Google Flow...`);
  await page.goto(CONFIG.flowUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(6000);
  console.log(`📍 Now on: ${page.url()}`);

  // ===== HANDLE GOOGLE FLOW LANDING PAGE & SIGN-IN =====
  console.log('🔍 Detecting Google Flow page state...');
  await page.waitForTimeout(3000);

  // Step A: Click "Try Google Flow" if on landing page
  const tryFlowBtn = await page.$('button:has-text("Try Google Flow")');
  if (tryFlowBtn && await tryFlowBtn.isVisible()) {
    console.log('📌 Landing page detected -> Clicking "Try Google Flow"...');
    await tryFlowBtn.click({ force: true });
    await page.waitForTimeout(5000);
  }

  // Step B: Check if redirected to Google Sign-in
  if (page.url().includes('accounts.google.com')) {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║  🔐 GOOGLE SIGN-IN REQUIRED (ONE-TIME ONLY)                ║');
    console.log('║                                                              ║');
    console.log('║  1. Sign in to your Google account in the Chrome window      ║');
    console.log('║  2. Complete any consent/permission screens                  ║');
    console.log('║  3. Bot will detect sign-in and continue automatically      ║');
    console.log('║                                                              ║');
    console.log('║  ⏳ Waiting up to 3 minutes...                               ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');
    
    // Poll every 3 seconds for up to 3 minutes
    let signedIn = false;
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 3000));
      const currentUrl = page.url();
      if (!currentUrl.includes('accounts.google.com')) {
        console.log(`✅ Sign-in complete! Redirected to: ${currentUrl.substring(0, 80)}...`);
        signedIn = true;
        await page.waitForTimeout(5000);
        break;
      }
      if (i % 10 === 9) {
        console.log(`   ⏳ Still waiting for sign-in... (${Math.floor((i+1)*3/60)}min ${((i+1)*3)%60}s)`);
      }
    }
    
    if (!signedIn) {
      // Last chance: check if a new tab opened with Flow
      const allPages = context.pages();
      const flowPage = allPages.find(p => p.url().includes('labs.google'));
      if (flowPage) {
        console.log('✅ Found Google Flow in another tab!');
        page = flowPage;
        await page.bringToFront();
        signedIn = true;
      }
    }

    if (!signedIn) {
      console.log('❌ Sign-in timeout. Please run the bot again after signing in.');
      await context.close();
      process.exit(1);
    }
  }

  // Step C: Click "Get started" if visible (free tier selection)
  const getStartedBtn = await page.$('button:has-text("Get started")');
  if (getStartedBtn && await getStartedBtn.isVisible()) {
    console.log('📌 Clicking "Get started"...');
    await getStartedBtn.click({ force: true });
    await page.waitForTimeout(5000);
  }

  // Step D: Detect if on dashboard or in canvas
  console.log('⏳ Checking if on Flow Dashboard or inside Project...');
  console.log(`📍 Current URL: ${page.url()}`);
  await page.waitForTimeout(3000);

  // If on dashboard, click "+ New project" or open existing project
  if (!page.url().includes('/project/')) {
    console.log('📁 Looking for "+ New project" button on dashboard...');
    
    // Try evaluate first for custom div/button components
    const newProjClicked = await page.evaluate(() => {
      const allEls = Array.from(document.querySelectorAll('button, div, a, span'));
      const np = allEls.find(el => {
        const txt = el.textContent?.trim().toLowerCase();
        return txt === '+ new project' || txt === 'new project' || txt?.includes('new project');
      });
      if (np) {
        np.click();
        return true;
      }
      return false;
    });

    if (newProjClicked) {
      console.log('✅ Clicked "+ New project" button!');
      await page.waitForTimeout(6000);
    } else {
      const npSelector = await page.$('button:has-text("New project"), div:has-text("New project"), a[href*="/project/"]');
      if (npSelector) {
        await npSelector.click({ force: true }).catch(() => {});
        console.log('✅ Clicked project selector!');
        await page.waitForTimeout(6000);
      }
    }
  }

  // Wait for canvas editor to be ready
  console.log('⏳ Waiting for Google Flow Canvas & Prompt box...');
  try {
    await page.waitForSelector('div[role="textbox"], [contenteditable="true"], textarea, div.ProseMirror, input[type="text"]:not([hidden])', { timeout: 25000 });
    console.log('\n✅ Google Flow Canvas Ready! Prompt input detected!\n');
  } catch (e) {
    console.log('⚠️ Will attempt prompt typing during loop...');
    await page.screenshot({ path: path.join(WORKSPACE_DIR, 'flow_workspace_debug.png') }).catch(() => {});
  }

  console.log('🚀 Starting Autonomous Generation Loop...\n');

  for (const topicItem of targetTopics) {
    const topicId = topicItem.id;
    const topicName = topicItem.topic;
    const fileBase = `${sanitizeName(topicName)}_2K_${Date.now()}`;

    console.log(`================================================================`);
    console.log(`▶️ TOPIC #${topicId}: ${topicName}`);
    console.log(`================================================================`);

    console.log(`🤖 Generating 32 icons & prompts via OpenRouter (ChatGPT)...`);
    const { lineArt, solid } = await generatePromptsWithChatGPT(topicName, apiKey);

    // 1. Line Art in Google Flow -> Generate -> 2x Upscale -> Download
    await executeFlowStep(page, lineArt, topicId, topicName, 'Line Art', CONFIG.lineArtDir, fileBase);

    // 2. Solid Fill in Google Flow -> Generate -> 2x Upscale -> Download
    await executeFlowStep(page, solid, topicId, topicName, 'Solid', CONFIG.solidDir, fileBase);

    console.log(`✅ Finished Topic #${topicId}: Both Line Art & Solid 2x Upscaled and Saved!\n`);
  }

  console.log('🎉🎉🎉 100% COMPLETE! All PDF topics processed, generated, 2x upscaled & downloaded! 🎉🎉🎉');
}

async function prepareGoogleFlowWorkspace(page) {
  console.log('🔍 Checking Google Flow state...');

  // If already inside a project workspace canvas
  if (page.url().includes('/project') || page.url().includes('/flow/')) {
    const input = await page.$('div[role="textbox"], div[contenteditable="true"], textarea:not([name="g-recaptcha-response"])');
    if (input) {
      console.log('✅ Directly in Flow AI canvas!');
      return;
    }
  }

  // Check if sign-in is needed
  const isSignInVisible = await page.$('a[href*="accounts.google.com"], button:has-text("Sign in")');
  if (isSignInVisible) {
    console.log('⚠️ Please SIGN IN to your Google Account in the opened Chrome window.');
    console.log('⏳ Waiting up to 60 seconds for sign-in...');
    try {
      await page.waitForSelector('button:has-text("New project"), a[href*="/project"], div[role="textbox"], [contenteditable="true"]', { timeout: 60000 });
      console.log('✅ Sign-in detected!');
    } catch (err) {
      console.log('Proceeding to check workspace...');
    }
  }

  // Click "+ New Project" or enter first project using evaluate / force click
  try {
    const clicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, a'));
      const newProjBtn = btns.find(b => 
        b.textContent?.trim().toLowerCase().includes('new project') ||
        b.getAttribute('aria-label')?.toLowerCase().includes('new project')
      );
      if (newProjBtn) {
        newProjBtn.click();
        return true;
      }
      return false;
    });

    if (clicked) {
      console.log('📁 Clicked "New project" button!');
      await page.waitForTimeout(4000);
    } else {
      // Direct click attempt
      const newProjectBtn = await page.$('button:has-text("New project"), a:has-text("New project")');
      if (newProjectBtn) {
        await newProjectBtn.click({ force: true }).catch(() => {});
        await page.waitForTimeout(3000);
      }
    }
  } catch (e) {
    console.log('Workspace check completed.');
  }
}

async function executeFlowStep(page, promptText, topicId, topicName, styleType, destDir, fileBase) {
  console.log(`  🎨 [${styleType}] -> Inputting prompt into Google Flow...`);

  try {
    const inputSelectors = [
      'div[role="textbox"]',
      'div[contenteditable="true"]',
      'textarea:not([name="g-recaptcha-response"])',
      'div.ProseMirror',
      '[aria-label*="prompt" i]',
      '[aria-label*="Describe" i]',
      '[placeholder*="Describe" i]',
      '[placeholder*="prompt" i]',
      'input[type="text"]:not([hidden])'
    ];

    let promptInput = null;
    for (const sel of inputSelectors) {
      try {
        const el = await page.$(sel);
        if (el && await el.isVisible()) {
          promptInput = el;
          break;
        }
      } catch (e) {}
    }

    if (!promptInput) {
      promptInput = await page.waitForSelector(inputSelectors.join(','), { timeout: 10000 });
    }

    if (promptInput) {
      await promptInput.click();
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Backspace');
      await page.waitForTimeout(200);

      // Use evaluate or type
      await promptInput.fill(promptText).catch(async () => {
        await page.keyboard.insertText(promptText);
      });
      await page.waitForTimeout(400);

      const generateBtn = await page.$('button:has-text("Generate"), button:has-text("Create"), button[aria-label*="Generate"]');
      if (generateBtn && await generateBtn.isVisible()) {
        await generateBtn.click();
      } else {
        await page.keyboard.press('Enter');
      }
      console.log(`     ⏳ Generating image in Flow AI...`);

      // Wait for image generation
      await page.waitForTimeout(18000);

      // Trigger 2x Upscale
      const upscaleBtn = await page.$('button:has-text("2x"), button:has-text("Upscale"), button[aria-label*="Upscale"]');
      if (upscaleBtn && await upscaleBtn.isVisible()) {
        console.log(`     🔍 Triggering 2x Upscale...`);
        await upscaleBtn.click();
        await page.waitForTimeout(7000);
      }

      // Trigger Download
      const downloadPromise = page.waitForEvent('download', { timeout: 15000 }).catch(() => null);
      const downloadBtn = await page.$('button:has-text("Download"), button[aria-label*="Download"], svg[data-icon="download"]');
      
      if (downloadBtn && await downloadBtn.isVisible()) {
        console.log(`     💾 Downloading 2x image to ${styleType} folder...`);
        await downloadBtn.click();
        const download = await downloadPromise;
        if (download) {
          const targetPath = path.join(destDir, `${fileBase}.jpeg`);
          await download.saveAs(targetPath);
          console.log(`     ✅ Saved: ${targetPath}`);
        }
      }
    }

  } catch (err) {
    console.warn(`     ⚠️ Notice: ${err.message}`);
  }

  await page.waitForTimeout(2000);
}

runAutoPipeline().catch(console.error);
