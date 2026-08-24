import { TopicItem } from './types';

export async function parsePdfFile(file: File): Promise<TopicItem[]> {
  const arrayBuffer = await file.arrayBuffer();

  try {
    // Dynamic import to avoid bundling canvas on build
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
      const pageText = content.items
        // @ts-ignore
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
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
  const lines = rawText.split(/\r?\n/);
  const topics: TopicItem[] = [];
  let autoId = 1;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if line starts with a number like "1. Topic Name" or "1 Topic Name"
    const match = trimmed.match(/^(\d+)[\.\)\-]?\s+(.+)$/);
    if (match) {
      const parsedId = parseInt(match[1], 10);
      const title = match[2].trim();
      if (title.length > 2) {
        topics.push({
          id: isNaN(parsedId) ? autoId++ : parsedId,
          topic: title,
          status: 'pending'
        });
      }
    } else if (trimmed.length > 3 && !trimmed.toLowerCase().startsWith('page ') && !trimmed.startsWith('#')) {
      topics.push({
        id: autoId++,
        topic: trimmed,
        status: 'pending'
      });
    }
  }

  return topics.sort((a, b) => a.id - b.id);
}
