import { useId } from 'react';
import { brand } from '../../config/brand';
import { WORDMARK } from './wordmark';
import './Logo.css';

/**
 * The TurtleDoves mark: two doves facing each other, wings raised.
 * Drawn once (facing right) and mirrored. The same artwork is inlined in index.html
 * for the first-paint splash; keep the two in sync when changing it.
 */
export const DOVE_PATHS = {
  featherBack: 'M46 33C44 20 40 10 35 2 29 14 30 28 39 40Z',
  featherMid: 'M42 38C34 25 24 16 11 11 13 25 23 37 39 43Z',
  featherLow: 'M40 43C30 37 17 32 4 32 11 42 25 47 39 47Z',
  featherTail: 'M41 47C31 47 20 49 11 54 21 58 33 56 43 51Z',
  body: 'M49 13.5C53.4 13.5 56 17 55.2 21 54.7 23.8 53 26 53.6 30 55 37 55 44 50.5 49 46.5 53 40 53 37.5 49 36 45 38 37 41 30.5 42.6 27 43 22 44 18.5 45 15.5 46.8 13.5 49 13.5Z',
  beak: 'M54.9 18.6 59 20.3 54.7 21.8Z',
} as const;

export function LogoMark({ size = 40, className }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, '');
  const g = (name: string) => `url(#${id}-${name})`;
  const dove = (
    <>
      <g className="logo-mark__feathers">
        <path d={DOVE_PATHS.featherBack} fill={g('fa')} />
        <path d={DOVE_PATHS.featherMid} fill={g('fb')} />
        <path d={DOVE_PATHS.featherLow} fill={g('fc')} />
        <path d={DOVE_PATHS.featherTail} fill={g('fd')} />
        <path d={DOVE_PATHS.body} fill={g('bd')} />
      </g>
      <path d={DOVE_PATHS.beak} fill="#c46a55" />
      <circle cx="51.6" cy="18.4" r="1.1" fill="#2a1a16" />
    </>
  );
  return (
    <svg width={size * (120 / 64)} height={size} viewBox="0 0 120 64" aria-hidden="true" className={className ? `logo-mark ${className}` : 'logo-mark'}>
      <defs>
        <linearGradient id={`${id}-fa`} x1="1" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#a9524b" /><stop offset="1" stopColor="#cf7c6a" /></linearGradient>
        <linearGradient id={`${id}-fb`} x1="1" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#c8664f" /><stop offset="1" stopColor="#e9a283" /></linearGradient>
        <linearGradient id={`${id}-fc`} x1="1" y1="0" x2="0" y2="0"><stop offset="0" stopColor="#e7ae95" /><stop offset="1" stopColor="#f5d6c4" /></linearGradient>
        <linearGradient id={`${id}-fd`} x1="1" y1="0" x2="0" y2="0"><stop offset="0" stopColor="#b8605c" /><stop offset="1" stopColor="#d98f80" /></linearGradient>
        <linearGradient id={`${id}-bd`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4d9c8" /><stop offset=".45" stopColor="#edc1ac" /><stop offset=".62" stopColor="#cf7f79" /><stop offset="1" stopColor="#b45e5c" />
        </linearGradient>
      </defs>
      {dove}
      <g transform="translate(120 0) scale(-1 1)">{dove}</g>
    </svg>
  );
}

export function Wordmark({ height = 24, className }: { height?: number; className?: string }) {
  return (
    <svg className={className ? `wordmark ${className}` : 'wordmark'} viewBox={WORDMARK.viewBox} height={height} width={height * WORDMARK.aspect} aria-hidden="true">
      <path d={WORDMARK.d} fill="currentColor" />
    </svg>
  );
}

/** Mark + wordmark. `size` is the height of the mark in px. The name is always available to screen readers. */
export function Logo({ showName = true, size = 30 }: { showName?: boolean; size?: number }) {
  return (
    <span className="logo">
      <LogoMark size={size} />
      {showName && <Wordmark height={Math.round(size * 0.74)} />}
      <span className="visually-hidden">{brand.name}</span>
    </span>
  );
}
