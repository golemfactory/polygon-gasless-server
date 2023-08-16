// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { DAY, WEEK } from "./constants.ts";
const DAYS_PER_WEEK = 7;
var Day;
(function(Day) {
    Day[Day["Sun"] = 0] = "Sun";
    Day[Day["Mon"] = 1] = "Mon";
    Day[Day["Tue"] = 2] = "Tue";
    Day[Day["Wed"] = 3] = "Wed";
    Day[Day["Thu"] = 4] = "Thu";
    Day[Day["Fri"] = 5] = "Fri";
    Day[Day["Sat"] = 6] = "Sat";
})(Day || (Day = {}));
/**
 * Returns the ISO week number of the provided date (1-53).
 *
 * @example
 * ```ts
 * import { weekOfYear } from "https://deno.land/std@$STD_VERSION/datetime/week_of_year.ts";
 *
 * weekOfYear(new Date("2020-12-28T03:24:00")); // Returns 53
 * ```
 *
 * @return Number of the week in year
 */ export function weekOfYear(date) {
    const workingDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const day = workingDate.getUTCDay();
    const nearestThursday = workingDate.getUTCDate() + Day.Thu - (day === Day.Sun ? DAYS_PER_WEEK : day);
    workingDate.setUTCDate(nearestThursday);
    // Get first day of year
    const yearStart = new Date(Date.UTC(workingDate.getUTCFullYear(), 0, 1));
    // return the calculated full weeks to nearest Thursday
    return Math.ceil((workingDate.getTime() - yearStart.getTime() + DAY) / WEEK);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5OC4wL2RhdGV0aW1lL3dlZWtfb2ZfeWVhci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIzIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQgeyBEQVksIFdFRUsgfSBmcm9tIFwiLi9jb25zdGFudHMudHNcIjtcblxuY29uc3QgREFZU19QRVJfV0VFSyA9IDc7XG5cbmVudW0gRGF5IHtcbiAgU3VuLFxuICBNb24sXG4gIFR1ZSxcbiAgV2VkLFxuICBUaHUsXG4gIEZyaSxcbiAgU2F0LFxufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIElTTyB3ZWVrIG51bWJlciBvZiB0aGUgcHJvdmlkZWQgZGF0ZSAoMS01MykuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyB3ZWVrT2ZZZWFyIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vZGF0ZXRpbWUvd2Vla19vZl95ZWFyLnRzXCI7XG4gKlxuICogd2Vla09mWWVhcihuZXcgRGF0ZShcIjIwMjAtMTItMjhUMDM6MjQ6MDBcIikpOyAvLyBSZXR1cm5zIDUzXG4gKiBgYGBcbiAqXG4gKiBAcmV0dXJuIE51bWJlciBvZiB0aGUgd2VlayBpbiB5ZWFyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3ZWVrT2ZZZWFyKGRhdGU6IERhdGUpOiBudW1iZXIge1xuICBjb25zdCB3b3JraW5nRGF0ZSA9IG5ldyBEYXRlKFxuICAgIERhdGUuVVRDKGRhdGUuZ2V0RnVsbFllYXIoKSwgZGF0ZS5nZXRNb250aCgpLCBkYXRlLmdldERhdGUoKSksXG4gICk7XG5cbiAgY29uc3QgZGF5ID0gd29ya2luZ0RhdGUuZ2V0VVRDRGF5KCk7XG5cbiAgY29uc3QgbmVhcmVzdFRodXJzZGF5ID0gd29ya2luZ0RhdGUuZ2V0VVRDRGF0ZSgpICtcbiAgICBEYXkuVGh1IC1cbiAgICAoZGF5ID09PSBEYXkuU3VuID8gREFZU19QRVJfV0VFSyA6IGRheSk7XG5cbiAgd29ya2luZ0RhdGUuc2V0VVRDRGF0ZShuZWFyZXN0VGh1cnNkYXkpO1xuXG4gIC8vIEdldCBmaXJzdCBkYXkgb2YgeWVhclxuICBjb25zdCB5ZWFyU3RhcnQgPSBuZXcgRGF0ZShEYXRlLlVUQyh3b3JraW5nRGF0ZS5nZXRVVENGdWxsWWVhcigpLCAwLCAxKSk7XG5cbiAgLy8gcmV0dXJuIHRoZSBjYWxjdWxhdGVkIGZ1bGwgd2Vla3MgdG8gbmVhcmVzdCBUaHVyc2RheVxuICByZXR1cm4gTWF0aC5jZWlsKCh3b3JraW5nRGF0ZS5nZXRUaW1lKCkgLSB5ZWFyU3RhcnQuZ2V0VGltZSgpICsgREFZKSAvIFdFRUspO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckMsU0FBUyxHQUFHLEVBQUUsSUFBSSxRQUFRLGlCQUFpQjtBQUUzQyxNQUFNLGdCQUFnQjtJQUV0QjtVQUFLLEdBQUc7SUFBSCxJQUFBLElBQ0gsU0FBQSxLQUFBO0lBREcsSUFBQSxJQUVILFNBQUEsS0FBQTtJQUZHLElBQUEsSUFHSCxTQUFBLEtBQUE7SUFIRyxJQUFBLElBSUgsU0FBQSxLQUFBO0lBSkcsSUFBQSxJQUtILFNBQUEsS0FBQTtJQUxHLElBQUEsSUFNSCxTQUFBLEtBQUE7SUFORyxJQUFBLElBT0gsU0FBQSxLQUFBO0dBUEcsUUFBQTtBQVVMOzs7Ozs7Ozs7OztDQVdDLEdBQ0QsT0FBTyxTQUFTLFdBQVcsSUFBVTtJQUNuQyxNQUFNLGNBQWMsSUFBSSxLQUN0QixLQUFLLElBQUksS0FBSyxlQUFlLEtBQUssWUFBWSxLQUFLO0lBR3JELE1BQU0sTUFBTSxZQUFZO0lBRXhCLE1BQU0sa0JBQWtCLFlBQVksZUFDbEMsSUFBSSxNQUNKLENBQUMsUUFBUSxJQUFJLE1BQU0sZ0JBQWdCLEdBQUc7SUFFeEMsWUFBWSxXQUFXO0lBRXZCLHdCQUF3QjtJQUN4QixNQUFNLFlBQVksSUFBSSxLQUFLLEtBQUssSUFBSSxZQUFZLGtCQUFrQixHQUFHO0lBRXJFLHVEQUF1RDtJQUN2RCxPQUFPLEtBQUssS0FBSyxDQUFDLFlBQVksWUFBWSxVQUFVLFlBQVksR0FBRyxJQUFJO0FBQ3pFIn0=