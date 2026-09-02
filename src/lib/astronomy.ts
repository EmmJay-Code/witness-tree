/**
 * Solar and lunar calculations from the NOAA solar position algorithms
 * (Jean Meeus / Astronomical Algorithms approximations).
 * Good to about a minute for sunrise at temperate latitudes.
 */

const DEG = Math.PI / 180
const RAD = 180 / Math.PI

function d2r(d: number): number {
  return d * DEG
}

function r2d(r: number): number {
  return r * RAD
}

function wrap360(d: number): number {
  return ((d % 360) + 360) % 360
}

export function julianDay(date: Date): number {
  return date.getTime() / 86_400_000 + 2_440_587.5
}

function julianCentury(jd: number): number {
  return (jd - 2_451_545) / 36_525
}

function geomMeanLongSun(t: number): number {
  return wrap360(280.46646 + t * (36_000.76983 + t * 0.0003032))
}

function geomMeanAnomalySun(t: number): number {
  return 357.52911 + t * (35_999.05029 - 0.0001537 * t)
}

function eccentricityEarthOrbit(t: number): number {
  return 0.016708634 - t * (0.000042037 + 0.0000001267 * t)
}

function sunEqOfCenter(t: number): number {
  const m = d2r(geomMeanAnomalySun(t))
  return (
    Math.sin(m) * (1.914602 - t * (0.004817 + 0.000014 * t)) +
    Math.sin(2 * m) * (0.019993 - 0.000101 * t) +
    Math.sin(3 * m) * 0.000289
  )
}

function sunTrueLong(t: number): number {
  return geomMeanLongSun(t) + sunEqOfCenter(t)
}

function sunApparentLong(t: number): number {
  const omega = 125.04 - 1934.136 * t
  return sunTrueLong(t) - 0.00569 - 0.00478 * Math.sin(d2r(omega))
}

function meanObliquity(t: number): number {
  const seconds = 21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))
  return 23 + (26 + seconds / 60) / 60
}

function obliquityCorrection(t: number): number {
  const omega = 125.04 - 1934.136 * t
  return meanObliquity(t) + 0.00256 * Math.cos(d2r(omega))
}

export function solarLongitude(date: Date): number {
  const t = julianCentury(julianDay(date))
  return wrap360(sunApparentLong(t))
}

export function solarDeclination(date: Date): number {
  const t = julianCentury(julianDay(date))
  const e = d2r(obliquityCorrection(t))
  const lambda = d2r(sunApparentLong(t))
  return r2d(Math.asin(Math.sin(e) * Math.sin(lambda)))
}

export function equationOfTimeMinutes(date: Date): number {
  const t = julianCentury(julianDay(date))
  const epsilon = d2r(obliquityCorrection(t))
  const l0 = d2r(geomMeanLongSun(t))
  const e = eccentricityEarthOrbit(t)
  const m = d2r(geomMeanAnomalySun(t))
  const y = Math.tan(epsilon / 2) ** 2
  const et =
    y * Math.sin(2 * l0) -
    2 * e * Math.sin(m) +
    4 * e * y * Math.sin(m) * Math.cos(2 * l0) -
    0.5 * y * y * Math.sin(4 * l0) -
    1.25 * e * e * Math.sin(2 * m)
  return 4 * r2d(et)
}

const ZENITH = 90.833

export type SunEvent = 'normal' | 'polar-day' | 'polar-night'

export interface SunTimes {
  event: SunEvent
  solarNoon: Date
  sunrise: Date | null
  sunset: Date | null
  dayLengthHours: number
}

function utcDateFromHours(year: number, month: number, day: number, hours: number): Date {
  const h = ((hours % 24) + 24) % 24
  const extraDays = Math.floor(hours / 24)
  const base = Date.UTC(year, month, day + extraDays)
  return new Date(base + h * 3_600_000)
}

export function sunTimes(date: Date, lat: number, lon: number): SunTimes {
  const year = date.getFullYear()
  const month = date.getMonth()
  const day = date.getDate()
  const noon = new Date(Date.UTC(year, month, day, 12, 0, 0))
  const decl = d2r(solarDeclination(noon))
  const latR = d2r(lat)
  const cosHa =
    Math.cos(d2r(ZENITH)) / (Math.cos(latR) * Math.cos(decl)) - Math.tan(latR) * Math.tan(decl)

  const eq = equationOfTimeMinutes(noon)
  const solarNoonHours = 12 - lon / 15 - eq / 60
  const solarNoon = utcDateFromHours(year, month, day, solarNoonHours)

  if (cosHa <= -1) {
    return {
      event: 'polar-day',
      solarNoon,
      sunrise: null,
      sunset: null,
      dayLengthHours: 24,
    }
  }
  if (cosHa >= 1) {
    return {
      event: 'polar-night',
      solarNoon,
      sunrise: null,
      sunset: null,
      dayLengthHours: 0,
    }
  }

  const ha = r2d(Math.acos(Math.min(1, Math.max(-1, cosHa))))
  const sunrise = utcDateFromHours(year, month, day, solarNoonHours - ha / 15)
  const sunset = utcDateFromHours(year, month, day, solarNoonHours + ha / 15)
  return {
    event: 'normal',
    solarNoon,
    sunrise,
    sunset,
    dayLengthHours: (2 * ha) / 15,
  }
}

/** Synodic month, and a known new moon (UTC). */
const LUNAR_PERIOD = 29.530588853
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14)

export function moonAgeDays(date: Date): number {
  const days = (date.getTime() - KNOWN_NEW_MOON) / 86_400_000
  return ((days % LUNAR_PERIOD) + LUNAR_PERIOD) % LUNAR_PERIOD
}

export function moonIllumination(date: Date): number {
  const age = moonAgeDays(date)
  return (1 - Math.cos((2 * Math.PI * age) / LUNAR_PERIOD)) / 2
}

export function moonPhaseName(date: Date): string {
  const age = moonAgeDays(date)
  if (age < 1.84566) return 'New moon'
  if (age < 5.53699) return 'Waxing crescent'
  if (age < 9.22831) return 'First quarter'
  if (age < 12.91963) return 'Waxing gibbous'
  if (age < 16.61096) return 'Full moon'
  if (age < 20.30228) return 'Waning gibbous'
  if (age < 23.99361) return 'Last quarter'
  if (age < 27.68493) return 'Waning crescent'
  return 'New moon'
}

export function dayLengthDeltaMinutes(
  date: Date,
  lat: number,
  lon: number,
): number {
  const today = sunTimes(date, lat, lon).dayLengthHours
  const yesterdayDate = new Date(date)
  yesterdayDate.setDate(date.getDate() - 1)
  const yesterday = sunTimes(yesterdayDate, lat, lon).dayLengthHours
  return (today - yesterday) * 60
}
