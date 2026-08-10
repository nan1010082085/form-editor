/**
 * useEditorStore — Edit器交互Status
 *
 * 职责：
 * - 选中Status（单选/多选）
 * - Edit器模式（edit/preview/publish-interactive/publish-readonly）
 * - Undo/Redo历史（immer patches, 主画布 + DialogEdit器）
 * - 剪贴板
 * - DialogEdit器Status
 */
import { defineStore } from "pinia";
import { ref, computed, shallowRef, toRaw } from "vue";
import { produce, enablePatches, applyPatches, type Patch } from "immer";
import type { Widget } from "../widgets/base/types";
import type { InteractionMode } from "../composables/useConstant";
import { useWidgetStore } from "./widget";
import { MAX_HISTORY_SIZE } from "../composables/useConstant";
import { reportTelemetry } from "../api/telemetryApi";

enablePatches();

/**
 * 深解包 Vue reactive/proxy, 得到与响应式系统断开的纯对象树。
 * 浅 toRaw 不够：children / style / props 等嵌套 proxy 仍会指向 live store。
 */
function deepToRaw<T>(value: T): T {
  const raw = toRaw(value as object) as T;
  if (Array.isArray(raw)) {
    return raw.map((item) => deepToRaw(item)) as T;
  }
  if (raw !== null && typeof raw === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(raw as object)) {
      out[key] = deepToRaw((raw as Record<string, unknown>)[key]);
    }
    return out as T;
  }
  return raw;
}

/**
 * 深拷贝 Widget 树, 与 live store 无共享引用。
 * 禁止 `produce(live, () => liveWidgets)`：immer autoFreeze 会就地冻结画布对象, 
 * 导致后续 children.splice / Object.assign 抛出 "object is not extensible"。
 */
function cloneWidgets(widgets: Widget[]): Widget[] {
  return structuredClone(deepToRaw(widgets));
}

const MAX_HISTORY = MAX_HISTORY_SIZE;

interface HistoryEntry {
  patches: Patch[];
  inversePatches: Patch[];
}

