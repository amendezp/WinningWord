import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { EditorState, Transaction } from "@tiptap/pm/state";

export type HighlightSpec = {
  uid: string;
  paragraphIndex: number;
  phrase: string;
  kind: "issue" | "improve" | "praise";
};

export type HighlightPluginState = {
  highlights: HighlightSpec[];
  focusedUid?: string;
  decorations: DecorationSet;
};

export const highlightPluginKey = new PluginKey<HighlightPluginState>("ww-highlights");

type MetaPayload =
  | { type: "setHighlights"; highlights: HighlightSpec[] }
  | { type: "setFocused"; uid?: string };

export function setHighlightsMeta(tr: Transaction, highlights: HighlightSpec[]) {
  return tr.setMeta(highlightPluginKey, {
    type: "setHighlights",
    highlights,
  } satisfies MetaPayload);
}

export function setFocusedHighlightMeta(tr: Transaction, uid?: string) {
  return tr.setMeta(highlightPluginKey, {
    type: "setFocused",
    uid,
  } satisfies MetaPayload);
}

/**
 * Recompute decorations from scratch. Cheap relative to API calls,
 * and resilient to user edits between analysis request and response.
 */
function buildDecorations(
  doc: EditorState["doc"],
  highlights: HighlightSpec[],
  focusedUid?: string
): DecorationSet {
  if (highlights.length === 0) return DecorationSet.empty;

  // Collect top-level paragraph nodes in order, capturing their absolute
  // start offset for character-level searches inside text content.
  type ParaInfo = { index: number; from: number; text: string };
  const paragraphs: ParaInfo[] = [];
  let paraIndex = 0;
  doc.descendants((node, pos) => {
    if (node.isTextblock) {
      paragraphs.push({
        index: paraIndex,
        from: pos + 1, // +1 to step inside the textblock
        text: node.textContent,
      });
      paraIndex += 1;
      return false; // don't descend into the textblock's children
    }
    return true;
  });

  const decorations: Decoration[] = [];
  for (const h of highlights) {
    const para = paragraphs[h.paragraphIndex];
    if (!para) continue;
    const idx = para.text.indexOf(h.phrase);
    if (idx < 0) continue;
    const from = para.from + idx;
    const to = from + h.phrase.length;
    const baseClass =
      h.kind === "issue" ? "ww-issue" : h.kind === "improve" ? "ww-improve" : "ww-praise";
    const cls = h.uid === focusedUid ? `${baseClass} is-focused` : baseClass;
    decorations.push(
      Decoration.inline(from, to, {
        class: cls,
        "data-ww-uid": h.uid,
      })
    );
  }
  return DecorationSet.create(doc, decorations);
}

export function highlightPlugin() {
  return new Plugin<HighlightPluginState>({
    key: highlightPluginKey,
    state: {
      init(_cfg, state) {
        return {
          highlights: [],
          focusedUid: undefined,
          decorations: buildDecorations(state.doc, []),
        };
      },
      apply(tr, prev, _oldState, newState): HighlightPluginState {
        const meta = tr.getMeta(highlightPluginKey) as MetaPayload | undefined;
        let next = prev;
        if (meta) {
          if (meta.type === "setHighlights") {
            next = { ...next, highlights: meta.highlights };
          } else if (meta.type === "setFocused") {
            next = { ...next, focusedUid: meta.uid };
          }
        }
        // Rebuild whenever doc changed OR meta updated.
        if (tr.docChanged || meta) {
          next = {
            ...next,
            decorations: buildDecorations(newState.doc, next.highlights, next.focusedUid),
          };
        }
        return next;
      },
    },
    props: {
      decorations(state) {
        return highlightPluginKey.getState(state)?.decorations ?? DecorationSet.empty;
      },
      handleClick(view, _pos, event) {
        const target = event.target as HTMLElement | null;
        const el = target?.closest("[data-ww-uid]") as HTMLElement | null;
        if (!el) return false;
        const uid = el.dataset.wwUid;
        if (!uid) return false;
        // Dispatch a DOM event the React layer listens to.
        view.dom.dispatchEvent(
          new CustomEvent("ww:highlight-click", { detail: { uid }, bubbles: true })
        );
        return true;
      },
    },
  });
}
