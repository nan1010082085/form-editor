/** E-35 — 列模板库（常用业务台账配方） */
import type { AdvancedTableColumn } from './config'

export interface ColumnPreset {
  id: string
  label: string
  columns: AdvancedTableColumn[]
}

export const COLUMN_PRESETS: ColumnPreset[] = [
  {
    id: 'leave-ledger',
    label: '请假台账',
    columns: [
      { prop: '_id', label: '单号', minWidth: 120, render: 'link', linkEvent: 'open-detail' },
      { prop: 'submitterName', label: '申请人', minWidth: 100, render: 'text' },
      { prop: 'data.leaveType', label: '假别', minWidth: 90, render: 'tag', filterable: true },
      { prop: 'data.days', label: '天数', width: 80, align: 'center', render: 'text' },
      { prop: 'status', label: '状态', minWidth: 100, render: 'tag', filterable: true },
      { prop: 'flowStatus', label: '流程状态', minWidth: 110, render: 'flowStatus' },
      { prop: 'createdAt', label: '申请时间', minWidth: 160, render: 'text' },
      {
        prop: 'action',
        label: '操作',
        width: 120,
        fixed: 'right',
        render: 'buttons',
        buttons: [{ key: 'view', label: '查看', type: 'primary', size: 'small', icon: 'view' }],
      },
    ],
  },
  {
    id: 'expense-ledger',
    label: '报销台账',
    columns: [
      { prop: '_id', label: '报销单号', minWidth: 120, render: 'link', linkEvent: 'open-detail' },
      { prop: 'submitterName', label: '申请人', minWidth: 100, render: 'text' },
      { prop: 'data.totalAmount', label: '金额', minWidth: 100, align: 'right', render: 'text' },
      { prop: 'status', label: '状态', minWidth: 100, render: 'tag', filterable: true },
      { prop: 'flowStatus', label: '流程', minWidth: 100, render: 'flowStatus' },
      { prop: 'createdAt', label: '时间', minWidth: 160, render: 'text' },
      {
        prop: 'action',
        label: '操作',
        width: 120,
        fixed: 'right',
        render: 'buttons',
        buttons: [{ key: 'view', label: '查看', type: 'primary', size: 'small' }],
      },
    ],
  },
  {
    id: 'audit-issues',
    label: '审计问题',
    columns: [
      { prop: 'code', label: '问题编号', minWidth: 120, render: 'link', linkEvent: 'open-detail' },
      { prop: 'severity', label: '严重程度', minWidth: 100, render: 'tag', filterable: true },
      { prop: 'description', label: '描述', minWidth: 200, render: 'text', showTooltip: true },
      { prop: 'ownerDept', label: '责任单位', minWidth: 120, render: 'text' },
      { prop: 'status', label: '整改状态', minWidth: 100, render: 'tag', filterable: true },
      {
        prop: 'action',
        label: '操作',
        width: 120,
        fixed: 'right',
        render: 'buttons',
        buttons: [{ key: 'view', label: '查看', type: 'primary', size: 'small' }],
      },
    ],
  },
]
