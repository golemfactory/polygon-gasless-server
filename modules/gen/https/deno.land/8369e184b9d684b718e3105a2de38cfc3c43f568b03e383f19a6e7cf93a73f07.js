// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { extensionsByType } from "./extensions_by_type.ts";
/**
 * For a given media type, return the most relevant extension, or `undefined`
 * if no extension can be found.
 *
 * Extensions are returned without a leading `.`.
 *
 * @example
 * ```ts
 * import { extension } from "https://deno.land/std@$STD_VERSION/media_types/extension.ts";
 *
 * extension("text/plain"); // `txt`
 * extension("application/json"); // `json`
 * extension("text/html; charset=UTF-8"); // `html`
 * extension("application/foo"); // undefined
 * ```
 */ export function extension(type) {
    const exts = extensionsByType(type);
    if (exts) {
        return exts[0];
    }
    return undefined;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5My4wL21lZGlhX3R5cGVzL2V4dGVuc2lvbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIzIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQgeyBleHRlbnNpb25zQnlUeXBlIH0gZnJvbSBcIi4vZXh0ZW5zaW9uc19ieV90eXBlLnRzXCI7XG5cbi8qKlxuICogRm9yIGEgZ2l2ZW4gbWVkaWEgdHlwZSwgcmV0dXJuIHRoZSBtb3N0IHJlbGV2YW50IGV4dGVuc2lvbiwgb3IgYHVuZGVmaW5lZGBcbiAqIGlmIG5vIGV4dGVuc2lvbiBjYW4gYmUgZm91bmQuXG4gKlxuICogRXh0ZW5zaW9ucyBhcmUgcmV0dXJuZWQgd2l0aG91dCBhIGxlYWRpbmcgYC5gLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgZXh0ZW5zaW9uIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vbWVkaWFfdHlwZXMvZXh0ZW5zaW9uLnRzXCI7XG4gKlxuICogZXh0ZW5zaW9uKFwidGV4dC9wbGFpblwiKTsgLy8gYHR4dGBcbiAqIGV4dGVuc2lvbihcImFwcGxpY2F0aW9uL2pzb25cIik7IC8vIGBqc29uYFxuICogZXh0ZW5zaW9uKFwidGV4dC9odG1sOyBjaGFyc2V0PVVURi04XCIpOyAvLyBgaHRtbGBcbiAqIGV4dGVuc2lvbihcImFwcGxpY2F0aW9uL2Zvb1wiKTsgLy8gdW5kZWZpbmVkXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dGVuc2lvbih0eXBlOiBzdHJpbmcpOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICBjb25zdCBleHRzID0gZXh0ZW5zaW9uc0J5VHlwZSh0eXBlKTtcbiAgaWYgKGV4dHMpIHtcbiAgICByZXR1cm4gZXh0c1swXTtcbiAgfVxuICByZXR1cm4gdW5kZWZpbmVkO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckMsU0FBUyxnQkFBZ0IsUUFBUSwwQkFBMEI7QUFFM0Q7Ozs7Ozs7Ozs7Ozs7OztDQWVDLEdBQ0QsT0FBTyxTQUFTLFVBQVUsSUFBWTtJQUNwQyxNQUFNLE9BQU8saUJBQWlCO0lBQzlCLElBQUksTUFBTTtRQUNSLE9BQU8sSUFBSSxDQUFDLEVBQUU7SUFDaEI7SUFDQSxPQUFPO0FBQ1QifQ==