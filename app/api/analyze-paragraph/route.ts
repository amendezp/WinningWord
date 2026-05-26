import { NextRequest, NextResponse } from "next/server";
import type { ParagraphFeedback } from "@/lib/analyze/tools";
import { getProvider } from "@/lib/analyze/providers";

export const runtime = "nodejs";
export const maxDuration = 30;

type RequestBody = {
  focusParagraph: string;
  documentBody?: string;
};

export async function POST(req: NextRequest) {
  const body = (await req.json()) as RequestBody;
  if (!body.focusParagraph || body.focusParagraph.trim().length < 4) {
    return NextResponse.json({
      issues: [],
      improvements: [],
      praises: [],
      meta: { provider: "anthropic", modelName: "skipped", latencyMs: 0 },
    } satisfies ParagraphFeedback & { meta: unknown });
  }

  const provider = getProvider();
  try {
    const { feedback, meta } = await provider.analyzeParagraph({
      focusParagraph: body.focusParagraph,
      documentBody: body.documentBody,
    });
    return NextResponse.json({ ...feedback, meta });
  } catch (err) {
    const e = err as { status?: number; message?: string };
    console.error(`[/api/analyze-paragraph] ${provider.id} call failed:`, e.status, e.message);
    return NextResponse.json(
      { error: `${provider.id} call failed: ${e.message ?? "unknown"}`, status: e.status },
      { status: e.status === undefined ? 500 : 502 }
    );
  }
}
