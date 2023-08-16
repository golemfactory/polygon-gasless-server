// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { consumeMediaParam, decode2331Encoding } from "./_util.ts";
/**
 * Parses the media type and any optional parameters, per
 * [RFC 1521](https://datatracker.ietf.org/doc/html/rfc1521). Media types are
 * the values in `Content-Type` and `Content-Disposition` headers. On success
 * the function returns a tuple where the first element is the media type and
 * the second element is the optional parameters or `undefined` if there are
 * none.
 *
 * The function will throw if the parsed value is invalid.
 *
 * The returned media type will be normalized to be lower case, and returned
 * params keys will be normalized to lower case, but preserves the casing of
 * the value.
 *
 * @example
 * ```ts
 * import { parseMediaType } from "https://deno.land/std@$STD_VERSION/media_types/parse_media_type.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * assertEquals(
 *   parseMediaType("application/JSON"),
 *   [
 *     "application/json",
 *     undefined
 *   ]
 * );
 *
 * assertEquals(
 *   parseMediaType("text/html; charset=UTF-8"),
 *   [
 *     "application/json",
 *     { charset: "UTF-8" },
 *   ]
 * );
 * ```
 */ export function parseMediaType(v) {
    const [base] = v.split(";");
    const mediaType = base.toLowerCase().trim();
    const params = {};
    // Map of base parameter name -> parameter name -> value
    // for parameters containing a '*' character.
    const continuation = new Map();
    v = v.slice(base.length);
    while(v.length){
        v = v.trimStart();
        if (v.length === 0) {
            break;
        }
        const [key, value, rest] = consumeMediaParam(v);
        if (!key) {
            if (rest.trim() === ";") {
                break;
            }
            throw new TypeError("Invalid media parameter.");
        }
        let pmap = params;
        const [baseName, rest2] = key.split("*");
        if (baseName && rest2 != null) {
            if (!continuation.has(baseName)) {
                continuation.set(baseName, {});
            }
            pmap = continuation.get(baseName);
        }
        if (key in pmap) {
            throw new TypeError("Duplicate key parsed.");
        }
        pmap[key] = value;
        v = rest;
    }
    // Stitch together any continuations or things with stars
    // (i.e. RFC 2231 things with stars: "foo*0" or "foo*")
    let str = "";
    for (const [key, pieceMap] of continuation){
        const singlePartKey = `${key}*`;
        const v = pieceMap[singlePartKey];
        if (v) {
            const decv = decode2331Encoding(v);
            if (decv) {
                params[key] = decv;
            }
            continue;
        }
        str = "";
        let valid = false;
        for(let n = 0;; n++){
            const simplePart = `${key}*${n}`;
            let v = pieceMap[simplePart];
            if (v) {
                valid = true;
                str += v;
                continue;
            }
            const encodedPart = `${simplePart}*`;
            v = pieceMap[encodedPart];
            if (!v) {
                break;
            }
            valid = true;
            if (n === 0) {
                const decv = decode2331Encoding(v);
                if (decv) {
                    str += decv;
                }
            } else {
                const decv = decodeURI(v);
                str += decv;
            }
        }
        if (valid) {
            params[key] = str;
        }
    }
    return Object.keys(params).length ? [
        mediaType,
        params
    ] : [
        mediaType,
        undefined
    ];
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5My4wL21lZGlhX3R5cGVzL3BhcnNlX21lZGlhX3R5cGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMyB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuaW1wb3J0IHsgY29uc3VtZU1lZGlhUGFyYW0sIGRlY29kZTIzMzFFbmNvZGluZyB9IGZyb20gXCIuL191dGlsLnRzXCI7XG5cbi8qKlxuICogUGFyc2VzIHRoZSBtZWRpYSB0eXBlIGFuZCBhbnkgb3B0aW9uYWwgcGFyYW1ldGVycywgcGVyXG4gKiBbUkZDIDE1MjFdKGh0dHBzOi8vZGF0YXRyYWNrZXIuaWV0Zi5vcmcvZG9jL2h0bWwvcmZjMTUyMSkuIE1lZGlhIHR5cGVzIGFyZVxuICogdGhlIHZhbHVlcyBpbiBgQ29udGVudC1UeXBlYCBhbmQgYENvbnRlbnQtRGlzcG9zaXRpb25gIGhlYWRlcnMuIE9uIHN1Y2Nlc3NcbiAqIHRoZSBmdW5jdGlvbiByZXR1cm5zIGEgdHVwbGUgd2hlcmUgdGhlIGZpcnN0IGVsZW1lbnQgaXMgdGhlIG1lZGlhIHR5cGUgYW5kXG4gKiB0aGUgc2Vjb25kIGVsZW1lbnQgaXMgdGhlIG9wdGlvbmFsIHBhcmFtZXRlcnMgb3IgYHVuZGVmaW5lZGAgaWYgdGhlcmUgYXJlXG4gKiBub25lLlxuICpcbiAqIFRoZSBmdW5jdGlvbiB3aWxsIHRocm93IGlmIHRoZSBwYXJzZWQgdmFsdWUgaXMgaW52YWxpZC5cbiAqXG4gKiBUaGUgcmV0dXJuZWQgbWVkaWEgdHlwZSB3aWxsIGJlIG5vcm1hbGl6ZWQgdG8gYmUgbG93ZXIgY2FzZSwgYW5kIHJldHVybmVkXG4gKiBwYXJhbXMga2V5cyB3aWxsIGJlIG5vcm1hbGl6ZWQgdG8gbG93ZXIgY2FzZSwgYnV0IHByZXNlcnZlcyB0aGUgY2FzaW5nIG9mXG4gKiB0aGUgdmFsdWUuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBwYXJzZU1lZGlhVHlwZSB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL21lZGlhX3R5cGVzL3BhcnNlX21lZGlhX3R5cGUudHNcIjtcbiAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL3Rlc3RpbmcvYXNzZXJ0cy50c1wiO1xuICpcbiAqIGFzc2VydEVxdWFscyhcbiAqICAgcGFyc2VNZWRpYVR5cGUoXCJhcHBsaWNhdGlvbi9KU09OXCIpLFxuICogICBbXG4gKiAgICAgXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gKiAgICAgdW5kZWZpbmVkXG4gKiAgIF1cbiAqICk7XG4gKlxuICogYXNzZXJ0RXF1YWxzKFxuICogICBwYXJzZU1lZGlhVHlwZShcInRleHQvaHRtbDsgY2hhcnNldD1VVEYtOFwiKSxcbiAqICAgW1xuICogICAgIFwiYXBwbGljYXRpb24vanNvblwiLFxuICogICAgIHsgY2hhcnNldDogXCJVVEYtOFwiIH0sXG4gKiAgIF1cbiAqICk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlTWVkaWFUeXBlKFxuICB2OiBzdHJpbmcsXG4pOiBbbWVkaWFUeXBlOiBzdHJpbmcsIHBhcmFtczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiB8IHVuZGVmaW5lZF0ge1xuICBjb25zdCBbYmFzZV0gPSB2LnNwbGl0KFwiO1wiKTtcbiAgY29uc3QgbWVkaWFUeXBlID0gYmFzZS50b0xvd2VyQ2FzZSgpLnRyaW0oKTtcblxuICBjb25zdCBwYXJhbXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcbiAgLy8gTWFwIG9mIGJhc2UgcGFyYW1ldGVyIG5hbWUgLT4gcGFyYW1ldGVyIG5hbWUgLT4gdmFsdWVcbiAgLy8gZm9yIHBhcmFtZXRlcnMgY29udGFpbmluZyBhICcqJyBjaGFyYWN0ZXIuXG4gIGNvbnN0IGNvbnRpbnVhdGlvbiA9IG5ldyBNYXA8c3RyaW5nLCBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+PigpO1xuXG4gIHYgPSB2LnNsaWNlKGJhc2UubGVuZ3RoKTtcbiAgd2hpbGUgKHYubGVuZ3RoKSB7XG4gICAgdiA9IHYudHJpbVN0YXJ0KCk7XG4gICAgaWYgKHYubGVuZ3RoID09PSAwKSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY29uc3QgW2tleSwgdmFsdWUsIHJlc3RdID0gY29uc3VtZU1lZGlhUGFyYW0odik7XG4gICAgaWYgKCFrZXkpIHtcbiAgICAgIGlmIChyZXN0LnRyaW0oKSA9PT0gXCI7XCIpIHtcbiAgICAgICAgLy8gaWdub3JlIHRyYWlsaW5nIHNlbWljb2xvbnNcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiSW52YWxpZCBtZWRpYSBwYXJhbWV0ZXIuXCIpO1xuICAgIH1cblxuICAgIGxldCBwbWFwID0gcGFyYW1zO1xuICAgIGNvbnN0IFtiYXNlTmFtZSwgcmVzdDJdID0ga2V5LnNwbGl0KFwiKlwiKTtcbiAgICBpZiAoYmFzZU5hbWUgJiYgcmVzdDIgIT0gbnVsbCkge1xuICAgICAgaWYgKCFjb250aW51YXRpb24uaGFzKGJhc2VOYW1lKSkge1xuICAgICAgICBjb250aW51YXRpb24uc2V0KGJhc2VOYW1lLCB7fSk7XG4gICAgICB9XG4gICAgICBwbWFwID0gY29udGludWF0aW9uLmdldChiYXNlTmFtZSkhO1xuICAgIH1cbiAgICBpZiAoa2V5IGluIHBtYXApIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJEdXBsaWNhdGUga2V5IHBhcnNlZC5cIik7XG4gICAgfVxuICAgIHBtYXBba2V5XSA9IHZhbHVlO1xuICAgIHYgPSByZXN0O1xuICB9XG5cbiAgLy8gU3RpdGNoIHRvZ2V0aGVyIGFueSBjb250aW51YXRpb25zIG9yIHRoaW5ncyB3aXRoIHN0YXJzXG4gIC8vIChpLmUuIFJGQyAyMjMxIHRoaW5ncyB3aXRoIHN0YXJzOiBcImZvbyowXCIgb3IgXCJmb28qXCIpXG4gIGxldCBzdHIgPSBcIlwiO1xuICBmb3IgKGNvbnN0IFtrZXksIHBpZWNlTWFwXSBvZiBjb250aW51YXRpb24pIHtcbiAgICBjb25zdCBzaW5nbGVQYXJ0S2V5ID0gYCR7a2V5fSpgO1xuICAgIGNvbnN0IHYgPSBwaWVjZU1hcFtzaW5nbGVQYXJ0S2V5XTtcbiAgICBpZiAodikge1xuICAgICAgY29uc3QgZGVjdiA9IGRlY29kZTIzMzFFbmNvZGluZyh2KTtcbiAgICAgIGlmIChkZWN2KSB7XG4gICAgICAgIHBhcmFtc1trZXldID0gZGVjdjtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIHN0ciA9IFwiXCI7XG4gICAgbGV0IHZhbGlkID0gZmFsc2U7XG4gICAgZm9yIChsZXQgbiA9IDA7OyBuKyspIHtcbiAgICAgIGNvbnN0IHNpbXBsZVBhcnQgPSBgJHtrZXl9KiR7bn1gO1xuICAgICAgbGV0IHYgPSBwaWVjZU1hcFtzaW1wbGVQYXJ0XTtcbiAgICAgIGlmICh2KSB7XG4gICAgICAgIHZhbGlkID0gdHJ1ZTtcbiAgICAgICAgc3RyICs9IHY7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY29uc3QgZW5jb2RlZFBhcnQgPSBgJHtzaW1wbGVQYXJ0fSpgO1xuICAgICAgdiA9IHBpZWNlTWFwW2VuY29kZWRQYXJ0XTtcbiAgICAgIGlmICghdikge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIHZhbGlkID0gdHJ1ZTtcbiAgICAgIGlmIChuID09PSAwKSB7XG4gICAgICAgIGNvbnN0IGRlY3YgPSBkZWNvZGUyMzMxRW5jb2Rpbmcodik7XG4gICAgICAgIGlmIChkZWN2KSB7XG4gICAgICAgICAgc3RyICs9IGRlY3Y7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGRlY3YgPSBkZWNvZGVVUkkodik7XG4gICAgICAgIHN0ciArPSBkZWN2O1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodmFsaWQpIHtcbiAgICAgIHBhcmFtc1trZXldID0gc3RyO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBPYmplY3Qua2V5cyhwYXJhbXMpLmxlbmd0aFxuICAgID8gW21lZGlhVHlwZSwgcGFyYW1zXVxuICAgIDogW21lZGlhVHlwZSwgdW5kZWZpbmVkXTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDLFNBQVMsaUJBQWlCLEVBQUUsa0JBQWtCLFFBQVEsYUFBYTtBQUVuRTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FtQ0MsR0FDRCxPQUFPLFNBQVMsZUFDZCxDQUFTO0lBRVQsTUFBTSxDQUFDLEtBQUssR0FBRyxFQUFFLE1BQU07SUFDdkIsTUFBTSxZQUFZLEtBQUssY0FBYztJQUVyQyxNQUFNLFNBQWlDLENBQUM7SUFDeEMsd0RBQXdEO0lBQ3hELDZDQUE2QztJQUM3QyxNQUFNLGVBQWUsSUFBSTtJQUV6QixJQUFJLEVBQUUsTUFBTSxLQUFLO0lBQ2pCLE1BQU8sRUFBRSxPQUFRO1FBQ2YsSUFBSSxFQUFFO1FBQ04sSUFBSSxFQUFFLFdBQVcsR0FBRztZQUNsQjtRQUNGO1FBQ0EsTUFBTSxDQUFDLEtBQUssT0FBTyxLQUFLLEdBQUcsa0JBQWtCO1FBQzdDLElBQUksQ0FBQyxLQUFLO1lBQ1IsSUFBSSxLQUFLLFdBQVcsS0FBSztnQkFFdkI7WUFDRjtZQUNBLE1BQU0sSUFBSSxVQUFVO1FBQ3RCO1FBRUEsSUFBSSxPQUFPO1FBQ1gsTUFBTSxDQUFDLFVBQVUsTUFBTSxHQUFHLElBQUksTUFBTTtRQUNwQyxJQUFJLFlBQVksU0FBUyxNQUFNO1lBQzdCLElBQUksQ0FBQyxhQUFhLElBQUksV0FBVztnQkFDL0IsYUFBYSxJQUFJLFVBQVUsQ0FBQztZQUM5QjtZQUNBLE9BQU8sYUFBYSxJQUFJO1FBQzFCO1FBQ0EsSUFBSSxPQUFPLE1BQU07WUFDZixNQUFNLElBQUksVUFBVTtRQUN0QjtRQUNBLElBQUksQ0FBQyxJQUFJLEdBQUc7UUFDWixJQUFJO0lBQ047SUFFQSx5REFBeUQ7SUFDekQsdURBQXVEO0lBQ3ZELElBQUksTUFBTTtJQUNWLEtBQUssTUFBTSxDQUFDLEtBQUssU0FBUyxJQUFJLGFBQWM7UUFDMUMsTUFBTSxnQkFBZ0IsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQy9CLE1BQU0sSUFBSSxRQUFRLENBQUMsY0FBYztRQUNqQyxJQUFJLEdBQUc7WUFDTCxNQUFNLE9BQU8sbUJBQW1CO1lBQ2hDLElBQUksTUFBTTtnQkFDUixNQUFNLENBQUMsSUFBSSxHQUFHO1lBQ2hCO1lBQ0E7UUFDRjtRQUVBLE1BQU07UUFDTixJQUFJLFFBQVE7UUFDWixJQUFLLElBQUksSUFBSSxJQUFJLElBQUs7WUFDcEIsTUFBTSxhQUFhLENBQUMsRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDaEMsSUFBSSxJQUFJLFFBQVEsQ0FBQyxXQUFXO1lBQzVCLElBQUksR0FBRztnQkFDTCxRQUFRO2dCQUNSLE9BQU87Z0JBQ1A7WUFDRjtZQUNBLE1BQU0sY0FBYyxDQUFDLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDcEMsSUFBSSxRQUFRLENBQUMsWUFBWTtZQUN6QixJQUFJLENBQUMsR0FBRztnQkFDTjtZQUNGO1lBQ0EsUUFBUTtZQUNSLElBQUksTUFBTSxHQUFHO2dCQUNYLE1BQU0sT0FBTyxtQkFBbUI7Z0JBQ2hDLElBQUksTUFBTTtvQkFDUixPQUFPO2dCQUNUO1lBQ0YsT0FBTztnQkFDTCxNQUFNLE9BQU8sVUFBVTtnQkFDdkIsT0FBTztZQUNUO1FBQ0Y7UUFDQSxJQUFJLE9BQU87WUFDVCxNQUFNLENBQUMsSUFBSSxHQUFHO1FBQ2hCO0lBQ0Y7SUFFQSxPQUFPLE9BQU8sS0FBSyxRQUFRLFNBQ3ZCO1FBQUM7UUFBVztLQUFPLEdBQ25CO1FBQUM7UUFBVztLQUFVO0FBQzVCIn0=