// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Formats the given date to IMF date time format. (Reference:
 * https://tools.ietf.org/html/rfc7231#section-7.1.1.1).
 * IMF is the time format to use when generating times in HTTP
 * headers. The time being formatted must be in UTC for Format to
 * generate the correct format.
 *
 * @example
 * ```ts
 * import { toIMF } from "https://deno.land/std@$STD_VERSION/datetime/to_imf.ts";
 *
 * toIMF(new Date(0)); // => returns "Thu, 01 Jan 1970 00:00:00 GMT"
 * ```
 * @param date Date to parse
 * @return IMF date formatted string
 */ export function toIMF(date) {
    function dtPad(v, lPad = 2) {
        return v.padStart(lPad, "0");
    }
    const d = dtPad(date.getUTCDate().toString());
    const h = dtPad(date.getUTCHours().toString());
    const min = dtPad(date.getUTCMinutes().toString());
    const s = dtPad(date.getUTCSeconds().toString());
    const y = date.getUTCFullYear();
    const days = [
        "Sun",
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat"
    ];
    const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec"
    ];
    return `${days[date.getUTCDay()]}, ${d} ${months[date.getUTCMonth()]} ${y} ${h}:${min}:${s} GMT`;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5OC4wL2RhdGV0aW1lL3RvX2ltZi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIzIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG4vKipcbiAqIEZvcm1hdHMgdGhlIGdpdmVuIGRhdGUgdG8gSU1GIGRhdGUgdGltZSBmb3JtYXQuIChSZWZlcmVuY2U6XG4gKiBodHRwczovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjNzIzMSNzZWN0aW9uLTcuMS4xLjEpLlxuICogSU1GIGlzIHRoZSB0aW1lIGZvcm1hdCB0byB1c2Ugd2hlbiBnZW5lcmF0aW5nIHRpbWVzIGluIEhUVFBcbiAqIGhlYWRlcnMuIFRoZSB0aW1lIGJlaW5nIGZvcm1hdHRlZCBtdXN0IGJlIGluIFVUQyBmb3IgRm9ybWF0IHRvXG4gKiBnZW5lcmF0ZSB0aGUgY29ycmVjdCBmb3JtYXQuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyB0b0lNRiB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2RhdGV0aW1lL3RvX2ltZi50c1wiO1xuICpcbiAqIHRvSU1GKG5ldyBEYXRlKDApKTsgLy8gPT4gcmV0dXJucyBcIlRodSwgMDEgSmFuIDE5NzAgMDA6MDA6MDAgR01UXCJcbiAqIGBgYFxuICogQHBhcmFtIGRhdGUgRGF0ZSB0byBwYXJzZVxuICogQHJldHVybiBJTUYgZGF0ZSBmb3JtYXR0ZWQgc3RyaW5nXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0b0lNRihkYXRlOiBEYXRlKTogc3RyaW5nIHtcbiAgZnVuY3Rpb24gZHRQYWQodjogc3RyaW5nLCBsUGFkID0gMik6IHN0cmluZyB7XG4gICAgcmV0dXJuIHYucGFkU3RhcnQobFBhZCwgXCIwXCIpO1xuICB9XG4gIGNvbnN0IGQgPSBkdFBhZChkYXRlLmdldFVUQ0RhdGUoKS50b1N0cmluZygpKTtcbiAgY29uc3QgaCA9IGR0UGFkKGRhdGUuZ2V0VVRDSG91cnMoKS50b1N0cmluZygpKTtcbiAgY29uc3QgbWluID0gZHRQYWQoZGF0ZS5nZXRVVENNaW51dGVzKCkudG9TdHJpbmcoKSk7XG4gIGNvbnN0IHMgPSBkdFBhZChkYXRlLmdldFVUQ1NlY29uZHMoKS50b1N0cmluZygpKTtcbiAgY29uc3QgeSA9IGRhdGUuZ2V0VVRDRnVsbFllYXIoKTtcbiAgY29uc3QgZGF5cyA9IFtcIlN1blwiLCBcIk1vblwiLCBcIlR1ZVwiLCBcIldlZFwiLCBcIlRodVwiLCBcIkZyaVwiLCBcIlNhdFwiXTtcbiAgY29uc3QgbW9udGhzID0gW1xuICAgIFwiSmFuXCIsXG4gICAgXCJGZWJcIixcbiAgICBcIk1hclwiLFxuICAgIFwiQXByXCIsXG4gICAgXCJNYXlcIixcbiAgICBcIkp1blwiLFxuICAgIFwiSnVsXCIsXG4gICAgXCJBdWdcIixcbiAgICBcIlNlcFwiLFxuICAgIFwiT2N0XCIsXG4gICAgXCJOb3ZcIixcbiAgICBcIkRlY1wiLFxuICBdO1xuICByZXR1cm4gYCR7ZGF5c1tkYXRlLmdldFVUQ0RheSgpXX0sICR7ZH0gJHtcbiAgICBtb250aHNbZGF0ZS5nZXRVVENNb250aCgpXVxuICB9ICR7eX0gJHtofToke21pbn06JHtzfSBHTVRgO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckM7Ozs7Ozs7Ozs7Ozs7OztDQWVDLEdBQ0QsT0FBTyxTQUFTLE1BQU0sSUFBVTtJQUM5QixTQUFTLE1BQU0sQ0FBUyxFQUFFLE9BQU8sQ0FBQztRQUNoQyxPQUFPLEVBQUUsU0FBUyxNQUFNO0lBQzFCO0lBQ0EsTUFBTSxJQUFJLE1BQU0sS0FBSyxhQUFhO0lBQ2xDLE1BQU0sSUFBSSxNQUFNLEtBQUssY0FBYztJQUNuQyxNQUFNLE1BQU0sTUFBTSxLQUFLLGdCQUFnQjtJQUN2QyxNQUFNLElBQUksTUFBTSxLQUFLLGdCQUFnQjtJQUNyQyxNQUFNLElBQUksS0FBSztJQUNmLE1BQU0sT0FBTztRQUFDO1FBQU87UUFBTztRQUFPO1FBQU87UUFBTztRQUFPO0tBQU07SUFDOUQsTUFBTSxTQUFTO1FBQ2I7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO0tBQ0Q7SUFDRCxPQUFPLENBQUMsRUFBRSxJQUFJLENBQUMsS0FBSyxZQUFZLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUN0QyxNQUFNLENBQUMsS0FBSyxjQUFjLENBQzNCLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQztBQUM5QiJ9