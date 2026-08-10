/**
 * 预览断点视口Width（px）
 *
 * desktop 不限制（跟画布Config走）；tablet / mobile 收窄视口, 
 * Grid 会因Container变窄重算Column数, 从而产生真实预览差异。
 */
import type { CSSProperties } from "vue";
import type { ScaleMode } from "@/widgets/base/types";

export const PREVIEW_VIEWPORT_WIDTH: Record<
  "desktop" | "tablet" | "mobile",
  number | null
> = {
  desktop: null,
  tablet: 768,
  mobile: 375,
};

export interface FreePreviewStyleOptions {
  designW: number;
  designH: number;
  frameW: number;
  frameH: number;
  mode: ScaleMode;
  backgroundColor?: string;
  padding?: string | number;
}

/**
 * 自由Layout预览自适应Style（与 PublishView useCanvasScale Row为对齐）
 *
 * @param options - 设计稿尺寸、视口与 scaleMode
 */
export function computeFreePreviewStyle(
  options: FreePreviewStyleOptions,
): CSSProperties {
  const {
    designW,
    designH,
    frameW,
    frameH,
    mode,
    backgroundColor,
    padding,
  } = options;

  const base: CSSProperties = {
    backgroundColor,
    padding,
    position: "relative",
    transformOrigin: "top left",
    margin: "0 auto",
    boxSizing: "border-box",
  };

  if (designW <= 0 || designH <= 0 || frameW <= 0 || frameH <= 0) {
    return {
      ...base,
      width: `${designW}px`,
      height: `${designH}px`,
      transform: "none",
    };
  }

  if (mode === "stretch") {
    return {
      ...base,
      width: `${frameW}px`,
      height: `${frameH}px`,
      transform: "none",
      boxShadow: "0 0 0 1px var(--el-border-color-lighter)",
    };
  }

  let scale = 1;
  switch (mode) {
    case "fit-width":
      scale = frameW / designW;
      break;
    case "fit-height":
      scale = frameH / designH;
      break;
    case "contain":
    default:
      scale = Math.min(frameW / designW, frameH / designH);
      break;
  }

  return {
    ...base,
    width: `${designW}px`,
    height: `${designH}px`,
    transform: `scale(${scale})`,
    boxShadow: "0 0 0 1px var(--el-border-color-lighter)",
  };
}
