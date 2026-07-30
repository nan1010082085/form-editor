<script setup lang="ts">
import { ref, computed } from "vue";
import { getAllWidgets } from "@/widgets/registry";
import type { WidgetRegistryItem } from "@/widgets/registry";
import AppIcon from "@schema-platform/platform-shared/components/common/AppIcon.vue";

const searchQuery = ref("");
const activeGroup = ref<string>("all");

const allWidgets = computed<WidgetRegistryItem[]>(() => getAllWidgets());

const GROUP_LABELS: Record<string, string> = {
  all: "All",
  form: "Form",
  chart: "Chart",
  business: "Business",
  layout: "Layout",
  container: "Container",
  table: "Table",
  action: "Action",
  static: "Static",
};

const groups = computed(() => {
  const set = new Set(allWidgets.value.map((w) => w.group));
  return ["all", ...Array.from(set).sort()];
});

const groupStats = computed(() => {
  const stats: Record<string, number> = {};
  for (const w of allWidgets.value) {
    stats[w.group] = (stats[w.group] ?? 0) + 1;
  }
  return stats;
});

const filteredWidgets = computed(() => {
  let list = allWidgets.value;
  if (activeGroup.value !== "all") {
    list = list.filter((w) => w.group === activeGroup.value);
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(
      (w) =>
        w.displayName.toLowerCase().includes(q) ||
        w.type.toLowerCase().includes(q) ||
        (w.config?.description ?? "").toLowerCase().includes(q),
    );
  }
  return list;
});
</script>

<template>
  <div :class="$style.page">
    <header :class="$style.header">
      <h1 :class="$style.title">Widget Market</h1>
      <p :class="$style.subtitle">
        Browse all registered widgets, {{ allWidgets.length }} total
      </p>
    </header>

    <div :class="$style.toolbar">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search by name / type / description..."
        :class="$style.search"
      />
      <div :class="$style.groupTabs">
        <button
          v-for="g in groups"
          :key="g"
          :class="[$style.groupTab, activeGroup === g && $style.groupTabActive]"
          @click="activeGroup = g"
        >
          {{ GROUP_LABELS[g] ?? g }}
          <span v-if="g !== 'all'" :class="$style.groupCount">{{ groupStats[g] ?? 0 }}</span>
        </button>
      </div>
    </div>

    <div :class="$style.grid">
      <div v-for="w in filteredWidgets" :key="w.type" :class="$style.card">
        <div :class="$style.cardHeader">
          <AppIcon :name="w.config?.icon ?? 'setting'" :size="20" :class="$style.cardIcon" />
          <span :class="$style.cardName">{{ w.displayName }}</span>
          <span :class="$style.cardTag">{{ GROUP_LABELS[w.group] ?? w.group }}</span>
        </div>
        <p :class="$style.cardDesc">{{ w.config?.description ?? "—" }}</p>
        <div :class="$style.cardMeta">
          <span :class="$style.metaType">{{ w.type }}</span>
          <span :class="$style.metaComponent">{{ w.name }}</span>
        </div>
      </div>
    </div>

    <div v-if="!filteredWidgets.length" :class="$style.empty">
      No matching widgets found
    </div>
  </div>
</template>

<style module lang="scss">
.page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}
.header {
  margin-bottom: 20px;
}
.title {
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary, #303133);
  margin: 0 0 4px;
}
.subtitle {
  font-size: 14px;
  color: var(--el-text-color-secondary, #909399);
  margin: 0;
}
.toolbar {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.search {
  flex: 1;
  min-width: 240px;
  padding: 8px 12px;
  border: 1px solid var(--el-border-color, #dcdfe6);
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  &:focus {
    border-color: var(--el-color-primary, #409eff);
  }
}
.groupTabs {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.groupTab {
  padding: 6px 12px;
  border: 1px solid var(--el-border-color, #dcdfe6);
  border-radius: 16px;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  color: var(--el-text-color-regular, #606266);
  transition: all 0.2s;
  &:hover {
    border-color: var(--el-color-primary, #409eff);
    color: var(--el-color-primary, #409eff);
  }
}
.groupTabActive {
  background: var(--el-color-primary, #409eff);
  border-color: var(--el-color-primary, #409eff);
  color: #fff;
}
.groupCount {
  margin-left: 4px;
  font-size: 11px;
  opacity: 0.7;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.card {
  padding: 16px;
  border: 1px solid var(--el-border-color-lighter, #e4e7ed);
  border-radius: 8px;
  background: var(--el-bg-color, #fff);
  transition: box-shadow 0.2s;
  &:hover {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  }
}
.cardHeader {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.cardIcon {
  color: var(--el-color-primary, #409eff);
  flex-shrink: 0;
}
.cardName {
  font-weight: 500;
  font-size: 15px;
  color: var(--el-text-color-primary, #303133);
  flex: 1;
}
.cardTag {
  padding: 2px 8px;
  border-radius: 10px;
  background: var(--el-fill-color-light, #f5f7fa);
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
}
.cardDesc {
  font-size: 13px;
  color: var(--el-text-color-secondary, #909399);
  line-height: 1.5;
  margin: 0 0 10px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.cardMeta {
  display: flex;
  gap: 8px;
  font-size: 12px;
  font-family: monospace;
}
.metaType {
  color: var(--el-color-primary, #409eff);
}
.metaComponent {
  color: var(--el-text-color-secondary, #909399);
}
.empty {
  text-align: center;
  padding: 60px 0;
  color: var(--el-text-color-secondary, #909399);
  font-size: 14px;
}
</style>
