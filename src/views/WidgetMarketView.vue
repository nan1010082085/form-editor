<script setup lang="ts">
/**
 * WidgetMarketView — 部件市场浏览页
 *
 * 一屏布局：顶栏固定 + 列表区内滚动 + 底部分页，避免整页无限拉长。
 */
import { ref, computed, watch } from "vue";
import { useI18n } from "@schema-platform/platform-shared";
import {
  getAllWidgets,
  getWidgetDisplayName,
  getWidgetDescription,
} from "@/widgets/registry";
import type { WidgetRegistryItem } from "@/widgets/registry";
import AppIcon from "@schema-platform/platform-shared/components/common/AppIcon.vue";
import EmptyState from "@/components/common/EmptyState.vue";

const { t } = useI18n();
const searchQuery = ref("");
const activeGroup = ref<string>("all");
/** 当前页（从 1 开始） */
const currentPage = ref(1);
/** 每页卡片数：约一屏网格容量 */
const PAGE_SIZE = 12;

const allWidgets = computed<WidgetRegistryItem[]>(() => getAllWidgets());

/**
 * @param group - 分组 key
 */
function groupLabel(group: string): string {
  const key = `editor.componentPanel.group${group.charAt(0).toUpperCase()}${group.slice(1)}`;
  if (group === "all") return t("editor.widgetMarket.groupAll");
  const translated = t(key);
  return translated === key ? group : translated;
}

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
    list = list.filter((w) => {
      const name = getWidgetDisplayName(w.type, t).toLowerCase();
      const desc = getWidgetDescription(w.type, t).toLowerCase();
      return (
        name.includes(q) ||
        w.type.toLowerCase().includes(q) ||
        desc.includes(q)
      );
    });
  }
  return list;
});

const totalFiltered = computed(() => filteredWidgets.value.length);

const pagedWidgets = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE;
  return filteredWidgets.value.slice(start, start + PAGE_SIZE);
});

watch([searchQuery, activeGroup], () => {
  currentPage.value = 1;
});

watch(totalFiltered, (total) => {
  const maxPage = Math.max(1, Math.ceil(total / PAGE_SIZE) || 1);
  if (currentPage.value > maxPage) currentPage.value = maxPage;
});
</script>

<template>
  <div :class="$style.page">
    <header :class="$style.header">
      <h1 :class="$style.title">{{ t("editor.widgetMarket.title") }}</h1>
      <p :class="$style.subtitle">
        {{ t("editor.widgetMarket.subtitle", { count: allWidgets.length }) }}
        <template v-if="totalFiltered !== allWidgets.length">
          ·
          {{
            t("editor.widgetMarket.filteredCount", { count: totalFiltered })
          }}
        </template>
      </p>
    </header>

    <div :class="$style.toolbar">
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="t('editor.widgetMarket.searchPlaceholder')"
        :class="$style.search"
        :aria-label="t('editor.widgetMarket.searchPlaceholder')"
      />
      <div
        :class="$style.groupTabs"
        role="tablist"
        :aria-label="t('editor.widgetMarket.groupAll')"
      >
        <button
          v-for="g in groups"
          :key="g"
          type="button"
          role="tab"
          :aria-selected="activeGroup === g"
          :class="[$style.groupTab, activeGroup === g && $style.groupTabActive]"
          @click="activeGroup = g"
        >
          {{ groupLabel(g) }}
          <span v-if="g !== 'all'" :class="$style.groupCount">{{
            groupStats[g] ?? 0
          }}</span>
        </button>
      </div>
    </div>

    <div :class="$style.listScroll">
      <div v-if="pagedWidgets.length" :class="$style.grid">
        <div v-for="w in pagedWidgets" :key="w.type" :class="$style.card">
          <div :class="$style.cardHeader">
            <AppIcon
              :name="w.config?.icon ?? 'setting'"
              :size="20"
              :class="$style.cardIcon"
            />
            <span :class="$style.cardName">{{
              getWidgetDisplayName(w.type, t)
            }}</span>
            <span :class="$style.cardTag">{{ groupLabel(w.group) }}</span>
          </div>
          <p :class="$style.cardDesc">
            {{ getWidgetDescription(w.type, t) || "—" }}
          </p>
          <div :class="$style.cardMeta">
            <span :class="$style.metaType">{{ w.type }}</span>
            <span :class="$style.metaComponent">{{ w.name }}</span>
          </div>
        </div>
      </div>

      <EmptyState
        v-else
        icon="search"
        :title="t('editor.widgetMarket.empty')"
      />
    </div>

    <footer v-if="totalFiltered > 0" :class="$style.pagination">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="PAGE_SIZE"
        :total="totalFiltered"
        layout="total, prev, pager, next"
        background
      />
    </footer>
  </div>
</template>

<style module lang="scss">
.page {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  height: 100%;
  max-height: 100%;
  overflow: hidden;
  padding: 24px 32px 16px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.header {
  flex-shrink: 0;
  margin-bottom: 16px;
}

.title {
  font-size: 22px;
  font-weight: 600;
  color: var(--text-color-title);
  margin: 0 0 6px;
}

.subtitle {
  font-size: 13px;
  color: var(--text-color-regular, #606266);
  margin: 0;
}

.toolbar {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.search {
  width: 100%;
  max-width: 360px;
  height: 36px;
  padding: 0 12px;
  border: 1px solid var(--border-color-base);
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  background: var(--bg-color-white);

  &:focus {
    border-color: var(--color-primary);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
}

.groupTabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.groupTab {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 10px;
  border: 1px solid var(--border-color-light);
  border-radius: 14px;
  background: var(--bg-color-white);
  font-size: 12px;
  color: var(--text-color-regular);
  cursor: pointer;

  &:hover {
    border-color: var(--color-primary-lighter);
    color: var(--color-primary);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
}

.groupTabActive {
  background: var(--color-primary-lighter);
  border-color: var(--color-primary);
  color: var(--color-primary);
  font-weight: 500;
}

.groupCount {
  font-size: 11px;
  opacity: 0.7;
}

/** 一屏内滚动的列表区 */
.listScroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding-right: 4px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
  padding-bottom: 8px;
}

.card {
  padding: 14px;
  border: 1px solid var(--border-color-lighter);
  border-radius: 8px;
  background: var(--bg-color-white);
}

.cardHeader {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.cardIcon {
  color: var(--color-primary);
  flex-shrink: 0;
}

.cardName {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color-title);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cardTag {
  font-size: 11px;
  color: var(--text-color-regular, #606266);
  background: var(--bg-color-gray);
  padding: 2px 6px;
  border-radius: 4px;
  flex-shrink: 0;
}

.cardDesc {
  font-size: 12px;
  color: var(--text-color-regular, #606266);
  margin: 0 0 10px;
  line-height: 1.5;
  min-height: 36px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.cardMeta {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 11px;
  color: var(--text-color-regular, #606266);
}

.metaType,
.metaComponent {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pagination {
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  padding-top: 12px;
  border-top: 1px solid var(--border-color-lighter);
  margin-top: 8px;
}
</style>
