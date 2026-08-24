import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const pdfPath = path.join(process.cwd(), '..', 'Icon (1).pdf');
    if (!fs.existsSync(pdfPath)) {
      return NextResponse.json({ topics: [] });
    }

    const dataBuffer = fs.readFileSync(pdfPath);
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.js');
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(dataBuffer) });
    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      for (const item of (content.items as any[])) {
        fullText += item.str + (item.hasEOL ? '\n' : ' ');
      }
      fullText += '\n';
    }

    const regex = /(?:^|\s+)(\d{1,4})[\.\)\-]\s+([\s\S]+?)(?=\s+\d{1,4}[\.\)\-]|$)/g;
    const matches = [...fullText.matchAll(regex)];
    const topics: { id: number; topic: string }[] = [];
    const seen = new Set<number>();

    for (const m of matches) {
      const id = parseInt(m[1], 10);
      let title = m[2].replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').replace(/\s*page\s*\d+\s*$/i, '').trim();
      if (title.length > 1 && !seen.has(id)) {
        seen.add(id);
        topics.push({ id, topic: title });
      }
    }

    return NextResponse.json({ topics, total: topics.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, topics: [] }, { status: 500 });
  }
}
