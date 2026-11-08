export const WRITE_REFUSED = '24:write-refused'

/**
 * Writes are not awaited: offline they only resolve when the device reconnects,
 * and the UI already shows the local change. They reject only when the server
 * refuses them, and Firestore then rolls the local change back. This tells the
 * person, through StatusBanner, so the change does not just vanish.
 */
export function report(error: unknown): void {
  console.error(error)
  window.dispatchEvent(new Event(WRITE_REFUSED))
}
