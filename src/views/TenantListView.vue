<script setup lang="ts">
/**
 * TenantListView — 租户管理页
 *
 * 表格展示所有租户, 支持Search、StatusFilter、Min页、创建/Edit/启Disabled/Delete。
 */
import { onMounted, ref, computed, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useI18n } from "@schema-platform/platform-shared";
import { useTenantStore } from "@/stores/tenant";
import TenantFormDialog from "@/components/System/TenantFormDialog.vue";
import type { TenantItem, TenantStatus } from "@/types/tenant";
import styles from "./TenantListView.module.scss";
import AppIcon from "@schema-platform/platform-shared/components/common/AppIcon.vue";
import AppPagination from "@schema-platform/platform-shared/components/common/AppPagination.vue";

const { t } = useI18n();
const tenantStore = useTenantStore();

const searchInput = ref("");
let searchTimer: ReturnType<typeof setTimeout> | null = null;

const statusOptions = computed(() => [
  { label: t("editor.tenantView.allStatus"), value: "" },
  { label: t("editor.tenantView.statusActive"), value: "active" },
  { label: t("editor.tenantView.statusInactive"), value: "inactive" },
  { label: t("editor.tenantView.statusSuspended"), value: "suspended" },
]);

const activeStatus = ref<TenantStatus | "">("");

// ── DialogStatus ──
const formDialogVisible = ref(false);
const editingTenant = ref<TenantItem | null>(null);

// ── Data加载 ──
onMounted(() => {
  tenantStore.fetchTenants();
});

function handleSearch(val: string) {
  searchInput.value = val;
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    tenantStore.fetchTenants({
      search: val,
      status: activeStatus.value,
      page: 1,
    });
  }, 300);
}

watch(activeStatus, (val) => {
  tenantStore.fetchTenants({
    search: searchInput.value || undefined,
    status: val,
    page: 1,
  });
});

function handlePageChange(page: number) {
  tenantStore.fetchTenants({
    search: searchInput.value || undefined,
    status: activeStatus.value,
    page,
  });
}

/**
 * @param size - 每页条数
 */
function handleSizeChange(size: number) {
  tenantStore.fetchTenants({
    search: searchInput.value || undefined,
    status: activeStatus.value,
    page: 1,
    pageSize: size,
  });
}

// ── CRUD Action ──
function openCreateDialog() {
  editingTenant.value = null;
  formDialogVisible.value = true;
}

function openEditDialog(tenant: TenantItem) {
  editingTenant.value = tenant;
  formDialogVisible.value = true;
}

async function handleDelete(tenant: TenantItem) {
  try {
    await ElMessageBox.confirm(
      t("editor.tenantView.deleteConfirm", { name: tenant.name }),
      t("editor.tenantView.deleteConfirmTitle"),
      {
        confirmButtonText: t("editor.common.delete"),
        cancelButtonText: t("editor.common.cancel"),
        type: "warning",
      },
    );
    const ok = await tenantStore.deleteTenant(tenant.id);
    if (ok) ElMessage.success(t("editor.tenantView.deleted"));
    else
      ElMessage.error(tenantStore.error || t("editor.tenantView.deleteFailed"));
  } catch {
    // UserCancel
  }
}

async function handleToggleStatus(tenant: TenantItem) {
  const newStatus: TenantStatus =
    tenant.status === "active" ? "inactive" : "active";
  const actionLabel =
    newStatus === "active"
      ? t("editor.tenantView.statusActive")
      : t("editor.tenantView.statusInactive");
  try {
    await ElMessageBox.confirm(
      t("editor.tenantView.toggleConfirm", {
        action: actionLabel,
        name: tenant.name,
      }),
      t("editor.tenantView.toggleConfirmTitle", { action: actionLabel }),
      {
        confirmButtonText: actionLabel,
        cancelButtonText: t("editor.common.cancel"),
        type: "info",
      },
    );
    const result = await tenantStore.toggleTenantStatus(tenant.id, newStatus);
    if (result)
      ElMessage.success(
        t("editor.tenantView.toggled", { action: actionLabel }),
      );
    else
      ElMessage.error(
        tenantStore.error ||
          t("editor.tenantView.toggleFailed", { action: actionLabel }),
      );
  } catch {
    // UserCancel
  }
}

function handleSaved() {
  tenantStore.fetchTenants({
    search: searchInput.value || undefined,
    status: activeStatus.value,
  });
}

// ── 辅助函数 ──
function formatDate(d: string): string {
  return new Date(d).toLocaleString("zh-CN");
}

function statusLabel(status: TenantStatus): string {
  const map: Record<TenantStatus, string> = {
    active: t("editor.tenantView.statusActive"),
    inactive: t("editor.tenantView.statusInactive"),
    suspended: t("editor.tenantView.statusSuspended"),
  };
  return map[status];
}

function statusTagType(status: TenantStatus): "success" | "info" | "warning" {
  const map: Record<TenantStatus, "success" | "info" | "warning"> = {
    active: "success",
    inactive: "info",
    suspended: "warning",
  };
  return map[status];
}
</script>

