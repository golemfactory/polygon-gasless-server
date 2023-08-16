// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/** Returns true if the prefix array appears at the start of the source array,
 * false otherwise.
 *
 * The complexity of this function is O(prefix.length).
 *
 * ```ts
 * import { startsWith } from "https://deno.land/std@$STD_VERSION/bytes/starts_with.ts";
 * const source = new Uint8Array([0, 1, 2, 1, 2, 1, 2, 3]);
 * const prefix = new Uint8Array([0, 1, 2]);
 * console.log(startsWith(source, prefix)); // true
 * ```
 */ export function startsWith(source, prefix) {
    for(let i = 0, max = prefix.length; i < max; i++){
        if (source[i] !== prefix[i]) return false;
    }
    return true;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5My4wL2J5dGVzL3N0YXJ0c193aXRoLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjMgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbi8qKiBSZXR1cm5zIHRydWUgaWYgdGhlIHByZWZpeCBhcnJheSBhcHBlYXJzIGF0IHRoZSBzdGFydCBvZiB0aGUgc291cmNlIGFycmF5LFxuICogZmFsc2Ugb3RoZXJ3aXNlLlxuICpcbiAqIFRoZSBjb21wbGV4aXR5IG9mIHRoaXMgZnVuY3Rpb24gaXMgTyhwcmVmaXgubGVuZ3RoKS5cbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgc3RhcnRzV2l0aCB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2J5dGVzL3N0YXJ0c193aXRoLnRzXCI7XG4gKiBjb25zdCBzb3VyY2UgPSBuZXcgVWludDhBcnJheShbMCwgMSwgMiwgMSwgMiwgMSwgMiwgM10pO1xuICogY29uc3QgcHJlZml4ID0gbmV3IFVpbnQ4QXJyYXkoWzAsIDEsIDJdKTtcbiAqIGNvbnNvbGUubG9nKHN0YXJ0c1dpdGgoc291cmNlLCBwcmVmaXgpKTsgLy8gdHJ1ZVxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdGFydHNXaXRoKHNvdXJjZTogVWludDhBcnJheSwgcHJlZml4OiBVaW50OEFycmF5KTogYm9vbGVhbiB7XG4gIGZvciAobGV0IGkgPSAwLCBtYXggPSBwcmVmaXgubGVuZ3RoOyBpIDwgbWF4OyBpKyspIHtcbiAgICBpZiAoc291cmNlW2ldICE9PSBwcmVmaXhbaV0pIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDOzs7Ozs7Ozs7OztDQVdDLEdBQ0QsT0FBTyxTQUFTLFdBQVcsTUFBa0IsRUFBRSxNQUFrQjtJQUMvRCxJQUFLLElBQUksSUFBSSxHQUFHLE1BQU0sT0FBTyxRQUFRLElBQUksS0FBSyxJQUFLO1FBQ2pELElBQUksTUFBTSxDQUFDLEVBQUUsS0FBSyxNQUFNLENBQUMsRUFBRSxFQUFFLE9BQU87SUFDdEM7SUFDQSxPQUFPO0FBQ1QifQ==