// Money arithmetic helpers.
//
// The database stores every money column as Postgres `numeric` (exact,
// arbitrary-precision decimal — not a float), and Drizzle returns those as
// strings. The bug this file exists to prevent lives entirely in the JS
// layer: converting those strings to `Number` and doing `*`, `+`, or a
// direct equality/comparison on the result reintroduces IEEE-754 floating
// point error (e.g. 0.1 + 0.2 !== 0.3), which is unacceptable for money.
//
// The fix here is *not* a full schema migration to integer minor units
// (ngwee) — that would touch every money column, every router, and the
// frontend display layer, and isn't something to do without a live DB to
// migrate and test against. Instead: do all arithmetic in integer cents,
// and only ever convert to/from decimal strings at the boundary.
//
// Every amount in this app is at most 2 decimal places, so this is safe.

/** Parse a decimal string (e.g. "1234.50") into integer cents (123450). */
export function toCents(value: string | number): number {
  const str = typeof value === "number" ? value.toFixed(2) : value;
  const [wholeRaw, fracRaw = ""] = str.split(".");
  const negative = wholeRaw.startsWith("-");
  const whole = Math.abs(Number(wholeRaw || "0"));
  const frac = Number((fracRaw + "00").slice(0, 2));
  if (!Number.isFinite(whole) || !Number.isFinite(frac)) {
    throw new Error(`Invalid money value: ${value}`);
  }
  const cents = whole * 100 + frac;
  return negative ? -cents : cents;
}

/** Format integer cents back into a decimal string (123450 -> "1234.50"). */
export function fromCents(cents: number): string {
  const negative = cents < 0;
  const abs = Math.abs(Math.round(cents));
  const whole = Math.floor(abs / 100);
  const frac = abs % 100;
  return `${negative ? "-" : ""}${whole}.${frac.toString().padStart(2, "0")}`;
}

/** Multiply a decimal money string by an integer quantity, in cents. */
export function mulCents(value: string | number, quantity: number): number {
  return toCents(value) * quantity;
}

/** Sum a list of integer-cents values. */
export function sumCents(values: number[]): number {
  return values.reduce((acc, v) => acc + v, 0);
}
