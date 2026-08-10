/**
 * @vitest-environment jsdom
 *
 * useResize：宽高单位可独立（布局默认 wUnit=% + h 为 px）。
 */
import { describe, it, expect, beforeEach } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useResize } from "../useResize";
import { useWidgetStore } from "@/stores/widget";
import { useBoardStore } from "@/stores/board";
import type { Widget } from "@/widgets/base/types";

function layoutLikeWidget(): Widget {
  return {
    id: "layout_1",
    type: "single-col",
    name: "Single Column",
    label: "Single Column",
    position: {
      x: 0,
      y: 0,
      w: 100,
      h: 200,
      wUnit: "%",
      hUnit: "px",
      zIndex: 1,
    },
    style: { width: "100%", height: "200px" },
    props: {},
  } as Widget;
}

describe("useResize mixed units", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    const board = useBoardStore();
    board.canvas.layoutMode = "free";
    board.canvas.zoom = 100;
    board.setCanvasPixelSize(1920, 1080);
  });

  it("south resize keeps height in px when only wUnit is %", () => {
    const widgetStore = useWidgetStore();
    widgetStore.widgets = [layoutLikeWidget()];

    const { startResize, updateResize } = useResize();
    startResize("layout_1", "s", 100, 100);
    // zoom=100 → dy = +50px
    updateResize(100, 150);

    const w = widgetStore.findWidget("layout_1")!;
    expect(w.position.hUnit).toBe("px");
    expect(w.position.h).toBe(250);
    expect(w.position.w).toBe(100);
    expect(w.position.wUnit).toBe("%");
  });

  it("east resize updates width percent without rewriting height unit math", () => {
    const widgetStore = useWidgetStore();
    const widget = layoutLikeWidget();
    widget.position.w = 50;
    widget.position.x = 0;
    widgetStore.widgets = [widget];

    const { startResize, updateResize } = useResize();
    startResize("layout_1", "e", 100, 100);
    // +192px ≈ +10% of 1920
    updateResize(292, 100);

    const w = widgetStore.findWidget("layout_1")!;
    expect(w.position.w).toBeCloseTo(60, 0);
    expect(w.position.wUnit).toBe("%");
    expect(w.position.h).toBe(200);
    expect(w.position.hUnit).toBe("px");
  });

  it("pure px se resize still works", () => {
    const widgetStore = useWidgetStore();
    widgetStore.widgets = [
      {
        id: "box_1",
        type: "input",
        name: "Input",
        label: "Input",
        position: {
          x: 10,
          y: 10,
          w: 240,
          h: 40,
          wUnit: "px",
          hUnit: "px",
          zIndex: 1,
        },
        style: {},
        props: {},
      } as Widget,
    ];

    const { startResize, updateResize } = useResize();
    startResize("box_1", "se", 0, 0);
    updateResize(40, 20);

    const w = widgetStore.findWidget("box_1")!;
    expect(w.position.w).toBe(280);
    expect(w.position.h).toBe(60);
  });
});
