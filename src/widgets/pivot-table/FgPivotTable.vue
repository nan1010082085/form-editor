<script setup lang="ts">
import { computed, inject } from "vue";
import { widgetDataKey } from "../base/types";
import { useExposeWidget } from "../../composables/useExposeWidget";

const widgetData = inject(widgetDataKey)!;

const rowField = computed(() => (widgetData.value.props?.rowField as string) ?? "");
const columnField = computed(() => (widgetData.value.props?.columnField as string) ?? "");
const valueField = computed(() => (widgetData.value.props?.valueField as string) ?? "");
const aggregation = computed(() => (widgetData.value.props?.aggregation as string) ?? "sum");
const showTotals = computed(() => (widgetData.value.props?.showTotals as boolean) ?? true);

const staticData = computed<Record<string, unknown>[]>(() => {
  const raw = widgetData.value.props?.staticData;
  return Array.isArray(raw) ? raw as Record<string, unknown>[] : [];
});

function aggregate(values: number[], agg: string): number {
  switch (agg) {
    case "sum": return values.reduce((a, b) => a + b, 0);
    case "avg": return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    case "count": return values.length;
    case "min": return values.length ? Math.min(...values) : 0;
    case "max": return values.length ? Math.max(...values) : 0;
    default: return values.reduce((a, b) => a + b, 0);
  }
}

const pivotResult = computed(() => {
  const data = staticData.value;
  const rf = rowField.value;
  const cf = columnField.value;
  const vf = valueField.value;
  if (!data.length || !rf || !cf) return { rows: [], columns: [] };

  const rowValues = [...new Set(data.map(d => String(d[rf] ?? "")))].sort();
  const colValues = [...new Set(data.map(d => String(d[cf] ?? "")))].sort();

  const pivotData: Record<string, Record<string, number[]>> = {};
  for (const d of data) {
    const rKey = String(d[rf] ?? "");
    const cKey = String(d[cf] ?? "");
    const val = Number(d[vf]) || 0;
    if (!pivotData[rKey]) pivotData[rKey] = {};
    if (!pivotData[rKey][cKey]) pivotData[rKey][cKey] = [];
    pivotData[rKey][cKey].push(val);
  }

  const rows = rowValues.map((rv, i) => {
    const row: Record<string, unknown> = { id: i, [rf]: rv };
    for (const cv of colValues) {
      const vals = pivotData[rv]?.[cv] ?? [];
      row[cv] = aggregate(vals, aggregation.value);
    }
    if (showTotals.value) {
      const allVals = colValues.flatMap(cv => pivotData[rv]?.[cv] ?? []);
      row["__total__"] = aggregate(allVals, aggregation.value);
    }
    return row;
  });

  const columns = [
    { prop: rf, label: rf, minWidth: 120, align: "left" as const },
    ...colValues.map(cv => ({ prop: cv, label: cv, minWidth: 100, align: "right" as const })),
  ];
  if (showTotals.value) {
    columns.push({ prop: "__total__", label: "Total", minWidth: 100, align: "right" as const });
  }

  return { rows, columns };
});

useExposeWidget(() => ({
  get pivotData() { return pivotResult.value.rows; },
}));
</script>

<template>
  <div :class="$style.pivot">
    <el-table
      v-if="pivotResult.rows.length"
      :data="pivotResult.rows"
      :border="true"
      :stripe="true"
      size="small"
      :height="widgetData.style?.height || '400px'"
    >
      <el-table-column
        v-for="col in pivotResult.columns"
        :key="col.prop"
        :prop="col.prop"
        :label="col.label"
        :min-width="col.minWidth"
        :align="col.align"
        sortable
      />
    </el-table>
    <div v-else :class="$style.empty">
      Configure rowField, columnField, and valueField to generate pivot table
    </div>
  </div>
</template>

<style module lang="scss">
.pivot {
  width: 100%;
  height: 100%;
}
.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--el-text-color-secondary, #909399);
  font-size: 14px;
  border: 1px dashed var(--el-border-color, #dcdfe6);
  border-radius: 6px;
}
</style>
