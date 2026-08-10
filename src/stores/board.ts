/**
 * useBoardStore — 实例Info和画布Config
 *
 * 职责：
 * - 画布实例元Data（id, name, status）
 * - 画布Config（宽高、Background、Padding、缩放）
 * - 顶层变量集合
 * - 顶层Event集合
 *
 * 变化频率低, 与 Widget Data解耦。
 */
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type {
  CanvasConfig,
  BoardVariable,
  BoardEvent,
  BoardPage,
} from "../widgets/base/types";

/** 统一缩放阈Value, EditorViewToolbar 和 setZoom 共用 */
export const MIN_ZOOM = 50;
export const MAX_ZOOM = 200;

export const useBoardStore = defineStore("board", () => {
  // ================================================================
  // 实例Info
  // ================================================================

  const id = ref("");
  const name = ref("");
  const status = ref<"draft" | "published">("draft");

  // ================================================================
  // 画布Config
  // ================================================================

  const canvas = ref<CanvasConfig>({
    width: 1920,
    height: 1080,
    widthUnit: "px",
    heightUnit: "px",
    backgroundColor: "var(--bg-color-gray)",
    padding: "0px",
    zoom: 100,
    layoutMode: "free",
    freeLayout: { contentAlign: "left", marginX: "0" },
  });

  /** 当前Layout模式（响应式） */
  const layoutMode = computed(() => canvas.value.layoutMode ?? "free");

  /** 画布实际像素尺寸（百Min比模式需基于父Container计算） */
  const canvasPixelSize = ref({ width: 1920, height: 1080 });

  function setCanvasPixelSize(width: number, height: number) {
    canvasPixelSize.value = { width, height };
  }

  function getCanvasWidthPx(): number {
    return canvasPixelSize.value.width;
  }

  function getCanvasHeightPx(): number {
    return canvasPixelSize.value.height;
  }

  // ================================================================
  // 顶层变量集合
  // ================================================================

  const variables = ref<BoardVariable[]>([]);

  // ================================================================
  // 顶层Event集合
  // ================================================================

  const events = ref<BoardEvent[]>([]);

  // ================================================================
  // 画布ConfigAction
  // ================================================================

  function updateCanvas(patch: Partial<CanvasConfig>): void {
    Object.assign(canvas.value, patch);
  }

  function setZoom(zoom: number): void {
    canvas.value.zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
  }

  // ================================================================
  // 变量Action
  // ================================================================

  function addVariable(variable: BoardVariable): void {
    variables.value.push(variable);
  }

  function removeVariable(name: string): void {
    const idx = variables.value.findIndex((v) => v.name === name);
    if (idx >= 0) {
      variables.value.splice(idx, 1);
    }
  }

  function updateVariable(name: string, patch: Partial<BoardVariable>): void {
    const idx = variables.value.findIndex((v) => v.name === name);
    if (idx >= 0) {
      variables.value[idx] = { ...variables.value[idx], ...patch };
    }
  }

  // ================================================================
  // EventAction
  // ================================================================

  function addEvent(event: BoardEvent): void {
    events.value.push(event);
  }

  function removeEvent(index: number): void {
    if (index >= 0 && index < events.value.length) {
      events.value.splice(index, 1);
    }
  }

  function updateEvent(index: number, patch: Partial<BoardEvent>): void {
    if (index >= 0 && index < events.value.length) {
      events.value[index] = { ...events.value[index], ...patch };
    }
  }

  // ================================================================
  // 多Page支持
  // ================================================================

  const pages = ref<BoardPage[]>([]);
  const currentPageId = ref("");

  /** 当前Page（无PageHrs返回 null） */
  const currentPage = computed<BoardPage | null>(() => {
    if (pages.value.length === 0) return null;
    return (
      pages.value.find((p) => p.id === currentPageId.value) ??
      pages.value[0] ??
      null
    );
  });

  /** 是否处于多Page模式 */
  const isMultiPage = computed(() => pages.value.length > 0);

  function addPage(page: BoardPage): void {
    pages.value.push(page);
    currentPageId.value = page.id;
  }

  function removePage(pageId: string): void {
    const idx = pages.value.findIndex((p) => p.id === pageId);
    if (idx < 0) return;
    pages.value.splice(idx, 1);
    if (currentPageId.value === pageId) {
      currentPageId.value = pages.value[0]?.id ?? "";
    }
  }

  function switchPage(pageId: string): void {
    if (pages.value.some((p) => p.id === pageId)) {
      currentPageId.value = pageId;
    }
  }

  function renamePage(pageId: string, name: string): void {
    const page = pages.value.find((p) => p.id === pageId);
    if (page) page.name = name;
  }

  function updatePageCanvas(
    pageId: string,
    patch: Partial<CanvasConfig>,
  ): void {
    const page = pages.value.find((p) => p.id === pageId);
    if (page) {
      page.canvas = { ...page.canvas, ...patch };
    }
  }

  // ================================================================
  // 批量初始化（从 API 加载Hrs使用）
  // ================================================================

  function loadBoard(data: {
    id: string;
    name: string;
    status: "draft" | "published";
    canvas?: Partial<CanvasConfig>;
    variables?: BoardVariable[];
    events?: BoardEvent[];
    pages?: BoardPage[];
    currentPageId?: string;
  }): void {
    id.value = data.id;
    name.value = data.name;
    status.value = data.status;
    if (data.canvas) {
      Object.assign(canvas.value, data.canvas);
    }
    if (data.variables) {
      variables.value = data.variables;
    }
    if (data.events) {
      events.value = data.events;
    }
    if (data.pages && data.pages.length > 0) {
      pages.value = data.pages;
      currentPageId.value = data.currentPageId ?? data.pages[0].id;
    } else {
      pages.value = [];
      currentPageId.value = "";
    }
  }

  // ================================================================
  // Export
  // ================================================================

  return {
    // 实例Info
    id,
    name,
    status,
    // 画布Config
    canvas,
    layoutMode,
    // 变量
    variables,
    // Event
    events,
    // 画布ConfigAction
    updateCanvas,
    setZoom,
    setCanvasPixelSize,
    getCanvasWidthPx,
    getCanvasHeightPx,
    // 变量Action
    addVariable,
    removeVariable,
    updateVariable,
    // EventAction
    addEvent,
    removeEvent,
    updateEvent,
    // 多Page
    pages,
    currentPageId,
    currentPage,
    isMultiPage,
    addPage,
    removePage,
    switchPage,
    renamePage,
    updatePageCanvas,
    // 批量初始化
    loadBoard,
  };
});
