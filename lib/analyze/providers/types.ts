import type { ParagraphFeedback, DocumentFeedback } from "@/lib/analyze/tools";

/**
 * Provider abstraction kept as scaffolding even after Mercury was removed.
 * Adding a second backend later is mechanical — implement `AnalysisProvider`
 * and register it in `./index`.
 */
export type ProviderId = "anthropic";

export type AnalysisMeta = {
  provider: ProviderId;
  modelName: string;
  latencyMs: number;
};

export type ParagraphResult = {
  feedback: ParagraphFeedback;
  meta: AnalysisMeta;
};

export type DocumentResult = {
  feedback: DocumentFeedback;
  meta: AnalysisMeta;
};

export interface AnalysisProvider {
  id: ProviderId;
  paragraphModelName: string;
  documentModelName: string;
  analyzeParagraph(args: {
    focusParagraph: string;
    documentBody?: string;
  }): Promise<ParagraphResult>;
  analyzeDocument(args: { documentBody: string }): Promise<DocumentResult>;
}
