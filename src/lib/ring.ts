export function dayToAngle(doy: number, days: number): number {
  return ((doy - 0.5) / days) * 360 - 90
}

export function angleToDay(angleDeg: number, days: number): number {
  let fromTop = angleDeg + 90
  fromTop = ((fromTop % 360) + 360) % 360
  const doy = Math.round((fromTop / 360) * days + 0.5)
  return Math.min(days, Math.max(1, doy))
}

export function polar(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number,
): { x: number; y: number } {
  const a = (angleDeg * Math.PI) / 180
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
}

export function arcPath(
  cx: number,
  cy: number,
  r: number,
  startDoy: number,
  endDoy: number,
  days: number,
): string {
  const startA = dayToAngle(startDoy, days)
  const endA = dayToAngle(endDoy, days)
  let sweep = endA - startA
  if (sweep <= 0) sweep += 360
  const large = sweep > 180 ? 1 : 0
  const s = polar(cx, cy, r, startA)
  const e = polar(cx, cy, r, startA + sweep)
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`
}

export function pointerToDay(
  clientX: number,
  clientY: number,
  svg: SVGSVGElement,
  cx: number,
  cy: number,
  days: number,
): { doy: number; dist: number } | null {
  const ctm = svg.getScreenCTM()
  if (!ctm) return null
  const pt = svg.createSVGPoint()
  pt.x = clientX
  pt.y = clientY
  const loc = pt.matrixTransform(ctm.inverse())
  const dx = loc.x - cx
  const dy = loc.y - cy
  const dist = Math.hypot(dx, dy)
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI
  return { doy: angleToDay(angle, days), dist }
}
