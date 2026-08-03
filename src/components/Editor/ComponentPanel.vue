<script setup lang="ts">
/**
 * ComponentPanel — 左侧组件面板（手风琴折叠）
 *
 * 从 widget registry 读取已注册组件，按分组折叠展示。
 * 拖拽 dataTransfer 中携带 SchemaType 字符串。
 * 支持拼音首字母搜索、匹配高亮、200ms 防抖。
 * 使用虚拟滚动优化大量组件时的性能。
 */
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { pinyin } from "pinyin-pro";
import { Search } from "@element-plus/icons-vue";
import {
  getWidgetsByGroup,
  getWidgetDisplayName,
  type WidgetRegistryItem,
} from "@/widgets/registry";
import type { SchemaType } from "@/widgets/base/types";
import { useBoardStore } from "@/stores/board";
import { useI18n } from "@schema-platform/platform-shared";
import styles from "./ComponentPanel.module.scss";
import AppIcon from "@schema-platform/platform-shared/components/common/AppIcon.vue";

// 部件类型图标映射
const TYPE_ICONS: Record<string, string> = {
  form: "document",
  card: "notebook",
  tabs: "menu",
  dialog: "chat-dot-round",
  "single-col": "grid",
  "double-col": "grid",
  "triple-col": "grid",
  "quad-col": "grid",
  "row-container": "grid",
  input: "edit",
  select: "arrow-down",
  number: "sort",
  radio: "circle-check",
  checkbox: "check",
  date: "calendar",
  textarea: "edit-pen",
  title: "document",
  divider: "minus",
  spacer: "rank",
  "toolbar-buttons": "set-up",
  table: "grid",
  button: "pointer",
  // 图表部件
  "bar-chart": "data-board",
  "stacked-bar-chart": "data-board",
  "horizontal-bar-chart": "data-board",
  "line-chart": "trend-charts",
  "area-chart": "trend-charts",
  "pie-chart": "pie-chart",
  "donut-chart": "pie-chart",
  "scatter-chart": "aim",
  "bubble-chart": "aim",
  gauge: "odometer",
  "multi-gauge": "odometer",
  funnel: "sort",
  "compare-funnel": "sort",
  heatmap: "grid",
  radar: "cpu",
  "filled-radar": "cpu",
  candlestick: "data-line",
};

function getIcon(type: string): string {
  return TYPE_ICONS[type] ?? "document";
}

interface ComponentGroup {
  label: string;
  key: string;
  items: WidgetRegistryItem[];
}

const boardStore = useBoardStore();
const { t } = useI18n();

/** 获取翻译后的 Widget 显示名称 */
function getDisplayName(item: WidgetRegistryItem): string {
  return getWidgetDisplayName(item.type, t);
}

const GROUP_LABELS = computed(() => ({
  layout: t("editor.componentPanel.groupLayout"),
  container: t("editor.componentPanel.groupContainer"),
  form: t("editor.componentPanel.groupForm"),
  table: t("editor.componentPanel.groupTable"),
  chart: t("editor.componentPanel.groupChart"),
  static: t("editor.componentPanel.groupStatic"),
  action: t("editor.componentPanel.groupAction"),
  business: t("editor.componentPanel.groupBusiness"),
}));

const allGroups = computed<ComponentGroup[]>(() => {
  const currentMode = boardStore.layoutMode;
  const groups: ComponentGroup[] = [];
  for (const [key, label] of Object.entries(GROUP_LABELS.value)) {
    const items = getWidgetsByGroup(key as WidgetRegistryItem["group"]).filter(
      (item) => !item.availableIn || item.availableIn.includes(currentMode),
    );
    if (items.length > 0) {
      groups.push({ label, key, items });
    }
  }
  return groups;
});

const searchInput = ref("");
const searchQuery = ref("");
const expandedGroups = ref<Set<string>>(
  new Set(allGroups.value.map((g) => g.key)),
);

// 200ms 防抖
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
watch(searchInput, (val) => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    searchQuery.value = val;
  }, 200);
});

/** 获取拼音首字母（小写） */
function getPinyinInitials(text: string): string {
  return pinyin(text, { pattern: "first", toneType: "none", type: "array" })
    .join("")
    .toLowerCase();
}

/** 获取全拼（无空格，小写） */
function getPinyinFull(text: string): string {
  return pinyin(text, { toneType: "none", type: "array" })
    .join("")
    .toLowerCase();
}

interface MatchResult {
  matched: boolean;
  matchedIn: "displayName" | "name" | "pinyin";
}

