<script setup lang="ts">
/**
 * WidgetTemplatePanel — ComponentTemplate Library面板
 *
 * 功能：
 * - TemplateColumn表展示（卡片Layout）
 * - TemplateSearch和Filter（Min类、关键词）
 * - Template应用（点击应用到画布）
 * - TemplateSave（从画布Save为Template）
 *
 * Status由 useTemplateStore 管理, 本Component只做渲染和交互。
 */
import { ref, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useTemplateStore } from "@/stores/template";
import type { TemplateCategory } from "@/api/schemaApi";
import type { Widget } from "@/widgets/base/types";
import styles from "./WidgetTemplatePanel.module.scss";
import AppIcon from "@schema-platform/platform-shared/components/common/AppIcon.vue";
import { useI18n } from "@schema-platform/platform-shared";

const { t } = useI18n();

const emit = defineEmits<{
  "apply-template": [widgets: Record<string, unknown>[]];
}>();

const props = defineProps<{
  currentWidgets?: Widget[];
}>();

const templateStore = useTemplateStore();

// ---- Category options ----

const categoryOptions = computed(() => [
  { label: t("editor.templatePanelEditor.categoryAll"), value: "" },
  { label: t("editor.templatePanelEditor.categoryForm"), value: "form" },
  { label: t("editor.templatePanelEditor.categoryLayout"), value: "layout" },
  { label: t("editor.templatePanelEditor.categoryTable"), value: "table" },
  { label: t("editor.templatePanelEditor.categorySearch"), value: "search" },
  { label: t("editor.templatePanelEditor.categoryChart"), value: "chart" },
  {
    label: t("editor.templatePanelEditor.categoryBusiness"),
    value: "business",
  },
  { label: t("editor.templatePanelEditor.categoryReport"), value: "report" },
  { label: t("editor.templatePanelEditor.categoryOther"), value: "other" },
]);

const categoryLabelMap = computed(() => ({
  form: t("editor.templatePanelEditor.categoryForm"),
  layout: t("editor.templatePanelEditor.categoryLayout"),
  table: t("editor.templatePanelEditor.categoryTable"),
  search: t("editor.templatePanelEditor.categorySearch"),
  chart: t("editor.templatePanelEditor.categoryChart"),
  business: t("editor.templatePanelEditor.categoryBusiness"),
  report: t("editor.templatePanelEditor.categoryReport"),
  other: t("editor.templatePanelEditor.categoryOther"),
}));

// ---- Search debounce ----

let searchTimer: ReturnType<typeof setTimeout> | null = null;

function handleSearchChange(value: string) {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    templateStore.setSearch(value);
    templateStore.loadTemplates();
  }, 300);
}

function handleCategoryChange(category: string) {
  templateStore.setCategory(category);
  templateStore.loadTemplates();
}

function handlePageChange(newPage: number) {
  templateStore.setPage(newPage);
  templateStore.loadTemplates();
}

// ---- Apply template ----

async function handleApply(templateId: string, templateName: string) {
  try {
    await ElMessageBox.confirm(
      t("editor.templatePanelEditor.applyConfirm", { name: templateName }),
      t("editor.templatePanelEditor.applyTitle"),
      {
        confirmButtonText: t("editor.templatePanelEditor.apply"),
        cancelButtonText: t("editor.common.cancel"),
      },
    );
  } catch {
    return;
  }

  try {
    const widgets = await templateStore.applyTemplateById(templateId);
    emit("apply-template", widgets);
    ElMessage.success(
      t("editor.templatePanelEditor.applySuccess", { name: templateName }),
    );
  } catch {
    ElMessage.error(t("editor.templatePanelEditor.applyFailed"));
  }
}

// ---- Delete template ----

async function handleDelete(templateId: string, templateName: string) {
  try {
    await ElMessageBox.confirm(
      t("editor.templatePanelEditor.deleteConfirm", { name: templateName }),
      t("editor.templatePanelEditor.deleteTitle"),
      {
        confirmButtonText: t("editor.common.delete"),
        cancelButtonText: t("editor.common.cancel"),
        type: "warning",
      },
    );
  } catch {
    return;
  }

  try {
    await templateStore.removeTemplate(templateId);
    ElMessage.success(t("editor.templatePanelEditor.deleted"));
  } catch {
    ElMessage.error(t("editor.templatePanelEditor.deleteFailed"));
  }
}

