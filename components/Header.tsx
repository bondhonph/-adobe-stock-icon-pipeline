import React from 'react';
import { Sparkles, FileText, Sliders, Settings, Upload, ExternalLink, Download, Layers, Plus, Trash2, Bot } from 'lucide-react';
import { ProjectData } from '@/lib/types';

interface HeaderProps {
  currentProject: ProjectData;
  projects: ProjectData[];
  onSelectProject: (id: string) => void;
  onNewBlankProject: () => void;
  onDeleteProject: (id: string) => void;
  onOpenUpload: () => void;
  onOpenTemplates: () => void;
  onOpenBatch: () => void;
  onOpenAutoPilot: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentProject,
  projects,
  onSelectProject,
  onNewBlankProject,
  onDeleteProject,
  onOpenUpload,
  onOpenTemplates,
  onOpenBatch,
  onOpenAutoPilot,
  onOpenSettings,
}) => {
  return (
    <header className="border-b border-slate-800 bg-[#0d1322]/80 backdrop-blur-md sticky top-0 z-30 px-4 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
      {/* Brand & Project Info */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-purple-500/20">
          <Sparkles className="h-5 w-5 text-white animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-lg text-white tracking-tight">Adobe Stock AI Auto Pipeline</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium">
              Vercel + Google Flow
            </span>
          </div>
          
          {/* Project Switcher & Actions */}
          <div className="flex items-center gap-2 mt-0.5">
            <Layers className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={currentProject.id}
              onChange={(e) => onSelectProject(e.target.value)}
              className="bg-transparent text-xs text-slate-300 font-medium focus:outline-none cursor-pointer hover:text-white border-b border-dashed border-slate-700 pb-0.5"
            >
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id} className="bg-slate-900 text-white">
                  {proj.name} ({proj.topics.length} topics)
                </option>
              ))}
            </select>

            <button
              onClick={onNewBlankProject}
              className="text-[11px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 flex items-center gap-0.5 font-medium transition"
              title="Create New Blank Project"
            >
              <Plus className="h-3 w-3" /> New
            </button>

            {projects.length > 1 && (
              <button
                onClick={() => onDeleteProject(currentProject.id)}
                className="text-[11px] p-0.5 rounded text-slate-500 hover:text-red-400 transition"
                title="Delete Current Project"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center flex-wrap gap-2">
        <button
          onClick={onOpenUpload}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          title="Upload new PDF or paste topics"
        >
          <Upload className="h-3.5 w-3.5 text-cyan-400" />
          <span>Upload PDF / New Topics</span>
        </button>

        <button
          onClick={onOpenTemplates}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          title="Customize Master Prompts"
        >
          <FileText className="h-3.5 w-3.5 text-purple-400" />
          <span>Master Prompts</span>
        </button>

        <button
          onClick={onOpenBatch}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20 transition"
          title="Batch Export prompts"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Batch Export</span>
        </button>

        <button
          onClick={onOpenAutoPilot}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white shadow-lg shadow-purple-500/30 transition animate-pulse"
          title="Run 100% Full Auto-Pilot Bot"
        >
          <Bot className="h-4 w-4" />
          <span>⚡ Full Auto-Pilot Bot</span>
        </button>

        <a
          href="https://labs.google/fx/tools/flow"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
        >
          <span>Open Google Flow</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>

        <button
          onClick={onOpenSettings}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition"
          title="Settings & AI Keys"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};
