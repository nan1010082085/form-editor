import type { WidgetConfig } from "../base/types";
import { descriptionsMock } from "./mock";

/** DescriptionColumnFormitems的ValueType */
export type DescriptionItemType = "text" | "tag" | "link" | "image" | "date";

/** DescriptionColumnFormitemsConfig */
export interface DescriptionItemConfig {
  label: string;
  field: string;
  type: DescriptionItemType;
  /** Value前缀（e.g. ¥） */
  prefix?: string;
  /** Value后缀 */
  suffix?: string;
  /** tag TypeHrs的OptionsMap */
  options?: { label: string; value: string | number; color?: string }[];
  /** link TypeHrs的ClickRow为 */
  href?: string;
  /** image TypeHrs的Width */
  imageWidth?: number;
  /** image TypeHrs的Height */
  imageHeight?: number;
  /** date TypeHrs的Format */
  format?: string;
  /** 跨Column数 */
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
    title: "Details",
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
      { key: "title", label: "Title", type: "input", default: "Details" },
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
            placeholder: "ShowName",
          },
          {
            key: "field",
            label: "Field",
            type: "text",
            placeholder: "DataField name",
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
          { key: "prefix", label: "Prefix", type: "text", placeholder: "e.g. ¥" },
          { key: "suffix", label: "Suffix", type: "text", placeholder: "e.g. yuan" },
          { key: "span", label: "Span", type: "number", default: 1 },
        ],
      },
    ],
  },
};
