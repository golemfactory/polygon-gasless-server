// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { copy } from "./copy.ts";
/** Returns a new Uint8Array composed of `count` repetitions of the `source`
 * array.
 *
 * If `count` is negative, a `RangeError` is thrown.
 *
 * ```ts
 * import { repeat } from "https://deno.land/std@$STD_VERSION/bytes/repeat.ts";
 * const source = new Uint8Array([0, 1, 2]);
 * console.log(repeat(source, 3)); // [0, 1, 2, 0, 1, 2, 0, 1, 2]
 * console.log(repeat(source, 0)); // []
 * console.log(repeat(source, -1)); // RangeError
 * ```
 */ export function repeat(source, count) {
    if (count === 0) {
        return new Uint8Array();
    }
    if (count < 0) {
        throw new RangeError("bytes: negative repeat count");
    }
    if (!Number.isInteger(count)) {
        throw new Error("bytes: repeat count must be an integer");
    }
    const nb = new Uint8Array(source.length * count);
    let bp = copy(source, nb);
    for(; bp < nb.length; bp *= 2){
        copy(nb.slice(0, bp), nb, bp);
    }
    return nb;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5My4wL2J5dGVzL3JlcGVhdC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIzIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuaW1wb3J0IHsgY29weSB9IGZyb20gXCIuL2NvcHkudHNcIjtcblxuLyoqIFJldHVybnMgYSBuZXcgVWludDhBcnJheSBjb21wb3NlZCBvZiBgY291bnRgIHJlcGV0aXRpb25zIG9mIHRoZSBgc291cmNlYFxuICogYXJyYXkuXG4gKlxuICogSWYgYGNvdW50YCBpcyBuZWdhdGl2ZSwgYSBgUmFuZ2VFcnJvcmAgaXMgdGhyb3duLlxuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyByZXBlYXQgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9ieXRlcy9yZXBlYXQudHNcIjtcbiAqIGNvbnN0IHNvdXJjZSA9IG5ldyBVaW50OEFycmF5KFswLCAxLCAyXSk7XG4gKiBjb25zb2xlLmxvZyhyZXBlYXQoc291cmNlLCAzKSk7IC8vIFswLCAxLCAyLCAwLCAxLCAyLCAwLCAxLCAyXVxuICogY29uc29sZS5sb2cocmVwZWF0KHNvdXJjZSwgMCkpOyAvLyBbXVxuICogY29uc29sZS5sb2cocmVwZWF0KHNvdXJjZSwgLTEpKTsgLy8gUmFuZ2VFcnJvclxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZXBlYXQoc291cmNlOiBVaW50OEFycmF5LCBjb3VudDogbnVtYmVyKTogVWludDhBcnJheSB7XG4gIGlmIChjb3VudCA9PT0gMCkge1xuICAgIHJldHVybiBuZXcgVWludDhBcnJheSgpO1xuICB9XG5cbiAgaWYgKGNvdW50IDwgMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKFwiYnl0ZXM6IG5lZ2F0aXZlIHJlcGVhdCBjb3VudFwiKTtcbiAgfVxuXG4gIGlmICghTnVtYmVyLmlzSW50ZWdlcihjb3VudCkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJieXRlczogcmVwZWF0IGNvdW50IG11c3QgYmUgYW4gaW50ZWdlclwiKTtcbiAgfVxuXG4gIGNvbnN0IG5iID0gbmV3IFVpbnQ4QXJyYXkoc291cmNlLmxlbmd0aCAqIGNvdW50KTtcblxuICBsZXQgYnAgPSBjb3B5KHNvdXJjZSwgbmIpO1xuXG4gIGZvciAoOyBicCA8IG5iLmxlbmd0aDsgYnAgKj0gMikge1xuICAgIGNvcHkobmIuc2xpY2UoMCwgYnApLCBuYiwgYnApO1xuICB9XG5cbiAgcmV0dXJuIG5iO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFDckMsU0FBUyxJQUFJLFFBQVEsWUFBWTtBQUVqQzs7Ozs7Ozs7Ozs7O0NBWUMsR0FDRCxPQUFPLFNBQVMsT0FBTyxNQUFrQixFQUFFLEtBQWE7SUFDdEQsSUFBSSxVQUFVLEdBQUc7UUFDZixPQUFPLElBQUk7SUFDYjtJQUVBLElBQUksUUFBUSxHQUFHO1FBQ2IsTUFBTSxJQUFJLFdBQVc7SUFDdkI7SUFFQSxJQUFJLENBQUMsT0FBTyxVQUFVLFFBQVE7UUFDNUIsTUFBTSxJQUFJLE1BQU07SUFDbEI7SUFFQSxNQUFNLEtBQUssSUFBSSxXQUFXLE9BQU8sU0FBUztJQUUxQyxJQUFJLEtBQUssS0FBSyxRQUFRO0lBRXRCLE1BQU8sS0FBSyxHQUFHLFFBQVEsTUFBTSxFQUFHO1FBQzlCLEtBQUssR0FBRyxNQUFNLEdBQUcsS0FBSyxJQUFJO0lBQzVCO0lBRUEsT0FBTztBQUNUIn0=