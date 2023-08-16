// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { types } from "./_db.ts";
/**
 * Returns the media type associated with the file extension. Values are
 * normalized to lower case and matched irrespective of a leading `.`.
 *
 * When `extension` has no associated type, the function returns `undefined`.
 *
 * @example
 * ```ts
 * import { typeByExtension } from "https://deno.land/std@$STD_VERSION/media_types/type_by_extension.ts";
 *
 * typeByExtension("js"); // `application/json`
 * typeByExtension(".HTML"); // `text/html`
 * typeByExtension("foo"); // undefined
 * typeByExtension("file.json"); // undefined
 * ```
 */ export function typeByExtension(extension) {
    extension = extension.startsWith(".") ? extension.slice(1) : extension;
    // @ts-ignore workaround around denoland/dnt#148
    return types.get(extension.toLowerCase());
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5My4wL21lZGlhX3R5cGVzL3R5cGVfYnlfZXh0ZW5zaW9uLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjMgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbmltcG9ydCB7IHR5cGVzIH0gZnJvbSBcIi4vX2RiLnRzXCI7XG5cbi8qKlxuICogUmV0dXJucyB0aGUgbWVkaWEgdHlwZSBhc3NvY2lhdGVkIHdpdGggdGhlIGZpbGUgZXh0ZW5zaW9uLiBWYWx1ZXMgYXJlXG4gKiBub3JtYWxpemVkIHRvIGxvd2VyIGNhc2UgYW5kIG1hdGNoZWQgaXJyZXNwZWN0aXZlIG9mIGEgbGVhZGluZyBgLmAuXG4gKlxuICogV2hlbiBgZXh0ZW5zaW9uYCBoYXMgbm8gYXNzb2NpYXRlZCB0eXBlLCB0aGUgZnVuY3Rpb24gcmV0dXJucyBgdW5kZWZpbmVkYC5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IHR5cGVCeUV4dGVuc2lvbiB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL21lZGlhX3R5cGVzL3R5cGVfYnlfZXh0ZW5zaW9uLnRzXCI7XG4gKlxuICogdHlwZUJ5RXh0ZW5zaW9uKFwianNcIik7IC8vIGBhcHBsaWNhdGlvbi9qc29uYFxuICogdHlwZUJ5RXh0ZW5zaW9uKFwiLkhUTUxcIik7IC8vIGB0ZXh0L2h0bWxgXG4gKiB0eXBlQnlFeHRlbnNpb24oXCJmb29cIik7IC8vIHVuZGVmaW5lZFxuICogdHlwZUJ5RXh0ZW5zaW9uKFwiZmlsZS5qc29uXCIpOyAvLyB1bmRlZmluZWRcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gdHlwZUJ5RXh0ZW5zaW9uKGV4dGVuc2lvbjogc3RyaW5nKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgZXh0ZW5zaW9uID0gZXh0ZW5zaW9uLnN0YXJ0c1dpdGgoXCIuXCIpID8gZXh0ZW5zaW9uLnNsaWNlKDEpIDogZXh0ZW5zaW9uO1xuICAvLyBAdHMtaWdub3JlIHdvcmthcm91bmQgYXJvdW5kIGRlbm9sYW5kL2RudCMxNDhcbiAgcmV0dXJuIHR5cGVzLmdldChleHRlbnNpb24udG9Mb3dlckNhc2UoKSk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUVyQyxTQUFTLEtBQUssUUFBUSxXQUFXO0FBRWpDOzs7Ozs7Ozs7Ozs7Ozs7Q0FlQyxHQUNELE9BQU8sU0FBUyxnQkFBZ0IsU0FBaUI7SUFDL0MsWUFBWSxVQUFVLFdBQVcsT0FBTyxVQUFVLE1BQU0sS0FBSztJQUM3RCxnREFBZ0Q7SUFDaEQsT0FBTyxNQUFNLElBQUksVUFBVTtBQUM3QiJ9