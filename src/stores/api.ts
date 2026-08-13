/**
 * useApiStore — Schema API CRUD Status管理
 *
 * 职责：
 * - Schema 清单的获取、Min页、Search
 * - Schema Details的加载、创建、Update、Delete
 * - 发布Action
 *
 * 设计原则：
 * - 纯 API 层, 不持有画布Status
 * - AsyncAction用 loading/error 模式管理
 * - Min页Status与Search词独立管理, 互不干扰
 * - 与 apiClient 解耦：依赖 configureApiClient() 完成初始化
 */
import { defineStore } from "pinia";
import { ref, reactive, computed } from "vue";
import type {
  SchemaListItem,
  SchemaDetail,
  PaginatedResponse,
  PublishedSchemaItem,
  SchemaCreatePayload,
  SchemaUpdatePayload,
} from "@/types/api";
import type { PartialWidget } from "@/components/WidgetRenderer/types";
import { resolveApiErrorMessage } from "@/utils/resolveApiErrorMessage";
import { reportTelemetry } from "@/api/telemetryApi";
import {
  fetchSchemas as apiFetchSchemas,
  fetchSchemaById as apiFetchSchemaById,
  createSchema as apiCreateSchema,
  updateSchema as apiUpdateSchema,
  deleteSchema as apiDeleteSchema,
  publishSchema as apiPublishSchema,
  fetchPublishedSchema as apiFetchPublishedSchema,
  fetchPublishedByPublishId as apiFetchPublishedByPublishId,
} from "@/utils/apiClient";

import { DEFAULT_PAGE_SIZE } from "@schema-platform/platform-shared/utils/pagination";

