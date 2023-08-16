// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { parseMediaType } from "./parse_media_type.ts";
import { typeByExtension } from "./type_by_extension.ts";
import { getCharset } from "./get_charset.ts";
import { formatMediaType } from "./format_media_type.ts";
/**
 * Given an extension or media type, return a full `Content-Type` or
 * `Content-Disposition` header value.
 *
 * The function will treat the `extensionOrType` as a media type when it
 * contains a `/`, otherwise it will process it as an extension, with or without
 * the leading `.`.
 *
 * Returns `undefined` if unable to resolve the media type.
 *
 * > Note: a side effect of `deno/x/media_types` was that you could pass a file
 * > name (e.g. `file.json`) and it would return the content type. This behavior
 * > is intentionally not supported here. If you want to get an extension for a
 * > file name, use `extname()` from `std/path/mod.ts` to determine the
 * > extension and pass it here.
 *
 * @example
 * ```ts
 * import { contentType } from "https://deno.land/std@$STD_VERSION/media_types/content_type.ts";
 *
 * contentType(".json"); // `application/json; charset=UTF-8`
 * contentType("text/html"); // `text/html; charset=UTF-8`
 * contentType("text/html; charset=UTF-8"); // `text/html; charset=UTF-8`
 * contentType("txt"); // `text/plain; charset=UTF-8`
 * contentType("foo"); // undefined
 * contentType("file.json"); // undefined
 * ```
 */ export function contentType(extensionOrType) {
    try {
        const [mediaType, params = {}] = extensionOrType.includes("/") ? parseMediaType(extensionOrType) : [
            typeByExtension(extensionOrType),
            undefined
        ];
        if (!mediaType) {
            return undefined;
        }
        if (!("charset" in params)) {
            const charset = getCharset(mediaType);
            if (charset) {
                params.charset = charset;
            }
        }
        return formatMediaType(mediaType, params);
    } catch  {
    // just swallow returning undefined
    }
    return undefined;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5My4wL21lZGlhX3R5cGVzL2NvbnRlbnRfdHlwZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIzIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQgeyBwYXJzZU1lZGlhVHlwZSB9IGZyb20gXCIuL3BhcnNlX21lZGlhX3R5cGUudHNcIjtcbmltcG9ydCB7IHR5cGVCeUV4dGVuc2lvbiB9IGZyb20gXCIuL3R5cGVfYnlfZXh0ZW5zaW9uLnRzXCI7XG5pbXBvcnQgeyBnZXRDaGFyc2V0IH0gZnJvbSBcIi4vZ2V0X2NoYXJzZXQudHNcIjtcbmltcG9ydCB7IGZvcm1hdE1lZGlhVHlwZSB9IGZyb20gXCIuL2Zvcm1hdF9tZWRpYV90eXBlLnRzXCI7XG5pbXBvcnQgdHlwZSB7IGRiIH0gZnJvbSBcIi4vX2RiLnRzXCI7XG5cbnR5cGUgREIgPSB0eXBlb2YgZGI7XG50eXBlIENvbnRlbnRUeXBlVG9FeHRlbnNpb24gPSB7XG4gIFtLIGluIGtleW9mIERCXTogREJbS10gZXh0ZW5kcyB7IFwiZXh0ZW5zaW9uc1wiOiByZWFkb25seSBzdHJpbmdbXSB9XG4gICAgPyBEQltLXVtcImV4dGVuc2lvbnNcIl1bbnVtYmVyXVxuICAgIDogbmV2ZXI7XG59O1xuXG50eXBlIEtub3duRXh0ZW5zaW9uT3JUeXBlID1cbiAgfCBrZXlvZiBDb250ZW50VHlwZVRvRXh0ZW5zaW9uXG4gIHwgQ29udGVudFR5cGVUb0V4dGVuc2lvbltrZXlvZiBDb250ZW50VHlwZVRvRXh0ZW5zaW9uXVxuICB8IGAuJHtDb250ZW50VHlwZVRvRXh0ZW5zaW9uW2tleW9mIENvbnRlbnRUeXBlVG9FeHRlbnNpb25dfWA7XG5cbi8qKlxuICogR2l2ZW4gYW4gZXh0ZW5zaW9uIG9yIG1lZGlhIHR5cGUsIHJldHVybiBhIGZ1bGwgYENvbnRlbnQtVHlwZWAgb3JcbiAqIGBDb250ZW50LURpc3Bvc2l0aW9uYCBoZWFkZXIgdmFsdWUuXG4gKlxuICogVGhlIGZ1bmN0aW9uIHdpbGwgdHJlYXQgdGhlIGBleHRlbnNpb25PclR5cGVgIGFzIGEgbWVkaWEgdHlwZSB3aGVuIGl0XG4gKiBjb250YWlucyBhIGAvYCwgb3RoZXJ3aXNlIGl0IHdpbGwgcHJvY2VzcyBpdCBhcyBhbiBleHRlbnNpb24sIHdpdGggb3Igd2l0aG91dFxuICogdGhlIGxlYWRpbmcgYC5gLlxuICpcbiAqIFJldHVybnMgYHVuZGVmaW5lZGAgaWYgdW5hYmxlIHRvIHJlc29sdmUgdGhlIG1lZGlhIHR5cGUuXG4gKlxuICogPiBOb3RlOiBhIHNpZGUgZWZmZWN0IG9mIGBkZW5vL3gvbWVkaWFfdHlwZXNgIHdhcyB0aGF0IHlvdSBjb3VsZCBwYXNzIGEgZmlsZVxuICogPiBuYW1lIChlLmcuIGBmaWxlLmpzb25gKSBhbmQgaXQgd291bGQgcmV0dXJuIHRoZSBjb250ZW50IHR5cGUuIFRoaXMgYmVoYXZpb3JcbiAqID4gaXMgaW50ZW50aW9uYWxseSBub3Qgc3VwcG9ydGVkIGhlcmUuIElmIHlvdSB3YW50IHRvIGdldCBhbiBleHRlbnNpb24gZm9yIGFcbiAqID4gZmlsZSBuYW1lLCB1c2UgYGV4dG5hbWUoKWAgZnJvbSBgc3RkL3BhdGgvbW9kLnRzYCB0byBkZXRlcm1pbmUgdGhlXG4gKiA+IGV4dGVuc2lvbiBhbmQgcGFzcyBpdCBoZXJlLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgY29udGVudFR5cGUgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9tZWRpYV90eXBlcy9jb250ZW50X3R5cGUudHNcIjtcbiAqXG4gKiBjb250ZW50VHlwZShcIi5qc29uXCIpOyAvLyBgYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD1VVEYtOGBcbiAqIGNvbnRlbnRUeXBlKFwidGV4dC9odG1sXCIpOyAvLyBgdGV4dC9odG1sOyBjaGFyc2V0PVVURi04YFxuICogY29udGVudFR5cGUoXCJ0ZXh0L2h0bWw7IGNoYXJzZXQ9VVRGLThcIik7IC8vIGB0ZXh0L2h0bWw7IGNoYXJzZXQ9VVRGLThgXG4gKiBjb250ZW50VHlwZShcInR4dFwiKTsgLy8gYHRleHQvcGxhaW47IGNoYXJzZXQ9VVRGLThgXG4gKiBjb250ZW50VHlwZShcImZvb1wiKTsgLy8gdW5kZWZpbmVkXG4gKiBjb250ZW50VHlwZShcImZpbGUuanNvblwiKTsgLy8gdW5kZWZpbmVkXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbnRlbnRUeXBlPFxuICAvLyBXb3JrYXJvdW5kIHRvIGF1dG9jb21wbGV0ZSBmb3IgcGFyYW1ldGVyczogaHR0cHM6Ly9naXRodWIuY29tL21pY3Jvc29mdC9UeXBlU2NyaXB0L2lzc3Vlcy8yOTcyOSNpc3N1ZWNvbW1lbnQtNTY3ODcxOTM5XG4gIC8vIGRlbm8tbGludC1pZ25vcmUgYmFuLXR5cGVzXG4gIFQgZXh0ZW5kcyAoc3RyaW5nICYge30pIHwgS25vd25FeHRlbnNpb25PclR5cGUsXG4+KFxuICBleHRlbnNpb25PclR5cGU6IFQsXG4pOiBMb3dlcmNhc2U8VD4gZXh0ZW5kcyBLbm93bkV4dGVuc2lvbk9yVHlwZSA/IHN0cmluZyA6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gIHRyeSB7XG4gICAgY29uc3QgW21lZGlhVHlwZSwgcGFyYW1zID0ge31dID0gZXh0ZW5zaW9uT3JUeXBlLmluY2x1ZGVzKFwiL1wiKVxuICAgICAgPyBwYXJzZU1lZGlhVHlwZShleHRlbnNpb25PclR5cGUpXG4gICAgICA6IFt0eXBlQnlFeHRlbnNpb24oZXh0ZW5zaW9uT3JUeXBlKSwgdW5kZWZpbmVkXTtcbiAgICBpZiAoIW1lZGlhVHlwZSkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZCBhcyBMb3dlcmNhc2U8VD4gZXh0ZW5kcyBLbm93bkV4dGVuc2lvbk9yVHlwZSA/IHN0cmluZ1xuICAgICAgICA6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgaWYgKCEoXCJjaGFyc2V0XCIgaW4gcGFyYW1zKSkge1xuICAgICAgY29uc3QgY2hhcnNldCA9IGdldENoYXJzZXQobWVkaWFUeXBlKTtcbiAgICAgIGlmIChjaGFyc2V0KSB7XG4gICAgICAgIHBhcmFtcy5jaGFyc2V0ID0gY2hhcnNldDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZvcm1hdE1lZGlhVHlwZShtZWRpYVR5cGUsIHBhcmFtcyk7XG4gIH0gY2F0Y2gge1xuICAgIC8vIGp1c3Qgc3dhbGxvdyByZXR1cm5pbmcgdW5kZWZpbmVkXG4gIH1cbiAgcmV0dXJuIHVuZGVmaW5lZCBhcyBMb3dlcmNhc2U8VD4gZXh0ZW5kcyBLbm93bkV4dGVuc2lvbk9yVHlwZSA/IHN0cmluZ1xuICAgIDogc3RyaW5nIHwgdW5kZWZpbmVkO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckMsU0FBUyxjQUFjLFFBQVEsd0JBQXdCO0FBQ3ZELFNBQVMsZUFBZSxRQUFRLHlCQUF5QjtBQUN6RCxTQUFTLFVBQVUsUUFBUSxtQkFBbUI7QUFDOUMsU0FBUyxlQUFlLFFBQVEseUJBQXlCO0FBZXpEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0EyQkMsR0FDRCxPQUFPLFNBQVMsWUFLZCxlQUFrQjtJQUVsQixJQUFJO1FBQ0YsTUFBTSxDQUFDLFdBQVcsU0FBUyxDQUFDLENBQUMsQ0FBQyxHQUFHLGdCQUFnQixTQUFTLE9BQ3RELGVBQWUsbUJBQ2Y7WUFBQyxnQkFBZ0I7WUFBa0I7U0FBVTtRQUNqRCxJQUFJLENBQUMsV0FBVztZQUNkLE9BQU87UUFFVDtRQUNBLElBQUksQ0FBQyxDQUFDLGFBQWEsTUFBTSxHQUFHO1lBQzFCLE1BQU0sVUFBVSxXQUFXO1lBQzNCLElBQUksU0FBUztnQkFDWCxPQUFPLFVBQVU7WUFDbkI7UUFDRjtRQUNBLE9BQU8sZ0JBQWdCLFdBQVc7SUFDcEMsRUFBRSxPQUFNO0lBQ04sbUNBQW1DO0lBQ3JDO0lBQ0EsT0FBTztBQUVUIn0=