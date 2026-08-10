/**
 * useTemplateStore — ComponentTemplate LibraryStatus管理
 *
 * 使用 useDataLoading 统一 loading/error Status管理。
 * 仅在Data获取RegionShow loading（配合 v-loading 使用）。
 */
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useDataLoading } from "@schema-platform/platform-shared/utils/useDataLoading";
import {
  fetchTemplates,
  applyTemplate,
  createTemplate,
  deleteTemplate,
} from "@/utils/apiClient";
import type { TemplateItem, TemplateCategory } from "@/utils/apiClient";

export const useTemplateStore = defineStore("template", () => {
  // ================================================================
  // Data
  // ================================================================

  const templates = ref<TemplateItem[]>([]);
  const total = ref(0);
  const { loading, error, withLoading } = useDataLoading({ timeout: 15000 });

  // ================================================================
  // Filter / Min页
  // ================================================================

  const searchKeyword = ref("");
  const selectedCategory = ref("");
  const page = ref(1);
  const pageSize = ref(20);

  const totalPages = computed(() => Math.ceil(total.value / pageSize.value));
  const hasMore = computed(() => page.value < totalPages.value);

  // ================================================================
  // 加载Template
  // ================================================================

  async function loadTemplates(): Promise<void> {
    await withLoading(async () => {
      const res = await fetchTemplates({
        search: searchKeyword.value || undefined,
        category: selectedCategory.value || undefined,
        page: page.value,
        pageSize: pageSize.value,
      });
      templates.value = res.items;
      total.value = res.total;
    });
  }

  // ================================================================
  // Search / FilterAction
  // ================================================================

  function setSearch(keyword: string): void {
    searchKeyword.value = keyword;
    page.value = 1;
  }

  function setCategory(category: string): void {
    selectedCategory.value = category;
    page.value = 1;
  }

  function setPage(newPage: number): void {
    page.value = newPage;
  }

  function resetFilters(): void {
    searchKeyword.value = "";
    selectedCategory.value = "";
    page.value = 1;
  }

  // ================================================================
  // 应用Template
  // ================================================================

  async function applyTemplateById(
    id: string,
  ): Promise<Record<string, unknown>[]> {
    const result = await applyTemplate(id);
    // RefreshColumn表以Update usageCount
    loadTemplates();
    return result.widgets;
  }

  // ================================================================
  // 创建Template
  // ================================================================

  async function saveTemplate(payload: {
    name: string;
    description?: string;
    category?: TemplateCategory;
    widgets: Record<string, unknown>[];
    tags?: string[];
    thumbnail?: string;
  }): Promise<TemplateItem> {
    const template = await createTemplate(payload);
    // RefreshColumn表
    loadTemplates();
    return template;
  }

  // ================================================================
  // DeleteTemplate
  // ================================================================

  async function removeTemplate(id: string): Promise<void> {
    await deleteTemplate(id);
    // RefreshColumn表
    loadTemplates();
  }

  // ================================================================
  // Export
  // ================================================================

  return {
    // Data
    templates,
    total,
    loading,
    error,
    // Filter / Min页
    searchKeyword,
    selectedCategory,
    page,
    pageSize,
    totalPages,
    hasMore,
    // 方法
    loadTemplates,
    setSearch,
    setCategory,
    setPage,
    resetFilters,
    applyTemplateById,
    saveTemplate,
    removeTemplate,
  };
});
