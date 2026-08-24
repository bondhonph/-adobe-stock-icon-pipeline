import React, { useState, useMemo } from 'react';
import { Search, CheckCircle2, Star, Clock, Plus, Filter, Sparkles } from 'lucide-react';
import { TopicItem } from '@/lib/types';

interface TopicSelectorProps {
  topics: TopicItem[];
  selectedTopicId: number | null;
  onSelectTopic: (topic: TopicItem) => void;
  onAddTopic: (title: string) => void;
  onToggleStar: (id: number) => void;
  onToggleStatus: (id: number) => void;
}

export const TopicSelector: React.FC<TopicSelectorProps> = ({
  topics,
  selectedTopicId,
  onSelectTopic,
  onAddTopic,
  onToggleStar,
  onToggleStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'done' | 'starred'>('all');
  const [batchRange, setBatchRange] = useState<string>('all');
  const [newTopicInput, setNewTopicInput] = useState('');

  // Calculate batch chunks (50 items per chunk)
  const batchOptions = useMemo(() => {
    const total = topics.length;
    const options = [{ label: `All (${total})`, value: 'all' }];
    for (let i = 0; i < total; i += 50) {
      const start = i + 1;
      const end = Math.min(i + 50, total);
      options.push({ label: `${start}–${end}`, value: `${start}-${end}` });
    }
    return options;
  }, [topics.length]);

  // Filter topics
  const filteredTopics = useMemo(() => {
    return topics.filter((t) => {
      // Search matching
      const matchesSearch =
        t.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.id.toString().includes(searchTerm);
      if (!matchesSearch) return false;

      // Status filter
      if (statusFilter === 'done' && t.status !== 'done') return false;
      if (statusFilter === 'pending' && t.status === 'done') return false;
      if (statusFilter === 'starred' && t.status !== 'starred') return false;

      // Batch filter
      if (batchRange !== 'all') {
        const [start, end] = batchRange.split('-').map(Number);
        if (t.id < start || t.id > end) return false;
      }

      return true;
    });
  }, [topics, searchTerm, statusFilter, batchRange]);

  const doneCount = topics.filter((t) => t.status === 'done').length;
  const progressPercent = topics.length > 0 ? Math.round((doneCount / topics.length) * 100) : 0;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTopicInput.trim()) {
      onAddTopic(newTopicInput.trim());
      setNewTopicInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1322] border-r border-slate-800 w-full lg:w-96 flex-shrink-0">
      {/* Search & Add Bar */}
      <div className="p-3.5 border-b border-slate-800 space-y-2.5">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search topic or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900/90 text-sm text-slate-100 rounded-lg border border-slate-700/80 focus:outline-none focus:border-purple-500 placeholder-slate-500"
          />
        </div>

        {/* Quick Add Form */}
        <form onSubmit={handleAddSubmit} className="flex gap-1.5">
          <input
            type="text"
            placeholder="+ Add custom topic..."
            value={newTopicInput}
            onChange={(e) => setNewTopicInput(e.target.value)}
            className="flex-1 px-3 py-1.5 bg-slate-900/60 text-xs text-slate-200 rounded-md border border-slate-800 focus:outline-none focus:border-cyan-500 placeholder-slate-600"
          />
          <button
            type="submit"
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-md text-xs font-semibold border border-slate-700 transition"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </form>

        {/* Batch Range Pill Selector */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs no-scrollbar">
          {batchOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setBatchRange(opt.value)}
              className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition ${
                batchRange === opt.value
                  ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Status Filter & Progress */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex gap-1 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2 py-0.5 rounded ${statusFilter === 'all' ? 'bg-slate-700 text-white font-medium' : 'text-slate-500 hover:text-slate-300'}`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-2 py-0.5 rounded ${statusFilter === 'pending' ? 'bg-amber-500/20 text-amber-400 font-medium' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter('done')}
              className={`px-2 py-0.5 rounded ${statusFilter === 'done' ? 'bg-emerald-500/20 text-emerald-400 font-medium' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Done ({doneCount})
            </button>
            <button
              onClick={() => setStatusFilter('starred')}
              className={`px-2 py-0.5 rounded ${statusFilter === 'starred' ? 'bg-yellow-500/20 text-yellow-400 font-medium' : 'text-slate-500 hover:text-slate-300'}`}
            >
              ★
            </button>
          </div>

          <span className="text-[11px] text-slate-400 font-mono">
            {progressPercent}% Done
          </span>
        </div>

        {/* Mini Progress Bar */}
        <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-purple-500 to-emerald-400 h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Topics List Scroll Area */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
        {filteredTopics.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No topics match your filter.
          </div>
        ) : (
          filteredTopics.map((t) => {
            const isSelected = selectedTopicId === t.id;
            const isDone = t.status === 'done';
            const isStarred = t.status === 'starred';

            return (
              <div
                key={t.id}
                onClick={() => onSelectTopic(t)}
                className={`group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition border ${
                  isSelected
                    ? 'bg-purple-950/40 border-purple-500/50 shadow-md shadow-purple-950/50 text-white'
                    : 'bg-slate-900/40 border-transparent hover:bg-slate-800/60 hover:border-slate-700/60 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded ${
                    isSelected ? 'bg-purple-500 text-white font-bold' : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                  }`}>
                    {t.id}
                  </span>
                  <span className="text-xs font-medium truncate group-hover:text-white">
                    {t.topic}
                  </span>
                </div>

                {/* Status Toggle Buttons */}
                <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onToggleStar(t.id)}
                    className={`p-1 rounded hover:bg-slate-700/60 transition ${
                      isStarred ? 'text-yellow-400' : 'text-slate-600 hover:text-slate-400'
                    }`}
                    title="Star / Favorite"
                  >
                    <Star className="h-3.5 w-3.5 fill-current" />
                  </button>

                  <button
                    onClick={() => onToggleStatus(t.id)}
                    className={`p-1 rounded hover:bg-slate-700/60 transition ${
                      isDone ? 'text-emerald-400' : 'text-slate-600 hover:text-slate-400'
                    }`}
                    title={isDone ? 'Marked Done' : 'Mark as Done'}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 fill-current" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
