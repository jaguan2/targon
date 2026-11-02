/**
 * `tz-lookup` ships no types and has no `@types` package.
 *
 * It maps coordinates to an IANA zone name using a bundled offline lookup
 * table, so it works client-side with no network call.
 */
declare module 'tz-lookup' {
  /**
   * @param latitude Decimal degrees, -90 to 90.
   * @param longitude Decimal degrees, -180 to 180.
   * @returns An IANA zone name, e.g. `America/New_York`.
   */
  export default function tzLookup(latitude: number, longitude: number): string;
}
