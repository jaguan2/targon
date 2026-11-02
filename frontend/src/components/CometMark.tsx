/** Targon's decorative comet; its name is supplied by the adjacent wordmark. */
export function CometMark() {
  return (
    <svg className="brand__mark" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path d="M11 34 40 5 24 29" fill="currentColor" opacity="0.2" />
      <path d="M12 33 39 6M16 36 44 8" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <path d="m13 25 2.4 7.6L23 35l-7.6 2.4L13 45l-2.4-7.6L3 35l7.6-2.4Z" fill="currentColor" />
      <circle cx="28" cy="10" r="1.3" fill="currentColor" />
      <circle cx="36" cy="29" r="1" fill="currentColor" opacity="0.65" />
    </svg>
  );
}
