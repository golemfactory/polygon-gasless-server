import { defaultErrorMap, overrideErrorMap } from "../ZodError.ts";
import { util } from "./util.ts";
export const ZodParsedType = util.arrayToEnum([
    "string",
    "nan",
    "number",
    "integer",
    "float",
    "boolean",
    "date",
    "bigint",
    "symbol",
    "function",
    "undefined",
    "null",
    "array",
    "object",
    "unknown",
    "promise",
    "void",
    "never",
    "map",
    "set"
]);
export const getParsedType = (data)=>{
    const t = typeof data;
    switch(t){
        case "undefined":
            return ZodParsedType.undefined;
        case "string":
            return ZodParsedType.string;
        case "number":
            return isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
        case "boolean":
            return ZodParsedType.boolean;
        case "function":
            return ZodParsedType.function;
        case "bigint":
            return ZodParsedType.bigint;
        case "object":
            if (Array.isArray(data)) {
                return ZodParsedType.array;
            }
            if (data === null) {
                return ZodParsedType.null;
            }
            if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
                return ZodParsedType.promise;
            }
            if (typeof Map !== "undefined" && data instanceof Map) {
                return ZodParsedType.map;
            }
            if (typeof Set !== "undefined" && data instanceof Set) {
                return ZodParsedType.set;
            }
            if (typeof Date !== "undefined" && data instanceof Date) {
                return ZodParsedType.date;
            }
            return ZodParsedType.object;
        default:
            return ZodParsedType.unknown;
    }
};
export const makeIssue = (params)=>{
    const { data , path , errorMaps , issueData  } = params;
    const fullPath = [
        ...path,
        ...issueData.path || []
    ];
    const fullIssue = {
        ...issueData,
        path: fullPath
    };
    let errorMessage = "";
    const maps = errorMaps.filter((m)=>!!m).slice().reverse();
    for (const map of maps){
        errorMessage = map(fullIssue, {
            data,
            defaultError: errorMessage
        }).message;
    }
    return {
        ...issueData,
        path: fullPath,
        message: issueData.message || errorMessage
    };
};
export const EMPTY_PATH = [];
export function addIssueToContext(ctx, issueData) {
    const issue = makeIssue({
        issueData: issueData,
        data: ctx.data,
        path: ctx.path,
        errorMaps: [
            ctx.common.contextualErrorMap,
            ctx.schemaErrorMap,
            overrideErrorMap,
            defaultErrorMap
        ].filter((x)=>!!x)
    });
    ctx.common.issues.push(issue);
}
export class ParseStatus {
    value = "valid";
    dirty() {
        if (this.value === "valid") this.value = "dirty";
    }
    abort() {
        if (this.value !== "aborted") this.value = "aborted";
    }
    static mergeArray(status, results) {
        const arrayValue = [];
        for (const s of results){
            if (s.status === "aborted") return INVALID;
            if (s.status === "dirty") status.dirty();
            arrayValue.push(s.value);
        }
        return {
            status: status.value,
            value: arrayValue
        };
    }
    static async mergeObjectAsync(status, pairs) {
        const syncPairs = [];
        for (const pair of pairs){
            syncPairs.push({
                key: await pair.key,
                value: await pair.value
            });
        }
        return ParseStatus.mergeObjectSync(status, syncPairs);
    }
    static mergeObjectSync(status, pairs) {
        const finalObject = {};
        for (const pair of pairs){
            const { key , value  } = pair;
            if (key.status === "aborted") return INVALID;
            if (value.status === "aborted") return INVALID;
            if (key.status === "dirty") status.dirty();
            if (value.status === "dirty") status.dirty();
            if (typeof value.value !== "undefined" || pair.alwaysSet) {
                finalObject[key.value] = value.value;
            }
        }
        return {
            status: status.value,
            value: finalObject
        };
    }
}
export const INVALID = Object.freeze({
    status: "aborted"
});
export const DIRTY = (value)=>({
        status: "dirty",
        value
    });
export const OK = (value)=>({
        status: "valid",
        value
    });
