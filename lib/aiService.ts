import { AISettings } from './types';
import { generateSmartIcons } from './smartGenerator';

export async function generateIconsWithAI(
  topicName: string,
  settings: AISettings
): Promise<string[]> {
  // If user selected offline mode explicitly and has no key
  if (settings.provider === 'smart_offline' && !settings.apiKey) {
    return generateSmartIcons(topicName);
  }

  try {
    // 1. First attempt to call the Next.js API Route (which has access to Vercel Environment Variables!)
    const apiRes = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: topicName,
        provider: settings.provider || 'openrouter',
        model: settings.model || 'openai/gpt-4o-mini',
        apiKey: settings.apiKey || undefined
      })
    });

    if (apiRes.ok) {
      const data = await apiRes.json();
      if (data.icons && data.icons.length > 0) {
        return data.icons;
      }
    }
  } catch (err) {
    console.warn('API Route call failed, attempting client-side fallback:', err);
  }

  // 2. Direct client fallback if API route is unavailable
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
      const targetModel = settings.model || 'gemini-1.5-flash';
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${settings.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7 }
          })
        }
      );
      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return parseIconList(rawText, topicName);
    }

    if (settings.provider === 'openrouter' || settings.provider === 'openai') {
      const endpoint =
        settings.provider === 'openrouter'
          ? 'https://openrouter.ai/api/v1/chat/completions'
          : 'https://api.openai.com/v1/chat/completions';

      const defaultModel =
        settings.provider === 'openrouter'
          ? 'openai/gpt-4o-mini'
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
          temperature: 0.7
        })
      });

      const data = await response.json();
      const rawText = data?.choices?.[0]?.message?.content || '';
      return parseIconList(rawText, topicName);
    }
  } catch (error) {
    console.error('Client AI generation error:', error);
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