<template>
  <div :class="styles.tenantView">
    <div :class="styles.scrollbar">
      <!-- Header -->
      <div :class="styles.header">
        <div :class="styles.titleRow">
          <div>
            <h1 :class="styles.title">{{ t("editor.tenantView.title") }}</h1>
            <p :class="styles.subtitle">
              {{ t("editor.tenantView.subtitle") }}
            </p>
          </div>
          <div :class="styles.headerActions">
            <el-button type="primary" @click="openCreateDialog">
              <AppIcon name="plus" />
              {{ t("editor.tenantView.createTenant") }}
            </el-button>
          </div>
        </div>

        <!-- Toolbar -->
        <div :class="styles.toolbar">
          <div :class="styles.toolbarLeft">
            <el-input
              v-model="searchInput"
              :placeholder="t('editor.tenantView.searchPlaceholder')"
              clearable
              :class="styles.searchInput"
              @input="handleSearch"
              @clear="handleSearch('')"
            >
              <template #prefix>
                <AppIcon name="search" />
              </template>
            </el-input>
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

      <!-- Loading -->
      <div
        v-if="tenantStore.loading && !tenantStore.hasTenants"
        :class="styles.tableWrapper"
      >
        <el-skeleton :rows="8" animated />
      </div>

      <!-- Empty -->
      <div v-else-if="tenantStore.isEmpty" :class="styles.emptyState">
        <div :class="styles.emptyIcon">
          <AppIcon name="user" :size="64" />
        </div>
        <h2 :class="styles.emptyTitle">
          {{ t("editor.tenantView.emptyTitle") }}
        </h2>
        <p :class="styles.emptyDesc">{{ t("editor.tenantView.emptyDesc") }}</p>
        <el-button type="primary" @click="openCreateDialog">
          <AppIcon name="plus" />
          {{ t("editor.tenantView.createTenant") }}
        </el-button>
      </div>

      <!-- Table -->
      <div v-else :class="styles.tableWrapper">
        <el-table :data="tenantStore.tenants" stripe row-key="id">
          <el-table-column
            prop="name"
            :label="t('editor.tenantView.colName')"
            min-width="160"
            show-overflow-tooltip
          />
          <el-table-column
            prop="code"
            :label="t('editor.tenantView.colCode')"
            min-width="140"
            show-overflow-tooltip
          >
            <template #default="{ row }">
              <el-tag size="small">{{ row.code }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column
            prop="status"
            :label="t('editor.common.status')"
            width="100"
          >
            <template #default="{ row }">
              <div :class="styles.stateCell">
                <span
                  :class="[
                    styles.stateDot,
                    styles[
                      `stateDot${row.status.charAt(0).toUpperCase()}${row.status.slice(1)}`
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
            prop="maxUsers"
            :label="t('editor.tenantView.colMaxUsers')"
            width="100"
            align="center"
          >
            <template #default="{ row }">
              {{ row.config.maxUsers }}
            </template>
          </el-table-column>
          <el-table-column
            prop="features"
            :label="t('editor.tenantView.colFeatures')"
            min-width="180"
          >
            <template #default="{ row }">
              <div :class="styles.featureTags">
                <template v-if="row.config.features.length">
                  <el-tag
                    v-for="feat in row.config.features"
                    :key="feat"
                    size="small"
                    :class="styles.featureTag"
                    >{{ feat }}</el-tag
                  >
                </template>
                <span v-else :class="styles.placeholderDash">-</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column
            prop="createdAt"
            :label="t('editor.common.createdAt')"
            width="170"
          >
            <template #default="{ row }">
              {{ formatDate(row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column
            :label="t('editor.common.actions')"
            width="200"
            fixed="right"
          >
            <template #default="{ row }">
              <el-button
                size="small"
                type="primary"
                link
                @click="openEditDialog(row)"
                >{{ t("editor.common.edit") }}</el-button
              >
              <el-button
                size="small"
                :type="row.status === 'active' ? 'warning' : 'success'"
                link
                @click="handleToggleStatus(row)"
              >
                {{
                  row.status === "active"
                    ? t("editor.tenantView.statusInactive")
                    : t("editor.tenantView.statusActive")
                }}
              </el-button>
              <el-button
                size="small"
                type="danger"
                link
                @click="handleDelete(row)"
                >{{ t("editor.common.delete") }}</el-button
              >
            </template>
          </el-table-column>
        </el-table>

        <!-- Pagination -->
        <AppPagination
          v-model:current-page="tenantStore.pagination.page"
          v-model:page-size="tenantStore.pagination.pageSize"
          :total="tenantStore.pagination.total"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </div>

    <!-- Create/Edit Dialog -->
    <TenantFormDialog
      v-model:visible="formDialogVisible"
      :initial-data="editingTenant"
      @saved="handleSaved"
    />
  </div>
</template>
