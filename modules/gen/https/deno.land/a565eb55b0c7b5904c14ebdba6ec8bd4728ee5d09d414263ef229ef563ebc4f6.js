import { util } from "./helpers/util.ts";
export const ZodIssueCode = util.arrayToEnum([
    "invalid_type",
    "invalid_literal",
    "custom",
    "invalid_union",
    "invalid_union_discriminator",
    "invalid_enum_value",
    "unrecognized_keys",
    "invalid_arguments",
    "invalid_return_type",
    "invalid_date",
    "invalid_string",
    "too_small",
    "too_big",
    "invalid_intersection_types",
    "not_multiple_of"
]);
export const quotelessJson = (obj)=>{
    const json = JSON.stringify(obj, null, 2);
    return json.replace(/"([^"]+)":/g, "$1:");
};
export class ZodError extends Error {
    issues = [];
    get errors() {
        return this.issues;
    }
    constructor(issues){
        super();
        const actualProto = new.target.prototype;
        if (Object.setPrototypeOf) {
            // eslint-disable-next-line ban/ban
            Object.setPrototypeOf(this, actualProto);
        } else {
            this.__proto__ = actualProto;
        }
        this.name = "ZodError";
        this.issues = issues;
    }
    format = ()=>{
        const fieldErrors = {
            _errors: []
        };
        const processError = (error)=>{
            for (const issue of error.issues){
                if (issue.code === "invalid_union") {
                    issue.unionErrors.map(processError);
                } else if (issue.code === "invalid_return_type") {
                    processError(issue.returnTypeError);
                } else if (issue.code === "invalid_arguments") {
                    processError(issue.argumentsError);
                } else if (issue.path.length === 0) {
                    fieldErrors._errors.push(issue.message);
                } else {
                    let curr = fieldErrors;
                    let i = 0;
                    while(i < issue.path.length){
                        const el = issue.path[i];
                        const terminal = i === issue.path.length - 1;
                        if (!terminal) {
                            if (typeof el === "string") {
                                curr[el] = curr[el] || {
                                    _errors: []
                                };
                            } else if (typeof el === "number") {
                                const errorArray = [];
                                errorArray._errors = [];
                                curr[el] = curr[el] || errorArray;
                            }
                        } else {
                            curr[el] = curr[el] || {
                                _errors: []
                            };
                            curr[el]._errors.push(issue.message);
                        }
                        curr = curr[el];
                        i++;
                    }
                }
            }
        };
        processError(this);
        return fieldErrors;
    };
    static create = (issues)=>{
        const error = new ZodError(issues);
        return error;
    };
    toString() {
        return this.message;
    }
    get message() {
        return JSON.stringify(this.issues, null, 2);
    }
    get isEmpty() {
        return this.issues.length === 0;
    }
    addIssue = (sub)=>{
        this.issues = [
            ...this.issues,
            sub
        ];
    };
    addIssues = (subs = [])=>{
        this.issues = [
            ...this.issues,
            ...subs
        ];
    };
    flatten(mapper = (issue)=>issue.message) {
        const fieldErrors = {};
        const formErrors = [];
        for (const sub of this.issues){
            if (sub.path.length > 0) {
                fieldErrors[sub.path[0]] = fieldErrors[sub.path[0]] || [];
                fieldErrors[sub.path[0]].push(mapper(sub));
            } else {
                formErrors.push(mapper(sub));
            }
        }
        return {
            formErrors,
            fieldErrors
        };
    }
    get formErrors() {
        return this.flatten();
    }
}
export const defaultErrorMap = (issue, _ctx)=>{
    let message;
    switch(issue.code){
        case ZodIssueCode.invalid_type:
            if (issue.received === "undefined") {
                message = "Required";
            } else {
                message = `Expected ${issue.expected}, received ${issue.received}`;
            }
            break;
        case ZodIssueCode.invalid_literal:
            message = `Invalid literal value, expected ${JSON.stringify(issue.expected)}`;
            break;
        case ZodIssueCode.unrecognized_keys:
            message = `Unrecognized key(s) in object: ${issue.keys.map((k)=>`'${k}'`).join(", ")}`;
            break;
        case ZodIssueCode.invalid_union:
            message = `Invalid input`;
            break;
        case ZodIssueCode.invalid_union_discriminator:
            message = `Invalid discriminator value. Expected ${issue.options.map((val)=>typeof val === "string" ? `'${val}'` : val).join(" | ")}`;
            break;
        case ZodIssueCode.invalid_enum_value:
            message = `Invalid enum value. Expected ${issue.options.map((val)=>typeof val === "string" ? `'${val}'` : val).join(" | ")}`;
            break;
        case ZodIssueCode.invalid_arguments:
            message = `Invalid function arguments`;
            break;
        case ZodIssueCode.invalid_return_type:
            message = `Invalid function return type`;
            break;
        case ZodIssueCode.invalid_date:
            message = `Invalid date`;
            break;
        case ZodIssueCode.invalid_string:
            if (issue.validation !== "regex") message = `Invalid ${issue.validation}`;
            else message = "Invalid";
            break;
        case ZodIssueCode.too_small:
            if (issue.type === "array") message = `Array must contain ${issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
            else if (issue.type === "string") message = `String must contain ${issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
            else if (issue.type === "number") message = `Number must be greater than ${issue.inclusive ? `or equal to ` : ``}${issue.minimum}`;
            else message = "Invalid input";
            break;
        case ZodIssueCode.too_big:
            if (issue.type === "array") message = `Array must contain ${issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
            else if (issue.type === "string") message = `String must contain ${issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
            else if (issue.type === "number") message = `Number must be less than ${issue.inclusive ? `or equal to ` : ``}${issue.maximum}`;
            else message = "Invalid input";
            break;
        case ZodIssueCode.custom:
            message = `Invalid input`;
            break;
        case ZodIssueCode.invalid_intersection_types:
            message = `Intersection results could not be merged`;
            break;
        case ZodIssueCode.not_multiple_of:
            message = `Number must be a multiple of ${issue.multipleOf}`;
            break;
        default:
            message = _ctx.defaultError;
            util.assertNever(issue);
    }
    return {
        message
    };
};
export let overrideErrorMap = defaultErrorMap;
export const setErrorMap = (map)=>{
    overrideErrorMap = map;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvem9kQHYzLjE0LjQvWm9kRXJyb3IudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgWm9kUGFyc2VkVHlwZSB9IGZyb20gXCIuL2hlbHBlcnMvcGFyc2VVdGlsLnRzXCI7XG5pbXBvcnQgeyBQcmltaXRpdmUgfSBmcm9tIFwiLi9oZWxwZXJzL3R5cGVBbGlhc2VzLnRzXCI7XG5pbXBvcnQgeyB1dGlsIH0gZnJvbSBcIi4vaGVscGVycy91dGlsLnRzXCI7XG5cbmV4cG9ydCBjb25zdCBab2RJc3N1ZUNvZGUgPSB1dGlsLmFycmF5VG9FbnVtKFtcbiAgXCJpbnZhbGlkX3R5cGVcIixcbiAgXCJpbnZhbGlkX2xpdGVyYWxcIixcbiAgXCJjdXN0b21cIixcbiAgXCJpbnZhbGlkX3VuaW9uXCIsXG4gIFwiaW52YWxpZF91bmlvbl9kaXNjcmltaW5hdG9yXCIsXG4gIFwiaW52YWxpZF9lbnVtX3ZhbHVlXCIsXG4gIFwidW5yZWNvZ25pemVkX2tleXNcIixcbiAgXCJpbnZhbGlkX2FyZ3VtZW50c1wiLFxuICBcImludmFsaWRfcmV0dXJuX3R5cGVcIixcbiAgXCJpbnZhbGlkX2RhdGVcIixcbiAgXCJpbnZhbGlkX3N0cmluZ1wiLFxuICBcInRvb19zbWFsbFwiLFxuICBcInRvb19iaWdcIixcbiAgXCJpbnZhbGlkX2ludGVyc2VjdGlvbl90eXBlc1wiLFxuICBcIm5vdF9tdWx0aXBsZV9vZlwiLFxuXSk7XG5cbmV4cG9ydCB0eXBlIFpvZElzc3VlQ29kZSA9IGtleW9mIHR5cGVvZiBab2RJc3N1ZUNvZGU7XG5cbmV4cG9ydCB0eXBlIFpvZElzc3VlQmFzZSA9IHtcbiAgcGF0aDogKHN0cmluZyB8IG51bWJlcilbXTtcbiAgbWVzc2FnZT86IHN0cmluZztcbn07XG5cbmV4cG9ydCBpbnRlcmZhY2UgWm9kSW52YWxpZFR5cGVJc3N1ZSBleHRlbmRzIFpvZElzc3VlQmFzZSB7XG4gIGNvZGU6IHR5cGVvZiBab2RJc3N1ZUNvZGUuaW52YWxpZF90eXBlO1xuICBleHBlY3RlZDogWm9kUGFyc2VkVHlwZTtcbiAgcmVjZWl2ZWQ6IFpvZFBhcnNlZFR5cGU7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgWm9kSW52YWxpZExpdGVyYWxJc3N1ZSBleHRlbmRzIFpvZElzc3VlQmFzZSB7XG4gIGNvZGU6IHR5cGVvZiBab2RJc3N1ZUNvZGUuaW52YWxpZF9saXRlcmFsO1xuICBleHBlY3RlZDogdW5rbm93bjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBab2RVbnJlY29nbml6ZWRLZXlzSXNzdWUgZXh0ZW5kcyBab2RJc3N1ZUJhc2Uge1xuICBjb2RlOiB0eXBlb2YgWm9kSXNzdWVDb2RlLnVucmVjb2duaXplZF9rZXlzO1xuICBrZXlzOiBzdHJpbmdbXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBab2RJbnZhbGlkVW5pb25Jc3N1ZSBleHRlbmRzIFpvZElzc3VlQmFzZSB7XG4gIGNvZGU6IHR5cGVvZiBab2RJc3N1ZUNvZGUuaW52YWxpZF91bmlvbjtcbiAgdW5pb25FcnJvcnM6IFpvZEVycm9yW107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgWm9kSW52YWxpZFVuaW9uRGlzY3JpbWluYXRvcklzc3VlIGV4dGVuZHMgWm9kSXNzdWVCYXNlIHtcbiAgY29kZTogdHlwZW9mIFpvZElzc3VlQ29kZS5pbnZhbGlkX3VuaW9uX2Rpc2NyaW1pbmF0b3I7XG4gIG9wdGlvbnM6IFByaW1pdGl2ZVtdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFpvZEludmFsaWRFbnVtVmFsdWVJc3N1ZSBleHRlbmRzIFpvZElzc3VlQmFzZSB7XG4gIGNvZGU6IHR5cGVvZiBab2RJc3N1ZUNvZGUuaW52YWxpZF9lbnVtX3ZhbHVlO1xuICBvcHRpb25zOiAoc3RyaW5nIHwgbnVtYmVyKVtdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFpvZEludmFsaWRBcmd1bWVudHNJc3N1ZSBleHRlbmRzIFpvZElzc3VlQmFzZSB7XG4gIGNvZGU6IHR5cGVvZiBab2RJc3N1ZUNvZGUuaW52YWxpZF9hcmd1bWVudHM7XG4gIGFyZ3VtZW50c0Vycm9yOiBab2RFcnJvcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBab2RJbnZhbGlkUmV0dXJuVHlwZUlzc3VlIGV4dGVuZHMgWm9kSXNzdWVCYXNlIHtcbiAgY29kZTogdHlwZW9mIFpvZElzc3VlQ29kZS5pbnZhbGlkX3JldHVybl90eXBlO1xuICByZXR1cm5UeXBlRXJyb3I6IFpvZEVycm9yO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFpvZEludmFsaWREYXRlSXNzdWUgZXh0ZW5kcyBab2RJc3N1ZUJhc2Uge1xuICBjb2RlOiB0eXBlb2YgWm9kSXNzdWVDb2RlLmludmFsaWRfZGF0ZTtcbn1cblxuZXhwb3J0IHR5cGUgU3RyaW5nVmFsaWRhdGlvbiA9IFwiZW1haWxcIiB8IFwidXJsXCIgfCBcInV1aWRcIiB8IFwicmVnZXhcIiB8IFwiY3VpZFwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFpvZEludmFsaWRTdHJpbmdJc3N1ZSBleHRlbmRzIFpvZElzc3VlQmFzZSB7XG4gIGNvZGU6IHR5cGVvZiBab2RJc3N1ZUNvZGUuaW52YWxpZF9zdHJpbmc7XG4gIHZhbGlkYXRpb246IFN0cmluZ1ZhbGlkYXRpb247XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgWm9kVG9vU21hbGxJc3N1ZSBleHRlbmRzIFpvZElzc3VlQmFzZSB7XG4gIGNvZGU6IHR5cGVvZiBab2RJc3N1ZUNvZGUudG9vX3NtYWxsO1xuICBtaW5pbXVtOiBudW1iZXI7XG4gIGluY2x1c2l2ZTogYm9vbGVhbjtcbiAgdHlwZTogXCJhcnJheVwiIHwgXCJzdHJpbmdcIiB8IFwibnVtYmVyXCIgfCBcInNldFwiO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFpvZFRvb0JpZ0lzc3VlIGV4dGVuZHMgWm9kSXNzdWVCYXNlIHtcbiAgY29kZTogdHlwZW9mIFpvZElzc3VlQ29kZS50b29fYmlnO1xuICBtYXhpbXVtOiBudW1iZXI7XG4gIGluY2x1c2l2ZTogYm9vbGVhbjtcbiAgdHlwZTogXCJhcnJheVwiIHwgXCJzdHJpbmdcIiB8IFwibnVtYmVyXCIgfCBcInNldFwiO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFpvZEludmFsaWRJbnRlcnNlY3Rpb25UeXBlc0lzc3VlIGV4dGVuZHMgWm9kSXNzdWVCYXNlIHtcbiAgY29kZTogdHlwZW9mIFpvZElzc3VlQ29kZS5pbnZhbGlkX2ludGVyc2VjdGlvbl90eXBlcztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBab2ROb3RNdWx0aXBsZU9mSXNzdWUgZXh0ZW5kcyBab2RJc3N1ZUJhc2Uge1xuICBjb2RlOiB0eXBlb2YgWm9kSXNzdWVDb2RlLm5vdF9tdWx0aXBsZV9vZjtcbiAgbXVsdGlwbGVPZjogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFpvZEN1c3RvbUlzc3VlIGV4dGVuZHMgWm9kSXNzdWVCYXNlIHtcbiAgY29kZTogdHlwZW9mIFpvZElzc3VlQ29kZS5jdXN0b207XG4gIHBhcmFtcz86IHsgW2s6IHN0cmluZ106IGFueSB9O1xufVxuXG5leHBvcnQgdHlwZSBEZW5vcm1hbGl6ZWRFcnJvciA9IHsgW2s6IHN0cmluZ106IERlbm9ybWFsaXplZEVycm9yIHwgc3RyaW5nW10gfTtcblxuZXhwb3J0IHR5cGUgWm9kSXNzdWVPcHRpb25hbE1lc3NhZ2UgPVxuICB8IFpvZEludmFsaWRUeXBlSXNzdWVcbiAgfCBab2RJbnZhbGlkTGl0ZXJhbElzc3VlXG4gIHwgWm9kVW5yZWNvZ25pemVkS2V5c0lzc3VlXG4gIHwgWm9kSW52YWxpZFVuaW9uSXNzdWVcbiAgfCBab2RJbnZhbGlkVW5pb25EaXNjcmltaW5hdG9ySXNzdWVcbiAgfCBab2RJbnZhbGlkRW51bVZhbHVlSXNzdWVcbiAgfCBab2RJbnZhbGlkQXJndW1lbnRzSXNzdWVcbiAgfCBab2RJbnZhbGlkUmV0dXJuVHlwZUlzc3VlXG4gIHwgWm9kSW52YWxpZERhdGVJc3N1ZVxuICB8IFpvZEludmFsaWRTdHJpbmdJc3N1ZVxuICB8IFpvZFRvb1NtYWxsSXNzdWVcbiAgfCBab2RUb29CaWdJc3N1ZVxuICB8IFpvZEludmFsaWRJbnRlcnNlY3Rpb25UeXBlc0lzc3VlXG4gIHwgWm9kTm90TXVsdGlwbGVPZklzc3VlXG4gIHwgWm9kQ3VzdG9tSXNzdWU7XG5cbmV4cG9ydCB0eXBlIFpvZElzc3VlID0gWm9kSXNzdWVPcHRpb25hbE1lc3NhZ2UgJiB7IG1lc3NhZ2U6IHN0cmluZyB9O1xuXG5leHBvcnQgY29uc3QgcXVvdGVsZXNzSnNvbiA9IChvYmo6IGFueSkgPT4ge1xuICBjb25zdCBqc29uID0gSlNPTi5zdHJpbmdpZnkob2JqLCBudWxsLCAyKTtcbiAgcmV0dXJuIGpzb24ucmVwbGFjZSgvXCIoW15cIl0rKVwiOi9nLCBcIiQxOlwiKTtcbn07XG5cbmV4cG9ydCB0eXBlIFpvZEZvcm1hdHRlZEVycm9yPFQ+ID0ge1xuICBfZXJyb3JzOiBzdHJpbmdbXTtcbn0gJiAoVCBleHRlbmRzIFthbnksIC4uLmFueVtdXVxuICA/IHsgW0sgaW4ga2V5b2YgVF0/OiBab2RGb3JtYXR0ZWRFcnJvcjxUW0tdPiB9XG4gIDogVCBleHRlbmRzIGFueVtdXG4gID8gWm9kRm9ybWF0dGVkRXJyb3I8VFtudW1iZXJdPltdXG4gIDogVCBleHRlbmRzIG9iamVjdFxuICA/IHsgW0sgaW4ga2V5b2YgVF0/OiBab2RGb3JtYXR0ZWRFcnJvcjxUW0tdPiB9XG4gIDogdW5rbm93bik7XG5cbmV4cG9ydCBjbGFzcyBab2RFcnJvcjxUID0gYW55PiBleHRlbmRzIEVycm9yIHtcbiAgaXNzdWVzOiBab2RJc3N1ZVtdID0gW107XG5cbiAgZ2V0IGVycm9ycygpIHtcbiAgICByZXR1cm4gdGhpcy5pc3N1ZXM7XG4gIH1cblxuICBjb25zdHJ1Y3Rvcihpc3N1ZXM6IFpvZElzc3VlW10pIHtcbiAgICBzdXBlcigpO1xuXG4gICAgY29uc3QgYWN0dWFsUHJvdG8gPSBuZXcudGFyZ2V0LnByb3RvdHlwZTtcbiAgICBpZiAoT2JqZWN0LnNldFByb3RvdHlwZU9mKSB7XG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgYmFuL2JhblxuICAgICAgT2JqZWN0LnNldFByb3RvdHlwZU9mKHRoaXMsIGFjdHVhbFByb3RvKTtcbiAgICB9IGVsc2Uge1xuICAgICAgKHRoaXMgYXMgYW55KS5fX3Byb3RvX18gPSBhY3R1YWxQcm90bztcbiAgICB9XG4gICAgdGhpcy5uYW1lID0gXCJab2RFcnJvclwiO1xuICAgIHRoaXMuaXNzdWVzID0gaXNzdWVzO1xuICB9XG5cbiAgZm9ybWF0ID0gKCk6IFpvZEZvcm1hdHRlZEVycm9yPFQ+ID0+IHtcbiAgICBjb25zdCBmaWVsZEVycm9yczogWm9kRm9ybWF0dGVkRXJyb3I8VD4gPSB7IF9lcnJvcnM6IFtdIH0gYXMgYW55O1xuICAgIGNvbnN0IHByb2Nlc3NFcnJvciA9IChlcnJvcjogWm9kRXJyb3IpID0+IHtcbiAgICAgIGZvciAoY29uc3QgaXNzdWUgb2YgZXJyb3IuaXNzdWVzKSB7XG4gICAgICAgIGlmIChpc3N1ZS5jb2RlID09PSBcImludmFsaWRfdW5pb25cIikge1xuICAgICAgICAgIGlzc3VlLnVuaW9uRXJyb3JzLm1hcChwcm9jZXNzRXJyb3IpO1xuICAgICAgICB9IGVsc2UgaWYgKGlzc3VlLmNvZGUgPT09IFwiaW52YWxpZF9yZXR1cm5fdHlwZVwiKSB7XG4gICAgICAgICAgcHJvY2Vzc0Vycm9yKGlzc3VlLnJldHVyblR5cGVFcnJvcik7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNzdWUuY29kZSA9PT0gXCJpbnZhbGlkX2FyZ3VtZW50c1wiKSB7XG4gICAgICAgICAgcHJvY2Vzc0Vycm9yKGlzc3VlLmFyZ3VtZW50c0Vycm9yKTtcbiAgICAgICAgfSBlbHNlIGlmIChpc3N1ZS5wYXRoLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIChmaWVsZEVycm9ycyBhcyBhbnkpLl9lcnJvcnMucHVzaChpc3N1ZS5tZXNzYWdlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsZXQgY3VycjogYW55ID0gZmllbGRFcnJvcnM7XG4gICAgICAgICAgbGV0IGkgPSAwO1xuICAgICAgICAgIHdoaWxlIChpIDwgaXNzdWUucGF0aC5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNvbnN0IGVsID0gaXNzdWUucGF0aFtpXTtcbiAgICAgICAgICAgIGNvbnN0IHRlcm1pbmFsID0gaSA9PT0gaXNzdWUucGF0aC5sZW5ndGggLSAxO1xuXG4gICAgICAgICAgICBpZiAoIXRlcm1pbmFsKSB7XG4gICAgICAgICAgICAgIGlmICh0eXBlb2YgZWwgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICBjdXJyW2VsXSA9IGN1cnJbZWxdIHx8IHsgX2Vycm9yczogW10gfTtcbiAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgZWwgPT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBlcnJvckFycmF5OiBhbnkgPSBbXTtcbiAgICAgICAgICAgICAgICBlcnJvckFycmF5Ll9lcnJvcnMgPSBbXTtcbiAgICAgICAgICAgICAgICBjdXJyW2VsXSA9IGN1cnJbZWxdIHx8IGVycm9yQXJyYXk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGN1cnJbZWxdID0gY3VycltlbF0gfHwgeyBfZXJyb3JzOiBbXSB9O1xuICAgICAgICAgICAgICBjdXJyW2VsXS5fZXJyb3JzLnB1c2goaXNzdWUubWVzc2FnZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGN1cnIgPSBjdXJyW2VsXTtcbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuXG4gICAgcHJvY2Vzc0Vycm9yKHRoaXMpO1xuICAgIHJldHVybiBmaWVsZEVycm9ycztcbiAgfTtcblxuICBzdGF0aWMgY3JlYXRlID0gKGlzc3VlczogWm9kSXNzdWVbXSkgPT4ge1xuICAgIGNvbnN0IGVycm9yID0gbmV3IFpvZEVycm9yKGlzc3Vlcyk7XG4gICAgcmV0dXJuIGVycm9yO1xuICB9O1xuXG4gIHRvU3RyaW5nKCkge1xuICAgIHJldHVybiB0aGlzLm1lc3NhZ2U7XG4gIH1cbiAgZ2V0IG1lc3NhZ2UoKSB7XG4gICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHRoaXMuaXNzdWVzLCBudWxsLCAyKTtcbiAgfVxuXG4gIGdldCBpc0VtcHR5KCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmlzc3Vlcy5sZW5ndGggPT09IDA7XG4gIH1cblxuICBhZGRJc3N1ZSA9IChzdWI6IFpvZElzc3VlKSA9PiB7XG4gICAgdGhpcy5pc3N1ZXMgPSBbLi4udGhpcy5pc3N1ZXMsIHN1Yl07XG4gIH07XG5cbiAgYWRkSXNzdWVzID0gKHN1YnM6IFpvZElzc3VlW10gPSBbXSkgPT4ge1xuICAgIHRoaXMuaXNzdWVzID0gWy4uLnRoaXMuaXNzdWVzLCAuLi5zdWJzXTtcbiAgfTtcblxuICBmbGF0dGVuKG1hcHBlcj86IChpc3N1ZTogWm9kSXNzdWUpID0+IHN0cmluZyk6IHtcbiAgICBmb3JtRXJyb3JzOiBzdHJpbmdbXTtcbiAgICBmaWVsZEVycm9yczogeyBbazogc3RyaW5nXTogc3RyaW5nW10gfTtcbiAgfTtcbiAgZmxhdHRlbjxVPihtYXBwZXI/OiAoaXNzdWU6IFpvZElzc3VlKSA9PiBVKToge1xuICAgIGZvcm1FcnJvcnM6IFVbXTtcbiAgICBmaWVsZEVycm9yczogeyBbazogc3RyaW5nXTogVVtdIH07XG4gIH07XG4gIGZsYXR0ZW48VSA9IHN0cmluZz4oXG4gICAgbWFwcGVyOiAoaXNzdWU6IFpvZElzc3VlKSA9PiBVID0gKGlzc3VlOiBab2RJc3N1ZSkgPT4gaXNzdWUubWVzc2FnZSBhcyBhbnlcbiAgKToge1xuICAgIGZvcm1FcnJvcnM6IFVbXTtcbiAgICBmaWVsZEVycm9yczogeyBbazogc3RyaW5nXTogVVtdIH07XG4gIH0ge1xuICAgIGNvbnN0IGZpZWxkRXJyb3JzOiBhbnkgPSB7fTtcbiAgICBjb25zdCBmb3JtRXJyb3JzOiBVW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IHN1YiBvZiB0aGlzLmlzc3Vlcykge1xuICAgICAgaWYgKHN1Yi5wYXRoLmxlbmd0aCA+IDApIHtcbiAgICAgICAgZmllbGRFcnJvcnNbc3ViLnBhdGhbMF1dID0gZmllbGRFcnJvcnNbc3ViLnBhdGhbMF1dIHx8IFtdO1xuICAgICAgICBmaWVsZEVycm9yc1tzdWIucGF0aFswXV0ucHVzaChtYXBwZXIoc3ViKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3JtRXJyb3JzLnB1c2gobWFwcGVyKHN1YikpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4geyBmb3JtRXJyb3JzLCBmaWVsZEVycm9ycyB9O1xuICB9XG5cbiAgZ2V0IGZvcm1FcnJvcnMoKSB7XG4gICAgcmV0dXJuIHRoaXMuZmxhdHRlbigpO1xuICB9XG59XG5cbnR5cGUgc3RyaXBQYXRoPFQgZXh0ZW5kcyBvYmplY3Q+ID0gVCBleHRlbmRzIGFueVxuICA/IHV0aWwuT21pdEtleXM8VCwgXCJwYXRoXCI+XG4gIDogbmV2ZXI7XG5cbmV4cG9ydCB0eXBlIElzc3VlRGF0YSA9IHN0cmlwUGF0aDxab2RJc3N1ZU9wdGlvbmFsTWVzc2FnZT4gJiB7XG4gIHBhdGg/OiAoc3RyaW5nIHwgbnVtYmVyKVtdO1xuICBmYXRhbD86IGJvb2xlYW47XG59O1xuZXhwb3J0IHR5cGUgTWFrZUVycm9yRGF0YSA9IElzc3VlRGF0YTtcblxudHlwZSBFcnJvck1hcEN0eCA9IHtcbiAgZGVmYXVsdEVycm9yOiBzdHJpbmc7XG4gIGRhdGE6IGFueTtcbn07XG5cbmV4cG9ydCB0eXBlIFpvZEVycm9yTWFwID0gdHlwZW9mIGRlZmF1bHRFcnJvck1hcDtcbmV4cG9ydCBjb25zdCBkZWZhdWx0RXJyb3JNYXAgPSAoXG4gIGlzc3VlOiBab2RJc3N1ZU9wdGlvbmFsTWVzc2FnZSxcbiAgX2N0eDogRXJyb3JNYXBDdHhcbik6IHsgbWVzc2FnZTogc3RyaW5nIH0gPT4ge1xuICBsZXQgbWVzc2FnZTogc3RyaW5nO1xuICBzd2l0Y2ggKGlzc3VlLmNvZGUpIHtcbiAgICBjYXNlIFpvZElzc3VlQ29kZS5pbnZhbGlkX3R5cGU6XG4gICAgICBpZiAoaXNzdWUucmVjZWl2ZWQgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgbWVzc2FnZSA9IFwiUmVxdWlyZWRcIjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1lc3NhZ2UgPSBgRXhwZWN0ZWQgJHtpc3N1ZS5leHBlY3RlZH0sIHJlY2VpdmVkICR7aXNzdWUucmVjZWl2ZWR9YDtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgWm9kSXNzdWVDb2RlLmludmFsaWRfbGl0ZXJhbDpcbiAgICAgIG1lc3NhZ2UgPSBgSW52YWxpZCBsaXRlcmFsIHZhbHVlLCBleHBlY3RlZCAke0pTT04uc3RyaW5naWZ5KFxuICAgICAgICBpc3N1ZS5leHBlY3RlZFxuICAgICAgKX1gO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBab2RJc3N1ZUNvZGUudW5yZWNvZ25pemVkX2tleXM6XG4gICAgICBtZXNzYWdlID0gYFVucmVjb2duaXplZCBrZXkocykgaW4gb2JqZWN0OiAke2lzc3VlLmtleXNcbiAgICAgICAgLm1hcCgoaykgPT4gYCcke2t9J2ApXG4gICAgICAgIC5qb2luKFwiLCBcIil9YDtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgWm9kSXNzdWVDb2RlLmludmFsaWRfdW5pb246XG4gICAgICBtZXNzYWdlID0gYEludmFsaWQgaW5wdXRgO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBab2RJc3N1ZUNvZGUuaW52YWxpZF91bmlvbl9kaXNjcmltaW5hdG9yOlxuICAgICAgbWVzc2FnZSA9IGBJbnZhbGlkIGRpc2NyaW1pbmF0b3IgdmFsdWUuIEV4cGVjdGVkICR7aXNzdWUub3B0aW9uc1xuICAgICAgICAubWFwKCh2YWwpID0+ICh0eXBlb2YgdmFsID09PSBcInN0cmluZ1wiID8gYCcke3ZhbH0nYCA6IHZhbCkpXG4gICAgICAgIC5qb2luKFwiIHwgXCIpfWA7XG4gICAgICBicmVhaztcbiAgICBjYXNlIFpvZElzc3VlQ29kZS5pbnZhbGlkX2VudW1fdmFsdWU6XG4gICAgICBtZXNzYWdlID0gYEludmFsaWQgZW51bSB2YWx1ZS4gRXhwZWN0ZWQgJHtpc3N1ZS5vcHRpb25zXG4gICAgICAgIC5tYXAoKHZhbCkgPT4gKHR5cGVvZiB2YWwgPT09IFwic3RyaW5nXCIgPyBgJyR7dmFsfSdgIDogdmFsKSlcbiAgICAgICAgLmpvaW4oXCIgfCBcIil9YDtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgWm9kSXNzdWVDb2RlLmludmFsaWRfYXJndW1lbnRzOlxuICAgICAgbWVzc2FnZSA9IGBJbnZhbGlkIGZ1bmN0aW9uIGFyZ3VtZW50c2A7XG4gICAgICBicmVhaztcbiAgICBjYXNlIFpvZElzc3VlQ29kZS5pbnZhbGlkX3JldHVybl90eXBlOlxuICAgICAgbWVzc2FnZSA9IGBJbnZhbGlkIGZ1bmN0aW9uIHJldHVybiB0eXBlYDtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgWm9kSXNzdWVDb2RlLmludmFsaWRfZGF0ZTpcbiAgICAgIG1lc3NhZ2UgPSBgSW52YWxpZCBkYXRlYDtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgWm9kSXNzdWVDb2RlLmludmFsaWRfc3RyaW5nOlxuICAgICAgaWYgKGlzc3VlLnZhbGlkYXRpb24gIT09IFwicmVnZXhcIikgbWVzc2FnZSA9IGBJbnZhbGlkICR7aXNzdWUudmFsaWRhdGlvbn1gO1xuICAgICAgZWxzZSBtZXNzYWdlID0gXCJJbnZhbGlkXCI7XG4gICAgICBicmVhaztcbiAgICBjYXNlIFpvZElzc3VlQ29kZS50b29fc21hbGw6XG4gICAgICBpZiAoaXNzdWUudHlwZSA9PT0gXCJhcnJheVwiKVxuICAgICAgICBtZXNzYWdlID0gYEFycmF5IG11c3QgY29udGFpbiAke1xuICAgICAgICAgIGlzc3VlLmluY2x1c2l2ZSA/IGBhdCBsZWFzdGAgOiBgbW9yZSB0aGFuYFxuICAgICAgICB9ICR7aXNzdWUubWluaW11bX0gZWxlbWVudChzKWA7XG4gICAgICBlbHNlIGlmIChpc3N1ZS50eXBlID09PSBcInN0cmluZ1wiKVxuICAgICAgICBtZXNzYWdlID0gYFN0cmluZyBtdXN0IGNvbnRhaW4gJHtcbiAgICAgICAgICBpc3N1ZS5pbmNsdXNpdmUgPyBgYXQgbGVhc3RgIDogYG92ZXJgXG4gICAgICAgIH0gJHtpc3N1ZS5taW5pbXVtfSBjaGFyYWN0ZXIocylgO1xuICAgICAgZWxzZSBpZiAoaXNzdWUudHlwZSA9PT0gXCJudW1iZXJcIilcbiAgICAgICAgbWVzc2FnZSA9IGBOdW1iZXIgbXVzdCBiZSBncmVhdGVyIHRoYW4gJHtcbiAgICAgICAgICBpc3N1ZS5pbmNsdXNpdmUgPyBgb3IgZXF1YWwgdG8gYCA6IGBgXG4gICAgICAgIH0ke2lzc3VlLm1pbmltdW19YDtcbiAgICAgIGVsc2UgbWVzc2FnZSA9IFwiSW52YWxpZCBpbnB1dFwiO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBab2RJc3N1ZUNvZGUudG9vX2JpZzpcbiAgICAgIGlmIChpc3N1ZS50eXBlID09PSBcImFycmF5XCIpXG4gICAgICAgIG1lc3NhZ2UgPSBgQXJyYXkgbXVzdCBjb250YWluICR7XG4gICAgICAgICAgaXNzdWUuaW5jbHVzaXZlID8gYGF0IG1vc3RgIDogYGxlc3MgdGhhbmBcbiAgICAgICAgfSAke2lzc3VlLm1heGltdW19IGVsZW1lbnQocylgO1xuICAgICAgZWxzZSBpZiAoaXNzdWUudHlwZSA9PT0gXCJzdHJpbmdcIilcbiAgICAgICAgbWVzc2FnZSA9IGBTdHJpbmcgbXVzdCBjb250YWluICR7XG4gICAgICAgICAgaXNzdWUuaW5jbHVzaXZlID8gYGF0IG1vc3RgIDogYHVuZGVyYFxuICAgICAgICB9ICR7aXNzdWUubWF4aW11bX0gY2hhcmFjdGVyKHMpYDtcbiAgICAgIGVsc2UgaWYgKGlzc3VlLnR5cGUgPT09IFwibnVtYmVyXCIpXG4gICAgICAgIG1lc3NhZ2UgPSBgTnVtYmVyIG11c3QgYmUgbGVzcyB0aGFuICR7XG4gICAgICAgICAgaXNzdWUuaW5jbHVzaXZlID8gYG9yIGVxdWFsIHRvIGAgOiBgYFxuICAgICAgICB9JHtpc3N1ZS5tYXhpbXVtfWA7XG4gICAgICBlbHNlIG1lc3NhZ2UgPSBcIkludmFsaWQgaW5wdXRcIjtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgWm9kSXNzdWVDb2RlLmN1c3RvbTpcbiAgICAgIG1lc3NhZ2UgPSBgSW52YWxpZCBpbnB1dGA7XG4gICAgICBicmVhaztcbiAgICBjYXNlIFpvZElzc3VlQ29kZS5pbnZhbGlkX2ludGVyc2VjdGlvbl90eXBlczpcbiAgICAgIG1lc3NhZ2UgPSBgSW50ZXJzZWN0aW9uIHJlc3VsdHMgY291bGQgbm90IGJlIG1lcmdlZGA7XG4gICAgICBicmVhaztcbiAgICBjYXNlIFpvZElzc3VlQ29kZS5ub3RfbXVsdGlwbGVfb2Y6XG4gICAgICBtZXNzYWdlID0gYE51bWJlciBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgJHtpc3N1ZS5tdWx0aXBsZU9mfWA7XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgbWVzc2FnZSA9IF9jdHguZGVmYXVsdEVycm9yO1xuICAgICAgdXRpbC5hc3NlcnROZXZlcihpc3N1ZSk7XG4gIH1cbiAgcmV0dXJuIHsgbWVzc2FnZSB9O1xufTtcblxuZXhwb3J0IGxldCBvdmVycmlkZUVycm9yTWFwID0gZGVmYXVsdEVycm9yTWFwO1xuXG5leHBvcnQgY29uc3Qgc2V0RXJyb3JNYXAgPSAobWFwOiBab2RFcnJvck1hcCkgPT4ge1xuICBvdmVycmlkZUVycm9yTWFwID0gbWFwO1xufTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFFQSxTQUFTLElBQUksUUFBUSxvQkFBb0I7QUFFekMsT0FBTyxNQUFNLGVBQWUsS0FBSyxZQUFZO0lBQzNDO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtDQUNELEVBQUU7QUE4R0gsT0FBTyxNQUFNLGdCQUFnQixDQUFDO0lBQzVCLE1BQU0sT0FBTyxLQUFLLFVBQVUsS0FBSyxNQUFNO0lBQ3ZDLE9B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