import { create } from "zustand";
import type { AnchorType, Shape, Vector2, Viewport } from "@/types/shape";
import { HistoryStack } from "./history";
import { lerp } from "@/core/geometry/vector";

interface EditorState {
  shapes: Shape[];
  selectedShapeId: string | null;
  selectedAnchorId: string | null;
  viewport: Viewport;

  // Ações de shape
  addShape: (shape: Shape) => void;
  selectShape: (id: string | null) => void;
  updateShapeTransient: (id: string, updater: (shape: Shape) => Shape) => void;
  commitHistory: () => void;

  // Anchors — seleção e movimento
  selectAnchor: (id: string | null) => void;
  moveAnchorTransient: (shapeId: string, anchorId: string, x: number, y: number) => void;

  // Anchors — handles Bézier
  moveHandleTransient: (
    shapeId: string,
    anchorId: string,
    which: "in" | "out",
    x: number,
    y: number
  ) => void;
  setAnchorType: (shapeId: string, anchorId: string, type: AnchorType) => void;

  // Path
  addPointAfter: (shapeId: string, anchorId: string) => void;
  deletePoint: (shapeId: string, anchorId: string) => void;
  toggleClosed: (shapeId: string) => void;
  convertLineToCurve: (shapeId: string, anchorId: string) => void;
  convertCurveToLine: (shapeId: string, anchorId: string) => void;

  // Corners
  setGlobalCornerRadius: (shapeId: string, radius: number) => void;
  setAnchorCornerRadius: (shapeId: string, anchorId: string, radius: number) => void;
  setCornerSmoothing: (shapeId: string, anchorId: string | null, smoothing: number) => void;
  resetCorners: (shapeId: string) => void;

  // Viewport
  setViewport: (viewport: Partial<Viewport>) => void;
  panBy: (dx: number, dy: number) => void;
  zoomAt: (factor: number) => void;

