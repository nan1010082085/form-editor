/** 将画布上指定部件滚动到可见区域 */
export function scrollToWidget(id: string): void {
  const el = document.querySelector(`[data-widget-id="${id}"]`) as HTMLElement | null
  el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
}

/** 将结构树当前节点滚动到可见区域 */
export function scrollTreeNodeIntoView(treeRoot: HTMLElement | undefined, nodeId: string): void {
  if (!treeRoot) return
  const current = treeRoot.querySelector(`[data-key="${nodeId}"]`) as HTMLElement | null
    ?? treeRoot.querySelector('.is-current') as HTMLElement | null
  current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
}
