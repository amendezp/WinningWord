import { EditorWorkspace } from "@/components/EditorWorkspace";
import { TopBar } from "@/components/TopBar";

export default function HomePage() {
  return (
    <div className="flex flex-col h-screen">
      <TopBar />
      <EditorWorkspace />
    </div>
  );
}
