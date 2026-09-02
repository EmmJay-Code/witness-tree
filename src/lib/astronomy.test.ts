import { describe, expect, it } from 'vitest'
import {
  dayLengthDeltaMinutes,
  moonAgeDays,
  moonIllumination,
  solarDeclination,
  sunTimes,
} from './astronomy'

const BOSTON = { lat: 42.36, lon: -71.06 }
const HOBART = { lat: -42.88, lon: 147.33 }
const TROMSO = { lat: 69.65, lon: 18.96 }

describe('sunTimes', () => {
  it('gives a longer day in Boston in June than in December', () => {
    const june = sunTimes(new Date(2026, 5, 21), BOSTON.lat, BOSTON.lon)
    const dec = sunTimes(new Date(2026, 11, 21), BOSTON.lat, BOSTON.lon)
    expect(june.dayLengthHours).toBeGreaterThan(14)
    expect(dec.dayLengthHours).toBeLessThan(10)
    expect(june.dayLengthHours).toBeGreaterThan(dec.dayLengthHours + 4)
  })

  it('reverses the pattern in the southern hemisphere', () => {
    const june = sunTimes(new Date(2026, 5, 21), HOBART.lat, HOBART.lon)
    const dec = sunTimes(new Date(2026, 11, 21), HOBART.lat, HOBART.lon)
    expect(dec.dayLengthHours).toBeGreaterThan(june.dayLengthHours)
  })

  it('orders sunrise, noon, and sunset on an ordinary day', () => {
    const sun = sunTimes(new Date(2026, 3, 15), BOSTON.lat, BOSTON.lon)
    expect(sun.event).toBe('normal')
    expect(sun.sunrise).toBeTruthy()
    expect(sun.sunset).toBeTruthy()
    expect(sun.sunrise!.getTime()).toBeLessThan(sun.solarNoon.getTime())
    expect(sun.solarNoon.getTime()).toBeLessThan(sun.sunset!.getTime())
  })

  it('reports polar day in Tromsø in June', () => {
    const sun = sunTimes(new Date(2026, 5, 21), TROMSO.lat, TROMSO.lon)
    expect(sun.event).toBe('polar-day')
    expect(sun.dayLengthHours).toBe(24)
  })

  it('grows the northern day after the winter solstice', () => {
    const delta = dayLengthDeltaMinutes(new Date(2026, 0, 5), BOSTON.lat, BOSTON.lon)
    expect(delta).toBeGreaterThan(0)
  })
})

describe('solarDeclination', () => {
  it('is positive in northern summer and negative in northern winter', () => {
    expect(solarDeclination(new Date(2026, 5, 21))).toBeGreaterThan(20)
    expect(solarDeclination(new Date(2026, 11, 21))).toBeLessThan(-20)
  })
})

describe('moon', () => {
  it('keeps age inside a synodic month', () => {
    const age = moonAgeDays(new Date('2026-09-02T12:00:00Z'))
    expect(age).toBeGreaterThanOrEqual(0)
    expect(age).toBeLessThan(29.530588853)
  })

  it('is dark near new moon and bright near full', () => {
    const newMoon = new Date(Date.UTC(2000, 0, 6, 18, 14))
    const full = new Date(newMoon.getTime() + 14.765 * 86_400_000)
    expect(moonIllumination(newMoon)).toBeLessThan(0.05)
    expect(moonIllumination(full)).toBeGreaterThan(0.95)
  })
})
