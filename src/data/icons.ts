/**
 * The site's icon vocabulary — design doc §3.5.
 *
 * One family, one file. Kept in .ts rather than inside Icon.astro so pages can
 * type their own icon-bearing data structures against it (`IconName`) without
 * importing the component.
 *
 * Adding a glyph means adding it here AND adding its path to the table in
 * src/components/Icon.astro. Both are Lucide, 24x24, 2px stroke — never mix
 * families, never substitute an emoji.
 */
export const ICON_NAMES = [
  'menu',
  'close',
  'arrow-right',
  'arrow-up-right',
  'chevron-down',
  'chevron-right',
  'plus',
  'check',
  'phone',
  'mail',
  'map-pin',
  'instagram',
  'calendar',
  'clock',
  'users',
  'user-round',
  'package',
  'heart-handshake',
  'palette',
  'lightbulb',
  'ticket',
  'coffee',
  'gift',
  'send',
  'whatsapp',
] as const;

export type IconName = (typeof ICON_NAMES)[number];
