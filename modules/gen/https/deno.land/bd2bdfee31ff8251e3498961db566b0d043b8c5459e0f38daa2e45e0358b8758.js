// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { DateTimeFormatter } from "./_common.ts";
/**
 * Takes an input `string` and a `formatString` to parse to a `date`.
 *
 * @example
 * ```ts
 * import { parse } from "https://deno.land/std@$STD_VERSION/datetime/parse.ts";
 *
 * parse("20-01-2019", "dd-MM-yyyy"); // output : new Date(2019, 0, 20)
 * parse("2019-01-20", "yyyy-MM-dd"); // output : new Date(2019, 0, 20)
 * parse("20.01.2019", "dd.MM.yyyy"); // output : new Date(2019, 0, 20)
 * parse("01-20-2019 16:34", "MM-dd-yyyy HH:mm"); // output : new Date(2019, 0, 20, 16, 34)
 * parse("01-20-2019 04:34 PM", "MM-dd-yyyy hh:mm a"); // output : new Date(2019, 0, 20, 16, 34)
 * parse("16:34 01-20-2019", "HH:mm MM-dd-yyyy"); // output : new Date(2019, 0, 20, 16, 34)
 * parse("01-20-2019 16:34:23.123", "MM-dd-yyyy HH:mm:ss.SSS"); // output : new Date(2019, 0, 20, 16, 34, 23, 123)
 * ```
 *
 * @param dateString Date string
 * @param formatString Format string
 * @return Parsed date
 */ export function parse(dateString, formatString) {
    const formatter = new DateTimeFormatter(formatString);
    const parts = formatter.parseToParts(dateString);
    const sortParts = formatter.sortDateTimeFormatPart(parts);
    return formatter.partsToDate(sortParts);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5OC4wL2RhdGV0aW1lL3BhcnNlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjMgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbmltcG9ydCB7IERhdGVUaW1lRm9ybWF0dGVyIH0gZnJvbSBcIi4vX2NvbW1vbi50c1wiO1xuXG4vKipcbiAqIFRha2VzIGFuIGlucHV0IGBzdHJpbmdgIGFuZCBhIGBmb3JtYXRTdHJpbmdgIHRvIHBhcnNlIHRvIGEgYGRhdGVgLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgcGFyc2UgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9kYXRldGltZS9wYXJzZS50c1wiO1xuICpcbiAqIHBhcnNlKFwiMjAtMDEtMjAxOVwiLCBcImRkLU1NLXl5eXlcIik7IC8vIG91dHB1dCA6IG5ldyBEYXRlKDIwMTksIDAsIDIwKVxuICogcGFyc2UoXCIyMDE5LTAxLTIwXCIsIFwieXl5eS1NTS1kZFwiKTsgLy8gb3V0cHV0IDogbmV3IERhdGUoMjAxOSwgMCwgMjApXG4gKiBwYXJzZShcIjIwLjAxLjIwMTlcIiwgXCJkZC5NTS55eXl5XCIpOyAvLyBvdXRwdXQgOiBuZXcgRGF0ZSgyMDE5LCAwLCAyMClcbiAqIHBhcnNlKFwiMDEtMjAtMjAxOSAxNjozNFwiLCBcIk1NLWRkLXl5eXkgSEg6bW1cIik7IC8vIG91dHB1dCA6IG5ldyBEYXRlKDIwMTksIDAsIDIwLCAxNiwgMzQpXG4gKiBwYXJzZShcIjAxLTIwLTIwMTkgMDQ6MzQgUE1cIiwgXCJNTS1kZC15eXl5IGhoOm1tIGFcIik7IC8vIG91dHB1dCA6IG5ldyBEYXRlKDIwMTksIDAsIDIwLCAxNiwgMzQpXG4gKiBwYXJzZShcIjE2OjM0IDAxLTIwLTIwMTlcIiwgXCJISDptbSBNTS1kZC15eXl5XCIpOyAvLyBvdXRwdXQgOiBuZXcgRGF0ZSgyMDE5LCAwLCAyMCwgMTYsIDM0KVxuICogcGFyc2UoXCIwMS0yMC0yMDE5IDE2OjM0OjIzLjEyM1wiLCBcIk1NLWRkLXl5eXkgSEg6bW06c3MuU1NTXCIpOyAvLyBvdXRwdXQgOiBuZXcgRGF0ZSgyMDE5LCAwLCAyMCwgMTYsIDM0LCAyMywgMTIzKVxuICogYGBgXG4gKlxuICogQHBhcmFtIGRhdGVTdHJpbmcgRGF0ZSBzdHJpbmdcbiAqIEBwYXJhbSBmb3JtYXRTdHJpbmcgRm9ybWF0IHN0cmluZ1xuICogQHJldHVybiBQYXJzZWQgZGF0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2UoZGF0ZVN0cmluZzogc3RyaW5nLCBmb3JtYXRTdHJpbmc6IHN0cmluZyk6IERhdGUge1xuICBjb25zdCBmb3JtYXR0ZXIgPSBuZXcgRGF0ZVRpbWVGb3JtYXR0ZXIoZm9ybWF0U3RyaW5nKTtcbiAgY29uc3QgcGFydHMgPSBmb3JtYXR0ZXIucGFyc2VUb1BhcnRzKGRhdGVTdHJpbmcpO1xuICBjb25zdCBzb3J0UGFydHMgPSBmb3JtYXR0ZXIuc29ydERhdGVUaW1lRm9ybWF0UGFydChwYXJ0cyk7XG4gIHJldHVybiBmb3JtYXR0ZXIucGFydHNUb0RhdGUoc29ydFBhcnRzKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDLFNBQVMsaUJBQWlCLFFBQVEsZUFBZTtBQUVqRDs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQW1CQyxHQUNELE9BQU8sU0FBUyxNQUFNLFVBQWtCLEVBQUUsWUFBb0I7SUFDNUQsTUFBTSxZQUFZLElBQUksa0JBQWtCO0lBQ3hDLE1BQU0sUUFBUSxVQUFVLGFBQWE7SUFDckMsTUFBTSxZQUFZLFVBQVUsdUJBQXVCO0lBQ25ELE9BQU8sVUFBVSxZQUFZO0FBQy9CIn0=