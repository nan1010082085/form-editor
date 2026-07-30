import { nanoid } from "nanoid";
import type { Widget } from "../base/types";
export function createEnergyDashboardWidget(id?: string): Widget {
  return {
    id: id ?? nanoid(), name: "FgEnergyDashboard", type: "energy-dashboard",
    field: "energyDashboard", label: "Energy Dashboard",
    props: { staticData: [], title: "Energy Dashboard", timeField: "time", valueField: "value", unit: "kWh", showChart: true, showStats: true },
    style: { width: "100%", height: "400px" },
    position: { x: 0, y: 0, w: 400, h: 300, zIndex: 1 }, children: [],
  };
}
