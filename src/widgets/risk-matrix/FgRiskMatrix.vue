<script setup lang="ts">
import { computed, inject } from "vue";
import { widgetDataKey } from "../base/types";
import { useWidgetRenderState } from "../../composables/useWidgetRenderState";
import { useExposeWidget } from "../../composables/useExposeWidget";

const widgetData = inject(widgetDataKey)!;
const { isDisabled } = useWidgetRenderState();

const riskTypeField = computed(() => (widgetData.value.props?.riskTypeField as string) ?? "type");
const severityField = computed(() => (widgetData.value.props?.severityField as string) ?? "severity");
const title = computed(() => (widgetData.value.props?.title as string) ?? "Risk Matrix");
const levels = computed<string[]>(() => (widgetData.value.props?.levels as string[]) ?? ["Low", "Medium", "High", "Critical"]);
const showLegend = computed(() => (widgetData.value.props?.showLegend as boolean) ?? true);

const staticData = computed<Record<string, unknown>[]>(() => {
  const raw = widgetData.value.props?.staticData;
  return Array.isArray(raw) ? raw as Record<string, unknown>[] : [];
});

const SEVERITY_COLORS: Record<string, string> = {
  low: "#91cc75",
  medium: "#fac858",
  high: "#ee6666",
  critical: "#8b0000",
};

const matrixRows = computed(() => {
  const data = staticData.value;
  const types = [...new Set(data.map(d => String(d[riskTypeField.value] ?? "Unknown")))].sort();
  return types.map(t => ({
    type: t,
    items: data.filter(d => String(d[riskTypeField.value]) === t),
    count: data.filter(d => String(d[riskTypeField.value]) === t).length,
    maxSeverity: Math.max(
      ...data
        .filter(d => String(d[riskTypeField.value]) === t)
        .map(d => levels.value.indexOf(String(d[severityField.value] ?? "Low")))
    ),
  }));
});

const legendItems = computed(() =>
  levels.value.map((l, i) => ({
    level: l,
    color: SEVERITY_COLORS[l.toLowerCase()] ?? "#ccc",
  }))
);

useExposeWidget(() => ({
  get riskData() { return staticData.value; },
}));
</script>

<template>
  <div :class="$style.matrix">
    <div :class="$style.title">{{ title }}</div>
    <el-table
      v-if="matrixRows.length"
      :data="matrixRows"
      :border="true"
      :stripe="true"
      size="small"
    >
      <el-table-column prop="type" label="Risk Type" min-width="120" />
      <el-table-column prop="count" label="Count" width="80" align="center" />
      <el-table-column label="Max Severity" width="120" align="center">
        <template #default="{ row }">
          <el-tag
            :style="{ backgroundColor: levels[row.maxSeverity] ? (legendItems[row.maxSeverity]?.color ?? '#ccc') : '#ccc', color: '#fff', border: 'none' }"
            size="small"
          >
            {{ levels[row.maxSeverity] ?? '-' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Details" min-width="200">
        <template #default="{ row }">
          <span v-for="(item, i) in row.items.slice(0, 3)" :key="i" :style="{ marginRight: '4px' }">
            <el-tag size="small" effect="plain">{{ item.description ?? item[severityField] ?? '-' }}</el-tag>
          </span>
          <span v-if="row.items.length > 3" :style="{ color: '#909399', fontSize: '12px' }">+{{ row.items.length - 3 }} more</span>
        </template>
      </el-table-column>
    </el-table>
    <div v-else :class="$style.empty">No risk data configured</div>
    <div v-if="showLegend && matrixRows.length" :class="$style.legend">
      <span v-for="item in legendItems" :key="item.level" :class="$style.legendItem">
        <span :class="$style.legendDot" :style="{ backgroundColor: item.color }" />
        {{ item.level }}
      </span>
    </div>
  </div>
</template>

<style module lang="scss">
.matrix {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.title {
  font-size: 16px;
  font-weight: 500;
  color: var(--el-text-color-primary, #303133);
}
.legend {
  display: flex;
  gap: 12px;
  padding: 8px 0;
}
.legendItem {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
}
.legendDot {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  display: inline-block;
}
.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--el-text-color-secondary, #909399);
  font-size: 14px;
  border: 1px dashed var(--el-border-color, #dcdfe6);
  border-radius: 6px;
}
</style>
