import { moonAgeDays, moonIllumination } from '../lib/astronomy'

export function Moon({ date, size = 56 }: { date: Date; size?: number }) {
  const age = moonAgeDays(date)
  const illum = moonIllumination(date)
  const waxing = age < 14.765
  const r = 20
  const offset = (1 - illum * 2) * r

  return (
    <svg
      className="moon"
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden="true"
    >
      <defs>
        <mask id={`moon-mask-${Math.round(age * 100)}`}>
          <rect width="48" height="48" fill="black" />
          <circle cx="24" cy="24" r={r} fill="white" />
          {illum < 0.98 && (
            <circle
              cx={24 + (waxing ? offset : -offset)}
              cy="24"
              r={r}
              fill="black"
            />
          )}
        </mask>
      </defs>
      <circle cx="24" cy="24" r={r} className="moon-sky" />
      <circle cx="24" cy="24" r={r} className="moon-face" mask={`url(#moon-mask-${Math.round(age * 100)})`} />
    </svg>
  )
}
