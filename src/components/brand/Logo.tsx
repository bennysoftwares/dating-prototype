import { brand } from '../../config/brand';
import './Logo.css';

/** Placeholder mark + wordmark. Swap this component when the real identity arrives. */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="logo-mark">
      <rect width="64" height="64" rx="18" fill="var(--color-accent)" />
      <path d="M22 20c0 8 4 14 10 18 6-4 10-10 10-18" fill="none" stroke="var(--color-bg)" strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="32" cy="46" r="3.5" fill="var(--color-bg)" />
    </svg>
  );
}

export function Logo({ showName = true }: { showName?: boolean }) {
  return (
    <span className="logo">
      <LogoMark />
      {showName ? <span className="logo__name">{brand.name}</span> : <span className="visually-hidden">{brand.name}</span>}
    </span>
  );
}
