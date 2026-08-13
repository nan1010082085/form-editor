/**
 * useSchemaVersionStore — Schema Version管理Status
 *
 * 职责：
 * - VersionColumn表的获取与Min页
 * - VersionDetails加载
 * - 两个Version间的 diff 计算
 * - VersionRollback
 *
 * 设计原则：
 * - 纯Version管理, 不持有画布Status
 * - AsyncAction用 loading/error 模式管理
 * - 与 apiClient 解耦：调用 apiClient 中已有的Version API
 */
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { VersionEntry, SchemaDetail } from "@/types/api";
import type { DiffResult } from "@/utils/schemaDiff";
import { resolveApiErrorMessage } from "@/utils/resolveApiErrorMessage";
import {
  fetchVersions as apiFetchVersions,
  fetchVersion as apiFetchVersion,
  deleteVersion as apiDeleteVersion,
} from "@/utils/apiClient";
import { diffSchema, getDiffSummary } from "@/utils/schemaDiff";
import { parseSchemaJson } from "@/utils/parseSchemaJson";
import { DEFAULT_PAGE_SIZE } from "@schema-platform/platform-shared/utils/pagination";

export const useSchemaVersionStore = defineStore("schemaVersion", () => {
  // ================================================================
  // Status
  // ================================================================

  /** VersionColumn表 */
  const versions = ref<VersionEntry[]>([]);

  /** 当前Version号 */
  const currentVersion = ref("");

  /** editId — VersionQuery主键 */
  const editId = ref("");

  /** Loading标志 */
  const loading = ref(false);

  /** 最近一次ErrorInfo */
  const error = ref("");

  /** Min页 */
  const page = ref(1);
  const pageSize = ref(DEFAULT_PAGE_SIZE);
  const total = ref(0);

  /** 选中Compare的两个Version */
  const compareLeft = ref<string>("");
  const compareRight = ref<string>("");

  /** Compare的两个VersionDetails */
  const leftDetail = ref<SchemaDetail | null>(null);
  const rightDetail = ref<SchemaDetail | null>(null);

  /** diff 结果 */
  const diffResult = ref<DiffResult | null>(null);

  /** CompareDetailsLoading */
  const compareLoading = ref(false);

  // ================================================================
  // 计算Property
  // ================================================================

  const hasVersions = computed(() => versions.value.length > 0);

  const isEmpty = computed(() => !loading.value && versions.value.length === 0);

  const hasError = computed(() => error.value !== "");

  /** 是否已选中两个Version */
  const canCompare = computed(
    () => !!compareLeft.value && !!compareRight.value,
  );

  /** diff 摘要 */
  const diffSummary = computed(() => {
    if (!diffResult.value) return "";
    return getDiffSummary(diffResult.value);
  });

  /** 是否有差异 */
  const hasDiff = computed(() => {
    if (!diffResult.value) return false;
    const { added, removed, modified, moved } = diffResult.value;
    return (
      added.length > 0 ||
      removed.length > 0 ||
      modified.length > 0 ||
      moved.length > 0
    );
  });

  // ================================================================
  // 内部工具
  // ================================================================

  function setError(message: string): void {
    error.value = message;
    loading.value = false;
  }

  function clearError(): void {
    error.value = "";
  }

  async function withLoading<T>(fn: () => Promise<T>): Promise<T | null> {
    loading.value = true;
    clearError();
    try {
      return await fn();
    } catch (e: unknown) {
      setError(resolveApiErrorMessage(e));
      return null;
    } finally {
      loading.value = false;
    }
  }

  // ================================================================
  // VersionColumn表Action
  // ================================================================

  /**
   * Settings当前 editId 并加载VersionColumn表。
   */
  async function init(
    editIdParam: string,
    currentVersionParam?: string,
  ): Promise<void> {
    editId.value = editIdParam;
    if (currentVersionParam) {
      currentVersion.value = currentVersionParam;
    }
    await loadVersions(1);
  }

  /**
   * 加载VersionColumn表。
   */
  async function loadVersions(targetPage = 1): Promise<void> {
    if (!editId.value) return;

    const result = await withLoading(() =>
      apiFetchVersions(editId.value, targetPage, pageSize.value),
    );

    if (result) {
      versions.value = result.items;
      total.value = result.total ?? 0;
      page.value = targetPage;
    }
  }

  /**
   * 翻页。
   */
  async function goToPage(targetPage: number): Promise<void> {
    await loadVersions(targetPage);
  }

  /**
   * @param size - 每页条数
   */
  async function setPageSize(size: number): Promise<void> {
    pageSize.value = size;
    await loadVersions(1);
  }

  // ================================================================
  // VersionCompareAction
  // ================================================================

  /**
   * 选择要Compare的Version。
   */
  function selectForCompare(version: string, side: "left" | "right"): void {
    if (side === "left") {
      compareLeft.value = version;
    } else {
      compareRight.value = version;
    }
    // 自动清空旧的 diff 结果
    diffResult.value = null;
  }

  /**
   * 清除选择。
   */
  function clearCompare(): void {
    compareLeft.value = "";
    compareRight.value = "";
    leftDetail.value = null;
    rightDetail.value = null;
    diffResult.value = null;
  }

  /**
   * 执RowVersionCompare。
   * 加载两个Version的完整 Schema, 然后调用 diffSchema 计算差异。
   */
  async function executeCompare(): Promise<boolean> {
    if (!compareLeft.value || !compareRight.value) return false;
    if (!editId.value) return false;

    compareLoading.value = true;
    clearError();

    try {
      const [left, right] = await Promise.all([
        apiFetchVersion(editId.value, compareLeft.value),
        apiFetchVersion(editId.value, compareRight.value),
      ]);

      leftDetail.value = left;
      rightDetail.value = right;

      const { widgets: leftWidgets } = parseSchemaJson(left.json);
      const { widgets: rightWidgets } = parseSchemaJson(right.json);

      diffResult.value = diffSchema(leftWidgets, rightWidgets);
      return true;
    } catch (e: unknown) {
      setError(resolveApiErrorMessage(e));
      return false;
    } finally {
      compareLoading.value = false;
    }
  }

  // ================================================================
  // VersionRollback
  // ================================================================

  /**
   * Rollback到指定Version（加载该Version的 Schema）。
   * 返回该Version的 SchemaDetail, 调用方负责将其写入 WidgetStore。
   */
  async function rollbackToVersion(
    version: string,
  ): Promise<SchemaDetail | null> {
    if (!editId.value) return null;

    const result = await withLoading(() =>
      apiFetchVersion(editId.value, version),
    );

    if (result) {
      currentVersion.value = version;
    }

    return result;
  }

  // ================================================================
  // VersionDelete
  // ================================================================

  /**
   * Delete指定Version。
   */
  async function removeVersion(version: string): Promise<boolean> {
    if (!editId.value) return false;

    loading.value = true;
    clearError();
    try {
      await apiDeleteVersion(editId.value, version);

      // 从Column表中移除
      versions.value = versions.value.filter((v) => v.version !== version);
      total.value = Math.max(0, total.value - 1);

      // 如果删的是Compare中的Version, 清除CompareStatus
      if (compareLeft.value === version) compareLeft.value = "";
      if (compareRight.value === version) compareRight.value = "";

      loading.value = false;
      return true;
    } catch (e: unknown) {
      setError(resolveApiErrorMessage(e));
      return false;
    }
  }

  // ================================================================
  // VersionExport
  // ================================================================

  /**
   * Export指定Version的 Schema JSON。
   * 返回 JSON 字符串, 调用方负责下载。
   */
  async function exportVersion(version: string): Promise<string | null> {
    if (!editId.value) return null;

    try {
      const detail = await apiFetchVersion(editId.value, version);
      return JSON.stringify(detail.json, null, 2);
    } catch (e: unknown) {
      setError(resolveApiErrorMessage(e));
      return null;
    }
  }

  // ================================================================
  // Reset
  // ================================================================

  function reset(): void {
    versions.value = [];
    currentVersion.value = "";
    editId.value = "";
    page.value = 1;
    total.value = 0;
    compareLeft.value = "";
    compareRight.value = "";
    leftDetail.value = null;
    rightDetail.value = null;
    diffResult.value = null;
    compareLoading.value = false;
    loading.value = false;
    error.value = "";
  }

  return {
    // Status
    versions,
    currentVersion,
    editId,
    loading,
    error,
    page,
    pageSize,
    total,
    compareLeft,
    compareRight,
    leftDetail,
    rightDetail,
    diffResult,
    compareLoading,
    // 计算Property
    hasVersions,
    isEmpty,
    hasError,
    canCompare,
    diffSummary,
    hasDiff,
    // Action
    init,
    loadVersions,
    goToPage,
    setPageSize,
    selectForCompare,
    clearCompare,
    executeCompare,
    rollbackToVersion,
    removeVersion,
    exportVersion,
    reset,
    clearError,
  };
});
