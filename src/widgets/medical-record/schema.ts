import { nanoid } from "nanoid";
import type { Widget } from "../base/types";
export function createMedicalRecordWidget(id?: string): Widget {
  return {
    id: id ?? nanoid(), name: "FgMedicalRecord", type: "medical-record",
    field: "medicalRecord", label: "Medical Record",
    props: { showLabels: true, formData: {} },
    style: { width: "100%", height: "auto" },
    position: { x: 0, y: 0, w: 280, h: 400, zIndex: 1 }, children: [],
  };
}
