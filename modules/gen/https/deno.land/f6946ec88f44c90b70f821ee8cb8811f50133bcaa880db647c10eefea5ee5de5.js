// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { copy as copyBytes } from "../bytes/copy.ts";
import { assert } from "../_util/asserts.ts";
const DEFAULT_BUFFER_SIZE = 32 * 1024;
/**
 * Read a range of bytes from a file or other resource that is readable and
 * seekable.  The range start and end are inclusive of the bytes within that
 * range.
 *
 * ```ts
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 * import { readRange } from "https://deno.land/std@$STD_VERSION/io/read_range.ts";
 *
 * // Read the first 10 bytes of a file
 * const file = await Deno.open("example.txt", { read: true });
 * const bytes = await readRange(file, { start: 0, end: 9 });
 * assertEquals(bytes.length, 10);
 * ```
 */ export async function readRange(r, range) {
    // byte ranges are inclusive, so we have to add one to the end
    let length = range.end - range.start + 1;
    assert(length > 0, "Invalid byte range was passed.");
    await r.seek(range.start, Deno.SeekMode.Start);
    const result = new Uint8Array(length);
    let off = 0;
    while(length){
        const p = new Uint8Array(Math.min(length, DEFAULT_BUFFER_SIZE));
        const nread = await r.read(p);
        assert(nread !== null, "Unexpected EOF reach while reading a range.");
        assert(nread > 0, "Unexpected read of 0 bytes while reading a range.");
        copyBytes(p, result, off);
        off += nread;
        length -= nread;
        assert(length >= 0, "Unexpected length remaining after reading range.");
    }
    return result;
}
/**
 * Read a range of bytes synchronously from a file or other resource that is
 * readable and seekable.  The range start and end are inclusive of the bytes
 * within that range.
 *
 * ```ts
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 * import { readRangeSync } from "https://deno.land/std@$STD_VERSION/io/read_range.ts";
 *
 * // Read the first 10 bytes of a file
 * const file = Deno.openSync("example.txt", { read: true });
 * const bytes = readRangeSync(file, { start: 0, end: 9 });
 * assertEquals(bytes.length, 10);
 * ```
 */ export function readRangeSync(r, range) {
    // byte ranges are inclusive, so we have to add one to the end
    let length = range.end - range.start + 1;
    assert(length > 0, "Invalid byte range was passed.");
    r.seekSync(range.start, Deno.SeekMode.Start);
    const result = new Uint8Array(length);
    let off = 0;
    while(length){
        const p = new Uint8Array(Math.min(length, DEFAULT_BUFFER_SIZE));
        const nread = r.readSync(p);
        assert(nread !== null, "Unexpected EOF reach while reading a range.");
        assert(nread > 0, "Unexpected read of 0 bytes while reading a range.");
        copyBytes(p, result, off);
        off += nread;
        length -= nread;
        assert(length >= 0, "Unexpected length remaining after reading range.");
    }
    return result;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5My4wL2lvL3JlYWRfcmFuZ2UudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMyB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cblxuaW1wb3J0IHsgY29weSBhcyBjb3B5Qnl0ZXMgfSBmcm9tIFwiLi4vYnl0ZXMvY29weS50c1wiO1xuaW1wb3J0IHsgYXNzZXJ0IH0gZnJvbSBcIi4uL191dGlsL2Fzc2VydHMudHNcIjtcbmltcG9ydCB0eXBlIHsgUmVhZGVyLCBSZWFkZXJTeW5jIH0gZnJvbSBcIi4uL3R5cGVzLmQudHNcIjtcblxuY29uc3QgREVGQVVMVF9CVUZGRVJfU0laRSA9IDMyICogMTAyNDtcblxuZXhwb3J0IGludGVyZmFjZSBCeXRlUmFuZ2Uge1xuICAvKiogVGhlIDAgYmFzZWQgaW5kZXggb2YgdGhlIHN0YXJ0IGJ5dGUgZm9yIGEgcmFuZ2UuICovXG4gIHN0YXJ0OiBudW1iZXI7XG5cbiAgLyoqIFRoZSAwIGJhc2VkIGluZGV4IG9mIHRoZSBlbmQgYnl0ZSBmb3IgYSByYW5nZSwgd2hpY2ggaXMgaW5jbHVzaXZlLiAqL1xuICBlbmQ6IG51bWJlcjtcbn1cblxuLyoqXG4gKiBSZWFkIGEgcmFuZ2Ugb2YgYnl0ZXMgZnJvbSBhIGZpbGUgb3Igb3RoZXIgcmVzb3VyY2UgdGhhdCBpcyByZWFkYWJsZSBhbmRcbiAqIHNlZWthYmxlLiAgVGhlIHJhbmdlIHN0YXJ0IGFuZCBlbmQgYXJlIGluY2x1c2l2ZSBvZiB0aGUgYnl0ZXMgd2l0aGluIHRoYXRcbiAqIHJhbmdlLlxuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi90ZXN0aW5nL2Fzc2VydHMudHNcIjtcbiAqIGltcG9ydCB7IHJlYWRSYW5nZSB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2lvL3JlYWRfcmFuZ2UudHNcIjtcbiAqXG4gKiAvLyBSZWFkIHRoZSBmaXJzdCAxMCBieXRlcyBvZiBhIGZpbGVcbiAqIGNvbnN0IGZpbGUgPSBhd2FpdCBEZW5vLm9wZW4oXCJleGFtcGxlLnR4dFwiLCB7IHJlYWQ6IHRydWUgfSk7XG4gKiBjb25zdCBieXRlcyA9IGF3YWl0IHJlYWRSYW5nZShmaWxlLCB7IHN0YXJ0OiAwLCBlbmQ6IDkgfSk7XG4gKiBhc3NlcnRFcXVhbHMoYnl0ZXMubGVuZ3RoLCAxMCk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlYWRSYW5nZShcbiAgcjogUmVhZGVyICYgRGVuby5TZWVrZXIsXG4gIHJhbmdlOiBCeXRlUmFuZ2UsXG4pOiBQcm9taXNlPFVpbnQ4QXJyYXk+IHtcbiAgLy8gYnl0ZSByYW5nZXMgYXJlIGluY2x1c2l2ZSwgc28gd2UgaGF2ZSB0byBhZGQgb25lIHRvIHRoZSBlbmRcbiAgbGV0IGxlbmd0aCA9IHJhbmdlLmVuZCAtIHJhbmdlLnN0YXJ0ICsgMTtcbiAgYXNzZXJ0KGxlbmd0aCA+IDAsIFwiSW52YWxpZCBieXRlIHJhbmdlIHdhcyBwYXNzZWQuXCIpO1xuICBhd2FpdCByLnNlZWsocmFuZ2Uuc3RhcnQsIERlbm8uU2Vla01vZGUuU3RhcnQpO1xuICBjb25zdCByZXN1bHQgPSBuZXcgVWludDhBcnJheShsZW5ndGgpO1xuICBsZXQgb2ZmID0gMDtcbiAgd2hpbGUgKGxlbmd0aCkge1xuICAgIGNvbnN0IHAgPSBuZXcgVWludDhBcnJheShNYXRoLm1pbihsZW5ndGgsIERFRkFVTFRfQlVGRkVSX1NJWkUpKTtcbiAgICBjb25zdCBucmVhZCA9IGF3YWl0IHIucmVhZChwKTtcbiAgICBhc3NlcnQobnJlYWQgIT09IG51bGwsIFwiVW5leHBlY3RlZCBFT0YgcmVhY2ggd2hpbGUgcmVhZGluZyBhIHJhbmdlLlwiKTtcbiAgICBhc3NlcnQobnJlYWQgPiAwLCBcIlVuZXhwZWN0ZWQgcmVhZCBvZiAwIGJ5dGVzIHdoaWxlIHJlYWRpbmcgYSByYW5nZS5cIik7XG4gICAgY29weUJ5dGVzKHAsIHJlc3VsdCwgb2ZmKTtcbiAgICBvZmYgKz0gbnJlYWQ7XG4gICAgbGVuZ3RoIC09IG5yZWFkO1xuICAgIGFzc2VydChsZW5ndGggPj0gMCwgXCJVbmV4cGVjdGVkIGxlbmd0aCByZW1haW5pbmcgYWZ0ZXIgcmVhZGluZyByYW5nZS5cIik7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBSZWFkIGEgcmFuZ2Ugb2YgYnl0ZXMgc3luY2hyb25vdXNseSBmcm9tIGEgZmlsZSBvciBvdGhlciByZXNvdXJjZSB0aGF0IGlzXG4gKiByZWFkYWJsZSBhbmQgc2Vla2FibGUuICBUaGUgcmFuZ2Ugc3RhcnQgYW5kIGVuZCBhcmUgaW5jbHVzaXZlIG9mIHRoZSBieXRlc1xuICogd2l0aGluIHRoYXQgcmFuZ2UuXG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL3Rlc3RpbmcvYXNzZXJ0cy50c1wiO1xuICogaW1wb3J0IHsgcmVhZFJhbmdlU3luYyB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2lvL3JlYWRfcmFuZ2UudHNcIjtcbiAqXG4gKiAvLyBSZWFkIHRoZSBmaXJzdCAxMCBieXRlcyBvZiBhIGZpbGVcbiAqIGNvbnN0IGZpbGUgPSBEZW5vLm9wZW5TeW5jKFwiZXhhbXBsZS50eHRcIiwgeyByZWFkOiB0cnVlIH0pO1xuICogY29uc3QgYnl0ZXMgPSByZWFkUmFuZ2VTeW5jKGZpbGUsIHsgc3RhcnQ6IDAsIGVuZDogOSB9KTtcbiAqIGFzc2VydEVxdWFscyhieXRlcy5sZW5ndGgsIDEwKTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVhZFJhbmdlU3luYyhcbiAgcjogUmVhZGVyU3luYyAmIERlbm8uU2Vla2VyU3luYyxcbiAgcmFuZ2U6IEJ5dGVSYW5nZSxcbik6IFVpbnQ4QXJyYXkge1xuICAvLyBieXRlIHJhbmdlcyBhcmUgaW5jbHVzaXZlLCBzbyB3ZSBoYXZlIHRvIGFkZCBvbmUgdG8gdGhlIGVuZFxuICBsZXQgbGVuZ3RoID0gcmFuZ2UuZW5kIC0gcmFuZ2Uuc3RhcnQgKyAxO1xuICBhc3NlcnQobGVuZ3RoID4gMCwgXCJJbnZhbGlkIGJ5dGUgcmFuZ2Ugd2FzIHBhc3NlZC5cIik7XG4gIHIuc2Vla1N5bmMocmFuZ2Uuc3RhcnQsIERlbm8uU2Vla01vZGUuU3RhcnQpO1xuICBjb25zdCByZXN1bHQgPSBuZXcgVWludDhBcnJheShsZW5ndGgpO1xuICBsZXQgb2ZmID0gMDtcbiAgd2hpbGUgKGxlbmd0aCkge1xuICAgIGNvbnN0IHAgPSBuZXcgVWludDhBcnJheShNYXRoLm1pbihsZW5ndGgsIERFRkFVTFRfQlVGRkVSX1NJWkUpKTtcbiAgICBjb25zdCBucmVhZCA9IHIucmVhZFN5bmMocCk7XG4gICAgYXNzZXJ0KG5yZWFkICE9PSBudWxsLCBcIlVuZXhwZWN0ZWQgRU9GIHJlYWNoIHdoaWxlIHJlYWRpbmcgYSByYW5nZS5cIik7XG4gICAgYXNzZXJ0KG5yZWFkID4gMCwgXCJVbmV4cGVjdGVkIHJlYWQgb2YgMCBieXRlcyB3aGlsZSByZWFkaW5nIGEgcmFuZ2UuXCIpO1xuICAgIGNvcHlCeXRlcyhwLCByZXN1bHQsIG9mZik7XG4gICAgb2ZmICs9IG5yZWFkO1xuICAgIGxlbmd0aCAtPSBucmVhZDtcbiAgICBhc3NlcnQobGVuZ3RoID49IDAsIFwiVW5leHBlY3RlZCBsZW5ndGggcmVtYWluaW5nIGFmdGVyIHJlYWRpbmcgcmFuZ2UuXCIpO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBRTFFLFNBQVMsUUFBUSxTQUFTLFFBQVEsbUJBQW1CO0FBQ3JELFNBQVMsTUFBTSxRQUFRLHNCQUFzQjtBQUc3QyxNQUFNLHNCQUFzQixLQUFLO0FBVWpDOzs7Ozs7Ozs7Ozs7OztDQWNDLEdBQ0QsT0FBTyxlQUFlLFVBQ3BCLENBQXVCLEVBQ3ZCLEtBQWdCO0lBRWhCLDhEQUE4RDtJQUM5RCxJQUFJLFNBQVMsTUFBTSxNQUFNLE1BQU0sUUFBUTtJQUN2QyxPQUFPLFNBQVMsR0FBRztJQUNuQixNQUFNLEVBQUUsS0FBSyxNQUFNLE9BQU8sS0FBSyxTQUFTO0lBQ3hDLE1BQU0sU0FBUyxJQUFJLFdBQVc7SUFDOUIsSUFBSSxNQUFNO0lBQ1YsTUFBTyxPQUFRO1FBQ2IsTUFBTSxJQUFJLElBQUksV0FBVyxLQUFLLElBQUksUUFBUTtRQUMxQyxNQUFNLFFBQVEsTUFBTSxFQUFFLEtBQUs7UUFDM0IsT0FBTyxVQUFVLE1BQU07UUFDdkIsT0FBTyxRQUFRLEdBQUc7UUFDbEIsVUFBVSxHQUFHLFFBQVE7UUFDckIsT0FBTztRQUNQLFVBQVU7UUFDVixPQUFPLFVBQVUsR0FBRztJQUN0QjtJQUNBLE9BQU87QUFDVDtBQUVBOzs7Ozs7Ozs7Ozs7OztDQWNDLEdBQ0QsT0FBTyxTQUFTLGNBQ2QsQ0FBK0IsRUFDL0IsS0FBZ0I7SUFFaEIsOERBQThEO0lBQzlELElBQUksU0FBUyxNQUFNLE1BQU0sTUFBTSxRQUFRO0lBQ3ZDLE9BQU8sU0FBUyxHQUFHO0lBQ25CLEVBQUUsU0FBUyxNQUFNLE9BQU8sS0FBSyxTQUFTO0lBQ3RDLE1BQU0sU0FBUyxJQUFJLFdBQVc7SUFDOUIsSUFBSSxNQUFNO0lBQ1YsTUFBTyxPQUFRO1FBQ2IsTUFBTSxJQUFJLElBQUksV0FBVyxLQUFLLElBQUksUUFBUTtRQUMxQyxNQUFNLFFBQVEsRUFBRSxTQUFTO1FBQ3pCLE9BQU8sVUFBVSxNQUFNO1FBQ3ZCLE9BQU8sUUFBUSxHQUFHO1FBQ2xCLFVBQVUsR0FBRyxRQUFRO1FBQ3JCLE9BQU87UUFDUCxVQUFVO1FBQ1YsT0FBTyxVQUFVLEdBQUc7SUFDdEI7SUFDQSxPQUFPO0FBQ1QifQ==