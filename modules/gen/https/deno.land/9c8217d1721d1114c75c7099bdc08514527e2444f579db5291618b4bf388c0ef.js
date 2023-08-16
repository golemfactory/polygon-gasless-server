/*!
 * Adapted directly from forwarded-parse at https://github.com/lpinca/forwarded-parse
 * which is licensed as follows:
 *
 * Copyright(c) 2015 Luigi Pinca
 * Copyright(c) 2023 the oak authors
 * MIT Licensed
 */ /**
 * Provides utilities for parsing and validating the `Forwarded` header.
 *
 * @module
 */ import { assert } from "./util.ts";
/**
 * Unescape a string.
 *
 * @param str The string to unescape.
 * @returns A new unescaped string.
 */ function decode(value) {
    return value.replace(/\\(.)/g, "$1");
}
/**
 * Check if a character is a delimiter as defined in section 3.2.6 of RFC 7230.
 *
 * @param code The code of the character to check.
 * @returns `true` if the character is a delimiter, else `false`.
 */ function isDelimiter(code) {
    return code === 0x22 || // '"'
    code === 0x28 || // '('
    code === 0x29 || // ')'
    code === 0x2C || // ','
    code === 0x2F || // '/'
    code >= 0x3A && code <= 0x40 || // ':', ';', '<', '=', '>', '?' '@'
    code >= 0x5B && code <= 0x5D || // '[', '\', ']'
    code === 0x7B || // '{'
    code === 0x7D; // '}'
}
/**
 * Check if a character is an extended ASCII character.
 *
 * @param code The code of the character to check.
 * @returns `true` if `code` is in the %x80-FF range, else `false`.
 */ function isExtended(code) {
    return code >= 0x80 && code <= 0xFF;
}
/**
 * Check if a character is a printable ASCII character.
 *
 * @param code The code of the character to check.
 * @returns `true` if `code` is in the %x20-7E range, else `false`.
 */ function isPrint(code) {
    return code >= 0x20 && code <= 0x7E;
}
/**
 * Check if a character is allowed in a token as defined in section 3.2.6
 * of RFC 7230.
 *
 * @param code The code of the character to check.
 * @returns `true` if the character is allowed, else `false`.
 */ function isTokenChar(code) {
    return code === 0x21 || // '!'
    code >= 0x23 && code <= 0x27 || // '#', '$', '%', '&', '''
    code === 0x2A || // '*'
    code === 0x2B || // '+'
    code === 0x2D || // '-'
    code === 0x2E || // '.'
    code >= 0x30 && code <= 0x39 || // 0-9
    code >= 0x41 && code <= 0x5A || // A-Z
    code >= 0x5E && code <= 0x7A || // '^', '_', '`', a-z
    code === 0x7C || // '|'
    code === 0x7E; // '~'
}
/**
 * Parse the `Forwarded` header field value into an array of objects. If the
 * value is not parsable, `undefined` is returned.
 *
 * @param value The header field value.
 */ export function parse(value) {
    let parameter;
    let start = -1;
    let end = -1;
    let isEscaping = false;
    let inQuotes = false;
    let mustUnescape = false;
    let code;
    let forwarded = {};
    const output = [];
    let i;
    for(i = 0; i < value.length; i++){
        code = value.charCodeAt(i);
        if (parameter === undefined) {
            if (i !== 0 && start === -1 && (code === 0x20 || code === 0x09)) {
                continue;
            }
            if (isTokenChar(code)) {
                if (start === -1) {
                    start = i;
                }
            } else if (code === 0x3D && start !== -1) {
                parameter = value.slice(start, i).toLowerCase();
                start = -1;
            } else {
                return undefined;
            }
        } else {
            if (isEscaping && (code === 0x09 || isPrint(code) || isExtended(code))) {
                isEscaping = false;
            } else if (isTokenChar(code)) {
                if (end !== -1) {
                    return undefined;
                }
                if (start === -1) {
                    start = i;
                }
            } else if (isDelimiter(code) || isExtended(code)) {
                if (inQuotes) {
                    if (code === 0x22) {
                        inQuotes = false;
                        end = i;
                    } else if (code === 0x5C) {
                        if (start === -1) {
                            start = i;
                        }
                        isEscaping = mustUnescape = true;
                    } else if (start === -1) {
                        start = i;
                    }
                } else if (code === 0x22 && value.charCodeAt(i - 1) === 0x3D) {
                    inQuotes = true;
                } else if ((code === 0x2C || code === 0x3B) && (start !== -1 || end !== -1)) {
                    assert(parameter, "Variable 'parameter' not defined.");
                    if (start !== -1) {
                        if (end === -1) {
                            end = i;
                        }
                        forwarded[parameter] = mustUnescape ? decode(value.slice(start, end)) : value.slice(start, end);
                    } else {
                        forwarded[parameter] = "";
                    }
                    if (code === 0x2C) {
                        output.push(forwarded);
                        forwarded = {};
                    }
                    parameter = undefined;
                    start = end = -1;
                } else {
                    return undefined;
                }
            } else if (code === 0x20 || code === 0x09) {
                if (end !== -1) {
                    continue;
                }
                if (inQuotes) {
                    if (start === -1) {
                        start = i;
                    }
                } else if (start !== -1) {
                    end = i;
                } else {
                    return undefined;
                }
            } else {
                return undefined;
            }
        }
    }
    if (parameter === undefined || inQuotes || start === -1 && end === -1 || code === 0x20 || code === 0x09) {
        return undefined;
    }
    if (start !== -1) {
        if (end === -1) {
            end = i;
        }
        forwarded[parameter] = mustUnescape ? decode(value.slice(start, end)) : value.slice(start, end);
    } else {
        forwarded[parameter] = "";
    }
    output.push(forwarded);
    return output;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvb2FrQHYxMi42LjAvZm9yd2FyZGVkLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qIVxuICogQWRhcHRlZCBkaXJlY3RseSBmcm9tIGZvcndhcmRlZC1wYXJzZSBhdCBodHRwczovL2dpdGh1Yi5jb20vbHBpbmNhL2ZvcndhcmRlZC1wYXJzZVxuICogd2hpY2ggaXMgbGljZW5zZWQgYXMgZm9sbG93czpcbiAqXG4gKiBDb3B5cmlnaHQoYykgMjAxNSBMdWlnaSBQaW5jYVxuICogQ29weXJpZ2h0KGMpIDIwMjMgdGhlIG9hayBhdXRob3JzXG4gKiBNSVQgTGljZW5zZWRcbiAqL1xuXG4vKipcbiAqIFByb3ZpZGVzIHV0aWxpdGllcyBmb3IgcGFyc2luZyBhbmQgdmFsaWRhdGluZyB0aGUgYEZvcndhcmRlZGAgaGVhZGVyLlxuICpcbiAqIEBtb2R1bGVcbiAqL1xuXG5pbXBvcnQgeyBhc3NlcnQgfSBmcm9tIFwiLi91dGlsLnRzXCI7XG5cbi8qKlxuICogVW5lc2NhcGUgYSBzdHJpbmcuXG4gKlxuICogQHBhcmFtIHN0ciBUaGUgc3RyaW5nIHRvIHVuZXNjYXBlLlxuICogQHJldHVybnMgQSBuZXcgdW5lc2NhcGVkIHN0cmluZy5cbiAqL1xuZnVuY3Rpb24gZGVjb2RlKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdmFsdWUucmVwbGFjZSgvXFxcXCguKS9nLCBcIiQxXCIpO1xufVxuXG4vKipcbiAqIENoZWNrIGlmIGEgY2hhcmFjdGVyIGlzIGEgZGVsaW1pdGVyIGFzIGRlZmluZWQgaW4gc2VjdGlvbiAzLjIuNiBvZiBSRkMgNzIzMC5cbiAqXG4gKiBAcGFyYW0gY29kZSBUaGUgY29kZSBvZiB0aGUgY2hhcmFjdGVyIHRvIGNoZWNrLlxuICogQHJldHVybnMgYHRydWVgIGlmIHRoZSBjaGFyYWN0ZXIgaXMgYSBkZWxpbWl0ZXIsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gaXNEZWxpbWl0ZXIoY29kZTogbnVtYmVyKTogYm9vbGVhbiB7XG4gIHJldHVybiBjb2RlID09PSAweDIyIHx8IC8vICdcIidcbiAgICBjb2RlID09PSAweDI4IHx8IC8vICcoJ1xuICAgIGNvZGUgPT09IDB4MjkgfHwgLy8gJyknXG4gICAgY29kZSA9PT0gMHgyQyB8fCAvLyAnLCdcbiAgICBjb2RlID09PSAweDJGIHx8IC8vICcvJ1xuICAgIGNvZGUgPj0gMHgzQSAmJiBjb2RlIDw9IDB4NDAgfHwgLy8gJzonLCAnOycsICc8JywgJz0nLCAnPicsICc/JyAnQCdcbiAgICBjb2RlID49IDB4NUIgJiYgY29kZSA8PSAweDVEIHx8IC8vICdbJywgJ1xcJywgJ10nXG4gICAgY29kZSA9PT0gMHg3QiB8fCAvLyAneydcbiAgICBjb2RlID09PSAweDdEOyAvLyAnfSdcbn1cblxuLyoqXG4gKiBDaGVjayBpZiBhIGNoYXJhY3RlciBpcyBhbiBleHRlbmRlZCBBU0NJSSBjaGFyYWN0ZXIuXG4gKlxuICogQHBhcmFtIGNvZGUgVGhlIGNvZGUgb2YgdGhlIGNoYXJhY3RlciB0byBjaGVjay5cbiAqIEByZXR1cm5zIGB0cnVlYCBpZiBgY29kZWAgaXMgaW4gdGhlICV4ODAtRkYgcmFuZ2UsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gaXNFeHRlbmRlZChjb2RlOiBudW1iZXIpOiBib29sZWFuIHtcbiAgcmV0dXJuIGNvZGUgPj0gMHg4MCAmJiBjb2RlIDw9IDB4RkY7XG59XG5cbi8qKlxuICogQ2hlY2sgaWYgYSBjaGFyYWN0ZXIgaXMgYSBwcmludGFibGUgQVNDSUkgY2hhcmFjdGVyLlxuICpcbiAqIEBwYXJhbSBjb2RlIFRoZSBjb2RlIG9mIHRoZSBjaGFyYWN0ZXIgdG8gY2hlY2suXG4gKiBAcmV0dXJucyBgdHJ1ZWAgaWYgYGNvZGVgIGlzIGluIHRoZSAleDIwLTdFIHJhbmdlLCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGlzUHJpbnQoY29kZTogbnVtYmVyKTogYm9vbGVhbiB7XG4gIHJldHVybiBjb2RlID49IDB4MjAgJiYgY29kZSA8PSAweDdFO1xufVxuXG4vKipcbiAqIENoZWNrIGlmIGEgY2hhcmFjdGVyIGlzIGFsbG93ZWQgaW4gYSB0b2tlbiBhcyBkZWZpbmVkIGluIHNlY3Rpb24gMy4yLjZcbiAqIG9mIFJGQyA3MjMwLlxuICpcbiAqIEBwYXJhbSBjb2RlIFRoZSBjb2RlIG9mIHRoZSBjaGFyYWN0ZXIgdG8gY2hlY2suXG4gKiBAcmV0dXJucyBgdHJ1ZWAgaWYgdGhlIGNoYXJhY3RlciBpcyBhbGxvd2VkLCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGlzVG9rZW5DaGFyKGNvZGU6IG51bWJlcik6IGJvb2xlYW4ge1xuICByZXR1cm4gY29kZSA9PT0gMHgyMSB8fCAvLyAnISdcbiAgICBjb2RlID49IDB4MjMgJiYgY29kZSA8PSAweDI3IHx8IC8vICcjJywgJyQnLCAnJScsICcmJywgJycnXG4gICAgY29kZSA9PT0gMHgyQSB8fCAvLyAnKidcbiAgICBjb2RlID09PSAweDJCIHx8IC8vICcrJ1xuICAgIGNvZGUgPT09IDB4MkQgfHwgLy8gJy0nXG4gICAgY29kZSA9PT0gMHgyRSB8fCAvLyAnLidcbiAgICBjb2RlID49IDB4MzAgJiYgY29kZSA8PSAweDM5IHx8IC8vIDAtOVxuICAgIGNvZGUgPj0gMHg0MSAmJiBjb2RlIDw9IDB4NUEgfHwgLy8gQS1aXG4gICAgY29kZSA+PSAweDVFICYmIGNvZGUgPD0gMHg3QSB8fCAvLyAnXicsICdfJywgJ2AnLCBhLXpcbiAgICBjb2RlID09PSAweDdDIHx8IC8vICd8J1xuICAgIGNvZGUgPT09IDB4N0U7IC8vICd+J1xufVxuXG4vKipcbiAqIFBhcnNlIHRoZSBgRm9yd2FyZGVkYCBoZWFkZXIgZmllbGQgdmFsdWUgaW50byBhbiBhcnJheSBvZiBvYmplY3RzLiBJZiB0aGVcbiAqIHZhbHVlIGlzIG5vdCBwYXJzYWJsZSwgYHVuZGVmaW5lZGAgaXMgcmV0dXJuZWQuXG4gKlxuICogQHBhcmFtIHZhbHVlIFRoZSBoZWFkZXIgZmllbGQgdmFsdWUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZSh2YWx1ZTogc3RyaW5nKTogUmVjb3JkPHN0cmluZywgc3RyaW5nPltdIHwgdW5kZWZpbmVkIHtcbiAgbGV0IHBhcmFtZXRlcjogdW5kZWZpbmVkIHwgc3RyaW5nO1xuICBsZXQgc3RhcnQgPSAtMTtcbiAgbGV0IGVuZCA9IC0xO1xuICBsZXQgaXNFc2NhcGluZyA9IGZhbHNlO1xuICBsZXQgaW5RdW90ZXMgPSBmYWxzZTtcbiAgbGV0IG11c3RVbmVzY2FwZSA9IGZhbHNlO1xuXG4gIGxldCBjb2RlO1xuICBsZXQgZm9yd2FyZGVkOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XG4gIGNvbnN0IG91dHB1dDogUmVjb3JkPHN0cmluZywgc3RyaW5nPltdID0gW107XG4gIGxldCBpO1xuXG4gIGZvciAoaSA9IDA7IGkgPCB2YWx1ZS5sZW5ndGg7IGkrKykge1xuICAgIGNvZGUgPSB2YWx1ZS5jaGFyQ29kZUF0KGkpO1xuXG4gICAgaWYgKHBhcmFtZXRlciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAoaSAhPT0gMCAmJiBzdGFydCA9PT0gLTEgJiYgKGNvZGUgPT09IDB4MjAgfHwgY29kZSA9PT0gMHgwOSkpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChpc1Rva2VuQ2hhcihjb2RlKSkge1xuICAgICAgICBpZiAoc3RhcnQgPT09IC0xKSB7XG4gICAgICAgICAgc3RhcnQgPSBpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGNvZGUgPT09IDB4M0QgJiYgc3RhcnQgIT09IC0xKSB7XG4gICAgICAgIHBhcmFtZXRlciA9IHZhbHVlLnNsaWNlKHN0YXJ0LCBpKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICBzdGFydCA9IC0xO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKFxuICAgICAgICBpc0VzY2FwaW5nICYmIChjb2RlID09PSAweDA5IHx8IGlzUHJpbnQoY29kZSkgfHwgaXNFeHRlbmRlZChjb2RlKSlcbiAgICAgICkge1xuICAgICAgICBpc0VzY2FwaW5nID0gZmFsc2U7XG4gICAgICB9IGVsc2UgaWYgKGlzVG9rZW5DaGFyKGNvZGUpKSB7XG4gICAgICAgIGlmIChlbmQgIT09IC0xKSB7XG4gICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3RhcnQgPT09IC0xKSB7XG4gICAgICAgICAgc3RhcnQgPSBpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGlzRGVsaW1pdGVyKGNvZGUpIHx8IGlzRXh0ZW5kZWQoY29kZSkpIHtcbiAgICAgICAgaWYgKGluUXVvdGVzKSB7XG4gICAgICAgICAgaWYgKGNvZGUgPT09IDB4MjIpIHtcbiAgICAgICAgICAgIGluUXVvdGVzID0gZmFsc2U7XG4gICAgICAgICAgICBlbmQgPSBpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoY29kZSA9PT0gMHg1Qykge1xuICAgICAgICAgICAgaWYgKHN0YXJ0ID09PSAtMSkge1xuICAgICAgICAgICAgICBzdGFydCA9IGk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpc0VzY2FwaW5nID0gbXVzdFVuZXNjYXBlID0gdHJ1ZTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHN0YXJ0ID09PSAtMSkge1xuICAgICAgICAgICAgc3RhcnQgPSBpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChjb2RlID09PSAweDIyICYmIHZhbHVlLmNoYXJDb2RlQXQoaSAtIDEpID09PSAweDNEKSB7XG4gICAgICAgICAgaW5RdW90ZXMgPSB0cnVlO1xuICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgIChjb2RlID09PSAweDJDIHx8IGNvZGUgPT09IDB4M0IpICYmIChzdGFydCAhPT0gLTEgfHwgZW5kICE9PSAtMSlcbiAgICAgICAgKSB7XG4gICAgICAgICAgYXNzZXJ0KHBhcmFtZXRlciwgXCJWYXJpYWJsZSAncGFyYW1ldGVyJyBub3QgZGVmaW5lZC5cIik7XG4gICAgICAgICAgaWYgKHN0YXJ0ICE9PSAtMSkge1xuICAgICAgICAgICAgaWYgKGVuZCA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgZW5kID0gaTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yd2FyZGVkW3BhcmFtZXRlcl0gPSBtdXN0VW5lc2NhcGVcbiAgICAgICAgICAgICAgPyBkZWNvZGUodmFsdWUuc2xpY2Uoc3RhcnQsIGVuZCkpXG4gICAgICAgICAgICAgIDogdmFsdWUuc2xpY2Uoc3RhcnQsIGVuZCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvcndhcmRlZFtwYXJhbWV0ZXJdID0gXCJcIjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoY29kZSA9PT0gMHgyQykge1xuICAgICAgICAgICAgb3V0cHV0LnB1c2goZm9yd2FyZGVkKTtcbiAgICAgICAgICAgIGZvcndhcmRlZCA9IHt9O1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHBhcmFtZXRlciA9IHVuZGVmaW5lZDtcbiAgICAgICAgICBzdGFydCA9IGVuZCA9IC0xO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoY29kZSA9PT0gMHgyMCB8fCBjb2RlID09PSAweDA5KSB7XG4gICAgICAgIGlmIChlbmQgIT09IC0xKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaW5RdW90ZXMpIHtcbiAgICAgICAgICBpZiAoc3RhcnQgPT09IC0xKSB7XG4gICAgICAgICAgICBzdGFydCA9IGk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHN0YXJ0ICE9PSAtMSkge1xuICAgICAgICAgIGVuZCA9IGk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAoXG4gICAgcGFyYW1ldGVyID09PSB1bmRlZmluZWQgfHwgaW5RdW90ZXMgfHwgKHN0YXJ0ID09PSAtMSAmJiBlbmQgPT09IC0xKSB8fFxuICAgIGNvZGUgPT09IDB4MjAgfHwgY29kZSA9PT0gMHgwOVxuICApIHtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgaWYgKHN0YXJ0ICE9PSAtMSkge1xuICAgIGlmIChlbmQgPT09IC0xKSB7XG4gICAgICBlbmQgPSBpO1xuICAgIH1cbiAgICBmb3J3YXJkZWRbcGFyYW1ldGVyXSA9IG11c3RVbmVzY2FwZVxuICAgICAgPyBkZWNvZGUodmFsdWUuc2xpY2Uoc3RhcnQsIGVuZCkpXG4gICAgICA6IHZhbHVlLnNsaWNlKHN0YXJ0LCBlbmQpO1xuICB9IGVsc2Uge1xuICAgIGZvcndhcmRlZFtwYXJhbWV0ZXJdID0gXCJcIjtcbiAgfVxuXG4gIG91dHB1dC5wdXNoKGZvcndhcmRlZCk7XG4gIHJldHVybiBvdXRwdXQ7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Q0FPQyxHQUVEOzs7O0NBSUMsR0FFRCxTQUFTLE1BQU0sUUFBUSxZQUFZO0FBRW5DOzs7OztDQUtDLEdBQ0QsU0FBUyxPQUFPLEtBQWE7SUFDM0IsT0FBTyxNQUFNLFFBQVEsVUFBVTtBQUNqQztBQUVBOzs7OztDQUtDLEdBQ0QsU0FBUyxZQUFZLElBQVk7SUFDL0IsT0FBTyxTQUFTLFFBQVEsTUFBTTtJQUM1QixTQUFTLFFBQVEsTUFBTTtJQUN2QixTQUFTLFFBQVEsTUFBTTtJQUN2QixTQUFTLFFBQVEsTUFBTTtJQUN2QixTQUFTLFFBQVEsTUFBTTtJQUN2QixRQUFRLFFBQVEsUUFBUSxRQUFRLG1DQUFtQztJQUNuRSxRQUFRLFFBQVEsUUFBUSxRQUFRLGdCQUFnQjtJQUNoRCxTQUFTLFFBQVEs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