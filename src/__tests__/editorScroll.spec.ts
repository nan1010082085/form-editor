import { describe, it, expect } from 'vitest'
import { scrollToWidget, scrollTreeNodeIntoView } from '@/utils/editorScroll'

describe('editorScroll', () => {
  it('scrollToWidget calls scrollIntoView on matching element', () => {
    const el = document.createElement('div')
    el.setAttribute('data-widget-id', 'w1')
    let called = false
    el.scrollIntoView = () => { called = true }
    document.body.append(el)

    scrollToWidget('w1')
    expect(called).toBe(true)
    el.remove()
  })

  it('scrollTreeNodeIntoView finds is-current node', () => {
    const root = document.createElement('div')
    const current = document.createElement('div')
    current.className = 'is-current'
    let called = false
    current.scrollIntoView = () => { called = true }
    root.append(current)

    scrollTreeNodeIntoView(root, 'any')
    expect(called).toBe(true)
  })
})
