import { describe, expect, it } from 'vitest'
import { groupCardsByStatus } from '../kanbanUtils'
import type { KanbanColumn } from '../config'

describe('kanbanUtils', () => {
  const columns: KanbanColumn[] = [
    { key: 'a', title: 'A', status: 'open' },
    { key: 'b', title: 'B', status: 'closed' },
  ]

  it('groups cards by status field', () => {
    const map = groupCardsByStatus(
      [
        { title: '1', status: 'open' },
        { title: '2', status: 'closed' },
      ],
      columns,
      'status',
    )
    expect(map.get('a')).toHaveLength(1)
    expect(map.get('b')).toHaveLength(1)
  })
})
