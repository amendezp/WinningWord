import type Anthropic from "@anthropic-ai/sdk";

export const paragraphTool: Anthropic.Tool = {
  name: "report_paragraph_feedback",
  description:
    "Report writing issues and praises for the focus paragraph. Use this tool exactly once per response.",
  input_schema: {
    type: "object",
    properties: {
      issues: {
        type: "array",
        items: {
          type: "object",
          properties: {
            phrase: {
              type: "string",
              description:
                "Exact verbatim substring of the focus paragraph to highlight.",
            },
            ruleId: {
              type: "string",
              description: "Rule id from the catalog.",
            },
            rationale: {
              type: "string",
              description: "≤140 chars. Plain language.",
            },
            suggestion: {
              type: "string",
              description: "Optional concrete rewrite of the phrase.",
            },
          },
          required: ["phrase", "ruleId", "rationale"],
        },
      },
      praises: {
        type: "array",
        items: {
          type: "object",
          properties: {
            phrase: { type: "string" },
            ruleId: { type: "string" },
            rationale: { type: "string" },
          },
          required: ["phrase", "ruleId", "rationale"],
        },
      },
    },
    required: ["issues", "praises"],
  },
};

export const documentTool: Anthropic.Tool = {
  name: "report_document_feedback",
  description:
    "Report document-level observations (structure, audience, BLUF, redundancy, arc) and a one-sentence summary.",
  input_schema: {
    type: "object",
    properties: {
      observations: {
        type: "array",
        items: {
          type: "object",
          properties: {
            ruleId: { type: "string" },
            severity: {
              type: "string",
              enum: ["info", "suggest", "warn"],
            },
            rationale: { type: "string" },
            suggestion: { type: "string" },
          },
          required: ["ruleId", "severity", "rationale"],
        },
      },
      one_sentence_summary: {
        type: "string",
        description:
          "Your honest attempt at restating the document in one sentence — the 'if you boiled it down' test.",
      },
    },
    required: ["observations"],
  },
};

// Tightly-typed views of what the model returns.
export type ParagraphFeedback = {
  issues: Array<{
    phrase: string;
    ruleId: string;
    rationale: string;
    suggestion?: string;
  }>;
  praises: Array<{
    phrase: string;
    ruleId: string;
    rationale: string;
  }>;
};

export type DocumentFeedback = {
  observations: Array<{
    ruleId: string;
    severity: "info" | "suggest" | "warn";
    rationale: string;
    suggestion?: string;
  }>;
  one_sentence_summary?: string;
};
