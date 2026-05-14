import { Editor } from "@/components/Editor";
import { SuggestionsPanel } from "@/components/SuggestionsPanel";
import { TopBar } from "@/components/TopBar";

export default function HomePage() {
  return (
    <div className="flex flex-col h-screen">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <Editor />
        </main>
        <SuggestionsPanel />
      </div>
    </div>
  );
}
