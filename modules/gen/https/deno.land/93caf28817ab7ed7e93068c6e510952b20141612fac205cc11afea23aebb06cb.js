// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { DateTimeFormatter } from "./_common.ts";
/**
 * Takes an input `date` and a `formatString` to format to a `string`.
 *
 * @example
 * ```ts
 * import { format } from "https://deno.land/std@$STD_VERSION/datetime/format.ts";
 *
 * format(new Date(2019, 0, 20), "dd-MM-yyyy"); // output : "20-01-2019"
 * format(new Date(2019, 0, 20), "yyyy-MM-dd"); // output : "2019-01-20"
 * format(new Date(2019, 0, 20), "dd.MM.yyyy"); // output : "20.01.2019"
 * format(new Date(2019, 0, 20, 16, 34), "MM-dd-yyyy HH:mm"); // output : "01-20-2019 16:34"
 * format(new Date(2019, 0, 20, 16, 34), "MM-dd-yyyy hh:mm a"); // output : "01-20-2019 04:34 PM"
 * format(new Date(2019, 0, 20, 16, 34), "HH:mm MM-dd-yyyy"); // output : "16:34 01-20-2019"
 * format(new Date(2019, 0, 20, 16, 34, 23, 123), "MM-dd-yyyy HH:mm:ss.SSS"); // output : "01-20-2019 16:34:23.123"
 * format(new Date(2019, 0, 20), "'today:' yyyy-MM-dd"); // output : "today: 2019-01-20"
 * ```
 *
 * @param date Date
 * @param formatString Format string
 * @return formatted date string
 */ export function format(date, formatString) {
    const formatter = new DateTimeFormatter(formatString);
    return formatter.format(date);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5OC4wL2RhdGV0aW1lL2Zvcm1hdC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIzIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQgeyBEYXRlVGltZUZvcm1hdHRlciB9IGZyb20gXCIuL19jb21tb24udHNcIjtcblxuLyoqXG4gKiBUYWtlcyBhbiBpbnB1dCBgZGF0ZWAgYW5kIGEgYGZvcm1hdFN0cmluZ2AgdG8gZm9ybWF0IHRvIGEgYHN0cmluZ2AuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBmb3JtYXQgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9kYXRldGltZS9mb3JtYXQudHNcIjtcbiAqXG4gKiBmb3JtYXQobmV3IERhdGUoMjAxOSwgMCwgMjApLCBcImRkLU1NLXl5eXlcIik7IC8vIG91dHB1dCA6IFwiMjAtMDEtMjAxOVwiXG4gKiBmb3JtYXQobmV3IERhdGUoMjAxOSwgMCwgMjApLCBcInl5eXktTU0tZGRcIik7IC8vIG91dHB1dCA6IFwiMjAxOS0wMS0yMFwiXG4gKiBmb3JtYXQobmV3IERhdGUoMjAxOSwgMCwgMjApLCBcImRkLk1NLnl5eXlcIik7IC8vIG91dHB1dCA6IFwiMjAuMDEuMjAxOVwiXG4gKiBmb3JtYXQobmV3IERhdGUoMjAxOSwgMCwgMjAsIDE2LCAzNCksIFwiTU0tZGQteXl5eSBISDptbVwiKTsgLy8gb3V0cHV0IDogXCIwMS0yMC0yMDE5IDE2OjM0XCJcbiAqIGZvcm1hdChuZXcgRGF0ZSgyMDE5LCAwLCAyMCwgMTYsIDM0KSwgXCJNTS1kZC15eXl5IGhoOm1tIGFcIik7IC8vIG91dHB1dCA6IFwiMDEtMjAtMjAxOSAwNDozNCBQTVwiXG4gKiBmb3JtYXQobmV3IERhdGUoMjAxOSwgMCwgMjAsIDE2LCAzNCksIFwiSEg6bW0gTU0tZGQteXl5eVwiKTsgLy8gb3V0cHV0IDogXCIxNjozNCAwMS0yMC0yMDE5XCJcbiAqIGZvcm1hdChuZXcgRGF0ZSgyMDE5LCAwLCAyMCwgMTYsIDM0LCAyMywgMTIzKSwgXCJNTS1kZC15eXl5IEhIOm1tOnNzLlNTU1wiKTsgLy8gb3V0cHV0IDogXCIwMS0yMC0yMDE5IDE2OjM0OjIzLjEyM1wiXG4gKiBmb3JtYXQobmV3IERhdGUoMjAxOSwgMCwgMjApLCBcIid0b2RheTonIHl5eXktTU0tZGRcIik7IC8vIG91dHB1dCA6IFwidG9kYXk6IDIwMTktMDEtMjBcIlxuICogYGBgXG4gKlxuICogQHBhcmFtIGRhdGUgRGF0ZVxuICogQHBhcmFtIGZvcm1hdFN0cmluZyBGb3JtYXQgc3RyaW5nXG4gKiBAcmV0dXJuIGZvcm1hdHRlZCBkYXRlIHN0cmluZ1xuICovXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0KGRhdGU6IERhdGUsIGZvcm1hdFN0cmluZzogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgZm9ybWF0dGVyID0gbmV3IERhdGVUaW1lRm9ybWF0dGVyKGZvcm1hdFN0cmluZyk7XG4gIHJldHVybiBmb3JtYXR0ZXIuZm9ybWF0KGRhdGUpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckMsU0FBUyxpQkFBaUIsUUFBUSxlQUFlO0FBRWpEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQW9CQyxHQUNELE9BQU8sU0FBUyxPQUFPLElBQVUsRUFBRSxZQUFvQjtJQUNyRCxNQUFNLFlBQVksSUFBSSxrQkFBa0I7SUFDeEMsT0FBTyxVQUFVLE9BQU87QUFDMUIifQ==