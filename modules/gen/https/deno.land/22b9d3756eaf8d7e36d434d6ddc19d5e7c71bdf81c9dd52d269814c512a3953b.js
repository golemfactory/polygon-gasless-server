// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { DAY, HOUR, MINUTE, SECOND, WEEK } from "./constants.ts";
function calculateMonthsDifference(from, to) {
    let months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
    if (to.getDate() < from.getDate()) {
        months--;
    }
    return months;
}
/**
 * Returns the difference of the 2 given dates in the given units. If the units
 * are omitted, it returns the difference in the all available units.
 *
 * @example
 * ```ts
 * import { difference } from "https://deno.land/std@$STD_VERSION/datetime/difference.ts";
 *
 * const date0 = new Date("2018-05-14");
 * const date1 = new Date("2020-05-13");
 *
 * difference(date0, date1, { units: ["days", "months", "years"] });
 * // => returns { days: 730, months: 23, years: 1 }
 *
 * difference(date0, date1);
 * // => returns {
 * //   milliseconds: 63072000000,
 * //   seconds: 63072000,
 * //   minutes: 1051200,
 * //   hours: 17520,
 * //   days: 730,
 * //   weeks: 104,
 * //   months: 23,
 * //   quarters: 7,
 * //   years: 1
 * // }
 * ```
 *
 * @param from Year to calculate difference
 * @param to Year to calculate difference with
 * @param options Options for determining how to respond
 */ export function difference(from, to, options) {
    [from, to] = from < to ? [
        from,
        to
    ] : [
        to,
        from
    ];
    const uniqueUnits = options?.units ? [
        ...new Set(options?.units)
    ] : [
        "milliseconds",
        "seconds",
        "minutes",
        "hours",
        "days",
        "weeks",
        "months",
        "quarters",
        "years"
    ];
    const differenceInMs = Math.abs(from.getTime() - to.getTime());
    const differences = {};
    for (const uniqueUnit of uniqueUnits){
        switch(uniqueUnit){
            case "milliseconds":
                differences.milliseconds = differenceInMs;
                break;
            case "seconds":
                differences.seconds = Math.floor(differenceInMs / SECOND);
                break;
            case "minutes":
                differences.minutes = Math.floor(differenceInMs / MINUTE);
                break;
            case "hours":
                differences.hours = Math.floor(differenceInMs / HOUR);
                break;
            case "days":
                differences.days = Math.floor(differenceInMs / DAY);
                break;
            case "weeks":
                differences.weeks = Math.floor(differenceInMs / WEEK);
                break;
            case "months":
                differences.months = calculateMonthsDifference(from, to);
                break;
            case "quarters":
                differences.quarters = Math.floor(differences.months !== undefined && differences.months / 3 || calculateMonthsDifference(from, to) / 3);
                break;
            case "years":
                differences.years = Math.floor(differences.months !== undefined && differences.months / 12 || calculateMonthsDifference(from, to) / 12);
                break;
        }
    }
    return differences;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5OC4wL2RhdGV0aW1lL2RpZmZlcmVuY2UudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMyB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuaW1wb3J0IHsgREFZLCBIT1VSLCBNSU5VVEUsIFNFQ09ORCwgV0VFSyB9IGZyb20gXCIuL2NvbnN0YW50cy50c1wiO1xuXG5leHBvcnQgdHlwZSBVbml0ID1cbiAgfCBcIm1pbGxpc2Vjb25kc1wiXG4gIHwgXCJzZWNvbmRzXCJcbiAgfCBcIm1pbnV0ZXNcIlxuICB8IFwiaG91cnNcIlxuICB8IFwiZGF5c1wiXG4gIHwgXCJ3ZWVrc1wiXG4gIHwgXCJtb250aHNcIlxuICB8IFwicXVhcnRlcnNcIlxuICB8IFwieWVhcnNcIjtcblxuZXhwb3J0IHR5cGUgRGlmZmVyZW5jZUZvcm1hdCA9IFBhcnRpYWw8UmVjb3JkPFVuaXQsIG51bWJlcj4+O1xuXG5leHBvcnQgdHlwZSBEaWZmZXJlbmNlT3B0aW9ucyA9IHtcbiAgdW5pdHM/OiBVbml0W107XG59O1xuXG5mdW5jdGlvbiBjYWxjdWxhdGVNb250aHNEaWZmZXJlbmNlKGZyb206IERhdGUsIHRvOiBEYXRlKTogbnVtYmVyIHtcbiAgbGV0IG1vbnRocyA9ICh0by5nZXRGdWxsWWVhcigpIC0gZnJvbS5nZXRGdWxsWWVhcigpKSAqIDEyICtcbiAgICAodG8uZ2V0TW9udGgoKSAtIGZyb20uZ2V0TW9udGgoKSk7XG4gIGlmICh0by5nZXREYXRlKCkgPCBmcm9tLmdldERhdGUoKSkge1xuICAgIG1vbnRocy0tO1xuICB9XG4gIHJldHVybiBtb250aHM7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgZGlmZmVyZW5jZSBvZiB0aGUgMiBnaXZlbiBkYXRlcyBpbiB0aGUgZ2l2ZW4gdW5pdHMuIElmIHRoZSB1bml0c1xuICogYXJlIG9taXR0ZWQsIGl0IHJldHVybnMgdGhlIGRpZmZlcmVuY2UgaW4gdGhlIGFsbCBhdmFpbGFibGUgdW5pdHMuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBkaWZmZXJlbmNlIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vZGF0ZXRpbWUvZGlmZmVyZW5jZS50c1wiO1xuICpcbiAqIGNvbnN0IGRhdGUwID0gbmV3IERhdGUoXCIyMDE4LTA1LTE0XCIpO1xuICogY29uc3QgZGF0ZTEgPSBuZXcgRGF0ZShcIjIwMjAtMDUtMTNcIik7XG4gKlxuICogZGlmZmVyZW5jZShkYXRlMCwgZGF0ZTEsIHsgdW5pdHM6IFtcImRheXNcIiwgXCJtb250aHNcIiwgXCJ5ZWFyc1wiXSB9KTtcbiAqIC8vID0+IHJldHVybnMgeyBkYXlzOiA3MzAsIG1vbnRoczogMjMsIHllYXJzOiAxIH1cbiAqXG4gKiBkaWZmZXJlbmNlKGRhdGUwLCBkYXRlMSk7XG4gKiAvLyA9PiByZXR1cm5zIHtcbiAqIC8vICAgbWlsbGlzZWNvbmRzOiA2MzA3MjAwMDAwMCxcbiAqIC8vICAgc2Vjb25kczogNjMwNzIwMDAsXG4gKiAvLyAgIG1pbnV0ZXM6IDEwNTEyMDAsXG4gKiAvLyAgIGhvdXJzOiAxNzUyMCxcbiAqIC8vICAgZGF5czogNzMwLFxuICogLy8gICB3ZWVrczogMTA0LFxuICogLy8gICBtb250aHM6IDIzLFxuICogLy8gICBxdWFydGVyczogNyxcbiAqIC8vICAgeWVhcnM6IDFcbiAqIC8vIH1cbiAqIGBgYFxuICpcbiAqIEBwYXJhbSBmcm9tIFllYXIgdG8gY2FsY3VsYXRlIGRpZmZlcmVuY2VcbiAqIEBwYXJhbSB0byBZZWFyIHRvIGNhbGN1bGF0ZSBkaWZmZXJlbmNlIHdpdGhcbiAqIEBwYXJhbSBvcHRpb25zIE9wdGlvbnMgZm9yIGRldGVybWluaW5nIGhvdyB0byByZXNwb25kXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaWZmZXJlbmNlKFxuICBmcm9tOiBEYXRlLFxuICB0bzogRGF0ZSxcbiAgb3B0aW9ucz86IERpZmZlcmVuY2VPcHRpb25zLFxuKTogRGlmZmVyZW5jZUZvcm1hdCB7XG4gIFtmcm9tLCB0b10gPSBmcm9tIDwgdG8gPyBbZnJvbSwgdG9dIDogW3RvLCBmcm9tXTtcbiAgY29uc3QgdW5pcXVlVW5pdHMgPSBvcHRpb25zPy51bml0cyA/IFsuLi5uZXcgU2V0KG9wdGlvbnM/LnVuaXRzKV0gOiBbXG4gICAgXCJtaWxsaXNlY29uZHNcIixcbiAgICBcInNlY29uZHNcIixcbiAgICBcIm1pbnV0ZXNcIixcbiAgICBcImhvdXJzXCIsXG4gICAgXCJkYXlzXCIsXG4gICAgXCJ3ZWVrc1wiLFxuICAgIFwibW9udGhzXCIsXG4gICAgXCJxdWFydGVyc1wiLFxuICAgIFwieWVhcnNcIixcbiAgXTtcblxuICBjb25zdCBkaWZmZXJlbmNlSW5NcyA9IE1hdGguYWJzKGZyb20uZ2V0VGltZSgpIC0gdG8uZ2V0VGltZSgpKTtcblxuICBjb25zdCBkaWZmZXJlbmNlczogRGlmZmVyZW5jZUZvcm1hdCA9IHt9O1xuXG4gIGZvciAoY29uc3QgdW5pcXVlVW5pdCBvZiB1bmlxdWVVbml0cykge1xuICAgIHN3aXRjaCAodW5pcXVlVW5pdCkge1xuICAgICAgY2FzZSBcIm1pbGxpc2Vjb25kc1wiOlxuICAgICAgICBkaWZmZXJlbmNlcy5taWxsaXNlY29uZHMgPSBkaWZmZXJlbmNlSW5NcztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwic2Vjb25kc1wiOlxuICAgICAgICBkaWZmZXJlbmNlcy5zZWNvbmRzID0gTWF0aC5mbG9vcihkaWZmZXJlbmNlSW5NcyAvIFNFQ09ORCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIm1pbnV0ZXNcIjpcbiAgICAgICAgZGlmZmVyZW5jZXMubWludXRlcyA9IE1hdGguZmxvb3IoZGlmZmVyZW5jZUluTXMgLyBNSU5VVEUpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJob3Vyc1wiOlxuICAgICAgICBkaWZmZXJlbmNlcy5ob3VycyA9IE1hdGguZmxvb3IoZGlmZmVyZW5jZUluTXMgLyBIT1VSKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiZGF5c1wiOlxuICAgICAgICBkaWZmZXJlbmNlcy5kYXlzID0gTWF0aC5mbG9vcihkaWZmZXJlbmNlSW5NcyAvIERBWSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIndlZWtzXCI6XG4gICAgICAgIGRpZmZlcmVuY2VzLndlZWtzID0gTWF0aC5mbG9vcihkaWZmZXJlbmNlSW5NcyAvIFdFRUspO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJtb250aHNcIjpcbiAgICAgICAgZGlmZmVyZW5jZXMubW9udGhzID0gY2FsY3VsYXRlTW9udGhzRGlmZmVyZW5jZShmcm9tLCB0byk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcInF1YXJ0ZXJzXCI6XG4gICAgICAgIGRpZmZlcmVuY2VzLnF1YXJ0ZXJzID0gTWF0aC5mbG9vcihcbiAgICAgICAgICAoZGlmZmVyZW5jZXMubW9udGhzICE9PSB1bmRlZmluZWQgJiYgZGlmZmVyZW5jZXMubW9udGhzIC8gMykgfHxcbiAgICAgICAgICAgIGNhbGN1bGF0ZU1vbnRoc0RpZmZlcmVuY2UoZnJvbSwgdG8pIC8gMyxcbiAgICAgICAgKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwieWVhcnNcIjpcbiAgICAgICAgZGlmZmVyZW5jZXMueWVhcnMgPSBNYXRoLmZsb29yKFxuICAgICAgICAgIChkaWZmZXJlbmNlcy5tb250aHMgIT09IHVuZGVmaW5lZCAmJiBkaWZmZXJlbmNlcy5tb250aHMgLyAxMikgfHxcbiAgICAgICAgICAgIGNhbGN1bGF0ZU1vbnRoc0RpZmZlcmVuY2UoZnJvbSwgdG8pIC8gMTIsXG4gICAgICAgICk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBkaWZmZXJlbmNlcztcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDLFNBQVMsR0FBRyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLElBQUksUUFBUSxpQkFBaUI7QUFtQmpFLFNBQVMsMEJBQTBCLElBQVUsRUFBRSxFQUFRO0lBQ3JELElBQUksU0FBUyxDQUFDLEdBQUcsZ0JBQWdCLEtBQUssYUFBYSxJQUFJLEtBQ3JELENBQUMsR0FBRyxhQUFhLEtBQUssVUFBVTtJQUNsQyxJQUFJLEdBQUcsWUFBWSxLQUFLLFdBQVc7UUFDakM7SUFDRjtJQUNBLE9BQU87QUFDVDtBQUVBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBK0JDLEdBQ0QsT0FBTyxTQUFTLFdBQ2QsSUFBVSxFQUNWLEVBQVEsRUFDUixPQUEyQjtJQUUzQixDQUFDLE1BQU0sR0FBRyxHQUFHLE9BQU8sS0FBSztRQUFDO1FBQU07S0FBRyxHQUFHO1FBQUM7UUFBSTtLQUFLO0lBQ2hELE1BQU0sY0FBYyxTQUFTLFFBQVE7V0FBSSxJQUFJLElBQUksU0FBUztLQUFPLEdBQUc7UUFDbEU7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO0tBQ0Q7SUFFRCxNQUFNLGlCQUFpQixLQUFLLElBQUksS0FBSyxZQUFZLEdBQUc7SUFFcEQsTUFBTSxjQUFnQyxDQUFDO0lBRXZDLEtBQUssTUFBTSxjQUFjLFlBQWE7UUFDcEMsT0FBUTtZQUNOLEtBQUs7Z0JBQ0gsWUFBWSxlQUFlO2dCQUMzQjtZQUNGLEtBQUs7Z0JBQ0gsWUFBWSxVQUFVLEtBQUssTUFBTSxpQkFBaUI7Z0JBQ2xEO1lBQ0YsS0FBSztnQkFDSCxZQUFZLFVBQVUsS0FBSyxNQUFNLGlCQUFpQjtnQkFDbEQ7WUFDRixLQUFLO2dCQUNILFlBQVksUUFBUSxLQUFLLE1BQU0saUJBQWlCO2dCQUNoRDtZQUNGLEtBQUs7Z0JBQ0gsWUFBWSxPQUFPLEtBQUssTUFBTSxpQkFBaUI7Z0JBQy9DO1lBQ0YsS0FBSztnQkFDSCxZQUFZLFFBQVEsS0FBSyxNQUFNLGlCQUFpQjtnQkFDaEQ7WUFDRixLQUFLO2dCQUNILFlBQVksU0FBUywwQkFBMEIsTUFBTTtnQkFDckQ7WUFDRixLQUFLO2dCQUNILFlBQVksV0FBVyxLQUFLLE1BQzFCLEFBQUMsWUFBWSxXQUFXLGFBQWEsWUFBWSxTQUFTLEtBQ3hELDBCQUEwQixNQUFNLE1BQU07Z0JBRTFDO1lBQ0YsS0FBSztnQkFDSCxZQUFZLFFBQVEsS0FBSyxNQUN2QixBQUFDLFlBQVksV0FBVyxhQUFhLFlBQVksU0FBUyxNQUN4RCwwQkFBMEIsTUFBTSxNQUFNO2dCQUUxQztRQUNKO0lBQ0Y7SUFFQSxPQUFPO0FBQ1QifQ==