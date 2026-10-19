/** Decorative orbital drawing, deliberately independent of anyone's chart. */
export function ObservatoryArt() {
  return (
    <figure className="observatory-art">
      <svg viewBox="0 0 440 440" aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id="observatory-light">
            <stop stopColor="#d8bc80" stopOpacity="0.13" />
            <stop offset="1" stopColor="#d8bc80" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="220" cy="220" r="215" fill="url(#observatory-light)" />
        <g fill="none" stroke="currentColor">
          <circle cx="220" cy="220" r="186" opacity="0.4" />
          <circle cx="220" cy="220" r="170" opacity="0.18" />
          <circle cx="220" cy="220" r="118" opacity="0.25" />
          <ellipse cx="220" cy="220" rx="166" ry="63" transform="rotate(-35 220 220)" opacity="0.35" />
          {Array.from({ length: 60 }, (_, i) => <path key={i} d={`M 220 ${i % 5 === 0 ? 35 : 40} V 47`} transform={`rotate(${i * 6} 220 220)`} opacity={i % 5 === 0 ? 0.7 : 0.22} />)}
          <path d="M62 281 135 137 275 90 357 238 249 337 135 137 M62 281 249 337 275 90" opacity="0.3" />
          <path d="M220 92V348M92 220H348" strokeDasharray="2 8" opacity="0.17" />
        </g>
        <g fill="currentColor">
          {[[62, 281], [135, 137], [275, 90], [357, 238], [249, 337]].map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r="8" opacity="0.09" /><circle cx={x} cy={y} r={i === 1 ? 3.5 : 2.5} /></g>)}
          <path d="M220 194 224 216 246 220 224 224 220 246 216 224 194 220 216 216Z" />
          <circle cx="220" cy="220" r="36" fill="none" stroke="currentColor" opacity="0.5" />
        </g>
        <g fill="currentColor" fontFamily="Georgia, serif" fontSize="11" textAnchor="middle" letterSpacing="3">
          <text x="220" y="17">AS ABOVE</text><text x="220" y="432">SO WITHIN</text>
        </g>
      </svg>
      <figcaption>An illustration of possibility. Your own chart comes next.</figcaption>
    </figure>
  );
}
