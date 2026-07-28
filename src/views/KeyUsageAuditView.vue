<script setup lang="ts">
/**
 * KeyUsageAuditView — Key 使用审计页
 *
 * 展示 API Key 的使用记录和统计信息。
 * 支持按 Key 和按工作流统计。
 */
import { onMounted, ref, computed, watch } from "vue";
import { ElMessage } from "element-plus";
import { useI18n } from "@schema-platform/platform-shared";
import {
  fetchKeyUsageLogs,
  fetchKeyUsageStatsByKey,
  fetchKeyUsageStatsByWorkflow,
} from "@/api/dataApi";
import type {
  KeyUsageLogItem,
  KeyUsageStatsByKey,
  KeyUsageStatsByWorkflow,
} from "@/api/dataApi";
import type { PaginatedResponse } from "@/types/api";
import styles from "./KeyUsageAuditView.module.scss";
import AppIcon from "@schema-platform/platform-shared/components/common/AppIcon.vue";

const { t } = useI18n();

// ── 状态 ──
const activeTab = ref<"logs" | "by-key" | "by-workflow">("logs");
const loading = ref(false);
const dateRange = ref<[string, string] | null>(null);

// 日志列表
const logs = ref<KeyUsageLogItem[]>([]);
const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0,
});

// 按 Key 统计
const statsByKey = ref<KeyUsageStatsByKey[]>([]);

// 按工作流统计
const statsByWorkflow = ref<KeyUsageStatsByWorkflow[]>([]);

// ── 计算属性 ──
const totalRequests = computed(() => {
  if (activeTab.value === "by-key") {
    return statsByKey.value.reduce((sum, s) => sum + s.totalRequests, 0);
  }
  if (activeTab.value === "by-workflow") {
    return statsByWorkflow.value.reduce((sum, s) => sum + s.totalRequests, 0);
  }
  return pagination.value.total;
});

const successRate = computed(() => {
  let total = 0;
  let success = 0;
  const source =
    activeTab.value === "by-key" ? statsByKey.value : statsByWorkflow.value;
  for (const s of source) {
    total += s.totalRequests;
    success += s.successRequests;
  }
  if (total === 0) return 0;
  return Math.round((success / total) * 100);
});

const avgDuration = computed(() => {
  const source =
    activeTab.value === "by-key" ? statsByKey.value : statsByWorkflow.value;
  if (source.length === 0) return 0;
  const totalDuration = source.reduce(
    (sum, s) => sum + s.avgDuration * s.totalRequests,
    0,
  );
  const totalRequests = source.reduce((sum, s) => sum + s.totalRequests, 0);
  if (totalRequests === 0) return 0;
  return Math.round(totalDuration / totalRequests);
});

// ── 数据加载 ──
async function loadLogs(): Promise<void> {
  loading.value = true;
  try {
    const params: Record<string, string | number> = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
    };
    if (dateRange.value) {
      params.startDate = dateRange.value[0];
      params.endDate = dateRange.value[1];
    }
    const result: PaginatedResponse<KeyUsageLogItem> =
      await fetchKeyUsageLogs(params);
    logs.value = result.items;
    pagination.value.total = result.total;
    pagination.value.totalPages = result.totalPages;
  } catch (e: unknown) {
    ElMessage.error(
      e instanceof Error ? e.message : t("editor.keyUsageAudit.loadLogsFailed"),
    );
  } finally {
    loading.value = false;
  }
}

async function loadStatsByKey(): Promise<void> {
  loading.value = true;
  try {
    const params: Record<string, string> = {};
    if (dateRange.value) {
      params.startDate = dateRange.value[0];
      params.endDate = dateRange.value[1];
    }
    statsByKey.value = await fetchKeyUsageStatsByKey(params);
  } catch (e: unknown) {
    ElMessage.error(
      e instanceof Error
        ? e.message
        : t("editor.keyUsageAudit.loadStatsFailed"),
    );
  } finally {
    loading.value = false;
  }
}

