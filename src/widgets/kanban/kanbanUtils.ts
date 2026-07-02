import type { KanbanColumn } from './config'

export function groupCardsByStatus<T extends Record<string, unknown>>(
  cards: T[],
  columns: KanbanColumn[],
  statusField: string,
): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const col of columns) {
    map.set(col.key, [])
  }
  for (const card of cards) {
    const status = String(card[statusField] ?? '')
    const col = columns.find((c) => c.status === status) ?? columns[0]
    if (!col) continue
    map.get(col.key)!.push(card)
  }
  return map
}
