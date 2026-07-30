import type { WidgetConfig } from "../base/types";
import { descriptionsMock } from "./mock";

/** 描述列表单项的值类型 */
export type DescriptionItemType = "text" | "tag" | "link" | "image" | "date";

/** 描述列表单项配置 */
export interface DescriptionItemConfig {
  label: string;
  field: string;
  type: DescriptionItemType;
  /** 值前缀（如 ¥） */
  prefix?: string;
  /** 值后缀 */
  suffix?: string;
  /** tag 类型时的选项映射 */
  options?: { label: string; value: string | number; color?: string }[];
  /** link 类型时的点击行为 */
  href?: string;
  /** image 类型时的宽度 */
  imageWidth?: number;
  /** image 类型时的高度 */
  imageHeight?: number;
  /** date 类型时的格式化 */
  format?: string;
  /** 跨列数 */
  span?: number;
}

export const descriptionsConfig: WidgetConfig = {
  name: "FgDescriptions",
  displayName: "Descriptions",
  description: "Key-value descriptions with multi-column",
  author: "yangdongnan",
  defaultStyle: { width: "100%" },
  exposedValues: [
    { key: "data", type: "object", description: "Descriptions Data" },
    { key: "loading", type: "boolean", description: "Loading State" },
  ],
  configPanels: ["events", "api", "variables"],
  defaultProps: {
    title: "详情",
    column: 2,
    border: true,
    staticData: descriptionsMock.staticData,
    items: [
      { label: "Field 1", field: "field1", type: "text" },
      { label: "Field 2", field: "field2", type: "text" },
    ],
  },
  propertyPanel: {
    basic: ["label"],
    style: ["margin", "padding"],
    props: [
      { key: "title", label: "Title", type: "input", default: "详情" },
      {
        key: "column",
        label: "Col Count",
        type: "select",
        default: 2,
        options: [
          { label: "1 Col", value: 1 },
          { label: "2 Col", value: 2 },
          { label: "3 Col", value: 3 },
          { label: "4 Col", value: 4 },
        ],
      },
      { key: "border", label: "Show Border", type: "switch", default: true },
      {
        key: "items",
        label: "Field List",
        type: "array-editor",
        itemLabel: "label",
        fields: [
          {
            key: "label",
            label: "Label",
            type: "text",
            placeholder: "显示名称",
          },
          {
            key: "field",
            label: "Field",
            type: "text",
            placeholder: "数据字段名",
          },
          {
            key: "type",
            label: "Type",
            type: "select",
            default: "text",
            options: [
              { label: "Text", value: "text" },
              { label: "Label", value: "tag" },
              { label: "Link", value: "link" },
              { label: "Image", value: "image" },
              { label: "Date", value: "date" },
            ],
          },
          { key: "prefix", label: "Prefix", type: "text", placeholder: "如 ¥" },
          { key: "suffix", label: "Suffix", type: "text", placeholder: "如 元" },
          { key: "span", label: "Span", type: "number", default: 1 },
        ],
      },
    ],
  },
};
