import { describe, it, expect } from 'vitest'
import { formatCurrency } from '../../src/utils/formatCurrency'

describe('formatCurrency', () => {
  describe('small values (< $100M)', () => {
    it('should show 2 decimals for very small values', () => {
      expect(formatCurrency(0.05)).toBe('$0.05M')
      expect(formatCurrency(0.001)).toBe('$0.00M')
    })

    it('should show 1 decimal for values under $100M', () => {
      expect(formatCurrency(1.5)).toBe('$1.5M')
      expect(formatCurrency(50.7)).toBe('$50.7M')
      expect(formatCurrency(99.9)).toBe('$99.9M')
    })
  })

  describe('medium values ($100M - $1B)', () => {
    it('should show no decimal for $100M-$999M', () => {
      expect(formatCurrency(100)).toBe('$100M')
      expect(formatCurrency(500)).toBe('$500M')
      expect(formatCurrency(999)).toBe('$999M')
    })
  })

  describe('large values ($1B+)', () => {
    it('should show 2 decimals for $1B-$9.99B', () => {
      expect(formatCurrency(1000)).toBe('$1.00B')
      expect(formatCurrency(5500)).toBe('$5.50B')
      expect(formatCurrency(9999)).toBe('$10.00B')
    })

    it('should show 1 decimal for $10B-$99.9B', () => {
      expect(formatCurrency(10000)).toBe('$10.0B')
      expect(formatCurrency(50000)).toBe('$50.0B')
      expect(formatCurrency(99900)).toBe('$99.9B')
    })

    it('should show no decimal for $100B+', () => {
      expect(formatCurrency(100000)).toBe('$100B')
      expect(formatCurrency(500000)).toBe('$500B')
    })
  })

  describe('edge cases', () => {
    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('$0.0M')
    })

    it('should handle negative values', () => {
      expect(formatCurrency(-50)).toBe('$-50.0M')
    })

    it('should handle NaN', () => {
      expect(formatCurrency(NaN)).toBe('$0.0M')
    })

    it('should handle Infinity', () => {
      expect(formatCurrency(Infinity)).toBe('$0.0M')
      expect(formatCurrency(-Infinity)).toBe('$0.0M')
    })

    it('should handle very large numbers', () => {
      expect(formatCurrency(1000000)).toBe('$1000B')
    })
  })

  describe('boundary values', () => {
    it('should handle boundaries correctly', () => {
      expect(formatCurrency(0.09)).toBe('$0.09M')  // Just below 0.1
      expect(formatCurrency(0.1)).toBe('$0.1M')    // Boundary
      expect(formatCurrency(99.99)).toBe('$100.0M') // Rounds to 100
      expect(formatCurrency(999.99)).toBe('$1000M') // Rounds to 1000
    })
  })
})
