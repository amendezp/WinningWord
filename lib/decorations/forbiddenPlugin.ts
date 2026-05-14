import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { EditorState } from "@tiptap/pm/state";
import { findForbiddenMatches } from "@/lib/rules/forbidden";

export const forbiddenPluginKey = new PluginKey("ww-forbidden");

function buildDecorations(doc: EditorState["doc"]): DecorationSet {
  const decos: Decoration[] = [];
  doc.descendants((node, pos) => {
    if (!node.isTextblock) return true;
    const base = pos + 1;
    for (const m of findForbiddenMatches(node.textContent)) {
      decos.push(
        Decoration.inline(base + m.from, base + m.to, {
          class: "ww-forbidden",
          title: "Forbidden word — Winning Writing avoids this",
        })
      );
    }
    return false;
  });
  return DecorationSet.create(doc, decos);
}

export function forbiddenPlugin() {
  return new Plugin({
    key: forbiddenPluginKey,
    state: {
      init: (_cfg, state) => buildDecorations(state.doc),
      apply: (tr, old, _oldState, newState) =>
        tr.docChanged ? buildDecorations(newState.doc) : old,
    },
    props: {
      decorations(state) {
        return forbiddenPluginKey.getState(state) as DecorationSet | undefined;
      },
    },
  });
}