export const isAborted = (x)=>x.status === "aborted";
export const isDirty = (x)=>x.status === "dirty";
export const isValid = (x)=>x.status === "valid";
export const isAsync = (x)=>typeof Promise !== undefined && x instanceof Promise;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvem9kQHYzLjE0LjQvaGVscGVycy9wYXJzZVV0aWwudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgZGVmYXVsdEVycm9yTWFwLFxuICBJc3N1ZURhdGEsXG4gIG92ZXJyaWRlRXJyb3JNYXAsXG4gIFpvZEVycm9yTWFwLFxuICBab2RJc3N1ZSxcbn0gZnJvbSBcIi4uL1pvZEVycm9yLnRzXCI7XG5pbXBvcnQgeyB1dGlsIH0gZnJvbSBcIi4vdXRpbC50c1wiO1xuXG5leHBvcnQgY29uc3QgWm9kUGFyc2VkVHlwZSA9IHV0aWwuYXJyYXlUb0VudW0oW1xuICBcInN0cmluZ1wiLFxuICBcIm5hblwiLFxuICBcIm51bWJlclwiLFxuICBcImludGVnZXJcIixcbiAgXCJmbG9hdFwiLFxuICBcImJvb2xlYW5cIixcbiAgXCJkYXRlXCIsXG4gIFwiYmlnaW50XCIsXG4gIFwic3ltYm9sXCIsXG4gIFwiZnVuY3Rpb25cIixcbiAgXCJ1bmRlZmluZWRcIixcbiAgXCJudWxsXCIsXG4gIFwiYXJyYXlcIixcbiAgXCJvYmplY3RcIixcbiAgXCJ1bmtub3duXCIsXG4gIFwicHJvbWlzZVwiLFxuICBcInZvaWRcIixcbiAgXCJuZXZlclwiLFxuICBcIm1hcFwiLFxuICBcInNldFwiLFxuXSk7XG5cbmV4cG9ydCB0eXBlIFpvZFBhcnNlZFR5cGUgPSBrZXlvZiB0eXBlb2YgWm9kUGFyc2VkVHlwZTtcblxuZXhwb3J0IGNvbnN0IGdldFBhcnNlZFR5cGUgPSAoZGF0YTogYW55KTogWm9kUGFyc2VkVHlwZSA9PiB7XG4gIGNvbnN0IHQgPSB0eXBlb2YgZGF0YTtcblxuICBzd2l0Y2ggKHQpIHtcbiAgICBjYXNlIFwidW5kZWZpbmVkXCI6XG4gICAgICByZXR1cm4gWm9kUGFyc2VkVHlwZS51bmRlZmluZWQ7XG5cbiAgICBjYXNlIFwic3RyaW5nXCI6XG4gICAgICByZXR1cm4gWm9kUGFyc2VkVHlwZS5zdHJpbmc7XG5cbiAgICBjYXNlIFwibnVtYmVyXCI6XG4gICAgICByZXR1cm4gaXNOYU4oZGF0YSkgPyBab2RQYXJzZWRUeXBlLm5hbiA6IFpvZFBhcnNlZFR5cGUubnVtYmVyO1xuXG4gICAgY2FzZSBcImJvb2xlYW5cIjpcbiAgICAgIHJldHVybiBab2RQYXJzZWRUeXBlLmJvb2xlYW47XG5cbiAgICBjYXNlIFwiZnVuY3Rpb25cIjpcbiAgICAgIHJldHVybiBab2RQYXJzZWRUeXBlLmZ1bmN0aW9uO1xuXG4gICAgY2FzZSBcImJpZ2ludFwiOlxuICAgICAgcmV0dXJuIFpvZFBhcnNlZFR5cGUuYmlnaW50O1xuXG4gICAgY2FzZSBcIm9iamVjdFwiOlxuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoZGF0YSkpIHtcbiAgICAgICAgcmV0dXJuIFpvZFBhcnNlZFR5cGUuYXJyYXk7XG4gICAgICB9XG4gICAgICBpZiAoZGF0YSA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gWm9kUGFyc2VkVHlwZS5udWxsO1xuICAgICAgfVxuICAgICAgaWYgKFxuICAgICAgICBkYXRhLnRoZW4gJiZcbiAgICAgICAgdHlwZW9mIGRhdGEudGhlbiA9PT0gXCJmdW5jdGlvblwiICYmXG4gICAgICAgIGRhdGEuY2F0Y2ggJiZcbiAgICAgICAgdHlwZW9mIGRhdGEuY2F0Y2ggPT09IFwiZnVuY3Rpb25cIlxuICAgICAgKSB7XG4gICAgICAgIHJldHVybiBab2RQYXJzZWRUeXBlLnByb21pc2U7XG4gICAgICB9XG4gICAgICBpZiAodHlwZW9mIE1hcCAhPT0gXCJ1bmRlZmluZWRcIiAmJiBkYXRhIGluc3RhbmNlb2YgTWFwKSB7XG4gICAgICAgIHJldHVybiBab2RQYXJzZWRUeXBlLm1hcDtcbiAgICAgIH1cbiAgICAgIGlmICh0eXBlb2YgU2V0ICE9PSBcInVuZGVmaW5lZFwiICYmIGRhdGEgaW5zdGFuY2VvZiBTZXQpIHtcbiAgICAgICAgcmV0dXJuIFpvZFBhcnNlZFR5cGUuc2V0O1xuICAgICAgfVxuICAgICAgaWYgKHR5cGVvZiBEYXRlICE9PSBcInVuZGVmaW5lZFwiICYmIGRhdGEgaW5zdGFuY2VvZiBEYXRlKSB7XG4gICAgICAgIHJldHVybiBab2RQYXJzZWRUeXBlLmRhdGU7XG4gICAgICB9XG4gICAgICByZXR1cm4gWm9kUGFyc2VkVHlwZS5vYmplY3Q7XG5cbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIFpvZFBhcnNlZFR5cGUudW5rbm93bjtcbiAgfVxufTtcblxuZXhwb3J0IGNvbnN0IG1ha2VJc3N1ZSA9IChwYXJhbXM6IHtcbiAgZGF0YTogYW55O1xuICBwYXRoOiAoc3RyaW5nIHwgbnVtYmVyKVtdO1xuICBlcnJvck1hcHM6IFpvZEVycm9yTWFwW107XG4gIGlzc3VlRGF0YTogSXNzdWVEYXRhO1xufSk6IFpvZElzc3VlID0+IHtcbiAgY29uc3QgeyBkYXRhLCBwYXRoLCBlcnJvck1hcHMsIGlzc3VlRGF0YSB9ID0gcGFyYW1zO1xuICBjb25zdCBmdWxsUGF0aCA9IFsuLi5wYXRoLCAuLi4oaXNzdWVEYXRhLnBhdGggfHwgW10pXTtcbiAgY29uc3QgZnVsbElzc3VlID0ge1xuICAgIC4uLmlzc3VlRGF0YSxcbiAgICBwYXRoOiBmdWxsUGF0aCxcbiAgfTtcblxuICBsZXQgZXJyb3JNZXNzYWdlID0gXCJcIjtcbiAgY29uc3QgbWFwcyA9IGVycm9yTWFwc1xuICAgIC5maWx0ZXIoKG0pID0+ICEhbSlcbiAgICAuc2xpY2UoKVxuICAgIC5yZXZlcnNlKCkgYXMgWm9kRXJyb3JNYXBbXTtcbiAgZm9yIChjb25zdCBtYXAgb2YgbWFwcykge1xuICAgIGVycm9yTWVzc2FnZSA9IG1hcChmdWxsSXNzdWUsIHsgZGF0YSwgZGVmYXVsdEVycm9yOiBlcnJvck1lc3NhZ2UgfSkubWVzc2FnZTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgLi4uaXNzdWVEYXRhLFxuICAgIHBhdGg6IGZ1bGxQYXRoLFxuICAgIG1lc3NhZ2U6IGlzc3VlRGF0YS5tZXNzYWdlIHx8IGVycm9yTWVzc2FnZSxcbiAgfTtcbn07XG5cbmV4cG9ydCB0eXBlIFBhcnNlUGFyYW1zID0ge1xuICBwYXRoOiAoc3RyaW5nIHwgbnVtYmVyKVtdO1xuICBlcnJvck1hcDogWm9kRXJyb3JNYXA7XG4gIGFzeW5jOiBib29sZWFuO1xufTtcblxuZXhwb3J0IHR5cGUgUGFyc2VQYXRoQ29tcG9uZW50ID0gc3RyaW5nIHwgbnVtYmVyO1xuZXhwb3J0IHR5cGUgUGFyc2VQYXRoID0gUGFyc2VQYXRoQ29tcG9uZW50W107XG5leHBvcnQgY29uc3QgRU1QVFlfUEFUSDogUGFyc2VQYXRoID0gW107XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGFyc2VDb250ZXh0IHtcbiAgcmVhZG9ubHkgY29tbW9uOiB7XG4gICAgcmVhZG9ubHkgaXNzdWVzOiBab2RJc3N1ZVtdO1xuICAgIHJlYWRvbmx5IGNvbnRleHR1YWxFcnJvck1hcD86IFpvZEVycm9yTWFwO1xuICAgIHJlYWRvbmx5IGFzeW5jOiBib29sZWFuO1xuICB9O1xuICByZWFkb25seSBwYXRoOiBQYXJzZVBhdGg7XG4gIHJlYWRvbmx5IHNjaGVtYUVycm9yTWFwPzogWm9kRXJyb3JNYXA7XG4gIHJlYWRvbmx5IHBhcmVudDogUGFyc2VDb250ZXh0IHwgbnVsbDtcbiAgcmVhZG9ubHkgZGF0YTogYW55O1xuICByZWFkb25seSBwYXJzZWRUeXBlOiBab2RQYXJzZWRUeXBlO1xufVxuXG5leHBvcnQgdHlwZSBQYXJzZUlucHV0ID0ge1xuICBkYXRhOiBhbnk7XG4gIHBhdGg6IChzdHJpbmcgfCBudW1iZXIpW107XG4gIHBhcmVudDogUGFyc2VDb250ZXh0O1xufTtcblxuZXhwb3J0IGZ1bmN0aW9uIGFkZElzc3VlVG9Db250ZXh0KFxuICBjdHg6IFBhcnNlQ29udGV4dCxcbiAgaXNzdWVEYXRhOiBJc3N1ZURhdGFcbik6IHZvaWQge1xuICBjb25zdCBpc3N1ZSA9IG1ha2VJc3N1ZSh7XG4gICAgaXNzdWVEYXRhOiBpc3N1ZURhdGEsXG4gICAgZGF0YTogY3R4LmRhdGEsXG4gICAgcGF0aDogY3R4LnBhdGgsXG4gICAgZXJyb3JNYXBzOiBbXG4gICAgICBjdHguY29tbW9uLmNvbnRleHR1YWxFcnJvck1hcCwgLy8gY29udGV4dHVhbCBlcnJvciBtYXAgaXMgZmlyc3QgcHJpb3JpdHlcbiAgICAgIGN0eC5zY2hlbWFFcnJvck1hcCwgLy8gdGhlbiBzY2hlbWEtYm91bmQgbWFwIGlmIGF2YWlsYWJsZVxuICAgICAgb3ZlcnJpZGVFcnJvck1hcCwgLy8gdGhlbiBnbG9iYWwgb3ZlcnJpZGUgbWFwXG4gICAgICBkZWZhdWx0RXJyb3JNYXAsIC8vIHRoZW4gZ2xvYmFsIGRlZmF1bHQgbWFwXG4gICAgXS5maWx0ZXIoKHgpID0+ICEheCkgYXMgWm9kRXJyb3JNYXBbXSxcbiAgfSk7XG4gIGN0eC5jb21tb24uaXNzdWVzLnB1c2goaXNzdWUpO1xufVxuXG5leHBvcnQgdHlwZSBPYmplY3RQYWlyID0ge1xuICBrZXk6IFN5bmNQYXJzZVJldHVyblR5cGU8YW55PjtcbiAgdmFsdWU6IFN5bmNQYXJzZVJldHVyblR5cGU8YW55Pjtcbn07XG5leHBvcnQgY2xhc3MgUGFyc2VTdGF0dXMge1xuICB2YWx1ZTogXCJhYm9ydGVkXCIgfCBcImRpcnR5XCIgfCBcInZhbGlkXCIgPSBcInZhbGlkXCI7XG4gIGRpcnR5KCkge1xuICAgIGlmICh0aGlzLnZhbHVlID09PSBcInZhbGlkXCIpIHRoaXMudmFsdWUgPSBcImRpcnR5XCI7XG4gIH1cbiAgYWJvcnQoKSB7XG4gICAgaWYgKHRoaXMudmFsdWUgIT09IFwiYWJvcnRlZFwiKSB0aGlzLnZhbHVlID0gXCJhYm9ydGVkXCI7XG4gIH1cblxuICBzdGF0aWMgbWVyZ2VBcnJheShcbiAgICBzdGF0dXM6IFBhcnNlU3RhdHVzLFxuICAgIHJlc3VsdHM6IFN5bmNQYXJzZVJldHVyblR5cGU8YW55PltdXG4gICk6IFN5bmNQYXJzZVJldHVyblR5cGUge1xuICAgIGNvbnN0IGFycmF5VmFsdWU6IGFueVtdID0gW107XG4gICAgZm9yIChjb25zdCBzIG9mIHJlc3VsdHMpIHtcbiAgICAgIGlmIChzLnN0YXR1cyA9PT0gXCJhYm9ydGVkXCIpIHJldHVybiBJTlZBTElEO1xuICAgICAgaWYgKHMuc3RhdHVzID09PSBcImRpcnR5XCIpIHN0YXR1cy5kaXJ0eSgpO1xuICAgICAgYXJyYXlWYWx1ZS5wdXNoKHMudmFsdWUpO1xuICAgIH1cblxuICAgIHJldHVybiB7IHN0YXR1czogc3RhdHVzLnZhbHVlLCB2YWx1ZTogYXJyYXlWYWx1ZSB9O1xuICB9XG5cbiAgc3RhdGljIGFzeW5jIG1lcmdlT2JqZWN0QXN5bmMoXG4gICAgc3RhdHVzOiBQYXJzZVN0YXR1cyxcbiAgICBwYWlyczogeyBrZXk6IFBhcnNlUmV0dXJuVHlwZTxhbnk+OyB2YWx1ZTogUGFyc2VSZXR1cm5UeXBlPGFueT4gfVtdXG4gICk6IFByb21pc2U8U3luY1BhcnNlUmV0dXJuVHlwZTxhbnk+PiB7XG4gICAgY29uc3Qgc3luY1BhaXJzOiBPYmplY3RQYWlyW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IHBhaXIgb2YgcGFpcnMpIHtcbiAgICAgIHN5bmNQYWlycy5wdXNoKHtcbiAgICAgICAga2V5OiBhd2FpdCBwYWlyLmtleSxcbiAgICAgICAgdmFsdWU6IGF3YWl0IHBhaXIudmFsdWUsXG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIFBhcnNlU3RhdHVzLm1lcmdlT2JqZWN0U3luYyhzdGF0dXMsIHN5bmNQYWlycyk7XG4gIH1cblxuICBzdGF0aWMgbWVyZ2VPYmplY3RTeW5jKFxuICAgIHN0YXR1czogUGFyc2VTdGF0dXMsXG4gICAgcGFpcnM6IHtcbiAgICAgIGtleTogU3luY1BhcnNlUmV0dXJuVHlwZTxhbnk+O1xuICAgICAgdmFsdWU6IFN5bmNQYXJzZVJldHVyblR5cGU8YW55PjtcbiAgICAgIGFsd2F5c1NldD86IGJvb2xlYW47XG4gICAgfVtdXG4gICk6IFN5bmNQYXJzZVJldHVyblR5cGUge1xuICAgIGNvbnN0IGZpbmFsT2JqZWN0OiBhbnkgPSB7fTtcbiAgICBmb3IgKGNvbnN0IHBhaXIgb2YgcGFpcnMpIHtcbiAgICAgIGNvbnN0IHsga2V5LCB2YWx1ZSB9ID0gcGFpcjtcbiAgICAgIGlmIChrZXkuc3RhdHVzID09PSBcImFib3J0ZWRcIikgcmV0dXJuIElOVkFMSUQ7XG4gICAgICBpZiAodmFsdWUuc3RhdHVzID09PSBcImFib3J0ZWRcIikgcmV0dXJuIElOVkFMSUQ7XG4gICAgICBpZiAoa2V5LnN0YXR1cyA9PT0gXCJkaXJ0eVwiKSBzdGF0dXMuZGlydHkoKTtcbiAgICAgIGlmICh2YWx1ZS5zdGF0dXMgPT09IFwiZGlydHlcIikgc3RhdHVzLmRpcnR5KCk7XG5cbiAgICAgIGlmICh0eXBlb2YgdmFsdWUudmFsdWUgIT09IFwidW5kZWZpbmVkXCIgfHwgcGFpci5hbHdheXNTZXQpIHtcbiAgICAgICAgZmluYWxPYmplY3Rba2V5LnZhbHVlXSA9IHZhbHVlLnZhbHVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7IHN0YXR1czogc3RhdHVzLnZhbHVlLCB2YWx1ZTogZmluYWxPYmplY3QgfTtcbiAgfVxufVxuZXhwb3J0IGludGVyZmFjZSBQYXJzZVJlc3VsdCB7XG4gIHN0YXR1czogXCJhYm9ydGVkXCIgfCBcImRpcnR5XCIgfCBcInZhbGlkXCI7XG4gIGRhdGE6IGFueTtcbn1cblxuZXhwb3J0IHR5cGUgSU5WQUxJRCA9IHsgc3RhdHVzOiBcImFib3J0ZWRcIiB9O1xuZXhwb3J0IGNvbnN0IElOVkFMSUQ6IElOVkFMSUQgPSBPYmplY3QuZnJlZXplKHtcbiAgc3RhdHVzOiBcImFib3J0ZWRcIixcbn0pO1xuXG5leHBvcnQgdHlwZSBESVJUWTxUPiA9IHsgc3RhdHVzOiBcImRpcnR5XCI7IHZhbHVlOiBUIH07XG5leHBvcnQgY29uc3QgRElSVFkgPSA8VD4odmFsdWU6IFQpOiBESVJUWTxUPiA9PiAoeyBzdGF0dXM6IFwiZGlydHlcIiwgdmFsdWUgfSk7XG5cbmV4cG9ydCB0eXBlIE9LPFQ+ID0geyBzdGF0dXM6IFwidmFsaWRcIjsgdmFsdWU6IFQgfTtcbmV4cG9ydCBjb25zdCBPSyA9IDxUPih2YWx1ZTogVCk6IE9LPFQ+ID0+ICh7IHN0YXR1czogXCJ2YWxpZFwiLCB2YWx1ZSB9KTtcblxuZXhwb3J0IHR5cGUgU3luY1BhcnNlUmV0dXJuVHlwZTxUID0gYW55PiA9IE9LPFQ+IHwgRElSVFk8VD4gfCBJTlZBTElEO1xuZXhwb3J0IHR5cGUgQXN5bmNQYXJzZVJldHVyblR5cGU8VD4gPSBQcm9taXNlPFN5bmNQYXJzZVJldHVyblR5cGU8VD4+O1xuZXhwb3J0IHR5cGUgUGFyc2VSZXR1cm5UeXBlPFQ+ID1cbiAgfCBTeW5jUGFyc2VSZXR1cm5UeXBlPFQ+XG4gIHwgQXN5bmNQYXJzZVJldHVyblR5cGU8VD47XG5cbmV4cG9ydCBjb25zdCBpc0Fib3J0ZWQgPSAoeDogUGFyc2VSZXR1cm5UeXBlPGFueT4pOiB4IGlzIElOVkFMSUQgPT5cbiAgKHggYXMgYW55KS5zdGF0dXMgPT09IFwiYWJvcnRlZFwiO1xuZXhwb3J0IGNvbnN0IGlzRGlydHkgPSA8VD4oeDogUGFyc2VSZXR1cm5UeXBlPFQ+KTogeCBpcyBPSzxUPiB8IERJUlRZPFQ+ID0+XG4gICh4IGFzIGFueSkuc3RhdHVzID09PSBcImRpcnR5XCI7XG5leHBvcnQgY29uc3QgaXNWYWxpZCA9IDxUPih4OiBQYXJzZVJldHVyblR5cGU8VD4pOiB4IGlzIE9LPFQ+IHwgRElSVFk8VD4gPT5cbiAgKHggYXMgYW55KS5zdGF0dXMgPT09IFwidmFsaWRcIjtcbmV4cG9ydCBjb25zdCBpc0FzeW5jID0gPFQ+KFxuICB4OiBQYXJzZVJldHVyblR5cGU8VD5cbik6IHggaXMgQXN5bmNQYXJzZVJldHVyblR5cGU8VD4gPT5cbiAgdHlwZW9mIFByb21pc2UgIT09IHVuZGVmaW5lZCAmJiB4IGluc3RhbmNlb2YgUHJvbWlzZTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxTQUNFLGVBQWUsRUFFZixnQkFBZ0IsUUFHWCxpQkFBaUI7QUFDeEIsU0FBUyxJQUFJLFFBQVEsWUFBWTtBQUVqQyxPQUFPLE1BQU0sZ0JBQWdCLEtBQUssWUFBWTtJQUM1QztJQUNBO0lBQ0E7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