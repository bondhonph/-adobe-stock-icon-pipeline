export interface TopicItem {
  id: number;
  topic: string;
  category?: string;
  status?: 'pending' | 'generating' | 'done' | 'starred';
  iconList?: string[];
  outlinePrompt?: string;
  solidPrompt?: string;
  notes?: string;
}

export interface ProjectData {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  topics: TopicItem[];
  selectedPromptTemplateId?: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  isDefault?: boolean;
  outlineTemplate: string;
  solidTemplate: string;
}

export interface AISettings {
  provider: 'gemini' | 'openai' | 'groq' | 'openrouter' | 'smart_offline';
  apiKey: string;
  model: string;
  temperature: number;
}
