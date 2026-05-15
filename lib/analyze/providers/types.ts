import type { ParagraphFeedback, DocumentFeedback } from "@/lib/analyze/tools";

export type ProviderId = "anthropic" | "inception";

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
