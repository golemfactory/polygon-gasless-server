// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { Buffer } from "./buffer.ts";
/**
 * Reader utility for strings.
 *
 * @example
 * ```ts
 * import { StringReader } from "https://deno.land/std@$STD_VERSION/io/string_reader.ts";
 *
 * const data = new Uint8Array(6);
 * const r = new StringReader("abcdef");
 * const res0 = await r.read(data);
 * const res1 = await r.read(new Uint8Array(6));
 *
 * // Number of bytes read
 * console.log(res0); // 6
 * console.log(res1); // null, no byte left to read. EOL
 *
 * // text
 *
 * console.log(new TextDecoder().decode(data)); // abcdef
 * ```
 *
 * **Output:**
 *
 * ```text
 * 6
 * null
 * abcdef
 * ```
 */ export class StringReader extends Buffer {
    constructor(s){
        super(new TextEncoder().encode(s).buffer);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5My4wL2lvL3N0cmluZ19yZWFkZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMyB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcIi4vYnVmZmVyLnRzXCI7XG5cbi8qKlxuICogUmVhZGVyIHV0aWxpdHkgZm9yIHN0cmluZ3MuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBTdHJpbmdSZWFkZXIgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9pby9zdHJpbmdfcmVhZGVyLnRzXCI7XG4gKlxuICogY29uc3QgZGF0YSA9IG5ldyBVaW50OEFycmF5KDYpO1xuICogY29uc3QgciA9IG5ldyBTdHJpbmdSZWFkZXIoXCJhYmNkZWZcIik7XG4gKiBjb25zdCByZXMwID0gYXdhaXQgci5yZWFkKGRhdGEpO1xuICogY29uc3QgcmVzMSA9IGF3YWl0IHIucmVhZChuZXcgVWludDhBcnJheSg2KSk7XG4gKlxuICogLy8gTnVtYmVyIG9mIGJ5dGVzIHJlYWRcbiAqIGNvbnNvbGUubG9nKHJlczApOyAvLyA2XG4gKiBjb25zb2xlLmxvZyhyZXMxKTsgLy8gbnVsbCwgbm8gYnl0ZSBsZWZ0IHRvIHJlYWQuIEVPTFxuICpcbiAqIC8vIHRleHRcbiAqXG4gKiBjb25zb2xlLmxvZyhuZXcgVGV4dERlY29kZXIoKS5kZWNvZGUoZGF0YSkpOyAvLyBhYmNkZWZcbiAqIGBgYFxuICpcbiAqICoqT3V0cHV0OioqXG4gKlxuICogYGBgdGV4dFxuICogNlxuICogbnVsbFxuICogYWJjZGVmXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNsYXNzIFN0cmluZ1JlYWRlciBleHRlbmRzIEJ1ZmZlciB7XG4gIGNvbnN0cnVjdG9yKHM6IHN0cmluZykge1xuICAgIHN1cGVyKG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShzKS5idWZmZXIpO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUVyQyxTQUFTLE1BQU0sUUFBUSxjQUFjO0FBRXJDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBNEJDLEdBQ0QsT0FBTyxNQUFNLHFCQUFxQjtJQUNoQyxZQUFZLENBQVMsQ0FBRTtRQUNyQixLQUFLLENBQUMsSUFBSSxjQUFjLE9BQU8sR0FBRztJQUNwQztBQUNGIn0=