// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { assert } from "../_util/asserts.ts";
/**
 * A transform stream that only transforms from the zero-indexed `start` and `end` bytes (both inclusive).
 *
 * @example
 * ```ts
 * import { ByteSliceStream } from "https://deno.land/std@$STD_VERSION/streams/byte_slice_stream.ts";
 * const response = await fetch("https://example.com");
 * const rangedStream = response.body!
 *   .pipeThrough(new ByteSliceStream(3, 8));
 * ```
 */ export class ByteSliceStream extends TransformStream {
    #offsetStart = 0;
    #offsetEnd = 0;
    constructor(start = 0, end = Infinity){
        super({
            start: ()=>{
                assert(start >= 0, "`start` must be greater than 0");
                end += 1;
            },
            transform: (chunk, controller)=>{
                this.#offsetStart = this.#offsetEnd;
                this.#offsetEnd += chunk.byteLength;
                if (this.#offsetEnd > start) {
                    if (this.#offsetStart < start) {
                        chunk = chunk.slice(start - this.#offsetStart);
                    }
                    if (this.#offsetEnd >= end) {
                        chunk = chunk.slice(0, chunk.byteLength - this.#offsetEnd + end);
                        controller.enqueue(chunk);
                        controller.terminate();
                    } else {
                        controller.enqueue(chunk);
                    }
                }
            }
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5My4wL3N0cmVhbXMvYnl0ZV9zbGljZV9zdHJlYW0udHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMyB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuaW1wb3J0IHsgYXNzZXJ0IH0gZnJvbSBcIi4uL191dGlsL2Fzc2VydHMudHNcIjtcblxuLyoqXG4gKiBBIHRyYW5zZm9ybSBzdHJlYW0gdGhhdCBvbmx5IHRyYW5zZm9ybXMgZnJvbSB0aGUgemVyby1pbmRleGVkIGBzdGFydGAgYW5kIGBlbmRgIGJ5dGVzIChib3RoIGluY2x1c2l2ZSkuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBCeXRlU2xpY2VTdHJlYW0gfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9zdHJlYW1zL2J5dGVfc2xpY2Vfc3RyZWFtLnRzXCI7XG4gKiBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKFwiaHR0cHM6Ly9leGFtcGxlLmNvbVwiKTtcbiAqIGNvbnN0IHJhbmdlZFN0cmVhbSA9IHJlc3BvbnNlLmJvZHkhXG4gKiAgIC5waXBlVGhyb3VnaChuZXcgQnl0ZVNsaWNlU3RyZWFtKDMsIDgpKTtcbiAqIGBgYFxuICovXG5leHBvcnQgY2xhc3MgQnl0ZVNsaWNlU3RyZWFtIGV4dGVuZHMgVHJhbnNmb3JtU3RyZWFtPFVpbnQ4QXJyYXksIFVpbnQ4QXJyYXk+IHtcbiAgI29mZnNldFN0YXJ0ID0gMDtcbiAgI29mZnNldEVuZCA9IDA7XG5cbiAgY29uc3RydWN0b3Ioc3RhcnQgPSAwLCBlbmQgPSBJbmZpbml0eSkge1xuICAgIHN1cGVyKHtcbiAgICAgIHN0YXJ0OiAoKSA9PiB7XG4gICAgICAgIGFzc2VydChzdGFydCA+PSAwLCBcImBzdGFydGAgbXVzdCBiZSBncmVhdGVyIHRoYW4gMFwiKTtcbiAgICAgICAgZW5kICs9IDE7XG4gICAgICB9LFxuICAgICAgdHJhbnNmb3JtOiAoY2h1bmssIGNvbnRyb2xsZXIpID0+IHtcbiAgICAgICAgdGhpcy4jb2Zmc2V0U3RhcnQgPSB0aGlzLiNvZmZzZXRFbmQ7XG4gICAgICAgIHRoaXMuI29mZnNldEVuZCArPSBjaHVuay5ieXRlTGVuZ3RoO1xuICAgICAgICBpZiAodGhpcy4jb2Zmc2V0RW5kID4gc3RhcnQpIHtcbiAgICAgICAgICBpZiAodGhpcy4jb2Zmc2V0U3RhcnQgPCBzdGFydCkge1xuICAgICAgICAgICAgY2h1bmsgPSBjaHVuay5zbGljZShzdGFydCAtIHRoaXMuI29mZnNldFN0YXJ0KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHRoaXMuI29mZnNldEVuZCA+PSBlbmQpIHtcbiAgICAgICAgICAgIGNodW5rID0gY2h1bmsuc2xpY2UoMCwgY2h1bmsuYnl0ZUxlbmd0aCAtIHRoaXMuI29mZnNldEVuZCArIGVuZCk7XG4gICAgICAgICAgICBjb250cm9sbGVyLmVucXVldWUoY2h1bmspO1xuICAgICAgICAgICAgY29udHJvbGxlci50ZXJtaW5hdGUoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29udHJvbGxlci5lbnF1ZXVlKGNodW5rKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDLFNBQVMsTUFBTSxRQUFRLHNCQUFzQjtBQUU3Qzs7Ozs7Ozs7OztDQVVDLEdBQ0QsT0FBTyxNQUFNLHdCQUF3QjtJQUNuQyxDQUFDLFdBQVcsR0FBRyxFQUFFO0lBQ2pCLENBQUMsU0FBUyxHQUFHLEVBQUU7SUFFZixZQUFZLFFBQVEsQ0FBQyxFQUFFLE1BQU0sUUFBUSxDQUFFO1FBQ3JDLEtBQUssQ0FBQztZQUNKLE9BQU87Z0JBQ0wsT0FBTyxTQUFTLEdBQUc7Z0JBQ25CLE9BQU87WUFDVDtZQUNBLFdBQVcsQ0FBQyxPQUFPO2dCQUNqQixJQUFJLENBQUMsQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLENBQUMsU0FBUztnQkFDbkMsSUFBSSxDQUFDLENBQUMsU0FBUyxJQUFJLE1BQU07Z0JBQ3pCLElBQUksSUFBSSxDQUFDLENBQUMsU0FBUyxHQUFHLE9BQU87b0JBQzNCLElBQUksSUFBSSxDQUFDLENBQUMsV0FBVyxHQUFHLE9BQU87d0JBQzdCLFFBQVEsTUFBTSxNQUFNLFFBQVEsSUFBSSxDQUFDLENBQUMsV0FBVztvQkFDL0M7b0JBQ0EsSUFBSSxJQUFJLENBQUMsQ0FBQyxTQUFTLElBQUksS0FBSzt3QkFDMUIsUUFBUSxNQUFNLE1BQU0sR0FBRyxNQUFNLGFBQWEsSUFBSSxDQUFDLENBQUMsU0FBUyxHQUFHO3dCQUM1RCxXQUFXLFFBQVE7d0JBQ25CLFdBQVc7b0JBQ2IsT0FBTzt3QkFDTCxXQUFXLFFBQVE7b0JBQ3JCO2dCQUNGO1lBQ0Y7UUFDRjtJQUNGO0FBQ0YifQ==