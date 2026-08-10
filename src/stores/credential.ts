/**
 * useCredentialStore -- Credential management state
 *
 * 使用 useDataLoading 统一 loading/error Status管理。
 * 仅在Data获取RegionShow loading（配合 v-loading 使用）。
 */
import { defineStore } from "pinia";
import { ref, reactive, computed } from "vue";
import { useDataLoading } from "@schema-platform/platform-shared/utils/useDataLoading";
import { resolveApiErrorMessage } from "@/utils/resolveApiErrorMessage";
import type { PaginatedResponse } from "@/types/api";
import type {
  CredentialItem,
  CredentialDetail,
  CredentialType,
  CredentialCreatePayload,
  CredentialUpdatePayload,
} from "@/types/credential";
import {
  fetchCredentials as apiFetchCredentials,
  fetchCredentialById as apiFetchCredentialById,
  createCredential as apiCreateCredential,
  updateCredential as apiUpdateCredential,
  deleteCredential as apiDeleteCredential,
} from "@/api/dataApi";

const DEFAULT_PAGE_SIZE = 20;

export const useCredentialStore = defineStore("credential", () => {
  const credentials = ref<CredentialItem[]>([]);
  const { loading, error, withLoading } = useDataLoading({ timeout: 15000 });
  const searchQuery = ref("");
  const typeFilter = ref<CredentialType | "">("");
  const pagination = reactive({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });

  const hasCredentials = computed(() => credentials.value.length > 0);
  const isEmpty = computed(
    () => !loading.value && credentials.value.length === 0,
  );
  const hasError = computed(() => error.value !== null);

  function clearError() {
    error.value = null;
  }

  /**
   * 包装 withLoading, 将错误文案统一经 resolveApiErrorMessage 转换
   *
   * @param fn - 异步操作
   */
  async function withResolvedLoading<T>(
    fn: () => Promise<T>,
  ): Promise<T | null> {
    return withLoading(async () => {
      try {
        return await fn();
      } catch (e: unknown) {
        throw new Error(resolveApiErrorMessage(e));
      }
    });
  }

  async function fetchCredentials(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    type?: CredentialType | "";
  }): Promise<PaginatedResponse<CredentialItem> | null> {
    const page = params?.page ?? pagination.page;
    const pageSize = params?.pageSize ?? pagination.pageSize;
    const search = params?.search ?? searchQuery.value;
    const type = params?.type ?? typeFilter.value;

    const result = await withResolvedLoading(() =>
      apiFetchCredentials({
        page,
        pageSize,
        search: search || undefined,
        type: type || undefined,
      }),
    );

    if (result) {
      credentials.value = result.items;
      pagination.total = result.total;
      pagination.page = result.page;
      pagination.pageSize = result.pageSize;
      pagination.totalPages = result.totalPages;
      if (params?.search !== undefined) searchQuery.value = params.search;
      if (params?.type !== undefined) typeFilter.value = params.type;
    }

    return result;
  }

  async function fetchCredentialById(
    id: string,
  ): Promise<CredentialDetail | null> {
    return withResolvedLoading(() => apiFetchCredentialById(id));
  }

  async function createCredential(
    payload: CredentialCreatePayload,
  ): Promise<CredentialItem | null> {
    const result = await withResolvedLoading(() => apiCreateCredential(payload));
    if (result) await fetchCredentials({ page: 1 });
    return result;
  }

  async function updateCredential(
    id: string,
    payload: CredentialUpdatePayload,
  ): Promise<CredentialItem | null> {
    const result = await withResolvedLoading(() =>
      apiUpdateCredential(id, payload),
    );
    if (result) {
      const idx = credentials.value.findIndex((c) => c.id === id);
      if (idx >= 0) credentials.value[idx] = result;
    }
    return result;
  }

  async function deleteCredential(id: string): Promise<boolean> {
    clearError();
    try {
      await apiDeleteCredential(id);
      credentials.value = credentials.value.filter((c) => c.id !== id);
      pagination.total = Math.max(0, pagination.total - 1);
      pagination.totalPages = Math.max(
        1,
        Math.ceil(pagination.total / pagination.pageSize),
      );
      if (credentials.value.length === 0 && pagination.page > 1) {
        await fetchCredentials({ page: pagination.page - 1 });
      }
      return true;
    } catch (e: unknown) {
      error.value = resolveApiErrorMessage(e);
      return false;
    }
  }

  return {
    credentials,
    loading,
    error,
    searchQuery,
    typeFilter,
    pagination,
    hasCredentials,
    isEmpty,
    hasError,
    fetchCredentials,
    fetchCredentialById,
    createCredential,
    updateCredential,
    deleteCredential,
    clearError,
  };
});
