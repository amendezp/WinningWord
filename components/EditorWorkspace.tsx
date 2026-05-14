"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Editor } from "./Editor";
import { SuggestionsPanel } from "./SuggestionsPanel";
import { CopyAllButton } from "./CopyAllButton";

const MIN_WIDTH = 320;
const MAX_WIDTH = 720;
const DEFAULT_WIDTH = 480;
const WIDTH_KEY = "ww:sidebarWidth";
const OPEN_KEY = "ww:sidebarOpen";

export function EditorWorkspace() {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [open, setOpen] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  // Load persisted UI state on mount.
  useEffect(() => {
    try {
      const w = window.localStorage.getItem(WIDTH_KEY);
      if (w) setWidth(clamp(parseInt(w, 10) || DEFAULT_WIDTH));
      const o = window.localStorage.getItem(OPEN_KEY);
      if (o === "false") setOpen(false);
    } catch {
      // best effort
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(WIDTH_KEY, String(width));
  }, [width, hydrated]);
  useEffect(() => {
    if (hydrated) window.localStorage.setItem(OPEN_KEY, String(open));
  }, [open, hydrated]);

  const draggingRef = useRef(false);
  const onMouseDownResize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      draggingRef.current = true;
      const startX = e.clientX;
      const startWidth = width;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      const onMove = (ev: MouseEvent) => {
        if (!draggingRef.current) return;
        const delta = startX - ev.clientX;
        setWidth(clamp(startWidth + delta));
      };
      const onUp = () => {
        draggingRef.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [width]
  );

  return (
    <div className="flex flex-1 overflow-hidden relative">
      <main className="relative flex-1 overflow-y-auto">
        <Editor />
        {/* Floating copy-all icon, anchored to the lower-right of the editor area. */}
        <div className="absolute bottom-6 right-6 z-10">
          <CopyAllButton />
        </div>
      </main>

      {open ? (
        <>
          {/* Drag handle — narrow visible strip but a wider hit area for easier grabbing. */}
          <div
            onMouseDown={onMouseDownResize}
            className="relative w-1 bg-stone-200 hover:bg-stone-400 cursor-col-resize transition-colors flex-shrink-0 group"
            title="Drag to resize"
            aria-label="Resize coaching panel"
          >
            <div className="absolute inset-y-0 -left-1.5 -right-1.5" />
          </div>
          <div
            style={{ width }}
            className="flex-shrink-0 relative h-full"
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 -left-3 z-20 w-6 h-6 bg-paper border border-stone-300 rounded-full text-stone-600 hover:text-stone-900 hover:border-stone-500 shadow-sm text-sm leading-none flex items-center justify-center"
              title="Hide coaching panel"
              aria-label="Hide coaching panel"
            >
              ›
            </button>
            <SuggestionsPanel />
          </div>
        </>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="absolute top-3 right-3 z-20 w-7 h-7 bg-paper border border-stone-300 rounded-full text-stone-600 hover:text-stone-900 hover:border-stone-500 shadow-sm text-sm leading-none flex items-center justify-center"
          title="Show coaching panel"
          aria-label="Show coaching panel"
        >
          ‹
        </button>
      )}
    </div>
  );
}

function clamp(n: number): number {
  return Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, n));
}
