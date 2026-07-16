/**
 * useDataSource — Widget 数据源消费 composable
 *
 * 当 widget 的 api 配置包含 dataSourceId 时，委托给 DataSourceStore；
 * 否则返回 null，由调用方走原有 legacy 路径。
 */
import { ref, watch, onUnmounted, type Ref, type MaybeRefOrGetter, toValue } from 'vue'
import { useDataSourceStore } from '@/stores/dataSource'
import type { DictItem, SchemaApiConfig } from '@/widgets/base/types'

export interface UseDataSourceReturn {
  data: Ref<DictItem[]>
  loading: Ref<boolean>
  error: Ref<string>
  reload: () => Promise<void>
  /** 是否使用了全局数据源（false 表示应走 legacy 路径） */
  isGlobal: Ref<boolean>
}

export function useDataSource(
  apiConfig: MaybeRefOrGetter<SchemaApiConfig | undefined>,
): UseDataSourceReturn {
  const store = useDataSourceStore()
  const data = ref<DictItem[]>([])
  const loading = ref(false)
  const error = ref('')
  const isGlobal = ref(false)
  let unsubscribe: (() => void) | null = null

  function bind(config: SchemaApiConfig | undefined): void {
    unsubscribe?.()
    unsubscribe = null
    isGlobal.value = false

    if (!config?.dataSourceId) return

    isGlobal.value = true
    const dsId = config.dataSourceId

    unsubscribe = store.subscribe(dsId, (newData) => {
      data.value = newData as DictItem[]
    })

    const state = store.states.get(dsId)
    if (state?.data) data.value = state.data as DictItem[]
    loading.value = state?.loading ?? false
    error.value = state?.error ?? ''
  }

  watch(() => toValue(apiConfig), bind, { immediate: true })
  onUnmounted(() => unsubscribe?.())

  return {
    data,
    loading,
    error,
    isGlobal,
    reload: async () => {
      const config = toValue(apiConfig)
      if (config?.dataSourceId) await store.fetch(config.dataSourceId, true)
    },
  }
}
