import { inject, computed, type ComputedRef } from "vue";
import {
  widgetDataKey,
  widgetStyleKey,
  widgetBoundsKey,
} from "../widgets/base/types";

/**
 * 画布内Widget尺寸：与 overlay 使用同一套 position → 像素换算。
 * passed SchemaNode 注入的 widgetBoundsKey 获取Parse后的宽高, 
 * 再写入 Element Plus 的 --el-component-size, 使实际渲染与选框一致。
 */
export function useWidgetControlSize(defaultHeight = 32, defaultWidth = 240) {
  const widgetData = inject(widgetDataKey)!;
  const widgetStyle = inject(widgetStyleKey)! as ComputedRef<
    Record<string, unknown>
  >;
  const bounds = inject(widgetBoundsKey, null);

  const widgetWidth = computed(
    () => bounds?.value.widthPx ?? widgetData.value.position?.w ?? defaultWidth,
  );

  /**
   * 控件逻辑Height：
   * - Free（有 bounds）：跟选框一致
   * - Grid + style.height 为 px：用该Value
   * - Grid + auto/%：用默认控件Height, 避免继续吃 free 的 position.h
   */
  const widgetHeight = computed(() => {
    if (bounds?.value.heightPx) return bounds.value.heightPx;
    const sh = widgetStyle.value?.height as string | undefined;
    if (sh && sh.endsWith("px")) {
      const px = parseFloat(sh);
      if (Number.isFinite(px) && px > 0) return px;
    }
    if (sh === "auto" || (sh != null && sh.endsWith("%"))) {
      return defaultHeight;
    }
    return widgetData.value.position?.h ?? defaultHeight;
  });

  const controlStyle = computed(() => {
    const h = widgetHeight.value;
    const style: Record<string, string> = {
      width: "100%",
      height: "100%",
      "--el-component-size": `${h}px`,
      "--el-component-size-small": `${h}px`,
      "--el-component-size-large": `${h}px`,
      "--el-select-width": "100%",
    };
    const fontSize = widgetStyle.value?.fontSize as string | undefined;
    const color = widgetStyle.value?.color as string | undefined;
    if (fontSize) style.fontSize = fontSize;
    if (color) style.color = color;
    // Grid 模式（SchemaNode 未注入 bounds）：用 widgetStyle.width/height 控制控件尺寸, 
    // 让 PropertyPanel 的 style.width（如 50% / 240px）对Form控件生效。
    // Free 模式有 bounds, 控件 100% 撑满 wrapper（wrapper 由 position.w/h 定宽）。
    if (!bounds) {
      const sw = widgetStyle.value?.width as string | undefined;
      const sh = widgetStyle.value?.height as string | undefined;
      if (sw) style.width = sw;
      // auto 交给内容撑开, 不要写成 height:auto 同Hrs又 100% 互相打架
      if (sh && sh !== "auto") style.height = sh;
      else if (sh === "auto") style.height = `${defaultHeight}px`;
    }
    return style;
  });

  return { widgetWidth, widgetHeight, controlStyle };
}

/**
 * 通用LayoutStyle：Widget根节点填满 SchemaNode wrapper（100%）。
 * 用于Chart、富文本、自定义 div 等非 EP Form控件。
 */
export function useWidgetLayoutStyle(defaultHeight = 32, defaultWidth = 240) {
  const { widgetWidth, widgetHeight, controlStyle } = useWidgetControlSize(
    defaultHeight,
    defaultWidth,
  );
  const layoutStyle = computed(() => {
    const base: Record<string, string> = {
      width: "100%",
      height: "100%",
      minWidth: "0",
      minHeight: "0",
      boxSizing: "border-box",
    };
    if (controlStyle.value.fontSize)
      base.fontSize = controlStyle.value.fontSize;
    if (controlStyle.value.color) base.color = controlStyle.value.color;
    // Grid 模式：controlStyle 已用 widgetStyle.width/height 覆盖, 这里Sync
    if (controlStyle.value.width !== "100%")
      base.width = controlStyle.value.width;
    if (controlStyle.value.height !== "100%")
      base.height = controlStyle.value.height;
    return base;
  });
  return { widgetWidth, widgetHeight, layoutStyle, controlStyle };
}
