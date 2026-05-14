import { TopBar } from "@/components/TopBar";
import { RULES } from "@/lib/rules/catalog";

export default function RulesPage() {
  const paragraph = RULES.filter((r) => r.scope === "paragraph");
  const document = RULES.filter((r) => r.scope === "document");

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar />
      <main className="max-w-3xl mx-auto px-6 py-10 w-full">
        <h1 className="text-3xl font-serif mb-2">Rule catalog</h1>
        <p className="text-stone-600 mb-8 text-sm">
          The rules WinningWord actively coaches on. To add or edit one,
          modify <code className="bg-stone-100 px-1 rounded">lib/rules/catalog.ts</code>.
        </p>

        <Section title="Paragraph-scoped" rules={paragraph} />
        <Section title="Document-scoped" rules={document} />
      </main>
    </div>
  );
}

function Section({
  title,
  rules,
}: {
  title: string;
  rules: typeof RULES;
}) {
  return (
    <section className="mb-12">
      <h2 className="text-lg font-medium text-stone-800 mb-3 border-b border-stone-200 pb-1">
        {title}
      </h2>
      <div className="space-y-4">
        {rules.map((r) => (
          <div
            key={r.id}
            className={`rounded-lg border p-4 ${
              r.highlightKind === "issue"
                ? "border-rose-200 bg-rose-50/30"
                : "border-emerald-200 bg-emerald-50/30"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <code className="text-[11px] uppercase tracking-wide bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded">
                {r.id}
              </code>
              <h3 className="font-medium text-stone-900">{r.name}</h3>
              <span
                className={`ml-auto text-[10px] uppercase px-1.5 py-0.5 rounded ${
                  r.highlightKind === "issue"
                    ? "bg-rose-100 text-rose-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {r.highlightKind}
              </span>
            </div>
            <p className="text-sm text-stone-700 mb-2">{r.shortDesc}</p>
            <p className="text-sm text-stone-600 mb-3">{r.longDesc}</p>
            {r.examples.length > 0 && (
              <div className="space-y-2">
                {r.examples.map((ex, i) => (
                  <div
                    key={i}
                    className="border-l-2 border-stone-300 pl-3 text-sm font-serif"
                  >
                    <div className="text-stone-700">
                      <span className="text-stone-400 not-italic font-sans text-[10px] uppercase tracking-wide mr-2">
                        Before
                      </span>
                      “{ex.before}”
                    </div>
                    {ex.after && (
                      <div className="text-stone-900 mt-0.5">
                        <span className="text-stone-400 not-italic font-sans text-[10px] uppercase tracking-wide mr-2">
                          After
                        </span>
                        “{ex.after}”
                      </div>
                    )}
                    {ex.note && (
                      <div className="text-stone-500 text-xs not-italic mt-1">
                        {ex.note}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
