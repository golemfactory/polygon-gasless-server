// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
/** Provides functions for dealing with and matching ETags, including
 * {@linkcode calculate} to calculate an etag for a given entity,
 * {@linkcode ifMatch} for validating if an ETag matches against a `If-Match`
 * header and {@linkcode ifNoneMatch} for validating an Etag against an
 * `If-None-Match` header.
 *
 * See further information on the `ETag` header on
 * [MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag).
 *
 * @module
 */ import { encode as base64Encode } from "../encoding/base64.ts";
const encoder = new TextEncoder();
const DEFAULT_ALGORITHM = "SHA-256";
function isFileInfo(value) {
    return Boolean(value && typeof value === "object" && "mtime" in value && "size" in value);
}
async function calcEntity(entity, { algorithm =DEFAULT_ALGORITHM  }) {
    // a short circuit for zero length entities
    if (entity.length === 0) {
        return `0-47DEQpj8HBSa+/TImW+5JCeuQeR`;
    }
    if (typeof entity === "string") {
        entity = encoder.encode(entity);
    }
    const hash = base64Encode(await crypto.subtle.digest(algorithm, entity)).substring(0, 27);
    return `${entity.length.toString(16)}-${hash}`;
}
async function calcFileInfo(fileInfo, { algorithm =DEFAULT_ALGORITHM  }) {
    if (fileInfo.mtime) {
        const hash = base64Encode(await crypto.subtle.digest(algorithm, encoder.encode(fileInfo.mtime.toJSON()))).substring(0, 27);
        return `${fileInfo.size.toString(16)}-${hash}`;
    }
}
/** Calculate an ETag for an entity. When the entity is a specific set of data
 * it will be fingerprinted as a "strong" tag, otherwise if it is just file
 * information, it will be calculated as a weak tag.
 *
 * ```ts
 * import { calculate } from "https://deno.land/std@$STD_VERSION/http/etag.ts";
 * import { assert } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts"
 *
 * const body = "hello deno!";
 *
 * const etag = await calculate(body);
 * assert(etag);
 *
 * const res = new Response(body, { headers: { etag } });
 * ```
 */ export async function calculate(entity, options = {}) {
    const weak = options.weak ?? isFileInfo(entity);
    const tag = await (isFileInfo(entity) ? calcFileInfo(entity, options) : calcEntity(entity, options));
    return tag ? weak ? `W/"${tag}"` : `"${tag}"` : undefined;
}
/** A helper function that takes the value from the `If-Match` header and a
 * calculated etag for the target. By using strong comparison, return `true` if
 * the values match, otherwise `false`.
 *
 * See MDN's [`If-Match`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-Match)
 * article for more information on how to use this function.
 *
 * ```ts
 * import {
 *   calculate,
 *   ifMatch,
 * } from "https://deno.land/std@$STD_VERSION/http/etag.ts";
 * import { serve } from "https://deno.land/std@$STD_VERSION/http/server.ts";
 * import { assert } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts"
 *
 * const body = "hello deno!";
 *
 * await serve(async (req) => {
 *   const ifMatchValue = req.headers.get("if-match");
 *   const etag = await calculate(body);
 *   assert(etag);
 *   if (!ifMatchValue || ifMatch(ifMatchValue, etag)) {
 *     return new Response(body, { status: 200, headers: { etag } });
 *   } else {
 *     return new Response(null, { status: 412, statusText: "Precondition Failed"});
 *   }
 * });
 * ```
 */ export function ifMatch(value, etag) {
    // Weak tags cannot be matched and return false.
    if (!value || !etag || etag.startsWith("W/")) {
        return false;
    }
    if (value.trim() === "*") {
        return true;
    }
    const tags = value.split(/\s*,\s*/);
    return tags.includes(etag);
}
/** A helper function that takes the value from the `If-None-Match` header and
 * a calculated etag for the target entity and returns `false` if the etag for
 * the entity matches the supplied value, otherwise `true`.
 *
 * See MDN's [`If-None-Match`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-None-Match)
 * article for more information on how to use this function.
 *
 * ```ts
 * import {
 *   calculate,
 *   ifNoneMatch,
 * } from "https://deno.land/std@$STD_VERSION/http/etag.ts";
 * import { serve } from "https://deno.land/std@$STD_VERSION/http/server.ts";
 * import { assert } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts"
 *
 * const body = "hello deno!";
 *
 * await serve(async (req) => {
 *   const ifNoneMatchValue = req.headers.get("if-none-match");
 *   const etag = await calculate(body);
 *   assert(etag);
 *   if (!ifNoneMatch(ifNoneMatchValue, etag)) {
 *     return new Response(null, { status: 304, headers: { etag } });
 *   } else {
 *     return new Response(body, { status: 200, headers: { etag } });
 *   }
 * });
 * ```
 */ export function ifNoneMatch(value, etag) {
    if (!value || !etag) {
        return true;
    }
    if (value.trim() === "*") {
        return false;
    }
    etag = etag.startsWith("W/") ? etag.slice(2) : etag;
    const tags = value.split(/\s*,\s*/).map((tag)=>tag.startsWith("W/") ? tag.slice(2) : tag);
    return !tags.includes(etag);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5My4wL2h0dHAvZXRhZy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIzIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuXG4vKiogUHJvdmlkZXMgZnVuY3Rpb25zIGZvciBkZWFsaW5nIHdpdGggYW5kIG1hdGNoaW5nIEVUYWdzLCBpbmNsdWRpbmdcbiAqIHtAbGlua2NvZGUgY2FsY3VsYXRlfSB0byBjYWxjdWxhdGUgYW4gZXRhZyBmb3IgYSBnaXZlbiBlbnRpdHksXG4gKiB7QGxpbmtjb2RlIGlmTWF0Y2h9IGZvciB2YWxpZGF0aW5nIGlmIGFuIEVUYWcgbWF0Y2hlcyBhZ2FpbnN0IGEgYElmLU1hdGNoYFxuICogaGVhZGVyIGFuZCB7QGxpbmtjb2RlIGlmTm9uZU1hdGNofSBmb3IgdmFsaWRhdGluZyBhbiBFdGFnIGFnYWluc3QgYW5cbiAqIGBJZi1Ob25lLU1hdGNoYCBoZWFkZXIuXG4gKlxuICogU2VlIGZ1cnRoZXIgaW5mb3JtYXRpb24gb24gdGhlIGBFVGFnYCBoZWFkZXIgb25cbiAqIFtNRE5dKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9FVGFnKS5cbiAqXG4gKiBAbW9kdWxlXG4gKi9cblxuaW1wb3J0IHsgZW5jb2RlIGFzIGJhc2U2NEVuY29kZSB9IGZyb20gXCIuLi9lbmNvZGluZy9iYXNlNjQudHNcIjtcblxuLyoqIEp1c3QgdGhlIHBhcnQgb2YgYERlbm8uRmlsZUluZm9gIHRoYXQgaXMgcmVxdWlyZWQgdG8gY2FsY3VsYXRlIGFuIGBFVGFnYCxcbiAqIHNvIHBhcnRpYWwgb3IgdXNlciBnZW5lcmF0ZWQgZmlsZSBpbmZvcm1hdGlvbiBjYW4gYmUgcGFzc2VkLiAqL1xuZXhwb3J0IGludGVyZmFjZSBGaWxlSW5mbyB7XG4gIG10aW1lOiBEYXRlIHwgbnVsbDtcbiAgc2l6ZTogbnVtYmVyO1xufVxuXG50eXBlIEVudGl0eSA9IHN0cmluZyB8IFVpbnQ4QXJyYXkgfCBGaWxlSW5mbztcblxuY29uc3QgZW5jb2RlciA9IG5ldyBUZXh0RW5jb2RlcigpO1xuXG5jb25zdCBERUZBVUxUX0FMR09SSVRITTogQWxnb3JpdGhtSWRlbnRpZmllciA9IFwiU0hBLTI1NlwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIEVUYWdPcHRpb25zIHtcbiAgLyoqIEEgZGlnZXN0IGFsZ29yaXRobSB0byB1c2UgdG8gY2FsY3VsYXRlIHRoZSBldGFnLiBEZWZhdWx0cyB0b1xuICAgKiBgXCJGTlYzMkFcImAuICovXG4gIGFsZ29yaXRobT86IEFsZ29yaXRobUlkZW50aWZpZXI7XG5cbiAgLyoqIE92ZXJyaWRlIHRoZSBkZWZhdWx0IGJlaGF2aW9yIG9mIGNhbGN1bGF0aW5nIHRoZSBgRVRhZ2AsIGVpdGhlciBmb3JjaW5nXG4gICAqIGEgdGFnIHRvIGJlIGxhYmVsbGVkIHdlYWsgb3Igbm90LiAqL1xuICB3ZWFrPzogYm9vbGVhbjtcbn1cblxuZnVuY3Rpb24gaXNGaWxlSW5mbyh2YWx1ZTogdW5rbm93bik6IHZhbHVlIGlzIEZpbGVJbmZvIHtcbiAgcmV0dXJuIEJvb2xlYW4oXG4gICAgdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmIFwibXRpbWVcIiBpbiB2YWx1ZSAmJiBcInNpemVcIiBpbiB2YWx1ZSxcbiAgKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gY2FsY0VudGl0eShcbiAgZW50aXR5OiBzdHJpbmcgfCBVaW50OEFycmF5LFxuICB7IGFsZ29yaXRobSA9IERFRkFVTFRfQUxHT1JJVEhNIH06IEVUYWdPcHRpb25zLFxuKSB7XG4gIC8vIGEgc2hvcnQgY2lyY3VpdCBmb3IgemVybyBsZW5ndGggZW50aXRpZXNcbiAgaWYgKGVudGl0eS5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gYDAtNDdERVFwajhIQlNhKy9USW1XKzVKQ2V1UWVSYDtcbiAgfVxuXG4gIGlmICh0eXBlb2YgZW50aXR5ID09PSBcInN0cmluZ1wiKSB7XG4gICAgZW50aXR5ID0gZW5jb2Rlci5lbmNvZGUoZW50aXR5KTtcbiAgfVxuXG4gIGNvbnN0IGhhc2ggPSBiYXNlNjRFbmNvZGUoYXdhaXQgY3J5cHRvLnN1YnRsZS5kaWdlc3QoYWxnb3JpdGhtLCBlbnRpdHkpKVxuICAgIC5zdWJzdHJpbmcoMCwgMjcpO1xuXG4gIHJldHVybiBgJHtlbnRpdHkubGVuZ3RoLnRvU3RyaW5nKDE2KX0tJHtoYXNofWA7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNhbGNGaWxlSW5mbyhcbiAgZmlsZUluZm86IEZpbGVJbmZvLFxuICB7IGFsZ29yaXRobSA9IERFRkFVTFRfQUxHT1JJVEhNIH06IEVUYWdPcHRpb25zLFxuKSB7XG4gIGlmIChmaWxlSW5mby5tdGltZSkge1xuICAgIGNvbnN0IGhhc2ggPSBiYXNlNjRFbmNvZGUoXG4gICAgICBhd2FpdCBjcnlwdG8uc3VidGxlLmRpZ2VzdChcbiAgICAgICAgYWxnb3JpdGhtLFxuICAgICAgICBlbmNvZGVyLmVuY29kZShmaWxlSW5mby5tdGltZS50b0pTT04oKSksXG4gICAgICApLFxuICAgICkuc3Vic3RyaW5nKDAsIDI3KTtcbiAgICByZXR1cm4gYCR7ZmlsZUluZm8uc2l6ZS50b1N0cmluZygxNil9LSR7aGFzaH1gO1xuICB9XG59XG5cbi8qKiBDYWxjdWxhdGUgYW4gRVRhZyBmb3IgYW4gZW50aXR5LiBXaGVuIHRoZSBlbnRpdHkgaXMgYSBzcGVjaWZpYyBzZXQgb2YgZGF0YVxuICogaXQgd2lsbCBiZSBmaW5nZXJwcmludGVkIGFzIGEgXCJzdHJvbmdcIiB0YWcsIG90aGVyd2lzZSBpZiBpdCBpcyBqdXN0IGZpbGVcbiAqIGluZm9ybWF0aW9uLCBpdCB3aWxsIGJlIGNhbGN1bGF0ZWQgYXMgYSB3ZWFrIHRhZy5cbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgY2FsY3VsYXRlIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vaHR0cC9ldGFnLnRzXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnQgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi90ZXN0aW5nL2Fzc2VydHMudHNcIlxuICpcbiAqIGNvbnN0IGJvZHkgPSBcImhlbGxvIGRlbm8hXCI7XG4gKlxuICogY29uc3QgZXRhZyA9IGF3YWl0IGNhbGN1bGF0ZShib2R5KTtcbiAqIGFzc2VydChldGFnKTtcbiAqXG4gKiBjb25zdCByZXMgPSBuZXcgUmVzcG9uc2UoYm9keSwgeyBoZWFkZXJzOiB7IGV0YWcgfSB9KTtcbiAqIGBgYFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2FsY3VsYXRlKFxuICBlbnRpdHk6IEVudGl0eSxcbiAgb3B0aW9uczogRVRhZ09wdGlvbnMgPSB7fSxcbik6IFByb21pc2U8c3RyaW5nIHwgdW5kZWZpbmVkPiB7XG4gIGNvbnN0IHdlYWsgPSBvcHRpb25zLndlYWsgPz8gaXNGaWxlSW5mbyhlbnRpdHkpO1xuICBjb25zdCB0YWcgPVxuICAgIGF3YWl0IChpc0ZpbGVJbmZvKGVudGl0eSlcbiAgICAgID8gY2FsY0ZpbGVJbmZvKGVudGl0eSwgb3B0aW9ucylcbiAgICAgIDogY2FsY0VudGl0eShlbnRpdHksIG9wdGlvbnMpKTtcblxuICByZXR1cm4gdGFnID8gd2VhayA/IGBXL1wiJHt0YWd9XCJgIDogYFwiJHt0YWd9XCJgIDogdW5kZWZpbmVkO1xufVxuXG4vKiogQSBoZWxwZXIgZnVuY3Rpb24gdGhhdCB0YWtlcyB0aGUgdmFsdWUgZnJvbSB0aGUgYElmLU1hdGNoYCBoZWFkZXIgYW5kIGFcbiAqIGNhbGN1bGF0ZWQgZXRhZyBmb3IgdGhlIHRhcmdldC4gQnkgdXNpbmcgc3Ryb25nIGNvbXBhcmlzb24sIHJldHVybiBgdHJ1ZWAgaWZcbiAqIHRoZSB2YWx1ZXMgbWF0Y2gsIG90aGVyd2lzZSBgZmFsc2VgLlxuICpcbiAqIFNlZSBNRE4ncyBbYElmLU1hdGNoYF0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRUUC9IZWFkZXJzL0lmLU1hdGNoKVxuICogYXJ0aWNsZSBmb3IgbW9yZSBpbmZvcm1hdGlvbiBvbiBob3cgdG8gdXNlIHRoaXMgZnVuY3Rpb24uXG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7XG4gKiAgIGNhbGN1bGF0ZSxcbiAqICAgaWZNYXRjaCxcbiAqIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vaHR0cC9ldGFnLnRzXCI7XG4gKiBpbXBvcnQgeyBzZXJ2ZSB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2h0dHAvc2VydmVyLnRzXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnQgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi90ZXN0aW5nL2Fzc2VydHMudHNcIlxuICpcbiAqIGNvbnN0IGJvZHkgPSBcImhlbGxvIGRlbm8hXCI7XG4gKlxuICogYXdhaXQgc2VydmUoYXN5bmMgKHJlcSkgPT4ge1xuICogICBjb25zdCBpZk1hdGNoVmFsdWUgPSByZXEuaGVhZGVycy5nZXQoXCJpZi1tYXRjaFwiKTtcbiAqICAgY29uc3QgZXRhZyA9IGF3YWl0IGNhbGN1bGF0ZShib2R5KTtcbiAqICAgYXNzZXJ0KGV0YWcpO1xuICogICBpZiAoIWlmTWF0Y2hWYWx1ZSB8fCBpZk1hdGNoKGlmTWF0Y2hWYWx1ZSwgZXRhZykpIHtcbiAqICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKGJvZHksIHsgc3RhdHVzOiAyMDAsIGhlYWRlcnM6IHsgZXRhZyB9IH0pO1xuICogICB9IGVsc2Uge1xuICogICAgIHJldHVybiBuZXcgUmVzcG9uc2UobnVsbCwgeyBzdGF0dXM6IDQxMiwgc3RhdHVzVGV4dDogXCJQcmVjb25kaXRpb24gRmFpbGVkXCJ9KTtcbiAqICAgfVxuICogfSk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlmTWF0Y2goXG4gIHZhbHVlOiBzdHJpbmcgfCBudWxsLFxuICBldGFnOiBzdHJpbmcgfCB1bmRlZmluZWQsXG4pOiBib29sZWFuIHtcbiAgLy8gV2VhayB0YWdzIGNhbm5vdCBiZSBtYXRjaGVkIGFuZCByZXR1cm4gZmFsc2UuXG4gIGlmICghdmFsdWUgfHwgIWV0YWcgfHwgZXRhZy5zdGFydHNXaXRoKFwiVy9cIikpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKHZhbHVlLnRyaW0oKSA9PT0gXCIqXCIpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBjb25zdCB0YWdzID0gdmFsdWUuc3BsaXQoL1xccyosXFxzKi8pO1xuICByZXR1cm4gdGFncy5pbmNsdWRlcyhldGFnKTtcbn1cblxuLyoqIEEgaGVscGVyIGZ1bmN0aW9uIHRoYXQgdGFrZXMgdGhlIHZhbHVlIGZyb20gdGhlIGBJZi1Ob25lLU1hdGNoYCBoZWFkZXIgYW5kXG4gKiBhIGNhbGN1bGF0ZWQgZXRhZyBmb3IgdGhlIHRhcmdldCBlbnRpdHkgYW5kIHJldHVybnMgYGZhbHNlYCBpZiB0aGUgZXRhZyBmb3JcbiAqIHRoZSBlbnRpdHkgbWF0Y2hlcyB0aGUgc3VwcGxpZWQgdmFsdWUsIG90aGVyd2lzZSBgdHJ1ZWAuXG4gKlxuICogU2VlIE1ETidzIFtgSWYtTm9uZS1NYXRjaGBdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9JZi1Ob25lLU1hdGNoKVxuICogYXJ0aWNsZSBmb3IgbW9yZSBpbmZvcm1hdGlvbiBvbiBob3cgdG8gdXNlIHRoaXMgZnVuY3Rpb24uXG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7XG4gKiAgIGNhbGN1bGF0ZSxcbiAqICAgaWZOb25lTWF0Y2gsXG4gKiB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2h0dHAvZXRhZy50c1wiO1xuICogaW1wb3J0IHsgc2VydmUgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9odHRwL3NlcnZlci50c1wiO1xuICogaW1wb3J0IHsgYXNzZXJ0IH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vdGVzdGluZy9hc3NlcnRzLnRzXCJcbiAqXG4gKiBjb25zdCBib2R5ID0gXCJoZWxsbyBkZW5vIVwiO1xuICpcbiAqIGF3YWl0IHNlcnZlKGFzeW5jIChyZXEpID0+IHtcbiAqICAgY29uc3QgaWZOb25lTWF0Y2hWYWx1ZSA9IHJlcS5oZWFkZXJzLmdldChcImlmLW5vbmUtbWF0Y2hcIik7XG4gKiAgIGNvbnN0IGV0YWcgPSBhd2FpdCBjYWxjdWxhdGUoYm9keSk7XG4gKiAgIGFzc2VydChldGFnKTtcbiAqICAgaWYgKCFpZk5vbmVNYXRjaChpZk5vbmVNYXRjaFZhbHVlLCBldGFnKSkge1xuICogICAgIHJldHVybiBuZXcgUmVzcG9uc2UobnVsbCwgeyBzdGF0dXM6IDMwNCwgaGVhZGVyczogeyBldGFnIH0gfSk7XG4gKiAgIH0gZWxzZSB7XG4gKiAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShib2R5LCB7IHN0YXR1czogMjAwLCBoZWFkZXJzOiB7IGV0YWcgfSB9KTtcbiAqICAgfVxuICogfSk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlmTm9uZU1hdGNoKFxuICB2YWx1ZTogc3RyaW5nIHwgbnVsbCxcbiAgZXRhZzogc3RyaW5nIHwgdW5kZWZpbmVkLFxuKTogYm9vbGVhbiB7XG4gIGlmICghdmFsdWUgfHwgIWV0YWcpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBpZiAodmFsdWUudHJpbSgpID09PSBcIipcIikge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBldGFnID0gZXRhZy5zdGFydHNXaXRoKFwiVy9cIikgPyBldGFnLnNsaWNlKDIpIDogZXRhZztcbiAgY29uc3QgdGFncyA9IHZhbHVlLnNwbGl0KC9cXHMqLFxccyovKS5tYXAoKHRhZykgPT5cbiAgICB0YWcuc3RhcnRzV2l0aChcIlcvXCIpID8gdGFnLnNsaWNlKDIpIDogdGFnXG4gICk7XG4gIHJldHVybiAhdGFncy5pbmNsdWRlcyhldGFnKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFFMUU7Ozs7Ozs7Ozs7Q0FVQyxHQUVELFNBQVMsVUFBVSxZQUFZLFFBQVEsd0JBQXdCO0FBVy9ELE1BQU0sVUFBVSxJQUFJO0FBRXBCLE1BQU0sb0JBQXlDO0FBWS9DLFNBQVMsV0FBVyxLQUFjO0lBQ2hDLE9BQU8sUUFDTCxTQUFTLE9BQU8sVUFBVSxZQUFZLFdBQVcsU0FBUyxVQUFVO0FBRXhFO0FBRUEsZUFBZSxXQUNiLE1BQTJCLEVBQzNCLEVBQUUsV0FBWSxrQkFBaUIsRUFBZTtJQUU5QywyQ0FBMkM7SUFDM0MsSUFBSSxPQUFPLFdBQVcsR0FBRztRQUN2QixPQUFPLENBQUMsNkJBQTZCLENBQUM7SUFDeEM7SUFFQSxJQUFJLE9BQU8sV0FBVyxVQUFVO1FBQzlCLFNBQVMsUUFBUSxPQUFPO0lBQzFCO0lBRUEsTUFBTSxPQUFPLGFBQWEsTUFBTSxPQUFPLE9BQU8sT0FBTyxXQUFXLFNBQzdELFVBQVUsR0FBRztJQUVoQixPQUFPLENBQUMsRUFBRSxPQUFPLE9BQU8sU0FBUyxJQUFJLENBQUMsRUFBRSxLQUFLLENBQUM7QUFDaEQ7QUFFQSxlQUFlLGFBQ2IsUUFBa0IsRUFDbEIsRUFBRSxXQUFZLGtCQUFpQixFQUFlO0lBRTlDLElBQUksU0FBUyxPQUFPO1FBQ2xCLE1BQU0sT0FBTyxhQUNYLE1BQU0sT0FBTyxPQUFPLE9BQ2xCLFdBQ0EsUUFBUSxPQUFPLFNBQVMsTUFBTSxZQUVoQyxVQUFVLEdBQUc7UUFDZixPQUFPLENBQUMsRUFBRSxTQUFTLEtBQUssU0FBUyxJQUFJLENBQUMsRUFBRSxLQUFLLENBQUM7SUFDaEQ7QUFDRjtBQUVBOzs7Ozs7Ozs7Ozs7Ozs7Q0FlQyxHQUNELE9BQU8sZUFBZSxVQUNwQixNQUFjLEVBQ2QsVUFBdUIsQ0FBQyxDQUFDO0lBRXpCLE1BQU0sT0FBTyxRQUFRLFFBQVEsV0FBVztJQUN4QyxNQUFNLE1BQ0osTUFBTSxDQUFDLFdBQVcsVUFDZCxhQUFhLFFBQVEsV0FDckIsV0FBVyxRQUFRLFFBQVE7SUFFakMsT0FBTyxNQUFNLE9BQU8sQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxHQUFHO0FBQ2xEO0FBRUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0E0QkMsR0FDRCxPQUFPLFNBQVMsUUFDZCxLQUFvQixFQUNwQixJQUF3QjtJQUV4QixnREFBZ0Q7SUFDaEQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEtBQUssV0FBVyxPQUFPO1FBQzVDLE9BQU87SUFDVDtJQUNBLElBQUksTUFBTSxXQUFXLEtBQUs7UUFDeEIsT0FBTztJQUNUO0lBQ0EsTUFBTSxPQUFPLE1BQU0sTUFBTTtJQUN6QixPQUFPLEtBQUssU0FBUztBQUN2QjtBQUVBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBNEJDLEdBQ0QsT0FBTyxTQUFTLFlBQ2QsS0FBb0IsRUFDcEIsSUFBd0I7SUFFeEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNO1FBQ25CLE9BQU87SUFDVDtJQUNBLElBQUksTUFBTSxXQUFXLEtBQUs7UUFDeEIsT0FBTztJQUNUO0lBQ0EsT0FBTyxLQUFLLFdBQVcsUUFBUSxLQUFLLE1BQU0sS0FBSztJQUMvQyxNQUFNLE9BQU8sTUFBTSxNQUFNLFdBQVcsSUFBSSxDQUFDLE1BQ3ZDLElBQUksV0FBVyxRQUFRLElBQUksTUFBTSxLQUFLO0lBRXhDLE9BQU8sQ0FBQyxLQUFLLFNBQVM7QUFDeEIifQ==