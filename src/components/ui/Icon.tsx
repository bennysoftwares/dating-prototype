import type { JSX, SVGProps } from 'react';

/** Hand-tuned 24px line icons. Kept inline to avoid an icon library dependency. */
const PATHS = {
  discover: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8z" />
    </>
  ),
  heart: <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20Z" />,
  chat: <path d="M20 11.5c0 4.1-3.6 7.5-8 7.5a8.7 8.7 0 0 1-3.4-.7L4 19.5l1.3-3.7A7.2 7.2 0 0 1 4 11.5C4 7.4 7.6 4 12 4s8 3.4 8 7.5Z" />,
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.75" />
      <path d="M4.75 19.5c1.2-3.2 4-5 7.25-5s6.05 1.8 7.25 5" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.75v2M12 19.25v2M4.75 12h-2M21.25 12h-2M6.9 6.9 5.5 5.5M18.5 18.5l-1.4-1.4M6.9 17.1l-1.4 1.4M18.5 5.5l-1.4 1.4" />
    </>
  ),
  moon: <path d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10Z" />,
  device: (
    <>
      <rect x="3.5" y="5" width="17" height="11.5" rx="2" />
      <path d="M9 20h6M12 16.5V20" />
    </>
  ),
  chevronRight: <path d="m9.5 6 6 6-6 6" />,
  chevronLeft: <path d="m14.5 6-6 6 6 6" />,
  pin: (
    <>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.25" />
    </>
  ),
  sparkle: <path d="M12 3.5c.6 4.3 2.2 5.9 6.5 6.5-4.3.6-5.9 2.2-6.5 6.5-.6-4.3-2.2-5.9-6.5-6.5 4.3-.6 5.9-2.2 6.5-6.5ZM18.5 15.5c.25 1.6.9 2.25 2.5 2.5-1.6.25-2.25.9-2.5 2.5-.25-1.6-.9-2.25-2.5-2.5 1.6-.25 2.25-.9 2.5-2.5Z" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l2-1.5-2-3.4-2.3.9a7.5 7.5 0 0 0-2.6-1.5L14 2.5h-4l-.5 2.5a7.5 7.5 0 0 0-2.6 1.5l-2.3-.9-2 3.4 2 1.5a7.6 7.6 0 0 0 0 3l-2 1.5 2 3.4 2.3-.9a7.5 7.5 0 0 0 2.6 1.5l.5 2.5h4l.5-2.5a7.5 7.5 0 0 0 2.6-1.5l2.3.9 2-3.4-2-1.5Z" />
    </>
  ),
  shield: <path d="M12 3 5 5.8v5.4c0 4.4 3 8.2 7 9.8 4-1.6 7-5.4 7-9.8V5.8L12 3Z" />,
  edit: <path d="M4 20h4L18.5 9.5a2.8 2.8 0 0 0-4-4L4 16v4ZM13.5 6.5l4 4" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  refresh: <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v4h-4" />,
  bug: (
    <>
      <rect x="7" y="8" width="10" height="12" rx="5" />
      <path d="M9 8a3 3 0 0 1 6 0M12 12v8M3.5 13H7M17 13h3.5M4.5 8.5 7.5 10M19.5 8.5 16.5 10M4.5 18.5l3-1.5M19.5 18.5l-3-1.5" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.5 3.75 5.5 3.75 9S14.5 18.5 12 21c-2.5-2.5-3.75-5.5-3.75-9S9.5 5.5 12 3Z" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3.5" y="7.5" width="17" height="12" rx="2" />
      <path d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5M3.5 12.5h17" />
    </>
  ),
  ruler: <path d="M4 15.5 15.5 4 20 8.5 8.5 20 4 15.5ZM8 11.5l1.5 1.5M10.5 9l2 2M13 6.5l1.5 1.5" />,
  eye: (
    <>
      <path d="M2.75 12S6.25 5.5 12 5.5 21.25 12 21.25 12 17.75 18.5 12 18.5 2.75 12 2.75 12Z" />
      <circle cx="12" cy="12" r="2.75" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M10.2 5.7A9.6 9.6 0 0 1 12 5.5c5.75 0 9.25 6.5 9.25 6.5a17 17 0 0 1-2.7 3.4M6.6 6.9C4.1 8.6 2.75 12 2.75 12S6.25 18.5 12 18.5c1.8 0 3.3-.6 4.6-1.4" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3.5 3.5l17 17" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  trash: <path d="M4.5 7h15M9.5 7V5h5v2M6.5 7l.8 12h9.4l.8-12M10 11v5M14 11v5" />,
  camera: (
    <>
      <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.5-2h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5v-9Z" />
      <circle cx="12" cy="12.75" r="3.25" />
    </>
  ),
  star: <path d="m12 4 2.4 5 5.3.6-3.9 3.6 1.1 5.3L12 15.9l-4.9 2.6 1.1-5.3-3.9-3.6 5.3-.6L12 4Z" />,
  arrowUp: <path d="M12 19V5M6 11l6-6 6 6" />,
  arrowDown: <path d="M12 5v14M6 13l6 6 6-6" />,
  swap: <path d="M7 4 4 7l3 3M4 7h12M17 20l3-3-3-3M20 17H8" />,
  home: <path d="M4 11 12 4.5 20 11v8.5h-5.5V14h-5v5.5H4V11Z" />,
  cake: (
    <>
      <path d="M4.5 20h15v-6.5a2 2 0 0 0-2-2h-11a2 2 0 0 0-2 2V20ZM4.5 15.5c2.5 1.5 4.5-1 7.5 0s5 1.5 7.5 0M12 11.5V8" />
      <path d="M12 4.5c.8.9 1 1.7 0 2.5-1-.8-.8-1.6 0-2.5Z" />
    </>
  ),
  wine: <path d="M8 3.5h8l-.5 5a3.5 3.5 0 0 1-7 0L8 3.5ZM12 12v8M8.5 20h7" />,
  smoke: <path d="M3.5 15.5h13v3h-13zM19 15.5v3M21 15.5v3M18 12.5c0-1.5 2-1.5 2-3s-1.5-2-1.5-3" />,
  baby: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9 10.5h.01M15 10.5h.01M9.5 14.5c1.4 1.2 3.6 1.2 5 0" />
    </>
  ),
  book: <path d="M5 4.5h10.5a2 2 0 0 1 2 2V20H7a2 2 0 0 1-2-2V4.5ZM5 18a2 2 0 0 1 2-2h10.5" />,
  undo: <path d="M9 14 4.5 9.5 9 5M4.5 9.5H14a5.5 5.5 0 0 1 0 11h-3" />,
  archive: <path d="M4 5h16v4H4zM5.5 9v10h13V9M10 13h4" />,
  send: <path d="M4.5 12 20 4.5 15 20l-3.5-6.5L4.5 12ZM11.5 13.5 20 4.5" />,
  smile: (
    <>
      <circle cx="12" cy="12" r="8.75" />
      <path d="M8.5 14.5c1.9 1.9 5.1 1.9 7 0M9 9.5h.01M15 9.5h.01" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="3.5" width="6" height="11" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5" />
    </>
  ),
  image: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <circle cx="9" cy="10" r="1.75" />
      <path d="m4 17 5-4.5 4 3.5 3-2.5 4 3.5" />
    </>
  ),
  play: <path d="M8 5.5v13l10.5-6.5L8 5.5Z" />,
  more: <path d="M6 12h.01M12 12h.01M18 12h.01" />,
  flag: <path d="M5.5 21V4.5M5.5 5c4-2 6.5 2 11 0v8.5c-4.5 2-7-2-11 0" />,
} as const;

export type IconName = keyof typeof PATHS;

/** Filled variants where simply filling the outline would lose detail. */
const FILLED_OVERRIDES: Partial<Record<IconName, JSX.Element>> = {
  discover: (
    <>
      <circle cx="12" cy="12" r="9.5" fill="currentColor" stroke="none" />
      <path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8z" fill="var(--color-nav-bg, #fff)" stroke="var(--color-nav-bg, #fff)" strokeWidth={1.25} />
    </>
  ),
};

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number;
  /** Fill the shape instead of stroking it (used for active nav state). */
  filled?: boolean;
  /** Accessible label. Omit for decorative icons. */
  label?: string;
}

export function Icon({ name, size = 24, filled = false, label, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      {...rest}
    >
      {(filled && FILLED_OVERRIDES[name]) || PATHS[name]}
    </svg>
  );
}
