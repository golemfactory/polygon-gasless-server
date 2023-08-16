// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/** Returns the index of the first occurrence of the needle array in the source
 * array, or -1 if it is not present.
 *
 * A start index can be specified as the third argument that begins the search
 * at that given index. The start index defaults to the start of the array.
 *
 * The complexity of this function is O(source.lenth * needle.length).
 *
 * ```ts
 * import { indexOfNeedle } from "./mod.ts";
 * const source = new Uint8Array([0, 1, 2, 1, 2, 1, 2, 3]);
 * const needle = new Uint8Array([1, 2]);
 * console.log(indexOfNeedle(source, needle)); // 1
 * console.log(indexOfNeedle(source, needle, 2)); // 3
 * ```
 */ export function indexOfNeedle(source, needle, start = 0) {
    if (start >= source.length) {
        return -1;
    }
    if (start < 0) {
        start = Math.max(0, source.length + start);
    }
    const s = needle[0];
    for(let i = start; i < source.length; i++){
        if (source[i] !== s) continue;
        const pin = i;
        let matched = 1;
        let j = i;
        while(matched < needle.length){
            j++;
            if (source[j] !== needle[j - pin]) {
                break;
            }
            matched++;
        }
        if (matched === needle.length) {
            return pin;
        }
    }
    return -1;
}
/** Returns the index of the last occurrence of the needle array in the source
 * array, or -1 if it is not present.
 *
 * A start index can be specified as the third argument that begins the search
 * at that given index. The start index defaults to the end of the array.
 *
 * The complexity of this function is O(source.lenth * needle.length).
 *
 * ```ts
 * import { lastIndexOfNeedle } from "./mod.ts";
 * const source = new Uint8Array([0, 1, 2, 1, 2, 1, 2, 3]);
 * const needle = new Uint8Array([1, 2]);
 * console.log(lastIndexOfNeedle(source, needle)); // 5
 * console.log(lastIndexOfNeedle(source, needle, 4)); // 3
 * ```
 */ export function lastIndexOfNeedle(source, needle, start = source.length - 1) {
    if (start < 0) {
        return -1;
    }
    if (start >= source.length) {
        start = source.length - 1;
    }
    const e = needle[needle.length - 1];
    for(let i = start; i >= 0; i--){
        if (source[i] !== e) continue;
        const pin = i;
        let matched = 1;
        let j = i;
        while(matched < needle.length){
            j--;
            if (source[j] !== needle[needle.length - 1 - (pin - j)]) {
                break;
            }
            matched++;
        }
        if (matched === needle.length) {
            return pin - needle.length + 1;
        }
    }
    return -1;
}
/** Returns true if the prefix array appears at the start of the source array,
 * false otherwise.
 *
 * The complexity of this function is O(prefix.length).
 *
 * ```ts
 * import { startsWith } from "./mod.ts";
 * const source = new Uint8Array([0, 1, 2, 1, 2, 1, 2, 3]);
 * const prefix = new Uint8Array([0, 1, 2]);
 * console.log(startsWith(source, prefix)); // true
 * ```
 */ export function startsWith(source, prefix) {
    for(let i = 0, max = prefix.length; i < max; i++){
        if (source[i] !== prefix[i]) return false;
    }
    return true;
}
/** Returns true if the suffix array appears at the end of the source array,
 * false otherwise.
 *
 * The complexity of this function is O(suffix.length).
 *
 * ```ts
 * import { endsWith } from "./mod.ts";
 * const source = new Uint8Array([0, 1, 2, 1, 2, 1, 2, 3]);
 * const suffix = new Uint8Array([1, 2, 3]);
 * console.log(endsWith(source, suffix)); // true
 * ```
 */ export function endsWith(source, suffix) {
    for(let srci = source.length - 1, sfxi = suffix.length - 1; sfxi >= 0; srci--, sfxi--){
        if (source[srci] !== suffix[sfxi]) return false;
    }
    return true;
}
/** Returns a new Uint8Array composed of `count` repetitions of the `source`
 * array.
 *
 * If `count` is negative, a `RangeError` is thrown.
 *
 * ```ts
 * import { repeat } from "./mod.ts";
 * const source = new Uint8Array([0, 1, 2]);
 * console.log(repeat(source, 3)); // [0, 1, 2, 0, 1, 2, 0, 1, 2]
 * console.log(repeat(source, 0)); // []
 * console.log(repeat(source, -1)); // RangeError
 * ```
 */ export function repeat(source, count) {
    if (count === 0) {
        return new Uint8Array();
    }
    if (count < 0) {
        throw new RangeError("bytes: negative repeat count");
    } else if (source.length * count / count !== source.length) {
        throw new Error("bytes: repeat count causes overflow");
    }
    const int = Math.floor(count);
    if (int !== count) {
        throw new Error("bytes: repeat count must be an integer");
    }
    const nb = new Uint8Array(source.length * count);
    let bp = copy(source, nb);
    for(; bp < nb.length; bp *= 2){
        copy(nb.slice(0, bp), nb, bp);
    }
    return nb;
}
/** Concatenate the given arrays into a new Uint8Array.
 *
 * ```ts
 * import { concat } from "./mod.ts";
 * const a = new Uint8Array([0, 1, 2]);
 * const b = new Uint8Array([3, 4, 5]);
 * console.log(concat(a, b)); // [0, 1, 2, 3, 4, 5]
 */ export function concat(...buf) {
    let length = 0;
    for (const b of buf){
        length += b.length;
    }
    const output = new Uint8Array(length);
    let index = 0;
    for (const b of buf){
        output.set(b, index);
        index += b.length;
    }
    return output;
}
/** Returns true if the source array contains the needle array, false otherwise.
 *
 * A start index can be specified as the third argument that begins the search
 * at that given index. The start index defaults to the beginning of the array.
 *
 * The complexity of this function is O(source.length * needle.length).
 *
 * ```ts
 * import { includesNeedle } from "./mod.ts";
 * const source = new Uint8Array([0, 1, 2, 1, 2, 1, 2, 3]);
 * const needle = new Uint8Array([1, 2]);
 * console.log(includesNeedle(source, needle)); // true
 * console.log(includesNeedle(source, needle, 6)); // false
 * ```
 */ export function includesNeedle(source, needle, start = 0) {
    return indexOfNeedle(source, needle, start) !== -1;
}
/** Copy bytes from the `src` array to the `dst` array. Returns the number of
 * bytes copied.
 *
 * If the `src` array is larger than what the `dst` array can hold, only the
 * amount of bytes that fit in the `dst` array are copied.
 *
 * An offset can be specified as the third argument that begins the copy at
 * that given index in the `dst` array. The offset defaults to the beginning of
 * the array.
 *
 * ```ts
 * import { copy } from "./mod.ts";
 * const src = new Uint8Array([9, 8, 7]);
 * const dst = new Uint8Array([0, 1, 2, 3, 4, 5]);
 * console.log(copy(src, dst)); // 3
 * console.log(dst); // [9, 8, 7, 3, 4, 5]
 * ```
 *
 * ```ts
 * import { copy } from "./mod.ts";
 * const src = new Uint8Array([1, 1, 1, 1]);
 * const dst = new Uint8Array([0, 0, 0, 0]);
 * console.log(copy(src, dst, 1)); // 3
 * console.log(dst); // [0, 1, 1, 1]
 * ```
 */ export function copy(src, dst, off = 0) {
    off = Math.max(0, Math.min(off, dst.byteLength));
    const dstBytesAvailable = dst.byteLength - off;
    if (src.byteLength > dstBytesAvailable) {
        src = src.subarray(0, dstBytesAvailable);
    }
    dst.set(src, off);
    return src.byteLength;
}
export { equals } from "./equals.ts";
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjEzMy4wL2J5dGVzL21vZC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIyIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG4vKiogUmV0dXJucyB0aGUgaW5kZXggb2YgdGhlIGZpcnN0IG9jY3VycmVuY2Ugb2YgdGhlIG5lZWRsZSBhcnJheSBpbiB0aGUgc291cmNlXG4gKiBhcnJheSwgb3IgLTEgaWYgaXQgaXMgbm90IHByZXNlbnQuXG4gKlxuICogQSBzdGFydCBpbmRleCBjYW4gYmUgc3BlY2lmaWVkIGFzIHRoZSB0aGlyZCBhcmd1bWVudCB0aGF0IGJlZ2lucyB0aGUgc2VhcmNoXG4gKiBhdCB0aGF0IGdpdmVuIGluZGV4LiBUaGUgc3RhcnQgaW5kZXggZGVmYXVsdHMgdG8gdGhlIHN0YXJ0IG9mIHRoZSBhcnJheS5cbiAqXG4gKiBUaGUgY29tcGxleGl0eSBvZiB0aGlzIGZ1bmN0aW9uIGlzIE8oc291cmNlLmxlbnRoICogbmVlZGxlLmxlbmd0aCkuXG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IGluZGV4T2ZOZWVkbGUgfSBmcm9tIFwiLi9tb2QudHNcIjtcbiAqIGNvbnN0IHNvdXJjZSA9IG5ldyBVaW50OEFycmF5KFswLCAxLCAyLCAxLCAyLCAxLCAyLCAzXSk7XG4gKiBjb25zdCBuZWVkbGUgPSBuZXcgVWludDhBcnJheShbMSwgMl0pO1xuICogY29uc29sZS5sb2coaW5kZXhPZk5lZWRsZShzb3VyY2UsIG5lZWRsZSkpOyAvLyAxXG4gKiBjb25zb2xlLmxvZyhpbmRleE9mTmVlZGxlKHNvdXJjZSwgbmVlZGxlLCAyKSk7IC8vIDNcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5kZXhPZk5lZWRsZShcbiAgc291cmNlOiBVaW50OEFycmF5LFxuICBuZWVkbGU6IFVpbnQ4QXJyYXksXG4gIHN0YXJ0ID0gMCxcbik6IG51bWJlciB7XG4gIGlmIChzdGFydCA+PSBzb3VyY2UubGVuZ3RoKSB7XG4gICAgcmV0dXJuIC0xO1xuICB9XG4gIGlmIChzdGFydCA8IDApIHtcbiAgICBzdGFydCA9IE1hdGgubWF4KDAsIHNvdXJjZS5sZW5ndGggKyBzdGFydCk7XG4gIH1cbiAgY29uc3QgcyA9IG5lZWRsZVswXTtcbiAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgc291cmNlLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKHNvdXJjZVtpXSAhPT0gcykgY29udGludWU7XG4gICAgY29uc3QgcGluID0gaTtcbiAgICBsZXQgbWF0Y2hlZCA9IDE7XG4gICAgbGV0IGogPSBpO1xuICAgIHdoaWxlIChtYXRjaGVkIDwgbmVlZGxlLmxlbmd0aCkge1xuICAgICAgaisrO1xuICAgICAgaWYgKHNvdXJjZVtqXSAhPT0gbmVlZGxlW2ogLSBwaW5dKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgbWF0Y2hlZCsrO1xuICAgIH1cbiAgICBpZiAobWF0Y2hlZCA9PT0gbmVlZGxlLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIHBpbjtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIC0xO1xufVxuXG4vKiogUmV0dXJucyB0aGUgaW5kZXggb2YgdGhlIGxhc3Qgb2NjdXJyZW5jZSBvZiB0aGUgbmVlZGxlIGFycmF5IGluIHRoZSBzb3VyY2VcbiAqIGFycmF5LCBvciAtMSBpZiBpdCBpcyBub3QgcHJlc2VudC5cbiAqXG4gKiBBIHN0YXJ0IGluZGV4IGNhbiBiZSBzcGVjaWZpZWQgYXMgdGhlIHRoaXJkIGFyZ3VtZW50IHRoYXQgYmVnaW5zIHRoZSBzZWFyY2hcbiAqIGF0IHRoYXQgZ2l2ZW4gaW5kZXguIFRoZSBzdGFydCBpbmRleCBkZWZhdWx0cyB0byB0aGUgZW5kIG9mIHRoZSBhcnJheS5cbiAqXG4gKiBUaGUgY29tcGxleGl0eSBvZiB0aGlzIGZ1bmN0aW9uIGlzIE8oc291cmNlLmxlbnRoICogbmVlZGxlLmxlbmd0aCkuXG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IGxhc3RJbmRleE9mTmVlZGxlIH0gZnJvbSBcIi4vbW9kLnRzXCI7XG4gKiBjb25zdCBzb3VyY2UgPSBuZXcgVWludDhBcnJheShbMCwgMSwgMiwgMSwgMiwgMSwgMiwgM10pO1xuICogY29uc3QgbmVlZGxlID0gbmV3IFVpbnQ4QXJyYXkoWzEsIDJdKTtcbiAqIGNvbnNvbGUubG9nKGxhc3RJbmRleE9mTmVlZGxlKHNvdXJjZSwgbmVlZGxlKSk7IC8vIDVcbiAqIGNvbnNvbGUubG9nKGxhc3RJbmRleE9mTmVlZGxlKHNvdXJjZSwgbmVlZGxlLCA0KSk7IC8vIDNcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gbGFzdEluZGV4T2ZOZWVkbGUoXG4gIHNvdXJjZTogVWludDhBcnJheSxcbiAgbmVlZGxlOiBVaW50OEFycmF5LFxuICBzdGFydCA9IHNvdXJjZS5sZW5ndGggLSAxLFxuKTogbnVtYmVyIHtcbiAgaWYgKHN0YXJ0IDwgMCkge1xuICAgIHJldHVybiAtMTtcbiAgfVxuICBpZiAoc3RhcnQgPj0gc291cmNlLmxlbmd0aCkge1xuICAgIHN0YXJ0ID0gc291cmNlLmxlbmd0aCAtIDE7XG4gIH1cbiAgY29uc3QgZSA9IG5lZWRsZVtuZWVkbGUubGVuZ3RoIC0gMV07XG4gIGZvciAobGV0IGkgPSBzdGFydDsgaSA+PSAwOyBpLS0pIHtcbiAgICBpZiAoc291cmNlW2ldICE9PSBlKSBjb250aW51ZTtcbiAgICBjb25zdCBwaW4gPSBpO1xuICAgIGxldCBtYXRjaGVkID0gMTtcbiAgICBsZXQgaiA9IGk7XG4gICAgd2hpbGUgKG1hdGNoZWQgPCBuZWVkbGUubGVuZ3RoKSB7XG4gICAgICBqLS07XG4gICAgICBpZiAoc291cmNlW2pdICE9PSBuZWVkbGVbbmVlZGxlLmxlbmd0aCAtIDEgLSAocGluIC0gaildKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgbWF0Y2hlZCsrO1xuICAgIH1cbiAgICBpZiAobWF0Y2hlZCA9PT0gbmVlZGxlLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIHBpbiAtIG5lZWRsZS5sZW5ndGggKyAxO1xuICAgIH1cbiAgfVxuICByZXR1cm4gLTE7XG59XG5cbi8qKiBSZXR1cm5zIHRydWUgaWYgdGhlIHByZWZpeCBhcnJheSBhcHBlYXJzIGF0IHRoZSBzdGFydCBvZiB0aGUgc291cmNlIGFycmF5LFxuICogZmFsc2Ugb3RoZXJ3aXNlLlxuICpcbiAqIFRoZSBjb21wbGV4aXR5IG9mIHRoaXMgZnVuY3Rpb24gaXMgTyhwcmVmaXgubGVuZ3RoKS5cbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgc3RhcnRzV2l0aCB9IGZyb20gXCIuL21vZC50c1wiO1xuICogY29uc3Qgc291cmNlID0gbmV3IFVpbnQ4QXJyYXkoWzAsIDEsIDIsIDEsIDIsIDEsIDIsIDNdKTtcbiAqIGNvbnN0IHByZWZpeCA9IG5ldyBVaW50OEFycmF5KFswLCAxLCAyXSk7XG4gKiBjb25zb2xlLmxvZyhzdGFydHNXaXRoKHNvdXJjZSwgcHJlZml4KSk7IC8vIHRydWVcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gc3RhcnRzV2l0aChzb3VyY2U6IFVpbnQ4QXJyYXksIHByZWZpeDogVWludDhBcnJheSk6IGJvb2xlYW4ge1xuICBmb3IgKGxldCBpID0gMCwgbWF4ID0gcHJlZml4Lmxlbmd0aDsgaSA8IG1heDsgaSsrKSB7XG4gICAgaWYgKHNvdXJjZVtpXSAhPT0gcHJlZml4W2ldKSByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbi8qKiBSZXR1cm5zIHRydWUgaWYgdGhlIHN1ZmZpeCBhcnJheSBhcHBlYXJzIGF0IHRoZSBlbmQgb2YgdGhlIHNvdXJjZSBhcnJheSxcbiAqIGZhbHNlIG90aGVyd2lzZS5cbiAqXG4gKiBUaGUgY29tcGxleGl0eSBvZiB0aGlzIGZ1bmN0aW9uIGlzIE8oc3VmZml4Lmxlbmd0aCkuXG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IGVuZHNXaXRoIH0gZnJvbSBcIi4vbW9kLnRzXCI7XG4gKiBjb25zdCBzb3VyY2UgPSBuZXcgVWludDhBcnJheShbMCwgMSwgMiwgMSwgMiwgMSwgMiwgM10pO1xuICogY29uc3Qgc3VmZml4ID0gbmV3IFVpbnQ4QXJyYXkoWzEsIDIsIDNdKTtcbiAqIGNvbnNvbGUubG9nKGVuZHNXaXRoKHNvdXJjZSwgc3VmZml4KSk7IC8vIHRydWVcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gZW5kc1dpdGgoc291cmNlOiBVaW50OEFycmF5LCBzdWZmaXg6IFVpbnQ4QXJyYXkpOiBib29sZWFuIHtcbiAgZm9yIChcbiAgICBsZXQgc3JjaSA9IHNvdXJjZS5sZW5ndGggLSAxLCBzZnhpID0gc3VmZml4Lmxlbmd0aCAtIDE7XG4gICAgc2Z4aSA+PSAwO1xuICAgIHNyY2ktLSwgc2Z4aS0tXG4gICkge1xuICAgIGlmIChzb3VyY2Vbc3JjaV0gIT09IHN1ZmZpeFtzZnhpXSkgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG4vKiogUmV0dXJucyBhIG5ldyBVaW50OEFycmF5IGNvbXBvc2VkIG9mIGBjb3VudGAgcmVwZXRpdGlvbnMgb2YgdGhlIGBzb3VyY2VgXG4gKiBhcnJheS5cbiAqXG4gKiBJZiBgY291bnRgIGlzIG5lZ2F0aXZlLCBhIGBSYW5nZUVycm9yYCBpcyB0aHJvd24uXG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IHJlcGVhdCB9IGZyb20gXCIuL21vZC50c1wiO1xuICogY29uc3Qgc291cmNlID0gbmV3IFVpbnQ4QXJyYXkoWzAsIDEsIDJdKTtcbiAqIGNvbnNvbGUubG9nKHJlcGVhdChzb3VyY2UsIDMpKTsgLy8gWzAsIDEsIDIsIDAsIDEsIDIsIDAsIDEsIDJdXG4gKiBjb25zb2xlLmxvZyhyZXBlYXQoc291cmNlLCAwKSk7IC8vIFtdXG4gKiBjb25zb2xlLmxvZyhyZXBlYXQoc291cmNlLCAtMSkpOyAvLyBSYW5nZUVycm9yXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlcGVhdChzb3VyY2U6IFVpbnQ4QXJyYXksIGNvdW50OiBudW1iZXIpOiBVaW50OEFycmF5IHtcbiAgaWYgKGNvdW50ID09PSAwKSB7XG4gICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KCk7XG4gIH1cblxuICBpZiAoY291bnQgPCAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJieXRlczogbmVnYXRpdmUgcmVwZWF0IGNvdW50XCIpO1xuICB9IGVsc2UgaWYgKChzb3VyY2UubGVuZ3RoICogY291bnQpIC8gY291bnQgIT09IHNvdXJjZS5sZW5ndGgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJieXRlczogcmVwZWF0IGNvdW50IGNhdXNlcyBvdmVyZmxvd1wiKTtcbiAgfVxuXG4gIGNvbnN0IGludCA9IE1hdGguZmxvb3IoY291bnQpO1xuXG4gIGlmIChpbnQgIT09IGNvdW50KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiYnl0ZXM6IHJlcGVhdCBjb3VudCBtdXN0IGJlIGFuIGludGVnZXJcIik7XG4gIH1cblxuICBjb25zdCBuYiA9IG5ldyBVaW50OEFycmF5KHNvdXJjZS5sZW5ndGggKiBjb3VudCk7XG5cbiAgbGV0IGJwID0gY29weShzb3VyY2UsIG5iKTtcblxuICBmb3IgKDsgYnAgPCBuYi5sZW5ndGg7IGJwICo9IDIpIHtcbiAgICBjb3B5KG5iLnNsaWNlKDAsIGJwKSwgbmIsIGJwKTtcbiAgfVxuXG4gIHJldHVybiBuYjtcbn1cblxuLyoqIENvbmNhdGVuYXRlIHRoZSBnaXZlbiBhcnJheXMgaW50byBhIG5ldyBVaW50OEFycmF5LlxuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBjb25jYXQgfSBmcm9tIFwiLi9tb2QudHNcIjtcbiAqIGNvbnN0IGEgPSBuZXcgVWludDhBcnJheShbMCwgMSwgMl0pO1xuICogY29uc3QgYiA9IG5ldyBVaW50OEFycmF5KFszLCA0LCA1XSk7XG4gKiBjb25zb2xlLmxvZyhjb25jYXQoYSwgYikpOyAvLyBbMCwgMSwgMiwgMywgNCwgNV1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbmNhdCguLi5idWY6IFVpbnQ4QXJyYXlbXSk6IFVpbnQ4QXJyYXkge1xuICBsZXQgbGVuZ3RoID0gMDtcbiAgZm9yIChjb25zdCBiIG9mIGJ1Zikge1xuICAgIGxlbmd0aCArPSBiLmxlbmd0aDtcbiAgfVxuXG4gIGNvbnN0IG91dHB1dCA9IG5ldyBVaW50OEFycmF5KGxlbmd0aCk7XG4gIGxldCBpbmRleCA9IDA7XG4gIGZvciAoY29uc3QgYiBvZiBidWYpIHtcbiAgICBvdXRwdXQuc2V0KGIsIGluZGV4KTtcbiAgICBpbmRleCArPSBiLmxlbmd0aDtcbiAgfVxuXG4gIHJldHVybiBvdXRwdXQ7XG59XG5cbi8qKiBSZXR1cm5zIHRydWUgaWYgdGhlIHNvdXJjZSBhcnJheSBjb250YWlucyB0aGUgbmVlZGxlIGFycmF5LCBmYWxzZSBvdGhlcndpc2UuXG4gKlxuICogQSBzdGFydCBpbmRleCBjYW4gYmUgc3BlY2lmaWVkIGFzIHRoZSB0aGlyZCBhcmd1bWVudCB0aGF0IGJlZ2lucyB0aGUgc2VhcmNoXG4gKiBhdCB0aGF0IGdpdmVuIGluZGV4LiBUaGUgc3RhcnQgaW5kZXggZGVmYXVsdHMgdG8gdGhlIGJlZ2lubmluZyBvZiB0aGUgYXJyYXkuXG4gKlxuICogVGhlIGNvbXBsZXhpdHkgb2YgdGhpcyBmdW5jdGlvbiBpcyBPKHNvdXJjZS5sZW5ndGggKiBuZWVkbGUubGVuZ3RoKS5cbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgaW5jbHVkZXNOZWVkbGUgfSBmcm9tIFwiLi9tb2QudHNcIjtcbiAqIGNvbnN0IHNvdXJjZSA9IG5ldyBVaW50OEFycmF5KFswLCAxLCAyLCAxLCAyLCAxLCAyLCAzXSk7XG4gKiBjb25zdCBuZWVkbGUgPSBuZXcgVWludDhBcnJheShbMSwgMl0pO1xuICogY29uc29sZS5sb2coaW5jbHVkZXNOZWVkbGUoc291cmNlLCBuZWVkbGUpKTsgLy8gdHJ1ZVxuICogY29uc29sZS5sb2coaW5jbHVkZXNOZWVkbGUoc291cmNlLCBuZWVkbGUsIDYpKTsgLy8gZmFsc2VcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5jbHVkZXNOZWVkbGUoXG4gIHNvdXJjZTogVWludDhBcnJheSxcbiAgbmVlZGxlOiBVaW50OEFycmF5LFxuICBzdGFydCA9IDAsXG4pOiBib29sZWFuIHtcbiAgcmV0dXJuIGluZGV4T2ZOZWVkbGUoc291cmNlLCBuZWVkbGUsIHN0YXJ0KSAhPT0gLTE7XG59XG5cbi8qKiBDb3B5IGJ5dGVzIGZyb20gdGhlIGBzcmNgIGFycmF5IHRvIHRoZSBgZHN0YCBhcnJheS4gUmV0dXJucyB0aGUgbnVtYmVyIG9mXG4gKiBieXRlcyBjb3BpZWQuXG4gKlxuICogSWYgdGhlIGBzcmNgIGFycmF5IGlzIGxhcmdlciB0aGFuIHdoYXQgdGhlIGBkc3RgIGFycmF5IGNhbiBob2xkLCBvbmx5IHRoZVxuICogYW1vdW50IG9mIGJ5dGVzIHRoYXQgZml0IGluIHRoZSBgZHN0YCBhcnJheSBhcmUgY29waWVkLlxuICpcbiAqIEFuIG9mZnNldCBjYW4gYmUgc3BlY2lmaWVkIGFzIHRoZSB0aGlyZCBhcmd1bWVudCB0aGF0IGJlZ2lucyB0aGUgY29weSBhdFxuICogdGhhdCBnaXZlbiBpbmRleCBpbiB0aGUgYGRzdGAgYXJyYXkuIFRoZSBvZmZzZXQgZGVmYXVsdHMgdG8gdGhlIGJlZ2lubmluZyBvZlxuICogdGhlIGFycmF5LlxuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBjb3B5IH0gZnJvbSBcIi4vbW9kLnRzXCI7XG4gKiBjb25zdCBzcmMgPSBuZXcgVWludDhBcnJheShbOSwgOCwgN10pO1xuICogY29uc3QgZHN0ID0gbmV3IFVpbnQ4QXJyYXkoWzAsIDEsIDIsIDMsIDQsIDVdKTtcbiAqIGNvbnNvbGUubG9nKGNvcHkoc3JjLCBkc3QpKTsgLy8gM1xuICogY29uc29sZS5sb2coZHN0KTsgLy8gWzksIDgsIDcsIDMsIDQsIDVdXG4gKiBgYGBcbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgY29weSB9IGZyb20gXCIuL21vZC50c1wiO1xuICogY29uc3Qgc3JjID0gbmV3IFVpbnQ4QXJyYXkoWzEsIDEsIDEsIDFdKTtcbiAqIGNvbnN0IGRzdCA9IG5ldyBVaW50OEFycmF5KFswLCAwLCAwLCAwXSk7XG4gKiBjb25zb2xlLmxvZyhjb3B5KHNyYywgZHN0LCAxKSk7IC8vIDNcbiAqIGNvbnNvbGUubG9nKGRzdCk7IC8vIFswLCAxLCAxLCAxXVxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb3B5KHNyYzogVWludDhBcnJheSwgZHN0OiBVaW50OEFycmF5LCBvZmYgPSAwKTogbnVtYmVyIHtcbiAgb2ZmID0gTWF0aC5tYXgoMCwgTWF0aC5taW4ob2ZmLCBkc3QuYnl0ZUxlbmd0aCkpO1xuICBjb25zdCBkc3RCeXRlc0F2YWlsYWJsZSA9IGRzdC5ieXRlTGVuZ3RoIC0gb2ZmO1xuICBpZiAoc3JjLmJ5dGVMZW5ndGggPiBkc3RCeXRlc0F2YWlsYWJsZSkge1xuICAgIHNyYyA9IHNyYy5zdWJhcnJheSgwLCBkc3RCeXRlc0F2YWlsYWJsZSk7XG4gIH1cbiAgZHN0LnNldChzcmMsIG9mZik7XG4gIHJldHVybiBzcmMuYnl0ZUxlbmd0aDtcbn1cblxuZXhwb3J0IHsgZXF1YWxzIH0gZnJvbSBcIi4vZXF1YWxzLnRzXCI7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUVyQzs7Ozs7Ozs7Ozs7Ozs7O0NBZUMsR0FDRCxPQUFPLFNBQVMsY0FDZCxNQUFrQixFQUNsQixNQUFrQixFQUNsQixRQUFRLENBQUM7SUFFVCxJQUFJLFNBQVMsT0FBTyxRQUFRO1FBQzFCLE9BQU8sQ0FBQztJQUNWO0lBQ0EsSUFBSSxRQUFRLEdBQUc7UUFDYixRQUFRLEtBQUssSUFBSSxHQUFHLE9BQU8sU0FBUztJQUN0QztJQUNBLE1BQU0sSUFBSSxNQUFNLENBQUMsRUFBRTtJQUNuQixJQUFLLElBQUksSUFBSSxPQUFPLElBQUksT0FBTyxRQUFRLElBQUs7UUFDMUMsSUFB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