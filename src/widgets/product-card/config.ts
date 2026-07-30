import type { WidgetConfig } from "../base/types";

export const productCardConfig: WidgetConfig = {
  name: "FgProductCard",
  displayName: "Product Card",
  description: "Product display card for retail/e-commerce (image/name/price/status)",
  author: "yangdongnan",
  defaultStyle: { width: "280px", height: "auto" },
  defaultProps: {
    staticData: {},
    nameField: "name",
    priceField: "price",
    imageField: "image",
    statusField: "status",
    currency: "¥",
    showImage: true,
    showPrice: true,
    showStatus: true,
    showDescription: true,
    imageHeight: 200,
  },
  exposedValues: [
    { key: "productData", type: "object", description: "Product data" },
  ],
  configPanels: ["api", "variables", "events"],
  propertyPanel: {
    basic: ["label"],
    style: [],
    props: [
      { key: "staticData", label: "Product Data", type: "json", default: {} },
      { key: "nameField", label: "Name Field", type: "input", default: "name" },
      { key: "priceField", label: "Price Field", type: "input", default: "price" },
      { key: "imageField", label: "Image Field", type: "input", default: "image" },
      { key: "statusField", label: "Status Field", type: "input", default: "status" },
      { key: "currency", label: "Currency", type: "input", default: "¥" },
      { key: "showImage", label: "Show Image", type: "switch", default: true },
      { key: "showPrice", label: "Show Price", type: "switch", default: true },
      { key: "showStatus", label: "Show Status", type: "switch", default: true },
      { key: "showDescription", label: "Show Description", type: "switch", default: true },
      { key: "imageHeight", label: "Image Height", type: "number", default: 200 },
    ],
  },
};
