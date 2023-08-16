// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { isIterator, isToken, needsEncoding } from "./_util.ts";
/** Serializes the media type and the optional parameters as a media type
 * conforming to RFC 2045 and RFC 2616.
 *
 * The type and parameter names are written in lower-case.
 *
 * When any of the arguments results in a standard violation then the return
 * value will be an empty string (`""`).
 *
 * @example
 * ```ts
 * import { formatMediaType } from "https://deno.land/std@$STD_VERSION/media_types/format_media_type.ts";
 *
 * formatMediaType("text/plain", { charset: "UTF-8" }); // `text/plain; charset=UTF-8`
 * ```
 */ export function formatMediaType(type, param) {
    let b = "";
    const [major, sub] = type.split("/");
    if (!sub) {
        if (!isToken(type)) {
            return "";
        }
        b += type.toLowerCase();
    } else {
        if (!isToken(major) || !isToken(sub)) {
            return "";
        }
        b += `${major.toLowerCase()}/${sub.toLowerCase()}`;
    }
    if (param) {
        param = isIterator(param) ? Object.fromEntries(param) : param;
        const attrs = Object.keys(param);
        attrs.sort();
        for (const attribute of attrs){
            if (!isToken(attribute)) {
                return "";
            }
            const value = param[attribute];
            b += `; ${attribute.toLowerCase()}`;
            const needEnc = needsEncoding(value);
            if (needEnc) {
                b += "*";
            }
            b += "=";
            if (needEnc) {
                b += `utf-8''${encodeURIComponent(value)}`;
                continue;
            }
            if (isToken(value)) {
                b += value;
                continue;
            }
            b += `"${value.replace(/["\\]/gi, (m)=>`\\${m}`)}"`;
        }
    }
    return b;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5My4wL21lZGlhX3R5cGVzL2Zvcm1hdF9tZWRpYV90eXBlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjMgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbmltcG9ydCB7IGlzSXRlcmF0b3IsIGlzVG9rZW4sIG5lZWRzRW5jb2RpbmcgfSBmcm9tIFwiLi9fdXRpbC50c1wiO1xuXG4vKiogU2VyaWFsaXplcyB0aGUgbWVkaWEgdHlwZSBhbmQgdGhlIG9wdGlvbmFsIHBhcmFtZXRlcnMgYXMgYSBtZWRpYSB0eXBlXG4gKiBjb25mb3JtaW5nIHRvIFJGQyAyMDQ1IGFuZCBSRkMgMjYxNi5cbiAqXG4gKiBUaGUgdHlwZSBhbmQgcGFyYW1ldGVyIG5hbWVzIGFyZSB3cml0dGVuIGluIGxvd2VyLWNhc2UuXG4gKlxuICogV2hlbiBhbnkgb2YgdGhlIGFyZ3VtZW50cyByZXN1bHRzIGluIGEgc3RhbmRhcmQgdmlvbGF0aW9uIHRoZW4gdGhlIHJldHVyblxuICogdmFsdWUgd2lsbCBiZSBhbiBlbXB0eSBzdHJpbmcgKGBcIlwiYCkuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBmb3JtYXRNZWRpYVR5cGUgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9tZWRpYV90eXBlcy9mb3JtYXRfbWVkaWFfdHlwZS50c1wiO1xuICpcbiAqIGZvcm1hdE1lZGlhVHlwZShcInRleHQvcGxhaW5cIiwgeyBjaGFyc2V0OiBcIlVURi04XCIgfSk7IC8vIGB0ZXh0L3BsYWluOyBjaGFyc2V0PVVURi04YFxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRNZWRpYVR5cGUoXG4gIHR5cGU6IHN0cmluZyxcbiAgcGFyYW0/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+IHwgSXRlcmFibGU8W3N0cmluZywgc3RyaW5nXT4sXG4pOiBzdHJpbmcge1xuICBsZXQgYiA9IFwiXCI7XG4gIGNvbnN0IFttYWpvciwgc3ViXSA9IHR5cGUuc3BsaXQoXCIvXCIpO1xuICBpZiAoIXN1Yikge1xuICAgIGlmICghaXNUb2tlbih0eXBlKSkge1xuICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuICAgIGIgKz0gdHlwZS50b0xvd2VyQ2FzZSgpO1xuICB9IGVsc2Uge1xuICAgIGlmICghaXNUb2tlbihtYWpvcikgfHwgIWlzVG9rZW4oc3ViKSkge1xuICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuICAgIGIgKz0gYCR7bWFqb3IudG9Mb3dlckNhc2UoKX0vJHtzdWIudG9Mb3dlckNhc2UoKX1gO1xuICB9XG5cbiAgaWYgKHBhcmFtKSB7XG4gICAgcGFyYW0gPSBpc0l0ZXJhdG9yKHBhcmFtKSA/IE9iamVjdC5mcm9tRW50cmllcyhwYXJhbSkgOiBwYXJhbTtcbiAgICBjb25zdCBhdHRycyA9IE9iamVjdC5rZXlzKHBhcmFtKTtcbiAgICBhdHRycy5zb3J0KCk7XG5cbiAgICBmb3IgKGNvbnN0IGF0dHJpYnV0ZSBvZiBhdHRycykge1xuICAgICAgaWYgKCFpc1Rva2VuKGF0dHJpYnV0ZSkpIHtcbiAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICB9XG4gICAgICBjb25zdCB2YWx1ZSA9IHBhcmFtW2F0dHJpYnV0ZV07XG4gICAgICBiICs9IGA7ICR7YXR0cmlidXRlLnRvTG93ZXJDYXNlKCl9YDtcblxuICAgICAgY29uc3QgbmVlZEVuYyA9IG5lZWRzRW5jb2RpbmcodmFsdWUpO1xuICAgICAgaWYgKG5lZWRFbmMpIHtcbiAgICAgICAgYiArPSBcIipcIjtcbiAgICAgIH1cbiAgICAgIGIgKz0gXCI9XCI7XG5cbiAgICAgIGlmIChuZWVkRW5jKSB7XG4gICAgICAgIGIgKz0gYHV0Zi04Jycke2VuY29kZVVSSUNvbXBvbmVudCh2YWx1ZSl9YDtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChpc1Rva2VuKHZhbHVlKSkge1xuICAgICAgICBiICs9IHZhbHVlO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGIgKz0gYFwiJHt2YWx1ZS5yZXBsYWNlKC9bXCJcXFxcXS9naSwgKG0pID0+IGBcXFxcJHttfWApfVwiYDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGI7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUVyQyxTQUFTLFVBQVUsRUFBRSxPQUFPLEVBQUUsYUFBYSxRQUFRLGFBQWE7QUFFaEU7Ozs7Ozs7Ozs7Ozs7O0NBY0MsR0FDRCxPQUFPLFNBQVMsZ0JBQ2QsSUFBWSxFQUNaLEtBQTJEO0lBRTNELElBQUksSUFBSTtJQUNSLE1BQU0sQ0FBQyxPQUFPLElBQUksR0FBRyxLQUFLLE1BQU07SUFDaEMsSUFBSSxDQUFDLEtBQUs7UUFDUixJQUFJLENBQUMsUUFBUSxPQUFPO1lBQ2xCLE9BQU87UUFDVDtRQUNBLEtBQUssS0FBSztJQUNaLE9BQU87UUFDTCxJQUFJLENBQUMsUUFBUSxVQUFVLENBQUMsUUFBUSxNQUFNO1lBQ3BDLE9BQU87UUFDVDtRQUNBLEtBQUssQ0FBQyxFQUFFLE1BQU0sY0FBYyxDQUFDLEVBQUUsSUFBSSxjQUFjLENBQUM7SUFDcEQ7SUFFQSxJQUFJLE9BQU87UUFDVCxRQUFRLFdBQVcsU0FBUyxPQUFPLFlBQVksU0FBUztRQUN4RCxNQUFNLFFBQVEsT0FBTyxLQUFLO1FBQzFCLE1BQU07UUFFTixLQUFLLE1BQU0sYUFBYSxNQUFPO1lBQzdCLElBQUksQ0FBQyxRQUFRLFlBQVk7Z0JBQ3ZCLE9BQU87WUFDVDtZQUNBLE1BQU0sUUFBUSxLQUFLLENBQUMsVUFBVTtZQUM5QixLQUFLLENBQUMsRUFBRSxFQUFFLFVBQVUsY0FBYyxDQUFDO1lBRW5DLE1BQU0sVUFBVSxjQUFjO1lBQzlCLElBQUksU0FBUztnQkFDWCxLQUFLO1lBQ1A7WUFDQSxLQUFLO1lBRUwsSUFBSSxTQUFTO2dCQUNYLEtBQUssQ0FBQyxPQUFPLEVBQUUsbUJBQW1CLE9BQU8sQ0FBQztnQkFDMUM7WUFDRjtZQUVBLElBQUksUUFBUSxRQUFRO2dCQUNsQixLQUFLO2dCQUNMO1lBQ0Y7WUFDQSxLQUFLLENBQUMsQ0FBQyxFQUFFLE1BQU0sUUFBUSxXQUFXLENBQUMsSUFBTSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDdkQ7SUFDRjtJQUNBLE9BQU87QUFDVCJ9