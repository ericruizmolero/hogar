interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 32, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* House shape - modern geometric */}
      <path
        d="M24 4L4 20V44H18V32C18 28.6863 20.6863 26 24 26C27.3137 26 30 28.6863 30 32V44H44V20L24 4Z"
        fill="currentColor"
      />
      {/* Window accent */}
      <rect
        x="20"
        y="32"
        width="8"
        height="12"
        rx="4"
        fill="var(--color-bg, #ffffff)"
      />
      {/* Chimney detail */}
      <rect
        x="34"
        y="10"
        width="4"
        height="10"
        rx="1"
        fill="currentColor"
      />
    </svg>
  );
}

export function LogoMark({ size = 24, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Minimal house mark */}
      <path
        d="M24 6L6 22H12V42H20V30H28V42H36V22H42L24 6Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function LogoFull({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        width="28"
        height="28"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Geometric house - filled */}
        <path
          d="M24 4L4 20V44H18V30C18 26.6863 20.6863 24 24 24C27.3137 24 30 26.6863 30 30V44H44V20L24 4Z"
          fill="currentColor"
        />
      </svg>
      <span
        className="text-xl font-medium tracking-tight"
        style={{ fontFamily: 'var(--font-serif)' }}
      >
        Hogar
      </span>
    </div>
  );
}
