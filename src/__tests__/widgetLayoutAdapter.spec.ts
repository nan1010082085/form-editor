import { describe, it, expect } from "vitest";
import {
  adaptWidgetsToBoardLayout,
  gridRootWidgetDefaults,
} from "@/utils/widgetLayoutAdapter";
import type { Widget } from "@/widgets/base/types";

function mockWidget(type: string, partial: Partial<Widget> = {}): Widget {
  return {
    id: `${type}_1`,
    type: type as Widget["type"],
    name: type,
    label: type,
    position: { x: 0, y: 0, w: 400, h: 300, zIndex: 1 },
    style: {},
    props: {},
    ...partial,
  } as Widget;
}

describe("widgetLayoutAdapter", () => {
  it("grid mode sets gridSpan=-1 for full-width types", () => {
    const widgets = [mockWidget("crud-list-page")];
    adaptWidgetsToBoardLayout(widgets, "grid");
    expect(widgets[0].style?.width).toBe("100%");
    expect(widgets[0].style?.height).toBe("auto");
    expect(widgets[0].gridSpan).toBe(-1);
  });

  it("grid mode does not set gridSpan for non-full-width types", () => {
    const widgets = [mockWidget("input")];
    adaptWidgetsToBoardLayout(widgets, "grid");
    expect(widgets[0].gridSpan).toBeUndefined();
  });

  it("free mode syncs style from position", () => {
    const widgets = [
      mockWidget("input", {
        position: { x: 10, y: 20, w: 280, h: 40, zIndex: 1 },
      }),
    ];
    adaptWidgetsToBoardLayout(widgets, "free");
    expect(widgets[0].style?.width).toBe("280px");
    expect(widgets[0].style?.height).toBe("40px");
  });

  it("gridRootWidgetDefaults returns width 100% and gridSpan=-1 for table types", () => {
    const result = gridRootWidgetDefaults("advanced-table");
    expect(result.style.width).toBe("100%");
    expect(result.gridSpan).toBe(-1);
  });
});
