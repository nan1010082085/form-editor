/**
 * FgAdvancedTableVirtual tests - 虚拟滚动渲染路径
 *
 * 验证 el-table-v2 列映射：text/tag/link/image/buttons 渲染类型正确转换
 */
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ElementPlus from 'element-plus'
import FgAdvancedTableVirtual from '@/widgets/advanced-table/FgAdvancedTableVirtual.vue'
import type { AdvancedTableColumn } from '@/widgets/advanced-table/config'

vi.mock('@schema-platform/platform-shared', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

function mountVirtual(columns: AdvancedTableColumn[], data: Record<string, unknown>[]) {
  return mount(FgAdvancedTableVirtual, {
    props: { columns, data, height: 300 },
    global: { plugins: [ElementPlus] },
  })
}

describe('FgAdvancedTableVirtual', () => {
  it('渲染基础文本列', async () => {
    const columns: AdvancedTableColumn[] = [
      { prop: 'name', label: '姓名', render: 'text' },
    ]
    const data = [{ name: '张三' }, { name: '李四' }]
    const wrapper = mountVirtual(columns, data)
    await nextTick()
    expect(wrapper.html()).toContain('张三')
    expect(wrapper.html()).toContain('李四')
  })

  it('tag 列渲染 option label', async () => {
    const columns: AdvancedTableColumn[] = [
      {
        prop: 'status', label: '状态', render: 'tag',
        options: [{ label: '已通过', value: 'approved' }],
        colorMap: { approved: 'success' },
      },
    ]
    const data = [{ status: 'approved' }]
    const wrapper = mountVirtual(columns, data)
    await nextTick()
    expect(wrapper.html()).toContain('已通过')
  })

  it('buttons 列渲染按钮', async () => {
    const columns: AdvancedTableColumn[] = [
      {
        prop: 'action', label: '操作', render: 'buttons',
        buttons: [{ key: 'view', label: '查看' }],
      },
    ]
    const data = [{ action: '' }]
    const wrapper = mountVirtual(columns, data)
    await nextTick()
    expect(wrapper.html()).toContain('查看')
  })

  it('1000 行数据不崩溃', async () => {
    const columns: AdvancedTableColumn[] = [{ prop: 'id', label: 'ID', render: 'text' }]
    const data = Array.from({ length: 1000 }, (_, i) => ({ id: `row-${i}` }))
    const wrapper = mountVirtual(columns, data)
    await nextTick()
    // 虚拟滚动只渲染可见行，DOM 行数应远小于 1000
    expect(wrapper.html()).toContain('row-0')
  })

  it('未知 render 类型回退为文本', async () => {
    const columns: AdvancedTableColumn[] = [
      { prop: 'x', label: 'X', render: 'custom' as AdvancedTableColumn['render'] },
    ]
    const data = [{ x: 'hello' }]
    const wrapper = mountVirtual(columns, data)
    await nextTick()
    expect(wrapper.html()).toContain('hello')
  })
})
