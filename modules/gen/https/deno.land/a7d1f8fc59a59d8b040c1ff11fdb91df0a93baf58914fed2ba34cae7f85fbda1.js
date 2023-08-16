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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjk5LjAvcGF0aC9fdXRpbC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgdGhlIEJyb3dzZXJpZnkgYXV0aG9ycy4gTUlUIExpY2Vuc2UuXG4vLyBQb3J0ZWQgZnJvbSBodHRwczovL2dpdGh1Yi5jb20vYnJvd3NlcmlmeS9wYXRoLWJyb3dzZXJpZnkvXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbmltcG9ydCB0eXBlIHsgRm9ybWF0SW5wdXRQYXRoT2JqZWN0IH0gZnJvbSBcIi4vX2ludGVyZmFjZS50c1wiO1xuaW1wb3J0IHtcbiAgQ0hBUl9CQUNLV0FSRF9TTEFTSCxcbiAgQ0hBUl9ET1QsXG4gIENIQVJfRk9SV0FSRF9TTEFTSCxcbiAgQ0hBUl9MT1dFUkNBU0VfQSxcbiAgQ0hBUl9MT1dFUkNBU0VfWixcbiAgQ0hBUl9VUFBFUkNBU0VfQSxcbiAgQ0hBUl9VUFBFUkNBU0VfWixcbn0gZnJvbSBcIi4vX2NvbnN0YW50cy50c1wiO1xuXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0UGF0aChwYXRoOiBzdHJpbmcpOiB2b2lkIHtcbiAgaWYgKHR5cGVvZiBwYXRoICE9PSBcInN0cmluZ1wiKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgIGBQYXRoIG11c3QgYmUgYSBzdHJpbmcuIFJlY2VpdmVkICR7SlNPTi5zdHJpbmdpZnkocGF0aCl9YCxcbiAgICApO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1Bvc2l4UGF0aFNlcGFyYXRvcihjb2RlOiBudW1iZXIpOiBib29sZWFuIHtcbiAgcmV0dXJuIGNvZGUgPT09IENIQVJfRk9SV0FSRF9TTEFTSDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzUGF0aFNlcGFyYXRvcihjb2RlOiBudW1iZXIpOiBib29sZWFuIHtcbiAgcmV0dXJuIGlzUG9zaXhQYXRoU2VwYXJhdG9yKGNvZGUpIHx8IGNvZGUgPT09IENIQVJfQkFDS1dBUkRfU0xBU0g7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1dpbmRvd3NEZXZpY2VSb290KGNvZGU6IG51bWJlcik6IGJvb2xlYW4ge1xuICByZXR1cm4gKFxuICAgIChjb2RlID49IENIQVJfTE9XRVJDQVNFX0EgJiYgY29kZSA8PSBDSEFSX0xPV0VSQ0FTRV9aKSB8fFxuICAgIChjb2RlID49IENIQVJfVVBQRVJDQVNFX0EgJiYgY29kZSA8PSBDSEFSX1VQUEVSQ0FTRV9aKVxuICApO1xufVxuXG4vLyBSZXNvbHZlcyAuIGFuZCAuLiBlbGVtZW50cyBpbiBhIHBhdGggd2l0aCBkaXJlY3RvcnkgbmFtZXNcbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVTdHJpbmcoXG4gIHBhdGg6IHN0cmluZyxcbiAgYWxsb3dBYm92ZVJvb3Q6IGJvb2xlYW4sXG4gIHNlcGFyYXRvcjogc3RyaW5nLFxuICBpc1BhdGhTZXBhcmF0b3I6IChjb2RlOiBudW1iZXIpID0+IGJvb2xlYW4sXG4pOiBzdHJpbmcge1xuICBsZXQgcmVzID0gXCJcIjtcbiAgbGV0IGxhc3RTZWdtZW50TGVuZ3RoID0gMDtcbiAgbGV0IGxhc3RTbGFzaCA9IC0xO1xuICBsZXQgZG90cyA9IDA7XG4gIGxldCBjb2RlOiBudW1iZXIgfCB1bmRlZmluZWQ7XG4gIGZvciAobGV0IGkgPSAwLCBsZW4gPSBwYXRoLmxlbmd0aDsgaSA8PSBsZW47ICsraSkge1xuICAgIGlmIChpIDwgbGVuKSBjb2RlID0gcGF0aC5jaGFyQ29kZUF0KGkpO1xuICAgIGVsc2UgaWYgKGlzUGF0aFNlcGFyYXRvcihjb2RlISkpIGJyZWFrO1xuICAgIGVsc2UgY29kZSA9IENIQVJfRk9SV0FSRF9TTEFTSDtcblxuICAgIGlmIChpc1BhdGhTZXBhcmF0b3IoY29kZSEpKSB7XG4gICAgICBpZiAobGFzdFNsYXNoID09PSBpIC0gMSB8fCBkb3RzID09PSAxKSB7XG4gICAgICAgIC8vIE5PT1BcbiAgICAgIH0gZWxzZSBpZiAobGFzdFNsYXNoICE9PSBpIC0gMSAmJiBkb3RzID09PSAyKSB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICByZXMubGVuZ3RoIDwgMiB8fFxuICAgICAgICAgIGxhc3RTZWdtZW50TGVuZ3RoICE9PSAyIHx8XG4gICAgICAgICAgcmVzLmNoYXJDb2RlQXQocmVzLmxlbmd0aCAtIDEpICE9PSBDSEFSX0RPVCB8fFxuICAgICAgICAgIHJlcy5jaGFyQ29kZUF0KHJlcy5sZW5ndGggLSAyKSAhPT0gQ0hBUl9ET1RcbiAgICAgICAgKSB7XG4gICAgICAgICAgaWYgKHJlcy5sZW5ndGggPiAyKSB7XG4gICAgICAgICAgICBjb25zdCBsYXN0U2xhc2hJbmRleCA9IHJlcy5sYXN0SW5kZXhPZihzZXBhcmF0b3IpO1xuICAgICAgICAgICAgaWYgKGxhc3RTbGFzaEluZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgICByZXMgPSBcIlwiO1xuICAgICAgICAgICAgICBsYXN0U2VnbWVudExlbmd0aCA9IDA7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXMgPSByZXMuc2xpY2UoMCwgbGFzdFNsYXNoSW5kZXgpO1xuICAgICAgICAgICAgICBsYXN0U2VnbWVudExlbmd0aCA9IHJlcy5sZW5ndGggLSAxIC0gcmVzLmxhc3RJbmRleE9mKHNlcGFyYXRvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsYXN0U2xhc2ggPSBpO1xuICAgICAgICAgICAgZG90cyA9IDA7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHJlcy5sZW5ndGggPT09IDIgfHwgcmVzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgcmVzID0gXCJcIjtcbiAgICAgICAgICAgIGxhc3RTZWdtZW50TGVuZ3RoID0gMDtcbiAgICAgICAgICAgIGxhc3RTbGFzaCA9IGk7XG4gICAgICAgICAgICBkb3RzID0gMDtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoYWxsb3dBYm92ZVJvb3QpIHtcbiAgICAgICAgICBpZiAocmVzLmxlbmd0aCA+IDApIHJlcyArPSBgJHtzZXBhcmF0b3J9Li5gO1xuICAgICAgICAgIGVsc2UgcmVzID0gXCIuLlwiO1xuICAgICAgICAgIGxhc3RTZWdtZW50TGVuZ3RoID0gMjtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHJlcy5sZW5ndGggPiAwKSByZXMgKz0gc2VwYXJhdG9yICsgcGF0aC5zbGljZShsYXN0U2xhc2ggKyAxLCBpKTtcbiAgICAgICAgZWxzZSByZXMgPSBwYXRoLnNsaWNlKGxhc3RTbGFzaCArIDEsIGkpO1xuICAgICAgICBsYXN0U2VnbWVudExlbmd0aCA9IGkgLSBsYXN0U2xhc2ggLSAxO1xuICAgICAgfVxuICAgICAgbGFzdFNsYXNoID0gaTtcbiAgICAgIGRvdHMgPSAwO1xuICAgIH0gZWxzZSBpZiAoY29kZSA9PT0gQ0hBUl9ET1QgJiYgZG90cyAhPT0gLTEpIHtcbiAgICAgICsrZG90cztcbiAgICB9IGVsc2Uge1xuICAgICAgZG90cyA9IC0xO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gX2Zvcm1hdChcbiAgc2VwOiBzdHJpbmcsXG4gIHBhdGhPYmplY3Q6IEZvcm1hdElucHV0UGF0aE9iamVjdCxcbik6IHN0cmluZyB7XG4gIGNvbnN0IGRpcjogc3RyaW5nIHwgdW5kZWZpbmVkID0gcGF0aE9iamVjdC5kaXIgfHwgcGF0aE9iamVjdC5yb290O1xuICBjb25zdCBiYXNlOiBzdHJpbmcgPSBwYXRoT2JqZWN0LmJhc2UgfHxcbiAgICAocGF0aE9iamVjdC5uYW1lIHx8IFwiXCIpICsgKHBhdGhPYmplY3QuZXh0IHx8IFwiXCIpO1xuICBpZiAoIWRpcikgcmV0dXJuIGJhc2U7XG4gIGlmIChkaXIgPT09IHBhdGhPYmplY3Qucm9vdCkgcmV0dXJuIGRpciArIGJhc2U7XG4gIHJldHVybiBkaXIgKyBzZXAgKyBiYXNlO1xufVxuXG5jb25zdCBXSElURVNQQUNFX0VOQ09ESU5HUzogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgXCJcXHUwMDA5XCI6IFwiJTA5XCIsXG4gIFwiXFx1MDAwQVwiOiBcIiUwQVwiLFxuICBcIlxcdTAwMEJcIjogXCIlMEJcIixcbiAgXCJcXHUwMDBDXCI6IFwiJTBDXCIsXG4gIFwiXFx1MDAwRFwiOiBcIiUwRFwiLFxuICBcIlxcdTAwMjBcIjogXCIlMjBcIixcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBlbmNvZGVXaGl0ZXNwYWNlKHN0cmluZzogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHN0cmluZy5yZXBsYWNlQWxsKC9bXFxzXS9nLCAoYykgPT4ge1xuICAgIHJldHVybiBXSElURVNQQUNFX0VOQ09ESU5HU1tjXSA/PyBjO1xuICB9KTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxpREFBaUQ7QUFDakQsNkRBQTZEO0FBQzdELHFDQUFxQztBQUdyQyxTQUNFLG1CQUFtQixFQUNuQixRQUFRLEVBQ1Isa0JBQWtCLEVBQ2xCLGdCQUFnQixFQUNoQixnQkFBZ0IsRUFDaEIsZ0JBQWdCLEVBQ2hCLGdCQUFnQixRQUNYLGtCQUFrQjtBQUV6QixPQUFPLFNBQVMsV0FBVyxJQUFZO0lBQ3JDLElBQUksT0FBTyxTQUFTLFVBQVU7UUFDNUIsTUFBTSxJQUFJLFVBQ1IsQ0FBQyxnQ0FBZ0MsRUFBRSxLQUFLLFVBQVUsTUFBTSxDQUFDO0lBRTdEO0FBQ0Y7QUFFQSxPQUFPLFNBQVMscUJBQXFCLElBQVk7SUFDL0MsT0FBTyxTQUFTO0FBQ2xCO0FBRUEsT0FBTyxTQUFTLGdCQUFnQixJQUFZO0lBQzFDLE9BQU8scUJBQXFCLFNBQVMsU0FBUztBQUNoRDtBQUVBLE9BQU8sU0FBUyxvQkFBb0IsSUFBWTtJQUM5QyxPQUNFLEFBQUMsUUFBUSxvQkFBb0IsUUFBUSxvQkFDcEMsUUFBUSxvQkFBb0IsUUFBUTtBQUV6QztBQUVBLDREQUE0RDtBQUM1RCxPQUFPLFNBQVMsZ0JBQ2Qs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