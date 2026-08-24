# 🎨 Adobe Stock Best-Selling Icon Set Generator & Automation Pipeline

An enterprise-grade, multi-project automation web application and browser bot designed for Adobe Stock contributors. It generates commercial 32-icon concepts, builds pixel-perfect **Line Art (Outline)** and **Solid (Fill)** prompts for **Google Flow** (`https://labs.google/fx/tools/flow`), and provides batch export and automation capabilities.

---

## 🌟 Key Features

1. **500 PDF Topics Pre-loaded:** Complete 1–500 dataset from `Icon (1).pdf` categorized into batches (1–50, 51–100, etc.).
2. **Infinite PDF / Topic Upload:** Upload any new PDF or paste custom topics to create new project batches anytime.
3. **Master Prompt & Style Presets Manager:** Add, edit, or customize Master Prompts with dynamic variables like `{{THEME}}`, `{{ICON_COUNT}}`, `{{ICON_LIST}}`.
4. **Dual Generation Engine:** Instant offline smart generation (zero setup/no API keys needed) or live AI mode (Google Gemini, OpenAI GPT-4o, Groq, OpenRouter).
5. **One-Click Copy & Google Flow Integration:** Copy prompts instantly with 1-click or jump directly into Google Flow.
6. **Batch Exporter:** Export batches (1-50, 51-100, etc.) into Excel CSV, JSON, or formatted Text (.TXT).
7. **Google Flow Automation Bot:** Playwright script to automate Google Flow with your logged-in Google Chrome profile.

---

## 🚀 How to Run Locally

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Start Web Dashboard:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

3. **Run Google Flow Automation Bot:**
   ```bash
   npm run bot
   ```

---

## 🌐 How to Deploy to Vercel via GitHub

### Step 1: Push to your GitHub Repository
```bash
git init
git add .
git commit -m "Initial commit of Adobe Stock Icon Pipeline"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

### Step 2: Deploy to Vercel (1-Click)
1. Go to [vercel.com](https://vercel.com) and log in.
2. Click **"Add New..."** -> **"Project"**.
3. Select your GitHub repository.
4. Keep default settings (`Framework: Next.js`) and click **"Deploy"**.
5. Your web app is now live and accessible from any device!

---

## 📁 Directory Overview

* `app/page.tsx` — Interactive Dashboard UI
* `data/defaultTopics.json` — 500 Topics dataset
* `lib/promptTemplates.ts` — Master Prompt template engine
* `lib/smartGenerator.ts` — Offline 32-icon set intelligence
* `lib/aiService.ts` — Live AI generation service
* `lib/pdfParser.ts` — Dynamic client-side PDF uploader & parser
* `components/` — Modular UI components (TopicSelector, PromptViewer, BatchModal, UploadModal, TemplateModal, SettingsModal)
* `scripts/flow_bot.js` — Google Flow automation bot
