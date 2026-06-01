import OpenAI from "openai";
import {
  PARAGRAPH_SYSTEM_PROMPT,
  DOCUMENT_SYSTEM_PROMPT,
  VALID_PARAGRAPH_RULE_IDS,
  VALID_DOCUMENT_RULE_IDS,
} from "@/lib/analyze/prompt";
import {
  paragraphToolOpenAI,
  documentToolOpenAI,
  type ParagraphFeedback,
  type DocumentFeedback,
} from "@/lib/analyze/tools";
import type { AnalysisProvider, ParagraphResult, DocumentResult } from "./types";

/**
 * Inception Labs / Mercury — diffusion language model exposed via an
 * OpenAI-compatible chat completions endpoint.
 *
 * Same JSON-schema tool definitions as the Anthropic provider; only the
 * envelope differs (function calling vs Anthropic's tool_use blocks).
 * Prompts and rules are shared verbatim.
 */
const INCEPTION_BASE_URL =
  process.env.WW_INCEPTION_BASE_URL ?? "https://api.inceptionlabs.ai/v1";
const PARAGRAPH_MODEL = process.env.WW_INCEPTION_PARAGRAPH_MODEL ?? "mercury-2";
const DOCUMENT_MODEL = process.env.WW_INCEPTION_DOCUMENT_MODEL ?? "mercury-2";

function client() {
  if (!process.env.INCEPTION_API_KEY) {
    throw new Error("INCEPTION_API_KEY is not set on the server.");
  }
  return new OpenAI({
    apiKey: process.env.INCEPTION_API_KEY,
    baseURL: INCEPTION_BASE_URL,
  });
}

function parseToolArgs<T>(arg: string | undefined): T | undefined {
  if (!arg) return undefined;
  try {
    return JSON.parse(arg) as T;
  } catch {
    // OpenAI-compat models occasionally return mildly malformed JSON.
    // Try a permissive recovery: trim trailing junk after the last `}`.
    const lastBrace = arg.lastIndexOf("}");
    if (lastBrace > 0) {
      try {
        return JSON.parse(arg.slice(0, lastBrace + 1)) as T;
      } catch {
        return undefined;
      }
    }
    return undefined;
  }
}

export const inceptionProvider: AnalysisProvider = {
  id: "inception",
  paragraphModelName: PARAGRAPH_MODEL,
  documentModelName: DOCUMENT_MODEL,

  async analyzeParagraph({ focusParagraph, documentBody }): Promise<ParagraphResult> {
    const c = client();
    const userText =
      documentBody && documentBody.length > 0
        ? `Surrounding document (for context only — do NOT flag phrases outside the focus paragraph):\n\n${documentBody}\n\nFocus paragraph (analyze ONLY this paragraph):\n\n${focusParagraph}`
        : `Focus paragraph (analyze ONLY this paragraph):\n\n${focusParagraph}`;

    const started = Date.now();
    const resp = await c.chat.completions.create({
      model: PARAGRAPH_MODEL,
      max_tokens: 1024,
      messages: [
        { role: "system", content: PARAGRAPH_SYSTEM_PROMPT },
        { role: "user", content: userText },
      ],
      tools: [paragraphToolOpenAI],
      tool_choice: {
        type: "function",
        function: { name: paragraphToolOpenAI.function.name },
      },
    });
    const latencyMs = Date.now() - started;

    const toolCall = resp.choices?.[0]?.message?.tool_calls?.[0];
    const args =
      toolCall && toolCall.type === "function" ? toolCall.function.arguments : undefined;
    const raw = parseToolArgs<ParagraphFeedback>(args) ?? {
      issues: [],
      improvements: [],
      praises: [],
    };
    const feedback = filterParagraph(raw, focusParagraph);

    return {
      feedback,
      meta: {
        provider: "inception",
        modelName: PARAGRAPH_MODEL,
        latencyMs,
      },
    };
  },

  async analyzeDocument({ documentBody }): Promise<DocumentResult> {
    const c = client();
    const started = Date.now();
    const resp = await c.chat.completions.create({
      model: DOCUMENT_MODEL,
      max_tokens: 1500,
      messages: [
        { role: "system", content: DOCUMENT_SYSTEM_PROMPT },
        { role: "user", content: `Document to analyze:\n\n${documentBody}` },
      ],
      tools: [documentToolOpenAI],
      tool_choice: {
        type: "function",
        function: { name: documentToolOpenAI.function.name },
      },
    });
    const latencyMs = Date.now() - started;

    const toolCallDoc = resp.choices?.[0]?.message?.tool_calls?.[0];
    const argsDoc =
      toolCallDoc && toolCallDoc.type === "function"
        ? toolCallDoc.function.arguments
        : undefined;
    const raw = parseToolArgs<DocumentFeedback>(argsDoc) ?? {
      observations: [],
    };
    const feedback = filterDocument(raw);

    return {
      feedback,
      meta: {
        provider: "inception",
        modelName: DOCUMENT_MODEL,
        latencyMs,
      },
    };
  },
};

function filterParagraph(
  raw: ParagraphFeedback,
  paragraphText: string
): ParagraphFeedback {
  const inText = (phrase: string) => paragraphText.includes(phrase);
  const validRule = (id: string) => VALID_PARAGRAPH_RULE_IDS.has(id);
  return {
    issues: (raw.issues ?? []).filter((i) => validRule(i.ruleId) && inText(i.phrase)),
    improvements: (raw.improvements ?? []).filter(
      (i) => validRule(i.ruleId) && inText(i.phrase)
    ),
    praises: (raw.praises ?? []).filter((p) => validRule(p.ruleId) && inText(p.phrase)),
  };
}

function filterDocument(raw: DocumentFeedback): DocumentFeedback {
  return {
    observations: (raw.observations ?? []).filter((o) =>
      VALID_DOCUMENT_RULE_IDS.has(o.ruleId)
    ),
    one_sentence_summary: raw.one_sentence_summary,
  };
}
