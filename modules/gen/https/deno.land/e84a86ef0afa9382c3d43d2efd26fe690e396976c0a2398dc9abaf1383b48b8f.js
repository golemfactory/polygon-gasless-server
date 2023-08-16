// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/** Check whether binary arrays are equal to each other using 8-bit comparisons.
 * @private
 * @param a first array to check equality
 * @param b second array to check equality
 */ function equalsNaive(a, b) {
    if (a.length !== b.length) return false;
    for(let i = 0; i < b.length; i++){
        if (a[i] !== b[i]) return false;
    }
    return true;
}
/** Check whether binary arrays are equal to each other using 32-bit comparisons.
 * @private
 * @param a first array to check equality
 * @param b second array to check equality
 */ function equalsSimd(a, b) {
    if (a.length !== b.length) return false;
    const len = a.length;
    const compressable = Math.floor(len / 4);
    const compressedA = new Uint32Array(a.buffer, 0, compressable);
    const compressedB = new Uint32Array(b.buffer, 0, compressable);
    for(let i = compressable * 4; i < len; i++){
        if (a[i] !== b[i]) return false;
    }
    for(let i = 0; i < compressedA.length; i++){
        if (compressedA[i] !== compressedB[i]) return false;
    }
    return true;
}
/** Check whether binary arrays are equal to each other.
 * @param a first array to check equality
 * @param b second array to check equality
 */ export function equals(a, b) {
    if (a.length < 1000) return equalsNaive(a, b);
    return equalsSimd(a, b);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjEzMy4wL2J5dGVzL2VxdWFscy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIyIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG4vKiogQ2hlY2sgd2hldGhlciBiaW5hcnkgYXJyYXlzIGFyZSBlcXVhbCB0byBlYWNoIG90aGVyIHVzaW5nIDgtYml0IGNvbXBhcmlzb25zLlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSBhIGZpcnN0IGFycmF5IHRvIGNoZWNrIGVxdWFsaXR5XG4gKiBAcGFyYW0gYiBzZWNvbmQgYXJyYXkgdG8gY2hlY2sgZXF1YWxpdHlcbiAqL1xuZnVuY3Rpb24gZXF1YWxzTmFpdmUoYTogVWludDhBcnJheSwgYjogVWludDhBcnJheSk6IGJvb2xlYW4ge1xuICBpZiAoYS5sZW5ndGggIT09IGIubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYi5sZW5ndGg7IGkrKykge1xuICAgIGlmIChhW2ldICE9PSBiW2ldKSByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbi8qKiBDaGVjayB3aGV0aGVyIGJpbmFyeSBhcnJheXMgYXJlIGVxdWFsIHRvIGVhY2ggb3RoZXIgdXNpbmcgMzItYml0IGNvbXBhcmlzb25zLlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSBhIGZpcnN0IGFycmF5IHRvIGNoZWNrIGVxdWFsaXR5XG4gKiBAcGFyYW0gYiBzZWNvbmQgYXJyYXkgdG8gY2hlY2sgZXF1YWxpdHlcbiAqL1xuZnVuY3Rpb24gZXF1YWxzU2ltZChhOiBVaW50OEFycmF5LCBiOiBVaW50OEFycmF5KTogYm9vbGVhbiB7XG4gIGlmIChhLmxlbmd0aCAhPT0gYi5sZW5ndGgpIHJldHVybiBmYWxzZTtcbiAgY29uc3QgbGVuID0gYS5sZW5ndGg7XG4gIGNvbnN0IGNvbXByZXNzYWJsZSA9IE1hdGguZmxvb3IobGVuIC8gNCk7XG4gIGNvbnN0IGNvbXByZXNzZWRBID0gbmV3IFVpbnQzMkFycmF5KGEuYnVmZmVyLCAwLCBjb21wcmVzc2FibGUpO1xuICBjb25zdCBjb21wcmVzc2VkQiA9IG5ldyBVaW50MzJBcnJheShiLmJ1ZmZlciwgMCwgY29tcHJlc3NhYmxlKTtcbiAgZm9yIChsZXQgaSA9IGNvbXByZXNzYWJsZSAqIDQ7IGkgPCBsZW47IGkrKykge1xuICAgIGlmIChhW2ldICE9PSBiW2ldKSByZXR1cm4gZmFsc2U7XG4gIH1cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb21wcmVzc2VkQS5sZW5ndGg7IGkrKykge1xuICAgIGlmIChjb21wcmVzc2VkQVtpXSAhPT0gY29tcHJlc3NlZEJbaV0pIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLyoqIENoZWNrIHdoZXRoZXIgYmluYXJ5IGFycmF5cyBhcmUgZXF1YWwgdG8gZWFjaCBvdGhlci5cbiAqIEBwYXJhbSBhIGZpcnN0IGFycmF5IHRvIGNoZWNrIGVxdWFsaXR5XG4gKiBAcGFyYW0gYiBzZWNvbmQgYXJyYXkgdG8gY2hlY2sgZXF1YWxpdHlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVxdWFscyhhOiBVaW50OEFycmF5LCBiOiBVaW50OEFycmF5KTogYm9vbGVhbiB7XG4gIGlmIChhLmxlbmd0aCA8IDEwMDApIHJldHVybiBlcXVhbHNOYWl2ZShhLCBiKTtcbiAgcmV0dXJuIGVxdWFsc1NpbWQoYSwgYik7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUVyQzs7OztDQUlDLEdBQ0QsU0FBUyxZQUFZLENBQWEsRUFBRSxDQUFhO0lBQy9DLElBQUksRUFBRSxXQUFXLEVBQUUsUUFBUSxPQUFPO0lBQ2xDLElBQUssSUFBSSxJQUFJLEdBQUcsSUFBSSxFQUFFLFFBQVEsSUFBSztRQUNqQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLEVBQUUsRUFBRSxPQUFPO0lBQzVCO0lBQ0EsT0FBTztBQUNUO0FBRUE7Ozs7Q0FJQyxHQUNELFNBQVMsV0FBVyxDQUFhLEVBQUUsQ0FBYTtJQUM5QyxJQUFJLEVBQUUsV0FBVyxFQUFFLFFBQVEsT0FBTztJQUNsQyxNQUFNLE1BQU0sRUFBRTtJQUNkLE1BQU0sZUFBZSxLQUFLLE1BQU0sTUFBTTtJQUN0QyxNQUFNLGNBQWMsSUFBSSxZQUFZLEVBQUUsUUFBUSxHQUFHO0lBQ2pELE1BQU0sY0FBYyxJQUFJLFlBQVksRUFBRSxRQUFRLEdBQUc7SUFDakQsSUFBSyxJQUFJLElBQUksZUFBZSxHQUFHLElBQUksS0FBSyxJQUFLO1FBQzNDLElBQUksQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsRUFBRSxFQUFFLE9BQU87SUFDNUI7SUFDQSxJQUFLLElBQUksSUFBSSxHQUFHLElBQUksWUFBWSxRQUFRLElBQUs7UUFDM0MsSUFBSSxXQUFXLENBQUMsRUFBRSxLQUFLLFdBQVcsQ0FBQyxFQUFFLEVBQUUsT0FBTztJQUNoRDtJQUNBLE9BQU87QUFDVDtBQUVBOzs7Q0FHQyxHQUNELE9BQU8sU0FBUyxPQUFPLENBQWEsRUFBRSxDQUFhO0lBQ2pELElBQUksRUFBRSxTQUFTLE1BQU0sT0FBTyxZQUFZLEdBQUc7SUFDM0MsT0FBTyxXQUFXLEdBQUc7QUFDdkIifQ==