// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/** Create a `ReadableStream` from any kind of iterable.
 *
 * ```ts
 *      import { readableStreamFromIterable } from "https://deno.land/std@$STD_VERSION/streams/readable_stream_from_iterable.ts";
 *
 *      const r1 = readableStreamFromIterable(["foo, bar, baz"]);
 *      const r2 = readableStreamFromIterable(async function* () {
 *        await new Promise(((r) => setTimeout(r, 1000)));
 *        yield "foo";
 *        await new Promise(((r) => setTimeout(r, 1000)));
 *        yield "bar";
 *        await new Promise(((r) => setTimeout(r, 1000)));
 *        yield "baz";
 *      }());
 * ```
 *
 * If the produced iterator (`iterable[Symbol.asyncIterator]()` or
 * `iterable[Symbol.iterator]()`) is a generator, or more specifically is found
 * to have a `.throw()` method on it, that will be called upon
 * `readableStream.cancel()`. This is the case for the second input type above:
 *
 * ```ts
 * import { readableStreamFromIterable } from "https://deno.land/std@$STD_VERSION/streams/readable_stream_from_iterable.ts";
 *
 * const r3 = readableStreamFromIterable(async function* () {
 *   try {
 *     yield "foo";
 *   } catch (error) {
 *     console.log(error); // Error: Cancelled by consumer.
 *   }
 * }());
 * const reader = r3.getReader();
 * console.log(await reader.read()); // { value: "foo", done: false }
 * await reader.cancel(new Error("Cancelled by consumer."));
 * ```
 */ export function readableStreamFromIterable(iterable) {
    const iterator = iterable[Symbol.asyncIterator]?.() ?? iterable[Symbol.iterator]?.();
    return new ReadableStream({
        async pull (controller) {
            const { value , done  } = await iterator.next();
            if (done) {
                controller.close();
            } else {
                controller.enqueue(value);
            }
        },
        async cancel (reason) {
            if (typeof iterator.throw == "function") {
                try {
                    await iterator.throw(reason);
                } catch  {}
            }
        }
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5My4wL3N0cmVhbXMvcmVhZGFibGVfc3RyZWFtX2Zyb21faXRlcmFibGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMyB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuLyoqIENyZWF0ZSBhIGBSZWFkYWJsZVN0cmVhbWAgZnJvbSBhbnkga2luZCBvZiBpdGVyYWJsZS5cbiAqXG4gKiBgYGB0c1xuICogICAgICBpbXBvcnQgeyByZWFkYWJsZVN0cmVhbUZyb21JdGVyYWJsZSB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL3N0cmVhbXMvcmVhZGFibGVfc3RyZWFtX2Zyb21faXRlcmFibGUudHNcIjtcbiAqXG4gKiAgICAgIGNvbnN0IHIxID0gcmVhZGFibGVTdHJlYW1Gcm9tSXRlcmFibGUoW1wiZm9vLCBiYXIsIGJhelwiXSk7XG4gKiAgICAgIGNvbnN0IHIyID0gcmVhZGFibGVTdHJlYW1Gcm9tSXRlcmFibGUoYXN5bmMgZnVuY3Rpb24qICgpIHtcbiAqICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgoKHIpID0+IHNldFRpbWVvdXQociwgMTAwMCkpKTtcbiAqICAgICAgICB5aWVsZCBcImZvb1wiO1xuICogICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKCgocikgPT4gc2V0VGltZW91dChyLCAxMDAwKSkpO1xuICogICAgICAgIHlpZWxkIFwiYmFyXCI7XG4gKiAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKChyKSA9PiBzZXRUaW1lb3V0KHIsIDEwMDApKSk7XG4gKiAgICAgICAgeWllbGQgXCJiYXpcIjtcbiAqICAgICAgfSgpKTtcbiAqIGBgYFxuICpcbiAqIElmIHRoZSBwcm9kdWNlZCBpdGVyYXRvciAoYGl0ZXJhYmxlW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSgpYCBvclxuICogYGl0ZXJhYmxlW1N5bWJvbC5pdGVyYXRvcl0oKWApIGlzIGEgZ2VuZXJhdG9yLCBvciBtb3JlIHNwZWNpZmljYWxseSBpcyBmb3VuZFxuICogdG8gaGF2ZSBhIGAudGhyb3coKWAgbWV0aG9kIG9uIGl0LCB0aGF0IHdpbGwgYmUgY2FsbGVkIHVwb25cbiAqIGByZWFkYWJsZVN0cmVhbS5jYW5jZWwoKWAuIFRoaXMgaXMgdGhlIGNhc2UgZm9yIHRoZSBzZWNvbmQgaW5wdXQgdHlwZSBhYm92ZTpcbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgcmVhZGFibGVTdHJlYW1Gcm9tSXRlcmFibGUgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9zdHJlYW1zL3JlYWRhYmxlX3N0cmVhbV9mcm9tX2l0ZXJhYmxlLnRzXCI7XG4gKlxuICogY29uc3QgcjMgPSByZWFkYWJsZVN0cmVhbUZyb21JdGVyYWJsZShhc3luYyBmdW5jdGlvbiogKCkge1xuICogICB0cnkge1xuICogICAgIHlpZWxkIFwiZm9vXCI7XG4gKiAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gKiAgICAgY29uc29sZS5sb2coZXJyb3IpOyAvLyBFcnJvcjogQ2FuY2VsbGVkIGJ5IGNvbnN1bWVyLlxuICogICB9XG4gKiB9KCkpO1xuICogY29uc3QgcmVhZGVyID0gcjMuZ2V0UmVhZGVyKCk7XG4gKiBjb25zb2xlLmxvZyhhd2FpdCByZWFkZXIucmVhZCgpKTsgLy8geyB2YWx1ZTogXCJmb29cIiwgZG9uZTogZmFsc2UgfVxuICogYXdhaXQgcmVhZGVyLmNhbmNlbChuZXcgRXJyb3IoXCJDYW5jZWxsZWQgYnkgY29uc3VtZXIuXCIpKTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVhZGFibGVTdHJlYW1Gcm9tSXRlcmFibGU8VD4oXG4gIGl0ZXJhYmxlOiBJdGVyYWJsZTxUPiB8IEFzeW5jSXRlcmFibGU8VD4sXG4pOiBSZWFkYWJsZVN0cmVhbTxUPiB7XG4gIGNvbnN0IGl0ZXJhdG9yOiBJdGVyYXRvcjxUPiB8IEFzeW5jSXRlcmF0b3I8VD4gPVxuICAgIChpdGVyYWJsZSBhcyBBc3luY0l0ZXJhYmxlPFQ+KVtTeW1ib2wuYXN5bmNJdGVyYXRvcl0/LigpID8/XG4gICAgICAoaXRlcmFibGUgYXMgSXRlcmFibGU8VD4pW1N5bWJvbC5pdGVyYXRvcl0/LigpO1xuICByZXR1cm4gbmV3IFJlYWRhYmxlU3RyZWFtKHtcbiAgICBhc3luYyBwdWxsKGNvbnRyb2xsZXIpIHtcbiAgICAgIGNvbnN0IHsgdmFsdWUsIGRvbmUgfSA9IGF3YWl0IGl0ZXJhdG9yLm5leHQoKTtcbiAgICAgIGlmIChkb25lKSB7XG4gICAgICAgIGNvbnRyb2xsZXIuY2xvc2UoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnRyb2xsZXIuZW5xdWV1ZSh2YWx1ZSk7XG4gICAgICB9XG4gICAgfSxcbiAgICBhc3luYyBjYW5jZWwocmVhc29uKSB7XG4gICAgICBpZiAodHlwZW9mIGl0ZXJhdG9yLnRocm93ID09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGF3YWl0IGl0ZXJhdG9yLnRocm93KHJlYXNvbik7XG4gICAgICAgIH0gY2F0Y2ggeyAvKiBgaXRlcmF0b3IudGhyb3coKWAgYWx3YXlzIHRocm93cyBvbiBzaXRlLiBXZSBjYXRjaCBpdC4gKi8gfVxuICAgICAgfVxuICAgIH0sXG4gIH0pO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBbUNDLEdBQ0QsT0FBTyxTQUFTLDJCQUNkLFFBQXdDO0lBRXhDLE1BQU0sV0FDSixBQUFDLFFBQTZCLENBQUMsT0FBTyxjQUFjLFFBQ2xELEFBQUMsUUFBd0IsQ0FBQyxPQUFPLFNBQVM7SUFDOUMsT0FBTyxJQUFJLGVBQWU7UUFDeEIsTUFBTSxNQUFLLFVBQVU7WUFDbkIsTUFBTSxFQUFFLE1BQUssRUFBRSxLQUFJLEVBQUUsR0FBRyxNQUFNLFNBQVM7WUFDdkMsSUFBSSxNQUFNO2dCQUNSLFdBQVc7WUFDYixPQUFPO2dCQUNMLFdBQVcsUUFBUTtZQUNyQjtRQUNGO1FBQ0EsTUFBTSxRQUFPLE1BQU07WUFDakIsSUFBSSxPQUFPLFNBQVMsU0FBUyxZQUFZO2dCQUN2QyxJQUFJO29CQUNGLE1BQU0sU0FBUyxNQUFNO2dCQUN2QixFQUFFLE9BQU0sQ0FBK0Q7WUFDekU7UUFDRjtJQUNGO0FBQ0YifQ==