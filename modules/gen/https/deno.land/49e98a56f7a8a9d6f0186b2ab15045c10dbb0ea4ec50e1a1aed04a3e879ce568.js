// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * {@linkcode encode} and {@linkcode decode} for
 * [base64](https://en.wikipedia.org/wiki/Base64) encoding.
 *
 * This module is browser compatible.
 *
 * @example
 * ```ts
 * import {
 *   decode,
 *   encode,
 * } from "https://deno.land/std@$STD_VERSION/encoding/base64.ts";
 *
 * const b64Repr = "Zm9vYg==";
 *
 * const binaryData = decode(b64Repr);
 * console.log(binaryData);
 * // => Uint8Array [ 102, 111, 111, 98 ]
 *
 * console.log(encode(binaryData));
 * // => Zm9vYg==
 * ```
 *
 * @module
 */ const base64abc = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z",
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "+",
    "/"
];
/**
 * CREDIT: https://gist.github.com/enepomnyaschih/72c423f727d395eeaa09697058238727
 * Encodes a given Uint8Array, ArrayBuffer or string into RFC4648 base64 representation
 * @param data
 */ export function encode(data) {
    const uint8 = typeof data === "string" ? new TextEncoder().encode(data) : data instanceof Uint8Array ? data : new Uint8Array(data);
    let result = "", i;
    const l = uint8.length;
    for(i = 2; i < l; i += 3){
        result += base64abc[uint8[i - 2] >> 2];
        result += base64abc[(uint8[i - 2] & 0x03) << 4 | uint8[i - 1] >> 4];
        result += base64abc[(uint8[i - 1] & 0x0f) << 2 | uint8[i] >> 6];
        result += base64abc[uint8[i] & 0x3f];
    }
    if (i === l + 1) {
        // 1 octet yet to write
        result += base64abc[uint8[i - 2] >> 2];
        result += base64abc[(uint8[i - 2] & 0x03) << 4];
        result += "==";
    }
    if (i === l) {
        // 2 octets yet to write
        result += base64abc[uint8[i - 2] >> 2];
        result += base64abc[(uint8[i - 2] & 0x03) << 4 | uint8[i - 1] >> 4];
        result += base64abc[(uint8[i - 1] & 0x0f) << 2];
        result += "=";
    }
    return result;
}
/**
 * Decodes a given RFC4648 base64 encoded string
 * @param b64
 */ export function decode(b64) {
    const binString = atob(b64);
    const size = binString.length;
    const bytes = new Uint8Array(size);
    for(let i = 0; i < size; i++){
        bytes[i] = binString.charCodeAt(i);
    }
    return bytes;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5My4wL2VuY29kaW5nL2Jhc2U2NC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIzIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG4vKipcbiAqIHtAbGlua2NvZGUgZW5jb2RlfSBhbmQge0BsaW5rY29kZSBkZWNvZGV9IGZvclxuICogW2Jhc2U2NF0oaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQmFzZTY0KSBlbmNvZGluZy5cbiAqXG4gKiBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQge1xuICogICBkZWNvZGUsXG4gKiAgIGVuY29kZSxcbiAqIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vZW5jb2RpbmcvYmFzZTY0LnRzXCI7XG4gKlxuICogY29uc3QgYjY0UmVwciA9IFwiWm05dllnPT1cIjtcbiAqXG4gKiBjb25zdCBiaW5hcnlEYXRhID0gZGVjb2RlKGI2NFJlcHIpO1xuICogY29uc29sZS5sb2coYmluYXJ5RGF0YSk7XG4gKiAvLyA9PiBVaW50OEFycmF5IFsgMTAyLCAxMTEsIDExMSwgOTggXVxuICpcbiAqIGNvbnNvbGUubG9nKGVuY29kZShiaW5hcnlEYXRhKSk7XG4gKiAvLyA9PiBabTl2WWc9PVxuICogYGBgXG4gKlxuICogQG1vZHVsZVxuICovXG5cbmNvbnN0IGJhc2U2NGFiYyA9IFtcbiAgXCJBXCIsXG4gIFwiQlwiLFxuICBcIkNcIixcbiAgXCJEXCIsXG4gIFwiRVwiLFxuICBcIkZcIixcbiAgXCJHXCIsXG4gIFwiSFwiLFxuICBcIklcIixcbiAgXCJKXCIsXG4gIFwiS1wiLFxuICBcIkxcIixcbiAgXCJNXCIsXG4gIFwiTlwiLFxuICBcIk9cIixcbiAgXCJQXCIsXG4gIFwiUVwiLFxuICBcIlJcIixcbiAgXCJTXCIsXG4gIFwiVFwiLFxuICBcIlVcIixcbiAgXCJWXCIsXG4gIFwiV1wiLFxuICBcIlhcIixcbiAgXCJZXCIsXG4gIFwiWlwiLFxuICBcImFcIixcbiAgXCJiXCIsXG4gIFwiY1wiLFxuICBcImRcIixcbiAgXCJlXCIsXG4gIFwiZlwiLFxuICBcImdcIixcbiAgXCJoXCIsXG4gIFwiaVwiLFxuICBcImpcIixcbiAgXCJrXCIsXG4gIFwibFwiLFxuICBcIm1cIixcbiAgXCJuXCIsXG4gIFwib1wiLFxuICBcInBcIixcbiAgXCJxXCIsXG4gIFwiclwiLFxuICBcInNcIixcbiAgXCJ0XCIsXG4gIFwidVwiLFxuICBcInZcIixcbiAgXCJ3XCIsXG4gIFwieFwiLFxuICBcInlcIixcbiAgXCJ6XCIsXG4gIFwiMFwiLFxuICBcIjFcIixcbiAgXCIyXCIsXG4gIFwiM1wiLFxuICBcIjRcIixcbiAgXCI1XCIsXG4gIFwiNlwiLFxuICBcIjdcIixcbiAgXCI4XCIsXG4gIFwiOVwiLFxuICBcIitcIixcbiAgXCIvXCIsXG5dO1xuXG4vKipcbiAqIENSRURJVDogaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vZW5lcG9tbnlhc2NoaWgvNzJjNDIzZjcyN2QzOTVlZWFhMDk2OTcwNTgyMzg3MjdcbiAqIEVuY29kZXMgYSBnaXZlbiBVaW50OEFycmF5LCBBcnJheUJ1ZmZlciBvciBzdHJpbmcgaW50byBSRkM0NjQ4IGJhc2U2NCByZXByZXNlbnRhdGlvblxuICogQHBhcmFtIGRhdGFcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVuY29kZShkYXRhOiBBcnJheUJ1ZmZlciB8IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHVpbnQ4ID0gdHlwZW9mIGRhdGEgPT09IFwic3RyaW5nXCJcbiAgICA/IG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShkYXRhKVxuICAgIDogZGF0YSBpbnN0YW5jZW9mIFVpbnQ4QXJyYXlcbiAgICA/IGRhdGFcbiAgICA6IG5ldyBVaW50OEFycmF5KGRhdGEpO1xuICBsZXQgcmVzdWx0ID0gXCJcIixcbiAgICBpO1xuICBjb25zdCBsID0gdWludDgubGVuZ3RoO1xuICBmb3IgKGkgPSAyOyBpIDwgbDsgaSArPSAzKSB7XG4gICAgcmVzdWx0ICs9IGJhc2U2NGFiY1t1aW50OFtpIC0gMl0gPj4gMl07XG4gICAgcmVzdWx0ICs9IGJhc2U2NGFiY1soKHVpbnQ4W2kgLSAyXSAmIDB4MDMpIDw8IDQpIHwgKHVpbnQ4W2kgLSAxXSA+PiA0KV07XG4gICAgcmVzdWx0ICs9IGJhc2U2NGFiY1soKHVpbnQ4W2kgLSAxXSAmIDB4MGYpIDw8IDIpIHwgKHVpbnQ4W2ldID4+IDYpXTtcbiAgICByZXN1bHQgKz0gYmFzZTY0YWJjW3VpbnQ4W2ldICYgMHgzZl07XG4gIH1cbiAgaWYgKGkgPT09IGwgKyAxKSB7XG4gICAgLy8gMSBvY3RldCB5ZXQgdG8gd3JpdGVcbiAgICByZXN1bHQgKz0gYmFzZTY0YWJjW3VpbnQ4W2kgLSAyXSA+PiAyXTtcbiAgICByZXN1bHQgKz0gYmFzZTY0YWJjWyh1aW50OFtpIC0gMl0gJiAweDAzKSA8PCA0XTtcbiAgICByZXN1bHQgKz0gXCI9PVwiO1xuICB9XG4gIGlmIChpID09PSBsKSB7XG4gICAgLy8gMiBvY3RldHMgeWV0IHRvIHdyaXRlXG4gICAgcmVzdWx0ICs9IGJhc2U2NGFiY1t1aW50OFtpIC0gMl0gPj4gMl07XG4gICAgcmVzdWx0ICs9IGJhc2U2NGFiY1soKHVpbnQ4W2kgLSAyXSAmIDB4MDMpIDw8IDQpIHwgKHVpbnQ4W2kgLSAxXSA+PiA0KV07XG4gICAgcmVzdWx0ICs9IGJhc2U2NGFiY1sodWludDhbaSAtIDFdICYgMHgwZikgPDwgMl07XG4gICAgcmVzdWx0ICs9IFwiPVwiO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogRGVjb2RlcyBhIGdpdmVuIFJGQzQ2NDggYmFzZTY0IGVuY29kZWQgc3RyaW5nXG4gKiBAcGFyYW0gYjY0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZWNvZGUoYjY0OiBzdHJpbmcpOiBVaW50OEFycmF5IHtcbiAgY29uc3QgYmluU3RyaW5nID0gYXRvYihiNjQpO1xuICBjb25zdCBzaXplID0gYmluU3RyaW5nLmxlbmd0aDtcbiAgY29uc3QgYnl0ZXMgPSBuZXcgVWludDhBcnJheShzaXplKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaXplOyBpKyspIHtcbiAgICBieXRlc1tpXSA9IGJpblN0cmluZy5jaGFyQ29kZUF0KGkpO1xuICB9XG4gIHJldHVybiBieXRlcztcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0F3QkMsR0FFRCxNQUFNLFlBQVk7SUFDaEI7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7Q0FDRDtBQUVEOzs7O0NBSUMsR0FDRCxPQUFPLFNBQVMsT0FBTyxJQUEwQjtJQUMvQyxNQUFNLFFBQVEsT0FBTyxTQUFTLFdBQzFCLElBQUksY0FBYyxPQUFPLFFBQ3pCLGdCQUFnQixhQUNoQixPQUNBLElBQUksV0FBVztJQUNuQixJQUFJLFNBQVMsSUFDWDtJQUNGLE1BQU0sSUFBSSxNQUFNO0lBQ2hCLElBQUssSUFBSSxHQUFHLElBQUksR0FBRyxLQUFLLEVBQUc7UUFDekIsVUFBVSxTQUFTLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUU7UUFDdEMsVUFBVSxTQUFTLENBQUMsQUFBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsR0FBRyxJQUFJLEtBQUssSUFBTSxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRztRQUN2RSxVQUFVLFNBQVMsQ0FBQyxBQUFDLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxHQUFHLElBQUksS0FBSyxJQUFNLEtBQUssQ0FBQyxFQUFFLElBQUksRUFBRztRQUNuRSxVQUFVLFNBQVMsQ0FBQyxLQUFLLENBQUMsRUFBRSxHQUFHLEtBQUs7SUFDdEM7SUFDQSxJQUFJLE1BQU0sSUFBSSxHQUFHO1FBQ2YsdUJBQXVCO1FBQ3ZCLFVBQVUsU0FBUyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFO1FBQ3RDLFVBQVUsU0FBUyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxHQUFHLElBQUksS0FBSyxFQUFFO1FBQy9DLFVBQVU7SUFDWjtJQUNBLElBQUksTUFBTSxHQUFHO1FBQ1gsd0JBQXdCO1FBQ3hCLFVBQVUsU0FBUyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFO1FBQ3RDLFVBQVUsU0FBUyxDQUFDLEFBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLEdBQUcsSUFBSSxLQUFLLElBQU0sS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUc7UUFDdkUsVUFBVSxTQUFTLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLEdBQUcsSUFBSSxLQUFLLEVBQUU7UUFDL0MsVUFBVTtJQUNaO0lBQ0EsT0FBTztBQUNUO0FBRUE7OztDQUdDLEdBQ0QsT0FBTyxTQUFTLE9BQU8sR0FBVztJQUNoQyxNQUFNLFlBQVksS0FBSztJQUN2QixNQUFNLE9BQU8sVUFBVTtJQUN2QixNQUFNLFFBQVEsSUFBSSxXQUFXO0lBQzdCLElBQUssSUFBSSxJQUFJLEdBQUcsSUFBSSxNQUFNLElBQUs7UUFDN0IsS0FBSyxDQUFDLEVBQUUsR0FBRyxVQUFVLFdBQVc7SUFDbEM7SUFDQSxPQUFPO0FBQ1QifQ==