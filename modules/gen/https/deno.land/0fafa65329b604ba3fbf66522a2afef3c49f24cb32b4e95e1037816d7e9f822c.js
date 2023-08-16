// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { DAY } from "./constants.ts";
/**
 * Returns the number of the day in the year in the local time zone.
 *
 * @example
 * ```ts
 * import { dayOfYear } from "https://deno.land/std@$STD_VERSION/datetime/mod.ts";
 *
 * dayOfYear(new Date("2019-03-11T03:24:00")); // output: 70
 * ```
 *
 * @return Number of the day in the year in the local time zone
 */ export function dayOfYear(date) {
    // Values from 0 to 99 map to the years 1900 to 1999. All other values are the actual year. (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/Date)
    // Using setFullYear as a workaround
    const yearStart = new Date(date);
    yearStart.setFullYear(date.getFullYear(), 0, 0);
    const diff = date.getTime() - yearStart.getTime();
    return Math.floor(diff / DAY);
}
/**
 * Returns the number of the day in the year in UTC time.
 *
 * @example
 * ```ts
 * import { dayOfYearUtc } from "https://deno.land/std@$STD_VERSION/datetime/mod.ts";
 *
 * dayOfYearUtc(new Date("2019-03-11T03:24:00.000Z")) // output 70
 * ```
 *
 * @return Number of the day in the year in UTC time
 */ export function dayOfYearUtc(date) {
    // Values from 0 to 99 map to the years 1900 to 1999. All other values are the actual year. (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/Date)
    // Using setUTCFullYear as a workaround
    const yearStart = new Date(date);
    yearStart.setUTCFullYear(date.getUTCFullYear(), 0, 0);
    const diff = date.getTime() - yearStart.getTime();
    return Math.floor(diff / DAY);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5OC4wL2RhdGV0aW1lL2RheV9vZl95ZWFyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjMgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbmltcG9ydCB7IERBWSB9IGZyb20gXCIuL2NvbnN0YW50cy50c1wiO1xuXG4vKipcbiAqIFJldHVybnMgdGhlIG51bWJlciBvZiB0aGUgZGF5IGluIHRoZSB5ZWFyIGluIHRoZSBsb2NhbCB0aW1lIHpvbmUuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBkYXlPZlllYXIgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9kYXRldGltZS9tb2QudHNcIjtcbiAqXG4gKiBkYXlPZlllYXIobmV3IERhdGUoXCIyMDE5LTAzLTExVDAzOjI0OjAwXCIpKTsgLy8gb3V0cHV0OiA3MFxuICogYGBgXG4gKlxuICogQHJldHVybiBOdW1iZXIgb2YgdGhlIGRheSBpbiB0aGUgeWVhciBpbiB0aGUgbG9jYWwgdGltZSB6b25lXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkYXlPZlllYXIoZGF0ZTogRGF0ZSk6IG51bWJlciB7XG4gIC8vIFZhbHVlcyBmcm9tIDAgdG8gOTkgbWFwIHRvIHRoZSB5ZWFycyAxOTAwIHRvIDE5OTkuIEFsbCBvdGhlciB2YWx1ZXMgYXJlIHRoZSBhY3R1YWwgeWVhci4gKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0RhdGUvRGF0ZSlcbiAgLy8gVXNpbmcgc2V0RnVsbFllYXIgYXMgYSB3b3JrYXJvdW5kXG5cbiAgY29uc3QgeWVhclN0YXJ0ID0gbmV3IERhdGUoZGF0ZSk7XG5cbiAgeWVhclN0YXJ0LnNldEZ1bGxZZWFyKGRhdGUuZ2V0RnVsbFllYXIoKSwgMCwgMCk7XG4gIGNvbnN0IGRpZmYgPSBkYXRlLmdldFRpbWUoKSAtXG4gICAgeWVhclN0YXJ0LmdldFRpbWUoKTtcblxuICByZXR1cm4gTWF0aC5mbG9vcihkaWZmIC8gREFZKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBudW1iZXIgb2YgdGhlIGRheSBpbiB0aGUgeWVhciBpbiBVVEMgdGltZS5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IGRheU9mWWVhclV0YyB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2RhdGV0aW1lL21vZC50c1wiO1xuICpcbiAqIGRheU9mWWVhclV0YyhuZXcgRGF0ZShcIjIwMTktMDMtMTFUMDM6MjQ6MDAuMDAwWlwiKSkgLy8gb3V0cHV0IDcwXG4gKiBgYGBcbiAqXG4gKiBAcmV0dXJuIE51bWJlciBvZiB0aGUgZGF5IGluIHRoZSB5ZWFyIGluIFVUQyB0aW1lXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkYXlPZlllYXJVdGMoZGF0ZTogRGF0ZSk6IG51bWJlciB7XG4gIC8vIFZhbHVlcyBmcm9tIDAgdG8gOTkgbWFwIHRvIHRoZSB5ZWFycyAxOTAwIHRvIDE5OTkuIEFsbCBvdGhlciB2YWx1ZXMgYXJlIHRoZSBhY3R1YWwgeWVhci4gKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0RhdGUvRGF0ZSlcbiAgLy8gVXNpbmcgc2V0VVRDRnVsbFllYXIgYXMgYSB3b3JrYXJvdW5kXG5cbiAgY29uc3QgeWVhclN0YXJ0ID0gbmV3IERhdGUoZGF0ZSk7XG5cbiAgeWVhclN0YXJ0LnNldFVUQ0Z1bGxZZWFyKGRhdGUuZ2V0VVRDRnVsbFllYXIoKSwgMCwgMCk7XG4gIGNvbnN0IGRpZmYgPSBkYXRlLmdldFRpbWUoKSAtXG4gICAgeWVhclN0YXJ0LmdldFRpbWUoKTtcblxuICByZXR1cm4gTWF0aC5mbG9vcihkaWZmIC8gREFZKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDLFNBQVMsR0FBRyxRQUFRLGlCQUFpQjtBQUVyQzs7Ozs7Ozs7Ozs7Q0FXQyxHQUNELE9BQU8sU0FBUyxVQUFVLElBQVU7SUFDbEMsd0xBQXdMO0lBQ3hMLG9DQUFvQztJQUVwQyxNQUFNLFlBQVksSUFBSSxLQUFLO0lBRTNCLFVBQVUsWUFBWSxLQUFLLGVBQWUsR0FBRztJQUM3QyxNQUFNLE9BQU8sS0FBSyxZQUNoQixVQUFVO0lBRVosT0FBTyxLQUFLLE1BQU0sT0FBTztBQUMzQjtBQUVBOzs7Ozs7Ozs7OztDQVdDLEdBQ0QsT0FBTyxTQUFTLGFBQWEsSUFBVTtJQUNyQyx3TEFBd0w7SUFDeEwsdUNBQXVDO0lBRXZDLE1BQU0sWUFBWSxJQUFJLEtBQUs7SUFFM0IsVUFBVSxlQUFlLEtBQUssa0JBQWtCLEdBQUc7SUFDbkQsTUFBTSxPQUFPLEtBQUssWUFDaEIsVUFBVTtJQUVaLE9BQU8sS0FBSyxNQUFNLE9BQU87QUFDM0IifQ==