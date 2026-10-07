/**
 * Central brand identity. Rename the app, change the tagline or storage
 * namespace here. Visual identity (accent colour, fonts) lives in
 * `src/design/tokens.css` under the "Brand" section; the logo mark lives in
 * `src/components/brand/Logo.tsx`.
 */
export const brand = {
  name: 'Dating Prototype',
  shortName: 'Prototype',
  tagline: 'Fewer people. Better conversations.',
  /** Prefix for every localStorage key. Must match the inline script in index.html. */
  storageNamespace: 'dp',
  /** Browser UI colour (address bar / status bar) per theme. Keep in sync with --color-bg. */
  themeColor: { light: '#FBF8F4', dark: '#141110' },
  version: '0.1.0',
} as const;

export type Brand = typeof brand;
