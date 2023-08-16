// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/** Utility functions for media types (MIME types).
 *
 * This API is inspired by the GoLang [`mime`](https://pkg.go.dev/mime) package
 * and [jshttp/mime-types](https://github.com/jshttp/mime-types), and is
 * designed to integrate and improve the APIs from
 * [deno.land/x/media_types](https://deno.land/x/media_types).
 *
 * The `vendor` folder contains copy of the
 * [jshttp/mime-db](https://github.com/jshttp/mime-types) `db.json` file along
 * with its license.
 *
 * @module
 */ export * from "./content_type.ts";
export * from "./extension.ts";
export * from "./extensions_by_type.ts";
export * from "./format_media_type.ts";
export * from "./get_charset.ts";
export * from "./parse_media_type.ts";
export * from "./type_by_extension.ts";
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5My4wL21lZGlhX3R5cGVzL21vZC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIzIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG4vKiogVXRpbGl0eSBmdW5jdGlvbnMgZm9yIG1lZGlhIHR5cGVzIChNSU1FIHR5cGVzKS5cbiAqXG4gKiBUaGlzIEFQSSBpcyBpbnNwaXJlZCBieSB0aGUgR29MYW5nIFtgbWltZWBdKGh0dHBzOi8vcGtnLmdvLmRldi9taW1lKSBwYWNrYWdlXG4gKiBhbmQgW2pzaHR0cC9taW1lLXR5cGVzXShodHRwczovL2dpdGh1Yi5jb20vanNodHRwL21pbWUtdHlwZXMpLCBhbmQgaXNcbiAqIGRlc2lnbmVkIHRvIGludGVncmF0ZSBhbmQgaW1wcm92ZSB0aGUgQVBJcyBmcm9tXG4gKiBbZGVuby5sYW5kL3gvbWVkaWFfdHlwZXNdKGh0dHBzOi8vZGVuby5sYW5kL3gvbWVkaWFfdHlwZXMpLlxuICpcbiAqIFRoZSBgdmVuZG9yYCBmb2xkZXIgY29udGFpbnMgY29weSBvZiB0aGVcbiAqIFtqc2h0dHAvbWltZS1kYl0oaHR0cHM6Ly9naXRodWIuY29tL2pzaHR0cC9taW1lLXR5cGVzKSBgZGIuanNvbmAgZmlsZSBhbG9uZ1xuICogd2l0aCBpdHMgbGljZW5zZS5cbiAqXG4gKiBAbW9kdWxlXG4gKi9cblxuZXhwb3J0ICogZnJvbSBcIi4vY29udGVudF90eXBlLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9leHRlbnNpb24udHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL2V4dGVuc2lvbnNfYnlfdHlwZS50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vZm9ybWF0X21lZGlhX3R5cGUudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL2dldF9jaGFyc2V0LnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9wYXJzZV9tZWRpYV90eXBlLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi90eXBlX2J5X2V4dGVuc2lvbi50c1wiO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckM7Ozs7Ozs7Ozs7OztDQVlDLEdBRUQsY0FBYyxvQkFBb0I7QUFDbEMsY0FBYyxpQkFBaUI7QUFDL0IsY0FBYywwQkFBMEI7QUFDeEMsY0FBYyx5QkFBeUI7QUFDdkMsY0FBYyxtQkFBbUI7QUFDakMsY0FBYyx3QkFBd0I7QUFDdEMsY0FBYyx5QkFBeUIifQ==