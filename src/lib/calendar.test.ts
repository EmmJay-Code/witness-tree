import { describe, expect, it } from 'vitest'
import {
  cardinalDates,
  dayOfYear,
  daysInYear,
  isoDate,
  parseIsoDate,
  seasonAt,
} from './calendar'

describe('calendar', () => {
  it('counts leap years', () => {
    expect(daysInYear(2024)).toBe(366)
    expect(daysInYear(2025)).toBe(365)
    expect(daysInYear(2000)).toBe(366)
    expect(daysInYear(1900)).toBe(365)
  })

  it('numbers the days of the year', () => {
    expect(dayOfYear(new Date(2026, 0, 1))).toBe(1)
    expect(dayOfYear(new Date(2025, 11, 31))).toBe(365)
    expect(dayOfYear(new Date(2024, 11, 31))).toBe(366)
  })

  it('round-trips ISO dates without UTC shift', () => {
    expect(isoDate(parseIsoDate('2026-09-02'))).toBe('2026-09-02')
  })

  it('puts June in summer in the north and winter in the south', () => {
    const june = new Date(2026, 5, 21, 12)
    expect(seasonAt(june, 'N')).toBe('summer')
    expect(seasonAt(june, 'S')).toBe('winter')
  })

  it('finds equinoxes and solstices in the right months', () => {
    const cards = cardinalDates(2026)
    expect(cards.spring.getMonth()).toBe(2)
    expect(cards.summer.getMonth()).toBe(5)
    expect(cards.autumn.getMonth()).toBe(8)
    expect(cards.winter.getMonth()).toBe(11)
  })
})
