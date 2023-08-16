// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
/*!
 * Adapted directly from negotiator at https://github.com/jshttp/negotiator/
 * which is licensed as follows:
 *
 * (The MIT License)
 *
 * Copyright (c) 2012-2014 Federico Romero
 * Copyright (c) 2012-2014 Isaac Z. Schlueter
 * Copyright (c) 2014-2015 Douglas Christopher Wilson
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * 'Software'), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */ import { compareSpecs, isQuality } from "./common.ts";
const simpleEncodingRegExp = /^\s*([^\s;]+)\s*(?:;(.*))?$/;
function parseEncoding(str, i) {
    const match = simpleEncodingRegExp.exec(str);
    if (!match) {
        return undefined;
    }
    const encoding = match[1];
    let q = 1;
    if (match[2]) {
        const params = match[2].split(";");
        for (const param of params){
            const p = param.trim().split("=");
            if (p[0] === "q") {
                q = parseFloat(p[1]);
                break;
            }
        }
    }
    return {
        encoding,
        q,
        i
    };
}
function specify(encoding, spec, i = -1) {
    if (!spec.encoding) {
        return;
    }
    let s = 0;
    if (spec.encoding.toLocaleLowerCase() === encoding.toLocaleLowerCase()) {
        s = 1;
    } else if (spec.encoding !== "*") {
        return;
    }
    return {
        i,
        o: spec.i,
        q: spec.q,
        s
    };
}
function parseAcceptEncoding(accept) {
    const accepts = accept.split(",");
    const parsedAccepts = [];
    let hasIdentity = false;
    let minQuality = 1;
    for(let i = 0; i < accepts.length; i++){
        const encoding = parseEncoding(accepts[i].trim(), i);
        if (encoding) {
            parsedAccepts.push(encoding);
            hasIdentity = hasIdentity || !!specify("identity", encoding);
            minQuality = Math.min(minQuality, encoding.q || 1);
        }
    }
    if (!hasIdentity) {
        parsedAccepts.push({
            encoding: "identity",
            q: minQuality,
            i: accepts.length - 1
        });
    }
    return parsedAccepts;
}
function getEncodingPriority(encoding, accepted, index) {
    let priority = {
        o: -1,
        q: 0,
        s: 0,
        i: 0
    };
    for (const s of accepted){
        const spec = specify(encoding, s, index);
        if (spec && (priority.s - spec.s || priority.q - spec.q || priority.o - spec.o) < 0) {
            priority = spec;
        }
    }
    return priority;
}
/** Given an `Accept-Encoding` string, parse out the encoding returning a
 * negotiated encoding based on the `provided` encodings otherwise just a
 * prioritized array of encodings. */ export function preferredEncodings(accept, provided) {
    const accepts = parseAcceptEncoding(accept);
    if (!provided) {
        return accepts.filter(isQuality).sort(compareSpecs).map((spec)=>spec.encoding);
    }
    const priorities = provided.map((type, index)=>getEncodingPriority(type, accepts, index));
    return priorities.filter(isQuality).sort(compareSpecs).map((priority)=>provided[priorities.indexOf(priority)]);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5My4wL2h0dHAvX25lZ290aWF0aW9uL2VuY29kaW5nLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjMgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vKiFcbiAqIEFkYXB0ZWQgZGlyZWN0bHkgZnJvbSBuZWdvdGlhdG9yIGF0IGh0dHBzOi8vZ2l0aHViLmNvbS9qc2h0dHAvbmVnb3RpYXRvci9cbiAqIHdoaWNoIGlzIGxpY2Vuc2VkIGFzIGZvbGxvd3M6XG4gKlxuICogKFRoZSBNSVQgTGljZW5zZSlcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTItMjAxNCBGZWRlcmljbyBSb21lcm9cbiAqIENvcHlyaWdodCAoYykgMjAxMi0yMDE0IElzYWFjIFouIFNjaGx1ZXRlclxuICogQ29weXJpZ2h0IChjKSAyMDE0LTIwMTUgRG91Z2xhcyBDaHJpc3RvcGhlciBXaWxzb25cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmdcbiAqIGEgY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuICogJ1NvZnR3YXJlJyksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuICogd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuICogZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvXG4gKiBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG9cbiAqIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZVxuICogaW5jbHVkZWQgaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEICdBUyBJUycsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsXG4gKiBFWFBSRVNTIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0ZcbiAqIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC5cbiAqIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZXG4gKiBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULFxuICogVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEVcbiAqIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuICovXG5cbmltcG9ydCB7IGNvbXBhcmVTcGVjcywgaXNRdWFsaXR5LCBTcGVjaWZpY2l0eSB9IGZyb20gXCIuL2NvbW1vbi50c1wiO1xuXG5pbnRlcmZhY2UgRW5jb2RpbmdTcGVjaWZpY2l0eSBleHRlbmRzIFNwZWNpZmljaXR5IHtcbiAgZW5jb2Rpbmc/OiBzdHJpbmc7XG59XG5cbmNvbnN0IHNpbXBsZUVuY29kaW5nUmVnRXhwID0gL15cXHMqKFteXFxzO10rKVxccyooPzo7KC4qKSk/JC87XG5cbmZ1bmN0aW9uIHBhcnNlRW5jb2RpbmcoXG4gIHN0cjogc3RyaW5nLFxuICBpOiBudW1iZXIsXG4pOiBFbmNvZGluZ1NwZWNpZmljaXR5IHwgdW5kZWZpbmVkIHtcbiAgY29uc3QgbWF0Y2ggPSBzaW1wbGVFbmNvZGluZ1JlZ0V4cC5leGVjKHN0cik7XG4gIGlmICghbWF0Y2gpIHtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgY29uc3QgZW5jb2RpbmcgPSBtYXRjaFsxXTtcbiAgbGV0IHEgPSAxO1xuICBpZiAobWF0Y2hbMl0pIHtcbiAgICBjb25zdCBwYXJhbXMgPSBtYXRjaFsyXS5zcGxpdChcIjtcIik7XG4gICAgZm9yIChjb25zdCBwYXJhbSBvZiBwYXJhbXMpIHtcbiAgICAgIGNvbnN0IHAgPSBwYXJhbS50cmltKCkuc3BsaXQoXCI9XCIpO1xuICAgICAgaWYgKHBbMF0gPT09IFwicVwiKSB7XG4gICAgICAgIHEgPSBwYXJzZUZsb2F0KHBbMV0pO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4geyBlbmNvZGluZywgcSwgaSB9O1xufVxuXG5mdW5jdGlvbiBzcGVjaWZ5KFxuICBlbmNvZGluZzogc3RyaW5nLFxuICBzcGVjOiBFbmNvZGluZ1NwZWNpZmljaXR5LFxuICBpID0gLTEsXG4pOiBTcGVjaWZpY2l0eSB8IHVuZGVmaW5lZCB7XG4gIGlmICghc3BlYy5lbmNvZGluZykge1xuICAgIHJldHVybjtcbiAgfVxuICBsZXQgcyA9IDA7XG4gIGlmIChzcGVjLmVuY29kaW5nLnRvTG9jYWxlTG93ZXJDYXNlKCkgPT09IGVuY29kaW5nLnRvTG9jYWxlTG93ZXJDYXNlKCkpIHtcbiAgICBzID0gMTtcbiAgfSBlbHNlIGlmIChzcGVjLmVuY29kaW5nICE9PSBcIipcIikge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgaSxcbiAgICBvOiBzcGVjLmksXG4gICAgcTogc3BlYy5xLFxuICAgIHMsXG4gIH07XG59XG5cbmZ1bmN0aW9uIHBhcnNlQWNjZXB0RW5jb2RpbmcoYWNjZXB0OiBzdHJpbmcpOiBFbmNvZGluZ1NwZWNpZmljaXR5W10ge1xuICBjb25zdCBhY2NlcHRzID0gYWNjZXB0LnNwbGl0KFwiLFwiKTtcbiAgY29uc3QgcGFyc2VkQWNjZXB0czogRW5jb2RpbmdTcGVjaWZpY2l0eVtdID0gW107XG4gIGxldCBoYXNJZGVudGl0eSA9IGZhbHNlO1xuICBsZXQgbWluUXVhbGl0eSA9IDE7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBhY2NlcHRzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgZW5jb2RpbmcgPSBwYXJzZUVuY29kaW5nKGFjY2VwdHNbaV0udHJpbSgpLCBpKTtcblxuICAgIGlmIChlbmNvZGluZykge1xuICAgICAgcGFyc2VkQWNjZXB0cy5wdXNoKGVuY29kaW5nKTtcbiAgICAgIGhhc0lkZW50aXR5ID0gaGFzSWRlbnRpdHkgfHwgISFzcGVjaWZ5KFwiaWRlbnRpdHlcIiwgZW5jb2RpbmcpO1xuICAgICAgbWluUXVhbGl0eSA9IE1hdGgubWluKG1pblF1YWxpdHksIGVuY29kaW5nLnEgfHwgMSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFoYXNJZGVudGl0eSkge1xuICAgIHBhcnNlZEFjY2VwdHMucHVzaCh7XG4gICAgICBlbmNvZGluZzogXCJpZGVudGl0eVwiLFxuICAgICAgcTogbWluUXVhbGl0eSxcbiAgICAgIGk6IGFjY2VwdHMubGVuZ3RoIC0gMSxcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiBwYXJzZWRBY2NlcHRzO1xufVxuXG5mdW5jdGlvbiBnZXRFbmNvZGluZ1ByaW9yaXR5KFxuICBlbmNvZGluZzogc3RyaW5nLFxuICBhY2NlcHRlZDogU3BlY2lmaWNpdHlbXSxcbiAgaW5kZXg6IG51bWJlcixcbik6IFNwZWNpZmljaXR5IHtcbiAgbGV0IHByaW9yaXR5OiBTcGVjaWZpY2l0eSA9IHsgbzogLTEsIHE6IDAsIHM6IDAsIGk6IDAgfTtcblxuICBmb3IgKGNvbnN0IHMgb2YgYWNjZXB0ZWQpIHtcbiAgICBjb25zdCBzcGVjID0gc3BlY2lmeShlbmNvZGluZywgcywgaW5kZXgpO1xuXG4gICAgaWYgKFxuICAgICAgc3BlYyAmJlxuICAgICAgKHByaW9yaXR5LnMhIC0gc3BlYy5zISB8fCBwcmlvcml0eS5xIC0gc3BlYy5xIHx8XG4gICAgICAgICAgcHJpb3JpdHkubyEgLSBzcGVjLm8hKSA8XG4gICAgICAgIDBcbiAgICApIHtcbiAgICAgIHByaW9yaXR5ID0gc3BlYztcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcHJpb3JpdHk7XG59XG5cbi8qKiBHaXZlbiBhbiBgQWNjZXB0LUVuY29kaW5nYCBzdHJpbmcsIHBhcnNlIG91dCB0aGUgZW5jb2RpbmcgcmV0dXJuaW5nIGFcbiAqIG5lZ290aWF0ZWQgZW5jb2RpbmcgYmFzZWQgb24gdGhlIGBwcm92aWRlZGAgZW5jb2RpbmdzIG90aGVyd2lzZSBqdXN0IGFcbiAqIHByaW9yaXRpemVkIGFycmF5IG9mIGVuY29kaW5ncy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwcmVmZXJyZWRFbmNvZGluZ3MoXG4gIGFjY2VwdDogc3RyaW5nLFxuICBwcm92aWRlZD86IHN0cmluZ1tdLFxuKTogc3RyaW5nW10ge1xuICBjb25zdCBhY2NlcHRzID0gcGFyc2VBY2NlcHRFbmNvZGluZyhhY2NlcHQpO1xuXG4gIGlmICghcHJvdmlkZWQpIHtcbiAgICByZXR1cm4gYWNjZXB0c1xuICAgICAgLmZpbHRlcihpc1F1YWxpdHkpXG4gICAgICAuc29ydChjb21wYXJlU3BlY3MpXG4gICAgICAubWFwKChzcGVjKSA9PiBzcGVjLmVuY29kaW5nISk7XG4gIH1cblxuICBjb25zdCBwcmlvcml0aWVzID0gcHJvdmlkZWQubWFwKCh0eXBlLCBpbmRleCkgPT5cbiAgICBnZXRFbmNvZGluZ1ByaW9yaXR5KHR5cGUsIGFjY2VwdHMsIGluZGV4KVxuICApO1xuXG4gIHJldHVybiBwcmlvcml0aWVzXG4gICAgLmZpbHRlcihpc1F1YWxpdHkpXG4gICAgLnNvcnQoY29tcGFyZVNwZWNzKVxuICAgIC5tYXAoKHByaW9yaXR5KSA9PiBwcm92aWRlZFtwcmlvcml0aWVzLmluZGV4T2YocHJpb3JpdHkpXSk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBNEJDLEdBRUQsU0FBUyxZQUFZLEVBQUUsU0FBUyxRQUFxQixjQUFjO0FBTW5FLE1BQU0sdUJBQXVCO0FBRTdCLFNBQVMsY0FDUCxHQUFXLEVBQ1gsQ0FBUztJQUVULE1BQU0sUUFBUSxxQkFBcUIsS0FBSztJQUN4QyxJQUFJLENBQUMsT0FBTztRQUNWLE9BQU87SUFDVDtJQUVBLE1BQU0sV0FBVyxLQUFLLENBQUMsRUFBRTtJQUN6QixJQUFJLElBQUk7SUFDUixJQUFJLEtBQUssQ0FBQyxFQUFFLEVBQUU7UUFDWixNQUFNLFNBQVMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxNQUFNO1FBQzlCLEtBQUssTUFBTSxTQUFTLE9BQVE7WUFDMUIsTUFBTSxJQUFJLE1BQU0sT0FBTyxNQUFNO1lBQzdCLElBQUksQ0FBQyxDQUFDLEVBQUUsS0FBSyxLQUFLO2dCQUNoQixJQUFJLFdBQVcsQ0FBQyxDQUFDLEVBQUU7Z0JBQ25CO1lBQ0Y7UUFDRjtJQUNGO0lBRUEsT0FBTztRQUFFO1FBQVU7UUFBRztJQUFFO0FBQzFCO0FBRUEsU0FBUyxRQUNQLFFBQWdCLEVBQ2hCLElBQXlCLEVBQ3pCLElBQUksQ0FBQyxDQUFDO0lBRU4sSUFBSSxDQUFDLEtBQUssVUFBVTtRQUNsQjtJQUNGO0lBQ0EsSUFBSSxJQUFJO0lBQ1IsSUFBSSxLQUFLLFNBQVMsd0JBQXdCLFNBQVMscUJBQXFCO1FBQ3RFLElBQUk7SUFDTixPQUFPLElBQUksS0FBSyxhQUFhLEtBQUs7UUFDaEM7SUFDRjtJQUVBLE9BQU87UUFDTDtRQUNBLEdBQUcsS0FBSztRQUNSLEdBQUcsS0FBSztRQUNSO0lBQ0Y7QUFDRjtBQUVBLFNBQVMsb0JBQW9CLE1BQWM7SUFDekMsTUFBTSxVQUFVLE9BQU8sTUFBTTtJQUM3QixNQUFNLGdCQUF1QyxFQUFFO0lBQy9DLElBQUksY0FBYztJQUNsQixJQUFJLGFBQWE7SUFFakIsSUFBSyxJQUFJLElBQUksR0FBRyxJQUFJLFFBQVEsUUFBUSxJQUFLO1FBQ3ZDLE1BQU0sV0FBVyxjQUFjLE9BQU8sQ0FBQyxFQUFFLENBQUMsUUFBUTtRQUVsRCxJQUFJLFVBQVU7WUFDWixjQUFjLEtBQUs7WUFDbkIsY0FBYyxlQUFlLENBQUMsQ0FBQyxRQUFRLFlBQVk7WUFDbkQsYUFBYSxLQUFLLElBQUksWUFBWSxTQUFTLEtBQUs7UUFDbEQ7SUFDRjtJQUVBLElBQUksQ0FBQyxhQUFhO1FBQ2hCLGNBQWMsS0FBSztZQUNqQixVQUFVO1lBQ1YsR0FBRztZQUNILEdBQUcsUUFBUSxTQUFTO1FBQ3RCO0lBQ0Y7SUFFQSxPQUFPO0FBQ1Q7QUFFQSxTQUFTLG9CQUNQLFFBQWdCLEVBQ2hCLFFBQXVCLEVBQ3ZCLEtBQWE7SUFFYixJQUFJLFdBQXdCO1FBQUUsR0FBRyxDQUFDO1FBQUcsR0FBRztRQUFHLEdBQUc7UUFBRyxHQUFHO0lBQUU7SUFFdEQsS0FBSyxNQUFNLEtBQUssU0FBVTtRQUN4QixNQUFNLE9BQU8sUUFBUSxVQUFVLEdBQUc7UUFFbEMsSUFDRSxRQUNBLENBQUMsU0FBUyxJQUFLLEtBQUssS0FBTSxTQUFTLElBQUksS0FBSyxLQUN4QyxTQUFTLElBQUssS0FBSyxDQUFFLElBQ3ZCLEdBQ0Y7WUFDQSxXQUFXO1FBQ2I7SUFDRjtJQUVBLE9BQU87QUFDVDtBQUVBOzttQ0FFbUMsR0FDbkMsT0FBTyxTQUFTLG1CQUNkLE1BQWMsRUFDZCxRQUFtQjtJQUVuQixNQUFNLFVBQVUsb0JBQW9CO0lBRXBDLElBQUksQ0FBQyxVQUFVO1FBQ2IsT0FBTyxRQUNKLE9BQU8sV0FDUCxLQUFLLGNBQ0wsSUFBSSxDQUFDLE9BQVMsS0FBSztJQUN4QjtJQUVBLE1BQU0sYUFBYSxTQUFTLElBQUksQ0FBQyxNQUFNLFFBQ3JDLG9CQUFvQixNQUFNLFNBQVM7SUFHckMsT0FBTyxXQUNKLE9BQU8sV0FDUCxLQUFLLGNBQ0wsSUFBSSxDQUFDLFdBQWEsUUFBUSxDQUFDLFdBQVcsUUFBUSxVQUFVO0FBQzdEIn0=