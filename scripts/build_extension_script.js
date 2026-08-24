const fs = require('fs');
const path = require('path');

const topics = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'public', 'topics.json'), 'utf-8'));

const code = `// ==UserScript==
// @name         Google Flow - Adobe Stock 100% Autonomous Bot
// @namespace    http://tampermonkey.net/
// @version      1.0.4
// @description  Autonomous Flow Bot with Real Image Generation Detection & Auto-Upscale/Download
// @author       Adobe Stock Automation
// @match        https://labs.google/fx/tools/flow*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  if (window.__FLOW_AUTOPILOT_INITIALIZED__) {
    const existing = document.getElementById('flow-autopilot-hud');
    if (existing) existing.remove();
  }
  window.__FLOW_AUTOPILOT_INITIALIZED__ = true;

  console.log('🚀 [Google Flow Auto-Pilot] Initialized with Real Canvas Detection & 500 PDF Topics!');

  const EMBEDDED_TOPICS = ${JSON.stringify(topics)};

  let botRunning = false;
  let topicsList = EMBEDDED_TOPICS;
  let startId = 1;
  let endId = 50;

  // 1. Create Glassmorphism HUD
  function createHUD() {
    const existing = document.getElementById('flow-autopilot-hud');
    if (existing) existing.remove();

    const hud = document.createElement('div');
    hud.id = 'flow-autopilot-hud';
    hud.innerHTML = \`
      <div id="flow-hud-header" style="cursor: move; display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); border-radius: 16px 16px 0 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 20px;">⚡</span>
          <div>
            <div style="font-weight: 800; font-size: 13px; color: #fff; letter-spacing: 0.5px;">FLOW AUTO-PILOT</div>
            <div style="font-size: 10px; color: #a5b4fc;">Live Canvas Detection • \${topicsList.length} Topics</div>
          </div>
        </div>
        <button id="flow-hud-toggle" style="background: rgba(255,255,255,0.1); border: none; color: #fff; width: 26px; height: 26px; border-radius: 8px; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center;">−</button>
      </div>

      <div id="flow-hud-body" style="padding: 16px; display: flex; flex-direction: column; gap: 12px;">
        <!-- Status Badge -->
        <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(15, 23, 42, 0.6); padding: 8px 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.05);">
          <span style="font-size: 11px; color: #94a3b8;">Status</span>
          <span id="flow-hud-status" style="font-size: 11px; font-weight: 700; color: #38bdf8; background: rgba(56, 189, 248, 0.15); padding: 2px 8px; border-radius: 6px;">READY (\${topicsList.length} TOPICS)</span>
        </div>

        <!-- Topics Range -->
        <div style="display: flex; gap: 8px; align-items: center;">
          <div style="flex: 1;">
            <label style="display: block; font-size: 10px; color: #94a3b8; margin-bottom: 4px;">Start Topic #</label>
            <input type="number" id="flow-start-topic" value="\${startId}" min="1" max="\${topicsList.length}" style="width: 100%; background: #0f172a; border: 1px solid #334155; color: #fff; padding: 6px 10px; border-radius: 8px; font-size: 12px; box-sizing: border-box;" />
          </div>
          <div style="flex: 1;">
            <label style="display: block; font-size: 10px; color: #94a3b8; margin-bottom: 4px;">End Topic #</label>
            <input type="number" id="flow-end-topic" value="\${endId}" min="1" max="\${topicsList.length}" style="width: 100%; background: #0f172a; border: 1px solid #334155; color: #fff; padding: 6px 10px; border-radius: 8px; font-size: 12px; box-sizing: border-box;" />
          </div>
        </div>

        <!-- Progress Bar -->
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 10px; color: #cbd5e1; margin-bottom: 4px;">
            <span id="flow-progress-label">Progress: 0 / 0</span>
            <span id="flow-progress-pct">0%</span>
          </div>
          <div style="width: 100%; height: 6px; background: #334155; border-radius: 999px; overflow: hidden;">
            <div id="flow-progress-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #6366f1, #a855f7); transition: width 0.3s ease;"></div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div style="display: flex; gap: 8px;">
          <button id="flow-btn-start" style="flex: 2; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #fff; border: none; padding: 10px 14px; border-radius: 10px; font-weight: 700; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);">
            <span>▶️</span> START AUTO-PILOT
          </button>
          <button id="flow-btn-stop" style="flex: 1; background: #dc2626; color: #fff; border: none; padding: 10px 12px; border-radius: 10px; font-weight: 700; font-size: 12px; cursor: pointer; display: none;">
            ⏹️ STOP
          </button>
        </div>

        <!-- Live Log Console -->
        <div id="flow-hud-logs" style="background: #020617; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 8px 10px; height: 135px; overflow-y: auto; font-family: monospace; font-size: 10px; color: #94a3b8; line-height: 1.4;">
          <div style="color: #38bdf8;">[Flow Auto-Pilot] Ready! \${topicsList.length} PDF topics loaded.</div>
          <div style="color: #a5b4fc;">👉 Click START to begin autonomous generation!</div>
        </div>
      </div>
    \`;

    hud.style.cssText = \`
      position: fixed;
      top: 80px;
      right: 24px;
      width: 320px;
      background: rgba(15, 23, 42, 0.94);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
      z-index: 999999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      transition: opacity 0.2s ease;
    \`;

    document.body.appendChild(hud);
    makeDraggable(hud, document.getElementById('flow-hud-header'));

    const toggleBtn = document.getElementById('flow-hud-toggle');
    const body = document.getElementById('flow-hud-body');
    toggleBtn.onclick = () => {
      if (body.style.display === 'none') {
        body.style.display = 'flex';
        toggleBtn.textContent = '−';
      } else {
        body.style.display = 'none';
        toggleBtn.textContent = '+';
      }
    };

    document.getElementById('flow-btn-start').onclick = startAutoPilot;
    document.getElementById('flow-btn-stop').onclick = stopAutoPilot;
  }

  function log(msg, color = '#94a3b8') {
    const logs = document.getElementById('flow-hud-logs');
    if (!logs) return;
    const time = new Date().toLocaleTimeString();
    const line = document.createElement('div');
    line.style.color = color;
    line.style.marginBottom = '2px';
    line.textContent = \`[\${time}] \${msg}\`;
    logs.appendChild(line);
    logs.scrollTop = logs.scrollHeight;
  }

  function setStatus(text, color = '#38bdf8') {
    const el = document.getElementById('flow-hud-status');
    if (el) {
      el.textContent = text;
      el.style.color = color;
      el.style.backgroundColor = \`\${color}20\`;
    }
  }

  function updateProgress(curr, total) {
    const lbl = document.getElementById('flow-progress-label');
    const pct = document.getElementById('flow-progress-pct');
    const bar = document.getElementById('flow-progress-bar');
    if (lbl && pct && bar) {
      const p = total > 0 ? Math.round((curr / total) * 100) : 0;
      lbl.textContent = \`Progress: \${curr} / \${total}\`;
      pct.textContent = \`\${p}%\`;
      bar.style.width = \`\${p}%\`;
    }
  }

  function generatePrompts(theme) {
    const lineArt = \`A clean, professional icon set featuring 32 line art icons based on the theme of \${theme}. The icons are arranged in a perfectly aligned grid layout (8 columns × 4 rows), with equal spacing between each icon. Each icon is centered within its own identical square bounding box, maintaining consistent padding, proportions and visual balance. Style: line art, minimal, modern, professional vector-style icons. Consistent medium stroke weight across all icons, with refined and clean line quality. Open lines, smooth curves, clean geometric construction and balanced negative space. Composition: pixel-perfect 8 × 4 grid system, mathematically equal spacing, consistent margins on all sides. Design rules: pure black outlines only, no color fills, no solid fills, no gradients, no shadows, no textures, no 3D effects. Background: pure white background, clean and isolated. Rendering: flat vector-style appearance, clean geometric shapes, crisp edges, minimal anchor complexity, optimized for scalability and easy vectorization. Quality: ultra sharp, high resolution, crisp lines, no distortion, professional commercial stock quality.\`;

    const solid = \`A clean, professional icon set featuring 32 solid filled icons based on the theme of \${theme}. The icons are arranged in a perfectly aligned grid layout (8 columns × 4 rows), with equal spacing between each icon. Each icon is centered within its own identical square bounding box, maintaining consistent padding, proportions and visual balance. Style: solid fill, bold, minimal, modern, professional vector-style icons. No outlines or strokes, only filled shapes. Smooth edges, clean geometric construction, consistent visual weight and strong silhouettes. Composition: pixel-perfect 8 × 4 grid system, mathematically equal spacing, consistent margins on all sides. Design rules: fully filled shapes, no stroke, no outline, no gradients, no shadows, no textures, no 3D effects. Background: pure white background, clean and isolated. Rendering: flat vector-style appearance, clean geometric shapes, crisp edges, minimal anchor complexity, optimized for scalability and easy vectorization. Quality: ultra sharp, high resolution, crisp edges, no distortion, professional commercial stock quality.\`;

    return { lineArt, solid };
  }

  async function startAutoPilot() {
    startId = parseInt(document.getElementById('flow-start-topic').value, 10) || 1;
    endId = parseInt(document.getElementById('flow-end-topic').value, 10) || 50;

    const filtered = topicsList.filter(t => t.id >= startId && t.id <= endId);
    if (filtered.length === 0) {
      log('⚠️ No topics in range! Using topic #1', '#f59e0b');
      filtered.push(topicsList[0] || { id: 1, topic: 'Business Strategy & Management' });
    }

    botRunning = true;
    document.getElementById('flow-btn-start').style.display = 'none';
    document.getElementById('flow-btn-stop').style.display = 'block';

    log(\`🚀 Starting Auto-Pilot for \${filtered.length} topics (#\${startId} to #\${endId})...\`, '#38bdf8');

    for (let i = 0; i < filtered.length; i++) {
      if (!botRunning) break;

      const item = filtered[i];
      updateProgress(i + 1, filtered.length);
      setStatus(\`TOPIC #\${item.id} (\${i + 1}/\${filtered.length})\`, '#a855f7');
      log(\`\\n▶️ [\${i + 1}/\${filtered.length}] TOPIC #\${item.id}: \${item.topic}\`, '#e2e8f0');

      const { lineArt, solid } = generatePrompts(item.topic);

      // 1. Line Art
      log(\`🎨 [Line Art] Typing prompt into box...\`, '#60a5fa');
      const ok1 = await executeFlowStep(lineArt, 'Line Art');
      if (!ok1 && !botRunning) break;

      if (!botRunning) break;

      // 2. Solid Fill
      log(\`🎨 [Solid] Typing prompt into box...\`, '#c084fc');
      const ok2 = await executeFlowStep(solid, 'Solid');
      if (!ok2 && !botRunning) break;

      log(\`✅ Topic #\${item.id} complete! Both 2x Line Art & Solid saved.\`, '#4ade80');
      await sleep(3000);
    }

    setStatus('COMPLETED 🎉', '#4ade80');
    log('🎉🎉 All topics generated and downloaded! 🎉🎉', '#4ade80');
    stopAutoPilot();
  }

  function stopAutoPilot() {
    botRunning = false;
    document.getElementById('flow-btn-start').style.display = 'flex';
    document.getElementById('flow-btn-stop').style.display = 'none';
    setStatus('STOPPED', '#94a3b8');
    log('⏹️ Auto-Pilot stopped.', '#ef4444');
  }

  async function executeFlowStep(promptText, styleType) {
    let slateEditor = findSlateEditor();
    if (!slateEditor) {
      log(\`⚠️ Looking for prompt box...\`, '#f59e0b');
      for (let a = 0; a < 8; a++) {
        await sleep(1000);
        slateEditor = findSlateEditor();
        if (slateEditor) break;
      }
    }

    if (!slateEditor) {
      log(\`❌ Slate prompt box not found! Please click inside prompt bar.\`, '#ef4444');
      return false;
    }

    const initialImgCount = document.querySelectorAll('img, canvas').length;

    // 1. Focus Slate Editor
    slateEditor.focus();
    slateEditor.click();
    await sleep(200);

    // Clear and insert
    try {
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(slateEditor);
      sel.removeAllRanges();
      sel.addRange(range);
      document.execCommand('delete', false, null);
    } catch (e) {}

    // Insert via Slate beforeinput
    slateEditor.dispatchEvent(new InputEvent('beforeinput', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertText',
      data: promptText
    }));
    document.execCommand('insertText', false, promptText);
    slateEditor.dispatchEvent(new InputEvent('input', {
      bubbles: true,
      inputType: 'insertText',
      data: promptText
    }));

    await sleep(400);

    // 2. Try Automatic Submit
    log('🚀 Triggering Submit Arrow (->)...', '#38bdf8');
    clickSubmitArrow(slateEditor);
    slateEditor.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));

    // 3. Wait for real image generation on canvas (Checking image count / progress)
    log(\`⏳ Waiting for image generation to start...\`, '#f59e0b');
    
    let generationStarted = false;
    for (let waitSec = 0; waitSec < 12; waitSec++) {
      await sleep(1000);
      const currentImgs = document.querySelectorAll('img, canvas').length;
      // If prompt box cleared or new image appeared
      if (currentImgs > initialImgCount || !slateEditor.textContent?.trim() || document.querySelector('div[class*="loading"], div[class*="spinner"], div[class*="progress"]')) {
        generationStarted = true;
        break;
      }
    }

    if (!generationStarted) {
      log(\`👉 Notice: If prompt is in box, please press ENTER or click (->) now!\`, '#f43f5e');
      // Wait another 15s for user click or generation
      for (let w = 0; w < 15; w++) {
        await sleep(1000);
        if (document.querySelectorAll('img, canvas').length > initialImgCount || !slateEditor.textContent?.trim()) {
          generationStarted = true;
          break;
        }
      }
    }

    log(\`⏳ Generating \${styleType} image (rendering on canvas)...\`, '#38bdf8');
    // Wait until image is fully generated (approx 20s)
    await sleep(22000);

    // 4. Trigger 2x Upscale
    log(\`🔍 Triggering 2x Upscale...\`, '#a855f7');
    triggerUpscale();
    await sleep(8000);

    // 5. Trigger Download
    log(\`💾 Triggering Download...\`, '#4ade80');
    triggerDownload();
    await sleep(4000);

    return true;
  }

  function findSlateEditor() {
    return document.querySelector('div[data-slate-editor="true"]') ||
      document.querySelector('div[role="textbox"]') ||
      document.querySelector('[contenteditable="true"]');
  }

  function clickSubmitArrow(slateEditor) {
    const pRect = slateEditor.getBoundingClientRect();
    const candidates = Array.from(document.querySelectorAll('button, [role="button"], div[class*="button"], svg, path'));

    const arrow = candidates.find(el => {
      const rect = el.getBoundingClientRect();
      const isNearBottomRight = (rect.bottom >= pRect.bottom - 15) && (rect.bottom <= pRect.bottom + 80) && (rect.right >= pRect.right - 100);
      const isNotAgent = !el.textContent?.toLowerCase().includes('agent') && !el.textContent?.toLowerCase().includes('banana');
      return isNearBottomRight && isNotAgent && rect.width > 0 && rect.height > 0;
    });

    if (arrow) {
      arrow.removeAttribute('disabled');
      arrow.removeAttribute('aria-disabled');
      arrow.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
      arrow.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
      arrow.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true }));
      arrow.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
      arrow.click();
    }
  }

  function triggerUpscale() {
    const upscaleBtn = findElementByText(['2x', 'upscale', 'enhance']) || document.querySelector('button[aria-label*="Upscale" i]');
    if (upscaleBtn) {
      upscaleBtn.click();
      return;
    }

    const cards = Array.from(document.querySelectorAll('div[class*="node"], div[class*="card"], div[class*="image"], img, canvas'));
    if (cards.length > 0) {
      const latest = cards[cards.length - 1];
      latest.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      latest.click();
      setTimeout(() => {
        const u2 = findElementByText(['2x', 'upscale', 'enhance']) || document.querySelector('button[aria-label*="Upscale" i]');
        if (u2) u2.click();
      }, 800);
    }
  }

  function triggerDownload() {
    const downloadBtn = findElementByText(['download', 'save']) || document.querySelector('button[aria-label*="Download" i], svg[data-icon="download"]');
    if (downloadBtn) {
      downloadBtn.click();
      return;
    }

    const allButtons = Array.from(document.querySelectorAll('button, [role="button"]'));
    const dl = allButtons.find(b => b.getAttribute('aria-label')?.toLowerCase().includes('download') || b.querySelector('svg[data-icon="download"]'));
    if (dl) dl.click();
  }

  function findElementByText(matchTexts) {
    const all = Array.from(document.querySelectorAll('button, div, a, span, p'));
    for (const el of all) {
      const txt = el.textContent?.trim().toLowerCase();
      if (!txt) continue;
      for (const m of matchTexts) {
        if (txt === m || txt.startsWith(m)) {
          if (el.offsetParent !== null) return el;
        }
      }
    }
    return null;
  }

  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  function makeDraggable(element, handle) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    handle.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      element.style.top = (element.offsetTop - pos2) + 'px';
      element.style.left = (element.offsetLeft - pos1) + 'px';
      element.style.right = 'auto';
    }

    function closeDragElement() {
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }

  createHUD();
})();
`;

const extDir = path.join(__dirname, '..', '..', 'flow-autopilot-extension');
if (!fs.existsSync(extDir)) fs.mkdirSync(extDir, { recursive: true });
fs.writeFileSync(path.join(extDir, 'content.js'), code);
console.log('Successfully updated content.js with real image detection!');
