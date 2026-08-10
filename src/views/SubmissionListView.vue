<script setup lang="ts">
/**
 * SubmissionListView — FormSubmitDataView页
 *
 * 选择Form → View该Form的所有SubmitData, 支持StatusFilter、Min页、Delete、Export CSV/Excel。
 */
import { onMounted, ref, computed, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useI18n } from "@schema-platform/platform-shared";
import { useDataLoading } from "@schema-platform/platform-shared/utils/useDataLoading";
import { fetchSchemas } from "@/api/schemaApi";
import {
  fetchSubmissions,
  deleteSubmission,
  exportSubmissions,
  batchDeleteSubmissions,
  batchUpdateSubmissionsStatus,
  type SubmissionItem,
  type ExportFormat,
} from "@/api/dataApi";
import { resolveApiErrorMessage } from "@/utils/resolveApiErrorMessage";
import type { PaginatedResponse, SchemaListItem } from "@/types/api";
import styles from "./SubmissionListView.module.scss";
import AppIcon from "@schema-platform/platform-shared/components/common/AppIcon.vue";

const { t } = useI18n();

// ── FormColumn表 ──
const schemas = ref<SchemaListItem[]>([]);
const selectedSchemaId = ref("");

// ── SubmitData ──
const submissions = ref<SubmissionItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const { loading, withLoading } = useDataLoading({ timeout: 15000 });

// ── Filter ──
const activeStatus = ref("");

// ── 批量选择 ──
const selectedRows = ref<SubmissionItem[]>([]);
const hasSelection = computed(() => selectedRows.value.length > 0);

const statusOptions = computed(() => [
  { label: t("editor.submissionView.allStatus"), value: "" },
  { label: t("editor.submissionView.statusSubmitted"), value: "submitted" },
  { label: t("editor.submissionView.statusApproved"), value: "approved" },
  { label: t("editor.submissionView.statusRejected"), value: "rejected" },
]);

// ── 当前选中的 schema Name ──
const selectedSchemaName = computed(() => {
  const s = schemas.value.find((item) => item.id === selectedSchemaId.value);
  return s?.name ?? "";
});

// ── 加载FormColumn表 ──
async function loadSchemas() {
  const res: PaginatedResponse<SchemaListItem> = await fetchSchemas({
    pageSize: 200,
  });
  schemas.value = res.items;
  if (schemas.value.length > 0 && !selectedSchemaId.value) {
    selectedSchemaId.value = schemas.value[0].id;
  }
}

// ── 加载SubmitData ──
async function loadSubmissions() {
  if (!selectedSchemaId.value) {
    submissions.value = [];
    total.value = 0;
    return;
  }

  await withLoading(async () => {
    const res: PaginatedResponse<SubmissionItem> = await fetchSubmissions(
      selectedSchemaId.value,
      {
        status: activeStatus.value || undefined,
        page: page.value,
        pageSize: pageSize.value,
      },
    );
    submissions.value = res.items;
    total.value = res.total;
  });
}

// ── 初始化 ──
onMounted(async () => {
  await loadSchemas();
  if (selectedSchemaId.value) {
    await loadSubmissions();
  }
});

// ── Form切换Hrs重新加载 ──
watch(selectedSchemaId, () => {
  page.value = 1;
  loadSubmissions();
});

watch(activeStatus, () => {
  page.value = 1;
  loadSubmissions();
});

// ── Min页 ──
function handlePageChange(p: number) {
  page.value = p;
  loadSubmissions();
}

// ── Delete ──
async function handleDelete(item: SubmissionItem) {
  try {
    await ElMessageBox.confirm(
      t("editor.submissionView.deleteConfirm"),
      t("editor.submissionView.deleteConfirmTitle"),
      {
        confirmButtonText: t("editor.common.delete"),
        cancelButtonText: t("editor.common.cancel"),
        type: "warning",
      },
    );
    await deleteSubmission(selectedSchemaId.value, item.id);
    ElMessage.success(t("editor.submissionView.deleted"));
    await loadSubmissions();
  } catch (err) {
    if (err === "cancel" || err === "close") return;
    ElMessage.error(resolveApiErrorMessage(err));
  }
}

