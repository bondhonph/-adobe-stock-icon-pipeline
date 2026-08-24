import React, { useState, useMemo } from 'react';
import { Copy, Check, Sparkles, ExternalLink, RefreshCw, CheckCircle2, Star, ArrowRight, Grid, Edit3 } from 'lucide-react';
import { TopicItem, PromptTemplate } from '@/lib/types';
import { generateSmartIcons } from '@/lib/smartGenerator';
import { buildPrompts } from '@/lib/promptTemplates';

interface PromptViewerProps {
  topic: TopicItem | null;
  template: PromptTemplate;
  isGenerating: boolean;
  onGenerate: () => void;
  onUpdateIcons: (newIcons: string[]) => void;
  onToggleStatus: (id: number) => void;
  onToggleStar: (id: number) => void;
  onNextTopic: () => void;
}

export const PromptViewer: React.FC<PromptViewerProps> = ({
  topic,
  template,
  isGenerating,
  onGenerate,
  onUpdateIcons,
  onToggleStatus,
  onToggleStar,
  onNextTopic,
}) => {
  const [copiedType, setCopiedType] = useState<'line' | 'solid' | 'icons' | null>(null);
  const [isEditingIcons, setIsEditingIcons] = useState(false);
  const [editableIconsText, setEditableIconsText] = useState('');

  const icons = useMemo(() => {
    if (!topic) return [];
    if (topic.iconList && topic.iconList.length >= 32) return topic.iconList;
    return generateSmartIcons(topic.topic);
  }, [topic]);

  const { outlinePrompt, solidPrompt } = useMemo(() => {
    if (!topic) return { outlinePrompt: '', solidPrompt: '' };
    if (topic.outlinePrompt && topic.solidPrompt) {
      return { outlinePrompt: topic.outlinePrompt, solidPrompt: topic.solidPrompt };
    }
    return buildPrompts(topic.topic, icons, template);
  }, [topic, icons, template]);

  if (!topic) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#090d16]">
        <div className="h-16 w-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 text-purple-400">
          <Sparkles className="h-8 w-8 animate-pulse" />
        </div>
        <h3 className="text-lg font-semibold text-white">Select a Topic</h3>
        <p className="text-sm text-slate-400 max-w-sm mt-1">
          Pick any topic from the left sidebar to automatically generate 32 icons and Flow AI prompts.
        </p>
      </div>
    );
  }

  const handleCopy = (text: string, type: 'line' | 'solid' | 'icons') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleStartEdit = () => {
    setEditableIconsText(icons.map((ic, i) => `${i + 1}. ${ic}`).join('\n'));
    setIsEditingIcons(true);
  };

  const handleSaveEdit = () => {
    const lines = editableIconsText
      .split('\n')
      .map((l) => l.replace(/^\d+[\.\)\-]\s*/, '').trim())
      .filter((l) => l.length > 0);
    onUpdateIcons(lines);
    setIsEditingIcons(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#090d16] p-4 lg:p-8 space-y-6">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/70 p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-mono text-xs font-semibold border border-purple-500/30">
              #{topic.id}
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">{topic.topic}</h2>
            {topic.status === 'done' && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-semibold border border-emerald-500/20 flex items-center gap-1">
                <Check className="h-3 w-3" /> Done
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Adobe Stock 32-Icon Grid Generation • Template: <span className="text-purple-300">{template.name}</span>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/25 transition disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{icons.length > 0 ? 'Regenerate 32 Icons' : 'Generate 32 Icons'}</span>
          </button>

          <button
            onClick={() => onToggleStatus(topic.id)}
            className={`p-2 rounded-xl border text-xs font-medium transition ${
              topic.status === 'done'
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title={topic.status === 'done' ? 'Mark as Pending' : 'Mark as Done'}
          >
            <CheckCircle2 className="h-4 w-4" />
          </button>

          <button
            onClick={() => onToggleStar(topic.id)}
            className={`p-2 rounded-xl border text-xs font-medium transition ${
              topic.status === 'starred'
                ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title="Star Topic"
          >
            <Star className="h-4 w-4 fill-current" />
          </button>

          <button
            onClick={onNextTopic}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            title="Next Topic"
          >
            <span>Next</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 32 Icons Grid Preview */}
      <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Grid className="h-4 w-4 text-purple-400" />
            <h4 className="font-semibold text-sm text-slate-200">
              32-Icon Concept List (8 × 4 Grid System)
            </h4>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
              {icons.length} Icons
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!isEditingIcons ? (
              <>
                <button
                  onClick={handleStartEdit}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition px-2 py-1 rounded bg-slate-800/80"
                >
                  <Edit3 className="h-3 w-3" /> Edit List
                </button>
                <button
                  onClick={() =>
                    handleCopy(
                      icons.map((ic, i) => `${i + 1}. ${ic}`).join('\n'),
                      'icons'
                    )
                  }
                  className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition px-2 py-1 rounded bg-purple-500/10 border border-purple-500/20"
                >
                  {copiedType === 'icons' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copiedType === 'icons' ? 'Copied!' : 'Copy 32 Icons'}
                </button>
              </>
            ) : (
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1 rounded text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition"
              >
                Save Changes
              </button>
            )}
          </div>
        </div>

        {isEditingIcons ? (
          <textarea
            rows={10}
            value={editableIconsText}
            onChange={(e) => setEditableIconsText(e.target.value)}
            className="w-full p-3 bg-slate-950 font-mono text-xs text-slate-200 rounded-xl border border-slate-700 focus:outline-none focus:border-purple-500"
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-2">
            {icons.map((iconName, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/90 text-center flex flex-col justify-between hover:border-purple-500/40 transition group"
              >
                <span className="text-[10px] font-mono text-purple-400 font-bold self-start">
                  #{idx + 1}
                </span>
                <span className="text-[11px] font-medium text-slate-300 group-hover:text-white mt-1 line-clamp-2">
                  {iconName}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Two Ready-to-Use Flow AI Prompts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Line Art (Outline) Prompt Box */}
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 flex flex-col overflow-hidden shadow-lg">
          <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
              <h3 className="font-bold text-sm text-white">1. Line Art (Outline) Prompt</h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {outlinePrompt.length} chars
            </span>
          </div>

          <div className="p-4 flex-1">
            <textarea
              readOnly
              value={outlinePrompt}
              rows={12}
              className="w-full h-full p-3.5 bg-[#070a12] text-xs font-mono text-slate-300 rounded-xl border border-slate-800/80 focus:outline-none resize-none selection:bg-cyan-500"
            />
          </div>

          <div className="p-4 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between gap-3">
            <button
              onClick={() => handleCopy(outlinePrompt, 'line')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition shadow-md ${
                copiedType === 'line'
                  ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/20'
              }`}
            >
              {copiedType === 'line' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copiedType === 'line' ? 'Copied to Clipboard!' : 'Copy Line Art Prompt'}</span>
            </button>

            <a
              href="https://labs.google/fx/tools/flow"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleCopy(outlinePrompt, 'line')}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition flex items-center gap-1 text-xs"
              title="Copy prompt & open Google Flow"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* 2. Solid (Fill) Prompt Box */}
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 flex flex-col overflow-hidden shadow-lg">
          <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-purple-400" />
              <h3 className="font-bold text-sm text-white">2. Solid (Fill) Prompt</h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {solidPrompt.length} chars
            </span>
          </div>

          <div className="p-4 flex-1">
            <textarea
              readOnly
              value={solidPrompt}
              rows={12}
              className="w-full h-full p-3.5 bg-[#070a12] text-xs font-mono text-slate-300 rounded-xl border border-slate-800/80 focus:outline-none resize-none selection:bg-purple-500"
            />
          </div>

          <div className="p-4 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between gap-3">
            <button
              onClick={() => handleCopy(solidPrompt, 'solid')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition shadow-md ${
                copiedType === 'solid'
                  ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                  : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/20'
              }`}
            >
              {copiedType === 'solid' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copiedType === 'solid' ? 'Copied to Clipboard!' : 'Copy Solid Prompt'}</span>
            </button>

            <a
              href="https://labs.google/fx/tools/flow"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleCopy(solidPrompt, 'solid')}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition flex items-center gap-1 text-xs"
              title="Copy prompt & open Google Flow"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
