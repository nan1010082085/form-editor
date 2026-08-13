<script setup lang="ts">
/**
 * CredentialListView -- Credential management page
 *
 * Table display with search, type filter, pagination, create/edit/delete.
 */
import { computed, onMounted, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useCredentialStore } from "@/stores/credential";
import CredentialFormDialog from "@/components/Credential/CredentialFormDialog.vue";
import type {
  CredentialItem,
  CredentialDetail,
  CredentialType,
} from "@/types/credential";
import {
  getCredentialTypeLabel,
} from "@/types/credential";
import styles from "./CredentialListView.module.scss";
import AppIcon from "@schema-platform/platform-shared/components/common/AppIcon.vue";
import AppPagination from "@schema-platform/platform-shared/components/common/AppPagination.vue";
import EmptyState from "@/components/common/EmptyState.vue";
import { useI18n } from "@schema-platform/platform-shared";

const credentialStore = useCredentialStore();
const { t, locale } = useI18n();

const searchInput = ref("");
let searchTimer: ReturnType<typeof setTimeout> | null = null;

const credentialTypes: CredentialType[] = [
  "api_key",
  "basic_auth",
  "bearer_token",
];

const typeOptions = computed(() => [
  { label: t("editor.credential.allTypes"), value: "" as const },
  ...credentialTypes.map((value) => ({
    label: getCredentialTypeLabel(value, t),
    value,
  })),
]);

const activeType = ref<CredentialType | "">("");

// Dialog state
const formDialogVisible = ref(false);
const editingCredential = ref<CredentialDetail | null>(null);

// Data loading
onMounted(() => {
  credentialStore.fetchCredentials();
});

function handleSearch(val: string) {
  searchInput.value = val;
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    credentialStore.fetchCredentials({
      search: val,
      type: activeType.value,
      page: 1,
    });
  }, 300);
}

watch(activeType, (val) => {
  credentialStore.fetchCredentials({
    search: searchInput.value || undefined,
    type: val,
    page: 1,
  });
});

function handlePageChange(page: number) {
  credentialStore.fetchCredentials({
    search: searchInput.value || undefined,
    type: activeType.value,
    page,
  });
}

/**
 * @param size - 每页条数
 */
function handleSizeChange(size: number) {
  credentialStore.fetchCredentials({
    search: searchInput.value || undefined,
    type: activeType.value,
    page: 1,
    pageSize: size,
  });
}

// CRUD operations
function openCreateDialog() {
  editingCredential.value = null;
  formDialogVisible.value = true;
}

async function openEditDialog(credential: CredentialItem) {
  const detail = await credentialStore.fetchCredentialById(credential.id);
  if (detail) {
    editingCredential.value = detail;
    formDialogVisible.value = true;
  } else {
    ElMessage.error(
      credentialStore.error || t("editor.credential.fetchDetailFailed"),
    );
  }
}

async function handleDelete(credential: CredentialItem) {
  try {
    await ElMessageBox.confirm(
      t("editor.credential.deleteConfirm", { name: credential.name }),
      t("editor.credential.deleteConfirmTitle"),
      {
        confirmButtonText: t("editor.common.delete"),
        cancelButtonText: t("editor.common.cancel"),
        type: "warning",
      },
    );
    const ok = await credentialStore.deleteCredential(credential.id);
    if (ok) ElMessage.success(t("editor.credential.deleteSuccess"));
    else
      ElMessage.error(
        credentialStore.error || t("editor.credential.deleteFailed"),
      );
  } catch {
    // user cancelled
  }
}

function handleSaved() {
  credentialStore.fetchCredentials({
    search: searchInput.value || undefined,
    type: activeType.value,
  });
}

/** Format date string using current i18n locale. */
function formatDate(d: string): string {
  return new Date(d).toLocaleString(
    locale.value === "zh-CN" ? "zh-CN" : "en-US",
  );
}

function typeLabel(type: CredentialType): string {
  return getCredentialTypeLabel(type, t);
}

function typeTagType(
  type: CredentialType,
): "" | "success" | "warning" | "info" {
  const map: Record<CredentialType, "" | "success" | "warning" | "info"> = {
    api_key: "success",
    basic_auth: "info",
    bearer_token: "warning",
  };
  return map[type];
}
</script>

<template>
  <div :class="styles.credentialView">
    <div :class="styles.scrollbar">
      <!-- Header -->
      <div :class="styles.header">
        <div :class="styles.titleRow">
          <div>
            <h1 :class="styles.title">{{ t("editor.credential.title") }}</h1>
            <p :class="styles.subtitle">
              {{ t("editor.credential.subtitle") }}
            </p>
          </div>
          <div :class="styles.headerActions">
            <el-button type="primary" @click="openCreateDialog">
              <AppIcon name="plus" />
              {{ t("editor.credential.create") }}
            </el-button>
          </div>
        </div>

        <!-- Toolbar -->
        <div :class="styles.toolbar">
          <div :class="styles.toolbarLeft">
            <el-input
              v-model="searchInput"
              :placeholder="t('editor.credential.searchPlaceholder')"
              clearable
              :class="styles.searchInput"
              @input="handleSearch"
              @clear="handleSearch('')"
            >
              <template #prefix><AppIcon name="search" /></template>
            </el-input>
            <el-select v-model="activeType" :class="styles.typeSelect">
              <el-option
                v-for="opt in typeOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div
        v-if="credentialStore.loading && !credentialStore.hasCredentials"
        :class="styles.tableWrapper"
      >
        <el-skeleton :rows="8" animated />
      </div>

      <!-- Empty -->
      <EmptyState
        v-else-if="credentialStore.isEmpty"
        icon="key"
        :title="t('editor.credential.emptyTitle')"
        :description="t('editor.credential.emptyDesc')"
      >
        <el-button type="primary" @click="openCreateDialog">
          <AppIcon name="plus" />
          {{ t("editor.credential.create") }}
        </el-button>
      </EmptyState>

      <!-- Table -->
      <div v-else :class="styles.tableWrapper">
        <el-table
          :data="credentialStore.credentials"
          stripe
          row-key="id"
          :class="styles.table"
        >
          <el-table-column
            prop="name"
            :label="t('editor.credential.colName')"
            min-width="200"
            show-overflow-tooltip
          />
          <el-table-column
            prop="type"
            :label="t('editor.credential.colType')"
            width="140"
          >
            <template #default="{ row }">
              <el-tag :type="typeTagType(row.type)" size="small">{{
                typeLabel(row.type)
              }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column
            prop="createdAt"
            :label="t('editor.credential.colCreated')"
            width="170"
          >
            <template #default="{ row }">
              {{ formatDate(row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column
            prop="updatedAt"
            :label="t('editor.credential.colUpdated')"
            width="170"
          >
            <template #default="{ row }">
              {{ formatDate(row.updatedAt) }}
            </template>
          </el-table-column>
          <el-table-column
            :label="t('editor.credential.colActions')"
            width="150"
            fixed="right"
            align="center"
          >
            <template #default="{ row }">
              <el-button link type="primary" @click="openEditDialog(row)">{{
                t("editor.credential.edit")
              }}</el-button>
              <el-button link type="danger" @click="handleDelete(row)">{{
                t("editor.credential.delete")
              }}</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- Pagination -->
        <AppPagination
          v-model:current-page="credentialStore.pagination.page"
          v-model:page-size="credentialStore.pagination.pageSize"
          :total="credentialStore.pagination.total"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </div>

    <!-- Create/Edit Dialog -->
    <CredentialFormDialog
      v-model:visible="formDialogVisible"
      :initial-data="editingCredential"
      @saved="handleSaved"
    />
  </div>
</template>
