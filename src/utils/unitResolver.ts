/**
 * 单位Parse工具
 * 统一处理 position 中的 px/% 单位Transform
 */

import type { Widget } from "../widgets/base/types";

/**
 * 将 widget 的宽高从可能的百Min比Transform为像素Value
 *
 * @param widget widget 对象
 * @param parentWidth 父ContainerWidth（像素）
 * @param parentHeight 父ContainerHeight（像素）
 * @returns 像素Value的宽高
 */
export function resolveWidgetSize(
  widget: Widget,
  parentWidth: number,
  parentHeight: number,
): { w: number; h: number } {
  const pos = widget.position ?? { w: 240, h: 40 };
  const wUnit = pos.wUnit ?? "px";
  const hUnit = pos.hUnit ?? "px";

  const w = wUnit === "%" ? (parentWidth * pos.w) / 100 : pos.w;
  const h = hUnit === "%" ? (parentHeight * pos.h) / 100 : pos.h;

  return { w, h };
}

/**
 * 将 widget 的位置和尺寸AllTransform为像素Value
 * 位置（x, y）始终是 px, 宽高可能需要Transform
 *
 * @param widget widget 对象
 * @param parentWidth 父ContainerWidth（像素）
 * @param parentHeight 父ContainerHeight（像素）
 * @returns 像素Value的矩形Region
 */
export function resolveWidgetRect(
  widget: Widget,
  parentWidth: number,
  parentHeight: number,
): { x: number; y: number; w: number; h: number } {
  const pos = widget.position ?? { x: 0, y: 0, w: 240, h: 40 };
  const { w, h } = resolveWidgetSize(widget, parentWidth, parentHeight);

  return {
    x: pos.x,
    y: pos.y,
    w,
    h,
  };
}

/**
 * 检查 widget 的宽高是否使用了百Min比单位
 */
export function hasPercentUnit(widget: Widget): boolean {
  const pos = widget.position;
  if (!pos) return false;
  return pos.wUnit === "%" || pos.hUnit === "%";
}

/**
 * 获取 widget 宽高的单位
 */
export function getWidgetUnits(widget: Widget): {
  wUnit: "px" | "%";
  hUnit: "px" | "%";
} {
  const pos = widget.position ?? {};
  return {
    wUnit: pos.wUnit ?? "px",
    hUnit: pos.hUnit ?? "px",
  };
}
