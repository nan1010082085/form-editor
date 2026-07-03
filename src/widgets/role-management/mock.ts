import type { TableWidgetMock } from '../base/widgetMock'

export const roleManagementMock: TableWidgetMock = {
  kind: 'table',
  total: 3,
  rows: [
    {
      _id: 'r001',
      name: '系统管理员',
      description: '拥有全部系统权限',
      permissions: ['user:read', 'user:write', 'role:read', 'role:write'],
      data_scope: 'all',
      dept_ids: [],
      createdAt: '2026-01-10T08:00:00.000Z',
      updatedAt: '2026-06-15T12:00:00.000Z',
    },
    {
      _id: 'r002',
      name: '部门主管',
      description: '管理本部门数据',
      permissions: ['user:read', 'dept:read'],
      data_scope: 'dept',
      dept_ids: ['dept-rd'],
      createdAt: '2026-02-20T09:30:00.000Z',
      updatedAt: '2026-06-10T15:20:00.000Z',
    },
    {
      _id: 'r003',
      name: '普通用户',
      description: '只读访问',
      permissions: ['user:read'],
      data_scope: 'self',
      dept_ids: [],
      createdAt: '2026-03-08T10:45:00.000Z',
      updatedAt: '2026-05-25T11:30:00.000Z',
    },
  ],
}
