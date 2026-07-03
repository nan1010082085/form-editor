<script setup lang="ts">
import { inject, computed, ref, onMounted } from 'vue'
import { widgetDataKey } from '../base/types'
import './style.module.scss'
import { useWidgetRenderState } from '../../composables/useWidgetRenderState'
import { useExposeWidget } from '../../composables/useExposeWidget'
import { apiClient } from '../../utils/apiClient'
import { WIDGET_SURFACE_KEY, type WidgetSurface } from '../base/widgetMock'

import { useWidgetControlSize } from '../../composables/useWidgetControlSize'

const widgetData = inject(widgetDataKey)!
const surface = inject(WIDGET_SURFACE_KEY, 'runtime' as WidgetSurface)
const { isDisabled } = useWidgetRenderState()
const { controlStyle: dynamicStyle } = useWidgetControlSize(40)

interface UserItem {
  _id: string
  username: string
  displayName: string
}

const options = ref<UserItem[]>([])
const loading = ref(false)

const EDITOR_MOCK_USERS: UserItem[] = [
  { _id: 'mock-u1', username: 'zhangsan', displayName: '张三' },
  { _id: 'mock-u2', username: 'lisi', displayName: '李四' },
  { _id: 'mock-u3', username: 'wangwu', displayName: '王五' },
]

onMounted(() => {
  if (surface === 'editor') {
    options.value = EDITOR_MOCK_USERS
  }
})

useExposeWidget((wd) => ({
  get value() { return wd.value.defaultValue },
  get label() {
    const val = wd.value.defaultValue
    if (!val) return ''
    const found = options.value.find(u => u._id === val)
    return found?.displayName ?? found?.username ?? ''
  },
}))

const selectRef = ref<{ $el?: HTMLElement }>()

function forwardNativeChange() {
  selectRef.value?.$el?.dispatchEvent(new Event('change', { bubbles: true }))
}

async function remoteSearch(query: string) {
  if (surface === 'editor') {
    const q = query.trim().toLowerCase()
    options.value = q
      ? EDITOR_MOCK_USERS.filter(
          (u) =>
            u.displayName.toLowerCase().includes(q) ||
            u.username.toLowerCase().includes(q),
        )
      : EDITOR_MOCK_USERS
    return
  }

  if (!query) {
    options.value = []
    return
  }
  loading.value = true
  try {
    const res = await apiClient.requestUrl('get', '/api/users', { q: query, pageSize: 20 })
    const data = res as Record<string, unknown>
    const result = data.data as Record<string, unknown> | undefined
    options.value = (result?.items as UserItem[]) ?? []
  } catch {
    options.value = []
  } finally {
    loading.value = false
  }
}

function getUserLabel(user: UserItem): string {
  return user.displayName ? `${user.displayName}(${user.username})` : user.username
}
</script>

<template>
  <el-select
    ref="selectRef"
    v-model="widgetData.defaultValue"
    :style="dynamicStyle"
    :placeholder="(widgetData.props?.placeholder as string) || '请选择用户'"
    :disabled="isDisabled"
    :clearable="(widgetData.props?.clearable as boolean) ?? true"
    :multiple="(widgetData.props?.multiple as boolean) || false"
    filterable
    remote
    :remote-method="remoteSearch"
    :loading="loading"
    @change="forwardNativeChange"
  >
    <el-option
      v-for="user in options"
      :key="user._id"
      :label="getUserLabel(user)"
      :value="user._id"
    />
  </el-select>
</template>
