import React, { useState } from 'react';
import { X, Upload, FileUp, FileText, CheckCircle2, AlertCircle, Plus } from 'lucide-react';
import { parsePdfFile, extractTopicsFromText } from '@/lib/pdfParser';
import { ProjectData, TopicItem } from '@/lib/types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (project: ProjectData) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onCreateProject,
}) => {
  const [projectName, setProjectName] = useState('');
  const [activeTab, setActiveTab] = useState<'pdf' | 'paste'>('pdf');
  const [pastedText, setPastedText] = useState('');
  const [parsedTopics, setParsedTopics] = useState<TopicItem[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    setIsParsing(true);
    try {
      if (file.name.endsWith('.pdf')) {
        const topics = await parsePdfFile(file);
        setParsedTopics(topics);
        if (!projectName) {
          setProjectName(file.name.replace(/\.[^/.]+$/, ''));
        }
      } else {
        const text = await file.text();
        const topics = extractTopicsFromText(text);
        setParsedTopics(topics);
        if (!projectName) {
          setProjectName(file.name.replace(/\.[^/.]+$/, ''));
        }
      }
    } catch (err: any) {
      console.error('File parsing error:', err);
      setErrorMsg('Could not parse PDF. Please try pasting the text or checking the PDF format.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleParseText = () => {
    if (!pastedText.trim()) return;
    const topics = extractTopicsFromText(pastedText);
    setParsedTopics(topics);
    if (!projectName) {
      setProjectName(`Project Batch (${topics.length} topics)`);
    }
  };

  const handleCreate = () => {
    if (parsedTopics.length === 0) return;
    const newProject: ProjectData = {
      id: `project-${Date.now()}`,
      name: projectName.trim() || `Project (${parsedTopics.length} topics)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      topics: parsedTopics,
    };
    onCreateProject(newProject);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#0f172a] border border-slate-700 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-5 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Add New PDF or Topics</h3>
              <p className="text-xs text-slate-400">Create a new batch project with custom topics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          <div>
            <label className="text-xs font-semibold text-slate-300">Project / Batch Name</label>
            <input
              type="text"
              placeholder="e.g. Healthcare Icon Batch 2026"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full mt-1.5 p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 placeholder-slate-500"
            />
          </div>

          {/* Mode Switcher */}
          <div className="flex gap-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('pdf')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'pdf'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileUp className="h-4 w-4" /> Upload PDF / TXT
            </button>
            <button
              onClick={() => setActiveTab('paste')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'paste'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="h-4 w-4" /> Paste Topics List
            </button>
          </div>

          {activeTab === 'pdf' ? (
            <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500/60 rounded-2xl p-8 text-center bg-slate-950/40 transition">
              <input
                type="file"
                accept=".pdf,.txt,.csv"
                onChange={handleFileUpload}
                id="file-upload"
                className="hidden"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <div className="h-12 w-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                  <FileUp className="h-6 w-6" />
                </div>
                <span className="text-xs font-medium text-slate-200">
                  {isParsing ? 'Parsing PDF contents...' : 'Click to select a PDF or text file'}
                </span>
                <span className="text-[11px] text-slate-500">
                  Supports PDF, TXT with numbered topics
                </span>
              </label>
            </div>
          ) : (
            <div className="space-y-2">
              <textarea
                rows={8}
                placeholder="Paste your numbered topics here (e.g.):&#10;1. Business Strategy&#10;2. Artificial Intelligence&#10;3. Cybersecurity"
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                className="w-full p-3 bg-slate-950 font-mono text-xs text-slate-200 rounded-xl border border-slate-700 focus:outline-none focus:border-purple-500"
              />
              <button
                type="button"
                onClick={handleParseText}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-purple-300 font-medium transition"
              >
                Parse Topics
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Parsed Topics Preview */}
          {parsedTopics.length > 0 && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
              <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Successfully Extracted {parsedTopics.length} Topics!</span>
                </div>
              </div>
              <div className="max-h-32 overflow-y-auto divide-y divide-emerald-500/10 text-xs text-slate-300 font-mono">
                {parsedTopics.slice(0, 10).map((t) => (
                  <div key={t.id} className="py-1">
                    #{t.id}: {t.topic}
                  </div>
                ))}
                {parsedTopics.length > 10 && (
                  <div className="py-1 text-slate-500 text-[11px]">
                    ...and {parsedTopics.length - 10} more topics
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={parsedTopics.length === 0}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-md shadow-cyan-600/25 transition disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            <span>Create Project ({parsedTopics.length} Topics)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
