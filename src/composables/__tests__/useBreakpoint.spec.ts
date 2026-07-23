import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { useBreakpoint } from '../useBreakpoint'
import type { Breakpoint } from '../useBreakpoint'

// Mock matchMedia
function createMockMatchMedia(breakpoints: Record<string, boolean>) {
  return vi.fn().mockImplementation((query: string) => {
    // Parse min-width from query like "(min-width: 768px)"
    const match = query.match(/min-width:\s*(\d+)px/)
    const minWidth = match ? parseInt(match[1], 10) : 0
    const matches = Object.entries(breakpoints).some(([bp, val]) => {
      // Simply return the mocked value
      return query.includes(`${minWidth}px`) && val
    })
    return {
      matches,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }
  })
}

describe('useBreakpoint', () => {
  let originalMatchMedia: typeof window.matchMedia

  beforeEach(() => {
    originalMatchMedia = window.matchMedia
  })

  afterEach(() => {
    window.matchMedia = originalMatchMedia
  })

  it('returns a breakpoint value', () => {
    // Mock matchMedia to simulate a 1920px viewport (xxl)
    window.matchMedia = vi.fn().mockImplementation((query: string) => {
      const match = query.match(/min-width:\s*(\d+)px/)
      const minWidth = match ? parseInt(match[1], 10) : 0
      return {
        matches: 1920 >= minWidth,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }
    })

    const { breakpoint } = useBreakpoint()
    expect(['xs', 'sm', 'md', 'lg', 'xl', 'xxl']).toContain(breakpoint.value)
  })

  it('returns xxl for large viewport', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => {
      const match = query.match(/min-width:\s*(\d+)px/)
      const minWidth = match ? parseInt(match[1], 10) : 0
      return {
        matches: 1920 >= minWidth,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }
    })

    const { breakpoint } = useBreakpoint()
    expect(breakpoint.value).toBe('xxl')
  })

  it('returns md for 800px viewport', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => {
      const match = query.match(/min-width:\s*(\d+)px/)
      const minWidth = match ? parseInt(match[1], 10) : 0
      return {
        matches: 800 >= minWidth,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }
    })

    const { breakpoint } = useBreakpoint()
    expect(breakpoint.value).toBe('md')
  })

  it('returns xs for very small viewport', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => {
      const match = query.match(/min-width:\s*(\d+)px/)
      const minWidth = match ? parseInt(match[1], 10) : 0
      return {
        matches: 320 >= minWidth,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }
    })

    const { breakpoint } = useBreakpoint()
    expect(breakpoint.value).toBe('xs')
  })

  describe('resolveSpan', () => {
    it('returns number directly when span is a number', () => {
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: true,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }))

      const { resolveSpan } = useBreakpoint()
      expect(resolveSpan(12)).toBe(12)
      expect(resolveSpan(24)).toBe(24)
      expect(resolveSpan(6)).toBe(6)
    })

    it('returns matching breakpoint value from ResponsiveSpan', () => {
      window.matchMedia = vi.fn().mockImplementation((query: string) => {
        const match = query.match(/min-width:\s*(\d+)px/)
        const minWidth = match ? parseInt(match[1], 10) : 0
        return {
          matches: 1920 >= minWidth,
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }
      })

      const { resolveSpan } = useBreakpoint()
      // Current breakpoint is xxl
      expect(resolveSpan({ xxl: 8, xl: 12, lg: 24 })).toBe(8)
    })

    it('falls back to smaller breakpoint when current is not defined', () => {
      window.matchMedia = vi.fn().mockImplementation((query: string) => {
        const match = query.match(/min-width:\s*(\d+)px/)
        const minWidth = match ? parseInt(match[1], 10) : 0
        return {
          matches: 1920 >= minWidth,
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }
      })

      const { resolveSpan } = useBreakpoint()
      // Current breakpoint is xxl, but only lg is defined
      expect(resolveSpan({ lg: 12 })).toBe(12)
    })

    it('returns 24 when no breakpoints match', () => {
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: true,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }))

      const { resolveSpan } = useBreakpoint()
      expect(resolveSpan({})).toBe(24)
    })
  })
})