async function loadStatsByWorkflow(): Promise<void> {
  loading.value = true;
  try {
    const params: Record<string, string> = {};
    if (dateRange.value) {
      params.startDate = dateRange.value[0];
      params.endDate = dateRange.value[1];
    }
    statsByWorkflow.value = await fetchKeyUsageStatsByWorkflow(params);
  } catch (e: unknown) {
    ElMessage.error(
      e instanceof Error
        ? e.message
        : t("editor.keyUsageAudit.loadStatsFailed"),
    );
  } finally {
    loading.value = false;
  }
}

function loadData(): void {
  if (activeTab.value === "logs") {
    loadLogs();
  } else if (activeTab.value === "by-key") {
    loadStatsByKey();
  } else {
    loadStatsByWorkflow();
  }
}

onMounted(() => {
  loadData();
});

watch(activeTab, () => {
  pagination.value.page = 1;
  loadData();
});

watch(dateRange, () => {
  pagination.value.page = 1;
  loadData();
});

function handlePageChange(page: number): void {
  pagination.value.page = page;
  loadLogs();
}

function formatDate(d: string | null): string {
  if (!d) return "-";
  return new Date(d).toLocaleString("zh-CN");
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function methodTagType(method: string): string {
  const map: Record<string, string> = {
    GET: "info",
    POST: "success",
    PUT: "warning",
    PATCH: "warning",
    DELETE: "danger",
  };
  return map[method] || "info";
}

function statusCodeClass(code: number): string {
  if (code < 400) return styles.successText;
  return styles.errorText;
}

function clearDateRange(): void {
  dateRange.value = null;
}
</script>

<template>
  <div :class="styles.auditView">
    <el-scrollbar :class="styles.scrollbar">
      <!-- Header -->
      <div :class="styles.header">
        <div :class="styles.titleRow">
          <div>
            <h1 :class="styles.title">{{ t("editor.keyUsageAudit.title") }}</h1>
            <p :class="styles.subtitle">
              {{ t("editor.keyUsageAudit.subtitle") }}
            </p>
          </div>
          <div :class="styles.headerActions">
            <el-button @click="loadData">
              <AppIcon name="refresh" />
              {{ t("editor.keyUsageAudit.refresh") }}
            </el-button>
          </div>
        </div>

        <!-- Toolbar -->
        <div :class="styles.toolbar">
          <div :class="styles.toolbarLeft">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              :range-separator="t('editor.keyUsageAudit.dateRangeSeparator')"
              :start-placeholder="t('editor.keyUsageAudit.dateRangeStart')"
              :end-placeholder="t('editor.keyUsageAudit.dateRangeEnd')"
              :class="styles.dateRange"
              value-format="YYYY-MM-DD"
            />
            <el-button v-if="dateRange" text @click="clearDateRange">{{
              t("editor.keyUsageAudit.clearDate")
            }}</el-button>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div :class="styles.statsCards">
        <div :class="styles.statCard">
          <p :class="styles.statLabel">
            {{ t("editor.keyUsageAudit.totalRequests") }}
          </p>
          <p :class="styles.statValue">{{ totalRequests.toLocaleString() }}</p>
        </div>
        <div :class="styles.statCard">
          <p :class="styles.statLabel">
            {{ t("editor.keyUsageAudit.successRate") }}
          </p>
          <p :class="styles.statValue">{{ successRate }}%</p>
        </div>
        <div :class="styles.statCard">
          <p :class="styles.statLabel">
            {{ t("editor.keyUsageAudit.avgDuration") }}
          </p>
          <p :class="styles.statValue">{{ formatDuration(avgDuration) }}</p>
        </div>
      </div>

      <!-- Tabs -->
      <div :class="styles.tabContainer">
        <el-tabs v-model="activeTab">
          <el-tab-pane :label="t('editor.keyUsageAudit.tabLogs')" name="logs" />
          <el-tab-pane
            :label="t('editor.keyUsageAudit.tabByKey')"
            name="by-key"
          />
          <el-tab-pane
            :label="t('editor.keyUsageAudit.tabByWorkflow')"
            name="by-workflow"
          />
        </el-tabs>
      </div>

      <!-- Loading -->
      <div v-if="loading" :class="styles.tableWrapper">
        <el-skeleton :rows="8" animated />
      </div>

      <!-- Logs Table -->
      <div v-else-if="activeTab === 'logs'" :class="styles.tableWrapper">
        <div v-if="logs.length === 0" :class="styles.emptyState">
          <div :class="styles.emptyIcon">
            <AppIcon name="document" :size="64" />
          </div>
          <h2 :class="styles.emptyTitle">
            {{ t("editor.keyUsageAudit.emptyLogTitle") }}
          </h2>
          <p :class="styles.emptyDesc">
            {{ t("editor.keyUsageAudit.emptyLogDesc") }}
          </p>
        </div>

        <template v-else>
          <el-table :data="logs" stripe>
            <el-table-column
              prop="keyName"
              :label="t('editor.keyUsageAudit.colKeyName')"
              min-width="120"
              show-overflow-tooltip
            />
            <el-table-column
              prop="method"
              :label="t('editor.keyUsageAudit.colMethod')"
              width="80"
            >
              <template #default="{ row }">
                <el-tag :type="methodTagType(row.method)" size="small">{{
                  row.method
                }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column
              prop="endpoint"
              :label="t('editor.keyUsageAudit.colEndpoint')"
              min-width="200"
              show-overflow-tooltip
            />
            <el-table-column
              prop="statusCode"
              :label="t('editor.keyUsageAudit.colStatusCode')"
              width="80"
            >
              <template #default="{ row }">
                <span :class="statusCodeClass(row.statusCode)">{{
                  row.statusCode
                }}</span>
              </template>
            </el-table-column>
            <el-table-column
              prop="duration"
              :label="t('editor.keyUsageAudit.colDuration')"
              width="80"
            >
              <template #default="{ row }">
                {{ formatDuration(row.duration) }}
              </template>
            </el-table-column>
            <el-table-column
              prop="workflowName"
              :label="t('editor.keyUsageAudit.colWorkflow')"
              min-width="120"
              show-overflow-tooltip
            >
              <template #default="{ row }">
                {{ row.workflowName || "-" }}
              </template>
            </el-table-column>
            <el-table-column prop="ip" label="IP" width="130" />
            <el-table-column
              prop="createdAt"
              :label="t('editor.keyUsageAudit.colTime')"
              width="170"
            >
              <template #default="{ row }">
                {{ formatDate(row.createdAt) }}
              </template>
            </el-table-column>
          </el-table>

          <div v-if="pagination.total > 0" :class="styles.pagination">
            <el-pagination
              v-model:current-page="pagination.page"
              :page-size="pagination.pageSize"
              :total="pagination.total"
              layout="prev, pager, next"
              @current-change="handlePageChange"
            />
          </div>
        </template>
      </div>

      <!-- Stats by Key Table -->
      <div v-else-if="activeTab === 'by-key'" :class="styles.tableWrapper">
        <div v-if="statsByKey.length === 0" :class="styles.emptyState">
          <div :class="styles.emptyIcon">
            <AppIcon name="key" :size="64" />
          </div>
          <h2 :class="styles.emptyTitle">
            {{ t("editor.keyUsageAudit.emptyStatsTitle") }}
          </h2>
          <p :class="styles.emptyDesc">
            {{ t("editor.keyUsageAudit.emptyStatsDesc") }}
          </p>
        </div>

        <el-table v-else :data="statsByKey" stripe>
          <el-table-column
            prop="keyName"
            :label="t('editor.keyUsageAudit.colKeyName')"
            min-width="150"
            show-overflow-tooltip
          />
          <el-table-column
            prop="totalRequests"
            :label="t('editor.keyUsageAudit.colTotalRequests')"
            width="100"
            align="right"
            sortable
          />
          <el-table-column
            prop="successRequests"
            :label="t('editor.keyUsageAudit.colSuccess')"
            width="100"
            align="right"
            sortable
          >
            <template #default="{ row }">
              <span :class="styles.successText">{{ row.successRequests }}</span>
            </template>
          </el-table-column>
          <el-table-column
            prop="failedRequests"
            :label="t('editor.keyUsageAudit.colFailed')"
            width="100"
            align="right"
            sortable
          >
            <template #default="{ row }">
              <span :class="styles.errorText">{{ row.failedRequests }}</span>
            </template>
          </el-table-column>
          <el-table-column
            :label="t('editor.keyUsageAudit.successRate')"
            width="100"
            align="right"
          >
            <template #default="{ row }">
              {{
                row.totalRequests > 0
                  ? Math.round((row.successRequests / row.totalRequests) * 100)
                  : 0
              }}%
            </template>
          </el-table-column>
          <el-table-column
            prop="avgDuration"
            :label="t('editor.keyUsageAudit.avgDuration')"
            width="100"
            align="right"
          >
            <template #default="{ row }">
              {{ formatDuration(row.avgDuration) }}
            </template>
          </el-table-column>
          <el-table-column
            prop="lastUsedAt"
            :label="t('editor.keyUsageAudit.colLastUsed')"
            width="170"
          >
            <template #default="{ row }">
              {{ formatDate(row.lastUsedAt) }}
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- Stats by Workflow Table -->
      <div v-else-if="activeTab === 'by-workflow'" :class="styles.tableWrapper">
        <div v-if="statsByWorkflow.length === 0" :class="styles.emptyState">
          <div :class="styles.emptyIcon">
            <AppIcon name="connection" :size="64" />
          </div>
          <h2 :class="styles.emptyTitle">
            {{ t("editor.keyUsageAudit.emptyWorkflowTitle") }}
          </h2>
          <p :class="styles.emptyDesc">
            {{ t("editor.keyUsageAudit.emptyWorkflowDesc") }}
          </p>
        </div>

        <el-table v-else :data="statsByWorkflow" stripe>
          <el-table-column
            prop="workflowName"
            :label="t('editor.keyUsageAudit.colWorkflow')"
            min-width="150"
            show-overflow-tooltip
          />
          <el-table-column
            prop="keyName"
            :label="t('editor.keyUsageAudit.colKeyName')"
            min-width="120"
            show-overflow-tooltip
          />
          <el-table-column
            prop="totalRequests"
            :label="t('editor.keyUsageAudit.colTotalRequests')"
            width="100"
            align="right"
            sortable
          />
          <el-table-column
            prop="successRequests"
            :label="t('editor.keyUsageAudit.colSuccess')"
            width="100"
            align="right"
            sortable
          >
            <template #default="{ row }">
              <span :class="styles.successText">{{ row.successRequests }}</span>
            </template>
          </el-table-column>
          <el-table-column
            prop="failedRequests"
            :label="t('editor.keyUsageAudit.colFailed')"
            width="100"
            align="right"
            sortable
          >
            <template #default="{ row }">
              <span :class="styles.errorText">{{ row.failedRequests }}</span>
            </template>
          </el-table-column>
          <el-table-column
            :label="t('editor.keyUsageAudit.successRate')"
            width="100"
            align="right"
          >
            <template #default="{ row }">
              {{
                row.totalRequests > 0
                  ? Math.round((row.successRequests / row.totalRequests) * 100)
                  : 0
              }}%
            </template>
          </el-table-column>
          <el-table-column
            prop="avgDuration"
            :label="t('editor.keyUsageAudit.avgDuration')"
            width="100"
            align="right"
          >
            <template #default="{ row }">
              {{ formatDuration(row.avgDuration) }}
            </template>
          </el-table-column>
          <el-table-column
            prop="lastUsedAt"
            :label="t('editor.keyUsageAudit.colLastUsed')"
            width="170"
          >
            <template #default="{ row }">
              {{ formatDate(row.lastUsedAt) }}
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-scrollbar>
  </div>
</template>
