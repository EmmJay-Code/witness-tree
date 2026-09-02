export interface Place {
  name: string
  region: string
  lat: number
  lon: number
  tz: string
}

export const PLACES: Place[] = [
  { name: 'Boston', region: 'Massachusetts, USA', lat: 42.36, lon: -71.06, tz: 'America/New_York' },
  { name: 'Portland', region: 'Oregon, USA', lat: 45.52, lon: -122.68, tz: 'America/Los_Angeles' },
  { name: 'Minneapolis', region: 'Minnesota, USA', lat: 44.98, lon: -93.27, tz: 'America/Chicago' },
  { name: 'Santa Fe', region: 'New Mexico, USA', lat: 35.69, lon: -105.94, tz: 'America/Denver' },
  { name: 'Anchorage', region: 'Alaska, USA', lat: 61.22, lon: -149.9, tz: 'America/Anchorage' },
  { name: 'Edinburgh', region: 'Scotland', lat: 55.95, lon: -3.19, tz: 'Europe/London' },
  { name: 'Berlin', region: 'Germany', lat: 52.52, lon: 13.41, tz: 'Europe/Berlin' },
  { name: 'Kyoto', region: 'Japan', lat: 35.01, lon: 135.77, tz: 'Asia/Tokyo' },
  { name: 'Hobart', region: 'Tasmania, Australia', lat: -42.88, lon: 147.33, tz: 'Australia/Hobart' },
  { name: 'Christchurch', region: 'New Zealand', lat: -43.53, lon: 172.64, tz: 'Pacific/Auckland' },
  { name: 'Cape Town', region: 'South Africa', lat: -33.92, lon: 18.42, tz: 'Africa/Johannesburg' },
  { name: 'Bariloche', region: 'Argentina', lat: -41.13, lon: -71.31, tz: 'America/Argentina/Buenos_Aires' },
]

export function hemisphereFromLat(lat: number): 'N' | 'S' {
  return lat < 0 ? 'S' : 'N'
}

export function formatCoords(lat: number, lon: number): string {
  const ns = lat >= 0 ? 'N' : 'S'
  const ew = lon >= 0 ? 'E' : 'W'
  return `${Math.abs(lat).toFixed(3)}°${ns}  ${Math.abs(lon).toFixed(3)}°${ew}`
}
