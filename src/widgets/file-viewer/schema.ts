import { nanoid } from "nanoid";
import type { Widget } from "../base/types";
export function createFileViewerWidget(id?: string): Widget {
  return {
    id: id ?? nanoid(), name: "FgFileViewer", type: "file-viewer",
    field: "fileViewer", label: "File Viewer",
    props: { url: "", fileType: "image", alt: "Preview", fit: "contain", maxHeight: 400 },
    style: { width: "100%", height: "400px" },
    position: { x: 0, y: 0, w: 400, h: 300, zIndex: 1 }, children: [],
  };
}
