'use client';

import React, { useState, useEffect, useCallback } from 'react';
import defaultTopicsData from '@/data/defaultTopics.json';
import { Header } from '@/components/Header';
import { TopicSelector } from '@/components/TopicSelector';
import { PromptViewer } from '@/components/PromptViewer';
import { BatchModal } from '@/components/BatchModal';
import { TemplateModal } from '@/components/TemplateModal';
import { UploadModal } from '@/components/UploadModal';
import { SettingsModal } from '@/components/SettingsModal';
import { TopicItem, ProjectData, PromptTemplate, AISettings } from '@/lib/types';
import { DEFAULT_PROMPT_TEMPLATES, buildPrompts } from '@/lib/promptTemplates';
import { generateSmartIcons } from '@/lib/smartGenerator';
import { generateIconsWithAI } from '@/lib/aiService';

const DEFAULT_PROJECT_ID = 'default-pdf-500';

export default function DashboardPage() {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string>(DEFAULT_PROJECT_ID);
  const [templates, setTemplates] = useState<PromptTemplate[]>(DEFAULT_PROMPT_TEMPLATES);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(DEFAULT_PROMPT_TEMPLATES[0].id);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSettings, setAiSettings] = useState<AISettings>({
    provider: 'smart_offline',
    apiKey: '',
    model: '',
    temperature: 0.7,
  });

  // Modal States
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Initialize from LocalStorage or default
  useEffect(() => {
    try {
      const savedProjects = localStorage.getItem('adobe_icon_projects');
      const savedTemplates = localStorage.getItem('adobe_icon_templates');
      const savedSettings = localStorage.getItem('adobe_icon_settings');

      if (savedTemplates) {
        setTemplates(JSON.parse(savedTemplates));
      }

      if (savedSettings) {
        setAiSettings(JSON.parse(savedSettings));
      }

      if (savedProjects) {
        const parsed = JSON.parse(savedProjects);
        setProjects(parsed);
      } else {
        // Initial setup with default 500 topics
        const initialProject: ProjectData = {
          id: DEFAULT_PROJECT_ID,
          name: 'Icon (1).pdf (500 Topics)',
          description: 'Official 500 topic dataset for Adobe Stock',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          topics: defaultTopicsData as TopicItem[],
        };
        setProjects([initialProject]);
        localStorage.setItem('adobe_icon_projects', JSON.stringify([initialProject]));
      }
    } catch (e) {
      console.error('Error loading stored data:', e);
    }
  }, []);

  // Save projects to localStorage on change
  const saveProjects = useCallback((updatedProjects: ProjectData[]) => {
    setProjects(updatedProjects);
    try {
      localStorage.setItem('adobe_icon_projects', JSON.stringify(updatedProjects));
    } catch (e) {
      console.error('Error saving projects:', e);
    }
  }, []);

  const currentProject = projects.find((p) => p.id === currentProjectId) || projects[0] || {
    id: DEFAULT_PROJECT_ID,
    name: 'Loading...',
    createdAt: '',
    updatedAt: '',
    topics: defaultTopicsData as TopicItem[],
  };

  const currentTemplate =
    templates.find((t) => t.id === selectedTemplateId) || templates[0] || DEFAULT_PROMPT_TEMPLATES[0];

  const selectedTopic =
    currentProject.topics.find((t) => t.id === selectedTopicId) || currentProject.topics[0] || null;

  // Auto-generate prompts for current selected topic if missing
  const generateForTopic = useCallback(
    async (topicItem: TopicItem, forceRegenerate = false) => {
      if (!topicItem) return;

      if (!forceRegenerate && topicItem.iconList && topicItem.iconList.length >= 32 && topicItem.outlinePrompt) {
        return;
      }

      setIsGenerating(true);
      try {
        let icons: string[] = [];
        if (aiSettings.provider === 'smart_offline' || !aiSettings.apiKey) {
          icons = generateSmartIcons(topicItem.topic);
        } else {
          icons = await generateIconsWithAI(topicItem.topic, aiSettings);
        }

        const { outlinePrompt, solidPrompt } = buildPrompts(topicItem.topic, icons, currentTemplate);

        const updatedTopics = currentProject.topics.map((t) =>
          t.id === topicItem.id
            ? {
                ...t,
                iconList: icons,
                outlinePrompt,
                solidPrompt,
              }
            : t
        );

        const updatedProjects = projects.map((p) =>
          p.id === currentProject.id ? { ...p, topics: updatedTopics } : p
        );

        saveProjects(updatedProjects);
      } catch (err) {
        console.error('Error generating prompts:', err);
      } finally {
        setIsGenerating(false);
      }
    },
    [aiSettings, currentProject, currentTemplate, projects, saveProjects]
  );

  // Trigger generation when selected topic changes and lacks prompts
  useEffect(() => {
    if (selectedTopic && (!selectedTopic.outlinePrompt || !selectedTopic.iconList)) {
      generateForTopic(selectedTopic, false);
    }
  }, [selectedTopic, generateForTopic]);

  const handleSelectTopic = (topic: TopicItem) => {
    setSelectedTopicId(topic.id);
  };

  const handleToggleStatus = (id: number) => {
    const updatedTopics = currentProject.topics.map((t) =>
      t.id === id ? { ...t, status: (t.status === 'done' ? 'pending' : 'done') as any } : t
    );
    const updatedProjects = projects.map((p) =>
      p.id === currentProject.id ? { ...p, topics: updatedTopics } : p
    );
    saveProjects(updatedProjects);
  };

  const handleToggleStar = (id: number) => {
    const updatedTopics = currentProject.topics.map((t) =>
      t.id === id ? { ...t, status: (t.status === 'starred' ? 'pending' : 'starred') as any } : t
    );
    const updatedProjects = projects.map((p) =>
      p.id === currentProject.id ? { ...p, topics: updatedTopics } : p
    );
    saveProjects(updatedProjects);
  };

  const handleAddTopic = (title: string) => {
    const maxId = currentProject.topics.reduce((max, t) => Math.max(max, t.id), 0);
    const newTopic: TopicItem = {
      id: maxId + 1,
      topic: title,
      status: 'pending',
    };
    const updatedTopics = [...currentProject.topics, newTopic];
    const updatedProjects = projects.map((p) =>
      p.id === currentProject.id ? { ...p, topics: updatedTopics } : p
    );
    saveProjects(updatedProjects);
    setSelectedTopicId(newTopic.id);
  };

  const handleUpdateIcons = (newIcons: string[]) => {
    if (!selectedTopic) return;
    const { outlinePrompt, solidPrompt } = buildPrompts(selectedTopic.topic, newIcons, currentTemplate);
    const updatedTopics = currentProject.topics.map((t) =>
      t.id === selectedTopic.id
        ? {
            ...t,
            iconList: newIcons,
            outlinePrompt,
            solidPrompt,
          }
        : t
    );
    const updatedProjects = projects.map((p) =>
      p.id === currentProject.id ? { ...p, topics: updatedTopics } : p
    );
    saveProjects(updatedProjects);
  };

  const handleNextTopic = () => {
    if (!selectedTopic) return;
    const currentIndex = currentProject.topics.findIndex((t) => t.id === selectedTopic.id);
    if (currentIndex >= 0 && currentIndex < currentProject.topics.length - 1) {
      setSelectedTopicId(currentProject.topics[currentIndex + 1].id);
    }
  };

  const handleCreateProject = (newProject: ProjectData) => {
    const updatedProjects = [...projects, newProject];
    saveProjects(updatedProjects);
    setCurrentProjectId(newProject.id);
    if (newProject.topics.length > 0) {
      setSelectedTopicId(newProject.topics[0].id);
    }
  };

  const handleSaveTemplates = (newTemplates: PromptTemplate[]) => {
    setTemplates(newTemplates);
    localStorage.setItem('adobe_icon_templates', JSON.stringify(newTemplates));
  };

  const handleSaveSettings = (newSettings: AISettings) => {
    setAiSettings(newSettings);
    localStorage.setItem('adobe_icon_settings', JSON.stringify(newSettings));
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#090d16]">
      {/* Top Header */}
      <Header
        currentProject={currentProject}
        projects={projects}
        onSelectProject={setCurrentProjectId}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onOpenBatch={() => setIsBatchOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Sidebar: 500 Topics Manager */}
        <TopicSelector
          topics={currentProject.topics}
          selectedTopicId={selectedTopicId}
          onSelectTopic={handleSelectTopic}
          onAddTopic={handleAddTopic}
          onToggleStar={handleToggleStar}
          onToggleStatus={handleToggleStatus}
        />

        {/* Center Workspace: 32 Icons & Ready Prompts */}
        <PromptViewer
          topic={selectedTopic}
          template={currentTemplate}
          isGenerating={isGenerating}
          onGenerate={() => selectedTopic && generateForTopic(selectedTopic, true)}
          onUpdateIcons={handleUpdateIcons}
          onToggleStatus={handleToggleStatus}
          onToggleStar={handleToggleStar}
          onNextTopic={handleNextTopic}
        />
      </div>

      {/* Modals */}
      <BatchModal
        isOpen={isBatchOpen}
        onClose={() => setIsBatchOpen(false)}
        topics={currentProject.topics}
        template={currentTemplate}
      />

      <TemplateModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        templates={templates}
        selectedTemplateId={selectedTemplateId}
        onSelectTemplate={setSelectedTemplateId}
        onSaveTemplates={handleSaveTemplates}
      />

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onCreateProject={handleCreateProject}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={aiSettings}
        onSaveSettings={handleSaveSettings}
      />
    </div>
  );
}
