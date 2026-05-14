import type { ParagraphFeedback, DocumentFeedback } from "./tools";

export async function analyzeParagraph(args: {
  focusParagraph: string;
  documentBody: string;
  signal?: AbortSignal;
}): Promise<ParagraphFeedback> {
  const resp = await fetch("/api/analyze-paragraph", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      focusParagraph: args.focusParagraph,
      documentBody: args.documentBody,
    }),
    signal: args.signal,
  });
  if (!resp.ok) {
    const detail = await resp.text().catch(() => "");
    throw new Error(`analyze-paragraph ${resp.status}: ${detail}`);
  }
  return (await resp.json()) as ParagraphFeedback;
}

export async function analyzeDocument(args: {
  documentBody: string;
  signal?: AbortSignal;
}): Promise<DocumentFeedback> {
  const resp = await fetch("/api/analyze-document", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ documentBody: args.documentBody }),
    signal: args.signal,
  });
  if (!resp.ok) {
    const detail = await resp.text().catch(() => "");
    throw new Error(`analyze-document ${resp.status}: ${detail}`);
  }
  return (await resp.json()) as DocumentFeedback;
}
