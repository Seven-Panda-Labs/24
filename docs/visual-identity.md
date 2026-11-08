# Visual identity

Modern 2D illustration with paper and jute textures: a full jute sack with **24** on the front, tied with a gold bow. Source: [`project_brief.md`](./project_brief.md), section 7, and the [moodboard](./visual_moodboard.html). Logo files: [`assets/Logo/`](./assets/Logo/).

Tokens live in `src/styles/globals.css`. Use the Tailwind tokens (`bg-primary`, `text-foreground`, `bg-surface`, …), never hard-coded hex. Dark mode follows the system.

## Typography

- **Display:** Fredoka, headings and the day numbers.
- **Sans:** Plus Jakarta Sans, everything else.

## Palette

| Token | Light | Dark | Brief name | Use |
|-------|-------|------|------------|-----|
| `primary` | `#1D6B4F` | `#1D6B4F` | Verde Abeto | Structure, buttons, titles |
| `primary-hover` | `#16543E` | `#16543E` | | Primary button hover |
| `secondary` | `#C8353F` | `#C8353F` | Vermelho Baga | Alerts, the outline of the 24 |
| `accent` | `#E3A82B` | `#E3A82B` | Dourado Warm | Seals, bows, celebration |
| `background` | `#FAF6EF` | `#1E2A44` | Creme Inverno / Noite de Consoada | App background |
| `surface` | `#F2EBDC` | `#2A3858` | Creme card | Cards |
| `foreground` | `#2E2A26` | `#FAF6EF` | Carvão Doce | Text |

`theme-color` is `#1D6B4F` in light and `#1E2A44` in dark. The dark `surface` is not in the brief; revisit it with the first dark-mode screens.

## Icons

`public/` holds the favicon, Apple touch icon and PWA icons, cropped from `docs/assets/Logo/logo.jpeg`. The maskable icon keeps the full canvas so the sack stays inside the safe zone. No text other than the numeral in any icon.
