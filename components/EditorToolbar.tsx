"use client";

import type { Editor } from "@tiptap/react";

/**
 * Minimalist formatting toolbar — four actions only.
 *
 * H1, H2, Bold, Italic. That's it. Kramon writes paragraphs, not bullets;
 * the rest of TipTap's StarterKit features stay available via markdown
 * shortcuts (#, ##, **, _) for power users without taking screen real estate.
 *
 * Each button toggles. Clicking H1 on a paragraph makes it H1; clicking H1
 * on an H1 turns it back into a paragraph. Active state is reflected on the
 * button so you can see the current block type at a glance.
 */
export function EditorToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  const isH1 = editor.isActive("heading", { level: 1 });
  const isH2 = editor.isActive("heading", { level: 2 });
  const isBold = editor.isActive("bold");
  const isItalic = editor.isActive("italic");

  return (
    <div className="flex items-center justify-center gap-1 border-b border-stone-200 bg-paper/80 backdrop-blur py-1.5">
      <ToolbarButton
        active={isH1}
        title="Heading 1 (⌘⌥1)"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <span className="font-serif text-lg leading-none">H1</span>
      </ToolbarButton>
      <ToolbarButton
        active={isH2}
        title="Heading 2 (⌘⌥2)"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <span className="font-serif text-base leading-none">H2</span>
      </ToolbarButton>

      {/* Thin divider between block-level and inline-level controls */}
      <div className="w-px h-5 bg-stone-300 mx-1" />

      <ToolbarButton
        active={isBold}
        title="Bold (⌘B)"
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <span className="font-bold text-base leading-none">B</span>
      </ToolbarButton>
      <ToolbarButton
        active={isItalic}
        title="Italic (⌘I)"
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <span className="italic font-serif text-base leading-none">I</span>
      </ToolbarButton>
    </div>
  );
}

function ToolbarButton({
  active,
  title,
  onClick,
  children,
}: {
  active: boolean;
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={`w-8 h-8 rounded-md flex items-center justify-center transition
        ${
          active
            ? "bg-stone-800 text-stone-50"
            : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
        }`}
    >
      {children}
    </button>
  );
}
