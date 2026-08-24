import React, { useState, useEffect } from 'react';
import { X, Play, Square, Bot, Sparkles, CheckCircle2, Terminal, ExternalLink } from 'lucide-react';
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
  const [isPolling, setIsPolling] = useState(false);

  if (!isOpen) return null;

  const handleStart = async () => {
    setBotStatus('running');
    setLogs([`🚀 Launching Autonomous Google Flow Bot for Topics #${startId} to #${endId}...`]);
    setIsPolling(true);

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
      setIsPolling(false);
    } catch (e: any) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="bg-[#0f172a] border border-purple-500/40 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl shadow-purple-950/50">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <Bot className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">100% Full Auto-Pilot Bot</h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">
                  OpenRouter ChatGPT + Google Flow
                </span>
              </div>
              <p className="text-xs text-slate-400">Generates prompts, creates images, 2x upscales & auto-downloads</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Range Config */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-200">Topics Batch Range</span>
              <p className="text-[11px] text-slate-400">Total topics available: {topics.length}</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400">From:</span>
                <input
                  type="number"
                  min={1}
                  max={topics.length || 500}
                  value={startId}
                  onChange={(e) => setStartId(Number(e.target.value))}
                  className="w-16 p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-center text-white"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400">To:</span>
                <input
                  type="number"
                  min={1}
                  max={topics.length || 500}
                  value={endId}
                  onChange={(e) => setEndId(Number(e.target.value))}
                  className="w-16 p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-center text-white"
                />
              </div>
            </div>
          </div>

          {/* Workflow Steps Indicator */}
          <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-purple-400 font-bold block">1. PDF Topics</span>
              <span className="text-slate-400 text-[10px]">Extracted #{startId}–#{endId}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-cyan-400 font-bold block">2. ChatGPT API</span>
              <span className="text-slate-400 text-[10px]">32 Icons & Prompts</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-amber-400 font-bold block">3. Google Flow</span>
              <span className="text-slate-400 text-[10px]">Auto Image Gen</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-emerald-400 font-bold block">4. 2x Upscale</span>
              <span className="text-slate-400 text-[10px]">Auto Downloaded</span>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="pt-2">
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

          {/* Local Launcher Alternative Note */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 space-y-1">
            <span className="font-semibold text-purple-300 flex items-center gap-1">
              <Terminal className="h-3.5 w-3.5" /> Direct Local 1-Click Batch File:
            </span>
            <p className="text-[11px] text-slate-400">
              You can also simply double-click <code className="text-cyan-300 font-mono">START_AUTO_PIPELINE.bat</code> in your workspace folder anytime to run without opening any browser dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
