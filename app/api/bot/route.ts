import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

let botProcess: any = null;
let botLogs: string[] = [];
let botStatus: 'idle' | 'running' | 'completed' | 'error' = 'idle';

export async function GET() {
  return NextResponse.json({
    status: botStatus,
    logs: botLogs.slice(-30),
  });
}

export async function POST(req: NextRequest) {
  const { action, startId = 1, endId = 50 } = await req.json();

  if (action === 'stop') {
    if (botProcess) {
      botProcess.kill();
      botProcess = null;
      botStatus = 'idle';
      botLogs.push('🛑 Auto-Pilot stopped by user.');
    }
    return NextResponse.json({ status: 'stopped' });
  }

  if (action === 'start') {
    if (botStatus === 'running') {
      return NextResponse.json({ status: 'already_running' });
    }

    botLogs = [`🚀 Starting Full Auto-Pilot Bot for Topics #${startId} to #${endId}...`];
    botStatus = 'running';

    const scriptPath = path.join(process.cwd(), 'scripts', 'auto_flow_pipeline.js');

    try {
      botProcess = spawn('node', [scriptPath], {
        env: {
          ...process.env,
          START_TOPIC_ID: startId.toString(),
          END_TOPIC_ID: endId.toString(),
        },
      });

      botProcess.stdout.on('data', (data: any) => {
        const text = data.toString().trim();
        if (text) {
          botLogs.push(text);
          console.log('[BOT LOG]:', text);
        }
      });

      botProcess.stderr.on('data', (data: any) => {
        const text = data.toString().trim();
        if (text) botLogs.push(`⚠️ ${text}`);
      });

      botProcess.on('close', (code: number) => {
        botStatus = code === 0 ? 'completed' : 'error';
        botLogs.push(
          code === 0
            ? '🎉 100% Auto-Pilot Run Completed Successfully!'
            : `⚠️ Bot process ended with code ${code}`
        );
        botProcess = null;
      });

      return NextResponse.json({ status: 'started' });
    } catch (e: any) {
      botStatus = 'error';
      botLogs.push(`❌ Error launching bot: ${e.message}`);
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
