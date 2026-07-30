import { nanoid } from "nanoid";
import type { Widget } from "../base/types";

export function createSignatureWidget(id?: string): Widget {
  return {
    id: id ?? nanoid(),
    name: "FgSignature",
    type: "signature",
    field: "signature",
    label: "Signature",
    props: {
      penWidth: 2,
      penColor: "#000000",
      backgroundColor: "#ffffff",
      showClear: true,
      clearText: "Clear",
      placeholder: "Sign here",
      outputFormat: "png",
    },
    style: { width: "100%", height: "200px" },
    position: { x: 0, y: 0, w: 280, h: 200, zIndex: 1 },
    children: [],
  };
}
