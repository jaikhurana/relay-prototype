interface Props {
  size?: number;
  className?: string;
  title?: string;
}

/** Relay's mark: a relay baton. Always magenta. */
export function BatonIcon({ size = 24, className, title }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <rect x="9" y="2" width="6" height="20" rx="3" transform="rotate(35 12 12)" fill="#EE065E" />
      <rect x="9" y="10.5" width="6" height="3" transform="rotate(35 12 12)" fill="#FFFFFF" />
    </svg>
  );
}
