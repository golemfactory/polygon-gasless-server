// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
/** Supporting functions for media_types that do not make part of the public
 * API.
 *
 * @module
 * @private
 */ /** A map of extensions for a given media type. */ export const extensions = new Map();
export function consumeToken(v) {
    const notPos = indexOf(v, isNotTokenChar);
    if (notPos == -1) {
        return [
            v,
            ""
        ];
    }
    if (notPos == 0) {
        return [
            "",
            v
        ];
    }
    return [
        v.slice(0, notPos),
        v.slice(notPos)
    ];
}
export function consumeValue(v) {
    if (!v) {
        return [
            "",
            v
        ];
    }
    if (v[0] !== `"`) {
        return consumeToken(v);
    }
    let value = "";
    for(let i = 1; i < v.length; i++){
        const r = v[i];
        if (r === `"`) {
            return [
                value,
                v.slice(i + 1)
            ];
        }
        if (r === "\\" && i + 1 < v.length && isTSpecial(v[i + 1])) {
            value += v[i + 1];
            i++;
            continue;
        }
        if (r === "\r" || r === "\n") {
            return [
                "",
                v
            ];
        }
        value += v[i];
    }
    return [
        "",
        v
    ];
}
export function consumeMediaParam(v) {
    let rest = v.trimStart();
    if (!rest.startsWith(";")) {
        return [
            "",
            "",
            v
        ];
    }
    rest = rest.slice(1);
    rest = rest.trimStart();
    let param;
    [param, rest] = consumeToken(rest);
    param = param.toLowerCase();
    if (!param) {
        return [
            "",
            "",
            v
        ];
    }
    rest = rest.slice(1);
    rest = rest.trimStart();
    const [value, rest2] = consumeValue(rest);
    if (value == "" && rest2 === rest) {
        return [
            "",
            "",
            v
        ];
    }
    rest = rest2;
    return [
        param,
        value,
        rest
    ];
}
export function decode2331Encoding(v) {
    const sv = v.split(`'`, 3);
    if (sv.length !== 3) {
        return undefined;
    }
    const charset = sv[0].toLowerCase();
    if (!charset) {
        return undefined;
    }
    if (charset != "us-ascii" && charset != "utf-8") {
        return undefined;
    }
    const encv = decodeURI(sv[2]);
    if (!encv) {
        return undefined;
    }
    return encv;
}
function indexOf(s, fn) {
    let i = -1;
    for (const v of s){
        i++;
        if (fn(v)) {
            return i;
        }
    }
    return -1;
}
export function isIterator(obj) {
    if (obj == null) {
        return false;
    }
    // deno-lint-ignore no-explicit-any
    return typeof obj[Symbol.iterator] === "function";
}
export function isToken(s) {
    if (!s) {
        return false;
    }
    return indexOf(s, isNotTokenChar) < 0;
}
function isNotTokenChar(r) {
    return !isTokenChar(r);
}
function isTokenChar(r) {
    const code = r.charCodeAt(0);
    return code > 0x20 && code < 0x7f && !isTSpecial(r);
}
function isTSpecial(r) {
    return `()<>@,;:\\"/[]?=`.includes(r[0]);
}
const CHAR_CODE_SPACE = " ".charCodeAt(0);
const CHAR_CODE_TILDE = "~".charCodeAt(0);
export function needsEncoding(s) {
    for (const b of s){
        const charCode = b.charCodeAt(0);
        if ((charCode < CHAR_CODE_SPACE || charCode > CHAR_CODE_TILDE) && b !== "\t") {
            return true;
        }
    }
    return false;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5My4wL21lZGlhX3R5cGVzL191dGlsLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjMgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG5cbi8qKiBTdXBwb3J0aW5nIGZ1bmN0aW9ucyBmb3IgbWVkaWFfdHlwZXMgdGhhdCBkbyBub3QgbWFrZSBwYXJ0IG9mIHRoZSBwdWJsaWNcbiAqIEFQSS5cbiAqXG4gKiBAbW9kdWxlXG4gKiBAcHJpdmF0ZVxuICovXG5leHBvcnQgaW50ZXJmYWNlIERCRW50cnkge1xuICBzb3VyY2U6IHN0cmluZztcbiAgY29tcHJlc3NpYmxlPzogYm9vbGVhbjtcbiAgY2hhcnNldD86IHN0cmluZztcbiAgZXh0ZW5zaW9ucz86IHN0cmluZ1tdO1xufVxuXG4vKiogQSBtYXAgb2YgZXh0ZW5zaW9ucyBmb3IgYSBnaXZlbiBtZWRpYSB0eXBlLiAqL1xuZXhwb3J0IGNvbnN0IGV4dGVuc2lvbnMgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nW10+KCk7XG5cbmV4cG9ydCBmdW5jdGlvbiBjb25zdW1lVG9rZW4odjogc3RyaW5nKTogW3Rva2VuOiBzdHJpbmcsIHJlc3Q6IHN0cmluZ10ge1xuICBjb25zdCBub3RQb3MgPSBpbmRleE9mKHYsIGlzTm90VG9rZW5DaGFyKTtcbiAgaWYgKG5vdFBvcyA9PSAtMSkge1xuICAgIHJldHVybiBbdiwgXCJcIl07XG4gIH1cbiAgaWYgKG5vdFBvcyA9PSAwKSB7XG4gICAgcmV0dXJuIFtcIlwiLCB2XTtcbiAgfVxuICByZXR1cm4gW3Yuc2xpY2UoMCwgbm90UG9zKSwgdi5zbGljZShub3RQb3MpXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbnN1bWVWYWx1ZSh2OiBzdHJpbmcpOiBbdmFsdWU6IHN0cmluZywgcmVzdDogc3RyaW5nXSB7XG4gIGlmICghdikge1xuICAgIHJldHVybiBbXCJcIiwgdl07XG4gIH1cbiAgaWYgKHZbMF0gIT09IGBcImApIHtcbiAgICByZXR1cm4gY29uc3VtZVRva2VuKHYpO1xuICB9XG4gIGxldCB2YWx1ZSA9IFwiXCI7XG4gIGZvciAobGV0IGkgPSAxOyBpIDwgdi5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHIgPSB2W2ldO1xuICAgIGlmIChyID09PSBgXCJgKSB7XG4gICAgICByZXR1cm4gW3ZhbHVlLCB2LnNsaWNlKGkgKyAxKV07XG4gICAgfVxuICAgIGlmIChyID09PSBcIlxcXFxcIiAmJiBpICsgMSA8IHYubGVuZ3RoICYmIGlzVFNwZWNpYWwodltpICsgMV0pKSB7XG4gICAgICB2YWx1ZSArPSB2W2kgKyAxXTtcbiAgICAgIGkrKztcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBpZiAociA9PT0gXCJcXHJcIiB8fCByID09PSBcIlxcblwiKSB7XG4gICAgICByZXR1cm4gW1wiXCIsIHZdO1xuICAgIH1cbiAgICB2YWx1ZSArPSB2W2ldO1xuICB9XG4gIHJldHVybiBbXCJcIiwgdl07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb25zdW1lTWVkaWFQYXJhbShcbiAgdjogc3RyaW5nLFxuKTogW2tleTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nLCByZXN0OiBzdHJpbmddIHtcbiAgbGV0IHJlc3QgPSB2LnRyaW1TdGFydCgpO1xuICBpZiAoIXJlc3Quc3RhcnRzV2l0aChcIjtcIikpIHtcbiAgICByZXR1cm4gW1wiXCIsIFwiXCIsIHZdO1xuICB9XG4gIHJlc3QgPSByZXN0LnNsaWNlKDEpO1xuICByZXN0ID0gcmVzdC50cmltU3RhcnQoKTtcbiAgbGV0IHBhcmFtOiBzdHJpbmc7XG4gIFtwYXJhbSwgcmVzdF0gPSBjb25zdW1lVG9rZW4ocmVzdCk7XG4gIHBhcmFtID0gcGFyYW0udG9Mb3dlckNhc2UoKTtcbiAgaWYgKCFwYXJhbSkge1xuICAgIHJldHVybiBbXCJcIiwgXCJcIiwgdl07XG4gIH1cbiAgcmVzdCA9IHJlc3Quc2xpY2UoMSk7XG4gIHJlc3QgPSByZXN0LnRyaW1TdGFydCgpO1xuICBjb25zdCBbdmFsdWUsIHJlc3QyXSA9IGNvbnN1bWVWYWx1ZShyZXN0KTtcbiAgaWYgKHZhbHVlID09IFwiXCIgJiYgcmVzdDIgPT09IHJlc3QpIHtcbiAgICByZXR1cm4gW1wiXCIsIFwiXCIsIHZdO1xuICB9XG4gIHJlc3QgPSByZXN0MjtcbiAgcmV0dXJuIFtwYXJhbSwgdmFsdWUsIHJlc3RdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZGVjb2RlMjMzMUVuY29kaW5nKHY6IHN0cmluZyk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gIGNvbnN0IHN2ID0gdi5zcGxpdChgJ2AsIDMpO1xuICBpZiAoc3YubGVuZ3RoICE9PSAzKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuICBjb25zdCBjaGFyc2V0ID0gc3ZbMF0udG9Mb3dlckNhc2UoKTtcbiAgaWYgKCFjaGFyc2V0KSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuICBpZiAoY2hhcnNldCAhPSBcInVzLWFzY2lpXCIgJiYgY2hhcnNldCAhPSBcInV0Zi04XCIpIHtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG4gIGNvbnN0IGVuY3YgPSBkZWNvZGVVUkkoc3ZbMl0pO1xuICBpZiAoIWVuY3YpIHtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG4gIHJldHVybiBlbmN2O1xufVxuXG5mdW5jdGlvbiBpbmRleE9mPFQ+KHM6IEl0ZXJhYmxlPFQ+LCBmbjogKHM6IFQpID0+IGJvb2xlYW4pOiBudW1iZXIge1xuICBsZXQgaSA9IC0xO1xuICBmb3IgKGNvbnN0IHYgb2Ygcykge1xuICAgIGkrKztcbiAgICBpZiAoZm4odikpIHtcbiAgICAgIHJldHVybiBpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gLTE7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0l0ZXJhdG9yPFQ+KG9iajogdW5rbm93bik6IG9iaiBpcyBJdGVyYWJsZTxUPiB7XG4gIGlmIChvYmogPT0gbnVsbCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICByZXR1cm4gdHlwZW9mIChvYmogYXMgYW55KVtTeW1ib2wuaXRlcmF0b3JdID09PSBcImZ1bmN0aW9uXCI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1Rva2VuKHM6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBpZiAoIXMpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIGluZGV4T2YocywgaXNOb3RUb2tlbkNoYXIpIDwgMDtcbn1cblxuZnVuY3Rpb24gaXNOb3RUb2tlbkNoYXIocjogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHJldHVybiAhaXNUb2tlbkNoYXIocik7XG59XG5cbmZ1bmN0aW9uIGlzVG9rZW5DaGFyKHI6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBjb25zdCBjb2RlID0gci5jaGFyQ29kZUF0KDApO1xuICByZXR1cm4gY29kZSA+IDB4MjAgJiYgY29kZSA8IDB4N2YgJiYgIWlzVFNwZWNpYWwocik7XG59XG5cbmZ1bmN0aW9uIGlzVFNwZWNpYWwocjogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHJldHVybiBgKCk8PkAsOzpcXFxcXCIvW10/PWAuaW5jbHVkZXMoclswXSk7XG59XG5cbmNvbnN0IENIQVJfQ09ERV9TUEFDRSA9IFwiIFwiLmNoYXJDb2RlQXQoMCk7XG5jb25zdCBDSEFSX0NPREVfVElMREUgPSBcIn5cIi5jaGFyQ29kZUF0KDApO1xuXG5leHBvcnQgZnVuY3Rpb24gbmVlZHNFbmNvZGluZyhzOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgZm9yIChjb25zdCBiIG9mIHMpIHtcbiAgICBjb25zdCBjaGFyQ29kZSA9IGIuY2hhckNvZGVBdCgwKTtcbiAgICBpZiAoXG4gICAgICAoY2hhckNvZGUgPCBDSEFSX0NPREVfU1BBQ0UgfHwgY2hhckNvZGUgPiBDSEFSX0NPREVfVElMREUpICYmIGIgIT09IFwiXFx0XCJcbiAgICApIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBRTFFOzs7OztDQUtDLEdBUUQsZ0RBQWdELEdBQ2hELE9BQU8sTUFBTSxhQUFhLElBQUksTUFBd0I7QUFFdEQsT0FBTyxTQUFTLGFBQWEsQ0FBUztJQUNwQyxNQUFNLFNBQVMsUUFBUSxHQUFHO0lBQzFCLElBQUksVUFBVSxDQUFDLEdBQUc7UUFDaEIsT0FBTztZQUFDO1lBQUc7U0FBRztJQUNoQjtJQUNBLElBQUksVUFBVSxHQUFHO1FBQ2YsT0FBTztZQUFDO1lBQUk7U0FBRTtJQUNoQjtJQUNBLE9BQU87UUFBQyxFQUFFLE1BQU0sR0FBRztRQUFTLEVBQUUsTUFBTTtLQUFRO0FBQzlDO0FBRUEsT0FBTyxTQUFTLGFBQWEsQ0FBUztJQUNwQyxJQUFJLENBQUMsR0FBRztRQUNOLE9BQU87WUFBQztZQUFJO1NBQUU7SUFDaEI7SUFDQSxJQUFJLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRTtRQUNoQixPQUFPLGFBQWE7SUFDdEI7SUFDQSxJQUFJLFFBQVE7SUFDWixJQUFLLElBQUksSUFBSSxHQUFHLElBQUksRUFBRSxRQUFRLElBQUs7UUFDakMsTUFBTSxJQUFJLENBQUMsQ0FBQyxFQUFFO1FBQ2QsSUFBSSxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDYixPQUFPO2dCQUFDO2dCQUFPLEVBQUUsTUFBTSxJQUFJO2FBQUc7UUFDaEM7UUFDQSxJQUFJLE1BQU0sUUFBUSxJQUFJLElBQUksRUFBRSxVQUFVLFdBQVcsQ0FBQyxDQUFDLElBQUksRUFBRSxHQUFHO1lBQzFELFNBQVMsQ0FBQyxDQUFDLElBQUksRUFBRTtZQUNqQjtZQUNBO1FBQ0Y7UUFDQSxJQUFJLE1BQU0sUUFBUSxNQUFNLE1BQU07WUFDNUIsT0FBTztnQkFBQztnQkFBSTthQUFFO1FBQ2hCO1FBQ0EsU0FBUyxDQUFDLENBQUMsRUFBRTtJQUNm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