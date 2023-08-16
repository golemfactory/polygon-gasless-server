// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { indexOfNeedle } from "./index_of_needle.ts";
/** Returns true if the source array contains the needle array, false otherwise.
 *
 * A start index can be specified as the third argument that begins the search
 * at that given index. The start index defaults to the beginning of the array.
 *
 * The complexity of this function is O(source.length * needle.length).
 *
 * ```ts
 * import { includesNeedle } from "https://deno.land/std@$STD_VERSION/bytes/includes_needle.ts";
 * const source = new Uint8Array([0, 1, 2, 1, 2, 1, 2, 3]);
 * const needle = new Uint8Array([1, 2]);
 * console.log(includesNeedle(source, needle)); // true
 * console.log(includesNeedle(source, needle, 6)); // false
 * ```
 */ export function includesNeedle(source, needle, start = 0) {
    return indexOfNeedle(source, needle, start) !== -1;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5My4wL2J5dGVzL2luY2x1ZGVzX25lZWRsZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIzIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQgeyBpbmRleE9mTmVlZGxlIH0gZnJvbSBcIi4vaW5kZXhfb2ZfbmVlZGxlLnRzXCI7XG5cbi8qKiBSZXR1cm5zIHRydWUgaWYgdGhlIHNvdXJjZSBhcnJheSBjb250YWlucyB0aGUgbmVlZGxlIGFycmF5LCBmYWxzZSBvdGhlcndpc2UuXG4gKlxuICogQSBzdGFydCBpbmRleCBjYW4gYmUgc3BlY2lmaWVkIGFzIHRoZSB0aGlyZCBhcmd1bWVudCB0aGF0IGJlZ2lucyB0aGUgc2VhcmNoXG4gKiBhdCB0aGF0IGdpdmVuIGluZGV4LiBUaGUgc3RhcnQgaW5kZXggZGVmYXVsdHMgdG8gdGhlIGJlZ2lubmluZyBvZiB0aGUgYXJyYXkuXG4gKlxuICogVGhlIGNvbXBsZXhpdHkgb2YgdGhpcyBmdW5jdGlvbiBpcyBPKHNvdXJjZS5sZW5ndGggKiBuZWVkbGUubGVuZ3RoKS5cbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgaW5jbHVkZXNOZWVkbGUgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9ieXRlcy9pbmNsdWRlc19uZWVkbGUudHNcIjtcbiAqIGNvbnN0IHNvdXJjZSA9IG5ldyBVaW50OEFycmF5KFswLCAxLCAyLCAxLCAyLCAxLCAyLCAzXSk7XG4gKiBjb25zdCBuZWVkbGUgPSBuZXcgVWludDhBcnJheShbMSwgMl0pO1xuICogY29uc29sZS5sb2coaW5jbHVkZXNOZWVkbGUoc291cmNlLCBuZWVkbGUpKTsgLy8gdHJ1ZVxuICogY29uc29sZS5sb2coaW5jbHVkZXNOZWVkbGUoc291cmNlLCBuZWVkbGUsIDYpKTsgLy8gZmFsc2VcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5jbHVkZXNOZWVkbGUoXG4gIHNvdXJjZTogVWludDhBcnJheSxcbiAgbmVlZGxlOiBVaW50OEFycmF5LFxuICBzdGFydCA9IDAsXG4pOiBib29sZWFuIHtcbiAgcmV0dXJuIGluZGV4T2ZOZWVkbGUoc291cmNlLCBuZWVkbGUsIHN0YXJ0KSAhPT0gLTE7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUVyQyxTQUFTLGFBQWEsUUFBUSx1QkFBdUI7QUFFckQ7Ozs7Ozs7Ozs7Ozs7O0NBY0MsR0FDRCxPQUFPLFNBQVMsZUFDZCxNQUFrQixFQUNsQixNQUFrQixFQUNsQixRQUFRLENBQUM7SUFFVCxPQUFPLGNBQWMsUUFBUSxRQUFRLFdBQVcsQ0FBQztBQUNuRCJ9