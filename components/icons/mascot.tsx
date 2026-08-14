type MascotProps = {
  size?: number;
  className?: string;
};

/**
 * Transcrit verbatim depuis mascot(size) dans PlannIt.dc.html.
 * fill="var(--accent)" fait suivre le thème clair/sombre sans re-render JS.
 */
export function Mascot({ size = 38, className }: MascotProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      aria-hidden="true"
      className={className}
    >
      <path
        d="M24 20c-1-6-5-9-11-10 0 6 4 9 11 10z"
        fill="var(--accent)"
        opacity=".55"
      />
      <path d="M24 20c1-7 6-10 12-11-1 7-5 10-12 11z" fill="var(--accent)" />
      <circle cx="24" cy="31" r="12" fill="var(--accent)" />
      <circle cx="20" cy="30" r="1.9" fill="rgba(0,0,0,.6)" />
      <circle cx="28" cy="30" r="1.9" fill="rgba(0,0,0,.6)" />
      <path
        d="M20.5 34.5c1.6 1.7 5.4 1.7 7 0"
        stroke="rgba(0,0,0,.6)"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