/** 判断 item 是否匹配查询 */
function matchItem(item: WidgetRegistryItem, q: string): MatchResult {
  const displayName = getDisplayName(item).toLowerCase();
  const name = item.name.toLowerCase();

  if (displayName.includes(q) || name.includes(q)) {
    return { matched: true, matchedIn: "displayName" };
  }

  // 拼音首字母匹配
  const initials = getPinyinInitials(getDisplayName(item));
  if (initials.includes(q)) {
    return { matched: true, matchedIn: "pinyin" };
  }

  // 全拼匹配
  const fullPinyin = getPinyinFull(getDisplayName(item));
  if (fullPinyin.includes(q)) {
    return { matched: true, matchedIn: "pinyin" };
  }

  return { matched: false, matchedIn: "displayName" };
}

const filteredGroups = computed(() => {
  if (!searchQuery.value) return allGroups.value;
  const q = searchQuery.value.toLowerCase();
  return allGroups.value
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => matchItem(item, q).matched),
    }))
    .filter((g) => g.items.length > 0);
});

/** 高亮匹配文字 */
function highlightText(text: string): string {
  if (!searchQuery.value) return escapeHtml(text);
  const q = searchQuery.value.toLowerCase();
  const lowerText = text.toLowerCase();
  const idx = lowerText.indexOf(q);
  if (idx === -1) return escapeHtml(text);
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + q.length);
  const after = text.slice(idx + q.length);
  return `${escapeHtml(before)}<em class="${styles.highlight}">${escapeHtml(match)}</em>${escapeHtml(after)}`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toggleGroup(key: string) {
  if (expandedGroups.value.has(key)) {
    expandedGroups.value.delete(key);
  } else {
    expandedGroups.value.add(key);
  }
}

function handleDragStart(
  event: DragEvent,
  type: SchemaType,
  displayName: string,
) {
  event.dataTransfer?.setData("schema-type", type);
  event.dataTransfer?.setData(
    "application/schema-drag",
    JSON.stringify({ source: "panel", type }),
  );
  event.dataTransfer!.effectAllowed = "copy";

  // 创建拖拽预览 ghost 元素
  const ghost = document.createElement("div");
  ghost.textContent = displayName;
  ghost.style.cssText = `
    padding: 6px 14px;
    background: var(--el-color-primary);
    color: white;
    font-size: 12px;
    font-weight: 500;
    border-radius: 6px;
    white-space: nowrap;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    pointer-events: none;
    position: absolute;
    top: -1000px;
    left: -1000px;
  `;
  document.body.appendChild(ghost);
  event.dataTransfer!.setDragImage(
    ghost,
    ghost.offsetWidth / 2,
    ghost.offsetHeight / 2,
  );
  // 拖拽结束后清理 ghost 元素（延迟确保浏览器完成拖拽预览渲染）
  setTimeout(() => ghost.remove(), 500);
}

// ============================================================
// 虚拟滚动相关逻辑
// ============================================================

/** 部件行高度（含 padding；与 .item min-height 对齐） */
const ITEM_ROW_HEIGHT = 42;
/** 分组标题行高度 */
const HEADER_ROW_HEIGHT = 36;
/** 与 .virtualContent gap 一致 */
const ROW_GAP = 6;
/** 缓冲区行数 */
const BUFFER_ROWS = 3;

const scrollContainerRef = ref<HTMLElement | null>(null);
const containerHeight = ref(0);
const scrollTop = ref(0);

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  if (scrollContainerRef.value) {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        containerHeight.value = entry.contentRect.height;
      }
    });
    resizeObserver.observe(scrollContainerRef.value);
  }
});

onUnmounted(() => {
  resizeObserver?.disconnect();
});

interface FlatItem {
  type: "header" | "item";
  groupKey: string;
  item?: WidgetRegistryItem;
  label?: string;
  count?: number;
}

const flatList = computed<FlatItem[]>(() => {
  const result: FlatItem[] = [];
  for (const group of filteredGroups.value) {
    result.push({
      type: "header",
      groupKey: group.key,
      label: group.label,
      count: group.items.length,
    });
    if (expandedGroups.value.has(group.key)) {
      for (const item of group.items) {
        result.push({
          type: "item",
          groupKey: group.key,
          item,
        });
      }
    }
  }
  return result;
});

/**
 * 将扁平列表折叠为网格行（header 独占一行；item 两列一行），
 * 高度含 row gap，避免总高度偏小导致滚不到底部。
 */
interface LayoutRow {
  startIndex: number;
  endIndex: number;
  height: number;
  top: number;
}

