import { useEditorStore } from "@/store/useEditorStore";
import { anchorsToPathData } from "@/core/path/pathBuilder";
import type { AnchorType } from "@/types/shape";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex items-center justify-between gap-2 text-xs text-neutral-300">
      <span className="w-24 shrink-0">{label}</span>
      {children}
    </label>
  );
}

const ANCHOR_TYPES: { value: AnchorType; label: string }[] = [
  { value: "corner", label: "Corner" },
  { value: "smooth", label: "Smooth" },
  { value: "symmetric", label: "Symmetric" },
  { value: "rounded", label: "Rounded" },
];

export function RightPanel() {
  const shapes = useEditorStore((s) => s.shapes);
  const selectedShapeId = useEditorStore((s) => s.selectedShapeId);
  const selectedAnchorId = useEditorStore((s) => s.selectedAnchorId);
  const updateShapeTransient = useEditorStore((s) => s.updateShapeTransient);
  const commitHistory = useEditorStore((s) => s.commitHistory);
  const setGlobalCornerRadius = useEditorStore((s) => s.setGlobalCornerRadius);
  const setAnchorCornerRadius = useEditorStore((s) => s.setAnchorCornerRadius);
  const setCornerSmoothing = useEditorStore((s) => s.setCornerSmoothing);
  const resetCorners = useEditorStore((s) => s.resetCorners);
  const setAnchorType = useEditorStore((s) => s.setAnchorType);
  const addPointAfter = useEditorStore((s) => s.addPointAfter);
  const deletePoint = useEditorStore((s) => s.deletePoint);
  const toggleClosed = useEditorStore((s) => s.toggleClosed);
  const convertLineToCurve = useEditorStore((s) => s.convertLineToCurve);
  const convertCurveToLine = useEditorStore((s) => s.convertCurveToLine);

  const shape = shapes.find((s) => s.id === selectedShapeId);

  if (!shape) {
    return (
      <div className="w-64 bg-panel border-l border-black/30 p-3 text-xs text-neutral-500">
        Selecione uma forma para ver suas propriedades.
      </div>
    );
  }

  const selectedAnchor = shape.anchors.find((a) => a.id === selectedAnchorId) ?? null;
  const d = anchorsToPathData(shape.anchors, shape.path.closed);
  const avgSmoothing =
    shape.anchors.reduce((sum, a) => sum + a.cornerSmoothing, 0) / shape.anchors.length;
  const avgRadius = shape.anchors.reduce((sum, a) => sum + a.cornerRadius, 0) / shape.anchors.length;

  const handleStyleChange = (key: "fill" | "stroke", value: string) => {
    updateShapeTransient(shape.id, (s) => ({ ...s, style: { ...s.style, [key]: value } }));
  };
  const handleStyleCommit = () => commitHistory();

  const handleCopyPath = async () => {
    await navigator.clipboard.writeText(d);
  };
  const buildSvgMarkup = () =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 700"><path d="${d}" fill="${shape.style.fill}" stroke="${shape.style.stroke}" stroke-width="${shape.style.strokeWidth}"/></svg>`;
  const handleCopySvg = async () => {
    await navigator.clipboard.writeText(buildSvgMarkup());
  };
  const handleDownloadSvg = () => {
    const blob = new Blob([buildSvgMarkup()], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${shape.name}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-64 bg-panel border-l border-black/30 p-3 flex flex-col gap-4 overflow-y-auto">
      <section className="flex flex-col gap-2">
        <h2 className="text-xs uppercase tracking-wide text-neutral-400">Corners</h2>
        <Field label="Global radius">
          <input
            type="range"
            min={0}
            max={80}
            value={Math.round(avgRadius)}
            onChange={(e) => setGlobalCornerRadius(shape.id, Number(e.target.value))}
            className="flex-1"
          />
        </Field>
        <Field label="Smoothing">
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(avgSmoothing)}
            onChange={(e) => setCornerSmoothing(shape.id, null, Number(e.target.value))}
            className="flex-1"
          />
        </Field>
        <div className="flex gap-2">
          <button
            onClick={() => setCornerSmoothing(shape.id, null, 100)}
            className="flex-1 rounded-md bg-white/10 hover:bg-white/20 text-xs px-2 py-1.5"
          >
            iOS Style
          </button>
          <button
            onClick={() => resetCorners(shape.id)}
            className="flex-1 rounded-md bg-white/10 hover:bg-white/20 text-xs px-2 py-1.5"
          >
            Reset
          </button>
        </div>
        {selectedAnchor && (
          <Field label="Point radius">
            <input
              type="range"
              min={0}
              max={80}
              value={selectedAnchor.cornerRadius}
              onChange={(e) =>
                setAnchorCornerRadius(shape.id, selectedAnchor.id, Number(e.target.value))
              }
              className="flex-1"
            />
          </Field>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xs uppercase tracking-wide text-neutral-400">Path</h2>
        <button
          onClick={() => toggleClosed(shape.id)}
          className="rounded-md bg-white/10 hover:bg-white/20 text-xs px-3 py-2 text-left"
        >
          {shape.path.closed ? "Open path" : "Close path"}
        </button>

        {selectedAnchor ? (
          <>
            <div className="grid grid-cols-2 gap-1">
              {ANCHOR_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setAnchorType(shape.id, selectedAnchor.id, t.value)}
                  className={`rounded-md text-xs px-2 py-1.5 ${
                    selectedAnchor.type === t.value
                      ? "bg-accent text-white"
                      : "bg-white/10 hover:bg-white/20"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => convertLineToCurve(shape.id, selectedAnchor.id)}
                className="flex-1 rounded-md bg-white/10 hover:bg-white/20 text-xs px-2 py-1.5"
              >
                Line → Curve
              </button>
              <button
                onClick={() => convertCurveToLine(shape.id, selectedAnchor.id)}
                className="flex-1 rounded-md bg-white/10 hover:bg-white/20 text-xs px-2 py-1.5"
              >
                Curve → Line
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => addPointAfter(shape.id, selectedAnchor.id)}
                className="flex-1 rounded-md bg-white/10 hover:bg-white/20 text-xs px-2 py-1.5"
              >
                Add point
              </button>
              <button
                onClick={() => deletePoint(shape.id, selectedAnchor.id)}
                className="flex-1 rounded-md bg-red-500/20 hover:bg-red-500/30 text-xs px-2 py-1.5"
              >
                Delete point
              </button>
            </div>
          </>
        ) : (
          <p className="text-[11px] text-neutral-500">
            Selecione um anchor point no canvas para editar seu tipo e segmentos.
          </p>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xs uppercase tracking-wide text-neutral-400">Appearance</h2>
        <Field label="Fill">
          <input
            type="color"
            value={shape.style.fill}
            onChange={(e) => handleStyleChange("fill", e.target.value)}
            onBlur={handleStyleCommit}
            className="h-6 w-10 bg-transparent"
          />
        </Field>
        <Field label="Stroke">
          <input
            type="color"
            value={shape.style.stroke}
            onChange={(e) => handleStyleChange("stroke", e.target.value)}
            onBlur={handleStyleCommit}
            className="h-6 w-10 bg-transparent"
          />
        </Field>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xs uppercase tracking-wide text-neutral-400">Export</h2>
        <button
          onClick={handleCopySvg}
          className="rounded-md bg-white/10 hover:bg-white/20 text-xs px-3 py-2 text-left"
        >
          Copy complete SVG
        </button>
        <button
          onClick={handleCopyPath}
          className="rounded-md bg-white/10 hover:bg-white/20 text-xs px-3 py-2 text-left"
        >
          Copy SVG path
        </button>
        <button
          onClick={handleDownloadSvg}
          className="rounded-md bg-accent hover:opacity-90 text-xs px-3 py-2 text-left"
        >
          Download SVG
        </button>
      </section>
    </div>
  );
}
