/**
 * usePropertySections - 构建Property面板Min区Column表
 *
 * 从 PropertyPanel 抽出的核心逻辑：根据 widget Config声明 + Layout模式, 
 * 组装 basic / position / grid-layout / style / props 五个Min区。
 *
 * 设计：
 * - 纯函数式组装, 依赖passedParams注入（selectedWidget/panelDeclaration/t/stores）
 * - layoutMode 决定 position(free) vs grid-layout(grid) Min支
 * - row-container 子节点额外暴露 span Field
 */
import { computed, type ComputedRef } from "vue";
import type { TranslateFn } from "@/components/WidgetRenderer/types";
import type { Widget, ArrayFieldSchema } from "@/widgets/base/types";
import { publicStylePanel } from "@/widgets/base/publicSchema";
import { useWidgetStore } from "@/stores/widget";
import { useBoardStore } from "@/stores/board";
import { usePropertyAdapters } from "./usePropertyAdapters";

export interface SelectOption {
  label: string;
  value: string | number | boolean;
}

export interface PropertyItem {
  key: string;
  label: string;
  type: string;
  value: unknown;
  desc?: string;
  placeholder?: string;
  options?: SelectOption[];
  fields?: ArrayFieldSchema[];
  remoteUrl?: string;
  labelField?: string;
  valueField?: string;
  visibleOn?: string;
  unit?: string;
  unitKey?: string;
  /** number Type：MinValue */
  min?: number;
  /** number Type：MaxValue */
  max?: number;
}

export interface PropertySection {
  key: string;
  label: string;
  items: PropertyItem[];
}

interface PropertyPanelDeclaration {
  basic?: Array<
    | string
    | {
        key: string;
        label: string;
        type: string;
        default?: unknown;
        desc?: string;
        options?: SelectOption[];
        fields?: ArrayFieldSchema[];
        visibleOn?: string;
        placeholder?: string;
        remoteUrl?: string;
        labelField?: string;
        valueField?: string;
      }
  >;
  style?: string[];
  props?: Array<
    | string
    | {
        key: string;
        label: string;
        type: string;
        default?: unknown;
        desc?: string;
        options?: SelectOption[];
        fields?: ArrayFieldSchema[];
        visibleOn?: string;
        placeholder?: string;
        remoteUrl?: string;
        labelField?: string;
        valueField?: string;
      }
  >;
}

function getNestedValue(
  obj: Record<string, unknown> | undefined,
  path: string,
): unknown {
  if (!obj) return undefined;
  return path
    .split(".")
    .reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], obj);
}

