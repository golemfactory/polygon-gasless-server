// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/** Returns the index of the last occurrence of the needle array in the source
 * array, or -1 if it is not present.
 *
 * A start index can be specified as the third argument that begins the search
 * at that given index. The start index defaults to the end of the array.
 *
 * The complexity of this function is O(source.length * needle.length).
 *
 * ```ts
 * import { lastIndexOfNeedle } from "https://deno.land/std@$STD_VERSION/bytes/last_index_of_needle.ts";
 * const source = new Uint8Array([0, 1, 2, 1, 2, 1, 2, 3]);
 * const needle = new Uint8Array([1, 2]);
 * console.log(lastIndexOfNeedle(source, needle)); // 5
 * console.log(lastIndexOfNeedle(source, needle, 4)); // 3
 * ```
 */ export function lastIndexOfNeedle(source, needle, start = source.length - 1) {
    if (start < 0) {
        return -1;
    }
    if (start >= source.length) {
        start = source.length - 1;
    }
    const e = needle[needle.length - 1];
    for(let i = start; i >= 0; i--){
        if (source[i] !== e) continue;
        const pin = i;
        let matched = 1;
        let j = i;
        while(matched < needle.length){
            j--;
            if (source[j] !== needle[needle.length - 1 - (pin - j)]) {
                break;
            }
            matched++;
        }
        if (matched === needle.length) {
            return pin - needle.length + 1;
        }
    }
    return -1;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5My4wL2J5dGVzL2xhc3RfaW5kZXhfb2ZfbmVlZGxlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjMgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbi8qKiBSZXR1cm5zIHRoZSBpbmRleCBvZiB0aGUgbGFzdCBvY2N1cnJlbmNlIG9mIHRoZSBuZWVkbGUgYXJyYXkgaW4gdGhlIHNvdXJjZVxuICogYXJyYXksIG9yIC0xIGlmIGl0IGlzIG5vdCBwcmVzZW50LlxuICpcbiAqIEEgc3RhcnQgaW5kZXggY2FuIGJlIHNwZWNpZmllZCBhcyB0aGUgdGhpcmQgYXJndW1lbnQgdGhhdCBiZWdpbnMgdGhlIHNlYXJjaFxuICogYXQgdGhhdCBnaXZlbiBpbmRleC4gVGhlIHN0YXJ0IGluZGV4IGRlZmF1bHRzIHRvIHRoZSBlbmQgb2YgdGhlIGFycmF5LlxuICpcbiAqIFRoZSBjb21wbGV4aXR5IG9mIHRoaXMgZnVuY3Rpb24gaXMgTyhzb3VyY2UubGVuZ3RoICogbmVlZGxlLmxlbmd0aCkuXG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IGxhc3RJbmRleE9mTmVlZGxlIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vYnl0ZXMvbGFzdF9pbmRleF9vZl9uZWVkbGUudHNcIjtcbiAqIGNvbnN0IHNvdXJjZSA9IG5ldyBVaW50OEFycmF5KFswLCAxLCAyLCAxLCAyLCAxLCAyLCAzXSk7XG4gKiBjb25zdCBuZWVkbGUgPSBuZXcgVWludDhBcnJheShbMSwgMl0pO1xuICogY29uc29sZS5sb2cobGFzdEluZGV4T2ZOZWVkbGUoc291cmNlLCBuZWVkbGUpKTsgLy8gNVxuICogY29uc29sZS5sb2cobGFzdEluZGV4T2ZOZWVkbGUoc291cmNlLCBuZWVkbGUsIDQpKTsgLy8gM1xuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsYXN0SW5kZXhPZk5lZWRsZShcbiAgc291cmNlOiBVaW50OEFycmF5LFxuICBuZWVkbGU6IFVpbnQ4QXJyYXksXG4gIHN0YXJ0ID0gc291cmNlLmxlbmd0aCAtIDEsXG4pOiBudW1iZXIge1xuICBpZiAoc3RhcnQgPCAwKSB7XG4gICAgcmV0dXJuIC0xO1xuICB9XG4gIGlmIChzdGFydCA+PSBzb3VyY2UubGVuZ3RoKSB7XG4gICAgc3RhcnQgPSBzb3VyY2UubGVuZ3RoIC0gMTtcbiAgfVxuICBjb25zdCBlID0gbmVlZGxlW25lZWRsZS5sZW5ndGggLSAxXTtcbiAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpID49IDA7IGktLSkge1xuICAgIGlmIChzb3VyY2VbaV0gIT09IGUpIGNvbnRpbnVlO1xuICAgIGNvbnN0IHBpbiA9IGk7XG4gICAgbGV0IG1hdGNoZWQgPSAxO1xuICAgIGxldCBqID0gaTtcbiAgICB3aGlsZSAobWF0Y2hlZCA8IG5lZWRsZS5sZW5ndGgpIHtcbiAgICAgIGotLTtcbiAgICAgIGlmIChzb3VyY2Vbal0gIT09IG5lZWRsZVtuZWVkbGUubGVuZ3RoIC0gMSAtIChwaW4gLSBqKV0pIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBtYXRjaGVkKys7XG4gICAgfVxuICAgIGlmIChtYXRjaGVkID09PSBuZWVkbGUubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gcGluIC0gbmVlZGxlLmxlbmd0aCArIDE7XG4gICAgfVxuICB9XG4gIHJldHVybiAtMTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDOzs7Ozs7Ozs7Ozs7Ozs7Q0FlQyxHQUNELE9BQU8sU0FBUyxrQkFDZCxNQUFrQixFQUNsQixNQUFrQixFQUNsQixRQUFRLE9BQU8sU0FBUyxDQUFDO0lBRXpCLElBQUksUUFBUSxHQUFHO1FBQ2IsT0FBTyxDQUFDO0lBQ1Y7SUFDQSxJQUFJLFNBQVMsT0FBTyxRQUFRO1FBQzFCLFFBQVEsT0FBTyxTQUFTO0lBQzFCO0lBQ0EsTUFBTSxJQUFJLE1BQU0sQ0FBQyxPQUFPLFNBQVMsRUFBRTtJQUNuQyxJQUFLLElBQUksSUFBSSxPQUFPLEtBQUssR0FBRyxJQUFLO1FBQy9CLElBQUksTUFBTSxDQUFDLEVBQUUsS0FBSyxHQUFHO1FBQ3JCLE1BQU0sTUFBTTtRQUNaLElBQUksVUFBVTtRQUNkLElBQUksSUFBSTtRQUNSLE1BQU8sVUFBVSxPQUFPLE9BQVE7WUFDOUI7WUFDQSxJQUFJLE1BQU0sQ0FBQyxFQUFFLEtBQUssTUFBTSxDQUFDLE9BQU8sU0FBUyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRTtnQkFDdkQ7WUFDRjtZQUNBO1FBQ0Y7UUFDQSxJQUFJLFlBQVksT0FBTyxRQUFRO1lBQzdCLE9BQU8sTUFBTSxPQUFPLFNBQVM7UUFDL0I7SUFDRjtJQUNBLE9BQU8sQ0FBQztBQUNWIn0=