// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { isWindows, osType } from "../_util/os.ts";
import { SEP, SEP_PATTERN } from "./separator.ts";
import * as _win32 from "./win32.ts";
import * as _posix from "./posix.ts";
const path = isWindows ? _win32 : _posix;
const { join , normalize  } = path;
// deno-fmt-ignore
const regExpEscapeChars = [
    "!",
    "$",
    "(",
    ")",
    "*",
    "+",
    ".",
    "=",
    "?",
    "[",
    "\\",
    "^",
    "{",
    "|"
];
const rangeEscapeChars = [
    "-",
    "\\",
    "]"
];
/** Convert a glob string to a regular expression.
 *
 * Tries to match bash glob expansion as closely as possible.
 *
 * Basic glob syntax:
 * - `*` - Matches everything without leaving the path segment.
 * - `{foo,bar}` - Matches `foo` or `bar`.
 * - `[abcd]` - Matches `a`, `b`, `c` or `d`.
 * - `[a-d]` - Matches `a`, `b`, `c` or `d`.
 * - `[!abcd]` - Matches any single character besides `a`, `b`, `c` or `d`.
 * - `[[:<class>:]]` - Matches any character belonging to `<class>`.
 *     - `[[:alnum:]]` - Matches any digit or letter.
 *     - `[[:digit:]abc]` - Matches any digit, `a`, `b` or `c`.
 *     - See https://facelessuser.github.io/wcmatch/glob/#posix-character-classes
 *       for a complete list of supported character classes.
 * - `\` - Escapes the next character for an `os` other than `"windows"`.
 * - \` - Escapes the next character for `os` set to `"windows"`.
 * - `/` - Path separator.
 * - `\` - Additional path separator only for `os` set to `"windows"`.
 *
 * Extended syntax:
 * - Requires `{ extended: true }`.
 * - `?(foo|bar)` - Matches 0 or 1 instance of `{foo,bar}`.
 * - `@(foo|bar)` - Matches 1 instance of `{foo,bar}`. They behave the same.
 * - `*(foo|bar)` - Matches _n_ instances of `{foo,bar}`.
 * - `+(foo|bar)` - Matches _n > 0_ instances of `{foo,bar}`.
 * - `!(foo|bar)` - Matches anything other than `{foo,bar}`.
 * - See https://www.linuxjournal.com/content/bash-extended-globbing.
 *
 * Globstar syntax:
 * - Requires `{ globstar: true }`.
 * - `**` - Matches any number of any path segments.
 *     - Must comprise its entire path segment in the provided glob.
 * - See https://www.linuxjournal.com/content/globstar-new-bash-globbing-option.
 *
 * Note the following properties:
 * - The generated `RegExp` is anchored at both start and end.
 * - Repeating and trailing separators are tolerated. Trailing separators in the
 *   provided glob have no meaning and are discarded.
 * - Absolute globs will only match absolute paths, etc.
 * - Empty globs will match nothing.
 * - Any special glob syntax must be contained to one path segment. For example,
 *   `?(foo|bar/baz)` is invalid. The separator will take precendence and the
 *   first segment ends with an unclosed group.
 * - If a path segment ends with unclosed groups or a dangling escape prefix, a
 *   parse error has occured. Every character for that segment is taken
 *   literally in this event.
 *
 * Limitations:
 * - A negative group like `!(foo|bar)` will wrongly be converted to a negative
 *   look-ahead followed by a wildcard. This means that `!(foo).js` will wrongly
 *   fail to match `foobar.js`, even though `foobar` is not `foo`. Effectively,
 *   `!(foo|bar)` is treated like `!(@(foo|bar)*)`. This will work correctly if
 *   the group occurs not nested at the end of the segment. */ export function globToRegExp(glob, { extended =true , globstar: globstarOption = true , os =osType , caseInsensitive =false  } = {}) {
    if (glob == "") {
        return /(?!)/;
    }
    const sep = os == "windows" ? "(?:\\\\|/)+" : "/+";
    const sepMaybe = os == "windows" ? "(?:\\\\|/)*" : "/*";
    const seps = os == "windows" ? [
        "\\",
        "/"
    ] : [
        "/"
    ];
    const globstar = os == "windows" ? "(?:[^\\\\/]*(?:\\\\|/|$)+)*" : "(?:[^/]*(?:/|$)+)*";
    const wildcard = os == "windows" ? "[^\\\\/]*" : "[^/]*";
    const escapePrefix = os == "windows" ? "`" : "\\";
    // Remove trailing separators.
    let newLength = glob.length;
    for(; newLength > 1 && seps.includes(glob[newLength - 1]); newLength--);
    glob = glob.slice(0, newLength);
    let regExpString = "";
    // Terminates correctly. Trust that `j` is incremented every iteration.
    for(let j = 0; j < glob.length;){
        let segment = "";
        const groupStack = [];
        let inRange = false;
        let inEscape = false;
        let endsWithSep = false;
        let i = j;
        // Terminates with `i` at the non-inclusive end of the current segment.
        for(; i < glob.length && !seps.includes(glob[i]); i++){
            if (inEscape) {
                inEscape = false;
                const escapeChars = inRange ? rangeEscapeChars : regExpEscapeChars;
                segment += escapeChars.includes(glob[i]) ? `\\${glob[i]}` : glob[i];
                continue;
            }
            if (glob[i] == escapePrefix) {
                inEscape = true;
                continue;
            }
            if (glob[i] == "[") {
                if (!inRange) {
                    inRange = true;
                    segment += "[";
                    if (glob[i + 1] == "!") {
                        i++;
                        segment += "^";
                    } else if (glob[i + 1] == "^") {
                        i++;
                        segment += "\\^";
                    }
                    continue;
                } else if (glob[i + 1] == ":") {
                    let k = i + 1;
                    let value = "";
                    while(glob[k + 1] != null && glob[k + 1] != ":"){
                        value += glob[k + 1];
                        k++;
                    }
                    if (glob[k + 1] == ":" && glob[k + 2] == "]") {
                        i = k + 2;
                        if (value == "alnum") segment += "\\dA-Za-z";
                        else if (value == "alpha") segment += "A-Za-z";
                        else if (value == "ascii") segment += "\x00-\x7F";
                        else if (value == "blank") segment += "\t ";
                        else if (value == "cntrl") segment += "\x00-\x1F\x7F";
                        else if (value == "digit") segment += "\\d";
                        else if (value == "graph") segment += "\x21-\x7E";
                        else if (value == "lower") segment += "a-z";
                        else if (value == "print") segment += "\x20-\x7E";
                        else if (value == "punct") {
                            segment += "!\"#$%&'()*+,\\-./:;<=>?@[\\\\\\]^_‘{|}~";
                        } else if (value == "space") segment += "\\s\v";
                        else if (value == "upper") segment += "A-Z";
                        else if (value == "word") segment += "\\w";
                        else if (value == "xdigit") segment += "\\dA-Fa-f";
                        continue;
                    }
                }
            }
            if (glob[i] == "]" && inRange) {
                inRange = false;
                segment += "]";
                continue;
            }
            if (inRange) {
                if (glob[i] == "\\") {
                    segment += `\\\\`;
                } else {
                    segment += glob[i];
                }
                continue;
            }
            if (glob[i] == ")" && groupStack.length > 0 && groupStack[groupStack.length - 1] != "BRACE") {
                segment += ")";
                const type = groupStack.pop();
                if (type == "!") {
                    segment += wildcard;
                } else if (type != "@") {
                    segment += type;
                }
                continue;
            }
            if (glob[i] == "|" && groupStack.length > 0 && groupStack[groupStack.length - 1] != "BRACE") {
                segment += "|";
                continue;
            }
            if (glob[i] == "+" && extended && glob[i + 1] == "(") {
                i++;
                groupStack.push("+");
                segment += "(?:";
                continue;
            }
            if (glob[i] == "@" && extended && glob[i + 1] == "(") {
                i++;
                groupStack.push("@");
                segment += "(?:";
                continue;
            }
            if (glob[i] == "?") {
                if (extended && glob[i + 1] == "(") {
                    i++;
                    groupStack.push("?");
                    segment += "(?:";
                } else {
                    segment += ".";
                }
                continue;
            }
            if (glob[i] == "!" && extended && glob[i + 1] == "(") {
                i++;
                groupStack.push("!");
                segment += "(?!";
                continue;
            }
            if (glob[i] == "{") {
                groupStack.push("BRACE");
                segment += "(?:";
                continue;
            }
            if (glob[i] == "}" && groupStack[groupStack.length - 1] == "BRACE") {
                groupStack.pop();
                segment += ")";
                continue;
            }
            if (glob[i] == "," && groupStack[groupStack.length - 1] == "BRACE") {
                segment += "|";
                continue;
            }
            if (glob[i] == "*") {
                if (extended && glob[i + 1] == "(") {
                    i++;
                    groupStack.push("*");
                    segment += "(?:";
                } else {
                    const prevChar = glob[i - 1];
                    let numStars = 1;
                    while(glob[i + 1] == "*"){
                        i++;
                        numStars++;
                    }
                    const nextChar = glob[i + 1];
                    if (globstarOption && numStars == 2 && [
                        ...seps,
                        undefined
                    ].includes(prevChar) && [
                        ...seps,
                        undefined
                    ].includes(nextChar)) {
                        segment += globstar;
                        endsWithSep = true;
                    } else {
                        segment += wildcard;
                    }
                }
                continue;
            }
            segment += regExpEscapeChars.includes(glob[i]) ? `\\${glob[i]}` : glob[i];
        }
        // Check for unclosed groups or a dangling backslash.
        if (groupStack.length > 0 || inRange || inEscape) {
            // Parse failure. Take all characters from this segment literally.
            segment = "";
            for (const c of glob.slice(j, i)){
                segment += regExpEscapeChars.includes(c) ? `\\${c}` : c;
                endsWithSep = false;
            }
        }
        regExpString += segment;
        if (!endsWithSep) {
            regExpString += i < glob.length ? sep : sepMaybe;
            endsWithSep = true;
        }
        // Terminates with `i` at the start of the next segment.
        while(seps.includes(glob[i]))i++;
        // Check that the next value of `j` is indeed higher than the current value.
        if (!(i > j)) {
            throw new Error("Assertion failure: i > j (potential infinite loop)");
        }
        j = i;
    }
    regExpString = `^${regExpString}$`;
    return new RegExp(regExpString, caseInsensitive ? "i" : "");
}
/** Test whether the given string is a glob */ export function isGlob(str) {
    const chars = {
        "{": "}",
        "(": ")",
        "[": "]"
    };
    const regex = /\\(.)|(^!|\*|[\].+)]\?|\[[^\\\]]+\]|\{[^\\}]+\}|\(\?[:!=][^\\)]+\)|\([^|]+\|[^\\)]+\))/;
    if (str === "") {
        return false;
    }
    let match;
    while(match = regex.exec(str)){
        if (match[2]) return true;
        let idx = match.index + match[0].length;
        // if an open bracket/brace/paren is escaped,
        // set the index to the next closing character
        const open = match[1];
        const close = open ? chars[open] : null;
        if (open && close) {
            const n = str.indexOf(close, idx);
            if (n !== -1) {
                idx = n + 1;
            }
        }
        str = str.slice(idx);
    }
    return false;
}
/** Like normalize(), but doesn't collapse "**\/.." when `globstar` is true. */ export function normalizeGlob(glob, { globstar =false  } = {}) {
    if (glob.match(/\0/g)) {
        throw new Error(`Glob contains invalid characters: "${glob}"`);
    }
    if (!globstar) {
        return normalize(glob);
    }
    const s = SEP_PATTERN.source;
    const badParentPattern = new RegExp(`(?<=(${s}|^)\\*\\*${s})\\.\\.(?=${s}|$)`, "g");
    return normalize(glob.replace(badParentPattern, "\0")).replace(/\0/g, "..");
}
/** Like join(), but doesn't collapse "**\/.." when `globstar` is true. */ export function joinGlobs(globs, { extended =false , globstar =false  } = {}) {
    if (!globstar || globs.length == 0) {
        return join(...globs);
    }
    if (globs.length === 0) return ".";
    let joined;
    for (const glob of globs){
        const path = glob;
        if (path.length > 0) {
            if (!joined) joined = path;
            else joined += `${SEP}${path}`;
        }
    }
    if (!joined) return ".";
    return normalizeGlob(joined, {
        extended,
        globstar
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjk5LjAvcGF0aC9nbG9iLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjEgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbmltcG9ydCB7IGlzV2luZG93cywgb3NUeXBlIH0gZnJvbSBcIi4uL191dGlsL29zLnRzXCI7XG5pbXBvcnQgeyBTRVAsIFNFUF9QQVRURVJOIH0gZnJvbSBcIi4vc2VwYXJhdG9yLnRzXCI7XG5pbXBvcnQgKiBhcyBfd2luMzIgZnJvbSBcIi4vd2luMzIudHNcIjtcbmltcG9ydCAqIGFzIF9wb3NpeCBmcm9tIFwiLi9wb3NpeC50c1wiO1xuXG5jb25zdCBwYXRoID0gaXNXaW5kb3dzID8gX3dpbjMyIDogX3Bvc2l4O1xuY29uc3QgeyBqb2luLCBub3JtYWxpemUgfSA9IHBhdGg7XG5cbmV4cG9ydCBpbnRlcmZhY2UgR2xvYk9wdGlvbnMge1xuICAvKiogRXh0ZW5kZWQgZ2xvYiBzeW50YXguXG4gICAqIFNlZSBodHRwczovL3d3dy5saW51eGpvdXJuYWwuY29tL2NvbnRlbnQvYmFzaC1leHRlbmRlZC1nbG9iYmluZy4gRGVmYXVsdHNcbiAgICogdG8gdHJ1ZS4gKi9cbiAgZXh0ZW5kZWQ/OiBib29sZWFuO1xuICAvKiogR2xvYnN0YXIgc3ludGF4LlxuICAgKiBTZWUgaHR0cHM6Ly93d3cubGludXhqb3VybmFsLmNvbS9jb250ZW50L2dsb2JzdGFyLW5ldy1iYXNoLWdsb2JiaW5nLW9wdGlvbi5cbiAgICogSWYgZmFsc2UsIGAqKmAgaXMgdHJlYXRlZCBsaWtlIGAqYC4gRGVmYXVsdHMgdG8gdHJ1ZS4gKi9cbiAgZ2xvYnN0YXI/OiBib29sZWFuO1xuICAvKiogV2hldGhlciBnbG9ic3RhciBzaG91bGQgYmUgY2FzZSBpbnNlbnNpdGl2ZS4gKi9cbiAgY2FzZUluc2Vuc2l0aXZlPzogYm9vbGVhbjtcbiAgLyoqIE9wZXJhdGluZyBzeXN0ZW0uIERlZmF1bHRzIHRvIHRoZSBuYXRpdmUgT1MuICovXG4gIG9zPzogdHlwZW9mIERlbm8uYnVpbGQub3M7XG59XG5cbmV4cG9ydCB0eXBlIEdsb2JUb1JlZ0V4cE9wdGlvbnMgPSBHbG9iT3B0aW9ucztcblxuLy8gZGVuby1mbXQtaWdub3JlXG5jb25zdCByZWdFeHBFc2NhcGVDaGFycyA9IFtcIiFcIiwgXCIkXCIsIFwiKFwiLCBcIilcIiwgXCIqXCIsIFwiK1wiLCBcIi5cIiwgXCI9XCIsIFwiP1wiLCBcIltcIiwgXCJcXFxcXCIsIFwiXlwiLCBcIntcIiwgXCJ8XCJdO1xuY29uc3QgcmFuZ2VFc2NhcGVDaGFycyA9IFtcIi1cIiwgXCJcXFxcXCIsIFwiXVwiXTtcblxuLyoqIENvbnZlcnQgYSBnbG9iIHN0cmluZyB0byBhIHJlZ3VsYXIgZXhwcmVzc2lvbi5cbiAqXG4gKiBUcmllcyB0byBtYXRjaCBiYXNoIGdsb2IgZXhwYW5zaW9uIGFzIGNsb3NlbHkgYXMgcG9zc2libGUuXG4gKlxuICogQmFzaWMgZ2xvYiBzeW50YXg6XG4gKiAtIGAqYCAtIE1hdGNoZXMgZXZlcnl0aGluZyB3aXRob3V0IGxlYXZpbmcgdGhlIHBhdGggc2VnbWVudC5cbiAqIC0gYHtmb28sYmFyfWAgLSBNYXRjaGVzIGBmb29gIG9yIGBiYXJgLlxuICogLSBgW2FiY2RdYCAtIE1hdGNoZXMgYGFgLCBgYmAsIGBjYCBvciBgZGAuXG4gKiAtIGBbYS1kXWAgLSBNYXRjaGVzIGBhYCwgYGJgLCBgY2Agb3IgYGRgLlxuICogLSBgWyFhYmNkXWAgLSBNYXRjaGVzIGFueSBzaW5nbGUgY2hhcmFjdGVyIGJlc2lkZXMgYGFgLCBgYmAsIGBjYCBvciBgZGAuXG4gKiAtIGBbWzo8Y2xhc3M+Ol1dYCAtIE1hdGNoZXMgYW55IGNoYXJhY3RlciBiZWxvbmdpbmcgdG8gYDxjbGFzcz5gLlxuICogICAgIC0gYFtbOmFsbnVtOl1dYCAtIE1hdGNoZXMgYW55IGRpZ2l0IG9yIGxldHRlci5cbiAqICAgICAtIGBbWzpkaWdpdDpdYWJjXWAgLSBNYXRjaGVzIGFueSBkaWdpdCwgYGFgLCBgYmAgb3IgYGNgLlxuICogICAgIC0gU2VlIGh0dHBzOi8vZmFjZWxlc3N1c2VyLmdpdGh1Yi5pby93Y21hdGNoL2dsb2IvI3Bvc2l4LWNoYXJhY3Rlci1jbGFzc2VzXG4gKiAgICAgICBmb3IgYSBjb21wbGV0ZSBsaXN0IG9mIHN1cHBvcnRlZCBjaGFyYWN0ZXIgY2xhc3Nlcy5cbiAqIC0gYFxcYCAtIEVzY2FwZXMgdGhlIG5leHQgY2hhcmFjdGVyIGZvciBhbiBgb3NgIG90aGVyIHRoYW4gYFwid2luZG93c1wiYC5cbiAqIC0gXFxgIC0gRXNjYXBlcyB0aGUgbmV4dCBjaGFyYWN0ZXIgZm9yIGBvc2Agc2V0IHRvIGBcIndpbmRvd3NcImAuXG4gKiAtIGAvYCAtIFBhdGggc2VwYXJhdG9yLlxuICogLSBgXFxgIC0gQWRkaXRpb25hbCBwYXRoIHNlcGFyYXRvciBvbmx5IGZvciBgb3NgIHNldCB0byBgXCJ3aW5kb3dzXCJgLlxuICpcbiAqIEV4dGVuZGVkIHN5bnRheDpcbiAqIC0gUmVxdWlyZXMgYHsgZXh0ZW5kZWQ6IHRydWUgfWAuXG4gKiAtIGA/KGZvb3xiYXIpYCAtIE1hdGNoZXMgMCBvciAxIGluc3RhbmNlIG9mIGB7Zm9vLGJhcn1gLlxuICogLSBgQChmb298YmFyKWAgLSBNYXRjaGVzIDEgaW5zdGFuY2Ugb2YgYHtmb28sYmFyfWAuIFRoZXkgYmVoYXZlIHRoZSBzYW1lLlxuICogLSBgKihmb298YmFyKWAgLSBNYXRjaGVzIF9uXyBpbnN0YW5jZXMgb2YgYHtmb28sYmFyfWAuXG4gKiAtIGArKGZvb3xiYXIpYCAtIE1hdGNoZXMgX24gPiAwXyBpbnN0YW5jZXMgb2YgYHtmb28sYmFyfWAuXG4gKiAtIGAhKGZvb3xiYXIpYCAtIE1hdGNoZXMgYW55dGhpbmcgb3RoZXIgdGhhbiBge2ZvbyxiYXJ9YC5cbiAqIC0gU2VlIGh0dHBzOi8vd3d3LmxpbnV4am91cm5hbC5jb20vY29udGVudC9iYXNoLWV4dGVuZGVkLWdsb2JiaW5nLlxuICpcbiAqIEdsb2JzdGFyIHN5bnRheDpcbiAqIC0gUmVxdWlyZXMgYHsgZ2xvYnN0YXI6IHRydWUgfWAuXG4gKiAtIGAqKmAgLSBNYXRjaGVzIGFueSBudW1iZXIgb2YgYW55IHBhdGggc2VnbWVudHMuXG4gKiAgICAgLSBNdXN0IGNvbXByaXNlIGl0cyBlbnRpcmUgcGF0aCBzZWdtZW50IGluIHRoZSBwcm92aWRlZCBnbG9iLlxuICogLSBTZWUgaHR0cHM6Ly93d3cubGludXhqb3VybmFsLmNvbS9jb250ZW50L2dsb2JzdGFyLW5ldy1iYXNoLWdsb2JiaW5nLW9wdGlvbi5cbiAqXG4gKiBOb3RlIHRoZSBmb2xsb3dpbmcgcHJvcGVydGllczpcbiAqIC0gVGhlIGdlbmVyYXRlZCBgUmVnRXhwYCBpcyBhbmNob3JlZCBhdCBib3RoIHN0YXJ0IGFuZCBlbmQuXG4gKiAtIFJlcGVhdGluZyBhbmQgdHJhaWxpbmcgc2VwYXJhdG9ycyBhcmUgdG9sZXJhdGVkLiBUcmFpbGluZyBzZXBhcmF0b3JzIGluIHRoZVxuICogICBwcm92aWRlZCBnbG9iIGhhdmUgbm8gbWVhbmluZyBhbmQgYXJlIGRpc2NhcmRlZC5cbiAqIC0gQWJzb2x1dGUgZ2xvYnMgd2lsbCBvbmx5IG1hdGNoIGFic29sdXRlIHBhdGhzLCBldGMuXG4gKiAtIEVtcHR5IGdsb2JzIHdpbGwgbWF0Y2ggbm90aGluZy5cbiAqIC0gQW55IHNwZWNpYWwgZ2xvYiBzeW50YXggbXVzdCBiZSBjb250YWluZWQgdG8gb25lIHBhdGggc2VnbWVudC4gRm9yIGV4YW1wbGUsXG4gKiAgIGA/KGZvb3xiYXIvYmF6KWAgaXMgaW52YWxpZC4gVGhlIHNlcGFyYXRvciB3aWxsIHRha2UgcHJlY2VuZGVuY2UgYW5kIHRoZVxuICogICBmaXJzdCBzZWdtZW50IGVuZHMgd2l0aCBhbiB1bmNsb3NlZCBncm91cC5cbiAqIC0gSWYgYSBwYXRoIHNlZ21lbnQgZW5kcyB3aXRoIHVuY2xvc2VkIGdyb3VwcyBvciBhIGRhbmdsaW5nIGVzY2FwZSBwcmVmaXgsIGFcbiAqICAgcGFyc2UgZXJyb3IgaGFzIG9jY3VyZWQuIEV2ZXJ5IGNoYXJhY3RlciBmb3IgdGhhdCBzZWdtZW50IGlzIHRha2VuXG4gKiAgIGxpdGVyYWxseSBpbiB0aGlzIGV2ZW50LlxuICpcbiAqIExpbWl0YXRpb25zOlxuICogLSBBIG5lZ2F0aXZlIGdyb3VwIGxpa2UgYCEoZm9vfGJhcilgIHdpbGwgd3JvbmdseSBiZSBjb252ZXJ0ZWQgdG8gYSBuZWdhdGl2ZVxuICogICBsb29rLWFoZWFkIGZvbGxvd2VkIGJ5IGEgd2lsZGNhcmQuIFRoaXMgbWVhbnMgdGhhdCBgIShmb28pLmpzYCB3aWxsIHdyb25nbHlcbiAqICAgZmFpbCB0byBtYXRjaCBgZm9vYmFyLmpzYCwgZXZlbiB0aG91Z2ggYGZvb2JhcmAgaXMgbm90IGBmb29gLiBFZmZlY3RpdmVseSxcbiAqICAgYCEoZm9vfGJhcilgIGlzIHRyZWF0ZWQgbGlrZSBgIShAKGZvb3xiYXIpKilgLiBUaGlzIHdpbGwgd29yayBjb3JyZWN0bHkgaWZcbiAqICAgdGhlIGdyb3VwIG9jY3VycyBub3QgbmVzdGVkIGF0IHRoZSBlbmQgb2YgdGhlIHNlZ21lbnQuICovXG5leHBvcnQgZnVuY3Rpb24gZ2xvYlRvUmVnRXhwKFxuICBnbG9iOiBzdHJpbmcsXG4gIHtcbiAgICBleHRlbmRlZCA9IHRydWUsXG4gICAgZ2xvYnN0YXI6IGdsb2JzdGFyT3B0aW9uID0gdHJ1ZSxcbiAgICBvcyA9IG9zVHlwZSxcbiAgICBjYXNlSW5zZW5zaXRpdmUgPSBmYWxzZSxcbiAgfTogR2xvYlRvUmVnRXhwT3B0aW9ucyA9IHt9LFxuKTogUmVnRXhwIHtcbiAgaWYgKGdsb2IgPT0gXCJcIikge1xuICAgIHJldHVybiAvKD8hKS87XG4gIH1cblxuICBjb25zdCBzZXAgPSBvcyA9PSBcIndpbmRvd3NcIiA/IFwiKD86XFxcXFxcXFx8LykrXCIgOiBcIi8rXCI7XG4gIGNvbnN0IHNlcE1heWJlID0gb3MgPT0gXCJ3aW5kb3dzXCIgPyBcIig/OlxcXFxcXFxcfC8pKlwiIDogXCIvKlwiO1xuICBjb25zdCBzZXBzID0gb3MgPT0gXCJ3aW5kb3dzXCIgPyBbXCJcXFxcXCIsIFwiL1wiXSA6IFtcIi9cIl07XG4gIGNvbnN0IGdsb2JzdGFyID0gb3MgPT0gXCJ3aW5kb3dzXCJcbiAgICA/IFwiKD86W15cXFxcXFxcXC9dKig/OlxcXFxcXFxcfC98JCkrKSpcIlxuICAgIDogXCIoPzpbXi9dKig/Oi98JCkrKSpcIjtcbiAgY29uc3Qgd2lsZGNhcmQgPSBvcyA9PSBcIndpbmRvd3NcIiA/IFwiW15cXFxcXFxcXC9dKlwiIDogXCJbXi9dKlwiO1xuICBjb25zdCBlc2NhcGVQcmVmaXggPSBvcyA9PSBcIndpbmRvd3NcIiA/IFwiYFwiIDogXCJcXFxcXCI7XG5cbiAgLy8gUmVtb3ZlIHRyYWlsaW5nIHNlcGFyYXRvcnMuXG4gIGxldCBuZXdMZW5ndGggPSBnbG9iLmxlbmd0aDtcbiAgZm9yICg7IG5ld0xlbmd0aCA+IDEgJiYgc2Vwcy5pbmNsdWRlcyhnbG9iW25ld0xlbmd0aCAtIDFdKTsgbmV3TGVuZ3RoLS0pO1xuICBnbG9iID0gZ2xvYi5zbGljZSgwLCBuZXdMZW5ndGgpO1xuXG4gIGxldCByZWdFeHBTdHJpbmcgPSBcIlwiO1xuXG4gIC8vIFRlcm1pbmF0ZXMgY29ycmVjdGx5LiBUcnVzdCB0aGF0IGBqYCBpcyBpbmNyZW1lbnRlZCBldmVyeSBpdGVyYXRpb24uXG4gIGZvciAobGV0IGogPSAwOyBqIDwgZ2xvYi5sZW5ndGg7KSB7XG4gICAgbGV0IHNlZ21lbnQgPSBcIlwiO1xuICAgIGNvbnN0IGdyb3VwU3RhY2sgPSBbXTtcbiAgICBsZXQgaW5SYW5nZSA9IGZhbHNlO1xuICAgIGxldCBpbkVzY2FwZSA9IGZhbHNlO1xuICAgIGxldCBlbmRzV2l0aFNlcCA9IGZhbHNlO1xuICAgIGxldCBpID0gajtcblxuICAgIC8vIFRlcm1pbmF0ZXMgd2l0aCBgaWAgYXQgdGhlIG5vbi1pbmNsdXNpdmUgZW5kIG9mIHRoZSBjdXJyZW50IHNlZ21lbnQuXG4gICAgZm9yICg7IGkgPCBnbG9iLmxlbmd0aCAmJiAhc2Vwcy5pbmNsdWRlcyhnbG9iW2ldKTsgaSsrKSB7XG4gICAgICBpZiAoaW5Fc2NhcGUpIHtcbiAgICAgICAgaW5Fc2NhcGUgPSBmYWxzZTtcbiAgICAgICAgY29uc3QgZXNjYXBlQ2hhcnMgPSBpblJhbmdlID8gcmFuZ2VFc2NhcGVDaGFycyA6IHJlZ0V4cEVzY2FwZUNoYXJzO1xuICAgICAgICBzZWdtZW50ICs9IGVzY2FwZUNoYXJzLmluY2x1ZGVzKGdsb2JbaV0pID8gYFxcXFwke2dsb2JbaV19YCA6IGdsb2JbaV07XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoZ2xvYltpXSA9PSBlc2NhcGVQcmVmaXgpIHtcbiAgICAgICAgaW5Fc2NhcGUgPSB0cnVlO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGdsb2JbaV0gPT0gXCJbXCIpIHtcbiAgICAgICAgaWYgKCFpblJhbmdlKSB7XG4gICAgICAgICAgaW5SYW5nZSA9IHRydWU7XG4gICAgICAgICAgc2VnbWVudCArPSBcIltcIjtcbiAgICAgICAgICBpZiAoZ2xvYltpICsgMV0gPT0gXCIhXCIpIHtcbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgIHNlZ21lbnQgKz0gXCJeXCI7XG4gICAgICAgICAgfSBlbHNlIGlmIChnbG9iW2kgKyAxXSA9PSBcIl5cIikge1xuICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgc2VnbWVudCArPSBcIlxcXFxeXCI7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9IGVsc2UgaWYgKGdsb2JbaSArIDFdID09IFwiOlwiKSB7XG4gICAgICAgICAgbGV0IGsgPSBpICsgMTtcbiAgICAgICAgICBsZXQgdmFsdWUgPSBcIlwiO1xuICAgICAgICAgIHdoaWxlIChnbG9iW2sgKyAxXSAhPSBudWxsICYmIGdsb2JbayArIDFdICE9IFwiOlwiKSB7XG4gICAgICAgICAgICB2YWx1ZSArPSBnbG9iW2sgKyAxXTtcbiAgICAgICAgICAgIGsrKztcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGdsb2JbayArIDFdID09IFwiOlwiICYmIGdsb2JbayArIDJdID09IFwiXVwiKSB7XG4gICAgICAgICAgICBpID0gayArIDI7XG4gICAgICAgICAgICBpZiAodmFsdWUgPT0gXCJhbG51bVwiKSBzZWdtZW50ICs9IFwiXFxcXGRBLVphLXpcIjtcbiAgICAgICAgICAgIGVsc2UgaWYgKHZhbHVlID09IFwiYWxwaGFcIikgc2VnbWVudCArPSBcIkEtWmEtelwiO1xuICAgICAgICAgICAgZWxzZSBpZiAodmFsdWUgPT0gXCJhc2NpaVwiKSBzZWdtZW50ICs9IFwiXFx4MDAtXFx4N0ZcIjtcbiAgICAgICAgICAgIGVsc2UgaWYgKHZhbHVlID09IFwiYmxhbmtcIikgc2VnbWVudCArPSBcIlxcdCBcIjtcbiAgICAgICAgICAgIGVsc2UgaWYgKHZhbHVlID09IFwiY250cmxcIikgc2VnbWVudCArPSBcIlxceDAwLVxceDFGXFx4N0ZcIjtcbiAgICAgICAgICAgIGVsc2UgaWYgKHZhbHVlID09IFwiZGlnaXRcIikgc2VnbWVudCArPSBcIlxcXFxkXCI7XG4gICAgICAgICAgICBlbHNlIGlmICh2YWx1ZSA9PSBcImdyYXBoXCIpIHNlZ21lbnQgKz0gXCJcXHgyMS1cXHg3RVwiO1xuICAgICAgICAgICAgZWxzZSBpZiAodmFsdWUgPT0gXCJsb3dlclwiKSBzZWdtZW50ICs9IFwiYS16XCI7XG4gICAgICAgICAgICBlbHNlIGlmICh2YWx1ZSA9PSBcInByaW50XCIpIHNlZ21lbnQgKz0gXCJcXHgyMC1cXHg3RVwiO1xuICAgICAgICAgICAgZWxzZSBpZiAodmFsdWUgPT0gXCJwdW5jdFwiKSB7XG4gICAgICAgICAgICAgIHNlZ21lbnQgKz0gXCIhXFxcIiMkJSYnKCkqKyxcXFxcLS4vOjs8PT4/QFtcXFxcXFxcXFxcXFxdXl/igJh7fH1+XCI7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHZhbHVlID09IFwic3BhY2VcIikgc2VnbWVudCArPSBcIlxcXFxzXFx2XCI7XG4gICAgICAgICAgICBlbHNlIGlmICh2YWx1ZSA9PSBcInVwcGVyXCIpIHNlZ21lbnQgKz0gXCJBLVpcIjtcbiAgICAgICAgICAgIGVsc2UgaWYgKHZhbHVlID09IFwid29yZFwiKSBzZWdtZW50ICs9IFwiXFxcXHdcIjtcbiAgICAgICAgICAgIGVsc2UgaWYgKHZhbHVlID09IFwieGRpZ2l0XCIpIHNlZ21lbnQgKz0gXCJcXFxcZEEtRmEtZlwiO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChnbG9iW2ldID09IFwiXVwiICYmIGluUmFuZ2UpIHtcbiAgICAgICAgaW5SYW5nZSA9IGZhbHNlO1xuICAgICAgICBzZWdtZW50ICs9IFwiXVwiO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGluUmFuZ2UpIHtcbiAgICAgICAgaWYgKGdsb2JbaV0gPT0gXCJcXFxcXCIpIHtcbiAgICAgICAgICBzZWdtZW50ICs9IGBcXFxcXFxcXGA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2VnbWVudCArPSBnbG9iW2ldO1xuICAgICAgICB9XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoXG4gICAgICAgIGdsb2JbaV0gPT0gXCIpXCIgJiYgZ3JvdXBTdGFjay5sZW5ndGggPiAwICYmXG4gICAgICAgIGdyb3VwU3RhY2tbZ3JvdXBTdGFjay5sZW5ndGggLSAxXSAhPSBcIkJSQUNFXCJcbiAgICAgICkge1xuICAgICAgICBzZWdtZW50ICs9IFwiKVwiO1xuICAgICAgICBjb25zdCB0eXBlID0gZ3JvdXBTdGFjay5wb3AoKSE7XG4gICAgICAgIGlmICh0eXBlID09IFwiIVwiKSB7XG4gICAgICAgICAgc2VnbWVudCArPSB3aWxkY2FyZDtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlICE9IFwiQFwiKSB7XG4gICAgICAgICAgc2VnbWVudCArPSB0eXBlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoXG4gICAgICAgIGdsb2JbaV0gPT0gXCJ8XCIgJiYgZ3JvdXBTdGFjay5sZW5ndGggPiAwICYmXG4gICAgICAgIGdyb3VwU3RhY2tbZ3JvdXBTdGFjay5sZW5ndGggLSAxXSAhPSBcIkJSQUNFXCJcbiAgICAgICkge1xuICAgICAgICBzZWdtZW50ICs9IFwifFwiO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGdsb2JbaV0gPT0gXCIrXCIgJiYgZXh0ZW5kZWQgJiYgZ2xvYltpICsgMV0gPT0gXCIoXCIpIHtcbiAgICAgICAgaSsrO1xuICAgICAgICBncm91cFN0YWNrLnB1c2goXCIrXCIpO1xuICAgICAgICBzZWdtZW50ICs9IFwiKD86XCI7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoZ2xvYltpXSA9PSBcIkBcIiAmJiBleHRlbmRlZCAmJiBnbG9iW2kgKyAxXSA9PSBcIihcIikge1xuICAgICAgICBpKys7XG4gICAgICAgIGdyb3VwU3RhY2sucHVzaChcIkBcIik7XG4gICAgICAgIHNlZ21lbnQgKz0gXCIoPzpcIjtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChnbG9iW2ldID09IFwiP1wiKSB7XG4gICAgICAgIGlmIChleHRlbmRlZCAmJiBnbG9iW2kgKyAxXSA9PSBcIihcIikge1xuICAgICAgICAgIGkrKztcbiAgICAgICAgICBncm91cFN0YWNrLnB1c2goXCI/XCIpO1xuICAgICAgICAgIHNlZ21lbnQgKz0gXCIoPzpcIjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZWdtZW50ICs9IFwiLlwiO1xuICAgICAgICB9XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoZ2xvYltpXSA9PSBcIiFcIiAmJiBleHRlbmRlZCAmJiBnbG9iW2kgKyAxXSA9PSBcIihcIikge1xuICAgICAgICBpKys7XG4gICAgICAgIGdyb3VwU3RhY2sucHVzaChcIiFcIik7XG4gICAgICAgIHNlZ21lbnQgKz0gXCIoPyFcIjtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChnbG9iW2ldID09IFwie1wiKSB7XG4gICAgICAgIGdyb3VwU3RhY2sucHVzaChcIkJSQUNFXCIpO1xuICAgICAgICBzZWdtZW50ICs9IFwiKD86XCI7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoZ2xvYltpXSA9PSBcIn1cIiAmJiBncm91cFN0YWNrW2dyb3VwU3RhY2subGVuZ3RoIC0gMV0gPT0gXCJCUkFDRVwiKSB7XG4gICAgICAgIGdyb3VwU3RhY2sucG9wKCk7XG4gICAgICAgIHNlZ21lbnQgKz0gXCIpXCI7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoZ2xvYltpXSA9PSBcIixcIiAmJiBncm91cFN0YWNrW2dyb3VwU3RhY2subGVuZ3RoIC0gMV0gPT0gXCJCUkFDRVwiKSB7XG4gICAgICAgIHNlZ21lbnQgKz0gXCJ8XCI7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoZ2xvYltpXSA9PSBcIipcIikge1xuICAgICAgICBpZiAoZXh0ZW5kZWQgJiYgZ2xvYltpICsgMV0gPT0gXCIoXCIpIHtcbiAgICAgICAgICBpKys7XG4gICAgICAgICAgZ3JvdXBTdGFjay5wdXNoKFwiKlwiKTtcbiAgICAgICAgICBzZWdtZW50ICs9IFwiKD86XCI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc3QgcHJldkNoYXIgPSBnbG9iW2kgLSAxXTtcbiAgICAgICAgICBsZXQgbnVtU3RhcnMgPSAxO1xuICAgICAgICAgIHdoaWxlIChnbG9iW2kgKyAxXSA9PSBcIipcIikge1xuICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgbnVtU3RhcnMrKztcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgbmV4dENoYXIgPSBnbG9iW2kgKyAxXTtcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICBnbG9ic3Rhck9wdGlvbiAmJiBudW1TdGFycyA9PSAyICYmXG4gICAgICAgICAgICBbLi4uc2VwcywgdW5kZWZpbmVkXS5pbmNsdWRlcyhwcmV2Q2hhcikgJiZcbiAgICAgICAgICAgIFsuLi5zZXBzLCB1bmRlZmluZWRdLmluY2x1ZGVzKG5leHRDaGFyKVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgc2VnbWVudCArPSBnbG9ic3RhcjtcbiAgICAgICAgICAgIGVuZHNXaXRoU2VwID0gdHJ1ZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VnbWVudCArPSB3aWxkY2FyZDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIHNlZ21lbnQgKz0gcmVnRXhwRXNjYXBlQ2hhcnMuaW5jbHVkZXMoZ2xvYltpXSkgPyBgXFxcXCR7Z2xvYltpXX1gIDogZ2xvYltpXTtcbiAgICB9XG5cbiAgICAvLyBDaGVjayBmb3IgdW5jbG9zZWQgZ3JvdXBzIG9yIGEgZGFuZ2xpbmcgYmFja3NsYXNoLlxuICAgIGlmIChncm91cFN0YWNrLmxlbmd0aCA+IDAgfHwgaW5SYW5nZSB8fCBpbkVzY2FwZSkge1xuICAgICAgLy8gUGFyc2UgZmFpbHVyZS4gVGFrZSBhbGwgY2hhcmFjdGVycyBmcm9tIHRoaXMgc2VnbWVudCBsaXRlcmFsbHkuXG4gICAgICBzZWdtZW50ID0gXCJcIjtcbiAgICAgIGZvciAoY29uc3QgYyBvZiBnbG9iLnNsaWNlKGosIGkpKSB7XG4gICAgICAgIHNlZ21lbnQgKz0gcmVnRXhwRXNjYXBlQ2hhcnMuaW5jbHVkZXMoYykgPyBgXFxcXCR7Y31gIDogYztcbiAgICAgICAgZW5kc1dpdGhTZXAgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZWdFeHBTdHJpbmcgKz0gc2VnbWVudDtcbiAgICBpZiAoIWVuZHNXaXRoU2VwKSB7XG4gICAgICByZWdFeHBTdHJpbmcgKz0gaSA8IGdsb2IubGVuZ3RoID8gc2VwIDogc2VwTWF5YmU7XG4gICAgICBlbmRzV2l0aFNlcCA9IHRydWU7XG4gICAgfVxuXG4gICAgLy8gVGVybWluYXRlcyB3aXRoIGBpYCBhdCB0aGUgc3RhcnQgb2YgdGhlIG5leHQgc2VnbWVudC5cbiAgICB3aGlsZSAoc2Vwcy5pbmNsdWRlcyhnbG9iW2ldKSkgaSsrO1xuXG4gICAgLy8gQ2hlY2sgdGhhdCB0aGUgbmV4dCB2YWx1ZSBvZiBgamAgaXMgaW5kZWVkIGhpZ2hlciB0aGFuIHRoZSBjdXJyZW50IHZhbHVlLlxuICAgIGlmICghKGkgPiBqKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQXNzZXJ0aW9uIGZhaWx1cmU6IGkgPiBqIChwb3RlbnRpYWwgaW5maW5pdGUgbG9vcClcIik7XG4gICAgfVxuICAgIGogPSBpO1xuICB9XG5cbiAgcmVnRXhwU3RyaW5nID0gYF4ke3JlZ0V4cFN0cmluZ30kYDtcbiAgcmV0dXJuIG5ldyBSZWdFeHAocmVnRXhwU3RyaW5nLCBjYXNlSW5zZW5zaXRpdmUgPyBcImlcIiA6IFwiXCIpO1xufVxuXG4vKiogVGVzdCB3aGV0aGVyIHRoZSBnaXZlbiBzdHJpbmcgaXMgYSBnbG9iICovXG5leHBvcnQgZnVuY3Rpb24gaXNHbG9iKHN0cjogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IGNoYXJzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0geyBcIntcIjogXCJ9XCIsIFwiKFwiOiBcIilcIiwgXCJbXCI6IFwiXVwiIH07XG4gIGNvbnN0IHJlZ2V4ID1cbiAgICAvXFxcXCguKXwoXiF8XFwqfFtcXF0uKyldXFw/fFxcW1teXFxcXFxcXV0rXFxdfFxce1teXFxcXH1dK1xcfXxcXChcXD9bOiE9XVteXFxcXCldK1xcKXxcXChbXnxdK1xcfFteXFxcXCldK1xcKSkvO1xuXG4gIGlmIChzdHIgPT09IFwiXCIpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBsZXQgbWF0Y2g6IFJlZ0V4cEV4ZWNBcnJheSB8IG51bGw7XG5cbiAgd2hpbGUgKChtYXRjaCA9IHJlZ2V4LmV4ZWMoc3RyKSkpIHtcbiAgICBpZiAobWF0Y2hbMl0pIHJldHVybiB0cnVlO1xuICAgIGxldCBpZHggPSBtYXRjaC5pbmRleCArIG1hdGNoWzBdLmxlbmd0aDtcblxuICAgIC8vIGlmIGFuIG9wZW4gYnJhY2tldC9icmFjZS9wYXJlbiBpcyBlc2NhcGVkLFxuICAgIC8vIHNldCB0aGUgaW5kZXggdG8gdGhlIG5leHQgY2xvc2luZyBjaGFyYWN0ZXJcbiAgICBjb25zdCBvcGVuID0gbWF0Y2hbMV07XG4gICAgY29uc3QgY2xvc2UgPSBvcGVuID8gY2hhcnNbb3Blbl0gOiBudWxsO1xuICAgIGlmIChvcGVuICYmIGNsb3NlKSB7XG4gICAgICBjb25zdCBuID0gc3RyLmluZGV4T2YoY2xvc2UsIGlkeCk7XG4gICAgICBpZiAobiAhPT0gLTEpIHtcbiAgICAgICAgaWR4ID0gbiArIDE7XG4gICAgICB9XG4gICAgfVxuXG4gICAgc3RyID0gc3RyLnNsaWNlKGlkeCk7XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKiBMaWtlIG5vcm1hbGl6ZSgpLCBidXQgZG9lc24ndCBjb2xsYXBzZSBcIioqXFwvLi5cIiB3aGVuIGBnbG9ic3RhcmAgaXMgdHJ1ZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVHbG9iKFxuICBnbG9iOiBzdHJpbmcsXG4gIHsgZ2xvYnN0YXIgPSBmYWxzZSB9OiBHbG9iT3B0aW9ucyA9IHt9LFxuKTogc3RyaW5nIHtcbiAgaWYgKGdsb2IubWF0Y2goL1xcMC9nKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgR2xvYiBjb250YWlucyBpbnZhbGlkIGNoYXJhY3RlcnM6IFwiJHtnbG9ifVwiYCk7XG4gIH1cbiAgaWYgKCFnbG9ic3Rhcikge1xuICAgIHJldHVybiBub3JtYWxpemUoZ2xvYik7XG4gIH1cbiAgY29uc3QgcyA9IFNFUF9QQVRURVJOLnNvdXJjZTtcbiAgY29uc3QgYmFkUGFyZW50UGF0dGVybiA9IG5ldyBSZWdFeHAoXG4gICAgYCg/PD0oJHtzfXxeKVxcXFwqXFxcXCoke3N9KVxcXFwuXFxcXC4oPz0ke3N9fCQpYCxcbiAgICBcImdcIixcbiAgKTtcbiAgcmV0dXJuIG5vcm1hbGl6ZShnbG9iLnJlcGxhY2UoYmFkUGFyZW50UGF0dGVybiwgXCJcXDBcIikpLnJlcGxhY2UoL1xcMC9nLCBcIi4uXCIpO1xufVxuXG4vKiogTGlrZSBqb2luKCksIGJ1dCBkb2Vzbid0IGNvbGxhcHNlIFwiKipcXC8uLlwiIHdoZW4gYGdsb2JzdGFyYCBpcyB0cnVlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGpvaW5HbG9icyhcbiAgZ2xvYnM6IHN0cmluZ1tdLFxuICB7IGV4dGVuZGVkID0gZmFsc2UsIGdsb2JzdGFyID0gZmFsc2UgfTogR2xvYk9wdGlvbnMgPSB7fSxcbik6IHN0cmluZyB7XG4gIGlmICghZ2xvYnN0YXIgfHwgZ2xvYnMubGVuZ3RoID09IDApIHtcbiAgICByZXR1cm4gam9pbiguLi5nbG9icyk7XG4gIH1cbiAgaWYgKGdsb2JzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIFwiLlwiO1xuICBsZXQgam9pbmVkOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gIGZvciAoY29uc3QgZ2xvYiBvZiBnbG9icykge1xuICAgIGNvbnN0IHBhdGggPSBnbG9iO1xuICAgIGlmIChwYXRoLmxlbmd0aCA+IDApIHtcbiAgICAgIGlmICgham9pbmVkKSBqb2luZWQgPSBwYXRoO1xuICAgICAgZWxzZSBqb2luZWQgKz0gYCR7U0VQfSR7cGF0aH1gO1xuICAgIH1cbiAgfVxuICBpZiAoIWpvaW5lZCkgcmV0dXJuIFwiLlwiO1xuICByZXR1cm4gbm9ybWFsaXplR2xvYihqb2luZWQsIHsgZXh0ZW5kZWQsIGdsb2JzdGFyIH0pO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEw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