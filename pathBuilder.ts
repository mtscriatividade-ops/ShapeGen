import { Topbar } from "@/components/ui/Topbar";
import { LeftPanel } from "@/components/panels/LeftPanel";
import { RightPanel } from "@/components/panels/RightPanel";
import { Canvas } from "@/components/canvas/Canvas";

export default function App() {
  return (
    <div className="h-full flex flex-col">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <LeftPanel />
        <Canvas />
        <RightPanel />
      </div>
    </div>
  );
}
