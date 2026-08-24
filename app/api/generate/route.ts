import { NextRequest, NextResponse } from 'next/server';
import { generateSmartIcons } from '@/lib/smartGenerator';

export async function POST(req: NextRequest) {
  try {
    const { topic, provider = 'openrouter', model, apiKey: clientApiKey } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const apiKey =
      clientApiKey ||
      (provider === 'openrouter'
        ? process.env.OPENROUTER_API_KEY
        : provider === 'gemini'
        ? process.env.GEMINI_API_KEY
        : process.env.OPENAI_API_KEY);

    if (!apiKey) {
      const fallback = generateSmartIcons(topic);
      return NextResponse.json({ icons: fallback, source: 'smart_offline' });
    }

    const prompt = `You are an expert Adobe Stock contributor, commercial graphic designer, icon-set researcher, and AI prompt engineer.
Theme: "${topic}".
Generate EXACTLY 32 commercially useful, visually distinct, highly recognizable, professional icon concepts directly related to "${topic}" for Adobe Stock.
Rules:
- Exactly 32 numbered lines (1. to 32.)
- No duplicate or near-duplicate concepts
- Suitable for 8x4 grid icon set
- Short descriptive names (2 to 4 words per icon)
- Return ONLY the numbered list of 32 icons without intro or outro.`;

    if (provider === 'gemini') {
      const targetModel = model || 'gemini-1.5-flash';
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`,
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
      return NextResponse.json({ icons: parseLines(rawText, topic), source: 'gemini' });
    }

    // OpenRouter / OpenAI
    const endpoint =
      provider === 'openrouter'
        ? 'https://openrouter.ai/api/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';

    const targetModel =
      model || (provider === 'openrouter' ? 'openai/gpt-4o-mini' : 'gpt-4o-mini');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    };

    if (provider === 'openrouter') {
      headers['HTTP-Referer'] = 'https://adobe-stock-icon-pipeline.vercel.app';
      headers['X-Title'] = 'Adobe Stock Icon Generator';
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: targetModel,
        messages: [
          { role: 'system', content: 'You are an expert Adobe Stock icon researcher.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();
    const rawText = data?.choices?.[0]?.message?.content || '';
    return NextResponse.json({ icons: parseLines(rawText, topic), source: provider });

  } catch (error: any) {
    console.error('API generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function parseLines(rawText: string, fallbackTopic: string): string[] {
  if (!rawText) return generateSmartIcons(fallbackTopic);
  const lines = rawText
    .split('\n')
    .map(line => line.replace(/^\d+[\.\)\-]\s*/, '').trim())
    .filter(line => line.length > 0 && !line.startsWith('#') && !line.toLowerCase().includes('here are'));

  if (lines.length >= 32) return lines.slice(0, 32);
  const fallback = generateSmartIcons(fallbackTopic);
  const combined = [...lines];
  for (const item of fallback) {
    if (combined.length >= 32) break;
    if (!combined.includes(item)) combined.push(item);
  }
  return combined.slice(0, 32);
}
