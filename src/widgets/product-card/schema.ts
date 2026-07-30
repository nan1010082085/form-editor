import { nanoid } from "nanoid";
import type { Widget } from "../base/types";
export function createProductCardWidget(id?: string): Widget {
  return {
    id: id ?? nanoid(), name: "FgProductCard", type: "product-card",
    field: "productCard", label: "Product Card",
    props: { staticData: {}, nameField: "name", priceField: "price", imageField: "image", statusField: "status", currency: "¥", showImage: true, showPrice: true, showStatus: true, showDescription: true, imageHeight: 200 },
    style: { width: "280px", height: "auto" },
    position: { x: 0, y: 0, w: 280, h: 350, zIndex: 1 }, children: [],
  };
}