  // Histórico
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

const history = new HistoryStack<Shape[]>();
let handleIdCounter = 0;
function nextId(prefix: string): string {
  handleIdCounter += 1;
  return `${prefix}-${handleIdCounter}`;
}

function cloneShapes(shapes: Shape[]): Shape[] {
  return shapes.map((s) => ({
    ...s,
    transform: { ...s.transform },
    style: { ...s.style },
    path: { ...s.path },
    anchors: s.anchors.map((a) => ({
      ...a,
      position: { ...a.position },
      handleIn: a.handleIn ? { ...a.handleIn } : null,
      handleOut: a.handleOut ? { ...a.handleOut } : null,
    })),
  }));
}

/** Espelha o handle oposto para manter simetria (smooth: mesma direção; symmetric: mesma direção e comprimento). */
function mirrorHandle(
  anchorPos: Vector2,
  movedHandle: Vector2,
  oppositeOriginal: Vector2 | null,
  type: AnchorType
): Vector2 | null {
  if (type !== "smooth" && type !== "symmetric") return oppositeOriginal;

  const dx = anchorPos.x - movedHandle.x;
  const dy = anchorPos.y - movedHandle.y;

  if (type === "symmetric") {
    return { x: anchorPos.x + dx, y: anchorPos.y + dy };
  }

  const originalLength = oppositeOriginal
    ? Math.hypot(oppositeOriginal.x - anchorPos.x, oppositeOriginal.y - anchorPos.y)
    : Math.hypot(dx, dy);
  const dirLength = Math.hypot(dx, dy) || 1;
  const ux = dx / dirLength;
  const uy = dy / dirLength;
  return { x: anchorPos.x + ux * originalLength, y: anchorPos.y + uy * originalLength };
}

export const useEditorStore = create<EditorState>((set, get) => {
  history.push([]);

  return {
    shapes: [],
    selectedShapeId: null,
    selectedAnchorId: null,
    viewport: { x: 0, y: 0, zoom: 1 },

    addShape: (shape) => {
      set((state) => ({ shapes: [...state.shapes, shape], selectedShapeId: shape.id }));
      get().commitHistory();
    },

    selectShape: (id) => set({ selectedShapeId: id, selectedAnchorId: null }),

    updateShapeTransient: (id, updater) => {
      set((state) => ({
        shapes: state.shapes.map((s) => (s.id === id ? updater(s) : s)),
      }));
    },

    commitHistory: () => {
      history.push(cloneShapes(get().shapes));
    },

    selectAnchor: (id) => set({ selectedAnchorId: id }),

    moveAnchorTransient: (shapeId, anchorId, x, y) => {
      set((state) => ({
        shapes: state.shapes.map((s) => {
          if (s.id !== shapeId) return s;
          return {
            ...s,
            anchors: s.anchors.map((a) => {
              if (a.id !== anchorId) return a;
              const dx = x - a.position.x;
              const dy = y - a.position.y;
              return {
                ...a,
                position: { x, y },
                handleIn: a.handleIn ? { x: a.handleIn.x + dx, y: a.handleIn.y + dy } : null,
                handleOut: a.handleOut ? { x: a.handleOut.x + dx, y: a.handleOut.y + dy } : null,
              };
            }),
          };
        }),
      }));
    },

    moveHandleTransient: (shapeId, anchorId, which, x, y) => {
      set((state) => ({
        shapes: state.shapes.map((s) => {
          if (s.id !== shapeId) return s;
          return {
            ...s,
            anchors: s.anchors.map((a) => {
              if (a.id !== anchorId) return a;
              const movedHandle = { x, y };
              const oppositeOriginal = which === "in" ? a.handleOut : a.handleIn;
              const mirrored = mirrorHandle(a.position, movedHandle, oppositeOriginal, a.type);
              return which === "in"
                ? { ...a, handleIn: movedHandle, handleOut: mirrored }
                : { ...a, handleOut: movedHandle, handleIn: mirrored };
            }),
          };
        }),
      }));
    },

    setAnchorType: (shapeId, anchorId, type) => {
      set((state) => ({
        shapes: state.shapes.map((s) => {
          if (s.id !== shapeId) return s;
          return {
            ...s,
            anchors: s.anchors.map((a) => (a.id === anchorId ? { ...a, type } : a)),
          };
        }),
      }));
      get().commitHistory();
    },

    addPointAfter: (shapeId, anchorId) => {
      set((state) => ({
        shapes: state.shapes.map((s) => {
          if (s.id !== shapeId) return s;
          const index = s.anchors.findIndex((a) => a.id === anchorId);
          if (index === -1) return s;
          const next = s.anchors[(index + 1) % s.anchors.length];
          const current = s.anchors[index];
          const midpoint = lerp(current.position, next.position, 0.5);
          const newAnchor = {
            id: nextId("anchor"),
            position: midpoint,
            handleIn: null,
            handleOut: null,
            type: "corner" as AnchorType,
            cornerRadius: 0,
            cornerSmoothing: 0,
            locked: false,
          };
          const anchors = [...s.anchors];
          anchors.splice(index + 1, 0, newAnchor);
          return { ...s, anchors };
        }),
      }));
      get().commitHistory();
    },

    deletePoint: (shapeId, anchorId) => {
      set((state) => ({
        shapes: state.shapes.map((s) => {
          if (s.id !== shapeId) return s;
          if (s.anchors.length <= 3) return s;
          return { ...s, anchors: s.anchors.filter((a) => a.id !== anchorId) };
        }),
        selectedAnchorId: null,
      }));
      get().commitHistory();
    },

    toggleClosed: (shapeId) => {
      set((state) => ({
        shapes: state.shapes.map((s) =>
          s.id === shapeId ? { ...s, path: { ...s.path, closed: !s.path.closed } } : s
        ),
      }));
      get().commitHistory();
    },

    convertLineToCurve: (shapeId, anchorId) => {
      set((state) => ({
        shapes: state.shapes.map((s) => {
          if (s.id !== shapeId) return s;
          const index = s.anchors.findIndex((a) => a.id === anchorId);
          if (index === -1) return s;
          const nextIndex = (index + 1) % s.anchors.length;
          const current = s.anchors[index];
          const next = s.anchors[nextIndex];
          const handleOut = lerp(current.position, next.position, 1 / 3);
          const handleIn = lerp(current.position, next.position, 2 / 3);
          return {
            ...s,
            anchors: s.anchors.map((a, i) => {
              if (i === index) return { ...a, handleOut };
              if (i === nextIndex) return { ...a, handleIn };
              return a;
            }),
          };
        }),
      }));
      get().commitHistory();
    },

    convertCurveToLine: (shapeId, anchorId) => {
      set((state) => ({
        shapes: state.shapes.map((s) => {
          if (s.id !== shapeId) return s;
          const index = s.anchors.findIndex((a) => a.id === anchorId);
          if (index === -1) return s;
          const nextIndex = (index + 1) % s.anchors.length;
          return {
            ...s,
            anchors: s.anchors.map((a, i) => {
              if (i === index) return { ...a, handleOut: null };
              if (i === nextIndex) return { ...a, handleIn: null };
              return a;
            }),
          };
        }),
      }));
      get().commitHistory();
    },

    setGlobalCornerRadius: (shapeId, radius) => {
      set((state) => ({
        shapes: state.shapes.map((s) => {
          if (s.id !== shapeId) return s;
          return {
            ...s,
            anchors: s.anchors.map((a) => ({
              ...a,
              cornerRadius: radius,
              type: radius > 0 ? ("rounded" as AnchorType) : ("corner" as AnchorType),
            })),
          };
        }),
      }));
      get().commitHistory();
    },

    setAnchorCornerRadius: (shapeId, anchorId, radius) => {
      set((state) => ({
        shapes: state.shapes.map((s) => {
          if (s.id !== shapeId) return s;
          return {
            ...s,
            anchors: s.anchors.map((a) =>
              a.id === anchorId
                ? { ...a, cornerRadius: radius, type: radius > 0 ? "rounded" : a.type }
                : a
            ),
          };
        }),
      }));
      get().commitHistory();
    },

    setCornerSmoothing: (shapeId, anchorId, smoothing) => {
      set((state) => ({
        shapes: state.shapes.map((s) => {
          if (s.id !== shapeId) return s;
          return {
            ...s,
            anchors: s.anchors.map((a) =>
              anchorId === null || a.id === anchorId ? { ...a, cornerSmoothing: smoothing } : a
            ),
          };
        }),
      }));
      get().commitHistory();
    },

    resetCorners: (shapeId) => {
      set((state) => ({
        shapes: state.shapes.map((s) => {
          if (s.id !== shapeId) return s;
          return {
            ...s,
            anchors: s.anchors.map((a) => ({
              ...a,
              cornerRadius: 0,
              cornerSmoothing: 0,
              type: "corner" as AnchorType,
            })),
          };
        }),
      }));
      get().commitHistory();
    },

    setViewport: (partial) =>
      set((state) => ({ viewport: { ...state.viewport, ...partial } })),

    panBy: (dx, dy) =>
      set((state) => ({
        viewport: { ...state.viewport, x: state.viewport.x + dx, y: state.viewport.y + dy },
      })),

    zoomAt: (factor) =>
      set((state) => ({
        viewport: {
          ...state.viewport,
          zoom: Math.min(8, Math.max(0.1, state.viewport.zoom * factor)),
        },
      })),

    undo: () => {
      const snapshot = history.undo();
      if (snapshot) set({ shapes: cloneShapes(snapshot) });
    },

    redo: () => {
      const snapshot = history.redo();
      if (snapshot) set({ shapes: cloneShapes(snapshot) });
    },

    canUndo: () => history.canUndo(),
    canRedo: () => history.canRedo(),
  };
});
