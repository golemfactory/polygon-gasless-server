// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
const decoder = new TextDecoder();
/**
 * Writer utility for buffering string chunks.
 *
 * @example
 * ```ts
 * import {
 *   copyN,
 *   StringReader,
 *   StringWriter,
 * } from "https://deno.land/std@$STD_VERSION/io/mod.ts";
 * import { copy } from "https://deno.land/std@$STD_VERSION/streams/copy.ts";
 *
 * const w = new StringWriter("base");
 * const r = new StringReader("0123456789");
 * await copyN(r, w, 4); // copy 4 bytes
 *
 * // Number of bytes read
 * console.log(w.toString()); //base0123
 *
 * await copy(r, w); // copy all
 * console.log(w.toString()); // base0123456789
 * ```
 *
 * **Output:**
 *
 * ```text
 * base0123
 * base0123456789
 * ```
 */ export class StringWriter {
    base;
    #chunks;
    #byteLength;
    #cache;
    constructor(base = ""){
        this.base = base;
        this.#chunks = [];
        this.#byteLength = 0;
        const c = new TextEncoder().encode(base);
        this.#chunks.push(c);
        this.#byteLength += c.byteLength;
    }
    write(p) {
        return Promise.resolve(this.writeSync(p));
    }
    writeSync(p) {
        this.#chunks.push(new Uint8Array(p));
        this.#byteLength += p.byteLength;
        this.#cache = undefined;
        return p.byteLength;
    }
    toString() {
        if (this.#cache) {
            return this.#cache;
        }
        const buf = new Uint8Array(this.#byteLength);
        let offs = 0;
        for (const chunk of this.#chunks){
            buf.set(chunk, offs);
            offs += chunk.byteLength;
        }
        this.#cache = decoder.decode(buf);
        return this.#cache;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5My4wL2lvL3N0cmluZ193cml0ZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMyB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuaW1wb3J0IHR5cGUgeyBXcml0ZXIsIFdyaXRlclN5bmMgfSBmcm9tIFwiLi4vdHlwZXMuZC50c1wiO1xuXG5jb25zdCBkZWNvZGVyID0gbmV3IFRleHREZWNvZGVyKCk7XG5cbi8qKlxuICogV3JpdGVyIHV0aWxpdHkgZm9yIGJ1ZmZlcmluZyBzdHJpbmcgY2h1bmtzLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHtcbiAqICAgY29weU4sXG4gKiAgIFN0cmluZ1JlYWRlcixcbiAqICAgU3RyaW5nV3JpdGVyLFxuICogfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9pby9tb2QudHNcIjtcbiAqIGltcG9ydCB7IGNvcHkgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9zdHJlYW1zL2NvcHkudHNcIjtcbiAqXG4gKiBjb25zdCB3ID0gbmV3IFN0cmluZ1dyaXRlcihcImJhc2VcIik7XG4gKiBjb25zdCByID0gbmV3IFN0cmluZ1JlYWRlcihcIjAxMjM0NTY3ODlcIik7XG4gKiBhd2FpdCBjb3B5TihyLCB3LCA0KTsgLy8gY29weSA0IGJ5dGVzXG4gKlxuICogLy8gTnVtYmVyIG9mIGJ5dGVzIHJlYWRcbiAqIGNvbnNvbGUubG9nKHcudG9TdHJpbmcoKSk7IC8vYmFzZTAxMjNcbiAqXG4gKiBhd2FpdCBjb3B5KHIsIHcpOyAvLyBjb3B5IGFsbFxuICogY29uc29sZS5sb2cody50b1N0cmluZygpKTsgLy8gYmFzZTAxMjM0NTY3ODlcbiAqIGBgYFxuICpcbiAqICoqT3V0cHV0OioqXG4gKlxuICogYGBgdGV4dFxuICogYmFzZTAxMjNcbiAqIGJhc2UwMTIzNDU2Nzg5XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNsYXNzIFN0cmluZ1dyaXRlciBpbXBsZW1lbnRzIFdyaXRlciwgV3JpdGVyU3luYyB7XG4gICNjaHVua3M6IFVpbnQ4QXJyYXlbXSA9IFtdO1xuICAjYnl0ZUxlbmd0aCA9IDA7XG4gICNjYWNoZTogc3RyaW5nIHwgdW5kZWZpbmVkO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgYmFzZTogc3RyaW5nID0gXCJcIikge1xuICAgIGNvbnN0IGMgPSBuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUoYmFzZSk7XG4gICAgdGhpcy4jY2h1bmtzLnB1c2goYyk7XG4gICAgdGhpcy4jYnl0ZUxlbmd0aCArPSBjLmJ5dGVMZW5ndGg7XG4gIH1cblxuICB3cml0ZShwOiBVaW50OEFycmF5KTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMud3JpdGVTeW5jKHApKTtcbiAgfVxuXG4gIHdyaXRlU3luYyhwOiBVaW50OEFycmF5KTogbnVtYmVyIHtcbiAgICB0aGlzLiNjaHVua3MucHVzaChuZXcgVWludDhBcnJheShwKSk7XG4gICAgdGhpcy4jYnl0ZUxlbmd0aCArPSBwLmJ5dGVMZW5ndGg7XG4gICAgdGhpcy4jY2FjaGUgPSB1bmRlZmluZWQ7XG4gICAgcmV0dXJuIHAuYnl0ZUxlbmd0aDtcbiAgfVxuXG4gIHRvU3RyaW5nKCk6IHN0cmluZyB7XG4gICAgaWYgKHRoaXMuI2NhY2hlKSB7XG4gICAgICByZXR1cm4gdGhpcy4jY2FjaGU7XG4gICAgfVxuICAgIGNvbnN0IGJ1ZiA9IG5ldyBVaW50OEFycmF5KHRoaXMuI2J5dGVMZW5ndGgpO1xuICAgIGxldCBvZmZzID0gMDtcbiAgICBmb3IgKGNvbnN0IGNodW5rIG9mIHRoaXMuI2NodW5rcykge1xuICAgICAgYnVmLnNldChjaHVuaywgb2Zmcyk7XG4gICAgICBvZmZzICs9IGNodW5rLmJ5dGVMZW5ndGg7XG4gICAgfVxuICAgIHRoaXMuI2NhY2hlID0gZGVjb2Rlci5kZWNvZGUoYnVmKTtcbiAgICByZXR1cm4gdGhpcy4jY2FjaGU7XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBSXJDLE1BQU0sVUFBVSxJQUFJO0FBRXBCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQTZCQyxHQUNELE9BQU8sTUFBTTtJQUtTO0lBSnBCLENBQUMsTUFBTSxDQUFvQjtJQUMzQixDQUFDLFVBQVUsQ0FBSztJQUNoQixDQUFDLEtBQUssQ0FBcUI7SUFFM0IsWUFBb0IsT0FBZSxFQUFFLENBQUU7b0JBQW5CO2FBSnBCLENBQUMsTUFBTSxHQUFpQixFQUFFO2FBQzFCLENBQUMsVUFBVSxHQUFHO1FBSVosTUFBTSxJQUFJLElBQUksY0FBYyxPQUFPO1FBQ25DLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLO1FBQ2xCLElBQUksQ0FBQyxDQUFDLFVBQVUsSUFBSSxFQUFFO0lBQ3hCO0lBRUEsTUFBTSxDQUFhLEVBQW1CO1FBQ3BDLE9BQU8sUUFBUSxRQUFRLElBQUksQ0FBQyxVQUFVO0lBQ3hDO0lBRUEsVUFBVSxDQUFhLEVBQVU7UUFDL0IsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssSUFBSSxXQUFXO1FBQ2pDLElBQUksQ0FBQyxDQUFDLFVBQVUsSUFBSSxFQUFFO1FBQ3RCLElBQUksQ0FBQyxDQUFDLEtBQUssR0FBRztRQUNkLE9BQU8sRUFBRTtJQUNYO0lBRUEsV0FBbUI7UUFDakIsSUFBSSxJQUFJLENBQUMsQ0FBQyxLQUFLLEVBQUU7WUFDZixPQUFPLElBQUksQ0FBQyxDQUFDLEtBQUs7UUFDcEI7UUFDQSxNQUFNLE1BQU0sSUFBSSxXQUFXLElBQUksQ0FBQyxDQUFDLFVBQVU7UUFDM0MsSUFBSSxPQUFPO1FBQ1gsS0FBSyxNQUFNLFNBQVMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFFO1lBQ2hDLElBQUksSUFBSSxPQUFPO1lBQ2YsUUFBUSxNQUFNO1FBQ2hCO1FBQ0EsSUFBSSxDQUFDLENBQUMsS0FBSyxHQUFHLFFBQVEsT0FBTztRQUM3QixPQUFPLElBQUksQ0FBQyxDQUFDLEtBQUs7SUFDcEI7QUFDRiJ9