// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { readDelim } from "./read_delim.ts";
/**
 * Read Reader chunk by chunk, splitting based on delimiter.
 *
 * @example
 * ```ts
 * import { readStringDelim } from "https://deno.land/std@$STD_VERSION/io/read_string_delim.ts";
 * import * as path from "https://deno.land/std@$STD_VERSION/path/mod.ts";
 *
 * const filename = path.join(Deno.cwd(), "std/io/README.md");
 * let fileReader = await Deno.open(filename);
 *
 * for await (let line of readStringDelim(fileReader, "\n")) {
 *   console.log(line);
 * }
 * ```
 */ export async function* readStringDelim(reader, delim, decoderOpts) {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder(decoderOpts?.encoding, decoderOpts);
    for await (const chunk of readDelim(reader, encoder.encode(delim))){
        yield decoder.decode(chunk);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5My4wL2lvL3JlYWRfc3RyaW5nX2RlbGltLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjMgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbmltcG9ydCB7IHR5cGUgUmVhZGVyIH0gZnJvbSBcIi4uL3R5cGVzLmQudHNcIjtcbmltcG9ydCB7IHJlYWREZWxpbSB9IGZyb20gXCIuL3JlYWRfZGVsaW0udHNcIjtcblxuLyoqXG4gKiBSZWFkIFJlYWRlciBjaHVuayBieSBjaHVuaywgc3BsaXR0aW5nIGJhc2VkIG9uIGRlbGltaXRlci5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IHJlYWRTdHJpbmdEZWxpbSB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2lvL3JlYWRfc3RyaW5nX2RlbGltLnRzXCI7XG4gKiBpbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL3BhdGgvbW9kLnRzXCI7XG4gKlxuICogY29uc3QgZmlsZW5hbWUgPSBwYXRoLmpvaW4oRGVuby5jd2QoKSwgXCJzdGQvaW8vUkVBRE1FLm1kXCIpO1xuICogbGV0IGZpbGVSZWFkZXIgPSBhd2FpdCBEZW5vLm9wZW4oZmlsZW5hbWUpO1xuICpcbiAqIGZvciBhd2FpdCAobGV0IGxpbmUgb2YgcmVhZFN0cmluZ0RlbGltKGZpbGVSZWFkZXIsIFwiXFxuXCIpKSB7XG4gKiAgIGNvbnNvbGUubG9nKGxpbmUpO1xuICogfVxuICogYGBgXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiogcmVhZFN0cmluZ0RlbGltKFxuICByZWFkZXI6IFJlYWRlcixcbiAgZGVsaW06IHN0cmluZyxcbiAgZGVjb2Rlck9wdHM/OiB7XG4gICAgZW5jb2Rpbmc/OiBzdHJpbmc7XG4gICAgZmF0YWw/OiBib29sZWFuO1xuICAgIGlnbm9yZUJPTT86IGJvb2xlYW47XG4gIH0sXG4pOiBBc3luY0l0ZXJhYmxlSXRlcmF0b3I8c3RyaW5nPiB7XG4gIGNvbnN0IGVuY29kZXIgPSBuZXcgVGV4dEVuY29kZXIoKTtcbiAgY29uc3QgZGVjb2RlciA9IG5ldyBUZXh0RGVjb2RlcihkZWNvZGVyT3B0cz8uZW5jb2RpbmcsIGRlY29kZXJPcHRzKTtcbiAgZm9yIGF3YWl0IChjb25zdCBjaHVuayBvZiByZWFkRGVsaW0ocmVhZGVyLCBlbmNvZGVyLmVuY29kZShkZWxpbSkpKSB7XG4gICAgeWllbGQgZGVjb2Rlci5kZWNvZGUoY2h1bmspO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUdyQyxTQUFTLFNBQVMsUUFBUSxrQkFBa0I7QUFFNUM7Ozs7Ozs7Ozs7Ozs7OztDQWVDLEdBQ0QsT0FBTyxnQkFBZ0IsZ0JBQ3JCLE1BQWMsRUFDZCxLQUFhLEVBQ2IsV0FJQztJQUVELE1BQU0sVUFBVSxJQUFJO0lBQ3BCLE1BQU0sVUFBVSxJQUFJLFlBQVksYUFBYSxVQUFVO0lBQ3ZELFdBQVcsTUFBTSxTQUFTLFVBQVUsUUFBUSxRQUFRLE9BQU8sUUFBUztRQUNsRSxNQUFNLFFBQVEsT0FBTztJQUN2QjtBQUNGIn0=