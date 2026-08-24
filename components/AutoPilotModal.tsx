import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Square, Bot, Sparkles, CheckCircle2, Terminal, RefreshCw, Layers, Check, Loader2, ArrowRight } from 'lucide-react';
import { TopicItem } from '@/lib/types';

interface AutoPilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  topics: TopicItem[];
}

export const AutoPilotModal: React.FC<AutoPilotModalProps> = ({
  isOpen,
  onClose,
  topics,
}) => {
  const [startId, setStartId] = useState<number>(1);
  const [endId, setEndId] = useState<number>(50);
  const [botStatus, setBotStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [currentTopic, setCurrentTopic] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<string>('');
  const [completedCount, setCompletedCount] = useState<number>(0);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Poll server for live logs and status
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/bot');
        if (res.ok) {
          const data = await res.json();
          if (data.logs && data.logs.length > 0) {
            setLogs(data.logs);
            
            // Extract current topic and step from latest logs
            const latest = data.logs[data.logs.length - 1] || '';
            if (latest.includes('TOPIC #')) {
              const match = latest.match(/TOPIC #(\d+):\s*(.+)/);
              if (match) {
                setCurrentTopic(`#${match[1]}: ${match[2]}`);
              }
            }
            if (latest.includes('Generating')) setCurrentStep('Generating via OpenRouter ChatGPT...');
            else if (latest.includes('Google Flow')) setCurrentStep('Processing in Google Flow AI...');
            else if (latest.includes('2x Upscale')) setCurrentStep('Performing 2x Upscale...');
            else if (latest.includes('Downloading') || latest.includes('Saved')) setCurrentStep('Auto-downloading high-res 2x image...');
          }
          if (data.status) {
            setBotStatus(data.status);
          }
        }
      } catch (err) {
        // quiet error
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Auto-scroll logs to bottom
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  if (!isOpen) return null;

  const totalToProcess = Math.max(1, endId - startId + 1);
  const progressPercent = Math.min(100, Math.round((completedCount / totalToProcess) * 100));

  const handleStart = async () => {
    // If running on Vercel Cloud, provide clear instructions since Chrome is on user's PC
    if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
      setBotStatus('idle');
      setLogs([
        `[${new Date().toLocaleTimeString()}] ℹ️ Google Flow Bot runs on your Local PC (where your Google Chrome & account are logged in).`,
        `[${new Date().toLocaleTimeString()}] 📂 Open your workspace folder: G:\\Work Space\\Adobe Contribution\\Icon 2026`,
        `[${new Date().toLocaleTimeString()}] ▶️ Double-click "START_AUTO_PIPELINE.bat" to start full automation with your Google Chrome!`,
        `[${new Date().toLocaleTimeString()}] 💡 Or run "npm run dev" locally to control the bot directly from http://localhost:3000.`
      ]);
      return;
    }

    setBotStatus('running');
    setLogs([
      `[${new Date().toLocaleTimeString()}] 🚀 Launching Autonomous Google Flow Bot on your PC...`,
      `[${new Date().toLocaleTimeString()}] 📋 Target Range: Topics #${startId} to #${endId}`,
      `[${new Date().toLocaleTimeString()}] 🤖 Connecting OpenRouter (ChatGPT) -> Google Flow...`
    ]);
    setCurrentStep('Connecting to Google Chrome...');
    setCurrentTopic(`Topic #${startId}`);

    try {
      await fetch('/api/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', startId, endId }),
      });
    } catch (e: any) {
      setLogs((prev) => [...prev, `❌ Error: ${e.message}`]);
    }
  };

  const handleStop = async () => {
    try {
      await fetch('/api/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' }),
      });
      setBotStatus('idle');
      setCurrentStep('Stopped');
    } catch (e: any) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-[#0f172a] border border-purple-500/50 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl shadow-purple-950/60 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-purple-950/90 via-slate-900 to-indigo-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/40 shadow-lg shadow-purple-500/20">
              <Bot className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white tracking-tight">100% Full Auto-Pilot Bot</h3>
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-mono font-semibold flex items-center gap-1 ${
                  botStatus === 'running'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse'
                    : botStatus === 'completed'
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  {botStatus === 'running' ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                  {botStatus === 'running' ? 'LIVE RUNNING' : botStatus === 'completed' ? 'COMPLETED' : 'IDLE'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">OpenRouter ChatGPT + Google Flow AI (2x Upscale & Auto-Download)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto bg-[#090d16]/90">
          {/* Range Configuration */}
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-slate-200">Topics Batch Range</span>
              <p className="text-[11px] text-slate-400">Total topics available: {topics.length || 500}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 font-medium">From:</span>
                <input
                  type="number"
                  min={1}
                  max={topics.length || 500}
                  value={startId}
                  disabled={botStatus === 'running'}
                  onChange={(e) => setStartId(Number(e.target.value))}
                  className="w-16 p-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-center text-white focus:outline-none focus:border-purple-500 disabled:opacity-50"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 font-medium">To:</span>
                <input
                  type="number"
                  min={1}
                  max={topics.length || 500}
                  value={endId}
                  disabled={botStatus === 'running'}
                  onChange={(e) => setEndId(Number(e.target.value))}
                  className="w-16 p-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-center text-white focus:outline-none focus:border-purple-500 disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Live Active Progress Card */}
          {botStatus === 'running' && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-slate-900 border border-purple-500/30 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-bold text-white">Live Active Task:</span>
                  <span className="text-xs font-mono text-purple-300 font-bold truncate max-w-xs">
                    {currentTopic || `Topic #${startId}`}
                  </span>
                </div>
                <span className="text-xs font-mono text-cyan-400 font-bold">
                  {currentStep || 'Processing...'}
                </span>
              </div>

              {/* Real-time Visual Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Batch Progress</span>
                  <span className="font-mono text-white">{completedCount} / {totalToProcess} Completed</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 h-full transition-all duration-500 animate-pulse"
                    style={{ width: `${Math.max(5, progressPercent)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Live Console / Terminal Logs Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Terminal className="h-3.5 w-3.5 text-cyan-400" />
                <span>Live Bot Terminal Logs & Status</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500">Real-time Stream</span>
            </div>

            <div className="h-52 bg-[#050811] rounded-2xl border border-slate-800 p-4 font-mono text-[11px] overflow-y-auto space-y-1 text-slate-300 shadow-inner">
              {logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 text-xs">
                  <span>Press "START 100% FULL AUTO-PILOT" to begin unattended generation.</span>
                </div>
              ) : (
                logs.map((log, index) => {
                  let colorClass = 'text-slate-300';
                  if (log.includes('🚀') || log.includes('▶️')) colorClass = 'text-purple-300 font-bold';
                  if (log.includes('✅') || log.includes('✨') || log.includes('Saved')) colorClass = 'text-emerald-400 font-medium';
                  if (log.includes('🎨') || log.includes('🤖')) colorClass = 'text-cyan-300';
                  if (log.includes('🔍') || log.includes('2x')) colorClass = 'text-amber-300 font-semibold';
                  if (log.includes('❌') || log.includes('⚠️')) colorClass = 'text-red-400';

                  return (
                    <div key={index} className={`leading-relaxed ${colorClass}`}>
                      {log}
                    </div>
                  );
                })
              )}
              <div ref={logEndRef} />
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="pt-1">
            {botStatus !== 'running' ? (
              <button
                onClick={handleStart}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-extrabold text-sm shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2.5 transition transform hover:scale-[1.01]"
              >
                <Play className="h-5 w-5 fill-current" />
                <span>START 100% FULL AUTO-PILOT (Topics #{startId} to #{endId})</span>
              </button>
            ) : (
              <button
                onClick={handleStop}
                className="w-full py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-sm shadow-xl shadow-red-600/30 flex items-center justify-center gap-2.5 transition"
              >
                <Square className="h-5 w-5 fill-current" />
                <span>STOP AUTO-PILOT RUN</span>
              </button>
            )}
          </div>

          {/* Local Batch Launcher Alternative Note */}
          <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 text-xs text-slate-300 space-y-1">
            <span className="font-semibold text-purple-300 flex items-center gap-1">
              <Terminal className="h-3.5 w-3.5 text-cyan-400" /> Direct Local 1-Click File:
            </span>
            <p className="text-[11px] text-slate-400">
              You can also double-click <code className="text-cyan-300 font-mono bg-slate-950 px-1 py-0.5 rounded">START_AUTO_PIPELINE.bat</code> in your workspace folder anytime to run without opening any browser dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