const layoutRows = computed<LayoutRow[]>(() => {
  const rows: LayoutRow[] = [];
  const list = flatList.value;
  let i = 0;
  let top = 0;
  while (i < list.length) {
    if (list[i].type === "header") {
      rows.push({
        startIndex: i,
        endIndex: i,
        height: HEADER_ROW_HEIGHT,
        top,
      });
      top += HEADER_ROW_HEIGHT + ROW_GAP;
      i += 1;
      continue;
    }
    const startIndex = i;
    i += 1;
    if (i < list.length && list[i].type === "item") {
      i += 1;
    }
    rows.push({
      startIndex,
      endIndex: i - 1,
      height: ITEM_ROW_HEIGHT,
      top,
    });
    top += ITEM_ROW_HEIGHT + ROW_GAP;
  }
  return rows;
});

const totalHeight = computed(() => {
  const rows = layoutRows.value;
  if (rows.length === 0) return 0;
  const last = rows[rows.length - 1];
  // 最后一行不加尾部 gap
  return last.top + last.height;
});

const startRowIndex = computed(() => {
  const rows = layoutRows.value;
  if (rows.length === 0) return 0;
  const idx = rows.findIndex((row) => row.top + row.height > scrollTop.value);
  return Math.max(0, (idx === -1 ? 0 : idx) - BUFFER_ROWS);
});

const endRowIndex = computed(() => {
  const rows = layoutRows.value;
  if (rows.length === 0) return 0;
  const target = scrollTop.value + containerHeight.value;
  let idx = rows.findIndex((row) => row.top >= target);
  if (idx === -1) idx = rows.length - 1;
  return Math.min(rows.length - 1, idx + BUFFER_ROWS);
});

const visibleItems = computed(() => {
  const rows = layoutRows.value;
  if (rows.length === 0) return [];
  const start = rows[startRowIndex.value]?.startIndex ?? 0;
  const end = rows[endRowIndex.value]?.endIndex ?? 0;
  return flatList.value.slice(start, end + 1);
});

const offsetY = computed(() => {
  return layoutRows.value[startRowIndex.value]?.top ?? 0;
});

function handleScroll(e: Event) {
  const target = e.target as HTMLElement;
  scrollTop.value = target.scrollTop;
}

function isGroupExpanded(groupKey: string): boolean {
  return expandedGroups.value.has(groupKey);
}
</script>

<template>
  <div :class="styles.panel">
    <div :class="styles.search">
      <el-input
        v-model="searchInput"
        size="small"
        :placeholder="t('editor.componentPanel.searchPlaceholder')"
        clearable
        :prefix-icon="Search"
      />
    </div>

    <div ref="scrollContainerRef" :class="styles.scroll" @scroll="handleScroll">
      <div
        :class="styles.virtualWrapper"
        :style="{ height: `${totalHeight}px` }"
      >
        <div
          :class="styles.virtualContent"
          :style="{ transform: `translateY(${offsetY}px)` }"
        >
          <template
            v-for="flatItem in visibleItems"
            :key="
              flatItem.type === 'header'
                ? `h-${flatItem.groupKey}`
                : `i-${flatItem.item?.type}-${flatItem.item?.name}`
            "
          >
            <!-- 分组标题 -->
            <div
              v-if="flatItem.type === 'header'"
              :class="styles.groupHeader"
              @click="toggleGroup(flatItem.groupKey)"
            >
              <span :class="styles.arrow">
                <AppIcon
                  v-if="isGroupExpanded(flatItem.groupKey)"
                  name="arrow-down"
                  :size="12"
                />
                <AppIcon v-else name="arrow-right" :size="12" />
              </span>
              <span :class="styles.groupLabel">{{ flatItem.label }}</span>
              <span :class="styles.groupCount">{{ flatItem.count }}</span>
            </div>

            <!-- 组件项 -->
            <div
              v-else-if="flatItem.type === 'item' && flatItem.item"
              :class="styles.item"
              draggable="true"
              @dragstart="
                handleDragStart(
                  $event,
                  flatItem.item!.type,
                  getDisplayName(flatItem.item!),
                )
              "
            >
              <AppIcon
                :name="getIcon(flatItem.item!.type)"
                :size="14"
                :class="styles.itemIcon"
              />
              <span
                :class="styles.itemLabel"
                v-html="
                  searchQuery
                    ? highlightText(getDisplayName(flatItem.item!))
                    : getDisplayName(flatItem.item!)
                "
              />
            </div>
          </template>
        </div>
      </div>

      <div v-if="filteredGroups.length === 0" :class="styles.empty">
        <p :class="styles.emptyText">
          {{ t("editor.componentPanel.emptyText") }}
        </p>
        <p :class="styles.emptyHint">
          {{ t("editor.componentPanel.emptyHint") }}
        </p>
      </div>
    </div>
  </div>
</template>
