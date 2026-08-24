import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const scriptPath = path.join(process.cwd(), '..', 'flow-autopilot-extension', 'content.js');
    let code = '';
    if (fs.existsSync(scriptPath)) {
      code = fs.readFileSync(scriptPath, 'utf-8');
    } else {
      code = `console.log("Flow Auto-Pilot ready");`;
    }

    return new NextResponse(code, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (err: any) {
    return new NextResponse(`console.error("${err.message}");`, { status: 500 });
  }
}
