import React, { useState } from 'react';
import { X, Download, FileSpreadsheet, FileJson, FileText, CheckCircle2, Sparkles } from 'lucide-react';
import { TopicItem, PromptTemplate } from '@/lib/types';
import { buildPrompts } from '@/lib/promptTemplates';
import { generateSmartIcons } from '@/lib/smartGenerator';

interface BatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  topics: TopicItem[];
  template: PromptTemplate;
}

export const BatchModal: React.FC<BatchModalProps> = ({
  isOpen,
  onClose,
  topics,
  template,
}) => {
  const [rangeMode, setRangeMode] = useState<'1-50' | '51-100' | '101-150' | 'custom' | 'all'>('1-50');
  const [customStart, setCustomStart] = useState<number>(1);
  const [customEnd, setCustomEnd] = useState<number>(50);
  const [includeLineArt, setIncludeLineArt] = useState(true);
  const [includeSolid, setIncludeSolid] = useState(true);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'txt'>('csv');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const getFilteredTopics = (): TopicItem[] => {
    if (rangeMode === 'all') return topics;
    let start = 1;
    let end = 50;

    if (rangeMode === '1-50') {
      start = 1;
      end = 50;
    } else if (rangeMode === '51-100') {
      start = 51;
      end = 100;
    } else if (rangeMode === '101-150') {
      start = 101;
      end = 150;
    } else if (rangeMode === 'custom') {
      start = customStart;
      end = customEnd;
    }

    return topics.filter((t) => t.id >= start && t.id <= end);
  };

  const handleExport = () => {
    setIsProcessing(true);
    const targetTopics = getFilteredTopics();

    // Prepare complete data with generated icons & prompts
    const preparedData = targetTopics.map((t) => {
      const icons = t.iconList && t.iconList.length >= 32 ? t.iconList : generateSmartIcons(t.topic);
      const { outlinePrompt, solidPrompt } = buildPrompts(t.topic, icons, template);
      return {
        id: t.id,
        topic: t.topic,
        icons: icons,
        outlinePrompt: outlinePrompt,
        solidPrompt: solidPrompt
      };
    });

    if (exportFormat === 'json') {
      const jsonContent = JSON.stringify(preparedData, null, 2);
      downloadFile(jsonContent, `Adobe_Stock_Prompts_${rangeMode}.json`, 'application/json');
    } else if (exportFormat === 'csv') {
      let csvContent = 'ID,Topic Name,32 Icons (Comma Separated),Line Art Prompt,Solid Fill Prompt\n';
      for (const item of preparedData) {
        const iconsEscaped = `"${item.icons.join('; ').replace(/"/g, '""')}"`;
        const lineEscaped = `"${item.outlinePrompt.replace(/"/g, '""')}"`;
        const solidEscaped = `"${item.solidPrompt.replace(/"/g, '""')}"`;
        const topicEscaped = `"${item.topic.replace(/"/g, '""')}"`;
        csvContent += `${item.id},${topicEscaped},${iconsEscaped},${lineEscaped},${solidEscaped}\n`;
      }
      downloadFile(csvContent, `Adobe_Stock_Prompts_${rangeMode}.csv`, 'text/csv');
    } else if (exportFormat === 'txt') {
      let txtContent = `=== ADOBE STOCK FLOW AI PROMPTS BATCH (${rangeMode}) ===\n\n`;
      for (const item of preparedData) {
        txtContent += `========================================================\n`;
        txtContent += `TOPIC #${item.id}: ${item.topic}\n`;
        txtContent += `========================================================\n\n`;
        if (includeLineArt) {
          txtContent += `--- 1. LINE ART PROMPT ---\n${item.outlinePrompt}\n\n`;
        }
        if (includeSolid) {
          txtContent += `--- 2. SOLID FILL PROMPT ---\n${item.solidPrompt}\n\n`;
        }
        txtContent += `\n\n`;
      }
      downloadFile(txtContent, `Adobe_Stock_Prompts_${rangeMode}.txt`, 'text/plain');
    }

    setIsProcessing(false);
    onClose();
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const count = getFilteredTopics().length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#0f172a] border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-5 p-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Batch Export Prompts</h3>
              <p className="text-xs text-slate-400">Export prompts in bulk for automation or archiving</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Range Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">Select Topic Range</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: '1-50', label: '1 – 50' },
              { id: '51-100', label: '51 – 100' },
              { id: '101-150', label: '101 – 150' },
              { id: 'all', label: `All (${topics.length})` },
              { id: 'custom', label: 'Custom Range' },
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => setRangeMode(r.id as any)}
                className={`py-2 px-3 rounded-xl text-xs font-medium border transition ${
                  rangeMode === r.id
                    ? 'bg-purple-600 border-purple-500 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {rangeMode === 'custom' && (
            <div className="flex items-center gap-3 pt-2">
              <div className="flex-1">
                <span className="text-[11px] text-slate-400">Start ID:</span>
                <input
                  type="number"
                  min={1}
                  max={topics.length}
                  value={customStart}
                  onChange={(e) => setCustomStart(Number(e.target.value))}
                  className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
              <div className="flex-1">
                <span className="text-[11px] text-slate-400">End ID:</span>
                <input
                  type="number"
                  min={1}
                  max={topics.length}
                  value={customEnd}
                  onChange={(e) => setCustomEnd(Number(e.target.value))}
                  className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Format Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">Choose Export Format</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setExportFormat('csv')}
              className={`p-3 rounded-xl flex flex-col items-center gap-1.5 border transition ${
                exportFormat === 'csv'
                  ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="h-5 w-5" />
              <span className="text-xs font-semibold">CSV (Excel)</span>
            </button>

            <button
              onClick={() => setExportFormat('txt')}
              className={`p-3 rounded-xl flex flex-col items-center gap-1.5 border transition ${
                exportFormat === 'txt'
                  ? 'bg-cyan-600/20 border-cyan-500 text-cyan-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="h-5 w-5" />
              <span className="text-xs font-semibold">Text (.TXT)</span>
            </button>

            <button
              onClick={() => setExportFormat('json')}
              className={`p-3 rounded-xl flex flex-col items-center gap-1.5 border transition ${
                exportFormat === 'json'
                  ? 'bg-purple-600/20 border-purple-500 text-purple-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <FileJson className="h-5 w-5" />
              <span className="text-xs font-semibold">JSON</span>
            </button>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={handleExport}
            disabled={count === 0 || isProcessing}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-600/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Download className="h-4 w-4" />
            <span>Export {count} Prompts ({exportFormat.toUpperCase()})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
