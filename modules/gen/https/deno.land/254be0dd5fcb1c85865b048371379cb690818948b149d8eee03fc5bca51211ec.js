// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * {@linkcode encode} and {@linkcode decode} for
 * [base64 URL safe](https://en.wikipedia.org/wiki/Base64#URL_applications) encoding.
 *
 * This module is browser compatible.
 *
 * @example
 * ```ts
 * import {
 *   decode,
 *   encode,
 * } from "https://deno.land/std@$STD_VERSION/encoding/base64url.ts";
 *
 * const binary = new TextEncoder().encode("foobar");
 * const encoded = encode(binary);
 * console.log(encoded);
 * // => "Zm9vYmFy"
 *
 * console.log(decode(encoded));
 * // => Uint8Array(6) [ 102, 111, 111, 98, 97, 114 ]
 * ```
 *
 * @module
 */ import * as base64 from "./base64.ts";
/*
 * Some variants allow or require omitting the padding '=' signs:
 * https://en.wikipedia.org/wiki/Base64#The_URL_applications
 * @param base64url
 */ function addPaddingToBase64url(base64url) {
    if (base64url.length % 4 === 2) return base64url + "==";
    if (base64url.length % 4 === 3) return base64url + "=";
    if (base64url.length % 4 === 1) {
        throw new TypeError("Illegal base64url string!");
    }
    return base64url;
}
function convertBase64urlToBase64(b64url) {
    if (!/^[-_A-Z0-9]*?={0,2}$/i.test(b64url)) {
        // Contains characters not part of base64url spec.
        throw new TypeError("Failed to decode base64url: invalid character");
    }
    return addPaddingToBase64url(b64url).replace(/\-/g, "+").replace(/_/g, "/");
}
function convertBase64ToBase64url(b64) {
    return b64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
/**
 * Encodes a given ArrayBuffer or string into a base64url representation
 * @param data
 */ export function encode(data) {
    return convertBase64ToBase64url(base64.encode(data));
}
/**
 * Converts given base64url encoded data back to original
 * @param b64url
 */ export function decode(b64url) {
    return base64.decode(convertBase64urlToBase64(b64url));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5My4wL2VuY29kaW5nL2Jhc2U2NHVybC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIzIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG4vKipcbiAqIHtAbGlua2NvZGUgZW5jb2RlfSBhbmQge0BsaW5rY29kZSBkZWNvZGV9IGZvclxuICogW2Jhc2U2NCBVUkwgc2FmZV0oaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQmFzZTY0I1VSTF9hcHBsaWNhdGlvbnMpIGVuY29kaW5nLlxuICpcbiAqIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHNcbiAqIGltcG9ydCB7XG4gKiAgIGRlY29kZSxcbiAqICAgZW5jb2RlLFxuICogfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9lbmNvZGluZy9iYXNlNjR1cmwudHNcIjtcbiAqXG4gKiBjb25zdCBiaW5hcnkgPSBuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUoXCJmb29iYXJcIik7XG4gKiBjb25zdCBlbmNvZGVkID0gZW5jb2RlKGJpbmFyeSk7XG4gKiBjb25zb2xlLmxvZyhlbmNvZGVkKTtcbiAqIC8vID0+IFwiWm05dlltRnlcIlxuICpcbiAqIGNvbnNvbGUubG9nKGRlY29kZShlbmNvZGVkKSk7XG4gKiAvLyA9PiBVaW50OEFycmF5KDYpIFsgMTAyLCAxMTEsIDExMSwgOTgsIDk3LCAxMTQgXVxuICogYGBgXG4gKlxuICogQG1vZHVsZVxuICovXG5cbmltcG9ydCAqIGFzIGJhc2U2NCBmcm9tIFwiLi9iYXNlNjQudHNcIjtcblxuLypcbiAqIFNvbWUgdmFyaWFudHMgYWxsb3cgb3IgcmVxdWlyZSBvbWl0dGluZyB0aGUgcGFkZGluZyAnPScgc2lnbnM6XG4gKiBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9CYXNlNjQjVGhlX1VSTF9hcHBsaWNhdGlvbnNcbiAqIEBwYXJhbSBiYXNlNjR1cmxcbiAqL1xuZnVuY3Rpb24gYWRkUGFkZGluZ1RvQmFzZTY0dXJsKGJhc2U2NHVybDogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKGJhc2U2NHVybC5sZW5ndGggJSA0ID09PSAyKSByZXR1cm4gYmFzZTY0dXJsICsgXCI9PVwiO1xuICBpZiAoYmFzZTY0dXJsLmxlbmd0aCAlIDQgPT09IDMpIHJldHVybiBiYXNlNjR1cmwgKyBcIj1cIjtcbiAgaWYgKGJhc2U2NHVybC5sZW5ndGggJSA0ID09PSAxKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIklsbGVnYWwgYmFzZTY0dXJsIHN0cmluZyFcIik7XG4gIH1cbiAgcmV0dXJuIGJhc2U2NHVybDtcbn1cblxuZnVuY3Rpb24gY29udmVydEJhc2U2NHVybFRvQmFzZTY0KGI2NHVybDogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKCEvXlstX0EtWjAtOV0qPz17MCwyfSQvaS50ZXN0KGI2NHVybCkpIHtcbiAgICAvLyBDb250YWlucyBjaGFyYWN0ZXJzIG5vdCBwYXJ0IG9mIGJhc2U2NHVybCBzcGVjLlxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJGYWlsZWQgdG8gZGVjb2RlIGJhc2U2NHVybDogaW52YWxpZCBjaGFyYWN0ZXJcIik7XG4gIH1cbiAgcmV0dXJuIGFkZFBhZGRpbmdUb0Jhc2U2NHVybChiNjR1cmwpLnJlcGxhY2UoL1xcLS9nLCBcIitcIikucmVwbGFjZSgvXy9nLCBcIi9cIik7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRCYXNlNjRUb0Jhc2U2NHVybChiNjQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBiNjQucmVwbGFjZSgvPS9nLCBcIlwiKS5yZXBsYWNlKC9cXCsvZywgXCItXCIpLnJlcGxhY2UoL1xcLy9nLCBcIl9cIik7XG59XG5cbi8qKlxuICogRW5jb2RlcyBhIGdpdmVuIEFycmF5QnVmZmVyIG9yIHN0cmluZyBpbnRvIGEgYmFzZTY0dXJsIHJlcHJlc2VudGF0aW9uXG4gKiBAcGFyYW0gZGF0YVxuICovXG5leHBvcnQgZnVuY3Rpb24gZW5jb2RlKGRhdGE6IEFycmF5QnVmZmVyIHwgc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGNvbnZlcnRCYXNlNjRUb0Jhc2U2NHVybChiYXNlNjQuZW5jb2RlKGRhdGEpKTtcbn1cblxuLyoqXG4gKiBDb252ZXJ0cyBnaXZlbiBiYXNlNjR1cmwgZW5jb2RlZCBkYXRhIGJhY2sgdG8gb3JpZ2luYWxcbiAqIEBwYXJhbSBiNjR1cmxcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlY29kZShiNjR1cmw6IHN0cmluZyk6IFVpbnQ4QXJyYXkge1xuICByZXR1cm4gYmFzZTY0LmRlY29kZShjb252ZXJ0QmFzZTY0dXJsVG9CYXNlNjQoYjY0dXJsKSk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUVyQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0F1QkMsR0FFRCxZQUFZLFlBQVksY0FBYztBQUV0Qzs7OztDQUlDLEdBQ0QsU0FBUyxzQkFBc0IsU0FBaUI7SUFDOUMsSUFBSSxVQUFVLFNBQVMsTUFBTSxHQUFHLE9BQU8sWUFBWTtJQUNuRCxJQUFJLFVBQVUsU0FBUyxNQUFNLEdBQUcsT0FBTyxZQUFZO0lBQ25ELElBQUksVUFBVSxTQUFTLE1BQU0sR0FBRztRQUM5QixNQUFNLElBQUksVUFBVTtJQUN0QjtJQUNBLE9BQU87QUFDVDtBQUVBLFNBQVMseUJBQXlCLE1BQWM7SUFDOUMsSUFBSSxDQUFDLHdCQUF3QixLQUFLLFNBQVM7UUFDekMsa0RBQWtEO1FBQ2xELE1BQU0sSUFBSSxVQUFVO0lBQ3RCO0lBQ0EsT0FBTyxzQkFBc0IsUUFBUSxRQUFRLE9BQU8sS0FBSyxRQUFRLE1BQU07QUFDekU7QUFFQSxTQUFTLHlCQUF5QixHQUFXO0lBQzNDLE9BQU8sSUFBSSxRQUFRLE1BQU0sSUFBSSxRQUFRLE9BQU8sS0FBSyxRQUFRLE9BQU87QUFDbEU7QUFFQTs7O0NBR0MsR0FDRCxPQUFPLFNBQVMsT0FBTyxJQUEwQjtJQUMvQyxPQUFPLHlCQUF5QixPQUFPLE9BQU87QUFDaEQ7QUFFQTs7O0NBR0MsR0FDRCxPQUFPLFNBQVMsT0FBTyxNQUFjO0lBQ25DLE9BQU8sT0FBTyxPQUFPLHlCQUF5QjtBQUNoRCJ9