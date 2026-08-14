type LogoProps = {
  size?: number;
  className?: string;
};

/**
 * Transcrit verbatim depuis brand() dans PlannIt.dc.html.
 * Couleurs fixes (toujours vert olive clair), non réactives au thème.
 */
export function Logo({ size = 30, className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      aria-hidden="true"
      className={className}
    >
      <circle cx="16" cy="18" r="11" fill="#6E7B4E" />
      <path
        d="M16 12c.6-4 3.5-6 7-6.5-.6 4-3 6-7 6.5z"
        fill="#6E7B4E"
      />
      <path
        d="M11.5 21.5c1.6 1.6 7.4 1.6 9 0"
        stroke="#FBF8F1"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
