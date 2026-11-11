# Changelog

## [0.19.1] - 2026-11-11

### Fixed

- In a shared calendar, "Already given to someone else in the family" suggestions only come from calendars everyone in it can also see. A secret calendar no longer shows up in the suggestions of a calendar shared with the person it is kept from.

## [0.19.0] - 2026-11-11

### Added

- Account approval: anyone signing in for the first time waits until the admin approves their account, and only then sees calendars and people. The waiting page opens 24 by itself as soon as the account is approved.
- For the admin, an Accounts section in Settings to approve, reject or block accounts, and a notice on the home page when accounts are waiting.

## [0.18.0] - 2026-11-11

### Changed

- Sharing is now per calendar, not the whole family. A new calendar is only yours; to share it, use Share on the calendar. So you can prepare someone's calendar in secret and prepare others together.
- Everyone in a calendar can invite, remove people, leave or delete it. When you invite, the app suggests people who already use 24. Invites show on the home page, with Accept and Decline.
- Tags now belong to each calendar and open from its settings. When you create a calendar, you pick which one to copy tags from; by default, the latest for the same person.
- Calendars you already had move to the new format, with their tags and photos.
- To do, History, suggestions and the Sunday reminder only count the calendars you see.

### Removed

- The family space, and the step to create it on first sign-in.

## [0.17.0] - 2026-11-09

### Changed

- Spreading the sack now places the gifts across the whole calendar instead of on the first empty days: 9 gifts in 24 days land every 2 or 3 days.

## [0.16.1] - 2026-11-09

### Fixed

- On Android, adding a photo now lets you take it with the camera, not only pick it from the gallery.

## [0.16.0] - 2026-11-08

### Added

- Gifts from a photo: in the sack or on an empty day, taking or choosing a photo creates the gift straight away, and the name becomes optional.

### Changed

- The sack moves to the top of the calendar, before the days. It shows the 3 newest gifts and a "Show more" button for the rest.
- Photos stand out: they fill the whole door on the grid and show as thumbnails in the list, the sack, To do and History.
- Shopping is now called To do, since it holds what is left to buy and what is left to wrap.

## [0.15.0] - 2026-11-08

### Added

- The whole app in German and French, including the suggested ideas, this What's new page and the weekly reminders. Choose the language in Settings; the first time, it follows the browser.

## [0.14.1] - 2026-11-08

### Fixed

- On a phone with a weak signal, the app opens straight away with the saved data, instead of waiting on the splash for Google's sign-in services.
- The sign-in page shows up faster on phones.

## [0.14.0] - 2026-11-08

### Added

- Spread the sack over the empty days: a preview shows each day first, then it applies. Gifts with the same tag end up as far apart as they can, and days already filled stay as they are.

## [0.13.0] - 2026-11-08

### Added

- A footer with the app version, which opens a What's new page with this changelog.

## [0.12.0] - 2026-11-08

### Added

- A sack in each calendar: gifts and ideas without a day yet, to place later. They count towards progress while there are empty days, and show on the shopping list and in the weekly reminder. A gift goes from the sack to a day from its editor or from an empty day, and a filled day can send its gift back to the sack.

## [0.11.0] - 2026-11-08

### Changed

- New logo: the sack on a navy circle in the light theme and on a white circle in the dark theme. The "24" text next to the logo is gone from the sign-in page and the navigation bar.
- Empty-state illustrations all have the same size and shape, on a cream circle, with no figure cut off.

## [0.10.0] - 2026-11-08

### Removed

- Signing in with an email link. Google is the only way to sign in, and the server rules refuse accounts from any other method.

## [0.9.0] - 2026-11-08

### Added

- Theme in Settings: System, Light or Dark, saved per device.

## [0.8.0] - 2026-11-08

### Changed

- Tags look like vintage gift tags, with a clipped point and a punched hole. The selected tag in the editor is bold and outlined.

## [0.7.0] - 2026-11-08

### Added

- Optional reminder notifications: on Sunday evenings, from November to Christmas, what is left to buy, wrap and fill. Turned on per device, in Settings.

## [0.6.0] - 2026-11-08

### Added

- A notice when offline: changes are kept and sync later.
- An alert when the server refuses a change, instead of it vanishing without a word.

## [0.5.0] - 2026-11-08

### Added

- A photo of the gift on each day.
- The Santa's Workshop seal and confetti when a calendar is fully wrapped.
- Fonts and photos already seen are available offline.

### Changed

- Grid doors show more of the gift name.
- Dark mode colours with more contrast.
- The sign-in page opens faster and secondary text has more contrast.

### Fixed

- Someone without a family space was stuck on the loading screen when coming back to the app.
- Saving a day no longer undoes or deletes what someone else changed meanwhile.
- Uploading a photo offline says so straight away instead of spinning.

## [0.4.0] - 2026-11-08

### Added

- Suggestions on an empty day: the person's traditions, gifts forgotten for years and new ideas, avoiding what they got in the last two years.
- Each calendar chooses between traditional and original suggestions, and whether gifts can repeat.
- Dismissing a suggestion stops showing it for that calendar.
- History shows how many of this year's days came from suggestions.

## [0.3.0] - 2026-11-08

### Added

- History: search gifts from every year, ignoring accents and case, and filter by person.
- Script to import the original Excel, one calendar per year.

### Fixed

- European Portuguese plurals: "0 comprados" instead of "0 comprado".

## [0.2.0] - 2026-11-08

### Added

- Sign in with Google or with a link sent by email.
- Shared family space: invite by email, accept invites and manage members.
- Calendars per person and per year, with a 24-door grid and a list view for quick filling.
- Each day has a gift, a status (planned, bought, wrapped), tags and notes.
- Progress bar and filters by status and by tag.
- The year's shopping list and a list of what is left to wrap, both working offline.
- Editable tags: name, emoji and colour.

## [0.1.0] - 2026-11-08

### Added

- First version you can install on your phone, in Portuguese and English.
