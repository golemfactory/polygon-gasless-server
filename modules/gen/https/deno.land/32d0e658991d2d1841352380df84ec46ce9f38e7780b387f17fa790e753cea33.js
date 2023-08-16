// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { assert } from "../_util/asserts.ts";
/** Compare to array buffers or data views in a way that timing based attacks
 * cannot gain information about the platform. */ export function timingSafeEqual(a, b) {
    if (a.byteLength !== b.byteLength) {
        return false;
    }
    if (!(a instanceof DataView)) {
        a = ArrayBuffer.isView(a) ? new DataView(a.buffer, a.byteOffset, a.byteLength) : new DataView(a);
    }
    if (!(b instanceof DataView)) {
        b = ArrayBuffer.isView(b) ? new DataView(b.buffer, b.byteOffset, b.byteLength) : new DataView(b);
    }
    assert(a instanceof DataView);
    assert(b instanceof DataView);
    const length = a.byteLength;
    let out = 0;
    let i = -1;
    while(++i < length){
        out |= a.getUint8(i) ^ b.getUint8(i);
    }
    return out === 0;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5My4wL2NyeXB0by90aW1pbmdfc2FmZV9lcXVhbC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIzIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQgeyBhc3NlcnQgfSBmcm9tIFwiLi4vX3V0aWwvYXNzZXJ0cy50c1wiO1xuXG4vKiogQ29tcGFyZSB0byBhcnJheSBidWZmZXJzIG9yIGRhdGEgdmlld3MgaW4gYSB3YXkgdGhhdCB0aW1pbmcgYmFzZWQgYXR0YWNrc1xuICogY2Fubm90IGdhaW4gaW5mb3JtYXRpb24gYWJvdXQgdGhlIHBsYXRmb3JtLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRpbWluZ1NhZmVFcXVhbChcbiAgYTogQXJyYXlCdWZmZXJWaWV3IHwgQXJyYXlCdWZmZXJMaWtlIHwgRGF0YVZpZXcsXG4gIGI6IEFycmF5QnVmZmVyVmlldyB8IEFycmF5QnVmZmVyTGlrZSB8IERhdGFWaWV3LFxuKTogYm9vbGVhbiB7XG4gIGlmIChhLmJ5dGVMZW5ndGggIT09IGIuYnl0ZUxlbmd0aCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAoIShhIGluc3RhbmNlb2YgRGF0YVZpZXcpKSB7XG4gICAgYSA9IEFycmF5QnVmZmVyLmlzVmlldyhhKVxuICAgICAgPyBuZXcgRGF0YVZpZXcoYS5idWZmZXIsIGEuYnl0ZU9mZnNldCwgYS5ieXRlTGVuZ3RoKVxuICAgICAgOiBuZXcgRGF0YVZpZXcoYSk7XG4gIH1cbiAgaWYgKCEoYiBpbnN0YW5jZW9mIERhdGFWaWV3KSkge1xuICAgIGIgPSBBcnJheUJ1ZmZlci5pc1ZpZXcoYilcbiAgICAgID8gbmV3IERhdGFWaWV3KGIuYnVmZmVyLCBiLmJ5dGVPZmZzZXQsIGIuYnl0ZUxlbmd0aClcbiAgICAgIDogbmV3IERhdGFWaWV3KGIpO1xuICB9XG4gIGFzc2VydChhIGluc3RhbmNlb2YgRGF0YVZpZXcpO1xuICBhc3NlcnQoYiBpbnN0YW5jZW9mIERhdGFWaWV3KTtcbiAgY29uc3QgbGVuZ3RoID0gYS5ieXRlTGVuZ3RoO1xuICBsZXQgb3V0ID0gMDtcbiAgbGV0IGkgPSAtMTtcbiAgd2hpbGUgKCsraSA8IGxlbmd0aCkge1xuICAgIG91dCB8PSBhLmdldFVpbnQ4KGkpIF4gYi5nZXRVaW50OChpKTtcbiAgfVxuICByZXR1cm4gb3V0ID09PSAwO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckMsU0FBUyxNQUFNLFFBQVEsc0JBQXNCO0FBRTdDOytDQUMrQyxHQUMvQyxPQUFPLFNBQVMsZ0JBQ2QsQ0FBK0MsRUFDL0MsQ0FBK0M7SUFFL0MsSUFBSSxFQUFFLGVBQWUsRUFBRSxZQUFZO1FBQ2pDLE9BQU87SUFDVDtJQUNBLElBQUksQ0FBQyxDQUFDLGFBQWEsUUFBUSxHQUFHO1FBQzVCLElBQUksWUFBWSxPQUFPLEtBQ25CLElBQUksU0FBUyxFQUFFLFFBQVEsRUFBRSxZQUFZLEVBQUUsY0FDdkMsSUFBSSxTQUFTO0lBQ25CO0lBQ0EsSUFBSSxDQUFDLENBQUMsYUFBYSxRQUFRLEdBQUc7UUFDNUIsSUFBSSxZQUFZLE9BQU8sS0FDbkIsSUFBSSxTQUFTLEVBQUUsUUFBUSxFQUFFLFlBQVksRUFBRSxjQUN2QyxJQUFJLFNBQVM7SUFDbkI7SUFDQSxPQUFPLGFBQWE7SUFDcEIsT0FBTyxhQUFhO0lBQ3BCLE1BQU0sU0FBUyxFQUFFO0lBQ2pCLElBQUksTUFBTTtJQUNWLElBQUksSUFBSSxDQUFDO0lBQ1QsTUFBTyxFQUFFLElBQUksT0FBUTtRQUNuQixPQUFPLEVBQUUsU0FBUyxLQUFLLEVBQUUsU0FBUztJQUNwQztJQUNBLE9BQU8sUUFBUTtBQUNqQiJ9