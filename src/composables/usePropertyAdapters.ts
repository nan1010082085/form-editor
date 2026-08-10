/**
 * usePropertyAdapters -- Widget Property适配器
 *
 * 职责：
 * - Widget Property的读写（支持 dot-notation 路径）
 * - StyleProperty → InputTypeMap
 * - StyleProperty → i18n LabelMap
 * - Component props → InputTypeMap
 *
 * 配合 PropertyPanel / PropertyField 使用。
 */
import { useI18n } from "@schema-platform/platform-shared";
import type { Widget } from "../widgets/base/types";
import { getAnimationOptions } from "../utils/widgetAnimations";

/** StyleProperty → locale key（editor.styleProps.*） */
const STYLE_LABEL_KEYS = [
  "width",
  "height",
  "margin",
  "padding",
  "backgroundColor",
  "background",
  "border",
  "borderRadius",
  "boxShadow",
  "fontSize",
  "fontWeight",
  "color",
  "animationPreset",
  "animationDelay",
  "animationDuration",
] as const;

const COLOR_STYLE_PROPS = new Set(["color", "backgroundColor"]);
const TEXT_STYLE_PROPS = new Set(["width", "height", "fontSize"]);
const SELECT_STYLE_PROPS = new Set(["fontWeight", "animationPreset"]);
const BORDER_STYLE_PROPS = new Set(["border"]);
const BORDER_RADIUS_STYLE_PROPS = new Set(["borderRadius"]);
const SPACING_MARGIN_PROPS = new Set(["margin"]);
const SPACING_PADDING_PROPS = new Set(["padding"]);
const SHADOW_STYLE_PROPS = new Set(["boxShadow"]);
const BACKGROUND_STYLE_PROPS = new Set(["background"]);
const NUMBER_STYLE_PROPS = new Set(["animationDelay", "animationDuration"]);

const BOOLEAN_PROPS = new Set([
  "disabled",
  "readonly",
  "clearable",
  "multiple",
  "filterable",
  "showPassword",
  "showWordLimit",
  "showHeader",
]);

/**
 * @returns Property读写与Style元Data适配器
 */
export function usePropertyAdapters() {
  const { t } = useI18n();

  /**
   * 读取 Widget Property（支持 dot-notation 路径）
   *
   * @param widget - Widget
   * @param path - 点Min路径
   */
  function readProperty(widget: Widget, path: string): unknown {
    const parts = path.split(".");
    let current: unknown = widget;
    for (const part of parts) {
      if (current == null || typeof current !== "object") return undefined;
      current = (current as Record<string, unknown>)[part];
    }
    return current;
  }

  /**
   * 写入 Widget Property（支持 dot-notation 路径）
   * 返回 patch 对象, 由调用方传给 widgetStore.updateWidget
   *
   * @param widget - Widget
   * @param path - 点Min路径
   * @param value - 新Value
   */
  function writeProperty(
    widget: Widget,
    path: string,
    value: unknown,
  ): Partial<Widget> {
    const parts = path.split(".");

    if (parts.length === 1) {
      return { [parts[0]]: value };
    }

    if (parts[0] === "position") {
      return {
        position: { ...widget.position, [parts[1]]: value },
      };
    }

    if (parts[0] === "style") {
      return {
        style: { ...(widget.style ?? {}), [parts[1]]: value },
      };
    }

    if (parts[0] === "props") {
      return {
        props: { ...(widget.props ?? {}), [parts[1]]: value },
      };
    }

    return {};
  }

  /**
   * StyleProperty → 本地化Label
   *
   * @param prop - StyleProperty名
   */
  function getStyleLabel(prop: string): string {
    if ((STYLE_LABEL_KEYS as readonly string[]).includes(prop)) {
      return t(`editor.styleProps.${prop}`);
    }
    return prop;
  }

  /**
   * StyleProperty → PropertyField InputType
   *
   * @param prop - StyleProperty名
   */
  function getStyleInputType(prop: string): string {
    if (COLOR_STYLE_PROPS.has(prop)) return "color";
    if (SELECT_STYLE_PROPS.has(prop)) return "select";
    if (NUMBER_STYLE_PROPS.has(prop)) return "number";
    if (BORDER_STYLE_PROPS.has(prop)) return "border-editor";
    if (BORDER_RADIUS_STYLE_PROPS.has(prop)) return "border-radius-editor";
    if (SPACING_MARGIN_PROPS.has(prop)) return "spacing-margin-editor";
    if (SPACING_PADDING_PROPS.has(prop)) return "spacing-padding-editor";
    if (SHADOW_STYLE_PROPS.has(prop)) return "shadow-editor";
    if (BACKGROUND_STYLE_PROPS.has(prop)) return "background-editor";
    if (TEXT_STYLE_PROPS.has(prop)) return "text";
    return "text";
  }

  /**
   * Component props → PropertyField InputType
   *
   * @param prop - prop 名
   */
  function getPropInputType(prop: string): string {
    if (BOOLEAN_PROPS.has(prop)) return "switch";
    return "text";
  }

  /**
   * StyleProperty → 下拉Options（仅 select Type有Value）
   *
   * @param prop - StyleProperty名
   */
  function getStyleOptions(
    prop: string,
  ): { label: string; value: string | number }[] | undefined {
    if (prop === "fontWeight") {
      return [
        { label: t("editor.styleProps.fontWeightNormal"), value: "normal" },
        { label: t("editor.styleProps.fontWeightBold"), value: "bold" },
      ];
    }
    if (prop === "animationPreset") {
      return getAnimationOptions(t);
    }
    return undefined;
  }

  return {
    readProperty,
    writeProperty,
    getStyleLabel,
    getStyleInputType,
    getPropInputType,
    getStyleOptions,
  };
}
