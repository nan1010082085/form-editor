import type { WidgetConfig, EventTargetConfig, Widget } from '../base/types'
import type {
  ActionButton,
  AdvancedTableColumn,
  AdvPaginationConfig,
  AdvSelectionConfig,
  SearchBarConfig,
} from '../advanced-table/config'
import type { DescriptionItemConfig } from '../descriptions/config'

export interface CrudPageActions {
  applyNavigatePath?: string
  approveNavigatePath?: string
  export?: {
    apiUrl: string
    filename: string
  }
}

export interface CrudDetailDialogConfig {
  title?: string
  detailApiUrl: string
  descriptionItems: DescriptionItemConfig[]
  showFlowTimeline?: boolean
  confirmNavigatePath?: string
  confirmText?: string
}

/** 新增/编辑弹窗字段 */
export interface CrudFormFieldSchema {
  field: string
  label: string
  type?: 'input' | 'number' | 'select' | 'textarea' | 'switch' | 'date' | 'radio'
  required?: boolean
  span?: number
  placeholder?: string
  options?: Array<{ label: string; value: string | number }>
  defaultValue?: unknown
  hiddenOnCreate?: boolean
  hiddenOnEdit?: boolean
}

/** 新增/编辑弹窗配置 */
export interface CrudFormDialogConfig {
  title?: string
  createTitle?: string
  editTitle?: string
  width?: string
  fields: CrudFormFieldSchema[]
  createApiUrl?: string
  updateApiUrl?: string
  recordIdField?: string
}

export const crudListPageConfig: WidgetConfig = {
  name: 'FgCrudListPage',
  displayName: 'CRUD 台账页',
  description: 'JeecgBoot useListPage 对标：搜索 + 工具栏 + 表格 + 内置详情弹窗，props 驱动，无需手写 Board 事件链',
  author: 'yangdongnan',
  defaultStyle: {
    width: '100%',
    height: '780px',
  },
  defaultProps: {
    columns: [
      { prop: 'applicantName', label: '申请人', minWidth: 100, render: 'text' },
      { prop: 'status', label: '状态', minWidth: 100, render: 'flowStatus' },
      { prop: 'reason', label: '事由', minWidth: 180, render: 'text', showTooltip: true },
      {
        prop: 'action',
        label: '操作',
        width: 160,
        fixed: 'right',
        render: 'buttons',
        buttons: [
          { key: 'view', label: '查看', type: 'primary', size: 'small' },
          { key: 'edit', label: '编辑', type: 'default', size: 'small' },
          { key: 'approve', label: '审批', type: 'success', size: 'small' },
        ],
      },
    ] as AdvancedTableColumn[],
    toolbar: [
      { key: 'add', label: '发起申请', type: 'primary', icon: 'plus' },
      { key: 'export', label: '导出 Excel', type: 'default', icon: 'download' },
    ] as ActionButton[],
    stripe: true,
    border: true,
    height: 680,
    sortable: false,
    serverSideFilter: true,
    pagination: {
      enabled: true,
      pageSize: 20,
      pageSizes: [10, 20, 50, 100],
    } as AdvPaginationConfig,
    selection: { enabled: false } as AdvSelectionConfig,
    searchBar: {
      enabled: true,
      fields: [],
    } as SearchBarConfig,
    pageActions: {} as CrudPageActions,
    detailDialog: {
      title: '申请详情',
      detailApiUrl: '',
      descriptionItems: [],
      showFlowTimeline: true,
      confirmText: '全屏审批',
    } as CrudDetailDialogConfig,
    formDialog: {
      createTitle: '新增',
      editTitle: '编辑',
      width: '640px',
      fields: [
        { field: 'applicantName', label: '申请人', type: 'input', required: true, span: 24 },
        { field: 'reason', label: '事由', type: 'textarea', span: 24 },
        { field: 'status', label: '状态', type: 'select', span: 24, options: [
          { label: '审批中', value: 'submitted' },
          { label: '已通过', value: 'approved' },
          { label: '已驳回', value: 'rejected' },
        ] },
      ],
      createApiUrl: '',
      updateApiUrl: '',
      recordIdField: '_id',
    } as CrudFormDialogConfig,
  },
  exposedValues: [
    { key: 'loading', type: 'boolean', description: '加载状态' },
    { key: 'tableData', type: 'array', description: '表格数据' },
    { key: 'selectedRows', type: 'array', description: '选中行' },
  ],
  configPanels: ['events', 'api', 'variables'],
  receivableEvents: [
    { name: 'refresh', description: '重新加载列表' },
    { name: 'set-search-params', description: '设置搜索参数', params: { params: '参数对象' } },
  ],
  eventTargets: (widget: Widget): EventTargetConfig[] => {
    const targets: EventTargetConfig[] = [
      { id: 'row-click', label: '行点击' },
      { id: 'selection-change', label: '选择变化' },
    ]
    const toolbar = (widget.props?.toolbar as ActionButton[]) || []
    for (const btn of toolbar) {
      targets.push({ id: `toolbar-${btn.key}`, label: `工具栏: ${btn.label}` })
    }
    const columns = (widget.props?.columns as AdvancedTableColumn[]) || []
    const seenRowKeys = new Set<string>()
    for (const col of columns) {
      if (col.render === 'buttons' && col.buttons) {
        for (const btn of col.buttons) {
          if (!seenRowKeys.has(btn.key)) {
            seenRowKeys.add(btn.key)
            targets.push({ id: `row-${btn.key}`, label: `行按钮: ${btn.label}` })
          }
        }
      }
      if (col.render === 'link') {
        targets.push({ id: `link-${col.prop}`, label: `链接: ${col.label}` })
      }
    }
    return targets
  },
  propertyPanel: {
    basic: ['label'],
    style: [],
    props: [
      { key: 'columns', label: '列配置', type: 'advanced-columns' },
      { key: 'toolbar', label: '工具栏按钮', type: 'action-buttons' },
      { key: 'searchBar.enabled', label: '搜索区', type: 'switch' },
      { key: 'searchBar.fields', label: '搜索字段', type: 'search-fields' },
      { key: 'selection.enabled', label: '行选择', type: 'switch' },
      { key: 'stripe', label: '斑马纹', type: 'switch' },
      { key: 'border', label: '边框', type: 'switch' },
      { key: 'height', label: '表格高度', type: 'number' },
      { key: 'pagination.enabled', label: '分页', type: 'switch' },
      { key: 'pagination.pageSize', label: '每页条数', type: 'number' },
      { key: 'pageActions.applyNavigatePath', label: '发起申请路径', type: 'text' },
      { key: 'pageActions.export.apiUrl', label: '导出 API', type: 'text' },
      { key: 'pageActions.export.filename', label: '导出文件名', type: 'text' },
      { key: 'pageActions.approveNavigatePath', label: '审批页路径', type: 'text' },
      { key: 'detailDialog.title', label: '详情弹窗标题', type: 'text' },
      { key: 'detailDialog.detailApiUrl', label: '详情 API', type: 'text' },
      { key: 'detailDialog.showFlowTimeline', label: '审批时间线', type: 'switch' },
      { key: 'detailDialog.confirmNavigatePath', label: '全屏审批路径', type: 'text' },
      { key: 'detailDialog.confirmText', label: '全屏审批按钮', type: 'text' },
      { key: 'formDialog.createApiUrl', label: '新增 API', type: 'text' },
      { key: 'formDialog.updateApiUrl', label: '更新 API', type: 'text' },
      { key: 'formDialog.fields', label: '表单字段', type: 'crud-form-fields' },
      { key: 'formDialog.width', label: '弹窗宽度', type: 'text' },
    ],
  },
}
