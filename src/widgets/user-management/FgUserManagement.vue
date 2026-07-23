<script setup lang="ts">
import { inject, computed, ref, reactive, onMounted, watch } from 'vue'
import { useI18n } from '@schema-platform/platform-shared'
import { ElMessage, ElMessageBox } from 'element-plus'
import { widgetDataKey, widgetStyleKey } from '../base/types'
import type { Widget } from '../base/types'
import { useWidgetRenderState } from '../../composables/useWidgetRenderState'
import { useExposeWidget } from '../../composables/useExposeWidget'
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  type UserItem,
  type CreateUserPayload,
} from '../../api/userApi'
import {
  WIDGET_SURFACE_KEY,
  getTableRowsFromMock,
} from '../base/widgetMock'
import styles from './style.module.scss'

const { t } = useI18n()

// ---- Inject ----
const widgetData = inject(widgetDataKey)!
const widgetStyle = inject(widgetStyleKey)!
const surface = inject(WIDGET_SURFACE_KEY, 'runtime')
const { isDisabled } = useWidgetRenderState()

// ---- State ----
const loading = ref(false)
const tableData = ref<UserItem[]>([])
const total = ref(0)
const currentPage = ref(1)
const searchQuery = ref('')
const selectedRows = ref<UserItem[]>([])

// ---- Dialog state ----
const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const editingUserId = ref<string>('')
const resetPwdVisible = ref(false)
const resetPwdTarget = ref<UserItem | null>(null)
const resetPwdValue = ref('')

const formRef = ref()
const resetFormRef = ref()

const formData = reactive<CreateUserPayload>({
  username: '',
  password: '',
  displayName: '',
  phone: '',
  email: '',
  deptId: '',
  status: 'active',
})

// ---- Props ----
const tableColumns = computed(() => {
  const cols = widgetData.value.props?.tableColumns as string[] | undefined
  return cols ?? ['username', 'displayName', 'deptId', 'phone', 'status', 'createdAt']
})

const pageSize = computed(() => {
  return (widgetData.value.props?.pageSize as number) || 20
})

const searchable = computed(() => {
  return (widgetData.value.props?.searchable as boolean) !== false
})

// ---- Column definitions ----
interface ColumnDef {
  prop: string
  label: string
  width?: number
  minWidth?: number
}

const ALL_COLUMNS: Record<string, ColumnDef> = {
  username: { prop: 'username', label: 'Username', width: 120 },
  displayName: { prop: 'displayName', label: 'Nickname', width: 120 },
  deptId: { prop: 'deptId', label: 'Department', width: 120 },
  phone: { prop: 'phone', label: 'Phone', width: 140 },
  status: { prop: 'status', label: 'Status', width: 80 },
  createdAt: { prop: 'createdAt', label: 'Created At', width: 180 },
}

const COLUMN_I18N_KEYS: Record<string, string> = {
  username: 'col_username',
  displayName: 'col_displayName',
  deptId: 'col_deptId',
  phone: 'col_phone',
  status: 'col_status',
  createdAt: 'col_createdAt',
}

const visibleColumns = computed(() => {
  return tableColumns.value.map(key => {
    const col = ALL_COLUMNS[key]
    if (!col) return null as any
    const i18nKey = COLUMN_I18N_KEYS[key]
    return i18nKey ? { ...col, label: t(`editor.userManagement.${i18nKey}`) } : col
  }).filter(Boolean)
})

// ---- Form rules ----
const formRules = computed(() => ({
  username: [{ required: true, message: t('editor.userManagement.enterUsername'), trigger: 'blur' }],
  password: [{ required: true, message: t('editor.userManagement.enterPassword'), trigger: 'blur' }],
  displayName: [{ required: true, message: t('editor.userManagement.enterNickname'), trigger: 'blur' }],
}))

const resetPwdRules = computed(() => ({
  password: [
    { required: true, message: t('editor.userManagement.enterNewPassword'), trigger: 'blur' },
    { min: 6, message: t('editor.userManagement.passwordMinLength'), trigger: 'blur' },
  ],
}))

// ---- API ----
function applyEditorMock(): boolean {
  if (surface !== 'editor') return false
  const mock = getTableRowsFromMock('user-management')
  if (!mock) return false
  tableData.value = mock.rows as UserItem[]
  total.value = mock.total
  return true
}

