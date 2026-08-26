import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const PROMPTS_FILE = path.join(process.cwd(), 'data', 'custom_prompts.json');

export async function GET() {
  try {
    if (fs.existsSync(PROMPTS_FILE)) {
      const data = JSON.parse(fs.readFileSync(PROMPTS_FILE, 'utf-8'));
      return NextResponse.json(data);
    }
  } catch (e) {}

  return NextResponse.json({
    activeTemplateId: 'master-adobe-stock-grid',
    templates: []
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const dataDir = path.dirname(PROMPTS_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(PROMPTS_FILE, JSON.stringify(body, null, 2), 'utf-8');
    return NextResponse.json({ success: true, message: 'Templates saved successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
