/**
 * Adapted directly from content-disposition.js at
 * https://github.com/Rob--W/open-in-browser/blob/master/extension/content-disposition.js
 * which is licensed as:
 *
 * (c) 2017 Rob Wu <rob@robwu.nl> (https://robwu.nl)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */ import { toParamRegExp, unquote } from "./headers.ts";
let needsEncodingFixup = false;
function fixupEncoding(value) {
    if (needsEncodingFixup && /[\x80-\xff]/.test(value)) {
        value = textDecode("utf-8", value);
        if (needsEncodingFixup) {
            value = textDecode("iso-8859-1", value);
        }
    }
    return value;
}
const FILENAME_STAR_REGEX = toParamRegExp("filename\\*", "i");
const FILENAME_START_ITER_REGEX = toParamRegExp("filename\\*((?!0\\d)\\d+)(\\*?)", "ig");
const FILENAME_REGEX = toParamRegExp("filename", "i");
function rfc2047decode(value) {
    // deno-lint-ignore no-control-regex
    if (!value.startsWith("=?") || /[\x00-\x19\x80-\xff]/.test(value)) {
        return value;
    }
    return value.replace(/=\?([\w-]*)\?([QqBb])\?((?:[^?]|\?(?!=))*)\?=/g, (_, charset, encoding, text)=>{
        if (encoding === "q" || encoding === "Q") {
            text = text.replace(/_/g, " ");
            text = text.replace(/=([0-9a-fA-F]{2})/g, (_, hex)=>String.fromCharCode(parseInt(hex, 16)));
            return textDecode(charset, text);
        }
        try {
            text = atob(text);
        // deno-lint-ignore no-empty
        } catch  {}
        return textDecode(charset, text);
    });
}
function rfc2231getParam(header) {
    const matches = [];
    let match;
    while(match = FILENAME_START_ITER_REGEX.exec(header)){
        const [, ns, quote, part] = match;
        const n = parseInt(ns, 10);
        if (n in matches) {
            if (n === 0) {
                break;
            }
            continue;
        }
        matches[n] = [
            quote,
            part
        ];
    }
    const parts = [];
    for(let n = 0; n < matches.length; ++n){
        if (!(n in matches)) {
            break;
        }
        let [quote, part] = matches[n];
        part = unquote(part);
        if (quote) {
            part = unescape(part);
            if (n === 0) {
                part = rfc5987decode(part);
            }
        }
        parts.push(part);
    }
    return parts.join("");
}
function rfc5987decode(value) {
    const encodingEnd = value.indexOf(`'`);
    if (encodingEnd === -1) {
        return value;
    }
    const encoding = value.slice(0, encodingEnd);
    const langValue = value.slice(encodingEnd + 1);
    return textDecode(encoding, langValue.replace(/^[^']*'/, ""));
}
function textDecode(encoding, value) {
    if (encoding) {
        try {
            const decoder = new TextDecoder(encoding, {
                fatal: true
            });
            const bytes = Array.from(value, (c)=>c.charCodeAt(0));
            if (bytes.every((code)=>code <= 0xFF)) {
                value = decoder.decode(new Uint8Array(bytes));
                needsEncodingFixup = false;
            }
        // deno-lint-ignore no-empty
        } catch  {}
    }
    return value;
}
export function getFilename(header) {
    needsEncodingFixup = true;
    // filename*=ext-value ("ext-value" from RFC 5987, referenced by RFC 6266).
    let matches = FILENAME_STAR_REGEX.exec(header);
    if (matches) {
        const [, filename] = matches;
        return fixupEncoding(rfc2047decode(rfc5987decode(unescape(unquote(filename)))));
    }
    // Continuations (RFC 2231 section 3, referenced by RFC 5987 section 3.1).
    // filename*n*=part
    // filename*n=part
    const filename = rfc2231getParam(header);
    if (filename) {
        return fixupEncoding(rfc2047decode(filename));
    }
    // filename=value (RFC 5987, section 4.1).
    matches = FILENAME_REGEX.exec(header);
    if (matches) {
        const [, filename] = matches;
        return fixupEncoding(rfc2047decode(unquote(filename)));
    }
    return "";
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvb2FrQHYxMi42LjAvY29udGVudF9kaXNwb3NpdGlvbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEFkYXB0ZWQgZGlyZWN0bHkgZnJvbSBjb250ZW50LWRpc3Bvc2l0aW9uLmpzIGF0XG4gKiBodHRwczovL2dpdGh1Yi5jb20vUm9iLS1XL29wZW4taW4tYnJvd3Nlci9ibG9iL21hc3Rlci9leHRlbnNpb24vY29udGVudC1kaXNwb3NpdGlvbi5qc1xuICogd2hpY2ggaXMgbGljZW5zZWQgYXM6XG4gKlxuICogKGMpIDIwMTcgUm9iIFd1IDxyb2JAcm9id3Uubmw+IChodHRwczovL3JvYnd1Lm5sKVxuICogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpY1xuICogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuICogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy5cbiAqL1xuXG5pbXBvcnQgeyB0b1BhcmFtUmVnRXhwLCB1bnF1b3RlIH0gZnJvbSBcIi4vaGVhZGVycy50c1wiO1xuXG5sZXQgbmVlZHNFbmNvZGluZ0ZpeHVwID0gZmFsc2U7XG5cbmZ1bmN0aW9uIGZpeHVwRW5jb2RpbmcodmFsdWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmIChuZWVkc0VuY29kaW5nRml4dXAgJiYgL1tcXHg4MC1cXHhmZl0vLnRlc3QodmFsdWUpKSB7XG4gICAgdmFsdWUgPSB0ZXh0RGVjb2RlKFwidXRmLThcIiwgdmFsdWUpO1xuICAgIGlmIChuZWVkc0VuY29kaW5nRml4dXApIHtcbiAgICAgIHZhbHVlID0gdGV4dERlY29kZShcImlzby04ODU5LTFcIiwgdmFsdWUpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG5cbmNvbnN0IEZJTEVOQU1FX1NUQVJfUkVHRVggPSB0b1BhcmFtUmVnRXhwKFwiZmlsZW5hbWVcXFxcKlwiLCBcImlcIik7XG5jb25zdCBGSUxFTkFNRV9TVEFSVF9JVEVSX1JFR0VYID0gdG9QYXJhbVJlZ0V4cChcbiAgXCJmaWxlbmFtZVxcXFwqKCg/ITBcXFxcZClcXFxcZCspKFxcXFwqPylcIixcbiAgXCJpZ1wiLFxuKTtcbmNvbnN0IEZJTEVOQU1FX1JFR0VYID0gdG9QYXJhbVJlZ0V4cChcImZpbGVuYW1lXCIsIFwiaVwiKTtcblxuZnVuY3Rpb24gcmZjMjA0N2RlY29kZSh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1jb250cm9sLXJlZ2V4XG4gIGlmICghdmFsdWUuc3RhcnRzV2l0aChcIj0/XCIpIHx8IC9bXFx4MDAtXFx4MTlcXHg4MC1cXHhmZl0vLnRlc3QodmFsdWUpKSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG4gIHJldHVybiB2YWx1ZS5yZXBsYWNlKFxuICAgIC89XFw/KFtcXHctXSopXFw/KFtRcUJiXSlcXD8oKD86W14/XXxcXD8oPyE9KSkqKVxcPz0vZyxcbiAgICAoXzogc3RyaW5nLCBjaGFyc2V0OiBzdHJpbmcsIGVuY29kaW5nOiBzdHJpbmcsIHRleHQ6IHN0cmluZykgPT4ge1xuICAgICAgaWYgKGVuY29kaW5nID09PSBcInFcIiB8fCBlbmNvZGluZyA9PT0gXCJRXCIpIHtcbiAgICAgICAgdGV4dCA9IHRleHQucmVwbGFjZSgvXy9nLCBcIiBcIik7XG4gICAgICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UoXG4gICAgICAgICAgLz0oWzAtOWEtZkEtRl17Mn0pL2csXG4gICAgICAgICAgKF8sIGhleCkgPT4gU3RyaW5nLmZyb21DaGFyQ29kZShwYXJzZUludChoZXgsIDE2KSksXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybiB0ZXh0RGVjb2RlKGNoYXJzZXQsIHRleHQpO1xuICAgICAgfVxuICAgICAgdHJ5IHtcbiAgICAgICAgdGV4dCA9IGF0b2IodGV4dCk7XG4gICAgICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZW1wdHlcbiAgICAgIH0gY2F0Y2gge31cbiAgICAgIHJldHVybiB0ZXh0RGVjb2RlKGNoYXJzZXQsIHRleHQpO1xuICAgIH0sXG4gICk7XG59XG5cbmZ1bmN0aW9uIHJmYzIyMzFnZXRQYXJhbShoZWFkZXI6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IG1hdGNoZXM6IFtzdHJpbmcsIHN0cmluZ11bXSA9IFtdO1xuICBsZXQgbWF0Y2g6IFJlZ0V4cEV4ZWNBcnJheSB8IG51bGw7XG4gIHdoaWxlICgobWF0Y2ggPSBGSUxFTkFNRV9TVEFSVF9JVEVSX1JFR0VYLmV4ZWMoaGVhZGVyKSkpIHtcbiAgICBjb25zdCBbLCBucywgcXVvdGUsIHBhcnRdID0gbWF0Y2g7XG4gICAgY29uc3QgbiA9IHBhcnNlSW50KG5zLCAxMCk7XG4gICAgaWYgKG4gaW4gbWF0Y2hlcykge1xuICAgICAgaWYgKG4gPT09IDApIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgbWF0Y2hlc1tuXSA9IFtxdW90ZSwgcGFydF07XG4gIH1cbiAgY29uc3QgcGFydHM6IHN0cmluZ1tdID0gW107XG4gIGZvciAobGV0IG4gPSAwOyBuIDwgbWF0Y2hlcy5sZW5ndGg7ICsrbikge1xuICAgIGlmICghKG4gaW4gbWF0Y2hlcykpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBsZXQgW3F1b3RlLCBwYXJ0XSA9IG1hdGNoZXNbbl07XG4gICAgcGFydCA9IHVucXVvdGUocGFydCk7XG4gICAgaWYgKHF1b3RlKSB7XG4gICAgICBwYXJ0ID0gdW5lc2NhcGUocGFydCk7XG4gICAgICBpZiAobiA9PT0gMCkge1xuICAgICAgICBwYXJ0ID0gcmZjNTk4N2RlY29kZShwYXJ0KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcGFydHMucHVzaChwYXJ0KTtcbiAgfVxuICByZXR1cm4gcGFydHMuam9pbihcIlwiKTtcbn1cblxuZnVuY3Rpb24gcmZjNTk4N2RlY29kZSh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgZW5jb2RpbmdFbmQgPSB2YWx1ZS5pbmRleE9mKGAnYCk7XG4gIGlmIChlbmNvZGluZ0VuZCA9PT0gLTEpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbiAgY29uc3QgZW5jb2RpbmcgPSB2YWx1ZS5zbGljZSgwLCBlbmNvZGluZ0VuZCk7XG4gIGNvbnN0IGxhbmdWYWx1ZSA9IHZhbHVlLnNsaWNlKGVuY29kaW5nRW5kICsgMSk7XG4gIHJldHVybiB0ZXh0RGVjb2RlKGVuY29kaW5nLCBsYW5nVmFsdWUucmVwbGFjZSgvXlteJ10qJy8sIFwiXCIpKTtcbn1cblxuZnVuY3Rpb24gdGV4dERlY29kZShlbmNvZGluZzogc3RyaW5nLCB2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKGVuY29kaW5nKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGRlY29kZXIgPSBuZXcgVGV4dERlY29kZXIoZW5jb2RpbmcsIHsgZmF0YWw6IHRydWUgfSk7XG4gICAgICBjb25zdCBieXRlcyA9IEFycmF5LmZyb20odmFsdWUsIChjKSA9PiBjLmNoYXJDb2RlQXQoMCkpO1xuICAgICAgaWYgKGJ5dGVzLmV2ZXJ5KChjb2RlKSA9PiBjb2RlIDw9IDB4RkYpKSB7XG4gICAgICAgIHZhbHVlID0gZGVjb2Rlci5kZWNvZGUobmV3IFVpbnQ4QXJyYXkoYnl0ZXMpKTtcbiAgICAgICAgbmVlZHNFbmNvZGluZ0ZpeHVwID0gZmFsc2U7XG4gICAgICB9XG4gICAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWVtcHR5XG4gICAgfSBjYXRjaCB7fVxuICB9XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEZpbGVuYW1lKGhlYWRlcjogc3RyaW5nKTogc3RyaW5nIHtcbiAgbmVlZHNFbmNvZGluZ0ZpeHVwID0gdHJ1ZTtcblxuICAvLyBmaWxlbmFtZSo9ZXh0LXZhbHVlIChcImV4dC12YWx1ZVwiIGZyb20gUkZDIDU5ODcsIHJlZmVyZW5jZWQgYnkgUkZDIDYyNjYpLlxuICBsZXQgbWF0Y2hlcyA9IEZJTEVOQU1FX1NUQVJfUkVHRVguZXhlYyhoZWFkZXIpO1xuICBpZiAobWF0Y2hlcykge1xuICAgIGNvbnN0IFssIGZpbGVuYW1lXSA9IG1hdGNoZXM7XG4gICAgcmV0dXJuIGZpeHVwRW5jb2RpbmcoXG4gICAgICByZmMyMDQ3ZGVjb2RlKHJmYzU5ODdkZWNvZGUodW5lc2NhcGUodW5xdW90ZShmaWxlbmFtZSkpKSksXG4gICAgKTtcbiAgfVxuXG4gIC8vIENvbnRpbnVhdGlvbnMgKFJGQyAyMjMxIHNlY3Rpb24gMywgcmVmZXJlbmNlZCBieSBSRkMgNTk4NyBzZWN0aW9uIDMuMSkuXG4gIC8vIGZpbGVuYW1lKm4qPXBhcnRcbiAgLy8gZmlsZW5hbWUqbj1wYXJ0XG4gIGNvbnN0IGZpbGVuYW1lID0gcmZjMjIzMWdldFBhcmFtKGhlYWRlcik7XG4gIGlmIChmaWxlbmFtZSkge1xuICAgIHJldHVybiBmaXh1cEVuY29kaW5nKHJmYzIwNDdkZWNvZGUoZmlsZW5hbWUpKTtcbiAgfVxuXG4gIC8vIGZpbGVuYW1lPXZhbHVlIChSRkMgNTk4Nywgc2VjdGlvbiA0LjEpLlxuICBtYXRjaGVzID0gRklMRU5BTUVfUkVHRVguZXhlYyhoZWFkZXIpO1xuICBpZiAobWF0Y2hlcykge1xuICAgIGNvbnN0IFssIGZpbGVuYW1lXSA9IG1hdGNoZXM7XG4gICAgcmV0dXJuIGZpeHVwRW5jb2RpbmcocmZjMjA0N2RlY29kZSh1bnF1b3RlKGZpbGVuYW1lKSkpO1xuICB9XG5cbiAgcmV0dXJuIFwiXCI7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7OztDQVNDLEdBRUQsU0FBUyxhQUFhLEVBQUUsT0FBTyxRQUFRLGVBQWU7QUFFdEQsSUFBSSxxQkFBcUI7QUFFekIsU0FBUyxjQUFjLEtBQWE7SUFDbEMsSUFBSSxzQkFBc0IsY0FBYyxLQUFLLFFBQVE7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