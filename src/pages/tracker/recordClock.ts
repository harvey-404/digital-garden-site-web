// HTTP Date is rounded down to seconds; elapsed monotonic time preserves that
// conservative server timestamp without relying on the device's wall clock.
export class RecordClock {
  private anchor: { instant: number; monotonic: number } | null = null;
  observe(date: string | null, monotonic = performance.now()) {
    const instant = date ? Date.parse(date) : NaN;
    if (Number.isFinite(instant)) this.anchor = { instant, monotonic };
  }
  now(monotonic = performance.now(), fallback = Date.now()) {
    return new Date(this.anchor ? this.anchor.instant + Math.max(0, monotonic - this.anchor.monotonic) : fallback).toISOString();
  }
}
