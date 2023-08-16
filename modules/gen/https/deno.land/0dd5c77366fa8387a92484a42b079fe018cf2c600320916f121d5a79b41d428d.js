// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/** A TransformStream that will only read & enqueue `size` amount of bytes.
 * This operation is chunk based and not BYOB based,
 * and as such will read more than needed.
 *
 * if options.error is set, then instead of terminating the stream,
 * an error will be thrown.
 *
 * ```ts
 * import { LimitedBytesTransformStream } from "https://deno.land/std@$STD_VERSION/streams/limited_bytes_transform_stream.ts";
 * const res = await fetch("https://example.com");
 * const parts = res.body!
 *   .pipeThrough(new LimitedBytesTransformStream(512 * 1024));
 * ```
 */ export class LimitedBytesTransformStream extends TransformStream {
    #read = 0;
    constructor(size, options = {}){
        super({
            transform: (chunk, controller)=>{
                if (this.#read + chunk.byteLength > size) {
                    if (options.error) {
                        throw new RangeError(`Exceeded byte size limit of '${size}'`);
                    } else {
                        controller.terminate();
                    }
                } else {
                    this.#read += chunk.byteLength;
                    controller.enqueue(chunk);
                }
            }
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5My4wL3N0cmVhbXMvbGltaXRlZF9ieXRlc190cmFuc2Zvcm1fc3RyZWFtLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjMgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbi8qKiBBIFRyYW5zZm9ybVN0cmVhbSB0aGF0IHdpbGwgb25seSByZWFkICYgZW5xdWV1ZSBgc2l6ZWAgYW1vdW50IG9mIGJ5dGVzLlxuICogVGhpcyBvcGVyYXRpb24gaXMgY2h1bmsgYmFzZWQgYW5kIG5vdCBCWU9CIGJhc2VkLFxuICogYW5kIGFzIHN1Y2ggd2lsbCByZWFkIG1vcmUgdGhhbiBuZWVkZWQuXG4gKlxuICogaWYgb3B0aW9ucy5lcnJvciBpcyBzZXQsIHRoZW4gaW5zdGVhZCBvZiB0ZXJtaW5hdGluZyB0aGUgc3RyZWFtLFxuICogYW4gZXJyb3Igd2lsbCBiZSB0aHJvd24uXG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IExpbWl0ZWRCeXRlc1RyYW5zZm9ybVN0cmVhbSB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL3N0cmVhbXMvbGltaXRlZF9ieXRlc190cmFuc2Zvcm1fc3RyZWFtLnRzXCI7XG4gKiBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChcImh0dHBzOi8vZXhhbXBsZS5jb21cIik7XG4gKiBjb25zdCBwYXJ0cyA9IHJlcy5ib2R5IVxuICogICAucGlwZVRocm91Z2gobmV3IExpbWl0ZWRCeXRlc1RyYW5zZm9ybVN0cmVhbSg1MTIgKiAxMDI0KSk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNsYXNzIExpbWl0ZWRCeXRlc1RyYW5zZm9ybVN0cmVhbVxuICBleHRlbmRzIFRyYW5zZm9ybVN0cmVhbTxVaW50OEFycmF5LCBVaW50OEFycmF5PiB7XG4gICNyZWFkID0gMDtcbiAgY29uc3RydWN0b3Ioc2l6ZTogbnVtYmVyLCBvcHRpb25zOiB7IGVycm9yPzogYm9vbGVhbiB9ID0ge30pIHtcbiAgICBzdXBlcih7XG4gICAgICB0cmFuc2Zvcm06IChjaHVuaywgY29udHJvbGxlcikgPT4ge1xuICAgICAgICBpZiAoKHRoaXMuI3JlYWQgKyBjaHVuay5ieXRlTGVuZ3RoKSA+IHNpemUpIHtcbiAgICAgICAgICBpZiAob3B0aW9ucy5lcnJvcikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoYEV4Y2VlZGVkIGJ5dGUgc2l6ZSBsaW1pdCBvZiAnJHtzaXplfSdgKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29udHJvbGxlci50ZXJtaW5hdGUoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy4jcmVhZCArPSBjaHVuay5ieXRlTGVuZ3RoO1xuICAgICAgICAgIGNvbnRyb2xsZXIuZW5xdWV1ZShjaHVuayk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDOzs7Ozs7Ozs7Ozs7O0NBYUMsR0FDRCxPQUFPLE1BQU0sb0NBQ0g7SUFDUixDQUFDLElBQUksR0FBRyxFQUFFO0lBQ1YsWUFBWSxJQUFZLEVBQUUsVUFBK0IsQ0FBQyxDQUFDLENBQUU7UUFDM0QsS0FBSyxDQUFDO1lBQ0osV0FBVyxDQUFDLE9BQU87Z0JBQ2pCLElBQUksQUFBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLEdBQUcsTUFBTSxhQUFjLE1BQU07b0JBQzFDLElBQUksUUFBUSxPQUFPO3dCQUNqQixNQUFNLElBQUksV0FBVyxDQUFDLDZCQUE2QixFQUFFLEtBQUssQ0FBQyxDQUFDO29CQUM5RCxPQUFPO3dCQUNMLFdBQVc7b0JBQ2I7Z0JBQ0YsT0FBTztvQkFDTCxJQUFJLENBQUMsQ0FBQyxJQUFJLElBQUksTUFBTTtvQkFDcEIsV0FBVyxRQUFRO2dCQUNyQjtZQUNGO1FBQ0Y7SUFDRjtBQUNGIn0=