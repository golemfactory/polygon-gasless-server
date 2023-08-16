// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * The number of milliseconds in a second.
 *
 * @example
 * ```ts
 * import { SECOND } from "https://deno.land/std@$STD_VERSION/datetime/constants.ts";
 *
 * console.log(SECOND); // => 1000
 * ```
 */ export const SECOND = 1e3;
/**
 * The number of milliseconds in a minute.
 *
 * @example
 * ```ts
 * import { MINUTE } from "https://deno.land/std@$STD_VERSION/datetime/constants.ts";
 *
 * console.log(MINUTE); // => 60000 (60 * 1000)
 * ```
 */ export const MINUTE = SECOND * 60;
/**
 * The number of milliseconds in an hour.
 *
 * @example
 * ```ts
 * import { HOUR } from "https://deno.land/std@$STD_VERSION/datetime/constants.ts";
 *
 * console.log(HOUR); // => 3600000 (60 * 60 * 1000)
 * ```
 */ export const HOUR = MINUTE * 60;
/**
 * The number of milliseconds in a day.
 *
 * @example
 * ```ts
 * import { DAY } from "https://deno.land/std@$STD_VERSION/datetime/constants.ts";
 *
 * console.log(DAY); // => 86400000 (24 * 60 * 60 * 1000)
 * ```
 */ export const DAY = HOUR * 24;
/**
 * The number of milliseconds in a week.
 *
 * @example
 * ```ts
 * import { WEEK } from "https://deno.land/std@$STD_VERSION/datetime/constants.ts";
 *
 * console.log(WEEK); // => 604800000 (7 * 24 * 60 * 60 * 1000)
 * ```
 */ export const WEEK = DAY * 7;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5OC4wL2RhdGV0aW1lL2NvbnN0YW50cy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIzIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG4vKipcbiAqIFRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIGluIGEgc2Vjb25kLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgU0VDT05EIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vZGF0ZXRpbWUvY29uc3RhbnRzLnRzXCI7XG4gKlxuICogY29uc29sZS5sb2coU0VDT05EKTsgLy8gPT4gMTAwMFxuICogYGBgXG4gKi9cbmV4cG9ydCBjb25zdCBTRUNPTkQgPSAxZTM7XG4vKipcbiAqIFRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIGluIGEgbWludXRlLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgTUlOVVRFIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vZGF0ZXRpbWUvY29uc3RhbnRzLnRzXCI7XG4gKlxuICogY29uc29sZS5sb2coTUlOVVRFKTsgLy8gPT4gNjAwMDAgKDYwICogMTAwMClcbiAqIGBgYFxuICovXG5leHBvcnQgY29uc3QgTUlOVVRFID0gU0VDT05EICogNjA7XG4vKipcbiAqIFRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIGluIGFuIGhvdXIuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBIT1VSIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vZGF0ZXRpbWUvY29uc3RhbnRzLnRzXCI7XG4gKlxuICogY29uc29sZS5sb2coSE9VUik7IC8vID0+IDM2MDAwMDAgKDYwICogNjAgKiAxMDAwKVxuICogYGBgXG4gKi9cbmV4cG9ydCBjb25zdCBIT1VSID0gTUlOVVRFICogNjA7XG4vKipcbiAqIFRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIGluIGEgZGF5LlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgREFZIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vZGF0ZXRpbWUvY29uc3RhbnRzLnRzXCI7XG4gKlxuICogY29uc29sZS5sb2coREFZKTsgLy8gPT4gODY0MDAwMDAgKDI0ICogNjAgKiA2MCAqIDEwMDApXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNvbnN0IERBWSA9IEhPVVIgKiAyNDtcbi8qKlxuICogVGhlIG51bWJlciBvZiBtaWxsaXNlY29uZHMgaW4gYSB3ZWVrLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgV0VFSyB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2RhdGV0aW1lL2NvbnN0YW50cy50c1wiO1xuICpcbiAqIGNvbnNvbGUubG9nKFdFRUspOyAvLyA9PiA2MDQ4MDAwMDAgKDcgKiAyNCAqIDYwICogNjAgKiAxMDAwKVxuICogYGBgXG4gKi9cbmV4cG9ydCBjb25zdCBXRUVLID0gREFZICogNztcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDOzs7Ozs7Ozs7Q0FTQyxHQUNELE9BQU8sTUFBTSxTQUFTLElBQUk7QUFDMUI7Ozs7Ozs7OztDQVNDLEdBQ0QsT0FBTyxNQUFNLFNBQVMsU0FBUyxHQUFHO0FBQ2xDOzs7Ozs7Ozs7Q0FTQyxHQUNELE9BQU8sTUFBTSxPQUFPLFNBQVMsR0FBRztBQUNoQzs7Ozs7Ozs7O0NBU0MsR0FDRCxPQUFPLE1BQU0sTUFBTSxPQUFPLEdBQUc7QUFDN0I7Ozs7Ozs7OztDQVNDLEdBQ0QsT0FBTyxNQUFNLE9BQU8sTUFBTSxFQUFFIn0=