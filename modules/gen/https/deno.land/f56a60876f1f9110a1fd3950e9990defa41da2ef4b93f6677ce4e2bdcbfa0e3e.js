// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/** Create a `Writer` from a `WritableStreamDefaultWriter`.
 *
 * @example
 * ```ts
 * import { copy } from "https://deno.land/std@$STD_VERSION/streams/copy.ts";
 * import { writerFromStreamWriter } from "https://deno.land/std@$STD_VERSION/streams/writer_from_stream_writer.ts";
 *
 * const file = await Deno.open("./deno.land.html", { read: true });
 *
 * const writableStream = new WritableStream({
 *   write(chunk): void {
 *     console.log(chunk);
 *   },
 * });
 * const writer = writerFromStreamWriter(writableStream.getWriter());
 * await copy(file, writer);
 * file.close();
 * ```
 */ export function writerFromStreamWriter(streamWriter) {
    return {
        async write (p) {
            await streamWriter.ready;
            await streamWriter.write(p);
            return p.length;
        }
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5My4wL3N0cmVhbXMvd3JpdGVyX2Zyb21fc3RyZWFtX3dyaXRlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIzIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQgdHlwZSB7IFdyaXRlciB9IGZyb20gXCIuLi90eXBlcy5kLnRzXCI7XG5cbi8qKiBDcmVhdGUgYSBgV3JpdGVyYCBmcm9tIGEgYFdyaXRhYmxlU3RyZWFtRGVmYXVsdFdyaXRlcmAuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBjb3B5IH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vc3RyZWFtcy9jb3B5LnRzXCI7XG4gKiBpbXBvcnQgeyB3cml0ZXJGcm9tU3RyZWFtV3JpdGVyIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vc3RyZWFtcy93cml0ZXJfZnJvbV9zdHJlYW1fd3JpdGVyLnRzXCI7XG4gKlxuICogY29uc3QgZmlsZSA9IGF3YWl0IERlbm8ub3BlbihcIi4vZGVuby5sYW5kLmh0bWxcIiwgeyByZWFkOiB0cnVlIH0pO1xuICpcbiAqIGNvbnN0IHdyaXRhYmxlU3RyZWFtID0gbmV3IFdyaXRhYmxlU3RyZWFtKHtcbiAqICAgd3JpdGUoY2h1bmspOiB2b2lkIHtcbiAqICAgICBjb25zb2xlLmxvZyhjaHVuayk7XG4gKiAgIH0sXG4gKiB9KTtcbiAqIGNvbnN0IHdyaXRlciA9IHdyaXRlckZyb21TdHJlYW1Xcml0ZXIod3JpdGFibGVTdHJlYW0uZ2V0V3JpdGVyKCkpO1xuICogYXdhaXQgY29weShmaWxlLCB3cml0ZXIpO1xuICogZmlsZS5jbG9zZSgpO1xuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3cml0ZXJGcm9tU3RyZWFtV3JpdGVyKFxuICBzdHJlYW1Xcml0ZXI6IFdyaXRhYmxlU3RyZWFtRGVmYXVsdFdyaXRlcjxVaW50OEFycmF5Pixcbik6IFdyaXRlciB7XG4gIHJldHVybiB7XG4gICAgYXN5bmMgd3JpdGUocDogVWludDhBcnJheSk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgICBhd2FpdCBzdHJlYW1Xcml0ZXIucmVhZHk7XG4gICAgICBhd2FpdCBzdHJlYW1Xcml0ZXIud3JpdGUocCk7XG4gICAgICByZXR1cm4gcC5sZW5ndGg7XG4gICAgfSxcbiAgfTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBSXJDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FrQkMsR0FDRCxPQUFPLFNBQVMsdUJBQ2QsWUFBcUQ7SUFFckQsT0FBTztRQUNMLE1BQU0sT0FBTSxDQUFhO1lBQ3ZCLE1BQU0sYUFBYTtZQUNuQixNQUFNLGFBQWEsTUFBTTtZQUN6QixPQUFPLEVBQUU7UUFDWDtJQUNGO0FBQ0YifQ==