// ---- Save as template ----

const showSaveDialog = ref(false);
const saveForm = ref({
  name: "",
  description: "",
  category: "other" as TemplateCategory,
  tags: [] as string[],
});
const tagInput = ref("");

function openSaveDialog() {
  saveForm.value = {
    name: "",
    description: "",
    category: "other",
    tags: [],
  };
  tagInput.value = "";
  showSaveDialog.value = true;
}

function addTag() {
  const tag = tagInput.value.trim();
  if (tag && !saveForm.value.tags.includes(tag)) {
    saveForm.value.tags.push(tag);
  }
  tagInput.value = "";
}

function removeTag(index: number) {
  saveForm.value.tags.splice(index, 1);
}

async function handleSaveTemplate() {
  if (!saveForm.value.name.trim()) {
    ElMessage.warning(t("editor.templatePanelEditor.nameRequired"));
    return;
  }
  if (!props.currentWidgets || props.currentWidgets.length === 0) {
    ElMessage.warning(t("editor.templatePanelEditor.canvasEmpty"));
    return;
  }

  try {
    await templateStore.saveTemplate({
      name: saveForm.value.name.trim(),
      description: saveForm.value.description,
      category: saveForm.value.category,
      widgets: props.currentWidgets as unknown as Record<string, unknown>[],
      tags: saveForm.value.tags,
    });
    ElMessage.success(t("editor.templatePanelEditor.saved"));
    showSaveDialog.value = false;
  } catch {
    ElMessage.error(t("editor.templatePanelEditor.saveFailed"));
  }
}

// ---- Init ----

onMounted(() => {
  templateStore.loadTemplates();
});
</script>

