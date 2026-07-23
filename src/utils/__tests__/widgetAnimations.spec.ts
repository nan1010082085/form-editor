import { describe, it, expect } from 'vitest'
import {
  ANIMATION_PRESETS,
  ANIMATION_OPTIONS,
  ANIMATION_KEYFRAMES,
  getAnimationStyle,
} from '../widgetAnimations'

describe('widgetAnimations', () => {
  describe('ANIMATION_PRESETS', () => {
    it('should contain all expected presets', () => {
      const names = Object.keys(ANIMATION_PRESETS)
      expect(names).toContain('none')
      expect(names).toContain('fadeIn')
      expect(names).toContain('slideUp')
      expect(names).toContain('slideDown')
      expect(names).toContain('slideLeft')
      expect(names).toContain('slideRight')
      expect(names).toContain('scaleIn')
      expect(names).toContain('bounceIn')
      expect(names).toContain('rotateIn')
      expect(names).toHaveLength(9)
    })

    it('none preset should have empty css', () => {
      expect(ANIMATION_PRESETS.none.css).toBe('')
      expect(ANIMATION_PRESETS.none.label).toBe('无')
    })

    it('non-none presets should have non-empty css', () => {
      for (const [name, preset] of Object.entries(ANIMATION_PRESETS)) {
        if (name === 'none') continue
        expect(preset.css).toBeTruthy()
        expect(preset.css).toContain('animation:')
        expect(preset.css).toContain('ease-out')
        expect(preset.css).toContain('forwards')
      }
    })

    it('each preset should have a label', () => {
      for (const preset of Object.values(ANIMATION_PRESETS)) {
        expect(preset.label).toBeTruthy()
        expect(typeof preset.label).toBe('string')
      }
    })
  })

  describe('ANIMATION_OPTIONS', () => {
    it('should be an array of label/value pairs', () => {
      expect(Array.isArray(ANIMATION_OPTIONS)).toBe(true)
      expect(ANIMATION_OPTIONS.length).toBe(Object.keys(ANIMATION_PRESETS).length)
      for (const opt of ANIMATION_OPTIONS) {
        expect(opt).toHaveProperty('label')
        expect(opt).toHaveProperty('value')
      }
    })

    it('should have "none" as first option', () => {
      expect(ANIMATION_OPTIONS[0].value).toBe('none')
      expect(ANIMATION_OPTIONS[0].label).toBe('无')
    })
  })

  describe('ANIMATION_KEYFRAMES', () => {
    it('should contain all keyframe definitions', () => {
      expect(ANIMATION_KEYFRAMES).toContain('@keyframes widgetFadeIn')
      expect(ANIMATION_KEYFRAMES).toContain('@keyframes widgetSlideUp')
      expect(ANIMATION_KEYFRAMES).toContain('@keyframes widgetSlideDown')
      expect(ANIMATION_KEYFRAMES).toContain('@keyframes widgetSlideLeft')
      expect(ANIMATION_KEYFRAMES).toContain('@keyframes widgetSlideRight')
      expect(ANIMATION_KEYFRAMES).toContain('@keyframes widgetScaleIn')
      expect(ANIMATION_KEYFRAMES).toContain('@keyframes widgetBounceIn')
      expect(ANIMATION_KEYFRAMES).toContain('@keyframes widgetRotateIn')
    })

    it('should only use opacity and transform (no layout properties)', () => {
      // Extract CSS property names from keyframe body using regex
      // Matches "property-name:" patterns, excluding keyframe selectors
      const propRegex = /\b(opacity|transform)\s*:/g
      const allPropsRegex = /\b([a-z][a-z-]*)\s*:/g
      const keyframeSelectors = new Set(['from', 'to'])

      // First verify all declared properties are allowed
      let match: RegExpExecArray | null
      while ((match = allPropsRegex.exec(ANIMATION_KEYFRAMES)) !== null) {
        const propName = match[1]
        if (keyframeSelectors.has(propName)) continue
        if (/^\d+$/.test(propName)) continue // percentage like "50"
        expect(['opacity', 'transform']).toContain(propName)
      }

      // Also verify opacity and transform are actually used
      expect(ANIMATION_KEYFRAMES).toMatch(/opacity\s*:/)
      expect(ANIMATION_KEYFRAMES).toMatch(/transform\s*:/)
    })
  })

  describe('getAnimationStyle', () => {
    it('should return empty string for undefined preset', () => {
      expect(getAnimationStyle(undefined, undefined, undefined)).toBe('')
    })

    it('should return empty string for "none" preset', () => {
      expect(getAnimationStyle('none', undefined, undefined)).toBe('')
    })

    it('should return empty string for unknown preset', () => {
      expect(getAnimationStyle('unknownPreset', undefined, undefined)).toBe('')
    })

    it('should return CSS for valid preset', () => {
      const result = getAnimationStyle('fadeIn', undefined, undefined)
      expect(result).toContain('animation: widgetFadeIn')
      expect(result).toContain('0.6s')
    })

    it('should add animation-delay when delay is provided', () => {
      const result = getAnimationStyle('fadeIn', 200, undefined)
      expect(result).toContain('animation-delay: 200ms;')
    })

    it('should not add delay for 0 or undefined', () => {
      const result0 = getAnimationStyle('fadeIn', 0, undefined)
      expect(result0).not.toContain('animation-delay')

      const resultUndef = getAnimationStyle('fadeIn', undefined, undefined)
      expect(resultUndef).not.toContain('animation-delay')
    })

    it('should add animation-duration when duration is provided', () => {
      const result = getAnimationStyle('fadeIn', undefined, 1000)
      expect(result).toContain('animation-duration: 1000ms;')
    })

    it('should include both delay and duration when both provided', () => {
      const result = getAnimationStyle('slideUp', 300, 800)
      expect(result).toContain('animation: widgetSlideUp')
      expect(result).toContain('animation-delay: 300ms;')
      expect(result).toContain('animation-duration: 800ms;')
    })

    it('should work for all non-none presets', () => {
      for (const [name, preset] of Object.entries(ANIMATION_PRESETS)) {
        if (name === 'none') continue
        const result = getAnimationStyle(name, undefined, undefined)
        expect(result).toBeTruthy()
        expect(result).toContain(preset.css.split(' ')[1]) // animation name
      }
    })
  })
})
