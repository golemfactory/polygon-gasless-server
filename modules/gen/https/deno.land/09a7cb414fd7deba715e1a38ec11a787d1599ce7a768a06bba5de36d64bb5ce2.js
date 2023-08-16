/*!
 * Adapted directly from type-is at https://github.com/jshttp/type-is/
 * which is licensed as follows:
 *
 * Copyright(c) 2014 Jonathan Ong
 * Copyright(c) 2014-2015 Douglas Christopher Wilson
 * MIT Licensed
 */ import { typeByExtension } from "./deps.ts";
import { format, parse } from "./mediaTyper.ts";
function mimeMatch(expected, actual) {
    if (expected === undefined) {
        return false;
    }
    const actualParts = actual.split("/");
    const expectedParts = expected.split("/");
    if (actualParts.length !== 2 || expectedParts.length !== 2) {
        return false;
    }
    const [actualType, actualSubtype] = actualParts;
    const [expectedType, expectedSubtype] = expectedParts;
    if (expectedType !== "*" && expectedType !== actualType) {
        return false;
    }
    if (expectedSubtype.substr(0, 2) === "*+") {
        return expectedSubtype.length <= actualSubtype.length + 1 && expectedSubtype.substr(1) === actualSubtype.substr(1 - expectedSubtype.length);
    }
    if (expectedSubtype !== "*" && expectedSubtype !== actualSubtype) {
        return false;
    }
    return true;
}
function normalize(type) {
    if (type === "urlencoded") {
        return "application/x-www-form-urlencoded";
    } else if (type === "multipart") {
        return "multipart/*";
    } else if (type[0] === "+") {
        return `*/*${type}`;
    }
    return type.includes("/") ? type : typeByExtension(type);
}
function normalizeType(value) {
    try {
        const val = value.split(";");
        const type = parse(val[0]);
        return format(type);
    } catch  {
        return;
    }
}
/** Given a value of the content type of a request and an array of types,
 * provide the matching type or `false` if no types are matched.
 */ export function isMediaType(value, types) {
    const val = normalizeType(value);
    if (!val) {
        return false;
    }
    if (!types.length) {
        return val;
    }
    for (const type of types){
        if (mimeMatch(normalize(type), val)) {
            return type[0] === "+" || type.includes("*") ? val : type;
        }
    }
    return false;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvb2FrQHYxMi42LjAvaXNNZWRpYVR5cGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLyohXG4gKiBBZGFwdGVkIGRpcmVjdGx5IGZyb20gdHlwZS1pcyBhdCBodHRwczovL2dpdGh1Yi5jb20vanNodHRwL3R5cGUtaXMvXG4gKiB3aGljaCBpcyBsaWNlbnNlZCBhcyBmb2xsb3dzOlxuICpcbiAqIENvcHlyaWdodChjKSAyMDE0IEpvbmF0aGFuIE9uZ1xuICogQ29weXJpZ2h0KGMpIDIwMTQtMjAxNSBEb3VnbGFzIENocmlzdG9waGVyIFdpbHNvblxuICogTUlUIExpY2Vuc2VkXG4gKi9cblxuaW1wb3J0IHsgdHlwZUJ5RXh0ZW5zaW9uIH0gZnJvbSBcIi4vZGVwcy50c1wiO1xuaW1wb3J0IHsgZm9ybWF0LCBwYXJzZSB9IGZyb20gXCIuL21lZGlhVHlwZXIudHNcIjtcblxuZnVuY3Rpb24gbWltZU1hdGNoKGV4cGVjdGVkOiBzdHJpbmcgfCB1bmRlZmluZWQsIGFjdHVhbDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGlmIChleHBlY3RlZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgY29uc3QgYWN0dWFsUGFydHMgPSBhY3R1YWwuc3BsaXQoXCIvXCIpO1xuICBjb25zdCBleHBlY3RlZFBhcnRzID0gZXhwZWN0ZWQuc3BsaXQoXCIvXCIpO1xuXG4gIGlmIChhY3R1YWxQYXJ0cy5sZW5ndGggIT09IDIgfHwgZXhwZWN0ZWRQYXJ0cy5sZW5ndGggIT09IDIpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBjb25zdCBbYWN0dWFsVHlwZSwgYWN0dWFsU3VidHlwZV0gPSBhY3R1YWxQYXJ0cztcbiAgY29uc3QgW2V4cGVjdGVkVHlwZSwgZXhwZWN0ZWRTdWJ0eXBlXSA9IGV4cGVjdGVkUGFydHM7XG5cbiAgaWYgKGV4cGVjdGVkVHlwZSAhPT0gXCIqXCIgJiYgZXhwZWN0ZWRUeXBlICE9PSBhY3R1YWxUeXBlKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKGV4cGVjdGVkU3VidHlwZS5zdWJzdHIoMCwgMikgPT09IFwiKitcIikge1xuICAgIHJldHVybiAoXG4gICAgICBleHBlY3RlZFN1YnR5cGUubGVuZ3RoIDw9IGFjdHVhbFN1YnR5cGUubGVuZ3RoICsgMSAmJlxuICAgICAgZXhwZWN0ZWRTdWJ0eXBlLnN1YnN0cigxKSA9PT1cbiAgICAgICAgYWN0dWFsU3VidHlwZS5zdWJzdHIoMSAtIGV4cGVjdGVkU3VidHlwZS5sZW5ndGgpXG4gICAgKTtcbiAgfVxuXG4gIGlmIChleHBlY3RlZFN1YnR5cGUgIT09IFwiKlwiICYmIGV4cGVjdGVkU3VidHlwZSAhPT0gYWN0dWFsU3VidHlwZSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemUodHlwZTogc3RyaW5nKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgaWYgKHR5cGUgPT09IFwidXJsZW5jb2RlZFwiKSB7XG4gICAgcmV0dXJuIFwiYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkXCI7XG4gIH0gZWxzZSBpZiAodHlwZSA9PT0gXCJtdWx0aXBhcnRcIikge1xuICAgIHJldHVybiBcIm11bHRpcGFydC8qXCI7XG4gIH0gZWxzZSBpZiAodHlwZVswXSA9PT0gXCIrXCIpIHtcbiAgICByZXR1cm4gYCovKiR7dHlwZX1gO1xuICB9XG4gIHJldHVybiB0eXBlLmluY2x1ZGVzKFwiL1wiKSA/IHR5cGUgOiB0eXBlQnlFeHRlbnNpb24odHlwZSk7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVR5cGUodmFsdWU6IHN0cmluZyk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gIHRyeSB7XG4gICAgY29uc3QgdmFsID0gdmFsdWUuc3BsaXQoXCI7XCIpO1xuICAgIGNvbnN0IHR5cGUgPSBwYXJzZSh2YWxbMF0pO1xuICAgIHJldHVybiBmb3JtYXQodHlwZSk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybjtcbiAgfVxufVxuXG4vKiogR2l2ZW4gYSB2YWx1ZSBvZiB0aGUgY29udGVudCB0eXBlIG9mIGEgcmVxdWVzdCBhbmQgYW4gYXJyYXkgb2YgdHlwZXMsXG4gKiBwcm92aWRlIHRoZSBtYXRjaGluZyB0eXBlIG9yIGBmYWxzZWAgaWYgbm8gdHlwZXMgYXJlIG1hdGNoZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc01lZGlhVHlwZSh2YWx1ZTogc3RyaW5nLCB0eXBlczogc3RyaW5nW10pOiBzdHJpbmcgfCBmYWxzZSB7XG4gIGNvbnN0IHZhbCA9IG5vcm1hbGl6ZVR5cGUodmFsdWUpO1xuXG4gIGlmICghdmFsKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKCF0eXBlcy5sZW5ndGgpIHtcbiAgICByZXR1cm4gdmFsO1xuICB9XG5cbiAgZm9yIChjb25zdCB0eXBlIG9mIHR5cGVzKSB7XG4gICAgaWYgKG1pbWVNYXRjaChub3JtYWxpemUodHlwZSksIHZhbCkpIHtcbiAgICAgIHJldHVybiB0eXBlWzBdID09PSBcIitcIiB8fCB0eXBlLmluY2x1ZGVzKFwiKlwiKSA/IHZhbCA6IHR5cGU7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7O0NBT0MsR0FFRCxTQUFTLGVBQWUsUUFBUSxZQUFZO0FBQzVDLFNBQVMsTUFBTSxFQUFFLEtBQUssUUFBUSxrQkFBa0I7QUFFaEQsU0FBUyxVQUFVLFFBQTRCLEVBQUUsTUFBYztJQUM3RCxJQUFJLGFBQWEsV0FBVztRQUMxQixPQUFPO0lBQ1Q7SUFFQSxNQUFNLGNBQWMsT0FBTyxNQUFNO0lBQ2pDLE1BQU0sZ0JBQWdCLFNBQVMsTUFBTTtJQUVyQyxJQUFJLFlBQVksV0FBVyxLQUFLLGNBQWMsV0FBVyxHQUFHO1FBQzFELE9BQU87SUFDVDtJQUVBLE1BQU0sQ0FBQyxZQUFZLGNBQWMsR0FBRztJQUNwQyxNQUFNLENBQUMsY0FBYyxnQkFBZ0IsR0FBRztJQUV4QyxJQUFJLGlCQUFpQixPQUFPLGlCQUFpQixZQUFZO1FBQ3ZELE9BQU87SUFDVDtJQUVBLElBQUksZ0JBQWdCLE9BQU8sR0FBRyxPQUFPLE1BQU07UUFDekMsT0FDRSxnQkFBZ0IsVUFBVSxjQUFjLFNBQVMsS0FDakQsZ0JBQWdCLE9BQU8sT0FDckIsY0FBYyxPQUFPLElBQUksZ0JBQWdCO0lBRS9DO0lBRUEsSUFBSSxvQkFBb0IsT0FBTyxvQkFBb0IsZUFBZTtRQUNoRSxPQUFPO0lBQ1Q7SUFFQSxPQUFPO0FBQ1Q7QUFFQSxTQUFTLFVBQVUsSUFBWTtJQUM3QixJQUFJLFNBQVMsY0FBYztRQUN6QixPQUFPO0lBQ1QsT0FBTyxJQUFJLFNBQVMsYUFBYTtRQUMvQixPQUFPO0lBQ1QsT0FBTyxJQUFJLElBQUksQ0FBQyxFQUFFLEtBQUssS0FBSztRQUMxQixPQUFPLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQztJQUNyQjtJQUNBLE9BQU8sS0FBSyxTQUFTLE9BQU8sT0FBTyxnQkFBZ0I7QUFDckQ7QUFFQSxTQUFTLGNBQWMsS0FBYTtJQUNsQyxJQUFJO1FBQ0YsTUFBTSxNQUFNLE1BQU0sTUFBTTtRQUN4QixNQUFNLE9BQU8sTUFBTSxHQUFHLENBQUMsRUFBRTtRQUN6QixPQUFPLE9BQU87SUFDaEIsRUFBRSxPQUFNO1FBQ047SUFDRjtBQUNGO0FBRUE7O0NBRUMsR0FDRCxPQUFPLFNBQVMsWUFBWSxLQUFhLEVBQUUsS0FBZTtJQUN4RCxNQUFNLE1BQU0sY0FBYztJQUUxQixJQUFJLENBQUMsS0FBSztRQUNSLE9BQU87SUFDVDtJQUVBLElBQUksQ0FBQyxNQUFNLFFBQVE7UUFDakIsT0FBTztJQUNUO0lBRUEsS0FBSyxNQUFNLFFBQVEsTUFBTztRQUN4QixJQUFJLFVBQVUsVUFBVSxPQUFPLE1BQU07WUFDbkMsT0FBTyxJQUFJLENBQUMsRUFBRSxLQUFLLE9BQU8sS0FBSyxTQUFTLE9BQU8sTUFBTTtRQUN2RDtJQUNGO0lBRUEsT0FBTztBQUNUIn0=