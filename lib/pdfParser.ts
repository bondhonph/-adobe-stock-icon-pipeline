import { TopicItem } from './types';

export async function parsePdfFile(file: File): Promise<TopicItem[]> {
  const arrayBuffer = await file.arrayBuffer();

  try {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.js');
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`;
    }

    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      
      for (const item of content.items as any[]) {
        fullText += item.str + (item.hasEOL ? '\n' : ' ');
      }
      fullText += '\n';
    }

    return extractTopicsFromText(fullText);
  } catch (e) {
    console.warn('PDF parser fallback to text decoder:', e);
    const decoder = new TextDecoder('utf-8');
    const text = decoder.decode(arrayBuffer);
    return extractTopicsFromText(text);
  }
}

export function extractTopicsFromText(rawText: string): TopicItem[] {
  if (!rawText || !rawText.trim()) return [];

  // Match all numbered topics: "1. Topic Name 2. Topic Name..."
  const regex = /(?:^|\s+)(\d{1,4})[\.\)\-]\s+([\s\S]+?)(?=\s+\d{1,4}[\.\)\-]|$)/g;
  const matches = [...rawText.matchAll(regex)];

  if (matches.length > 0) {
    const topics: TopicItem[] = [];
    const seenIds = new Set<number>();

    for (const match of matches) {
      const id = parseInt(match[1], 10);
      let title = match[2]
        .replace(/[\r\n]+/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/\s*page\s*\d+\s*$/i, '')
        .trim();

      if (title.length > 1 && !seenIds.has(id)) {
        seenIds.add(id);
        topics.push({
          id,
          topic: title,
          status: 'pending'
        });
      }
    }

    if (topics.length > 0) {
      return topics.sort((a, b) => a.id - b.id);
    }
  }

  // Fallback line-by-line parser for unnumbered lists
  const lines = rawText.split(/\r?\n/);
  const fallbackTopics: TopicItem[] = [];
  let autoId = 1;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.toLowerCase().startsWith('page ')) continue;
    fallbackTopics.push({
      id: autoId++,
      topic: trimmed,
      status: 'pending'
    });
  }

  return fallbackTopics;
}
