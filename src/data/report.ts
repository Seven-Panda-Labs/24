/**
 * Writes are not awaited: offline they only resolve when the device reconnects,
 * and the UI already shows the local change. They reject only when the server
 * refuses them, which this logs.
 */
export function report(error: unknown): void {
  console.error(error)
}
