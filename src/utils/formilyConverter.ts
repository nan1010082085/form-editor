/**
 * Formily Schema ImportTransform器
 *
 * 将 Formily JSON Schema Transform为 editor 的 Widget[] 格式, 
 * 降低 Formily UserMigrate成本, 借势 Formily 生态。
 *
 * Formily Schema 示例：
 * {
 *   "type": "object",
 *   "properties": {
 *     "username": {
 *       "type": "string",
 *       "title": "User名",
 *       "required": true,
 *       "x-component": "Input",
 *       "x-component-props": { "placeholder": "Please enter" }
 *     }
 *   }
 * }
 *
 * Transform为 editor Widget：
 * { id, name: "FgInput", type: "input", field: "username", label: "User名", props: {...}, ... }
 */

import { nanoid } from "nanoid";
import type { Widget } from "@/widgets/base/types";

/** Formily x-component -> editor widget type/name Map */
const FORMILY_COMPONENT_MAP: Record<string, { type: string; name: string }> = {
  Input: { type: "input", name: "FgInput" },
  TextArea: { type: "textarea", name: "FgTextarea" },
  Password: { type: "input", name: "FgInput" },
  NumberPicker: { type: "number", name: "FgInput" },
  Select: { type: "select", name: "FgSelect" },
  Checkbox: { type: "checkbox", name: "FgCheckbox" },
  CheckboxGroup: { type: "checkbox-group", name: "FgCheckboxGroup" },
  Radio: { type: "radio", name: "FgRadio" },
  RadioGroup: { type: "radio-group", name: "FgRadioGroup" },
  Switch: { type: "switch", name: "FgSwitch" },
  DatePicker: { type: "date", name: "FgDate" },
  DateRangePicker: { type: "date-range", name: "FgDateRange" },
  TimePicker: { type: "time", name: "FgTime" },
  Cascader: { type: "cascader", name: "FgCascader" },
  Upload: { type: "upload", name: "FgUpload" },
  Transfer: { type: "transfer", name: "FgTransfer" },
  Slider: { type: "slider", name: "FgSlider" },
  Rate: { type: "rate", name: "FgRate" },
  ColorPicker: { type: "color-picker", name: "FgColorPicker" },
};

interface FormilyField {
  type?: string;
  title?: string;
  required?: boolean;
  description?: string;
  default?: unknown;
  enum?: Array<{ label: string; value: string } | string>;
  "x-component"?: string;
  "x-component-props"?: Record<string, unknown>;
  "x-decorator"?: string;
  "x-decorator-props"?: Record<string, unknown>;
  properties?: Record<string, FormilyField>;
}

interface FormilySchema {
  type?: string;
  properties?: Record<string, FormilyField>;
}

/**
 * 将 Formily Schema Transform为 editor Widget[]
 * @param formilySchema Formily JSON Schema 对象
 * @param startY 起始 Y 坐标（用于Layout）
 * @returns editor Widget[] 数组
 */
export function convertFormilyToWidgets(
  formilySchema: FormilySchema,
  startY = 0,
): Widget[] {
  const widgets: Widget[] = [];
  if (!formilySchema?.properties) return widgets;

  let yOffset = startY;
  const FIELD_HEIGHT = 48;
  const FIELD_WIDTH = 280;

  for (const [fieldKey, field] of Object.entries(formilySchema.properties)) {
    // 递归处理嵌套（如对象Type）
    if (field.properties && Object.keys(field.properties).length > 0) {
      const nested = convertFormilyToWidgets(
        { type: "object", properties: field.properties },
        yOffset,
      );
      widgets.push(...nested);
      yOffset += nested.length * FIELD_HEIGHT;
      continue;
    }

    const component = field["x-component"] || inferComponentByType(field.type);
    const mapping = FORMILY_COMPONENT_MAP[component];

    if (!mapping) {
      // 未知Component, falling back to input
      console.warn(`[formilyConverter] Unknown Formily component "${component}", Field "${fieldKey}" falling back to input`);
    }

    const widgetType = mapping?.type ?? "input";
    const widgetName = mapping?.name ?? "FgInput";

    // Transform enum Options
    const options = field.enum
      ? field.enum.map((item) =>
          typeof item === "string" ? { label: item, value: item } : item,
        )
      : undefined;

    // 合并 x-component-props 到 props
    const props: Record<string, unknown> = {
      ...(field["x-component-props"] ?? {}),
    };
    if (options) props.options = options;
    if (field.default !== undefined) props.defaultValue = field.default;

    const widget: Widget = {
      id: `${widgetType}_${nanoid(5)}`,
      name: widgetName,
      type: widgetType,
      field: fieldKey,
      label: field.title ?? fieldKey,
      props,
      style: { width: "100%", height: "auto" },
      position: { x: 0, y: yOffset, w: FIELD_WIDTH, h: FIELD_HEIGHT, zIndex: 1 },
      children: [],
    };

    // 必填标记
    if (field.required) {
      widget.props!.required = true;
    }

    // Description作为 placeholder or tooltip
    if (field.description) {
      widget.props!.placeholder = field.description;
    }

    widgets.push(widget);
    yOffset += FIELD_HEIGHT;
  }

  return widgets;
}

/** 根据 JSON Schema type 推断 Formily Component */
function inferComponentByType(type?: string): string {
  switch (type) {
    case "string":
      return "Input";
    case "number":
      return "NumberPicker";
    case "boolean":
      return "Switch";
    case "array":
      return "CheckboxGroup";
    default:
      return "Input";
  }
}

/**
 * Validate是否为合法 Formily Schema
 */
export function isFormilySchema(schema: unknown): schema is FormilySchema {
  if (!schema || typeof schema !== "object") return false;
  const s = schema as Record<string, unknown>;
  return (
    (s.type === "object" || s.type === "void") &&
    !!s.properties &&
    typeof s.properties === "object"
  );
}
