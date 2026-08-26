import React, { useState } from 'react';
import { X, Plus, Trash2, Check, Save, RotateCcw, FileCode, Layers } from 'lucide-react';
import { PromptTemplate } from '@/lib/types';
import { DEFAULT_PROMPT_TEMPLATES } from '@/lib/promptTemplates';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: PromptTemplate[];
  selectedTemplateId: string;
  onSelectTemplate: (id: string) => void;
  onSaveTemplates: (templates: PromptTemplate[]) => void;
}

export const TemplateModal: React.FC<TemplateModalProps> = ({
  isOpen,
  onClose,
  templates,
  selectedTemplateId,
  onSelectTemplate,
  onSaveTemplates,
}) => {
  const [activeTemplateId, setActiveTemplateId] = useState<string>(selectedTemplateId);
  const [localTemplates, setLocalTemplates] = useState<PromptTemplate[]>(templates);
  const [activeTab, setActiveTab] = useState<'outline' | 'solid'>('outline');
  const [hasSaved, setHasSaved] = useState(false);

  if (!isOpen) return null;

  const currentTpl = localTemplates.find((t) => t.id === activeTemplateId) || localTemplates[0];

  const handleUpdateCurrent = (field: 'name' | 'description' | 'outlineTemplate' | 'solidTemplate', value: string) => {
    setLocalTemplates((prev) =>
      prev.map((t) => (t.id === activeTemplateId ? { ...t, [field]: value } : t))
    );
  };

  const handleAddNewTemplate = () => {
    const newId = `custom-${Date.now()}`;
    const newTpl: PromptTemplate = {
      id: newId,
      name: `Custom Master Prompt (${localTemplates.length + 1})`,
      description: 'Custom icon prompt style template',
      outlineTemplate: currentTpl.outlineTemplate,
      solidTemplate: currentTpl.solidTemplate,
    };
    setLocalTemplates([...localTemplates, newTpl]);
    setActiveTemplateId(newId);
  };

  const handleDeleteTemplate = (id: string) => {
    if (localTemplates.length <= 1) return;
    const filtered = localTemplates.filter((t) => t.id !== id);
    setLocalTemplates(filtered);
    if (activeTemplateId === id) {
      setActiveTemplateId(filtered[0].id);
    }
  };

  const handleResetDefaults = () => {
    setLocalTemplates(DEFAULT_PROMPT_TEMPLATES);
    setActiveTemplateId(DEFAULT_PROMPT_TEMPLATES[0].id);
  };

  const handleSaveAll = async () => {
    try {
      await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activeTemplateId,
          templates: localTemplates
        })
      });
    } catch (e) {}

    onSaveTemplates(localTemplates);
    onSelectTemplate(activeTemplateId);
    setHasSaved(true);
    setTimeout(() => {
      setHasSaved(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#0f172a] border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-5 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <FileCode className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Master Prompt & Style Templates</h3>
              <p className="text-xs text-slate-400">Customize prompt rules, grid specifications, and variables</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left: Template Selector List */}
          <div className="w-full md:w-64 border-r border-slate-800 bg-slate-950/60 p-3 space-y-2 overflow-y-auto flex-shrink-0">
            <div className="flex items-center justify-between px-1 pb-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Presets</span>
              <button
                onClick={handleAddNewTemplate}
                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium"
              >
                <Plus className="h-3 w-3" /> New
              </button>
            </div>

            {localTemplates.map((t) => (
              <div
                key={t.id}
                onClick={() => setActiveTemplateId(t.id)}
                className={`p-2.5 rounded-xl cursor-pointer border text-xs transition flex items-center justify-between group ${
                  activeTemplateId === t.id
                    ? 'bg-purple-950/40 border-purple-500/50 text-white font-medium'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="truncate pr-2">{t.name}</span>
                {t.id !== DEFAULT_PROMPT_TEMPLATES[0].id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTemplate(t.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}

            <div className="pt-4 border-t border-slate-800/80">
              <button
                onClick={handleResetDefaults}
                className="w-full py-1.5 px-2 rounded-lg text-[11px] text-slate-500 hover:text-slate-300 hover:bg-slate-900 transition flex items-center justify-center gap-1"
              >
                <RotateCcw className="h-3 w-3" /> Reset Defaults
              </button>
            </div>
          </div>

          {/* Right: Template Editor */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-[#090d16]">
            <div>
              <label className="text-xs font-semibold text-slate-300">Template Title</label>
              <input
                type="text"
                value={currentTpl.name}
                onChange={(e) => handleUpdateCurrent('name', e.target.value)}
                className="w-full mt-1 p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Prompt Mode Tabs */}
            <div className="flex gap-2 border-b border-slate-800 pb-2">
              <button
                onClick={() => setActiveTab('outline')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'outline'
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                1. Line Art (Outline) Template
              </button>
              <button
                onClick={() => setActiveTab('solid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'solid'
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                2. Solid (Fill) Template
              </button>
            </div>

            {/* Dynamic Placeholders Hint */}
            <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-300">Variables available:</span>
              <code className="px-1.5 py-0.5 rounded bg-slate-800 text-purple-300">{'{{THEME}}'}</code>
              <code className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">{'{{ICON_LIST}}'}</code>
              <code className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300">{'{{ICON_COUNT}}'}</code>
            </div>

            {/* Template Editor Box */}
            <div>
              <textarea
                rows={14}
                value={activeTab === 'outline' ? currentTpl.outlineTemplate : currentTpl.solidTemplate}
                onChange={(e) =>
                  handleUpdateCurrent(
                    activeTab === 'outline' ? 'outlineTemplate' : 'solidTemplate',
                    e.target.value
                  )
                }
                className="w-full p-3.5 bg-[#070a12] font-mono text-xs text-slate-200 rounded-xl border border-slate-800 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Selected: <strong className="text-white">{currentTpl.name}</strong>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAll}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/25 transition"
            >
              {hasSaved ? <Check className="h-4 w-4 text-emerald-300" /> : <Save className="h-4 w-4" />}
              <span>{hasSaved ? 'Saved!' : 'Save & Apply'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
