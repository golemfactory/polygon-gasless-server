// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { parseMediaType } from "./parse_media_type.ts";
import { extensions } from "./_util.ts";
export { extensions };
/**
 * Returns the extensions known to be associated with the media type `type`.
 * The returned extensions will each begin with a leading dot, as in `.html`.
 *
 * When `type` has no associated extensions, the function returns `undefined`.
 *
 * Extensions are returned without a leading `.`.
 *
 * @example
 * ```ts
 * import { extensionsByType } from "https://deno.land/std@$STD_VERSION/media_types/extensions_by_type.ts";
 *
 * extensionsByType("application/json"); // ["json", "map"]
 * extensionsByType("text/html; charset=UTF-8"); // ["html", "htm", "shtml"]
 * extensionsByType("application/foo"); // undefined
 * ```
 */ export function extensionsByType(type) {
    try {
        const [mediaType] = parseMediaType(type);
        return extensions.get(mediaType);
    } catch  {
    // just swallow errors, returning undefined
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5My4wL21lZGlhX3R5cGVzL2V4dGVuc2lvbnNfYnlfdHlwZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIzIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQgeyBwYXJzZU1lZGlhVHlwZSB9IGZyb20gXCIuL3BhcnNlX21lZGlhX3R5cGUudHNcIjtcbmltcG9ydCB7IGV4dGVuc2lvbnMgfSBmcm9tIFwiLi9fdXRpbC50c1wiO1xuXG5leHBvcnQgeyBleHRlbnNpb25zIH07XG5cbi8qKlxuICogUmV0dXJucyB0aGUgZXh0ZW5zaW9ucyBrbm93biB0byBiZSBhc3NvY2lhdGVkIHdpdGggdGhlIG1lZGlhIHR5cGUgYHR5cGVgLlxuICogVGhlIHJldHVybmVkIGV4dGVuc2lvbnMgd2lsbCBlYWNoIGJlZ2luIHdpdGggYSBsZWFkaW5nIGRvdCwgYXMgaW4gYC5odG1sYC5cbiAqXG4gKiBXaGVuIGB0eXBlYCBoYXMgbm8gYXNzb2NpYXRlZCBleHRlbnNpb25zLCB0aGUgZnVuY3Rpb24gcmV0dXJucyBgdW5kZWZpbmVkYC5cbiAqXG4gKiBFeHRlbnNpb25zIGFyZSByZXR1cm5lZCB3aXRob3V0IGEgbGVhZGluZyBgLmAuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBleHRlbnNpb25zQnlUeXBlIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vbWVkaWFfdHlwZXMvZXh0ZW5zaW9uc19ieV90eXBlLnRzXCI7XG4gKlxuICogZXh0ZW5zaW9uc0J5VHlwZShcImFwcGxpY2F0aW9uL2pzb25cIik7IC8vIFtcImpzb25cIiwgXCJtYXBcIl1cbiAqIGV4dGVuc2lvbnNCeVR5cGUoXCJ0ZXh0L2h0bWw7IGNoYXJzZXQ9VVRGLThcIik7IC8vIFtcImh0bWxcIiwgXCJodG1cIiwgXCJzaHRtbFwiXVxuICogZXh0ZW5zaW9uc0J5VHlwZShcImFwcGxpY2F0aW9uL2Zvb1wiKTsgLy8gdW5kZWZpbmVkXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dGVuc2lvbnNCeVR5cGUodHlwZTogc3RyaW5nKTogc3RyaW5nW10gfCB1bmRlZmluZWQge1xuICB0cnkge1xuICAgIGNvbnN0IFttZWRpYVR5cGVdID0gcGFyc2VNZWRpYVR5cGUodHlwZSk7XG4gICAgcmV0dXJuIGV4dGVuc2lvbnMuZ2V0KG1lZGlhVHlwZSk7XG4gIH0gY2F0Y2gge1xuICAgIC8vIGp1c3Qgc3dhbGxvdyBlcnJvcnMsIHJldHVybmluZyB1bmRlZmluZWRcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckMsU0FBUyxjQUFjLFFBQVEsd0JBQXdCO0FBQ3ZELFNBQVMsVUFBVSxRQUFRLGFBQWE7QUFFeEMsU0FBUyxVQUFVLEdBQUc7QUFFdEI7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FnQkMsR0FDRCxPQUFPLFNBQVMsaUJBQWlCLElBQVk7SUFDM0MsSUFBSTtRQUNGLE1BQU0sQ0FBQyxVQUFVLEdBQUcsZUFBZTtRQUNuQyxPQUFPLFdBQVcsSUFBSTtJQUN4QixFQUFFLE9BQU07SUFDTiwyQ0FBMkM7SUFDN0M7QUFDRiJ9