export function usePropertySections(
  selectedWidget: ComputedRef<Widget | null>,
  panelDeclaration: ComputedRef<PropertyPanelDeclaration | undefined>,
  t: TranslateFn,
) {
  const widgetStore = useWidgetStore();
  const boardStore = useBoardStore();
  const {
    getStyleLabel,
    getStyleInputType,
    getPropInputType,
    getStyleOptions,
  } = usePropertyAdapters();

  function getBasicPropertyItem(prop: string, widget: Widget): PropertyItem {
    const map: Record<
      string,
      { label: string; type: string; value: unknown; desc: string }
    > = {
      field: {
        label: t("editor.property.field"),
        type: "text",
        value: widget.field,
        desc: t("editor.property.fieldDesc"),
      },
      label: {
        label: t("editor.property.label"),
        type: "text",
        value: widget.label,
        desc: t("editor.property.labelDesc"),
      },
      defaultValue: {
        label: t("editor.property.defaultValue"),
        type: "text",
        value: widget.defaultValue,
        desc: t("editor.property.defaultValueDesc"),
      },
      hidden: {
        label: t("editor.property.hidden"),
        type: "switch",
        value: widget.hidden,
        desc: t("editor.property.hiddenDesc"),
      },
      options: {
        label: t("editor.property.options"),
        type: "options",
        value: widget.options,
        desc: t("editor.property.optionsDesc"),
      },
      validationRules: {
        label: t("editor.property.validationRules"),
        type: "rules",
        value: widget.validationRules,
        desc: t("editor.property.validationRulesDesc"),
      },
    };
    const mapped = map[prop];
    if (mapped) {
      return { key: prop, ...mapped };
    }
    return {
      key: prop,
      label: prop,
      type: "text",
      value: widget.props?.[prop],
    };
  }

  /**
   * 翻译 Widget PropertyLabel
   * 优先使用 editor.widgetProps.${propKey} 的翻译, 回退到原始Label
   */
  function translateWidgetPropLabel(
    propKey: string,
    fallbackLabel: string,
  ): string {
    const key = `editor.widgetProps.${propKey}`;
    const translated = t(key);
    // t() 返回 key 本身表示未找到翻译
    return translated === key ? fallbackLabel : translated;
  }

  /**
   * 翻译 Widget PropertyDescription
   * 优先使用 editor.widgetProps.${propKey}Desc 的翻译, 回退到原始Description
   */
  function translateWidgetPropDesc(
    propKey: string,
    fallbackDesc?: string,
  ): string | undefined {
    if (!fallbackDesc) return undefined;
    const key = `editor.widgetProps.${propKey}Desc`;
    const translated = t(key);
    return translated === key ? fallbackDesc : translated;
  }

  const propertySections = computed<PropertySection[]>(() => {
    if (!panelDeclaration.value || !selectedWidget.value) return [];

    const sections: PropertySection[] = [];
    const panel = panelDeclaration.value;
    const widget = selectedWidget.value;

    // 1. 基础Property
    const basicItems: PropertyItem[] = [];
    if (panel.basic) {
      for (const prop of panel.basic) {
        if (typeof prop === "string") {
          basicItems.push(getBasicPropertyItem(prop, widget));
        } else {
          basicItems.push({
            key: prop.key,
            label: translateWidgetPropLabel(prop.key, prop.label),
            type: prop.type,
            value: widget.props?.[prop.key] ?? prop.default,
            desc: translateWidgetPropDesc(prop.key, prop.desc),
            options: prop.options,
            fields: prop.fields,
            visibleOn: prop.visibleOn,
          });
        }
      }
    }
    if (basicItems.length) {
      sections.push({
        key: "basic",
        label: t("editor.property.basic"),
        items: basicItems,
      });
    }

    // 2. 位置Property（Grid 流式Layout无绝对坐标）
    if (boardStore.layoutMode !== "grid") {
      sections.push({
        key: "position",
        label: t("editor.property.position"),
        items: [
          {
            key: "position.x",
            label: t("editor.property.posX"),
            type: "number",
            value: widget.position?.x ?? 0,
            desc: t("editor.property.posXDesc"),
            unit: widget.position?.xUnit ?? "px",
            unitKey: "position.xUnit",
          },
          {
            key: "position.y",
            label: t("editor.property.posY"),
            type: "number",
            value: widget.position?.y ?? 0,
            desc: t("editor.property.posYDesc"),
            unit: widget.position?.yUnit ?? "px",
            unitKey: "position.yUnit",
          },
          {
            key: "position.w",
            label: t("editor.property.width"),
            type: "number",
            value: widget.position?.w ?? 240,
            desc: t("editor.property.widthDesc"),
            unit: widget.position?.wUnit ?? "px",
            unitKey: "position.wUnit",
          },
          {
            key: "position.h",
            label: t("editor.property.height"),
            type: "number",
            value: widget.position?.h ?? 40,
            desc: t("editor.property.heightDesc"),
            unit: widget.position?.hUnit ?? "px",
            unitKey: "position.hUnit",
          },
          {
            key: "position.zIndex",
            label: t("editor.property.zIndex"),
            type: "number",
            value: widget.position?.zIndex ?? 0,
            desc: t("editor.property.zIndexDesc"),
          },
        ],
      });
    }

    // 2a. 响应式位置覆盖（仅 free 模式, 预览/发布态生效）
    if (boardStore.layoutMode !== "grid") {
      const rp = widget.responsivePosition ?? {};
      const tablet = rp.tablet ?? {};
      const mobile = rp.mobile ?? {};
      sections.push({
        key: "responsive",
        label: t("editor.property.responsive"),
        items: [
          {
            key: "responsivePosition.tablet.x",
            label: t("editor.property.responsiveTabletX"),
            type: "number",
            value: tablet.x ?? "",
            desc: t("editor.property.responsiveTabletDesc"),
          },
          {
            key: "responsivePosition.tablet.y",
            label: t("editor.property.responsiveTabletY"),
            type: "number",
            value: tablet.y ?? "",
          },
          {
            key: "responsivePosition.tablet.w",
            label: t("editor.property.responsiveTabletW"),
            type: "number",
            value: tablet.w ?? "",
          },
          {
            key: "responsivePosition.tablet.h",
            label: t("editor.property.responsiveTabletH"),
            type: "number",
            value: tablet.h ?? "",
          },
          {
            key: "responsivePosition.tablet.hidden",
            label: t("editor.property.responsiveTabletHidden"),
            type: "switch",
            value: tablet.hidden ?? false,
          },
          {
            key: "responsivePosition.mobile.x",
            label: t("editor.property.responsiveMobileX"),
            type: "number",
            value: mobile.x ?? "",
            desc: t("editor.property.responsiveMobileDesc"),
          },
          {
            key: "responsivePosition.mobile.y",
            label: t("editor.property.responsiveMobileY"),
            type: "number",
            value: mobile.y ?? "",
          },
          {
            key: "responsivePosition.mobile.w",
            label: t("editor.property.responsiveMobileW"),
            type: "number",
            value: mobile.w ?? "",
          },
          {
            key: "responsivePosition.mobile.h",
            label: t("editor.property.responsiveMobileH"),
            type: "number",
            value: mobile.h ?? "",
          },
          {
            key: "responsivePosition.mobile.hidden",
            label: t("editor.property.responsiveMobileHidden"),
            type: "switch",
            value: mobile.hidden ?? false,
          },
        ],
      });
    }

    // 2b. Grid LayoutProperty（仅Grid 模式）
    // Grid 模式为纵向流式堆叠, WidgetWidthpassed style.width 控制（如 100%/50%/240px）。
    // row-container 子节点额外暴露 span（1-24 栅格）, 由父Container决定单元格Width。
    if (boardStore.layoutMode === "grid") {
      const items: PropertyItem[] = [
        {
          key: "style.width",
          label: t("editor.property.width"),
          type: "text",
          value: widget.style?.width,
          desc: t("editor.property.gridWidthDesc"),
        },
        {
          key: "style.height",
          label: t("editor.property.height"),
          type: "text",
          value: widget.style?.height,
          desc: t("editor.property.gridHeightDesc"),
        },
        {
          key: "style.marginTop",
          label: t("editor.property.marginTop"),
          type: "text",
          value: widget.style?.marginTop,
          desc: t("editor.property.marginTopDesc"),
        },
        {
          key: "style.marginBottom",
          label: t("editor.property.marginBottom"),
          type: "text",
          value: widget.style?.marginBottom,
          desc: t("editor.property.marginBottomDesc"),
        },
      ];
      // 父Container为 row-container Hrs, 暴露栅格 span（1-24）
      const parent = widget.id ? widgetStore.findParent(widget.id) : null;
      if (parent?.type === "row-container") {
        const currentSpan = typeof widget.span === "number" ? widget.span : 24;
        items.push({
          key: "span",
          label: t("editor.property.span"),
          type: "number",
          value: currentSpan,
          desc: t("editor.property.spanDesc"),
          min: 1,
          max: 24,
        });
      } else if (!parent) {
        // 根级 widget：暴露 gridSpan（跨Column数）, -1 = 撑满剩余Column
        const maxColumns = boardStore.canvas.gridLayout?.maxColumns ?? 12;
        items.push({
          key: "gridSpan",
          label: t("editor.property.gridSpan"),
          type: "number",
          value: widget.gridSpan ?? -1,
          desc: t("editor.property.gridSpanDesc"),
          min: -1,
          max: Math.max(1, maxColumns),
        });
      }
      sections.push({
        key: "grid-layout",
        label: t("editor.property.gridLayout"),
        items,
      });
    }

    // 3. StyleProperty
    const styleProps = [...publicStylePanel, ...(panel.style ?? [])];
    const uniqueStyleProps = [...new Set(styleProps)];
    const styleItems: PropertyItem[] = [];
    for (const prop of uniqueStyleProps) {
      const styleLabel = getStyleLabel(prop);
      styleItems.push({
        key: `style.${prop}`,
        label: styleLabel,
        type: getStyleInputType(prop),
        value: widget.style?.[prop],
        desc: t("editor.property.styleDesc", { label: styleLabel }),
        options: getStyleOptions(prop),
      });
    }
    if (styleItems.length) {
      sections.push({
        key: "style",
        label: t("editor.property.style"),
        items: styleItems,
      });
    }

    // 4. ComponentProperty
    const propItems: PropertyItem[] = [];
    if (panel.props) {
      for (const prop of panel.props) {
        if (typeof prop === "string") {
          propItems.push({
            key: `props.${prop}`,
            label: translateWidgetPropLabel(prop, prop),
            type: getPropInputType(prop),
            value: widget.props?.[prop],
          });
        } else {
          propItems.push({
            key: `props.${prop.key}`,
            label: translateWidgetPropLabel(prop.key, prop.label),
            type: prop.type,
            value: getNestedValue(widget.props, prop.key) ?? prop.default,
            desc: translateWidgetPropDesc(prop.key, prop.desc),
            placeholder: (prop as any).placeholder,
            options: prop.options,
            fields: prop.fields,
            remoteUrl: (prop as any).remoteUrl,
            labelField: (prop as any).labelField,
            valueField: (prop as any).valueField,
            visibleOn: prop.visibleOn,
          });
        }
      }
    }
    if (propItems.length) {
      sections.push({
        key: "props",
        label: t("editor.property.props"),
        items: propItems,
      });
    }

    return sections;
  });

  return { propertySections };
}
