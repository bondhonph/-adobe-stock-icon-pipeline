import React, { useState } from 'react';
import { X, Key, Shield, Bot, Save, Check, Cpu, ExternalLink } from 'lucide-react';
import { AISettings } from '@/lib/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AISettings;
  onSaveSettings: (settings: AISettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [provider, setProvider] = useState(settings.provider);
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [model, setModel] = useState(settings.model);
  const [temperature, setTemperature] = useState(settings.temperature);
  const [hasSaved, setHasSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings({
      provider,
      apiKey,
      model,
      temperature,
    });
    setHasSaved(true);
    setTimeout(() => {
      setHasSaved(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#0f172a] border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-5 p-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">AI Engine & API Settings</h3>
              <p className="text-xs text-slate-400">Configure AI provider or run offline smart engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Engine Selection */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300">Generation Engine</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1.5">
              {[
                { id: 'smart_offline', label: '⚡ Smart Offline (Zero Key)' },
                { id: 'gemini', label: 'Google Gemini' },
                { id: 'openai', label: 'OpenAI (GPT-4o)' },
                { id: 'groq', label: 'Groq (Ultra Fast)' },
                { id: 'openrouter', label: 'OpenRouter' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setProvider(p.id as any)}
                  className={`p-2.5 rounded-xl text-xs font-medium border text-left transition ${
                    provider === p.id
                      ? 'bg-purple-600/30 border-purple-500 text-white font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {provider !== 'smart_offline' && (
            <>
              <div>
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>API Key</span>
                  <span className="text-[10px] text-slate-500">Stored locally in your browser</span>
                </label>
                <input
                  type="password"
                  placeholder={`Enter your ${provider.toUpperCase()} API Key...`}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full mt-1.5 p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Custom Model (Optional)</label>
                <input
                  type="text"
                  placeholder={
                    provider === 'gemini'
                      ? 'gemini-1.5-flash'
                      : provider === 'groq'
                      ? 'llama-3.3-70b-versatile'
                      : 'gpt-4o-mini'
                  }
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full mt-1.5 p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </>
          )}

          {/* Local Bot Guide Banner */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-purple-400 font-semibold">
              <Bot className="h-4 w-4" />
              <span>Google Flow Automation Bot</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              To run the automatic 2x upscale & image downloader on your PC, execute:
            </p>
            <code className="block p-2 rounded-lg bg-slate-900 text-cyan-300 font-mono text-[11px]">
              npm run bot
            </code>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/25 transition"
          >
            {hasSaved ? <Check className="h-4 w-4 text-emerald-300" /> : <Save className="h-4 w-4" />}
            <span>{hasSaved ? 'Saved!' : 'Save Settings'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
