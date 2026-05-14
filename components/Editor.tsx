"use client";

import { useEffect, useMemo, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Extension } from "@tiptap/core";

import {
  highlightPlugin,
  highlightPluginKey,
  setHighlightsMeta,
  setFocusedHighlightMeta,
  type HighlightSpec,
} from "@/lib/decorations/highlightPlugin";
import { forbiddenPlugin } from "@/lib/decorations/forbiddenPlugin";
import { useSuggestionsStore } from "@/lib/store/suggestions";
import { shouldAnalyze } from "@/lib/trigger/sentenceTrigger";
import { shouldRunDocumentPass } from "@/lib/trigger/documentTrigger";
import { analyzeParagraph, analyzeDocument } from "@/lib/analyze/client";
import { fnv1a } from "@/lib/util/hash";
import {
  SEED_HTML,
  SEED_PARAGRAPH_SUGGESTIONS,
  SEED_DOCUMENT_FEEDBACK,
} from "@/lib/seed";

const HighlightExt = Extension.create({
  name: "wwHighlight",
  addProseMirrorPlugins() {
    return [highlightPlugin(), forbiddenPlugin()];
  },
});

function getParagraphTexts(editor: ReturnType<typeof useEditor>): string[] {
  if (!editor) return [];
  const out: string[] = [];
  editor.state.doc.descendants((node) => {
    if (node.isTextblock) {
      out.push(node.textContent);
      return false;
    }
    return true;
  });
  return out;
}

// Initial doc + canned suggestions live in lib/seed.ts so they're easy to
// update without touching this file.

