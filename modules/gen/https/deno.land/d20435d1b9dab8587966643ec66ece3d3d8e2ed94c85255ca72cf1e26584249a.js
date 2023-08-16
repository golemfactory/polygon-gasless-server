// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { Buffer } from "../io/buffer.ts";
import { writeAll } from "./write_all.ts";
/**
 * Create a `Reader` from a `ReadableStreamDefaultReader`.
 *
 * @example
 * ```ts
 * import { copy } from "https://deno.land/std@$STD_VERSION/streams/copy.ts";
 * import { readerFromStreamReader } from "https://deno.land/std@$STD_VERSION/streams/reader_from_stream_reader.ts";
 *
 * const res = await fetch("https://deno.land");
 * const file = await Deno.open("./deno.land.html", { create: true, write: true });
 *
 * const reader = readerFromStreamReader(res.body!.getReader());
 * await copy(reader, file);
 * file.close();
 * ```
 */ export function readerFromStreamReader(streamReader) {
    const buffer = new Buffer();
    return {
        async read (p) {
            if (buffer.empty()) {
                const res = await streamReader.read();
                if (res.done) {
                    return null; // EOF
                }
                await writeAll(buffer, res.value);
            }
            return buffer.read(p);
        }
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5My4wL3N0cmVhbXMvcmVhZGVyX2Zyb21fc3RyZWFtX3JlYWRlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIzIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiLi4vaW8vYnVmZmVyLnRzXCI7XG5pbXBvcnQgeyB3cml0ZUFsbCB9IGZyb20gXCIuL3dyaXRlX2FsbC50c1wiO1xuaW1wb3J0IHR5cGUgeyBSZWFkZXIgfSBmcm9tIFwiLi4vdHlwZXMuZC50c1wiO1xuXG4vKipcbiAqIENyZWF0ZSBhIGBSZWFkZXJgIGZyb20gYSBgUmVhZGFibGVTdHJlYW1EZWZhdWx0UmVhZGVyYC5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IGNvcHkgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9zdHJlYW1zL2NvcHkudHNcIjtcbiAqIGltcG9ydCB7IHJlYWRlckZyb21TdHJlYW1SZWFkZXIgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9zdHJlYW1zL3JlYWRlcl9mcm9tX3N0cmVhbV9yZWFkZXIudHNcIjtcbiAqXG4gKiBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChcImh0dHBzOi8vZGVuby5sYW5kXCIpO1xuICogY29uc3QgZmlsZSA9IGF3YWl0IERlbm8ub3BlbihcIi4vZGVuby5sYW5kLmh0bWxcIiwgeyBjcmVhdGU6IHRydWUsIHdyaXRlOiB0cnVlIH0pO1xuICpcbiAqIGNvbnN0IHJlYWRlciA9IHJlYWRlckZyb21TdHJlYW1SZWFkZXIocmVzLmJvZHkhLmdldFJlYWRlcigpKTtcbiAqIGF3YWl0IGNvcHkocmVhZGVyLCBmaWxlKTtcbiAqIGZpbGUuY2xvc2UoKTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVhZGVyRnJvbVN0cmVhbVJlYWRlcihcbiAgc3RyZWFtUmVhZGVyOiBSZWFkYWJsZVN0cmVhbURlZmF1bHRSZWFkZXI8VWludDhBcnJheT4sXG4pOiBSZWFkZXIge1xuICBjb25zdCBidWZmZXIgPSBuZXcgQnVmZmVyKCk7XG5cbiAgcmV0dXJuIHtcbiAgICBhc3luYyByZWFkKHA6IFVpbnQ4QXJyYXkpOiBQcm9taXNlPG51bWJlciB8IG51bGw+IHtcbiAgICAgIGlmIChidWZmZXIuZW1wdHkoKSkge1xuICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBzdHJlYW1SZWFkZXIucmVhZCgpO1xuICAgICAgICBpZiAocmVzLmRvbmUpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDsgLy8gRU9GXG4gICAgICAgIH1cblxuICAgICAgICBhd2FpdCB3cml0ZUFsbChidWZmZXIsIHJlcy52YWx1ZSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBidWZmZXIucmVhZChwKTtcbiAgICB9LFxuICB9O1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckMsU0FBUyxNQUFNLFFBQVEsa0JBQWtCO0FBQ3pDLFNBQVMsUUFBUSxRQUFRLGlCQUFpQjtBQUcxQzs7Ozs7Ozs7Ozs7Ozs7O0NBZUMsR0FDRCxPQUFPLFNBQVMsdUJBQ2QsWUFBcUQ7SUFFckQsTUFBTSxTQUFTLElBQUk7SUFFbkIsT0FBTztRQUNMLE1BQU0sTUFBSyxDQUFhO1lBQ3RCLElBQUksT0FBTyxTQUFTO2dCQUNsQixNQUFNLE1BQU0sTUFBTSxhQUFhO2dCQUMvQixJQUFJLElBQUksTUFBTTtvQkFDWixPQUFPLE1BQU0sTUFBTTtnQkFDckI7Z0JBRUEsTUFBTSxTQUFTLFFBQVEsSUFBSTtZQUM3QjtZQUVBLE9BQU8sT0FBTyxLQUFLO1FBQ3JCO0lBQ0Y7QUFDRiJ9