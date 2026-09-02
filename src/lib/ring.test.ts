import { describe, expect, it } from 'vitest'
import { angleToDay, dayToAngle, polar } from './ring'

describe('year ring math', () => {
  it('places day 1 at the top of the ring', () => {
    expect(dayToAngle(1, 365)).toBeCloseTo(-90, 0)
  })

  it('round-trips a day through its angle', () => {
    for (const doy of [1, 46, 100, 180, 256, 365]) {
      const angle = dayToAngle(doy, 365)
      expect(angleToDay(angle, 365)).toBe(doy)
    }
  })

  it('walks clockwise from January toward April', () => {
    const jan = polar(0, 0, 100, dayToAngle(1, 365))
    const apr = polar(0, 0, 100, dayToAngle(91, 365))
    expect(jan.y).toBeLessThan(0)
    expect(apr.x).toBeGreaterThan(0)
  })
})
