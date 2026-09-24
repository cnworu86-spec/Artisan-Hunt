/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: '#173B35',
    tint: '#0F4C3A',

    // Core surfaces
    background: '#F7F5ED',
    foreground: '#173B35',

    // Cards / elevated surfaces
    card: '#FFFEF8',
    cardForeground: '#173B35',

    // Primary action color (buttons, links, active states)
    primary: '#0F4C3A',
    primaryForeground: '#ffffff',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#E6EFEA',
    secondaryForeground: '#173B35',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#EEF0E9',
    mutedForeground: '#71827B',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#E2B96F',
    accentForeground: '#5D421E',

    // Destructive actions (delete, error states)
    destructive: '#B94B4B',
    destructiveForeground: '#ffffff',

    // Borders and input outlines
    border: '#DDE3D9',
    input: '#D8E0D9',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 18,
};

export default colors;