async function loadData() {
  loading.value = true
  try {
    const res = await fetchUsers({
      q: searchQuery.value || undefined,
      page: currentPage.value,
      pageSize: String(pageSize.value),
    })
    tableData.value = res.data.items
    total.value = res.data.total
  } catch (err) {
    if (applyEditorMock()) return
    ElMessage.error(t('editor.userManagement.loadUserListFailed'))
  } finally {
    loading.value = false
  }
}

// ---- Search ----
let searchTimer: ReturnType<typeof setTimeout> | null = null
function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    loadData()
  }, 300)
}

// ---- Pagination ----
function onPageChange(page: number) {
  currentPage.value = page
  loadData()
}

function onSizeChange(size: number) {
  currentPage.value = 1
  loadData()
}

// ---- Selection ----
function onSelectionChange(rows: UserItem[]) {
  selectedRows.value = rows
}

// ---- Add / Edit ----
function openAddDialog() {
  dialogMode.value = 'add'
  editingUserId.value = ''
  Object.assign(formData, {
    username: '',
    password: '',
    displayName: '',
    phone: '',
    email: '',
    deptId: '',
    status: 'active',
  })
  dialogVisible.value = true
}

function openEditDialog(row: UserItem) {
  dialogMode.value = 'edit'
  editingUserId.value = row._id
  Object.assign(formData, {
    username: row.username,
    password: '',
    displayName: row.displayName,
    phone: row.phone ?? '',
    email: row.email ?? '',
    deptId: row.deptId ?? '',
    status: row.status,
  })
  dialogVisible.value = true
}

async function submitForm() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  try {
    if (dialogMode.value === 'add') {
      await createUser(formData)
      ElMessage.success(t('editor.userManagement.userCreated'))
    } else {
      const { password: _, ...updates } = formData
      await updateUser(editingUserId.value, updates)
      ElMessage.success(t('editor.userManagement.userUpdated'))
    }
    dialogVisible.value = false
    loadData()
  } catch (err) {
    ElMessage.error(dialogMode.value === 'add' ? t('editor.userManagement.createFailed') : t('editor.userManagement.updateFailed'))
  }
}

// ---- Delete ----
async function handleDelete(row: UserItem) {
  try {
    await ElMessageBox.confirm(t('editor.userManagement.confirmDeleteUser'), t('editor.common.info'), {
      confirmButtonText: t('editor.common.confirm'),
      cancelButtonText: t('editor.common.cancel'),
      type: 'warning',
    })
    await deleteUser(row._id)
    ElMessage.success(t('editor.userManagement.deleteSuccess'))
    loadData()
  } catch {
    // user cancelled
  }
}

// ---- Reset Password ----
function openResetPwd(row: UserItem) {
  resetPwdTarget.value = row
  resetPwdValue.value = ''
  resetPwdVisible.value = true
}

async function submitResetPwd() {
  try {
    await resetFormRef.value?.validate()
  } catch {
    return
  }
  if (!resetPwdTarget.value) return
  try {
    await resetUserPassword(resetPwdTarget.value._id, resetPwdValue.value)
    ElMessage.success(t('editor.userManagement.passwordResetSuccess'))
    resetPwdVisible.value = false
  } catch {
    ElMessage.error(t('editor.userManagement.passwordResetFailed'))
  }
}

