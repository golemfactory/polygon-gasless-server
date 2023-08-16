// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/** A TransformStream that will only read & enqueue `size` amount of chunks.
 *
 * if options.error is set, then instead of terminating the stream,
 * an error will be thrown.
 *
 * ```ts
 * import { LimitedTransformStream } from "https://deno.land/std@$STD_VERSION/streams/limited_transform_stream.ts";
 * const res = await fetch("https://example.com");
 * const parts = res.body!.pipeThrough(new LimitedTransformStream(50));
 * ```
 */ export class LimitedTransformStream extends TransformStream {
    #read = 0;
    constructor(size, options = {}){
        super({
            transform: (chunk, controller)=>{
                if (this.#read + 1 > size) {
                    if (options.error) {
                        throw new RangeError(`Exceeded chunk limit of '${size}'`);
                    } else {
                        controller.terminate();
                    }
                } else {
                    this.#read++;
                    controller.enqueue(chunk);
                }
            }
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5My4wL3N0cmVhbXMvbGltaXRlZF90cmFuc2Zvcm1fc3RyZWFtLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjMgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbi8qKiBBIFRyYW5zZm9ybVN0cmVhbSB0aGF0IHdpbGwgb25seSByZWFkICYgZW5xdWV1ZSBgc2l6ZWAgYW1vdW50IG9mIGNodW5rcy5cbiAqXG4gKiBpZiBvcHRpb25zLmVycm9yIGlzIHNldCwgdGhlbiBpbnN0ZWFkIG9mIHRlcm1pbmF0aW5nIHRoZSBzdHJlYW0sXG4gKiBhbiBlcnJvciB3aWxsIGJlIHRocm93bi5cbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgTGltaXRlZFRyYW5zZm9ybVN0cmVhbSB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL3N0cmVhbXMvbGltaXRlZF90cmFuc2Zvcm1fc3RyZWFtLnRzXCI7XG4gKiBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChcImh0dHBzOi8vZXhhbXBsZS5jb21cIik7XG4gKiBjb25zdCBwYXJ0cyA9IHJlcy5ib2R5IS5waXBlVGhyb3VnaChuZXcgTGltaXRlZFRyYW5zZm9ybVN0cmVhbSg1MCkpO1xuICogYGBgXG4gKi9cbmV4cG9ydCBjbGFzcyBMaW1pdGVkVHJhbnNmb3JtU3RyZWFtPFQ+IGV4dGVuZHMgVHJhbnNmb3JtU3RyZWFtPFQsIFQ+IHtcbiAgI3JlYWQgPSAwO1xuICBjb25zdHJ1Y3RvcihzaXplOiBudW1iZXIsIG9wdGlvbnM6IHsgZXJyb3I/OiBib29sZWFuIH0gPSB7fSkge1xuICAgIHN1cGVyKHtcbiAgICAgIHRyYW5zZm9ybTogKGNodW5rLCBjb250cm9sbGVyKSA9PiB7XG4gICAgICAgIGlmICgodGhpcy4jcmVhZCArIDEpID4gc2l6ZSkge1xuICAgICAgICAgIGlmIChvcHRpb25zLmVycm9yKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihgRXhjZWVkZWQgY2h1bmsgbGltaXQgb2YgJyR7c2l6ZX0nYCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnRyb2xsZXIudGVybWluYXRlKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuI3JlYWQrKztcbiAgICAgICAgICBjb250cm9sbGVyLmVucXVldWUoY2h1bmspO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgIH0pO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUVyQzs7Ozs7Ozs7OztDQVVDLEdBQ0QsT0FBTyxNQUFNLCtCQUFrQztJQUM3QyxDQUFDLElBQUksR0FBRyxFQUFFO0lBQ1YsWUFBWSxJQUFZLEVBQUUsVUFBK0IsQ0FBQyxDQUFDLENBQUU7UUFDM0QsS0FBSyxDQUFDO1lBQ0osV0FBVyxDQUFDLE9BQU87Z0JBQ2pCLElBQUksQUFBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLEdBQUcsSUFBSyxNQUFNO29CQUMzQixJQUFJLFFBQVEsT0FBTzt3QkFDakIsTUFBTSxJQUFJLFdBQVcsQ0FBQyx5QkFBeUIsRUFBRSxLQUFLLENBQUMsQ0FBQztvQkFDMUQsT0FBTzt3QkFDTCxXQUFXO29CQUNiO2dCQUNGLE9BQU87b0JBQ0wsSUFBSSxDQUFDLENBQUMsSUFBSTtvQkFDVixXQUFXLFFBQVE7Z0JBQ3JCO1lBQ0Y7UUFDRjtJQUNGO0FBQ0YifQ==