export const useApiStore = defineStore("schema", () => {
  // ================================================================
  // Status
  // ================================================================

  /** Schema 清单（Min页Column表） */
  const schemas = ref<SchemaListItem[]>([]);

  /** 当前View/Edit的单个 Schema Details */
  const currentSchema = ref<SchemaListItem | null>(null);

  /** Loading标志 */
  const loading = ref(false);

  /** 最近一次ErrorInfo */
  const error = ref("");

  /** Search关键词 */
  const searchQuery = ref("");

  /** Min页Status */
  const pagination = reactive({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });

  // ================================================================
  // 计算Property
  // ================================================================

  /** 是否有已加载的清单 */
  const hasSchemas = computed(() => schemas.value.length > 0);

  /** 清单是否为空（加载完成且无Data） */
  const isEmpty = computed(() => !loading.value && schemas.value.length === 0);

  /** 是否有Error */
  const hasError = computed(() => error.value !== "");

  // ================================================================
  // 内部工具
  // ================================================================

  /** SettingsError并Reset loading */
  function setError(message: string): void {
    error.value = message;
    loading.value = false;
  }

  /** 清除Error */
  function clearError(): void {
    error.value = "";
  }

  /**
   * 安全包装AsyncAction：统一管理 loading/error Status。
   *
   * @param fn - 要执Row的Async函数
   * @returns 函数的返回Value, FailedHrs返回 null
   */
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

  /**
   * 安全包装AsyncAction：不Settings全局 loading, 仅捕获Error。
   * 用于静默Action（如后台Refresh）。
   */
  async function withErrorHandling<T>(fn: () => Promise<T>): Promise<T | null> {
    clearError();
    try {
      return await fn();
    } catch (e: unknown) {
      setError(resolveApiErrorMessage(e));
      return null;
    }
  }

  // ================================================================
  // Schema 清单Action
  // ================================================================

  /**
   * 获取 Schema Min页Column表。
   *
   * @param params - 可覆盖当前 pagination/searchQuery Status
   */
  async function fetchSchemas(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    type?: string;
  }): Promise<PaginatedResponse<SchemaListItem> | null> {
    const page = params?.page ?? pagination.page;
    const pageSize = params?.pageSize ?? pagination.pageSize;
    const search = params?.search ?? searchQuery.value;

    const result = await withLoading(() =>
      apiFetchSchemas({
        search: search || undefined,
        page,
        pageSize,
        type: params?.type,
      }),
    );

    if (result) {
      schemas.value = result.items;
      pagination.total = result.total;
      pagination.page = result.page;
      pagination.pageSize = result.pageSize;
      pagination.totalPages = result.totalPages;
      // SyncSearch词回 store
      if (params?.search !== undefined) {
        searchQuery.value = params.search;
      }
    }

    return result;
  }

  /**
   * 跳转到指定页。
   */
  async function goToPage(page: number): Promise<void> {
    if (page < 1 || page > pagination.totalPages) return;
    await fetchSchemas({ page });
  }

  /**
   * 修改每页条数并重新加载首页。
   */
  async function setPageSize(pageSize: number): Promise<void> {
    await fetchSchemas({ page: 1, pageSize });
  }

  /**
   * 按关键词Search并Reset到首页。
   */
  async function search(search: string): Promise<void> {
    searchQuery.value = search;
    await fetchSchemas({ page: 1, search });
  }

  /**
   * 清除Search并重新加载。
   */
  async function clearSearch(): Promise<void> {
    searchQuery.value = "";
    await fetchSchemas({ page: 1, search: "" });
  }

  // ================================================================
  // 单 Schema Action
  // ================================================================

  /**
   * 根据 ID 获取 Schema Details（含完整 JSON）。
   */
  async function fetchSchemaById(id: string): Promise<SchemaDetail | null> {
    const result = await withLoading(() => apiFetchSchemaById(id));
    if (result) {
      currentSchema.value = result;
    }
    return result;
  }

  /**
   * 创建新 Schema（单次 POST, json 可为 Widget[] 或 { widgets, board }）。
   *
   * @returns 创建Success的 Schema, Failed返回 null
   */
  async function createSchema(
    payload: SchemaCreatePayload,
  ): Promise<SchemaListItem | null> {
    const result = await withLoading(() => apiCreateSchema(payload));
    if (result) {
      await fetchSchemas();
      currentSchema.value = result;
      void reportTelemetry("create", {
        schemaId: result.id,
        props: { type: payload.type },
      });
    }
    return result;
  }

  /**
   * Update Schema。
   *
   * @param id      - Schema ID
   * @param payload - 要Update的Field
   * @returns Update后的 Schema, Failed返回 null
   */
  async function updateSchema(
    id: string,
    payload: SchemaUpdatePayload,
  ): Promise<SchemaListItem | null> {
    const result = await withLoading(() => apiUpdateSchema(id, payload));
    if (result) {
      currentSchema.value = result;
      // SyncUpdate清单中的同名项
      const idx = schemas.value.findIndex((s) => s.id === id);
      if (idx >= 0) {
        schemas.value[idx] = result;
      }
    }
    return result;
  }

  /**
   * Delete Schema。
   *
   * @returns 是否SuccessDelete
   */
  async function deleteSchema(id: string): Promise<boolean> {
    await withErrorHandling(() => apiDeleteSchema(id));
    if (!error.value) {
      // 从清单中移除
      schemas.value = schemas.value.filter((s) => s.id !== id);
      if (currentSchema.value?.id === id) {
        currentSchema.value = null;
      }
      // UpdateMin页Count
      pagination.total = Math.max(0, pagination.total - 1);
      pagination.totalPages = Math.max(
        1,
        Math.ceil(pagination.total / pagination.pageSize),
      );
      // 若当前页无Data且非首页, 回退一页
      if (schemas.value.length === 0 && pagination.page > 1) {
        await goToPage(pagination.page - 1);
      }
      void reportTelemetry("delete", { schemaId: id });
      return true;
    }
    return false;
  }

  /**
   * Save schema 到后端。
   *
   * @param schema   - 要Save的 PartialWidget 数组
   * @param name     - Schema Name
   * @param schemaId - 可选：要Update的 Schema ID
   * @param thumbnail - 可选：缩略图
   * @param boardConfig - 可选：画布Config（canvas, variables, events）
   * @returns Save后的 Schema, Failed返回 null
   */
  async function saveSchema(
    schema: PartialWidget[],
    name: string,
    schemaId?: string,
    thumbnail?: string,
    boardConfig?: {
      canvas?: Record<string, unknown>;
      variables?: unknown[];
      events?: unknown[];
    },
  ): Promise<SchemaListItem | null> {
    // 将 board Config嵌入到 json Field中
    const jsonPayload = boardConfig
      ? { widgets: schema, board: boardConfig }
      : schema;

    if (schemaId) {
      const result = await updateSchema(schemaId, {
        name,
        json: jsonPayload,
        thumbnail,
      });
      if (result)
        void reportTelemetry("save", {
          schemaId,
          props: { widgetCount: schema.length },
        });
      return result;
    } else {
      // 新建Hrs按画布Config推断Type：Grid Column表Template -> search_list, 其余 -> form
      const gridTemplate = (boardConfig?.canvas?.gridTemplate ??
        (boardConfig?.canvas as { flexTemplate?: string } | undefined)
          ?.flexTemplate) as string | undefined;
      const type: SchemaCreatePayload["type"] =
        gridTemplate === "list" ? "search-list" : "form";
      const result = await createSchema({
        name,
        type,
        json: jsonPayload,
        thumbnail,
      });
      if (result)
        void reportTelemetry("save", {
          schemaId: result.id,
          props: { widgetCount: schema.length, isNew: true },
        });
      return result;
    }
  }

  /**
   * 从后端加载 Schema Details。
   *
   * @param id - Schema ID
   * @returns Schema Details, Failed返回 null
   */
  async function loadSchema(id: string): Promise<SchemaDetail | null> {
    return fetchSchemaById(id);
  }

  // ================================================================
  // 发布Action
  // ================================================================

  /**
   * 发布 Schema — 将当前草稿写入 PublishedSchema 表（upsert）。
   *
   * @param id - FormSchema ID
   * @returns 发布后的 PublishedSchema, Failed返回 null
   */
  async function publishSchema(
    id: string,
  ): Promise<PublishedSchemaItem | null> {
    const result = await withLoading(() => apiPublishSchema(id));
    if (result) void reportTelemetry("publish", { schemaId: id });
    return result;
  }

  /**
   * 获取已发布的 Schema（按源 FormSchema ID Query）。
   * 未发布返回 null, 不Settings全局 error。
   *
   * @param sourceId - FormSchema ID
   * @returns PublishedSchema, 未发布返回 null
   */
  async function fetchPublishedSchema(
    sourceId: string,
  ): Promise<PublishedSchemaItem | null> {
    try {
      return await apiFetchPublishedSchema(sourceId);
    } catch {
      // Never pollute global error for "not published" queries
      return null;
    }
  }

  async function fetchPublishedByPublishId(
    publishId: string,
  ): Promise<PublishedSchemaItem | null> {
    try {
      return await apiFetchPublishedByPublishId(publishId);
    } catch {
      return null;
    }
  }

  return {
    // Status
    schemas,
    currentSchema,
    loading,
    error,
    searchQuery,
    pagination,
    // 计算Property
    hasSchemas,
    isEmpty,
    hasError,
    // 清单Action
    fetchSchemas,
    goToPage,
    setPageSize,
    search,
    clearSearch,
    // 单 Schema CRUD
    fetchSchemaById,
    createSchema,
    updateSchema,
    deleteSchema,
    // Schema Save/加载
    saveSchema,
    loadSchema,
    // 发布Action
    publishSchema,
    fetchPublishedSchema,
    fetchPublishedByPublishId,
    // Error管理
    clearError,
  };
});
