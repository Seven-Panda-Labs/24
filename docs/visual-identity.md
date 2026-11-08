# Visual identity

Modern 2D illustration with paper and jute textures: a full jute sack with **24** on the front, tied with a gold bow. Source: [`project_brief.md`](./project_brief.md), section 7, and the [moodboard](./visual_moodboard.html). Logo files: [`assets/Logo/`](./assets/Logo/).

Tokens live in `src/styles/globals.css`. Use the Tailwind tokens (`bg-primary`, `text-foreground`, `bg-surface`, …), never hard-coded hex. Dark mode follows the system unless Settings sets a theme for the device (`src/theme.ts`, `data-theme` on `<html>`). Use the `dark:` variant, not `prefers-color-scheme`, so both apply.

## Typography

- **Display:** Fredoka, headings and the day numbers.
- **Sans:** Plus Jakarta Sans, everything else.

## Palette

| Token | Light | Dark | Brief name | Use |
|-------|-------|------|------------|-----|
| `primary` | `#1D6B4F` | `#5FBF94` | Verde Abeto | Structure, buttons, titles |
| `primary-hover` | `#16543E` | `#4AA97F` | | Primary button hover |
| `secondary` | `#C8353F` | `#EF7A80` | Vermelho Baga | Alerts, the outline of the 24 |
| `accent` | `#E3A82B` | `#E3A82B` | Dourado Warm | Seals, bows, celebration |
| `background` | `#FAF6EF` | `#1E2A44` | Creme Inverno / Noite de Consoada | App background |
| `surface` | `#F2EBDC` | `#2A3858` | Creme card | Cards |
| `foreground` | `#2E2A26` | `#FAF6EF` | Carvão Doce | Text |

`theme-color` is `#1D6B4F` in light and `#1E2A44` in dark. The dark values of `primary`, `secondary` and `surface` are not in the brief: Verde Abeto and Vermelho Baga fall under 3:1 against Noite de Consoada, so dark mode uses lighter tints of both.

`carvao` is Carvão Doce in both themes, for text on the light tag colours and the gold of the seal.

## Logo

The logo is the sack on a circle, cropped from `docs/assets/Logo/Individual.jpeg`. The navy circle (`public/logo.webp`) goes on the light theme and the white circle (`public/logo-dark.webp`) on the dark theme, for contrast. `src/components/Logo.tsx` picks one with the `dark:` variant.

## Illustrations

`public/illustrations/` holds the empty-state figures, cut out of the sheets in `docs/assets/` and set on a cream disc of the same size (320 px, shown at 160 px), like the logo. Each figure fits whole inside the disc with the same margin; nothing else from the sheet (speech bubbles, labels, other panels) comes along. The disc stays cream in dark mode, so the art keeps its own colours.

## App icons

The favicon and PWA icons can't follow the theme, so they use the navy circle. The Apple touch icon and the maskable icon fill the whole square with the same navy, because iOS and Android cut their own shape; the maskable icon keeps the sack inside the safe zone. No text other than the numeral in any icon.
