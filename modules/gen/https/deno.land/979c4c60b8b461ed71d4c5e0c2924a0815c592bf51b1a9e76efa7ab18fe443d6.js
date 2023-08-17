// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Copyright the Browserify authors. MIT License.
// Ported from https://github.com/browserify/path-browserify/
// This module is browser compatible.
import { CHAR_BACKWARD_SLASH, CHAR_DOT, CHAR_FORWARD_SLASH, CHAR_LOWERCASE_A, CHAR_LOWERCASE_Z, CHAR_UPPERCASE_A, CHAR_UPPERCASE_Z } from "./_constants.ts";
export function assertPath(path) {
    if (typeof path !== "string") {
        throw new TypeError(`Path must be a string. Received ${JSON.stringify(path)}`);
    }
}
export function isPosixPathSeparator(code) {
    return code === CHAR_FORWARD_SLASH;
}
export function isPathSeparator(code) {
    return isPosixPathSeparator(code) || code === CHAR_BACKWARD_SLASH;
}
export function isWindowsDeviceRoot(code) {
    return code >= CHAR_LOWERCASE_A && code <= CHAR_LOWERCASE_Z || code >= CHAR_UPPERCASE_A && code <= CHAR_UPPERCASE_Z;
}
// Resolves . and .. elements in a path with directory names
export function normalizeString(path, allowAboveRoot, separator, isPathSeparator) {
    let res = "";
    let lastSegmentLength = 0;
    let lastSlash = -1;
    let dots = 0;
    let code;
    for(let i = 0, len = path.length; i <= len; ++i){
        if (i < len) code = path.charCodeAt(i);
        else if (isPathSeparator(code)) break;
        else code = CHAR_FORWARD_SLASH;
        if (isPathSeparator(code)) {
            if (lastSlash === i - 1 || dots === 1) {
            // NOOP
            } else if (lastSlash !== i - 1 && dots === 2) {
                if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== CHAR_DOT || res.charCodeAt(res.length - 2) !== CHAR_DOT) {
                    if (res.length > 2) {
                        const lastSlashIndex = res.lastIndexOf(separator);
                        if (lastSlashIndex === -1) {
                            res = "";
                            lastSegmentLength = 0;
                        } else {
                            res = res.slice(0, lastSlashIndex);
                            lastSegmentLength = res.length - 1 - res.lastIndexOf(separator);
                        }
                        lastSlash = i;
                        dots = 0;
                        continue;
                    } else if (res.length === 2 || res.length === 1) {
                        res = "";
                        lastSegmentLength = 0;
                        lastSlash = i;
                        dots = 0;
                        continue;
                    }
                }
                if (allowAboveRoot) {
                    if (res.length > 0) res += `${separator}..`;
                    else res = "..";
                    lastSegmentLength = 2;
                }
            } else {
                if (res.length > 0) res += separator + path.slice(lastSlash + 1, i);
                else res = path.slice(lastSlash + 1, i);
                lastSegmentLength = i - lastSlash - 1;
            }
            lastSlash = i;
            dots = 0;
        } else if (code === CHAR_DOT && dots !== -1) {
            ++dots;
        } else {
            dots = -1;
        }
    }
    return res;
}
export function _format(sep, pathObject) {
    const dir = pathObject.dir || pathObject.root;
    const base = pathObject.base || (pathObject.name || "") + (pathObject.ext || "");
    if (!dir) return base;
    if (base === sep) return dir;
    if (dir === pathObject.root) return dir + base;
    return dir + sep + base;
}
const WHITESPACE_ENCODINGS = {
    "\u0009": "%09",
    "\u000A": "%0A",
    "\u000B": "%0B",
    "\u000C": "%0C",
    "\u000D": "%0D",
    "\u0020": "%20"
};
export function encodeWhitespace(string) {
    return string.replaceAll(/[\s]/g, (c)=>{
        return WHITESPACE_ENCODINGS[c] ?? c;
    });
}
export function lastPathSegment(path, isSep, start = 0) {
    let matchedNonSeparator = false;
    let end = path.length;
    for(let i = path.length - 1; i >= start; --i){
        if (isSep(path.charCodeAt(i))) {
            if (matchedNonSeparator) {
                start = i + 1;
                break;
            }
        } else if (!matchedNonSeparator) {
            matchedNonSeparator = true;
            end = i + 1;
        }
    }
    return path.slice(start, end);
}
export function stripTrailingSeparators(segment, isSep) {
    if (segment.length <= 1) {
        return segment;
    }
    let end = segment.length;
    for(let i = segment.length - 1; i > 0; i--){
        if (isSep(segment.charCodeAt(i))) {
            end = i;
        } else {
            break;
        }
    }
    return segment.slice(0, end);
}
export function stripSuffix(name, suffix) {
    if (suffix.length >= name.length) {
        return name;
    }
    const lenDiff = name.length - suffix.length;
    for(let i = suffix.length - 1; i >= 0; --i){
        if (name.charCodeAt(lenDiff + i) !== suffix.charCodeAt(i)) {
            return name;
        }
    }
    return name.slice(0, -suffix.length);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5My4wL3BhdGgvX3V0aWwudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMyB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIENvcHlyaWdodCB0aGUgQnJvd3NlcmlmeSBhdXRob3JzLiBNSVQgTGljZW5zZS5cbi8vIFBvcnRlZCBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9icm93c2VyaWZ5L3BhdGgtYnJvd3NlcmlmeS9cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuaW1wb3J0IHR5cGUgeyBGb3JtYXRJbnB1dFBhdGhPYmplY3QgfSBmcm9tIFwiLi9faW50ZXJmYWNlLnRzXCI7XG5pbXBvcnQge1xuICBDSEFSX0JBQ0tXQVJEX1NMQVNILFxuICBDSEFSX0RPVCxcbiAgQ0hBUl9GT1JXQVJEX1NMQVNILFxuICBDSEFSX0xPV0VSQ0FTRV9BLFxuICBDSEFSX0xPV0VSQ0FTRV9aLFxuICBDSEFSX1VQUEVSQ0FTRV9BLFxuICBDSEFSX1VQUEVSQ0FTRV9aLFxufSBmcm9tIFwiLi9fY29uc3RhbnRzLnRzXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRQYXRoKHBhdGg6IHN0cmluZykge1xuICBpZiAodHlwZW9mIHBhdGggIT09IFwic3RyaW5nXCIpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgYFBhdGggbXVzdCBiZSBhIHN0cmluZy4gUmVjZWl2ZWQgJHtKU09OLnN0cmluZ2lmeShwYXRoKX1gLFxuICAgICk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzUG9zaXhQYXRoU2VwYXJhdG9yKGNvZGU6IG51bWJlcik6IGJvb2xlYW4ge1xuICByZXR1cm4gY29kZSA9PT0gQ0hBUl9GT1JXQVJEX1NMQVNIO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNQYXRoU2VwYXJhdG9yKGNvZGU6IG51bWJlcik6IGJvb2xlYW4ge1xuICByZXR1cm4gaXNQb3NpeFBhdGhTZXBhcmF0b3IoY29kZSkgfHwgY29kZSA9PT0gQ0hBUl9CQUNLV0FSRF9TTEFTSDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzV2luZG93c0RldmljZVJvb3QoY29kZTogbnVtYmVyKTogYm9vbGVhbiB7XG4gIHJldHVybiAoXG4gICAgKGNvZGUgPj0gQ0hBUl9MT1dFUkNBU0VfQSAmJiBjb2RlIDw9IENIQVJfTE9XRVJDQVNFX1opIHx8XG4gICAgKGNvZGUgPj0gQ0hBUl9VUFBFUkNBU0VfQSAmJiBjb2RlIDw9IENIQVJfVVBQRVJDQVNFX1opXG4gICk7XG59XG5cbi8vIFJlc29sdmVzIC4gYW5kIC4uIGVsZW1lbnRzIGluIGEgcGF0aCB3aXRoIGRpcmVjdG9yeSBuYW1lc1xuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZVN0cmluZyhcbiAgcGF0aDogc3RyaW5nLFxuICBhbGxvd0Fib3ZlUm9vdDogYm9vbGVhbixcbiAgc2VwYXJhdG9yOiBzdHJpbmcsXG4gIGlzUGF0aFNlcGFyYXRvcjogKGNvZGU6IG51bWJlcikgPT4gYm9vbGVhbixcbik6IHN0cmluZyB7XG4gIGxldCByZXMgPSBcIlwiO1xuICBsZXQgbGFzdFNlZ21lbnRMZW5ndGggPSAwO1xuICBsZXQgbGFzdFNsYXNoID0gLTE7XG4gIGxldCBkb3RzID0gMDtcbiAgbGV0IGNvZGU6IG51bWJlciB8IHVuZGVmaW5lZDtcbiAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IHBhdGgubGVuZ3RoOyBpIDw9IGxlbjsgKytpKSB7XG4gICAgaWYgKGkgPCBsZW4pIGNvZGUgPSBwYXRoLmNoYXJDb2RlQXQoaSk7XG4gICAgZWxzZSBpZiAoaXNQYXRoU2VwYXJhdG9yKGNvZGUhKSkgYnJlYWs7XG4gICAgZWxzZSBjb2RlID0gQ0hBUl9GT1JXQVJEX1NMQVNIO1xuXG4gICAgaWYgKGlzUGF0aFNlcGFyYXRvcihjb2RlISkpIHtcbiAgICAgIGlmIChsYXN0U2xhc2ggPT09IGkgLSAxIHx8IGRvdHMgPT09IDEpIHtcbiAgICAgICAgLy8gTk9PUFxuICAgICAgfSBlbHNlIGlmIChsYXN0U2xhc2ggIT09IGkgLSAxICYmIGRvdHMgPT09IDIpIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIHJlcy5sZW5ndGggPCAyIHx8XG4gICAgICAgICAgbGFzdFNlZ21lbnRMZW5ndGggIT09IDIgfHxcbiAgICAgICAgICByZXMuY2hhckNvZGVBdChyZXMubGVuZ3RoIC0gMSkgIT09IENIQVJfRE9UIHx8XG4gICAgICAgICAgcmVzLmNoYXJDb2RlQXQocmVzLmxlbmd0aCAtIDIpICE9PSBDSEFSX0RPVFxuICAgICAgICApIHtcbiAgICAgICAgICBpZiAocmVzLmxlbmd0aCA+IDIpIHtcbiAgICAgICAgICAgIGNvbnN0IGxhc3RTbGFzaEluZGV4ID0gcmVzLmxhc3RJbmRleE9mKHNlcGFyYXRvcik7XG4gICAgICAgICAgICBpZiAobGFzdFNsYXNoSW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICAgIHJlcyA9IFwiXCI7XG4gICAgICAgICAgICAgIGxhc3RTZWdtZW50TGVuZ3RoID0gMDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJlcyA9IHJlcy5zbGljZSgwLCBsYXN0U2xhc2hJbmRleCk7XG4gICAgICAgICAgICAgIGxhc3RTZWdtZW50TGVuZ3RoID0gcmVzLmxlbmd0aCAtIDEgLSByZXMubGFzdEluZGV4T2Yoc2VwYXJhdG9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxhc3RTbGFzaCA9IGk7XG4gICAgICAgICAgICBkb3RzID0gMDtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH0gZWxzZSBpZiAocmVzLmxlbmd0aCA9PT0gMiB8fCByZXMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICByZXMgPSBcIlwiO1xuICAgICAgICAgICAgbGFzdFNlZ21lbnRMZW5ndGggPSAwO1xuICAgICAgICAgICAgbGFzdFNsYXNoID0gaTtcbiAgICAgICAgICAgIGRvdHMgPSAwO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChhbGxvd0Fib3ZlUm9vdCkge1xuICAgICAgICAgIGlmIChyZXMubGVuZ3RoID4gMCkgcmVzICs9IGAke3NlcGFyYXRvcn0uLmA7XG4gICAgICAgICAgZWxzZSByZXMgPSBcIi4uXCI7XG4gICAgICAgICAgbGFzdFNlZ21lbnRMZW5ndGggPSAyO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAocmVzLmxlbmd0aCA+IDApIHJlcyArPSBzZXBhcmF0b3IgKyBwYXRoLnNsaWNlKGxhc3RTbGFzaCArIDEsIGkpO1xuICAgICAgICBlbHNlIHJlcyA9IHBhdGguc2xpY2UobGFzdFNsYXNoICsgMSwgaSk7XG4gICAgICAgIGxhc3RTZWdtZW50TGVuZ3RoID0gaSAtIGxhc3RTbGFzaCAtIDE7XG4gICAgICB9XG4gICAgICBsYXN0U2xhc2ggPSBpO1xuICAgICAgZG90cyA9IDA7XG4gICAgfSBlbHNlIGlmIChjb2RlID09PSBDSEFSX0RPVCAmJiBkb3RzICE9PSAtMSkge1xuICAgICAgKytkb3RzO1xuICAgIH0gZWxzZSB7XG4gICAgICBkb3RzID0gLTE7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfZm9ybWF0KFxuICBzZXA6IHN0cmluZyxcbiAgcGF0aE9iamVjdDogRm9ybWF0SW5wdXRQYXRoT2JqZWN0LFxuKTogc3RyaW5nIHtcbiAgY29uc3QgZGlyOiBzdHJpbmcgfCB1bmRlZmluZWQgPSBwYXRoT2JqZWN0LmRpciB8fCBwYXRoT2JqZWN0LnJvb3Q7XG4gIGNvbnN0IGJhc2U6IHN0cmluZyA9IHBhdGhPYmplY3QuYmFzZSB8fFxuICAgIChwYXRoT2JqZWN0Lm5hbWUgfHwgXCJcIikgKyAocGF0aE9iamVjdC5leHQgfHwgXCJcIik7XG4gIGlmICghZGlyKSByZXR1cm4gYmFzZTtcbiAgaWYgKGJhc2UgPT09IHNlcCkgcmV0dXJuIGRpcjtcbiAgaWYgKGRpciA9PT0gcGF0aE9iamVjdC5yb290KSByZXR1cm4gZGlyICsgYmFzZTtcbiAgcmV0dXJuIGRpciArIHNlcCArIGJhc2U7XG59XG5cbmNvbnN0IFdISVRFU1BBQ0VfRU5DT0RJTkdTOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICBcIlxcdTAwMDlcIjogXCIlMDlcIixcbiAgXCJcXHUwMDBBXCI6IFwiJTBBXCIsXG4gIFwiXFx1MDAwQlwiOiBcIiUwQlwiLFxuICBcIlxcdTAwMENcIjogXCIlMENcIixcbiAgXCJcXHUwMDBEXCI6IFwiJTBEXCIsXG4gIFwiXFx1MDAyMFwiOiBcIiUyMFwiLFxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIGVuY29kZVdoaXRlc3BhY2Uoc3RyaW5nOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gc3RyaW5nLnJlcGxhY2VBbGwoL1tcXHNdL2csIChjKSA9PiB7XG4gICAgcmV0dXJuIFdISVRFU1BBQ0VfRU5DT0RJTkdTW2NdID8/IGM7XG4gIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbGFzdFBhdGhTZWdtZW50KFxuICBwYXRoOiBzdHJpbmcsXG4gIGlzU2VwOiAoY2hhcjogbnVtYmVyKSA9PiBib29sZWFuLFxuICBzdGFydCA9IDAsXG4pOiBzdHJpbmcge1xuICBsZXQgbWF0Y2hlZE5vblNlcGFyYXRvciA9IGZhbHNlO1xuICBsZXQgZW5kID0gcGF0aC5sZW5ndGg7XG5cbiAgZm9yIChsZXQgaSA9IHBhdGgubGVuZ3RoIC0gMTsgaSA+PSBzdGFydDsgLS1pKSB7XG4gICAgaWYgKGlzU2VwKHBhdGguY2hhckNvZGVBdChpKSkpIHtcbiAgICAgIGlmIChtYXRjaGVkTm9uU2VwYXJhdG9yKSB7XG4gICAgICAgIHN0YXJ0ID0gaSArIDE7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoIW1hdGNoZWROb25TZXBhcmF0b3IpIHtcbiAgICAgIG1hdGNoZWROb25TZXBhcmF0b3IgPSB0cnVlO1xuICAgICAgZW5kID0gaSArIDE7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHBhdGguc2xpY2Uoc3RhcnQsIGVuZCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdHJpcFRyYWlsaW5nU2VwYXJhdG9ycyhcbiAgc2VnbWVudDogc3RyaW5nLFxuICBpc1NlcDogKGNoYXI6IG51bWJlcikgPT4gYm9vbGVhbixcbik6IHN0cmluZyB7XG4gIGlmIChzZWdtZW50Lmxlbmd0aCA8PSAxKSB7XG4gICAgcmV0dXJuIHNlZ21lbnQ7XG4gIH1cblxuICBsZXQgZW5kID0gc2VnbWVudC5sZW5ndGg7XG5cbiAgZm9yIChsZXQgaSA9IHNlZ21lbnQubGVuZ3RoIC0gMTsgaSA+IDA7IGktLSkge1xuICAgIGlmIChpc1NlcChzZWdtZW50LmNoYXJDb2RlQXQoaSkpKSB7XG4gICAgICBlbmQgPSBpO1xuICAgIH0gZWxzZSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICByZXR1cm4gc2VnbWVudC5zbGljZSgwLCBlbmQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3RyaXBTdWZmaXgobmFtZTogc3RyaW5nLCBzdWZmaXg6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmIChzdWZmaXgubGVuZ3RoID49IG5hbWUubGVuZ3RoKSB7XG4gICAgcmV0dXJuIG5hbWU7XG4gIH1cblxuICBjb25zdCBsZW5EaWZmID0gbmFtZS5sZW5ndGggLSBzdWZmaXgubGVuZ3RoO1xuXG4gIGZvciAobGV0IGkgPSBzdWZmaXgubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICBpZiAobmFtZS5jaGFyQ29kZUF0KGxlbkRpZmYgKyBpKSAhPT0gc3VmZml4LmNoYXJDb2RlQXQoaSkpIHtcbiAgICAgIHJldHVybiBuYW1lO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuYW1lLnNsaWNlKDAsIC1zdWZmaXgubGVuZ3RoKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUsaURBQWlEO0FB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