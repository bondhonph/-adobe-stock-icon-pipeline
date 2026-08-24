import { AISettings } from './types';
import { generateSmartIcons } from './smartGenerator';

export async function generateIconsWithAI(
  topicName: string,
  settings: AISettings
): Promise<string[]> {
  if (settings.provider === 'smart_offline' || !settings.apiKey) {
    return generateSmartIcons(topicName);
  }

  const prompt = `You are an expert Adobe Stock contributor, commercial graphic designer, icon-set researcher, and AI prompt engineer.
Theme: "${topicName}".
Generate EXACTLY 32 commercially useful, visually distinct, highly recognizable, professional icon concepts directly related to "${topicName}" for Adobe Stock.
Rules:
- Exactly 32 numbered lines (1. to 32.)
- No duplicate or near-duplicate concepts
- Suitable for 8x4 grid icon set
- Short descriptive names (2 to 4 words per icon)
- Return ONLY the numbered list of 32 icons without intro or outro.`;

  try {
    if (settings.provider === 'gemini') {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${settings.model || 'gemini-1.5-flash'}:generateContent?key=${settings.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: settings.temperature || 0.7 }
          })
        }
      );

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return parseIconList(rawText, topicName);
    }

    if (settings.provider === 'openai' || settings.provider === 'groq' || settings.provider === 'openrouter') {
      const endpoint =
        settings.provider === 'groq'
          ? 'https://api.groq.com/openai/v1/chat/completions'
          : settings.provider === 'openrouter'
          ? 'https://openrouter.ai/api/v1/chat/completions'
          : 'https://api.openai.com/v1/chat/completions';

      const defaultModel =
        settings.provider === 'groq'
          ? 'llama-3.3-70b-versatile'
          : settings.provider === 'openrouter'
          ? 'google/gemini-2.0-flash-001'
          : 'gpt-4o-mini';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.apiKey}`
        },
        body: JSON.stringify({
          model: settings.model || defaultModel,
          messages: [
            { role: 'system', content: 'You are an expert Adobe Stock icon researcher.' },
            { role: 'user', content: prompt }
          ],
          temperature: settings.temperature || 0.7
        })
      });

      const data = await response.json();
      const rawText = data?.choices?.[0]?.message?.content || '';
      return parseIconList(rawText, topicName);
    }
  } catch (error) {
    console.error('AI generation error, falling back to smart engine:', error);
  }

  return generateSmartIcons(topicName);
}

function parseIconList(rawText: string, fallbackTopic: string): string[] {
  if (!rawText) return generateSmartIcons(fallbackTopic);
  
  const lines = rawText
    .split('\n')
    .map(line => line.replace(/^\d+[\.\)\-]\s*/, '').trim())
    .filter(line => line.length > 0 && !line.startsWith('#') && !line.toLowerCase().includes('here are'));

  if (lines.length >= 32) {
    return lines.slice(0, 32);
  }

  if (lines.length > 0) {
    const fallback = generateSmartIcons(fallbackTopic);
    const combined = [...lines];
    for (const item of fallback) {
      if (combined.length >= 32) break;
      if (!combined.includes(item)) combined.push(item);
    }
    return combined.slice(0, 32);
  }

  return generateSmartIcons(fallbackTopic);
}