// ---- Format ----
function formatTime(val: string | undefined): string {
  if (!val) return '-'
  const d = new Date(val)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ---- Expose ----
useExposeWidget((wd: { value: Widget }) => ({
  get loading() { return loading.value },
  get tableData() { return tableData.value },
  get total() { return total.value },
  get selectedRows() { return selectedRows.value },
}))

// ---- Watch props changes ----
watch(() => widgetData.value.props?.pageSize, () => {
  currentPage.value = 1
  loadData()
})

// ---- Lifecycle ----
onMounted(() => {
  loadData()
})
</script>

<template>
  <div :class="styles.container">
    <!-- Search Bar -->
    <div v-if="searchable" :class="styles.searchBar">
      <el-input
        v-model="searchQuery"
        :class="styles.searchInput"
        :placeholder="t('editor.userManagement.searchPlaceholder')"
        clearable
        @input="onSearchInput"
      />
      <el-button type="primary" @click="openAddDialog" :disabled="isDisabled">
        {{ t('editor.userManagement.addUser') }}
      </el-button>
    </div>
    <div v-else :class="styles.searchBar">
      <el-button type="primary" @click="openAddDialog" :disabled="isDisabled">
        {{ t('editor.userManagement.addUser') }}
      </el-button>
    </div>

    <!-- Table -->
    <div :class="styles.tableWrap">
      <el-table
        :data="tableData"
        :loading="loading"
        stripe
        border
        style="width: 100%"
        @selection-change="onSelectionChange"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column
          v-for="col in visibleColumns"
          :key="col.prop"
          :prop="col.prop"
          :label="col.label"
          :width="col.width"
          :min-width="col.minWidth"
        >
          <template #default="{ row }">
            <el-tag
              v-if="col.prop === 'status'"
              :type="row.status === 'active' ? 'success' : 'danger'"
              size="small"
            >
              {{ row.status === 'active' ? t('editor.userManagement.enabled') : t('editor.userManagement.disabled') }}
            </el-tag>
            <span v-else-if="col.prop === 'createdAt'">
              {{ formatTime(row.createdAt) }}
            </span>
            <span v-else>{{ row[col.prop] ?? '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('editor.userManagement.actions')" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openEditDialog(row)">
              {{ t('editor.common.edit') }}
            </el-button>
            <el-button type="warning" link size="small" @click="openResetPwd(row)">
              {{ t('editor.userManagement.resetPassword') }}
            </el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">
              {{ t('editor.common.delete') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Pagination -->
    <div :class="styles.pagination">
      <el-pagination
        :current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="onPageChange"
        @size-change="onSizeChange"
      />
    </div>

    <!-- Add/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'add' ? t('editor.userManagement.addUserTitle') : t('editor.userManagement.editUserTitle')"
      width="560px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="dialogMode === 'add' ? formRules : { ...formRules, password: undefined }"
        label-width="80px"
        :class="styles.formGrid"
      >
        <el-form-item :label="t('editor.userManagement.col_username')" prop="username" :class="styles.fullWidth">
          <el-input
            v-model="formData.username"
            :disabled="dialogMode === 'edit'"
            :placeholder="t('editor.userManagement.enterUsername')"
          />
        </el-form-item>
        <el-form-item
          v-if="dialogMode === 'add'"
          :label="t('editor.userManagement.password')"
          prop="password"
          :class="styles.fullWidth"
        >
          <el-input
            v-model="formData.password"
            type="password"
            show-password
            :placeholder="t('editor.userManagement.enterPassword')"
          />
        </el-form-item>
        <el-form-item :label="t('editor.userManagement.col_displayName')" prop="displayName">
          <el-input v-model="formData.displayName" :placeholder="t('editor.userManagement.enterNickname')" />
        </el-form-item>
        <el-form-item :label="t('editor.userManagement.col_phone')" prop="phone">
          <el-input v-model="formData.phone" :placeholder="t('editor.userManagement.enterPhone')" />
        </el-form-item>
        <el-form-item :label="t('editor.userManagement.email')" prop="email">
          <el-input v-model="formData.email" :placeholder="t('editor.userManagement.enterEmail')" />
        </el-form-item>
        <el-form-item :label="t('editor.userManagement.col_deptId')" prop="deptId">
          <el-input v-model="formData.deptId" :placeholder="t('editor.userManagement.enterDepartment')" />
        </el-form-item>
        <el-form-item :label="t('editor.userManagement.col_status')" prop="status" :class="styles.fullWidth">
          <el-select v-model="formData.status" :placeholder="t('editor.userManagement.selectStatus')">
            <el-option :label="t('editor.userManagement.enabled')" value="active" />
            <el-option :label="t('editor.userManagement.disabled')" value="inactive" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ t('editor.common.cancel') }}</el-button>
        <el-button type="primary" @click="submitForm">{{ t('editor.common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- Reset Password Dialog -->
    <el-dialog
      v-model="resetPwdVisible"
      :title="t('editor.userManagement.resetPasswordTitle')"
      width="400px"
      destroy-on-close
    >
      <el-form
        ref="resetFormRef"
        :model="{ password: resetPwdValue }"
        :rules="resetPwdRules"
        label-width="80px"
      >
        <el-form-item :label="t('editor.userManagement.user')">
          <span>{{ resetPwdTarget?.displayName }}（{{ resetPwdTarget?.username }}）</span>
        </el-form-item>
        <el-form-item :label="t('editor.userManagement.newPassword')" prop="password">
          <el-input
            v-model="resetPwdValue"
            type="password"
            show-password
            :placeholder="t('editor.userManagement.enterNewPasswordHint')"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetPwdVisible = false">{{ t('editor.common.cancel') }}</el-button>
        <el-button type="primary" @click="submitResetPwd">{{ t('editor.common.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>