export const useEditorStore = defineStore("editor", () => {
  const selectedId = ref<string | null>(null);
  const selectedIds = ref<string[]>([]);

  const mode = ref<InteractionMode>("edit");

  const showZoomIndicator = ref(true);
  function toggleZoomIndicator() {
    showZoomIndicator.value = !showZoomIndicator.value;
  }

  const baseState = shallowRef<Widget[]>([]);
  const history = shallowRef<HistoryEntry[]>([]);
  const historyIndex = ref(-1);

  const canUndo = computed(() => historyIndex.value > 0);
  const canRedo = computed(() => historyIndex.value < history.value.length - 1);

  const editingDialogId = ref<string | null>(null);
  const dialogBaseState = shallowRef<Widget[]>([]);
  const dialogHistory = shallowRef<HistoryEntry[]>([]);
  const dialogHistoryIndex = ref(-1);

  const canUndoDialog = computed(() => dialogHistoryIndex.value > 0);
  const canRedoDialog = computed(
    () => dialogHistoryIndex.value < dialogHistory.value.length - 1,
  );

  const clipboard = ref<Widget | null>(null);

  const isDirty = ref(false);
  const savedHistoryIndex = ref(-1);

  function markDirty(): void {
    isDirty.value = true;
  }

  function markClean(): void {
    isDirty.value = false;
    savedHistoryIndex.value = historyIndex.value;
  }

  type ConfigDialogType =
    | "events"
    | "linkages"
    | "api"
    | "variables"
    | "chart-linkages";
  const configDialogTrigger = ref<{
    widget: Widget;
    type: ConfigDialogType;
  } | null>(null);

  /**
   * OpenConfig弹框（右键Menu等入口）。
   * 先选中目标 widget, 避免多选/错位Hrs写回Error对象。
   */
  function openConfigDialog(widget: Widget, type: ConfigDialogType) {
    select(widget.id);
    configDialogTrigger.value = { widget, type };
  }

  function clearConfigDialogTrigger() {
    configDialogTrigger.value = null;
  }

  function select(id: string | null): void {
    selectedId.value = id;
    selectedIds.value = id ? [id] : [];
  }

  function toggleSelect(id: string): void {
    const idx = selectedIds.value.indexOf(id);
    if (idx >= 0) {
      selectedIds.value.splice(idx, 1);
      selectedId.value =
        selectedIds.value[selectedIds.value.length - 1] ?? null;
    } else {
      selectedIds.value.push(id);
      selectedId.value = id;
    }
  }

  function clearSelection(): void {
    selectedId.value = null;
    selectedIds.value = [];
  }

  function getStateAt(
    index: number,
    entries: HistoryEntry[],
    base: Widget[],
  ): Widget[] {
    let state = base;
    for (let i = 1; i <= index; i++) {
      state = applyPatches(state, entries[i].patches);
    }
    return state;
  }

  function resetHistory(widgets: Widget[]): void {
    baseState.value = cloneWidgets(widgets);
    history.value = [{ patches: [], inversePatches: [] }];
    historyIndex.value = 0;
    savedHistoryIndex.value = 0;
    isDirty.value = false;
  }

  function pushHistory(widgets: Widget[]): void {
    if (historyIndex.value < 0) {
      resetHistory(widgets);
      markDirty();
      return;
    }

    const current = getStateAt(
      historyIndex.value,
      history.value,
      baseState.value,
    );

    let entry: HistoryEntry = { patches: [], inversePatches: [] };
    // 必须返回深拷贝：直接返回 live widgets 会被 immer 冻结, 污染画布可变性
    produce(
      current,
      () => cloneWidgets(widgets),
      (patches, inversePatches) => {
        entry = { patches, inversePatches };
      },
    );

    if (entry.patches.length === 0) return;

    let newHistory = history.value.slice(0, historyIndex.value + 1);
    newHistory.push(entry);
    if (newHistory.length > MAX_HISTORY + 1) {
      const removed = newHistory.length - (MAX_HISTORY + 1);
      baseState.value = getStateAt(removed, newHistory, baseState.value);
      newHistory = [
        { patches: [], inversePatches: [] },
        ...newHistory.slice(removed + 1),
      ];
      historyIndex.value -= removed;
      if (savedHistoryIndex.value >= 0) {
        savedHistoryIndex.value = Math.max(
          0,
          savedHistoryIndex.value - removed,
        );
      }
    }
    history.value = newHistory;
    historyIndex.value = newHistory.length - 1;
    markDirty();
  }

  function undo(): Widget[] | null {
    if (historyIndex.value <= 0) return null;
    const current = getStateAt(
      historyIndex.value,
      history.value,
      baseState.value,
    );
    const entry = history.value[historyIndex.value];
    historyIndex.value--;
    isDirty.value = historyIndex.value !== savedHistoryIndex.value;
    void reportTelemetry("undo");
    // applyPatches 结果默认被 immer 冻结, 写回 store 前再拷一份可变树
    return cloneWidgets(applyPatches(current, entry.inversePatches));
  }

  function redo(): Widget[] | null {
    if (historyIndex.value >= history.value.length - 1) return null;
    historyIndex.value++;
    isDirty.value = historyIndex.value !== savedHistoryIndex.value;
    void reportTelemetry("redo");
    return cloneWidgets(
      getStateAt(historyIndex.value, history.value, baseState.value),
    );
  }

  function copy(widget: Widget): void {
    clipboard.value = cloneWidgets([widget])[0];
  }

  function paste(): Widget | null {
    if (!clipboard.value) return null;
    return cloneWidgets([clipboard.value])[0];
  }

  function setMode(newMode: InteractionMode): void {
    mode.value = newMode;
  }

  function openDialogEditor(id: string): void {
    editingDialogId.value = id;
    dialogBaseState.value = [];
    dialogHistory.value = [];
    dialogHistoryIndex.value = -1;
  }

  function closeDialogEditor(): void {
    editingDialogId.value = null;
    dialogBaseState.value = [];
    dialogHistory.value = [];
    dialogHistoryIndex.value = -1;
  }

  function pushDialogHistory(widgets: Widget[]): void {
    const current =
      dialogHistoryIndex.value < 0
        ? widgets
        : getStateAt(
            dialogHistoryIndex.value,
            dialogHistory.value,
            dialogBaseState.value,
          );

    let entry: HistoryEntry = { patches: [], inversePatches: [] };
    produce(
      current,
      () => cloneWidgets(widgets),
      (patches, inversePatches) => {
        entry = { patches, inversePatches };
      },
    );

    if (dialogHistoryIndex.value < 0) {
      dialogBaseState.value = cloneWidgets(current);
      dialogHistory.value = [{ patches: [], inversePatches: [] }, entry];
      dialogHistoryIndex.value = 1;
    } else {
      let newHistory = dialogHistory.value.slice(
        0,
        dialogHistoryIndex.value + 1,
      );
      newHistory.push(entry);
      if (newHistory.length > MAX_HISTORY + 1) {
        const removed = newHistory.length - (MAX_HISTORY + 1);
        dialogBaseState.value = getStateAt(
          removed,
          newHistory,
          dialogBaseState.value,
        );
        newHistory = [
          { patches: [], inversePatches: [] },
          ...newHistory.slice(removed + 1),
        ];
        dialogHistoryIndex.value -= removed;
      }
      dialogHistory.value = newHistory;
      dialogHistoryIndex.value = newHistory.length - 1;
    }
  }

  function undoDialog(): Widget[] | null {
    if (dialogHistoryIndex.value <= 0) return null;
    const current = getStateAt(
      dialogHistoryIndex.value,
      dialogHistory.value,
      dialogBaseState.value,
    );
    const entry = dialogHistory.value[dialogHistoryIndex.value];
    dialogHistoryIndex.value--;
    return cloneWidgets(applyPatches(current, entry.inversePatches));
  }

  function redoDialog(): Widget[] | null {
    if (dialogHistoryIndex.value >= dialogHistory.value.length - 1) return null;
    dialogHistoryIndex.value++;
    return cloneWidgets(
      getStateAt(
        dialogHistoryIndex.value,
        dialogHistory.value,
        dialogBaseState.value,
      ),
    );
  }

  function performUndo(): void {
    const widgetStore = useWidgetStore();
    const snapshot = undo();
    if (snapshot) widgetStore.widgets = snapshot;
  }

  function performRedo(): void {
    const widgetStore = useWidgetStore();
    const snapshot = redo();
    if (snapshot) widgetStore.widgets = snapshot;
  }

  function performCopyWidget(): void {
    const widgetStore = useWidgetStore();
    const widget = widgetStore.findWidget(selectedId.value ?? "");
    if (widget) {
      copy(widget);
      void reportTelemetry("copy");
    }
  }

  function performDeleteWidget(): void {
    if (!selectedIds.value.length) return;
    const widgetStore = useWidgetStore();
    const count = selectedIds.value.length;
    for (const id of [...selectedIds.value]) {
      widgetStore.removeWidget(id);
    }
    clearSelection();
    pushHistory([...widgetStore.widgets]);
    void reportTelemetry("delete", {
      props: { widgetCount: count, source: "canvas" },
    });
  }

  /**
   * 键盘上Move down：在同级 siblings 内前移/后移选中Widget（grid 流式重排, free 也可用）。
   * 仅对单选生效；多选Hrs不Action（避免乱序）。
   *
   * moveWidgetToIndex 的 toIndex 语义为「原数组目标位置」, 同父后移Hrs内部会 -1 补偿提取位移, 
   * 故 down 传 curIdx+2（-1 后落到 curIdx+1）, up 传 curIdx-1（fromIdx>target 不Trigger -1）。
   */
  function performMoveSelected(direction: "up" | "down"): void {
    if (selectedIds.value.length !== 1) return;
    const id = selectedId.value;
    if (!id) return;
    const widgetStore = useWidgetStore();
    const parent = widgetStore.findParent(id);
    const parentId = parent?.id ?? null;
    const siblings = parent?.children ?? widgetStore.widgets;
    const curIdx = siblings.findIndex((w) => w.id === id);
    if (curIdx < 0) return;
    if (direction === "up") {
      if (curIdx === 0) return;
      widgetStore.moveWidgetToIndex(id, parentId, curIdx - 1);
    } else {
      if (curIdx >= siblings.length - 1) return;
      widgetStore.moveWidgetToIndex(id, parentId, curIdx + 2);
    }
    pushHistory([...widgetStore.widgets]);
  }

  return {
    selectedId,
    selectedIds,
    mode,
    showZoomIndicator,
    toggleZoomIndicator,
    history,
    historyIndex,
    canUndo,
    canRedo,
    editingDialogId,
    dialogHistory,
    dialogHistoryIndex,
    canUndoDialog,
    canRedoDialog,
    clipboard,
    isDirty,
    markDirty,
    markClean,
    configDialogTrigger,
    openConfigDialog,
    clearConfigDialogTrigger,
    select,
    toggleSelect,
    clearSelection,
    resetHistory,
    pushHistory,
    undo,
    redo,
    copy,
    paste,
    setMode,
    openDialogEditor,
    closeDialogEditor,
    pushDialogHistory,
    undoDialog,
    redoDialog,
    performUndo,
    performRedo,
    performCopyWidget,
    performDeleteWidget,
    performMoveSelected,
  };
});
