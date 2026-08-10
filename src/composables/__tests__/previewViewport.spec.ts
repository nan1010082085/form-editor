import { describe, expect, it } from "vitest";
import {
  PREVIEW_VIEWPORT_WIDTH,
  computeFreePreviewStyle,
} from "../previewViewport";

describe("previewViewport", () => {
  it("defines tablet/mobile fixed widths and desktop unconstrained", () => {
    expect(PREVIEW_VIEWPORT_WIDTH.desktop).toBeNull();
    expect(PREVIEW_VIEWPORT_WIDTH.tablet).toBe(768);
    expect(PREVIEW_VIEWPORT_WIDTH.mobile).toBe(375);
  });

  it("contain scales to fit both axes", () => {
    const style = computeFreePreviewStyle({
      designW: 1920,
      designH: 1080,
      frameW: 960,
      frameH: 800,
      mode: "contain",
    });
    expect(style.transform).toBe("scale(0.5)");
    expect(style.width).toBe("1920px");
  });

  it("fit-width uses width ratio only", () => {
    const style = computeFreePreviewStyle({
      designW: 1000,
      designH: 1000,
      frameW: 500,
      frameH: 2000,
      mode: "fit-width",
    });
    expect(style.transform).toBe("scale(0.5)");
  });

  it("stretch fills the frame without transform", () => {
    const style = computeFreePreviewStyle({
      designW: 1920,
      designH: 1080,
      frameW: 375,
      frameH: 667,
      mode: "stretch",
    });
    expect(style.transform).toBe("none");
    expect(style.width).toBe("375px");
    expect(style.height).toBe("667px");
  });
});