// ── 批量Delete ──
async function handleBatchDelete() {
  const ids = selectedRows.value.map((r) => r.id);
  try {
    await ElMessageBox.confirm(
      t("editor.submissionView.batchDeleteConfirm", { count: ids.length }),
      t("editor.submissionView.batchDeleteConfirmTitle"),
      {
        confirmButtonText: t("editor.common.delete"),
        cancelButtonText: t("editor.common.cancel"),
        type: "warning",
      },
    );
    const result = await batchDeleteSubmissions(selectedSchemaId.value, ids);
    ElMessage.success(
      t("editor.submissionView.batchDeleted", { count: result.deletedCount }),
    );
    selectedRows.value = [];
    await loadSubmissions();
  } catch (err) {
    if (err === "cancel" || err === "close") return;
    ElMessage.error(resolveApiErrorMessage(err));
  }
}

// ── 批量审批 ──
async function handleBatchApprove() {
  const ids = selectedRows.value.map((r) => r.id);
  try {
    await ElMessageBox.confirm(
      t("editor.submissionView.batchApproveConfirm", { count: ids.length }),
      t("editor.submissionView.batchApproveConfirmTitle"),
      {
        confirmButtonText: t("editor.submissionView.statusApproved"),
        cancelButtonText: t("editor.common.cancel"),
        type: "warning",
      },
    );
    const result = await batchUpdateSubmissionsStatus(
      selectedSchemaId.value,
      ids,
      "approved",
    );
    ElMessage.success(
      t("editor.submissionView.batchApproved", { count: result.modifiedCount }),
    );
    selectedRows.value = [];
    await loadSubmissions();
  } catch {
    // UserCancel
  }
}

// ── 选择变更 ──
function handleSelectionChange(rows: SubmissionItem[]) {
  selectedRows.value = rows;
}

// ── Export ──
const FORMAT_EXTENSIONS: Record<ExportFormat, string> = {
  csv: "csv",
  xlsx: "xlsx",
};
const FORMAT_LABELS: Record<ExportFormat, string> = {
  csv: "CSV",
  xlsx: "Excel",
};

async function handleExport(format: ExportFormat) {
  if (!selectedSchemaId.value) return;
  try {
    const blob = await exportSubmissions(
      selectedSchemaId.value,
      format,
      activeStatus.value || undefined,
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `submissions-${selectedSchemaName.value || selectedSchemaId.value}.${FORMAT_EXTENSIONS[format]}`;
    a.click();
    URL.revokeObjectURL(url);
    ElMessage.success(
      t("editor.submissionView.exportSuccess", {
        format: FORMAT_LABELS[format],
      }),
    );
  } catch (err) {
    ElMessage.error(
      err instanceof Error
        ? err.message
        : t("editor.submissionView.exportFailed"),
    );
  }
}

// ── 辅助函数 ──
function formatDate(d: string): string {
  return new Date(d).toLocaleString("zh-CN");
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    submitted: t("editor.submissionView.statusSubmitted"),
    approved: t("editor.submissionView.statusApproved"),
    rejected: t("editor.submissionView.statusRejected"),
  };
  return map[status] ?? status;
}

function statusTagType(status: string): "info" | "success" | "danger" {
  const map: Record<string, "info" | "success" | "danger"> = {
    submitted: "info",
    approved: "success",
    rejected: "danger",
  };
  return map[status] ?? "info";
}

function dataPreview(data: Record<string, unknown>): string {
  const entries = Object.entries(data);
  if (entries.length === 0) return "-";
  const preview = entries
    .slice(0, 3)
    .map(
      ([k, v]) =>
        `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`,
    )
    .join(", ");
  return entries.length > 3 ? `${preview} ...` : preview;
}

function dataKeys(item: SubmissionItem): string[] {
  return Object.keys(item.data);
}
</script>

