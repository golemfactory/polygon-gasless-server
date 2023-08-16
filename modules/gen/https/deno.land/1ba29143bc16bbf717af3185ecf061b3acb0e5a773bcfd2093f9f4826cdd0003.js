// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Returns whether the given date or year (in number) is a leap year or not in the local time zone.
 * based on: https://docs.microsoft.com/en-us/office/troubleshoot/excel/determine-a-leap-year
 *
 * @example
 * ```ts
 * import { isLeap } from "https://deno.land/std@$STD_VERSION/datetime/is_leap.ts";
 *
 * isLeap(new Date("1970-01-02")); // => returns false
 * isLeap(new Date("1972-01-02")); // => returns true
 * isLeap(new Date("2000-01-02")); // => returns true
 * isLeap(new Date("2100-01-02")); // => returns false
 * isLeap(1972); // => returns true
 * ```
 *
 * Some dates may return different values depending on your timezone.
 *
 * @example
 * ```ts
 * import { isLeap } from "https://deno.land/std@$STD_VERSION/datetime/is_leap.ts";
 *
 * isLeap(new Date("2000-01-01")); // => returns true if the local timezone is GMT+0, returns false if the local timezone is GMT-1
 * isLeap(2000); // => returns true regardless of the local timezone
 * ```
 *
 * @param year year in number or Date format
 */ export function isLeap(year) {
    const yearNumber = year instanceof Date ? year.getFullYear() : year;
    return isYearNumberALeapYear(yearNumber);
}
/**
 * Returns whether the given date or year (in number) is a leap year or not in UTC time. This always returns the same value regardless of the local timezone.
 * based on: https://docs.microsoft.com/en-us/office/troubleshoot/excel/determine-a-leap-year
 *
 * @example
 * ```ts
 * import { isUtcLeap } from "https://deno.land/std@$STD_VERSION/datetime/is_leap.ts";
 *
 * isUtcLeap(2000); // => returns true regardless of the local timezone
 * isUtcLeap(new Date("2000-01-01")); // => returns true regardless of the local timezone
 * isUtcLeap(new Date("January 1, 2000 00:00:00 GMT+00:00")); // => returns true regardless of the local timezone
 * isUtcLeap(new Date("December 31, 2000 23:59:59 GMT+00:00")); // => returns true regardless of the local timezone
 * isUtcLeap(new Date("January 1, 2000 00:00:00 GMT+01:00")); // => returns false regardless of the local timezone
 * isUtcLeap(new Date("December 31, 2000 23:59:59 GMT-01:00")); // => returns false regardless of the local timezone
 * isUtcLeap(new Date("January 1, 2001 00:00:00 GMT+01:00")); // => returns true regardless of the local timezone
 * isUtcLeap(new Date("December 31, 1999 23:59:59 GMT-01:00")); // => returns true regardless of the local timezone
 * ```
 *
 * @param year year in number or Date format
 */ export function isUtcLeap(year) {
    const yearNumber = year instanceof Date ? year.getUTCFullYear() : year;
    return isYearNumberALeapYear(yearNumber);
}
function isYearNumberALeapYear(yearNumber) {
    return yearNumber % 4 === 0 && yearNumber % 100 !== 0 || yearNumber % 400 === 0;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5OC4wL2RhdGV0aW1lL2lzX2xlYXAudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMyB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuLyoqXG4gKiBSZXR1cm5zIHdoZXRoZXIgdGhlIGdpdmVuIGRhdGUgb3IgeWVhciAoaW4gbnVtYmVyKSBpcyBhIGxlYXAgeWVhciBvciBub3QgaW4gdGhlIGxvY2FsIHRpbWUgem9uZS5cbiAqIGJhc2VkIG9uOiBodHRwczovL2RvY3MubWljcm9zb2Z0LmNvbS9lbi11cy9vZmZpY2UvdHJvdWJsZXNob290L2V4Y2VsL2RldGVybWluZS1hLWxlYXAteWVhclxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgaXNMZWFwIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vZGF0ZXRpbWUvaXNfbGVhcC50c1wiO1xuICpcbiAqIGlzTGVhcChuZXcgRGF0ZShcIjE5NzAtMDEtMDJcIikpOyAvLyA9PiByZXR1cm5zIGZhbHNlXG4gKiBpc0xlYXAobmV3IERhdGUoXCIxOTcyLTAxLTAyXCIpKTsgLy8gPT4gcmV0dXJucyB0cnVlXG4gKiBpc0xlYXAobmV3IERhdGUoXCIyMDAwLTAxLTAyXCIpKTsgLy8gPT4gcmV0dXJucyB0cnVlXG4gKiBpc0xlYXAobmV3IERhdGUoXCIyMTAwLTAxLTAyXCIpKTsgLy8gPT4gcmV0dXJucyBmYWxzZVxuICogaXNMZWFwKDE5NzIpOyAvLyA9PiByZXR1cm5zIHRydWVcbiAqIGBgYFxuICpcbiAqIFNvbWUgZGF0ZXMgbWF5IHJldHVybiBkaWZmZXJlbnQgdmFsdWVzIGRlcGVuZGluZyBvbiB5b3VyIHRpbWV6b25lLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgaXNMZWFwIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vZGF0ZXRpbWUvaXNfbGVhcC50c1wiO1xuICpcbiAqIGlzTGVhcChuZXcgRGF0ZShcIjIwMDAtMDEtMDFcIikpOyAvLyA9PiByZXR1cm5zIHRydWUgaWYgdGhlIGxvY2FsIHRpbWV6b25lIGlzIEdNVCswLCByZXR1cm5zIGZhbHNlIGlmIHRoZSBsb2NhbCB0aW1lem9uZSBpcyBHTVQtMVxuICogaXNMZWFwKDIwMDApOyAvLyA9PiByZXR1cm5zIHRydWUgcmVnYXJkbGVzcyBvZiB0aGUgbG9jYWwgdGltZXpvbmVcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSB5ZWFyIHllYXIgaW4gbnVtYmVyIG9yIERhdGUgZm9ybWF0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0xlYXAoeWVhcjogRGF0ZSB8IG51bWJlcik6IGJvb2xlYW4ge1xuICBjb25zdCB5ZWFyTnVtYmVyID0geWVhciBpbnN0YW5jZW9mIERhdGUgPyB5ZWFyLmdldEZ1bGxZZWFyKCkgOiB5ZWFyO1xuICByZXR1cm4gaXNZZWFyTnVtYmVyQUxlYXBZZWFyKHllYXJOdW1iZXIpO1xufVxuXG4vKipcbiAqIFJldHVybnMgd2hldGhlciB0aGUgZ2l2ZW4gZGF0ZSBvciB5ZWFyIChpbiBudW1iZXIpIGlzIGEgbGVhcCB5ZWFyIG9yIG5vdCBpbiBVVEMgdGltZS4gVGhpcyBhbHdheXMgcmV0dXJucyB0aGUgc2FtZSB2YWx1ZSByZWdhcmRsZXNzIG9mIHRoZSBsb2NhbCB0aW1lem9uZS5cbiAqIGJhc2VkIG9uOiBodHRwczovL2RvY3MubWljcm9zb2Z0LmNvbS9lbi11cy9vZmZpY2UvdHJvdWJsZXNob290L2V4Y2VsL2RldGVybWluZS1hLWxlYXAteWVhclxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgaXNVdGNMZWFwIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vZGF0ZXRpbWUvaXNfbGVhcC50c1wiO1xuICpcbiAqIGlzVXRjTGVhcCgyMDAwKTsgLy8gPT4gcmV0dXJucyB0cnVlIHJlZ2FyZGxlc3Mgb2YgdGhlIGxvY2FsIHRpbWV6b25lXG4gKiBpc1V0Y0xlYXAobmV3IERhdGUoXCIyMDAwLTAxLTAxXCIpKTsgLy8gPT4gcmV0dXJucyB0cnVlIHJlZ2FyZGxlc3Mgb2YgdGhlIGxvY2FsIHRpbWV6b25lXG4gKiBpc1V0Y0xlYXAobmV3IERhdGUoXCJKYW51YXJ5IDEsIDIwMDAgMDA6MDA6MDAgR01UKzAwOjAwXCIpKTsgLy8gPT4gcmV0dXJucyB0cnVlIHJlZ2FyZGxlc3Mgb2YgdGhlIGxvY2FsIHRpbWV6b25lXG4gKiBpc1V0Y0xlYXAobmV3IERhdGUoXCJEZWNlbWJlciAzMSwgMjAwMCAyMzo1OTo1OSBHTVQrMDA6MDBcIikpOyAvLyA9PiByZXR1cm5zIHRydWUgcmVnYXJkbGVzcyBvZiB0aGUgbG9jYWwgdGltZXpvbmVcbiAqIGlzVXRjTGVhcChuZXcgRGF0ZShcIkphbnVhcnkgMSwgMjAwMCAwMDowMDowMCBHTVQrMDE6MDBcIikpOyAvLyA9PiByZXR1cm5zIGZhbHNlIHJlZ2FyZGxlc3Mgb2YgdGhlIGxvY2FsIHRpbWV6b25lXG4gKiBpc1V0Y0xlYXAobmV3IERhdGUoXCJEZWNlbWJlciAzMSwgMjAwMCAyMzo1OTo1OSBHTVQtMDE6MDBcIikpOyAvLyA9PiByZXR1cm5zIGZhbHNlIHJlZ2FyZGxlc3Mgb2YgdGhlIGxvY2FsIHRpbWV6b25lXG4gKiBpc1V0Y0xlYXAobmV3IERhdGUoXCJKYW51YXJ5IDEsIDIwMDEgMDA6MDA6MDAgR01UKzAxOjAwXCIpKTsgLy8gPT4gcmV0dXJucyB0cnVlIHJlZ2FyZGxlc3Mgb2YgdGhlIGxvY2FsIHRpbWV6b25lXG4gKiBpc1V0Y0xlYXAobmV3IERhdGUoXCJEZWNlbWJlciAzMSwgMTk5OSAyMzo1OTo1OSBHTVQtMDE6MDBcIikpOyAvLyA9PiByZXR1cm5zIHRydWUgcmVnYXJkbGVzcyBvZiB0aGUgbG9jYWwgdGltZXpvbmVcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSB5ZWFyIHllYXIgaW4gbnVtYmVyIG9yIERhdGUgZm9ybWF0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1V0Y0xlYXAoeWVhcjogRGF0ZSB8IG51bWJlcik6IGJvb2xlYW4ge1xuICBjb25zdCB5ZWFyTnVtYmVyID0geWVhciBpbnN0YW5jZW9mIERhdGUgPyB5ZWFyLmdldFVUQ0Z1bGxZZWFyKCkgOiB5ZWFyO1xuICByZXR1cm4gaXNZZWFyTnVtYmVyQUxlYXBZZWFyKHllYXJOdW1iZXIpO1xufVxuXG5mdW5jdGlvbiBpc1llYXJOdW1iZXJBTGVhcFllYXIoeWVhck51bWJlcjogbnVtYmVyKTogYm9vbGVhbiB7XG4gIHJldHVybiAoXG4gICAgKHllYXJOdW1iZXIgJSA0ID09PSAwICYmIHllYXJOdW1iZXIgJSAxMDAgIT09IDApIHx8IHllYXJOdW1iZXIgJSA0MDAgPT09IDBcbiAgKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQTBCQyxHQUNELE9BQU8sU0FBUyxPQUFPLElBQW1CO0lBQ3hDLE1BQU0sYUFBYSxnQkFBZ0IsT0FBTyxLQUFLLGdCQUFnQjtJQUMvRCxPQUFPLHNCQUFzQjtBQUMvQjtBQUVBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBbUJDLEdBQ0QsT0FBTyxTQUFTLFVBQVUsSUFBbUI7SUFDM0MsTUFBTSxhQUFhLGdCQUFnQixPQUFPLEtBQUssbUJBQW1CO0lBQ2xFLE9BQU8sc0JBQXNCO0FBQy9CO0FBRUEsU0FBUyxzQkFBc0IsVUFBa0I7SUFDL0MsT0FDRSxBQUFDLGFBQWEsTUFBTSxLQUFLLGFBQWEsUUFBUSxLQUFNLGFBQWEsUUFBUTtBQUU3RSJ9