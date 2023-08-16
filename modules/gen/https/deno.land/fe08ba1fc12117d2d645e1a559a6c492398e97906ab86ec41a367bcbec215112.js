export function notImplemented(msg) {
    const message = msg ? `Not implemented: ${msg}` : "Not implemented";
    throw new Error(message);
}
export const _TextDecoder = TextDecoder;
export const _TextEncoder = TextEncoder;
export function intoCallbackAPI(// eslint-disable-next-line @typescript-eslint/no-explicit-any
func, cb, // eslint-disable-next-line @typescript-eslint/no-explicit-any
...args) {
    func(...args).then((value)=>cb && cb(null, value)).catch((err)=>cb && cb(err, null));
}
export function intoCallbackAPIWithIntercept(// eslint-disable-next-line @typescript-eslint/no-explicit-any
func, interceptor, cb, // eslint-disable-next-line @typescript-eslint/no-explicit-any
...args) {
    func(...args).then((value)=>cb && cb(null, interceptor(value))).catch((err)=>cb && cb(err, null));
}
export function spliceOne(list, index) {
    for(; index + 1 < list.length; index++)list[index] = list[index + 1];
    list.pop();
}
// Taken from: https://github.com/nodejs/node/blob/ba684805b6c0eded76e5cd89ee00328ac7a59365/lib/internal/util.js#L125
// Return undefined if there is no match.
// Move the "slow cases" to a separate function to make sure this function gets
// inlined properly. That prioritizes the common case.
export function normalizeEncoding(enc) {
    if (enc == null || enc === "utf8" || enc === "utf-8") return "utf8";
    return slowCases(enc);
}
// https://github.com/nodejs/node/blob/ba684805b6c0eded76e5cd89ee00328ac7a59365/lib/internal/util.js#L130
function slowCases(enc) {
    switch(enc.length){
        case 4:
            if (enc === "UTF8") return "utf8";
            if (enc === "ucs2" || enc === "UCS2") return "utf16le";
            enc = `${enc}`.toLowerCase();
            if (enc === "utf8") return "utf8";
            if (enc === "ucs2") return "utf16le";
            break;
        case 3:
            if (enc === "hex" || enc === "HEX" || `${enc}`.toLowerCase() === "hex") {
                return "hex";
            }
            break;
        case 5:
            if (enc === "ascii") return "ascii";
            if (enc === "ucs-2") return "utf16le";
            if (enc === "UTF-8") return "utf8";
            if (enc === "ASCII") return "ascii";
            if (enc === "UCS-2") return "utf16le";
            enc = `${enc}`.toLowerCase();
            if (enc === "utf-8") return "utf8";
            if (enc === "ascii") return "ascii";
            if (enc === "ucs-2") return "utf16le";
            break;
        case 6:
            if (enc === "base64") return "base64";
            if (enc === "latin1" || enc === "binary") return "latin1";
            if (enc === "BASE64") return "base64";
            if (enc === "LATIN1" || enc === "BINARY") return "latin1";
            enc = `${enc}`.toLowerCase();
            if (enc === "base64") return "base64";
            if (enc === "latin1" || enc === "binary") return "latin1";
            break;
        case 7:
            if (enc === "utf16le" || enc === "UTF16LE" || `${enc}`.toLowerCase() === "utf16le") {
                return "utf16le";
            }
            break;
        case 8:
            if (enc === "utf-16le" || enc === "UTF-16LE" || `${enc}`.toLowerCase() === "utf-16le") {
                return "utf16le";
            }
            break;
        default:
            if (enc === "") return "utf8";
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjYzLjAvbm9kZS9fdXRpbHMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGZ1bmN0aW9uIG5vdEltcGxlbWVudGVkKG1zZz86IHN0cmluZyk6IG5ldmVyIHtcbiAgY29uc3QgbWVzc2FnZSA9IG1zZyA/IGBOb3QgaW1wbGVtZW50ZWQ6ICR7bXNnfWAgOiBcIk5vdCBpbXBsZW1lbnRlZFwiO1xuICB0aHJvdyBuZXcgRXJyb3IobWVzc2FnZSk7XG59XG5cbmV4cG9ydCB0eXBlIF9UZXh0RGVjb2RlciA9IHR5cGVvZiBUZXh0RGVjb2Rlci5wcm90b3R5cGU7XG5leHBvcnQgY29uc3QgX1RleHREZWNvZGVyID0gVGV4dERlY29kZXI7XG5cbmV4cG9ydCB0eXBlIF9UZXh0RW5jb2RlciA9IHR5cGVvZiBUZXh0RW5jb2Rlci5wcm90b3R5cGU7XG5leHBvcnQgY29uc3QgX1RleHRFbmNvZGVyID0gVGV4dEVuY29kZXI7XG5cbi8vIEFQSSBoZWxwZXJzXG5cbmV4cG9ydCB0eXBlIE1heWJlTnVsbDxUPiA9IFQgfCBudWxsO1xuZXhwb3J0IHR5cGUgTWF5YmVEZWZpbmVkPFQ+ID0gVCB8IHVuZGVmaW5lZDtcbmV4cG9ydCB0eXBlIE1heWJlRW1wdHk8VD4gPSBUIHwgbnVsbCB8IHVuZGVmaW5lZDtcblxuZXhwb3J0IGZ1bmN0aW9uIGludG9DYWxsYmFja0FQSTxUPihcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgZnVuYzogKC4uLmFyZ3M6IGFueVtdKSA9PiBQcm9taXNlPFQ+LFxuICBjYjogTWF5YmVFbXB0eTwoZXJyOiBNYXliZU51bGw8RXJyb3I+LCB2YWx1ZTogTWF5YmVFbXB0eTxUPikgPT4gdm9pZD4sXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gIC4uLmFyZ3M6IGFueVtdXG4pOiB2b2lkIHtcbiAgZnVuYyguLi5hcmdzKVxuICAgIC50aGVuKCh2YWx1ZSkgPT4gY2IgJiYgY2IobnVsbCwgdmFsdWUpKVxuICAgIC5jYXRjaCgoZXJyKSA9PiBjYiAmJiBjYihlcnIsIG51bGwpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGludG9DYWxsYmFja0FQSVdpdGhJbnRlcmNlcHQ8VDEsIFQyPihcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgZnVuYzogKC4uLmFyZ3M6IGFueVtdKSA9PiBQcm9taXNlPFQxPixcbiAgaW50ZXJjZXB0b3I6ICh2OiBUMSkgPT4gVDIsXG4gIGNiOiBNYXliZUVtcHR5PChlcnI6IE1heWJlTnVsbDxFcnJvcj4sIHZhbHVlOiBNYXliZUVtcHR5PFQyPikgPT4gdm9pZD4sXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gIC4uLmFyZ3M6IGFueVtdXG4pOiB2b2lkIHtcbiAgZnVuYyguLi5hcmdzKVxuICAgIC50aGVuKCh2YWx1ZSkgPT4gY2IgJiYgY2IobnVsbCwgaW50ZXJjZXB0b3IodmFsdWUpKSlcbiAgICAuY2F0Y2goKGVycikgPT4gY2IgJiYgY2IoZXJyLCBudWxsKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzcGxpY2VPbmUobGlzdDogc3RyaW5nW10sIGluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgZm9yICg7IGluZGV4ICsgMSA8IGxpc3QubGVuZ3RoOyBpbmRleCsrKSBsaXN0W2luZGV4XSA9IGxpc3RbaW5kZXggKyAxXTtcbiAgbGlzdC5wb3AoKTtcbn1cblxuLy8gVGFrZW4gZnJvbTogaHR0cHM6Ly9naXRodWIuY29tL25vZGVqcy9ub2RlL2Jsb2IvYmE2ODQ4MDViNmMwZWRlZDc2ZTVjZDg5ZWUwMDMyOGFjN2E1OTM2NS9saWIvaW50ZXJuYWwvdXRpbC5qcyNMMTI1XG4vLyBSZXR1cm4gdW5kZWZpbmVkIGlmIHRoZXJlIGlzIG5vIG1hdGNoLlxuLy8gTW92ZSB0aGUgXCJzbG93IGNhc2VzXCIgdG8gYSBzZXBhcmF0ZSBmdW5jdGlvbiB0byBtYWtlIHN1cmUgdGhpcyBmdW5jdGlvbiBnZXRzXG4vLyBpbmxpbmVkIHByb3Blcmx5LiBUaGF0IHByaW9yaXRpemVzIHRoZSBjb21tb24gY2FzZS5cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVFbmNvZGluZyhlbmM6IHN0cmluZyB8IG51bGwpOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICBpZiAoZW5jID09IG51bGwgfHwgZW5jID09PSBcInV0ZjhcIiB8fCBlbmMgPT09IFwidXRmLThcIikgcmV0dXJuIFwidXRmOFwiO1xuICByZXR1cm4gc2xvd0Nhc2VzKGVuYyk7XG59XG5cbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9ub2RlanMvbm9kZS9ibG9iL2JhNjg0ODA1YjZjMGVkZWQ3NmU1Y2Q4OWVlMDAzMjhhYzdhNTkzNjUvbGliL2ludGVybmFsL3V0aWwuanMjTDEzMFxuZnVuY3Rpb24gc2xvd0Nhc2VzKGVuYzogc3RyaW5nKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgc3dpdGNoIChlbmMubGVuZ3RoKSB7XG4gICAgY2FzZSA0OlxuICAgICAgaWYgKGVuYyA9PT0gXCJVVEY4XCIpIHJldHVybiBcInV0ZjhcIjtcbiAgICAgIGlmIChlbmMgPT09IFwidWNzMlwiIHx8IGVuYyA9PT0gXCJVQ1MyXCIpIHJldHVybiBcInV0ZjE2bGVcIjtcbiAgICAgIGVuYyA9IGAke2VuY31gLnRvTG93ZXJDYXNlKCk7XG4gICAgICBpZiAoZW5jID09PSBcInV0ZjhcIikgcmV0dXJuIFwidXRmOFwiO1xuICAgICAgaWYgKGVuYyA9PT0gXCJ1Y3MyXCIpIHJldHVybiBcInV0ZjE2bGVcIjtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgMzpcbiAgICAgIGlmIChlbmMgPT09IFwiaGV4XCIgfHwgZW5jID09PSBcIkhFWFwiIHx8IGAke2VuY31gLnRvTG93ZXJDYXNlKCkgPT09IFwiaGV4XCIpIHtcbiAgICAgICAgcmV0dXJuIFwiaGV4XCI7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlIDU6XG4gICAgICBpZiAoZW5jID09PSBcImFzY2lpXCIpIHJldHVybiBcImFzY2lpXCI7XG4gICAgICBpZiAoZW5jID09PSBcInVjcy0yXCIpIHJldHVybiBcInV0ZjE2bGVcIjtcbiAgICAgIGlmIChlbmMgPT09IFwiVVRGLThcIikgcmV0dXJuIFwidXRmOFwiO1xuICAgICAgaWYgKGVuYyA9PT0gXCJBU0NJSVwiKSByZXR1cm4gXCJhc2NpaVwiO1xuICAgICAgaWYgKGVuYyA9PT0gXCJVQ1MtMlwiKSByZXR1cm4gXCJ1dGYxNmxlXCI7XG4gICAgICBlbmMgPSBgJHtlbmN9YC50b0xvd2VyQ2FzZSgpO1xuICAgICAgaWYgKGVuYyA9PT0gXCJ1dGYtOFwiKSByZXR1cm4gXCJ1dGY4XCI7XG4gICAgICBpZiAoZW5jID09PSBcImFzY2lpXCIpIHJldHVybiBcImFzY2lpXCI7XG4gICAgICBpZiAoZW5jID09PSBcInVjcy0yXCIpIHJldHVybiBcInV0ZjE2bGVcIjtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgNjpcbiAgICAgIGlmIChlbmMgPT09IFwiYmFzZTY0XCIpIHJldHVybiBcImJhc2U2NFwiO1xuICAgICAgaWYgKGVuYyA9PT0gXCJsYXRpbjFcIiB8fCBlbmMgPT09IFwiYmluYXJ5XCIpIHJldHVybiBcImxhdGluMVwiO1xuICAgICAgaWYgKGVuYyA9PT0gXCJCQVNFNjRcIikgcmV0dXJuIFwiYmFzZTY0XCI7XG4gICAgICBpZiAoZW5jID09PSBcIkxBVElOMVwiIHx8IGVuYyA9PT0gXCJCSU5BUllcIikgcmV0dXJuIFwibGF0aW4xXCI7XG4gICAgICBlbmMgPSBgJHtlbmN9YC50b0xvd2VyQ2FzZSgpO1xuICAgICAgaWYgKGVuYyA9PT0gXCJiYXNlNjRcIikgcmV0dXJuIFwiYmFzZTY0XCI7XG4gICAgICBpZiAoZW5jID09PSBcImxhdGluMVwiIHx8IGVuYyA9PT0gXCJiaW5hcnlcIikgcmV0dXJuIFwibGF0aW4xXCI7XG4gICAgICBicmVhaztcbiAgICBjYXNlIDc6XG4gICAgICBpZiAoXG4gICAgICAgIGVuYyA9PT0gXCJ1dGYxNmxlXCIgfHxcbiAgICAgICAgZW5jID09PSBcIlVURjE2TEVcIiB8fFxuICAgICAgICBgJHtlbmN9YC50b0xvd2VyQ2FzZSgpID09PSBcInV0ZjE2bGVcIlxuICAgICAgKSB7XG4gICAgICAgIHJldHVybiBcInV0ZjE2bGVcIjtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgODpcbiAgICAgIGlmIChcbiAgICAgICAgZW5jID09PSBcInV0Zi0xNmxlXCIgfHxcbiAgICAgICAgZW5jID09PSBcIlVURi0xNkxFXCIgfHxcbiAgICAgICAgYCR7ZW5jfWAudG9Mb3dlckNhc2UoKSA9PT0gXCJ1dGYtMTZsZVwiXG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuIFwidXRmMTZsZVwiO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIGlmIChlbmMgPT09IFwiXCIpIHJldHVybiBcInV0ZjhcIjtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sU0FBUyxlQUFlLEdBQVk7SUFDekMsTUFBTSxVQUFVLE1BQU0sQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsR0FBRztJQUNsRCxNQUFNLElBQUksTUFBTTtBQUNsQjtBQUdBLE9BQU8sTUFBTSxlQUFlLFlBQVk7QUFHeEMsT0FBTyxNQUFNLGVBQWUsWUFBWTtBQVF4QyxPQUFPLFNBQVMsZ0JBQ2QsOERBQThEO0FBQzlELElBQW9DLEVBQ3BDLEVBQXFFLEVBQ3JFLDhEQUE4RDtBQUM5RCxHQUFHLElBQVc7SUFFZCxRQUFRLE1BQ0wsS0FBSyxDQUFDLFFBQVUsTUFBTSxHQUFHLE1BQU0sUUFDL0IsTUFBTSxDQUFDLE1BQVEsTUFBTSxHQUFHLEtBQUs7QUFDbEM7QUFFQSxPQUFPLFNBQVMsNkJBQ2QsOERBQThEO0FBQzlELElBQXFDLEVBQ3JDLFdBQTBCLEVBQzFCLEVBQXNFLEVBQ3RFLDhEQUE4RDtBQUM5RCxHQUFHLElBQVc7SUFFZCxRQUFRLE1BQ0wsS0FBSyxDQUFDLFFBQVUsTUFBTSxHQUFHLE1BQU0sWUFBWSxTQUMzQyxNQUFNLENBQUMsTUFBUSxNQUFNLEdBQUcsS0FBSztBQUNsQztBQUVBLE9BQU8sU0FBUyxVQUFVLElBQWMsRUFBRSxLQUFhO0lBQ3JELE1BQU8sUUFBUSxJQUFJLEtBQUssUUFBUSxRQUFTLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRTtJQUN0RSxLQUFLO0FBQ1A7QUFFQSxxSEFBcUg7QUFDckgseUNBQXlDO0FBQ3pDLCtFQUErRTtBQUMvRSxzREFBc0Q7QUFDdEQsT0FBTyxTQUFTLGtCQUFrQixHQUFrQjtJQUNsRCxJQUFJLE9BQU8sUUFBUSxRQUFRLFVBQVUsUUFBUSxTQUFTLE9BQU87SUFDN0QsT0FBTyxVQUFVO0FBQ25CO0FBRUEseUdBQXlHO0FBQ3pHLFNBQVMsVUFBVSxHQUFXO0lBQzVCLE9BQVEsSUFBSTtRQUNWLEtBQUs7WUFDSCxJQUFJLFFBQVEsUUFBUSxPQUFPO1lBQzNCLElBQUksUUFBUSxVQUFVLFFBQVEsUUFBUSxPQUFPO1lBQzdDLE1BQU0sQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2YsSUFBSSxRQUFRLFFBQVEsT0FBTztZQUMzQixJQUFJLFFBQVEsUUFBUSxPQUFPO1lBQzNCO1FBQ0YsS0FBSztZQUNILElBQUksUUFBUSxTQUFTLFFBQVEsU0FBUyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsa0JBQWtCLE9BQU87Z0JBQ3RFLE9BQU87WUFDVDtZQUNBO1FBQ0YsS0FBSztZQUNILElBQUksUUFBUSxTQUFTLE9BQU87WUFDNUIsSUFBSSxRQUFRLFNBQVMsT0FBTztZQUM1QixJQUFJLFFBQVEsU0FBUyxPQUFPO1lBQzVCLElBQUksUUFBUSxTQUFTLE9BQU87WUFDNUIsSUFBSSxRQUFRLFNBQVMsT0FBTztZQUM1QixNQUFNLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNmLElBQUksUUFBUSxTQUFTLE9BQU87WUFDNUIsSUFBSSxRQUFRLFNBQVMsT0FBTztZQUM1QixJQUFJLFFBQVEsU0FBUyxPQUFPO1lBQzVCO1FBQ0YsS0FBSztZQUNILElBQUksUUFBUSxVQUFVLE9BQU87WUFDN0IsSUFBSSxRQUFRLFlBQVksUUFBUSxVQUFVLE9BQU87WUFDakQsSUFBSSxRQUFRLFVBQVUsT0FBTztZQUM3QixJQUFJLFFBQVEsWUFBWSxRQUFRLFVBQVUsT0FBTztZQUNqRCxNQUFNLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNmLElBQUksUUFBUSxVQUFVLE9BQU87WUFDN0IsSUFBSSxRQUFRLFlBQVksUUFBUSxVQUFVLE9BQU87WUFDakQ7UUFDRixLQUFLO1lBQ0gsSUFDRSxRQUFRLGFBQ1IsUUFBUSxhQUNSLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxrQkFBa0IsV0FDM0I7Z0JBQ0EsT0FBTztZQUNUO1lBQ0E7UUFDRixLQUFLO1lBQ0gsSUFDRSxRQUFRLGNBQ1IsUUFBUSxjQUNSLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxrQkFBa0IsWUFDM0I7Z0JBQ0EsT0FBTztZQUNUO1lBQ0E7UUFDRjtZQUNFLElBQUksUUFBUSxJQUFJLE9BQU87SUFDM0I7QUFDRiJ9