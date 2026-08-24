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
      
      let pageText = '';
      for (const item of content.items as any[]) {
        pageText += item.str + (item.hasEOL ? '\n' : ' ');
      }
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
  if (!rawText || !rawText.trim()) return [];

  // 1. First split by lookahead of numbered patterns (e.g. "1. ", "2. ", "100. ")
  // This correctly splits even if an entire page is merged into a single line!
  const chunks = rawText.split(/(?=\b\d{1,4}[\.\)\-]\s+)/g);
  const topics: TopicItem[] = [];
  let autoId = 1;

  for (const chunk of chunks) {
    const trimmed = chunk.trim();
    if (!trimmed) continue;

    // Check if starts with a number like "1. Business Strategy & Management"
    const match = trimmed.match(/^(\d{1,4})[\.\)\-]?\s+([^\n\r]+)/);
    if (match) {
      const parsedId = parseInt(match[1], 10);
      const title = match[2]
        .replace(/\s+/g, ' ')
        .replace(/\s*page\s*\d+\s*$/i, '')
        .trim();

      if (title.length > 1) {
        topics.push({
          id: isNaN(parsedId) ? autoId++ : parsedId,
          topic: title,
          status: 'pending'
        });
      }
    } else {
      // Fallback for lines without numbers
      const sublines = trimmed.split(/\r?\n/);
      for (const s of sublines) {
        const sTrimmed = s.trim();
        if (sTrimmed.length > 3 && !sTrimmed.toLowerCase().startsWith('page ')) {
          topics.push({
            id: autoId++,
            topic: sTrimmed,
            status: 'pending'
          });
        }
      }
    }
  }

  // Remove duplicates by ID and sort ascending
  const uniqueMap = new Map<number, TopicItem>();
  for (const t of topics) {
    if (!uniqueMap.has(t.id)) {
      uniqueMap.set(t.id, t);
    }
  }

  return Array.from(uniqueMap.values()).sort((a, b) => a.id - b.id);
}
