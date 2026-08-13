<script setup lang="ts">
/**
 * VersionHistoryDialog — Version历史Dialog
 *
 * 展示 Schema 的历史VersionColumn表, 标记发布Version, 支持加载和发布特定Version。
 */
import { ref, watch } from "vue";
import { useI18n } from "@schema-platform/platform-shared";
import { DEFAULT_PAGE_SIZE } from "@schema-platform/platform-shared/utils/pagination";
import { ElMessage, ElMessageBox } from "element-plus";
import { fetchVersions, publishSchema, deleteVersion } from "@/api/schemaApi";
import type { VersionEntry } from "@/types/api";
import AppIcon from "@schema-platform/platform-shared/components/common/AppIcon.vue";
import AppPagination from "@schema-platform/platform-shared/components/common/AppPagination.vue";
import AppDialog from "@schema-platform/platform-shared/components/common/AppDialog.vue";
import styles from "./VersionHistoryDialog.module.scss";

const { t, locale } = useI18n();

const props = defineProps<{
  visible: boolean;
  /** Schema 的 MongoDB ObjectId（用于 publish/delete 等写Action） */
  id: string | null;
  /** Schema 的 editId（用于VersionQuery等读Action） */
  editId: string | null;
  currentVersion?: string;
  schemaName?: string;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  "load-version": [version: string];
  published: [];
}>();

const versions = ref<VersionEntry[]>([]);
const loading = ref(false);
const publishingVersion = ref<string | null>(null);
const deletingVersion = ref<string | null>(null);
const currentPage = ref(1);
const pageSize = ref(DEFAULT_PAGE_SIZE);
const total = ref(0);

async function loadVersions(page = 1) {
  if (!props.editId) return;
  loading.value = true;
  currentPage.value = page;
  try {
    const res = await fetchVersions(props.editId, page, pageSize.value);
    versions.value = res.items ?? [];
    total.value = res.total ?? 0;
  } catch {
    ElMessage.error(t("editor.versionHistory.loadFailed"));
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.visible,
  (val) => {
    if (val) loadVersions();
  },
);

function handlePageChange(page: number) {
  loadVersions(page);
}

/**
 * @param size - 每页条数
 */
function handleSizeChange(size: number) {
  pageSize.value = size;
  loadVersions(1);
}

function handleLoadVersion(version: string) {
  emit("load-version", version);
  emit("update:visible", false);
}

async function handlePublishVersion(version: string) {
  if (!props.id) return;
  publishingVersion.value = version;
  try {
    const result = await publishSchema(props.id, version);
    if (result) {
      ElMessage.success(t("editor.versionHistory.publishSuccess", { version }));
      emit("published");
      loadVersions(currentPage.value);
    } else {
      ElMessage.error(t("editor.versionHistory.publishFailed"));
    }
  } catch {
    ElMessage.error(t("editor.versionHistory.publishFailed"));
  } finally {
    publishingVersion.value = null;
  }
}

async function handleDeleteVersion(version: string) {
  if (!props.id) return;
  try {
    await ElMessageBox.confirm(
      t("editor.versionHistory.deleteConfirmMessage", {
        version: formatVersion(version),
      }),
      t("editor.versionHistory.deleteConfirmTitle"),
      {
        confirmButtonText: t("editor.versionHistory.delete"),
        cancelButtonText: t("editor.common.cancel"),
        type: "warning",
      },
    );
  } catch {
    return;
  }
  deletingVersion.value = version;
  try {
    await deleteVersion(props.id, version);
    ElMessage.success(t("editor.versionHistory.deleted"));
    loadVersions(currentPage.value);
  } catch {
    ElMessage.error(t("editor.versionHistory.deleteFailed"));
  } finally {
    deletingVersion.value = null;
  }
}

function formatVersion(v: string) {
  const num = parseInt(v, 10);
  return isNaN(num) ? v : `v${num}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleString(
    locale.value === "zh-CN" ? "zh-CN" : "en-US",
  );
}

function tableRowClassName({ row }: { row: VersionEntry }) {
  if (row.published) return styles["version-history__row-published"];
  return "";
}
</script>

<template>
  <AppDialog
    :model-value="visible"
    @update:model-value="emit('update:visible', $event)"
    :title="t('editor.versionHistory.title', { name: schemaName || '' })"
    width="700px"
  >
    <div v-if="loading" :class="styles['version-history__loading']">
      <AppIcon name="loading" :class="styles['version-history__spinning']" />
      <span>{{ t("editor.versionHistory.loading") }}</span>
    </div>

    <div
      v-else-if="versions.length === 0"
      :class="styles['version-history__empty']"
    >
      {{ t("editor.versionHistory.noVersions") }}
    </div>

    <template v-else>
      <el-table
        :data="versions"
        stripe
        size="small"
        :row-class-name="tableRowClassName"
        row-key="version"
      >
        <el-table-column
          prop="version"
          :label="t('editor.versionHistory.versionColumn')"
          min-width="200"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <span
              :class="{
                [styles['version-history__current']]:
                  row.version === currentVersion,
                [styles['version-history__published']]: row.published,
              }"
            >
              {{ formatVersion(row.version) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column
          prop="status"
          :label="t('editor.versionHistory.statusColumn')"
          width="120"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <div :class="styles['version-history__status-cell']">
              <el-tag
                v-if="row.version === currentVersion"
                type="primary"
                size="small"
                effect="plain"
                >{{ t("editor.versionHistory.statusCurrent") }}</el-tag
              >
              <el-tag v-if="row.published" type="success" size="small">{{
                t("editor.versionHistory.statusPublished")
              }}</el-tag>
              <el-tag
                v-if="!row.published && row.version !== currentVersion"
                type="info"
                size="small"
                effect="plain"
                >{{ t("editor.versionHistory.statusDraft") }}</el-tag
              >
            </div>
          </template>
        </el-table-column>

        <el-table-column
          prop="createdAt"
          :label="t('editor.versionHistory.createdAtColumn')"
          width="180"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>

        <el-table-column
          :label="t('editor.versionHistory.actionsColumn')"
          width="200"
          align="center"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              v-if="row.version !== currentVersion"
              type="primary"
              link
              size="small"
              @click="handleLoadVersion(row.version)"
            >
              {{ t("editor.versionHistory.load") }}
            </el-button>
            <el-button
              v-if="!row.published"
              type="success"
              link
              size="small"
              :loading="publishingVersion === row.version"
              @click="handlePublishVersion(row.version)"
            >
              {{ t("editor.versionHistory.publish") }}
            </el-button>
            <el-button
              v-if="row.version !== currentVersion"
              type="danger"
              link
              size="small"
              :loading="deletingVersion === row.version"
              @click="handleDeleteVersion(row.version)"
            >
              {{ t("editor.versionHistory.delete") }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <AppPagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        size="small"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </template>

    <template #footer>
      <el-button @click="emit('update:visible', false)">{{
        t("editor.common.close")
      }}</el-button>
    </template>
  </AppDialog>
</template>
