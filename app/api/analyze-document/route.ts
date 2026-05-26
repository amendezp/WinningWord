import { NextRequest, NextResponse } from "next/server";
import type { DocumentFeedback } from "@/lib/analyze/tools";
import { getProvider } from "@/lib/analyze/providers";

export const runtime = "nodejs";
export const maxDuration = 60;

type RequestBody = {
  documentBody: string;
};

export async function POST(req: NextRequest) {
  const body = (await req.json()) as RequestBody;
  if (!body.documentBody || body.documentBody.trim().length < 20) {
    return NextResponse.json({
      observations: [],
      meta: { provider: "anthropic", modelName: "skipped", latencyMs: 0 },
    } satisfies DocumentFeedback & { meta: unknown });
  }

  const provider = getProvider();
  try {
    const { feedback, meta } = await provider.analyzeDocument({
      documentBody: body.documentBody,
    });
    return NextResponse.json({ ...feedback, meta });
  } catch (err) {
    const e = err as { status?: number; message?: string };
    console.error(`[/api/analyze-document] ${provider.id} call failed:`, e.status, e.message);
    return NextResponse.json(
      { error: `${provider.id} call failed: ${e.message ?? "unknown"}`, status: e.status },
      { status: e.status === undefined ? 500 : 502 }
    );
  }
}