export function Editor() {
  const upsertParagraph = useSuggestionsStore((s) => s.upsertParagraph);
  const setDocumentFeedback = useSuggestionsStore((s) => s.setDocumentFeedback);
  const setPendingParagraph = useSuggestionsStore((s) => s.setPendingParagraph);
  const setPendingDocument = useSuggestionsStore((s) => s.setPendingDocument);
  const focus = useSuggestionsStore((s) => s.focus);
  const paragraphSuggestions = useSuggestionsStore((s) => s.paragraphSuggestions);
  const focusedUid = useSuggestionsStore((s) => s.focusedUid);

  // Per-paragraph trigger state, keyed by paragraph index.
  // - lastAnalyzedText: last text successfully analyzed (drives "is something new?")
  // - lastAttemptedText: last text we tried (success OR failure) — prevents
  //   hammering the API when a call fails repeatedly with the same input.
  const lastAnalyzedTextRef = useRef<Map<number, string>>(new Map());
  const lastAttemptedTextRef = useRef<Map<number, string>>(new Map());
  const lastEditAtRef = useRef<number>(Date.now());
  const inflightRef = useRef<Map<number, AbortController>>(new Map());
  const docInflightRef = useRef<AbortController | null>(null);
  const docTriggerRef = useRef<{
    passACountSinceLastB: number;
    lastEditAt: number;
    lastDocAnalyzedAt: number;
    lastAnalyzedDocText?: string;
  }>({
    passACountSinceLastB: 0,
    lastEditAt: Date.now(),
    lastDocAnalyzedAt: 0,
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Write something worth coaching…",
      }),
      HighlightExt,
    ],
    content: SEED_HTML,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "ww-editor max-w-3xl mx-auto py-14 px-8",
      },
    },
  });

  // Run a Pass A analysis for one paragraph.
  const runParagraphPass = useMemo(() => {
    return async (paragraphIndex: number, paragraphText: string, docBody: string) => {
      // Cancel any in-flight call for this paragraph.
      inflightRef.current.get(paragraphIndex)?.abort();
      const ac = new AbortController();
      inflightRef.current.set(paragraphIndex, ac);
      // Mark "we tried this text" up front so the ticker won't refire while we wait.
      lastAttemptedTextRef.current.set(paragraphIndex, paragraphText);

      setPendingParagraph(paragraphIndex, true);
      try {
        const fb = await analyzeParagraph({
          focusParagraph: paragraphText,
          documentBody: docBody,
          signal: ac.signal,
        });
        upsertParagraph(paragraphIndex, fnv1a(paragraphText), fb);
        lastAnalyzedTextRef.current.set(paragraphIndex, paragraphText);
        docTriggerRef.current.passACountSinceLastB += 1;
      } catch (err) {
        if ((err as { name?: string }).name === "AbortError") return;
        console.error("analyzeParagraph failed:", err);
      } finally {
        setPendingParagraph(paragraphIndex, false);
        if (inflightRef.current.get(paragraphIndex) === ac) {
          inflightRef.current.delete(paragraphIndex);
        }
      }
    };
  }, [setPendingParagraph, upsertParagraph]);

  const runDocumentPass = useMemo(() => {
    return async (docBody: string) => {
      docInflightRef.current?.abort();
      const ac = new AbortController();
      docInflightRef.current = ac;
      // Throttle marker — set immediately so the ticker doesn't refire while we wait
      // or after a failure.
      docTriggerRef.current.lastDocAnalyzedAt = Date.now();
      setPendingDocument(true);
      try {
        const fb = await analyzeDocument({ documentBody: docBody, signal: ac.signal });
        setDocumentFeedback(fb);
        docTriggerRef.current.passACountSinceLastB = 0;
        // Critical for idle-loop prevention: mark this text as analyzed so
        // the trigger doesn't refire on identical content while the user sits idle.
        docTriggerRef.current.lastAnalyzedDocText = docBody;
      } catch (err) {
        if ((err as { name?: string }).name === "AbortError") return;
        console.error("analyzeDocument failed:", err);
      } finally {
        setPendingDocument(false);
        if (docInflightRef.current === ac) docInflightRef.current = null;
      }
    };
  }, [setDocumentFeedback, setPendingDocument]);

  // One-time mount-seed: pre-populate suggestions + document feedback from
  // lib/seed.ts, then mark every initial paragraph as already-analyzed so the
  // trigger doesn't fire an API call on first load. The instant the user
  // edits a seeded paragraph, the regular flow takes over.
  const seededRef = useRef(false);
  useEffect(() => {
    if (!editor || seededRef.current) return;
    seededRef.current = true;
    const paragraphs = getParagraphTexts(editor);
    for (let i = 0; i < paragraphs.length; i++) {
      const text = paragraphs[i];
      const seeded = SEED_PARAGRAPH_SUGGESTIONS[i];
      if (seeded) {
        upsertParagraph(i, fnv1a(text), seeded);
      }
      lastAnalyzedTextRef.current.set(i, text);
      lastAttemptedTextRef.current.set(i, text);
    }
    setDocumentFeedback(SEED_DOCUMENT_FEEDBACK);
    docTriggerRef.current.lastAnalyzedDocText = paragraphs.join("\n\n");
    docTriggerRef.current.lastDocAnalyzedAt = Date.now();
  }, [editor, upsertParagraph, setDocumentFeedback]);

  // Periodic ticker: check every paragraph's trigger condition and fire if ready.
  useEffect(() => {
    if (!editor) return;
    const interval = setInterval(() => {
      const paragraphs = getParagraphTexts(editor);
      const docBody = paragraphs.join("\n\n");
      const now = Date.now();
      for (let i = 0; i < paragraphs.length; i++) {
        const text = paragraphs[i];
        if (inflightRef.current.has(i)) continue;
        // Treat both successful + attempted text as "already tried this exact text".
        // Lets the ticker re-fire when the user keeps editing, but not when the call
        // fails on a stable text (eg. missing API key).
        const lastAnalyzed = lastAnalyzedTextRef.current.get(i);
        const lastAttempted = lastAttemptedTextRef.current.get(i);
        if (text === lastAttempted) continue;
        if (
          shouldAnalyze(
            {
              text,
              lastAnalyzedText: lastAnalyzed,
              lastEditAt: lastEditAtRef.current,
            },
            now
          )
        ) {
          void runParagraphPass(i, text, docBody);
        }
      }
      // Document pass
      if (
        shouldRunDocumentPass(docTriggerRef.current, now, docBody) &&
        !docInflightRef.current
      ) {
        void runDocumentPass(docBody);
      }
    }, 700);
    return () => clearInterval(interval);
  }, [editor, runParagraphPass, runDocumentPass]);

  // Track every edit (update lastEditAt; fire paragraph-completed analysis on hard break).
  useEffect(() => {
    if (!editor) return;
    const onUpdate = ({ transaction }: { transaction: import("@tiptap/pm/state").Transaction }) => {
      lastEditAtRef.current = Date.now();
      docTriggerRef.current.lastEditAt = Date.now();

      // If the user pressed Enter (created a new block), analyze the prior paragraph immediately.
      const userPressedEnter =
        transaction.docChanged &&
        transaction.steps.some((step) => {
          const s = step as unknown as { slice?: { content?: { childCount?: number } } };
          return (s.slice?.content?.childCount ?? 0) > 1;
        });
      if (userPressedEnter) {
        const paragraphs = getParagraphTexts(editor);
        const docBody = paragraphs.join("\n\n");
        // Find the paragraph index containing the prior selection.
        const before = transaction.before;
        const pos = transaction.selection.from;
        let priorIndex = 0;
        let count = 0;
        before.descendants((node, p) => {
          if (node.isTextblock) {
            if (p < pos) priorIndex = count;
            count += 1;
            return false;
          }
          return true;
        });
        const target = paragraphs[priorIndex];
        if (target && target.trim().length >= 4) {
          void runParagraphPass(priorIndex, target, docBody);
        }
      }
    };
    editor.on("update", onUpdate);
    return () => {
      editor.off("update", onUpdate);
    };
  }, [editor, runParagraphPass]);

  // Sync current suggestions → highlight plugin.
  useEffect(() => {
    if (!editor) return;
    const specs: HighlightSpec[] = paragraphSuggestions.map((s) => ({
      uid: s.uid,
      paragraphIndex: s.paragraphIndex,
      phrase: s.phrase,
      kind: s.kind,
    }));
    const tr = setHighlightsMeta(editor.state.tr, specs);
    editor.view.dispatch(tr);
  }, [editor, paragraphSuggestions]);

  // Sync focused uid → highlight plugin.
  useEffect(() => {
    if (!editor) return;
    const tr = setFocusedHighlightMeta(editor.state.tr, focusedUid);
    editor.view.dispatch(tr);
  }, [editor, focusedUid]);

  // Click on a highlight in the editor → focus the corresponding card.
  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom;
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ uid: string }>;
      focus(ce.detail.uid);
    };
    dom.addEventListener("ww:highlight-click", handler);
    return () => dom.removeEventListener("ww:highlight-click", handler);
  }, [editor, focus]);

  // Surface globals so the sidebar buttons can drive the editor.
  // (We use window-level handles to avoid threading the editor through a context
  //  just for two buttons — same pattern as `__wwForceDocumentPass`.)
  useEffect(() => {
    const w = window as unknown as {
      __wwForceDocumentPass?: () => void;
      __wwCopyAll?: () => Promise<boolean>;
      __wwApplySuggestion?: (paragraphIndex: number, phrase: string, replacement: string) => boolean;
    };

    w.__wwForceDocumentPass = () => {
      if (!editor) return;
      const paragraphs = getParagraphTexts(editor);
      void runDocumentPass(paragraphs.join("\n\n"));
    };

    w.__wwCopyAll = async () => {
      if (!editor) return false;
      // Plain text from the editor preserves paragraph breaks via \n\n.
      const text = getParagraphTexts(editor).join("\n\n");
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        return false;
      }
    };

    // Replace the first occurrence of `phrase` inside paragraph `paragraphIndex`
    // with `replacement`. Returns true if a replacement happened.
    w.__wwApplySuggestion = (paragraphIndex, phrase, replacement) => {
      if (!editor) return false;
      let from = -1;
      let paraIdx = 0;
      editor.state.doc.descendants((node, pos) => {
        if (!node.isTextblock) return true;
        if (paraIdx === paragraphIndex) {
          const idx = node.textContent.indexOf(phrase);
          if (idx >= 0) from = pos + 1 + idx;
        }
        paraIdx += 1;
        return false;
      });
      if (from < 0) return false;
      const to = from + phrase.length;
      editor.chain().focus().setTextSelection({ from, to }).insertContent(replacement).run();
      return true;
    };

    return () => {
      delete w.__wwForceDocumentPass;
      delete w.__wwCopyAll;
      delete w.__wwApplySuggestion;
    };
  }, [editor, runDocumentPass]);

  // Read plugin state on each render so React shows a soft cursor on focused decoration.
  // (We don't actually need to render anything from it — the plugin handles DOM classes.)
  void highlightPluginKey;

  return <EditorContent editor={editor} />;
}
