// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
/**
 * Utilities for working with Deno's readers, writers, and web streams.
 *
 * `Reader` and `Writer` interfaces are deprecated in Deno, and so many of these
 * utilities are also deprecated. Consider using web streams instead.
 *
 * @module
 */ export * from "./buf_reader.ts";
export * from "./buf_writer.ts";
export * from "./buffer.ts";
export * from "./copy_n.ts";
export * from "./limited_reader.ts";
export * from "./multi_reader.ts";
export * from "./read_delim.ts";
export * from "./read_int.ts";
export * from "./read_lines.ts";
export * from "./read_long.ts";
export * from "./read_range.ts";
export * from "./read_short.ts";
export * from "./read_string_delim.ts";
export * from "./slice_long_to_bytes.ts";
export * from "./string_reader.ts";
export * from "./string_writer.ts";
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5My4wL2lvL21vZC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIzIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuXG4vKipcbiAqIFV0aWxpdGllcyBmb3Igd29ya2luZyB3aXRoIERlbm8ncyByZWFkZXJzLCB3cml0ZXJzLCBhbmQgd2ViIHN0cmVhbXMuXG4gKlxuICogYFJlYWRlcmAgYW5kIGBXcml0ZXJgIGludGVyZmFjZXMgYXJlIGRlcHJlY2F0ZWQgaW4gRGVubywgYW5kIHNvIG1hbnkgb2YgdGhlc2VcbiAqIHV0aWxpdGllcyBhcmUgYWxzbyBkZXByZWNhdGVkLiBDb25zaWRlciB1c2luZyB3ZWIgc3RyZWFtcyBpbnN0ZWFkLlxuICpcbiAqIEBtb2R1bGVcbiAqL1xuXG5leHBvcnQgKiBmcm9tIFwiLi9idWZfcmVhZGVyLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9idWZfd3JpdGVyLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9idWZmZXIudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL2NvcHlfbi50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vbGltaXRlZF9yZWFkZXIudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL211bHRpX3JlYWRlci50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vcmVhZF9kZWxpbS50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vcmVhZF9pbnQudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL3JlYWRfbGluZXMudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL3JlYWRfbG9uZy50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vcmVhZF9yYW5nZS50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vcmVhZF9zaG9ydC50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vcmVhZF9zdHJpbmdfZGVsaW0udHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL3NsaWNlX2xvbmdfdG9fYnl0ZXMudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL3N0cmluZ19yZWFkZXIudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL3N0cmluZ193cml0ZXIudHNcIjtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFFMUU7Ozs7Ozs7Q0FPQyxHQUVELGNBQWMsa0JBQWtCO0FBQ2hDLGNBQWMsa0JBQWtCO0FBQ2hDLGNBQWMsY0FBYztBQUM1QixjQUFjLGNBQWM7QUFDNUIsY0FBYyxzQkFBc0I7QUFDcEMsY0FBYyxvQkFBb0I7QUFDbEMsY0FBYyxrQkFBa0I7QUFDaEMsY0FBYyxnQkFBZ0I7QUFDOUIsY0FBYyxrQkFBa0I7QUFDaEMsY0FBYyxpQkFBaUI7QUFDL0IsY0FBYyxrQkFBa0I7QUFDaEMsY0FBYyxrQkFBa0I7QUFDaEMsY0FBYyx5QkFBeUI7QUFDdkMsY0FBYywyQkFBMkI7QUFDekMsY0FBYyxxQkFBcUI7QUFDbkMsY0FBYyxxQkFBcUIifQ==