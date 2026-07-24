/* eslint-disable @next/next/no-img-element */

// Business logo. The asset lives at public/logo.jpg.
export function Logo({
  className = '',
  size = 40,
  rounded = true,
}: {
  className?: string;
  size?: number;
  rounded?: boolean;
}) {
  return (
    <img
      src="/logo.jpg"
      alt="Infinity Exports"
      width={size}
      height={size}
      className={`${rounded ? 'rounded-lg' : ''} object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