<template>
  <div :class="styles.submissionView">
    <div :class="styles.scrollbar">
      <!-- Header -->
      <div :class="styles.header">
        <div :class="styles.titleRow">
          <div>
            <h1 :class="styles.title">
              {{ t("editor.submissionView.title") }}
            </h1>
            <p :class="styles.subtitle">
              {{ t("editor.submissionView.subtitle") }}
            </p>
          </div>
          <div :class="styles.headerActions">
            <template v-if="hasSelection">
              <el-button type="danger" @click="handleBatchDelete">
                <AppIcon name="delete" class="el-icon--left" />
                {{
                  t("editor.submissionView.batchDelete", {
                    count: selectedRows.length,
                  })
                }}
              </el-button>
              <el-button type="success" @click="handleBatchApprove">
                <AppIcon name="check" class="el-icon--left" />
                {{
                  t("editor.submissionView.batchApprove", {
                    count: selectedRows.length,
                  })
                }}
              </el-button>
              <el-divider direction="vertical" />
            </template>
            <el-dropdown
              :disabled="!selectedSchemaId || total === 0"
              @command="handleExport"
            >
              <el-button :disabled="!selectedSchemaId || total === 0">
                <AppIcon name="arrow-down" class="el-icon--left" />
                {{ t("editor.submissionView.exportButton") }}
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="csv">{{
                    t("editor.submissionView.exportCsv")
                  }}</el-dropdown-item>
                  <el-dropdown-item command="xlsx">{{
                    t("editor.submissionView.exportExcel")
                  }}</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>

        <!-- Toolbar -->
        <div :class="styles.toolbar">
          <div :class="styles.toolbarLeft">
            <el-select
              v-model="selectedSchemaId"
              :placeholder="t('editor.submissionView.selectForm')"
              filterable
              :class="styles.schemaSelect"
            >
              <el-option
                v-for="s in schemas"
                :key="s.id"
                :label="s.name"
                :value="s.id"
              />
            </el-select>
            <el-select v-model="activeStatus" :class="styles.statusSelect">
              <el-option
                v-for="opt in statusOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </div>
        </div>
      </div>

      <!-- 未选择Form -->
      <div v-if="!selectedSchemaId" :class="styles.emptyState">
        <div :class="styles.emptyIcon">
          <AppIcon name="document" :size="64" />
        </div>
        <h2 :class="styles.emptyTitle">
          {{ t("editor.submissionView.selectFormTitle") }}
        </h2>
        <p :class="styles.emptyDesc">
          {{ t("editor.submissionView.selectFormDesc") }}
        </p>
      </div>

      <!-- Loading -->
      <div
        v-else-if="loading && submissions.length === 0"
        :class="styles.tableWrapper"
      >
        <el-skeleton :rows="8" animated />
      </div>

      <!-- Empty -->
      <div v-else-if="total === 0" :class="styles.emptyState">
        <div :class="styles.emptyIcon">
          <AppIcon name="search" :size="64" />
        </div>
        <h2 :class="styles.emptyTitle">
          {{ t("editor.submissionView.emptyTitle") }}
        </h2>
        <p :class="styles.emptyDesc">
          {{ t("editor.submissionView.emptyDesc") }}
        </p>
      </div>

      <!-- Table -->
      <div v-else :class="styles.tableWrapper" v-loading="loading">
        <el-table
          :data="submissions"
          stripe
          row-key="id"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column
            prop="id"
            label="ID"
            width="280"
            show-overflow-tooltip
          />
          <el-table-column
            prop="data"
            :label="t('editor.submissionView.colData')"
            min-width="300"
          >
            <template #default="{ row }">
              <el-tooltip
                :content="
                  dataKeys(row)
                    .map(
                      (key) =>
                        `${key}: ${typeof row.data[key] === 'object' ? JSON.stringify(row.data[key]) : String(row.data[key] ?? '')}`,
                    )
                    .join('\n')
                "
                placement="top"
                :show-after="500"
              >
                <span :class="styles.dataPreview">{{
                  dataPreview(row.data)
                }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column
            prop="status"
            :label="t('editor.common.status')"
            width="100"
          >
            <template #default="{ row }">
              <div :class="styles.statusCell">
                <span
                  :class="[
                    styles.statusDot,
                    styles[
                      `statusDot${row.status.charAt(0).toUpperCase()}${row.status.slice(1)}`
                    ],
                  ]"
                />
                <el-tag :type="statusTagType(row.status)" size="small">{{
                  statusLabel(row.status)
                }}</el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column
            prop="submitterId"
            :label="t('editor.submissionView.colSubmitter')"
            width="280"
            show-overflow-tooltip
          >
            <template #default="{ row }">
              {{ row.submitterId ?? "-" }}
            </template>
          </el-table-column>
          <el-table-column
            prop="createdAt"
            :label="t('editor.submissionView.colSubmitTime')"
            width="170"
          >
            <template #default="{ row }">
              {{ formatDate(row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column
            :label="t('editor.common.actions')"
            width="100"
            fixed="right"
          >
            <template #default="{ row }">
              <el-button
                type="danger"
                link
                size="small"
                @click="handleDelete(row)"
                >{{ t("editor.common.delete") }}</el-button
              >
            </template>
          </el-table-column>
        </el-table>

        <!-- Pagination -->
        <div v-if="total > 0" :class="styles.pagination">
          <el-pagination
            v-model:current-page="page"
            :page-size="pageSize"
            :total="total"
            layout="prev, pager, next"
            @current-change="handlePageChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>