<template>
  <div :class="styles.panel">
    <!-- Header: search + filter + save button -->
    <div :class="styles.header">
      <div :class="styles['header-row']">
        <el-input
          :model-value="templateStore.searchKeyword"
          :class="styles['search-input']"
          :placeholder="t('editor.templatePanelEditor.searchPlaceholder')"
          clearable
          size="small"
          @input="handleSearchChange"
        >
          <template #prefix>
            <AppIcon name="search" />
          </template>
        </el-input>
        <el-button
          :class="styles['save-btn']"
          type="primary"
          size="small"
          @click="openSaveDialog"
        >
          <AppIcon name="plus" />
          {{ t("editor.templatePanelEditor.save") }}
        </el-button>
      </div>
      <div :class="styles['filter-row']">
        <el-select
          :model-value="templateStore.selectedCategory"
          :class="styles['filter-select']"
          :placeholder="t('editor.templatePanelEditor.category')"
          size="small"
          clearable
          @change="handleCategoryChange"
        >
          <el-option
            v-for="opt in categoryOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </div>
    </div>

    <!-- List -->
    <div :class="styles.list">
      <div v-if="templateStore.loading" :class="styles.loading">
        {{ t("editor.common.loading") }}
      </div>
      <div v-else-if="templateStore.error" :class="styles.empty">
        {{ templateStore.error }}
      </div>
      <div
        v-else-if="templateStore.templates.length === 0"
        :class="styles.empty"
      >
        {{
          templateStore.searchKeyword || templateStore.selectedCategory
            ? t("editor.templatePanelEditor.noMatch")
            : t("editor.templatePanelEditor.empty")
        }}
      </div>
      <div v-else :class="styles['card-grid']">
        <div
          v-for="tpl in templateStore.templates"
          :key="tpl.id"
          :class="styles.card"
          @click="handleApply(tpl.id, tpl.name)"
        >
          <div :class="styles['card-header']">
            <img
              v-if="tpl.thumbnail"
              :class="styles['card-thumbnail']"
              :src="tpl.thumbnail"
              :alt="tpl.name"
            />
            <div v-else :class="styles['card-placeholder']">T</div>
            <div :class="styles['card-info']">
              <div :class="styles['card-name']">{{ tpl.name }}</div>
              <div v-if="tpl.description" :class="styles['card-desc']">
                {{ tpl.description }}
              </div>
            </div>
          </div>
          <div :class="styles['card-meta']">
            <span :class="styles['card-category']">
              {{ categoryLabelMap[tpl.category] || tpl.category }}
            </span>
            <span v-if="tpl.isBuiltin" :class="styles['card-builtin']">{{
              t("editor.templatePanelEditor.builtin")
            }}</span>
            <span :class="styles['card-usage']">{{
              t("editor.templatePanelEditor.usageCount", {
                count: tpl.usageCount,
              })
            }}</span>
          </div>
          <div v-if="tpl.tags.length > 0" :class="styles['card-tags']">
            <span
              v-for="tag in tpl.tags"
              :key="tag"
              :class="styles['card-tag']"
              >{{ tag }}</span
            >
          </div>
          <div :class="styles['card-actions']" @click.stop>
            <el-tooltip
              :content="t('editor.templatePanelEditor.useTemplate')"
              placement="top"
              :show-after="300"
            >
              <el-button
                size="small"
                text
                type="primary"
                @click="handleApply(tpl.id, tpl.name)"
              >
                <AppIcon name="plus" />
              </el-button>
            </el-tooltip>
            <el-tooltip
              v-if="!tpl.isBuiltin"
              :content="t('editor.common.delete')"
              placement="top"
              :show-after="300"
            >
              <el-button
                size="small"
                text
                type="danger"
                @click="handleDelete(tpl.id, tpl.name)"
              >
                <AppIcon name="delete" />
              </el-button>
            </el-tooltip>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div
      v-if="templateStore.total > templateStore.pageSize"
      :class="styles.pagination"
    >
      <el-pagination
        :current-page="templateStore.page"
        :page-size="templateStore.pageSize"
        :total="templateStore.total"
        layout="prev, pager, next"
        size="small"
        @current-change="handlePageChange"
      />
    </div>

    <!-- Save template dialog -->
    <el-dialog
      v-model="showSaveDialog"
      :title="t('editor.templatePanelEditor.saveTitle')"
      width="400px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div :class="styles['save-form']">
        <el-form-item :label="t('editor.templatePanelEditor.name')" required>
          <el-input
            v-model="saveForm.name"
            :placeholder="t('editor.templatePanelEditor.namePlaceholder')"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
        <el-form-item :label="t('editor.templatePanelEditor.description')">
          <el-input
            v-model="saveForm.description"
            type="textarea"
            :placeholder="
              t('editor.templatePanelEditor.descriptionPlaceholder')
            "
            :rows="2"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item :label="t('editor.templatePanelEditor.category')">
          <el-select v-model="saveForm.category" style="width: 100%">
            <el-option
              v-for="opt in categoryOptions.filter((o) => o.value)"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('editor.templatePanelEditor.tags')">
          <div :class="styles['tag-input-row']">
            <el-input
              v-model="tagInput"
              :class="styles['tag-input']"
              :placeholder="t('editor.templatePanelEditor.tagPlaceholder')"
              size="small"
              @keyup.enter="addTag"
            />
            <el-button size="small" @click="addTag">{{
              t("editor.templatePanelEditor.add")
            }}</el-button>
          </div>
          <div
            v-if="saveForm.tags.length > 0"
            style="margin-top: 6px; display: flex; gap: 4px; flex-wrap: wrap"
          >
            <el-tag
              v-for="(tag, idx) in saveForm.tags"
              :key="idx"
              closable
              size="small"
              @close="removeTag(idx)"
            >
              {{ tag }}
            </el-tag>
          </div>
        </el-form-item>
      </div>
      <template #footer>
        <el-button @click="showSaveDialog = false">{{
          t("editor.common.cancel")
        }}</el-button>
        <el-button type="primary" @click="handleSaveTemplate">{{
          t("editor.common.save")
        }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>
