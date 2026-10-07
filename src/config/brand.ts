/**
 * Central brand identity. Rename the app, change the tagline or storage
 * namespace here. Visual identity (accent colour, fonts) lives in
 * `src/design/tokens.css` under the "Brand" section; the logo mark lives in
 * `src/components/brand/Logo.tsx`.
 */
export const brand = {
  name: 'TurtleDoves',
  shortName: 'TurtleDoves',
  tagline: 'For people looking for something real.',
  /**
   * Prefix for every localStorage key. Must match the inline script in index.html.
   * Kept from the prototype name on purpose: changing it would orphan everyone's saved data.
   */
  storageNamespace: 'dp',
  /** Browser UI colour (address bar / status bar) per theme. Keep in sync with --color-bg. */
  themeColor: { light: '#F8F3EC', dark: '#1A1412' },
  version: '0.2.0',
} as const;

export type Brand = typeof brand;
