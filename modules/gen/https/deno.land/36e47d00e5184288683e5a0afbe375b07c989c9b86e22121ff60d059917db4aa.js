// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
export class Tokenizer {
    rules;
    constructor(rules = []){
        this.rules = rules;
    }
    addRule(test, fn) {
        this.rules.push({
            test,
            fn
        });
        return this;
    }
    tokenize(string, receiver = (token)=>token) {
        function* generator(rules) {
            let index = 0;
            for (const rule of rules){
                const result = rule.test(string);
                if (result) {
                    const { value , length  } = result;
                    index += length;
                    string = string.slice(length);
                    const token = {
                        ...rule.fn(value),
                        index
                    };
                    yield receiver(token);
                    yield* generator(rules);
                }
            }
        }
        const tokenGenerator = generator(this.rules);
        const tokens = [];
        for (const token of tokenGenerator){
            tokens.push(token);
        }
        if (string.length) {
            throw new Error(`parser error: string not fully parsed! ${string.slice(0, 25)}`);
        }
        return tokens;
    }
}
function digits(value, count = 2) {
    return String(value).padStart(count, "0");
}
function createLiteralTestFunction(value) {
    return (string)=>{
        return string.startsWith(value) ? {
            value,
            length: value.length
        } : undefined;
    };
}
function createMatchTestFunction(match) {
    return (string)=>{
        const result = match.exec(string);
        if (result) return {
            value: result,
            length: result[0].length
        };
    };
}
// according to unicode symbols (http://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table)
const defaultRules = [
    {
        test: createLiteralTestFunction("yyyy"),
        fn: ()=>({
                type: "year",
                value: "numeric"
            })
    },
    {
        test: createLiteralTestFunction("yy"),
        fn: ()=>({
                type: "year",
                value: "2-digit"
            })
    },
    {
        test: createLiteralTestFunction("MM"),
        fn: ()=>({
                type: "month",
                value: "2-digit"
            })
    },
    {
        test: createLiteralTestFunction("M"),
        fn: ()=>({
                type: "month",
                value: "numeric"
            })
    },
    {
        test: createLiteralTestFunction("dd"),
        fn: ()=>({
                type: "day",
                value: "2-digit"
            })
    },
    {
        test: createLiteralTestFunction("d"),
        fn: ()=>({
                type: "day",
                value: "numeric"
            })
    },
    {
        test: createLiteralTestFunction("HH"),
        fn: ()=>({
                type: "hour",
                value: "2-digit"
            })
    },
    {
        test: createLiteralTestFunction("H"),
        fn: ()=>({
                type: "hour",
                value: "numeric"
            })
    },
    {
        test: createLiteralTestFunction("hh"),
        fn: ()=>({
                type: "hour",
                value: "2-digit",
                hour12: true
            })
    },
    {
        test: createLiteralTestFunction("h"),
        fn: ()=>({
                type: "hour",
                value: "numeric",
                hour12: true
            })
    },
    {
        test: createLiteralTestFunction("mm"),
        fn: ()=>({
                type: "minute",
                value: "2-digit"
            })
    },
    {
        test: createLiteralTestFunction("m"),
        fn: ()=>({
                type: "minute",
                value: "numeric"
            })
    },
    {
        test: createLiteralTestFunction("ss"),
        fn: ()=>({
                type: "second",
                value: "2-digit"
            })
    },
    {
        test: createLiteralTestFunction("s"),
        fn: ()=>({
                type: "second",
                value: "numeric"
            })
    },
    {
        test: createLiteralTestFunction("SSS"),
        fn: ()=>({
                type: "fractionalSecond",
                value: 3
            })
    },
    {
        test: createLiteralTestFunction("SS"),
        fn: ()=>({
                type: "fractionalSecond",
                value: 2
            })
    },
    {
        test: createLiteralTestFunction("S"),
        fn: ()=>({
                type: "fractionalSecond",
                value: 1
            })
    },
    {
        test: createLiteralTestFunction("a"),
        fn: (value)=>({
                type: "dayPeriod",
                value: value
            })
    },
    // quoted literal
    {
        test: createMatchTestFunction(/^(')(?<value>\\.|[^\']*)\1/),
        fn: (match)=>({
                type: "literal",
                value: match.groups.value
            })
    },
    // literal
    {
        test: createMatchTestFunction(/^.+?\s*/),
        fn: (match)=>({
                type: "literal",
                value: match[0]
            })
    }
];
export class DateTimeFormatter {
    #format;
    constructor(formatString, rules = defaultRules){
        const tokenizer = new Tokenizer(rules);
        this.#format = tokenizer.tokenize(formatString, ({ type , value , hour12  })=>{
            const result = {
                type,
                value
            };
            if (hour12) result.hour12 = hour12;
            return result;
        });
    }
    format(date, options = {}) {
        let string = "";
        const utc = options.timeZone === "UTC";
        for (const token of this.#format){
            const type = token.type;
            switch(type){
                case "year":
                    {
                        const value = utc ? date.getUTCFullYear() : date.getFullYear();
                        switch(token.value){
                            case "numeric":
                                {
                                    string += value;
                                    break;
                                }
                            case "2-digit":
                                {
                                    string += digits(value, 2).slice(-2);
                                    break;
                                }
                            default:
                                throw Error(`FormatterError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "month":
                    {
                        const value = (utc ? date.getUTCMonth() : date.getMonth()) + 1;
                        switch(token.value){
                            case "numeric":
                                {
                                    string += value;
                                    break;
                                }
                            case "2-digit":
                                {
                                    string += digits(value, 2);
                                    break;
                                }
                            default:
                                throw Error(`FormatterError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "day":
                    {
                        const value = utc ? date.getUTCDate() : date.getDate();
                        switch(token.value){
                            case "numeric":
                                {
                                    string += value;
                                    break;
                                }
                            case "2-digit":
                                {
                                    string += digits(value, 2);
                                    break;
                                }
                            default:
                                throw Error(`FormatterError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "hour":
                    {
                        let value = utc ? date.getUTCHours() : date.getHours();
                        value -= token.hour12 && date.getHours() > 12 ? 12 : 0;
                        switch(token.value){
                            case "numeric":
                                {
                                    string += value;
                                    break;
                                }
                            case "2-digit":
                                {
                                    string += digits(value, 2);
                                    break;
                                }
                            default:
                                throw Error(`FormatterError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "minute":
                    {
                        const value = utc ? date.getUTCMinutes() : date.getMinutes();
                        switch(token.value){
                            case "numeric":
                                {
                                    string += value;
                                    break;
                                }
                            case "2-digit":
                                {
                                    string += digits(value, 2);
                                    break;
                                }
                            default:
                                throw Error(`FormatterError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "second":
                    {
                        const value = utc ? date.getUTCSeconds() : date.getSeconds();
                        switch(token.value){
                            case "numeric":
                                {
                                    string += value;
                                    break;
                                }
                            case "2-digit":
                                {
                                    string += digits(value, 2);
                                    break;
                                }
                            default:
                                throw Error(`FormatterError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "fractionalSecond":
                    {
                        const value = utc ? date.getUTCMilliseconds() : date.getMilliseconds();
                        string += digits(value, Number(token.value));
                        break;
                    }
                // FIXME(bartlomieju)
                case "timeZoneName":
                    {
                        break;
                    }
                case "dayPeriod":
                    {
                        string += token.value ? date.getHours() >= 12 ? "PM" : "AM" : "";
                        break;
                    }
                case "literal":
                    {
                        string += token.value;
                        break;
                    }
                default:
                    throw Error(`FormatterError: { ${token.type} ${token.value} }`);
            }
        }
        return string;
    }
    parseToParts(string) {
        const parts = [];
        for (const token of this.#format){
            const type = token.type;
            let value = "";
            switch(token.type){
                case "year":
                    {
                        switch(token.value){
                            case "numeric":
                                {
                                    value = /^\d{1,4}/.exec(string)?.[0];
                                    break;
                                }
                            case "2-digit":
                                {
                                    value = /^\d{1,2}/.exec(string)?.[0];
                                    break;
                                }
                        }
                        break;
                    }
                case "month":
                    {
                        switch(token.value){
                            case "numeric":
                                {
                                    value = /^\d{1,2}/.exec(string)?.[0];
                                    break;
                                }
                            case "2-digit":
                                {
                                    value = /^\d{2}/.exec(string)?.[0];
                                    break;
                                }
                            case "narrow":
                                {
                                    value = /^[a-zA-Z]+/.exec(string)?.[0];
                                    break;
                                }
                            case "short":
                                {
                                    value = /^[a-zA-Z]+/.exec(string)?.[0];
                                    break;
                                }
                            case "long":
                                {
                                    value = /^[a-zA-Z]+/.exec(string)?.[0];
                                    break;
                                }
                            default:
                                throw Error(`ParserError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "day":
                    {
                        switch(token.value){
                            case "numeric":
                                {
                                    value = /^\d{1,2}/.exec(string)?.[0];
                                    break;
                                }
                            case "2-digit":
                                {
                                    value = /^\d{2}/.exec(string)?.[0];
                                    break;
                                }
                            default:
                                throw Error(`ParserError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "hour":
                    {
                        switch(token.value){
                            case "numeric":
                                {
                                    value = /^\d{1,2}/.exec(string)?.[0];
                                    if (token.hour12 && parseInt(value) > 12) {
                                        console.error(`Trying to parse hour greater than 12. Use 'H' instead of 'h'.`);
                                    }
                                    break;
                                }
                            case "2-digit":
                                {
                                    value = /^\d{2}/.exec(string)?.[0];
                                    if (token.hour12 && parseInt(value) > 12) {
                                        console.error(`Trying to parse hour greater than 12. Use 'HH' instead of 'hh'.`);
                                    }
                                    break;
                                }
                            default:
                                throw Error(`ParserError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "minute":
                    {
                        switch(token.value){
                            case "numeric":
                                {
                                    value = /^\d{1,2}/.exec(string)?.[0];
                                    break;
                                }
                            case "2-digit":
                                {
                                    value = /^\d{2}/.exec(string)?.[0];
                                    break;
                                }
                            default:
                                throw Error(`ParserError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "second":
                    {
                        switch(token.value){
                            case "numeric":
                                {
                                    value = /^\d{1,2}/.exec(string)?.[0];
                                    break;
                                }
                            case "2-digit":
                                {
                                    value = /^\d{2}/.exec(string)?.[0];
                                    break;
                                }
                            default:
                                throw Error(`ParserError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "fractionalSecond":
                    {
                        value = new RegExp(`^\\d{${token.value}}`).exec(string)?.[0];
                        break;
                    }
                case "timeZoneName":
                    {
                        value = token.value;
                        break;
                    }
                case "dayPeriod":
                    {
                        value = /^(A|P)M/.exec(string)?.[0];
                        break;
                    }
                case "literal":
                    {
                        if (!string.startsWith(token.value)) {
                            throw Error(`Literal "${token.value}" not found "${string.slice(0, 25)}"`);
                        }
                        value = token.value;
                        break;
                    }
                default:
                    throw Error(`${token.type} ${token.value}`);
            }
            if (!value) {
                throw Error(`value not valid for token { ${type} ${value} } ${string.slice(0, 25)}`);
            }
            parts.push({
                type,
                value
            });
            string = string.slice(value.length);
        }
        if (string.length) {
            throw Error(`datetime string was not fully parsed! ${string.slice(0, 25)}`);
        }
        return parts;
    }
    /** sort & filter dateTimeFormatPart */ sortDateTimeFormatPart(parts) {
        let result = [];
        const typeArray = [
            "year",
            "month",
            "day",
            "hour",
            "minute",
            "second",
            "fractionalSecond"
        ];
        for (const type of typeArray){
            const current = parts.findIndex((el)=>el.type === type);
            if (current !== -1) {
                result = result.concat(parts.splice(current, 1));
            }
        }
        result = result.concat(parts);
        return result;
    }
    partsToDate(parts) {
        const date = new Date();
        const utc = parts.find((part)=>part.type === "timeZoneName" && part.value === "UTC");
        const dayPart = parts.find((part)=>part.type === "day");
        utc ? date.setUTCHours(0, 0, 0, 0) : date.setHours(0, 0, 0, 0);
        for (const part of parts){
            switch(part.type){
                case "year":
                    {
                        const value = Number(part.value.padStart(4, "20"));
                        utc ? date.setUTCFullYear(value) : date.setFullYear(value);
                        break;
                    }
                case "month":
                    {
                        const value = Number(part.value) - 1;
                        if (dayPart) {
                            utc ? date.setUTCMonth(value, Number(dayPart.value)) : date.setMonth(value, Number(dayPart.value));
                        } else {
                            utc ? date.setUTCMonth(value) : date.setMonth(value);
                        }
                        break;
                    }
                case "day":
                    {
                        const value = Number(part.value);
                        utc ? date.setUTCDate(value) : date.setDate(value);
                        break;
                    }
                case "hour":
                    {
                        let value = Number(part.value);
                        const dayPeriod = parts.find((part)=>part.type === "dayPeriod");
                        if (dayPeriod?.value === "PM") value += 12;
                        utc ? date.setUTCHours(value) : date.setHours(value);
                        break;
                    }
                case "minute":
                    {
                        const value = Number(part.value);
                        utc ? date.setUTCMinutes(value) : date.setMinutes(value);
                        break;
                    }
                case "second":
                    {
                        const value = Number(part.value);
                        utc ? date.setUTCSeconds(value) : date.setSeconds(value);
                        break;
                    }
                case "fractionalSecond":
                    {
                        const value = Number(part.value);
                        utc ? date.setUTCMilliseconds(value) : date.setMilliseconds(value);
                        break;
                    }
            }
        }
        return date;
    }
    parse(string) {
        const parts = this.parseToParts(string);
        const sortParts = this.sortDateTimeFormatPart(parts);
        return this.partsToDate(sortParts);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5OC4wL2RhdGV0aW1lL19jb21tb24udHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMyB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuZXhwb3J0IHR5cGUgVG9rZW4gPSB7XG4gIHR5cGU6IHN0cmluZztcbiAgdmFsdWU6IHN0cmluZyB8IG51bWJlcjtcbiAgaW5kZXg6IG51bWJlcjtcbiAgW2tleTogc3RyaW5nXTogdW5rbm93bjtcbn07XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmVjZWl2ZXJSZXN1bHQge1xuICBbbmFtZTogc3RyaW5nXTogc3RyaW5nIHwgbnVtYmVyIHwgdW5rbm93bjtcbn1cbmV4cG9ydCB0eXBlIENhbGxiYWNrUmVzdWx0ID0ge1xuICB0eXBlOiBzdHJpbmc7XG4gIHZhbHVlOiBzdHJpbmcgfCBudW1iZXI7XG4gIFtrZXk6IHN0cmluZ106IHVua25vd247XG59O1xudHlwZSBDYWxsYmFja0Z1bmN0aW9uID0gKHZhbHVlOiB1bmtub3duKSA9PiBDYWxsYmFja1Jlc3VsdDtcblxuZXhwb3J0IHR5cGUgVGVzdFJlc3VsdCA9IHsgdmFsdWU6IHVua25vd247IGxlbmd0aDogbnVtYmVyIH0gfCB1bmRlZmluZWQ7XG5leHBvcnQgdHlwZSBUZXN0RnVuY3Rpb24gPSAoXG4gIHN0cmluZzogc3RyaW5nLFxuKSA9PiBUZXN0UmVzdWx0IHwgdW5kZWZpbmVkO1xuXG5leHBvcnQgaW50ZXJmYWNlIFJ1bGUge1xuICB0ZXN0OiBUZXN0RnVuY3Rpb247XG4gIGZuOiBDYWxsYmFja0Z1bmN0aW9uO1xufVxuXG5leHBvcnQgY2xhc3MgVG9rZW5pemVyIHtcbiAgcnVsZXM6IFJ1bGVbXTtcblxuICBjb25zdHJ1Y3RvcihydWxlczogUnVsZVtdID0gW10pIHtcbiAgICB0aGlzLnJ1bGVzID0gcnVsZXM7XG4gIH1cblxuICBhZGRSdWxlKHRlc3Q6IFRlc3RGdW5jdGlvbiwgZm46IENhbGxiYWNrRnVuY3Rpb24pOiBUb2tlbml6ZXIge1xuICAgIHRoaXMucnVsZXMucHVzaCh7IHRlc3QsIGZuIH0pO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgdG9rZW5pemUoXG4gICAgc3RyaW5nOiBzdHJpbmcsXG4gICAgcmVjZWl2ZXIgPSAodG9rZW46IFRva2VuKTogUmVjZWl2ZXJSZXN1bHQgPT4gdG9rZW4sXG4gICk6IFJlY2VpdmVyUmVzdWx0W10ge1xuICAgIGZ1bmN0aW9uKiBnZW5lcmF0b3IocnVsZXM6IFJ1bGVbXSk6IEl0ZXJhYmxlSXRlcmF0b3I8UmVjZWl2ZXJSZXN1bHQ+IHtcbiAgICAgIGxldCBpbmRleCA9IDA7XG4gICAgICBmb3IgKGNvbnN0IHJ1bGUgb2YgcnVsZXMpIHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gcnVsZS50ZXN0KHN0cmluZyk7XG4gICAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgICBjb25zdCB7IHZhbHVlLCBsZW5ndGggfSA9IHJlc3VsdDtcbiAgICAgICAgICBpbmRleCArPSBsZW5ndGg7XG4gICAgICAgICAgc3RyaW5nID0gc3RyaW5nLnNsaWNlKGxlbmd0aCk7XG4gICAgICAgICAgY29uc3QgdG9rZW4gPSB7IC4uLnJ1bGUuZm4odmFsdWUpLCBpbmRleCB9O1xuICAgICAgICAgIHlpZWxkIHJlY2VpdmVyKHRva2VuKTtcbiAgICAgICAgICB5aWVsZCogZ2VuZXJhdG9yKHJ1bGVzKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCB0b2tlbkdlbmVyYXRvciA9IGdlbmVyYXRvcih0aGlzLnJ1bGVzKTtcblxuICAgIGNvbnN0IHRva2VuczogUmVjZWl2ZXJSZXN1bHRbXSA9IFtdO1xuXG4gICAgZm9yIChjb25zdCB0b2tlbiBvZiB0b2tlbkdlbmVyYXRvcikge1xuICAgICAgdG9rZW5zLnB1c2godG9rZW4pO1xuICAgIH1cblxuICAgIGlmIChzdHJpbmcubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGBwYXJzZXIgZXJyb3I6IHN0cmluZyBub3QgZnVsbHkgcGFyc2VkISAke3N0cmluZy5zbGljZSgwLCAyNSl9YCxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRva2VucztcbiAgfVxufVxuXG5mdW5jdGlvbiBkaWdpdHModmFsdWU6IHN0cmluZyB8IG51bWJlciwgY291bnQgPSAyKTogc3RyaW5nIHtcbiAgcmV0dXJuIFN0cmluZyh2YWx1ZSkucGFkU3RhcnQoY291bnQsIFwiMFwiKTtcbn1cblxuLy8gYXMgZGVjbGFyZWQgYXMgaW4gbmFtZXNwYWNlIEludGxcbnR5cGUgRGF0ZVRpbWVGb3JtYXRQYXJ0VHlwZXMgPVxuICB8IFwiZGF5XCJcbiAgfCBcImRheVBlcmlvZFwiXG4gIC8vIHwgXCJlcmFcIlxuICB8IFwiaG91clwiXG4gIHwgXCJsaXRlcmFsXCJcbiAgfCBcIm1pbnV0ZVwiXG4gIHwgXCJtb250aFwiXG4gIHwgXCJzZWNvbmRcIlxuICB8IFwidGltZVpvbmVOYW1lXCJcbiAgLy8gfCBcIndlZWtkYXlcIlxuICB8IFwieWVhclwiXG4gIHwgXCJmcmFjdGlvbmFsU2Vjb25kXCI7XG5cbmludGVyZmFjZSBEYXRlVGltZUZvcm1hdFBhcnQge1xuICB0eXBlOiBEYXRlVGltZUZvcm1hdFBhcnRUeXBlcztcbiAgdmFsdWU6IHN0cmluZztcbn1cblxudHlwZSBUaW1lWm9uZSA9IFwiVVRDXCI7XG5cbmludGVyZmFjZSBPcHRpb25zIHtcbiAgdGltZVpvbmU/OiBUaW1lWm9uZTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlTGl0ZXJhbFRlc3RGdW5jdGlvbih2YWx1ZTogc3RyaW5nKTogVGVzdEZ1bmN0aW9uIHtcbiAgcmV0dXJuIChzdHJpbmc6IHN0cmluZyk6IFRlc3RSZXN1bHQgPT4ge1xuICAgIHJldHVybiBzdHJpbmcuc3RhcnRzV2l0aCh2YWx1ZSlcbiAgICAgID8geyB2YWx1ZSwgbGVuZ3RoOiB2YWx1ZS5sZW5ndGggfVxuICAgICAgOiB1bmRlZmluZWQ7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZU1hdGNoVGVzdEZ1bmN0aW9uKG1hdGNoOiBSZWdFeHApOiBUZXN0RnVuY3Rpb24ge1xuICByZXR1cm4gKHN0cmluZzogc3RyaW5nKTogVGVzdFJlc3VsdCA9PiB7XG4gICAgY29uc3QgcmVzdWx0ID0gbWF0Y2guZXhlYyhzdHJpbmcpO1xuICAgIGlmIChyZXN1bHQpIHJldHVybiB7IHZhbHVlOiByZXN1bHQsIGxlbmd0aDogcmVzdWx0WzBdLmxlbmd0aCB9O1xuICB9O1xufVxuXG4vLyBhY2NvcmRpbmcgdG8gdW5pY29kZSBzeW1ib2xzIChodHRwOi8vd3d3LnVuaWNvZGUub3JnL3JlcG9ydHMvdHIzNS90cjM1LWRhdGVzLmh0bWwjRGF0ZV9GaWVsZF9TeW1ib2xfVGFibGUpXG5jb25zdCBkZWZhdWx0UnVsZXMgPSBbXG4gIHtcbiAgICB0ZXN0OiBjcmVhdGVMaXRlcmFsVGVzdEZ1bmN0aW9uKFwieXl5eVwiKSxcbiAgICBmbjogKCk6IENhbGxiYWNrUmVzdWx0ID0+ICh7IHR5cGU6IFwieWVhclwiLCB2YWx1ZTogXCJudW1lcmljXCIgfSksXG4gIH0sXG4gIHtcbiAgICB0ZXN0OiBjcmVhdGVMaXRlcmFsVGVzdEZ1bmN0aW9uKFwieXlcIiksXG4gICAgZm46ICgpOiBDYWxsYmFja1Jlc3VsdCA9PiAoeyB0eXBlOiBcInllYXJcIiwgdmFsdWU6IFwiMi1kaWdpdFwiIH0pLFxuICB9LFxuXG4gIHtcbiAgICB0ZXN0OiBjcmVhdGVMaXRlcmFsVGVzdEZ1bmN0aW9uKFwiTU1cIiksXG4gICAgZm46ICgpOiBDYWxsYmFja1Jlc3VsdCA9PiAoeyB0eXBlOiBcIm1vbnRoXCIsIHZhbHVlOiBcIjItZGlnaXRcIiB9KSxcbiAgfSxcbiAge1xuICAgIHRlc3Q6IGNyZWF0ZUxpdGVyYWxUZXN0RnVuY3Rpb24oXCJNXCIpLFxuICAgIGZuOiAoKTogQ2FsbGJhY2tSZXN1bHQgPT4gKHsgdHlwZTogXCJtb250aFwiLCB2YWx1ZTogXCJudW1lcmljXCIgfSksXG4gIH0sXG4gIHtcbiAgICB0ZXN0OiBjcmVhdGVMaXRlcmFsVGVzdEZ1bmN0aW9uKFwiZGRcIiksXG4gICAgZm46ICgpOiBDYWxsYmFja1Jlc3VsdCA9PiAoeyB0eXBlOiBcImRheVwiLCB2YWx1ZTogXCIyLWRpZ2l0XCIgfSksXG4gIH0sXG4gIHtcbiAgICB0ZXN0OiBjcmVhdGVMaXRlcmFsVGVzdEZ1bmN0aW9uKFwiZFwiKSxcbiAgICBmbjogKCk6IENhbGxiYWNrUmVzdWx0ID0+ICh7IHR5cGU6IFwiZGF5XCIsIHZhbHVlOiBcIm51bWVyaWNcIiB9KSxcbiAgfSxcblxuICB7XG4gICAgdGVzdDogY3JlYXRlTGl0ZXJhbFRlc3RGdW5jdGlvbihcIkhIXCIpLFxuICAgIGZuOiAoKTogQ2FsbGJhY2tSZXN1bHQgPT4gKHsgdHlwZTogXCJob3VyXCIsIHZhbHVlOiBcIjItZGlnaXRcIiB9KSxcbiAgfSxcbiAge1xuICAgIHRlc3Q6IGNyZWF0ZUxpdGVyYWxUZXN0RnVuY3Rpb24oXCJIXCIpLFxuICAgIGZuOiAoKTogQ2FsbGJhY2tSZXN1bHQgPT4gKHsgdHlwZTogXCJob3VyXCIsIHZhbHVlOiBcIm51bWVyaWNcIiB9KSxcbiAgfSxcbiAge1xuICAgIHRlc3Q6IGNyZWF0ZUxpdGVyYWxUZXN0RnVuY3Rpb24oXCJoaFwiKSxcbiAgICBmbjogKCk6IENhbGxiYWNrUmVzdWx0ID0+ICh7XG4gICAgICB0eXBlOiBcImhvdXJcIixcbiAgICAgIHZhbHVlOiBcIjItZGlnaXRcIixcbiAgICAgIGhvdXIxMjogdHJ1ZSxcbiAgICB9KSxcbiAgfSxcbiAge1xuICAgIHRlc3Q6IGNyZWF0ZUxpdGVyYWxUZXN0RnVuY3Rpb24oXCJoXCIpLFxuICAgIGZuOiAoKTogQ2FsbGJhY2tSZXN1bHQgPT4gKHtcbiAgICAgIHR5cGU6IFwiaG91clwiLFxuICAgICAgdmFsdWU6IFwibnVtZXJpY1wiLFxuICAgICAgaG91cjEyOiB0cnVlLFxuICAgIH0pLFxuICB9LFxuICB7XG4gICAgdGVzdDogY3JlYXRlTGl0ZXJhbFRlc3RGdW5jdGlvbihcIm1tXCIpLFxuICAgIGZuOiAoKTogQ2FsbGJhY2tSZXN1bHQgPT4gKHsgdHlwZTogXCJtaW51dGVcIiwgdmFsdWU6IFwiMi1kaWdpdFwiIH0pLFxuICB9LFxuICB7XG4gICAgdGVzdDogY3JlYXRlTGl0ZXJhbFRlc3RGdW5jdGlvbihcIm1cIiksXG4gICAgZm46ICgpOiBDYWxsYmFja1Jlc3VsdCA9PiAoeyB0eXBlOiBcIm1pbnV0ZVwiLCB2YWx1ZTogXCJudW1lcmljXCIgfSksXG4gIH0sXG4gIHtcbiAgICB0ZXN0OiBjcmVhdGVMaXRlcmFsVGVzdEZ1bmN0aW9uKFwic3NcIiksXG4gICAgZm46ICgpOiBDYWxsYmFja1Jlc3VsdCA9PiAoeyB0eXBlOiBcInNlY29uZFwiLCB2YWx1ZTogXCIyLWRpZ2l0XCIgfSksXG4gIH0sXG4gIHtcbiAgICB0ZXN0OiBjcmVhdGVMaXRlcmFsVGVzdEZ1bmN0aW9uKFwic1wiKSxcbiAgICBmbjogKCk6IENhbGxiYWNrUmVzdWx0ID0+ICh7IHR5cGU6IFwic2Vjb25kXCIsIHZhbHVlOiBcIm51bWVyaWNcIiB9KSxcbiAgfSxcbiAge1xuICAgIHRlc3Q6IGNyZWF0ZUxpdGVyYWxUZXN0RnVuY3Rpb24oXCJTU1NcIiksXG4gICAgZm46ICgpOiBDYWxsYmFja1Jlc3VsdCA9PiAoeyB0eXBlOiBcImZyYWN0aW9uYWxTZWNvbmRcIiwgdmFsdWU6IDMgfSksXG4gIH0sXG4gIHtcbiAgICB0ZXN0OiBjcmVhdGVMaXRlcmFsVGVzdEZ1bmN0aW9uKFwiU1NcIiksXG4gICAgZm46ICgpOiBDYWxsYmFja1Jlc3VsdCA9PiAoeyB0eXBlOiBcImZyYWN0aW9uYWxTZWNvbmRcIiwgdmFsdWU6IDIgfSksXG4gIH0sXG4gIHtcbiAgICB0ZXN0OiBjcmVhdGVMaXRlcmFsVGVzdEZ1bmN0aW9uKFwiU1wiKSxcbiAgICBmbjogKCk6IENhbGxiYWNrUmVzdWx0ID0+ICh7IHR5cGU6IFwiZnJhY3Rpb25hbFNlY29uZFwiLCB2YWx1ZTogMSB9KSxcbiAgfSxcblxuICB7XG4gICAgdGVzdDogY3JlYXRlTGl0ZXJhbFRlc3RGdW5jdGlvbihcImFcIiksXG4gICAgZm46ICh2YWx1ZTogdW5rbm93bik6IENhbGxiYWNrUmVzdWx0ID0+ICh7XG4gICAgICB0eXBlOiBcImRheVBlcmlvZFwiLFxuICAgICAgdmFsdWU6IHZhbHVlIGFzIHN0cmluZyxcbiAgICB9KSxcbiAgfSxcblxuICAvLyBxdW90ZWQgbGl0ZXJhbFxuICB7XG4gICAgdGVzdDogY3JlYXRlTWF0Y2hUZXN0RnVuY3Rpb24oL14oJykoPzx2YWx1ZT5cXFxcLnxbXlxcJ10qKVxcMS8pLFxuICAgIGZuOiAobWF0Y2g6IHVua25vd24pOiBDYWxsYmFja1Jlc3VsdCA9PiAoe1xuICAgICAgdHlwZTogXCJsaXRlcmFsXCIsXG4gICAgICB2YWx1ZTogKG1hdGNoIGFzIFJlZ0V4cEV4ZWNBcnJheSkuZ3JvdXBzIS52YWx1ZSBhcyBzdHJpbmcsXG4gICAgfSksXG4gIH0sXG4gIC8vIGxpdGVyYWxcbiAge1xuICAgIHRlc3Q6IGNyZWF0ZU1hdGNoVGVzdEZ1bmN0aW9uKC9eLis/XFxzKi8pLFxuICAgIGZuOiAobWF0Y2g6IHVua25vd24pOiBDYWxsYmFja1Jlc3VsdCA9PiAoe1xuICAgICAgdHlwZTogXCJsaXRlcmFsXCIsXG4gICAgICB2YWx1ZTogKG1hdGNoIGFzIFJlZ0V4cEV4ZWNBcnJheSlbMF0sXG4gICAgfSksXG4gIH0sXG5dO1xuXG50eXBlIEZvcm1hdFBhcnQgPSB7XG4gIHR5cGU6IERhdGVUaW1lRm9ybWF0UGFydFR5cGVzO1xuICB2YWx1ZTogc3RyaW5nIHwgbnVtYmVyO1xuICBob3VyMTI/OiBib29sZWFuO1xufTtcbnR5cGUgRm9ybWF0ID0gRm9ybWF0UGFydFtdO1xuXG5leHBvcnQgY2xhc3MgRGF0ZVRpbWVGb3JtYXR0ZXIge1xuICAjZm9ybWF0OiBGb3JtYXQ7XG5cbiAgY29uc3RydWN0b3IoZm9ybWF0U3RyaW5nOiBzdHJpbmcsIHJ1bGVzOiBSdWxlW10gPSBkZWZhdWx0UnVsZXMpIHtcbiAgICBjb25zdCB0b2tlbml6ZXIgPSBuZXcgVG9rZW5pemVyKHJ1bGVzKTtcbiAgICB0aGlzLiNmb3JtYXQgPSB0b2tlbml6ZXIudG9rZW5pemUoXG4gICAgICBmb3JtYXRTdHJpbmcsXG4gICAgICAoeyB0eXBlLCB2YWx1ZSwgaG91cjEyIH0pID0+IHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0ge1xuICAgICAgICAgIHR5cGUsXG4gICAgICAgICAgdmFsdWUsXG4gICAgICAgIH0gYXMgdW5rbm93biBhcyBSZWNlaXZlclJlc3VsdDtcbiAgICAgICAgaWYgKGhvdXIxMikgcmVzdWx0LmhvdXIxMiA9IGhvdXIxMiBhcyBib29sZWFuO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfSxcbiAgICApIGFzIEZvcm1hdDtcbiAgfVxuXG4gIGZvcm1hdChkYXRlOiBEYXRlLCBvcHRpb25zOiBPcHRpb25zID0ge30pOiBzdHJpbmcge1xuICAgIGxldCBzdHJpbmcgPSBcIlwiO1xuXG4gICAgY29uc3QgdXRjID0gb3B0aW9ucy50aW1lWm9uZSA9PT0gXCJVVENcIjtcblxuICAgIGZvciAoY29uc3QgdG9rZW4gb2YgdGhpcy4jZm9ybWF0KSB7XG4gICAgICBjb25zdCB0eXBlID0gdG9rZW4udHlwZTtcblxuICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgIGNhc2UgXCJ5ZWFyXCI6IHtcbiAgICAgICAgICBjb25zdCB2YWx1ZSA9IHV0YyA/IGRhdGUuZ2V0VVRDRnVsbFllYXIoKSA6IGRhdGUuZ2V0RnVsbFllYXIoKTtcbiAgICAgICAgICBzd2l0Y2ggKHRva2VuLnZhbHVlKSB7XG4gICAgICAgICAgICBjYXNlIFwibnVtZXJpY1wiOiB7XG4gICAgICAgICAgICAgIHN0cmluZyArPSB2YWx1ZTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIFwiMi1kaWdpdFwiOiB7XG4gICAgICAgICAgICAgIHN0cmluZyArPSBkaWdpdHModmFsdWUsIDIpLnNsaWNlKC0yKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcbiAgICAgICAgICAgICAgICBgRm9ybWF0dGVyRXJyb3I6IHZhbHVlIFwiJHt0b2tlbi52YWx1ZX1cIiBpcyBub3Qgc3VwcG9ydGVkYCxcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcIm1vbnRoXCI6IHtcbiAgICAgICAgICBjb25zdCB2YWx1ZSA9ICh1dGMgPyBkYXRlLmdldFVUQ01vbnRoKCkgOiBkYXRlLmdldE1vbnRoKCkpICsgMTtcbiAgICAgICAgICBzd2l0Y2ggKHRva2VuLnZhbHVlKSB7XG4gICAgICAgICAgICBjYXNlIFwibnVtZXJpY1wiOiB7XG4gICAgICAgICAgICAgIHN0cmluZyArPSB2YWx1ZTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIFwiMi1kaWdpdFwiOiB7XG4gICAgICAgICAgICAgIHN0cmluZyArPSBkaWdpdHModmFsdWUsIDIpO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgIHRocm93IEVycm9yKFxuICAgICAgICAgICAgICAgIGBGb3JtYXR0ZXJFcnJvcjogdmFsdWUgXCIke3Rva2VuLnZhbHVlfVwiIGlzIG5vdCBzdXBwb3J0ZWRgLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiZGF5XCI6IHtcbiAgICAgICAgICBjb25zdCB2YWx1ZSA9IHV0YyA/IGRhdGUuZ2V0VVRDRGF0ZSgpIDogZGF0ZS5nZXREYXRlKCk7XG4gICAgICAgICAgc3dpdGNoICh0b2tlbi52YWx1ZSkge1xuICAgICAgICAgICAgY2FzZSBcIm51bWVyaWNcIjoge1xuICAgICAgICAgICAgICBzdHJpbmcgKz0gdmFsdWU7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBcIjItZGlnaXRcIjoge1xuICAgICAgICAgICAgICBzdHJpbmcgKz0gZGlnaXRzKHZhbHVlLCAyKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcbiAgICAgICAgICAgICAgICBgRm9ybWF0dGVyRXJyb3I6IHZhbHVlIFwiJHt0b2tlbi52YWx1ZX1cIiBpcyBub3Qgc3VwcG9ydGVkYCxcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImhvdXJcIjoge1xuICAgICAgICAgIGxldCB2YWx1ZSA9IHV0YyA/IGRhdGUuZ2V0VVRDSG91cnMoKSA6IGRhdGUuZ2V0SG91cnMoKTtcbiAgICAgICAgICB2YWx1ZSAtPSB0b2tlbi5ob3VyMTIgJiYgZGF0ZS5nZXRIb3VycygpID4gMTIgPyAxMiA6IDA7XG4gICAgICAgICAgc3dpdGNoICh0b2tlbi52YWx1ZSkge1xuICAgICAgICAgICAgY2FzZSBcIm51bWVyaWNcIjoge1xuICAgICAgICAgICAgICBzdHJpbmcgKz0gdmFsdWU7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBcIjItZGlnaXRcIjoge1xuICAgICAgICAgICAgICBzdHJpbmcgKz0gZGlnaXRzKHZhbHVlLCAyKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcbiAgICAgICAgICAgICAgICBgRm9ybWF0dGVyRXJyb3I6IHZhbHVlIFwiJHt0b2tlbi52YWx1ZX1cIiBpcyBub3Qgc3VwcG9ydGVkYCxcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcIm1pbnV0ZVwiOiB7XG4gICAgICAgICAgY29uc3QgdmFsdWUgPSB1dGMgPyBkYXRlLmdldFVUQ01pbnV0ZXMoKSA6IGRhdGUuZ2V0TWludXRlcygpO1xuICAgICAgICAgIHN3aXRjaCAodG9rZW4udmFsdWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJudW1lcmljXCI6IHtcbiAgICAgICAgICAgICAgc3RyaW5nICs9IHZhbHVlO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgXCIyLWRpZ2l0XCI6IHtcbiAgICAgICAgICAgICAgc3RyaW5nICs9IGRpZ2l0cyh2YWx1ZSwgMik7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXG4gICAgICAgICAgICAgICAgYEZvcm1hdHRlckVycm9yOiB2YWx1ZSBcIiR7dG9rZW4udmFsdWV9XCIgaXMgbm90IHN1cHBvcnRlZGAsXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJzZWNvbmRcIjoge1xuICAgICAgICAgIGNvbnN0IHZhbHVlID0gdXRjID8gZGF0ZS5nZXRVVENTZWNvbmRzKCkgOiBkYXRlLmdldFNlY29uZHMoKTtcbiAgICAgICAgICBzd2l0Y2ggKHRva2VuLnZhbHVlKSB7XG4gICAgICAgICAgICBjYXNlIFwibnVtZXJpY1wiOiB7XG4gICAgICAgICAgICAgIHN0cmluZyArPSB2YWx1ZTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIFwiMi1kaWdpdFwiOiB7XG4gICAgICAgICAgICAgIHN0cmluZyArPSBkaWdpdHModmFsdWUsIDIpO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgIHRocm93IEVycm9yKFxuICAgICAgICAgICAgICAgIGBGb3JtYXR0ZXJFcnJvcjogdmFsdWUgXCIke3Rva2VuLnZhbHVlfVwiIGlzIG5vdCBzdXBwb3J0ZWRgLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiZnJhY3Rpb25hbFNlY29uZFwiOiB7XG4gICAgICAgICAgY29uc3QgdmFsdWUgPSB1dGNcbiAgICAgICAgICAgID8gZGF0ZS5nZXRVVENNaWxsaXNlY29uZHMoKVxuICAgICAgICAgICAgOiBkYXRlLmdldE1pbGxpc2Vjb25kcygpO1xuICAgICAgICAgIHN0cmluZyArPSBkaWdpdHModmFsdWUsIE51bWJlcih0b2tlbi52YWx1ZSkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIC8vIEZJWE1FKGJhcnRsb21pZWp1KVxuICAgICAgICBjYXNlIFwidGltZVpvbmVOYW1lXCI6IHtcbiAgICAgICAgICAvLyBzdHJpbmcgKz0gdXRjID8gXCJaXCIgOiB0b2tlbi52YWx1ZVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJkYXlQZXJpb2RcIjoge1xuICAgICAgICAgIHN0cmluZyArPSB0b2tlbi52YWx1ZSA/IChkYXRlLmdldEhvdXJzKCkgPj0gMTIgPyBcIlBNXCIgOiBcIkFNXCIpIDogXCJcIjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwibGl0ZXJhbFwiOiB7XG4gICAgICAgICAgc3RyaW5nICs9IHRva2VuLnZhbHVlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICB0aHJvdyBFcnJvcihgRm9ybWF0dGVyRXJyb3I6IHsgJHt0b2tlbi50eXBlfSAke3Rva2VuLnZhbHVlfSB9YCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHN0cmluZztcbiAgfVxuXG4gIHBhcnNlVG9QYXJ0cyhzdHJpbmc6IHN0cmluZyk6IERhdGVUaW1lRm9ybWF0UGFydFtdIHtcbiAgICBjb25zdCBwYXJ0czogRGF0ZVRpbWVGb3JtYXRQYXJ0W10gPSBbXTtcblxuICAgIGZvciAoY29uc3QgdG9rZW4gb2YgdGhpcy4jZm9ybWF0KSB7XG4gICAgICBjb25zdCB0eXBlID0gdG9rZW4udHlwZTtcblxuICAgICAgbGV0IHZhbHVlID0gXCJcIjtcbiAgICAgIHN3aXRjaCAodG9rZW4udHlwZSkge1xuICAgICAgICBjYXNlIFwieWVhclwiOiB7XG4gICAgICAgICAgc3dpdGNoICh0b2tlbi52YWx1ZSkge1xuICAgICAgICAgICAgY2FzZSBcIm51bWVyaWNcIjoge1xuICAgICAgICAgICAgICB2YWx1ZSA9IC9eXFxkezEsNH0vLmV4ZWMoc3RyaW5nKT8uWzBdIGFzIHN0cmluZztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIFwiMi1kaWdpdFwiOiB7XG4gICAgICAgICAgICAgIHZhbHVlID0gL15cXGR7MSwyfS8uZXhlYyhzdHJpbmcpPy5bMF0gYXMgc3RyaW5nO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcIm1vbnRoXCI6IHtcbiAgICAgICAgICBzd2l0Y2ggKHRva2VuLnZhbHVlKSB7XG4gICAgICAgICAgICBjYXNlIFwibnVtZXJpY1wiOiB7XG4gICAgICAgICAgICAgIHZhbHVlID0gL15cXGR7MSwyfS8uZXhlYyhzdHJpbmcpPy5bMF0gYXMgc3RyaW5nO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgXCIyLWRpZ2l0XCI6IHtcbiAgICAgICAgICAgICAgdmFsdWUgPSAvXlxcZHsyfS8uZXhlYyhzdHJpbmcpPy5bMF0gYXMgc3RyaW5nO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgXCJuYXJyb3dcIjoge1xuICAgICAgICAgICAgICB2YWx1ZSA9IC9eW2EtekEtWl0rLy5leGVjKHN0cmluZyk/LlswXSBhcyBzdHJpbmc7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBcInNob3J0XCI6IHtcbiAgICAgICAgICAgICAgdmFsdWUgPSAvXlthLXpBLVpdKy8uZXhlYyhzdHJpbmcpPy5bMF0gYXMgc3RyaW5nO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgXCJsb25nXCI6IHtcbiAgICAgICAgICAgICAgdmFsdWUgPSAvXlthLXpBLVpdKy8uZXhlYyhzdHJpbmcpPy5bMF0gYXMgc3RyaW5nO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgIHRocm93IEVycm9yKFxuICAgICAgICAgICAgICAgIGBQYXJzZXJFcnJvcjogdmFsdWUgXCIke3Rva2VuLnZhbHVlfVwiIGlzIG5vdCBzdXBwb3J0ZWRgLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiZGF5XCI6IHtcbiAgICAgICAgICBzd2l0Y2ggKHRva2VuLnZhbHVlKSB7XG4gICAgICAgICAgICBjYXNlIFwibnVtZXJpY1wiOiB7XG4gICAgICAgICAgICAgIHZhbHVlID0gL15cXGR7MSwyfS8uZXhlYyhzdHJpbmcpPy5bMF0gYXMgc3RyaW5nO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgXCIyLWRpZ2l0XCI6IHtcbiAgICAgICAgICAgICAgdmFsdWUgPSAvXlxcZHsyfS8uZXhlYyhzdHJpbmcpPy5bMF0gYXMgc3RyaW5nO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgIHRocm93IEVycm9yKFxuICAgICAgICAgICAgICAgIGBQYXJzZXJFcnJvcjogdmFsdWUgXCIke3Rva2VuLnZhbHVlfVwiIGlzIG5vdCBzdXBwb3J0ZWRgLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiaG91clwiOiB7XG4gICAgICAgICAgc3dpdGNoICh0b2tlbi52YWx1ZSkge1xuICAgICAgICAgICAgY2FzZSBcIm51bWVyaWNcIjoge1xuICAgICAgICAgICAgICB2YWx1ZSA9IC9eXFxkezEsMn0vLmV4ZWMoc3RyaW5nKT8uWzBdIGFzIHN0cmluZztcbiAgICAgICAgICAgICAgaWYgKHRva2VuLmhvdXIxMiAmJiBwYXJzZUludCh2YWx1ZSkgPiAxMikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgICAgICAgICAgICBgVHJ5aW5nIHRvIHBhcnNlIGhvdXIgZ3JlYXRlciB0aGFuIDEyLiBVc2UgJ0gnIGluc3RlYWQgb2YgJ2gnLmAsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgXCIyLWRpZ2l0XCI6IHtcbiAgICAgICAgICAgICAgdmFsdWUgPSAvXlxcZHsyfS8uZXhlYyhzdHJpbmcpPy5bMF0gYXMgc3RyaW5nO1xuICAgICAgICAgICAgICBpZiAodG9rZW4uaG91cjEyICYmIHBhcnNlSW50KHZhbHVlKSA+IDEyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcbiAgICAgICAgICAgICAgICAgIGBUcnlpbmcgdG8gcGFyc2UgaG91ciBncmVhdGVyIHRoYW4gMTIuIFVzZSAnSEgnIGluc3RlYWQgb2YgJ2hoJy5gLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcbiAgICAgICAgICAgICAgICBgUGFyc2VyRXJyb3I6IHZhbHVlIFwiJHt0b2tlbi52YWx1ZX1cIiBpcyBub3Qgc3VwcG9ydGVkYCxcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcIm1pbnV0ZVwiOiB7XG4gICAgICAgICAgc3dpdGNoICh0b2tlbi52YWx1ZSkge1xuICAgICAgICAgICAgY2FzZSBcIm51bWVyaWNcIjoge1xuICAgICAgICAgICAgICB2YWx1ZSA9IC9eXFxkezEsMn0vLmV4ZWMoc3RyaW5nKT8uWzBdIGFzIHN0cmluZztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIFwiMi1kaWdpdFwiOiB7XG4gICAgICAgICAgICAgIHZhbHVlID0gL15cXGR7Mn0vLmV4ZWMoc3RyaW5nKT8uWzBdIGFzIHN0cmluZztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcbiAgICAgICAgICAgICAgICBgUGFyc2VyRXJyb3I6IHZhbHVlIFwiJHt0b2tlbi52YWx1ZX1cIiBpcyBub3Qgc3VwcG9ydGVkYCxcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcInNlY29uZFwiOiB7XG4gICAgICAgICAgc3dpdGNoICh0b2tlbi52YWx1ZSkge1xuICAgICAgICAgICAgY2FzZSBcIm51bWVyaWNcIjoge1xuICAgICAgICAgICAgICB2YWx1ZSA9IC9eXFxkezEsMn0vLmV4ZWMoc3RyaW5nKT8uWzBdIGFzIHN0cmluZztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIFwiMi1kaWdpdFwiOiB7XG4gICAgICAgICAgICAgIHZhbHVlID0gL15cXGR7Mn0vLmV4ZWMoc3RyaW5nKT8uWzBdIGFzIHN0cmluZztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcbiAgICAgICAgICAgICAgICBgUGFyc2VyRXJyb3I6IHZhbHVlIFwiJHt0b2tlbi52YWx1ZX1cIiBpcyBub3Qgc3VwcG9ydGVkYCxcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImZyYWN0aW9uYWxTZWNvbmRcIjoge1xuICAgICAgICAgIHZhbHVlID0gbmV3IFJlZ0V4cChgXlxcXFxkeyR7dG9rZW4udmFsdWV9fWApLmV4ZWMoc3RyaW5nKVxuICAgICAgICAgICAgPy5bMF0gYXMgc3RyaW5nO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJ0aW1lWm9uZU5hbWVcIjoge1xuICAgICAgICAgIHZhbHVlID0gdG9rZW4udmFsdWUgYXMgc3RyaW5nO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJkYXlQZXJpb2RcIjoge1xuICAgICAgICAgIHZhbHVlID0gL14oQXxQKU0vLmV4ZWMoc3RyaW5nKT8uWzBdIGFzIHN0cmluZztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwibGl0ZXJhbFwiOiB7XG4gICAgICAgICAgaWYgKCFzdHJpbmcuc3RhcnRzV2l0aCh0b2tlbi52YWx1ZSBhcyBzdHJpbmcpKSB7XG4gICAgICAgICAgICB0aHJvdyBFcnJvcihcbiAgICAgICAgICAgICAgYExpdGVyYWwgXCIke3Rva2VuLnZhbHVlfVwiIG5vdCBmb3VuZCBcIiR7c3RyaW5nLnNsaWNlKDAsIDI1KX1cImAsXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YWx1ZSA9IHRva2VuLnZhbHVlIGFzIHN0cmluZztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgdGhyb3cgRXJyb3IoYCR7dG9rZW4udHlwZX0gJHt0b2tlbi52YWx1ZX1gKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICB0aHJvdyBFcnJvcihcbiAgICAgICAgICBgdmFsdWUgbm90IHZhbGlkIGZvciB0b2tlbiB7ICR7dHlwZX0gJHt2YWx1ZX0gfSAke1xuICAgICAgICAgICAgc3RyaW5nLnNsaWNlKFxuICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAyNSxcbiAgICAgICAgICAgIClcbiAgICAgICAgICB9YCxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIHBhcnRzLnB1c2goeyB0eXBlLCB2YWx1ZSB9KTtcblxuICAgICAgc3RyaW5nID0gc3RyaW5nLnNsaWNlKHZhbHVlLmxlbmd0aCk7XG4gICAgfVxuXG4gICAgaWYgKHN0cmluZy5sZW5ndGgpIHtcbiAgICAgIHRocm93IEVycm9yKFxuICAgICAgICBgZGF0ZXRpbWUgc3RyaW5nIHdhcyBub3QgZnVsbHkgcGFyc2VkISAke3N0cmluZy5zbGljZSgwLCAyNSl9YCxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHBhcnRzO1xuICB9XG5cbiAgLyoqIHNvcnQgJiBmaWx0ZXIgZGF0ZVRpbWVGb3JtYXRQYXJ0ICovXG4gIHNvcnREYXRlVGltZUZvcm1hdFBhcnQocGFydHM6IERhdGVUaW1lRm9ybWF0UGFydFtdKTogRGF0ZVRpbWVGb3JtYXRQYXJ0W10ge1xuICAgIGxldCByZXN1bHQ6IERhdGVUaW1lRm9ybWF0UGFydFtdID0gW107XG4gICAgY29uc3QgdHlwZUFycmF5ID0gW1xuICAgICAgXCJ5ZWFyXCIsXG4gICAgICBcIm1vbnRoXCIsXG4gICAgICBcImRheVwiLFxuICAgICAgXCJob3VyXCIsXG4gICAgICBcIm1pbnV0ZVwiLFxuICAgICAgXCJzZWNvbmRcIixcbiAgICAgIFwiZnJhY3Rpb25hbFNlY29uZFwiLFxuICAgIF07XG4gICAgZm9yIChjb25zdCB0eXBlIG9mIHR5cGVBcnJheSkge1xuICAgICAgY29uc3QgY3VycmVudCA9IHBhcnRzLmZpbmRJbmRleCgoZWwpID0+IGVsLnR5cGUgPT09IHR5cGUpO1xuICAgICAgaWYgKGN1cnJlbnQgIT09IC0xKSB7XG4gICAgICAgIHJlc3VsdCA9IHJlc3VsdC5jb25jYXQocGFydHMuc3BsaWNlKGN1cnJlbnQsIDEpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmVzdWx0ID0gcmVzdWx0LmNvbmNhdChwYXJ0cyk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHBhcnRzVG9EYXRlKHBhcnRzOiBEYXRlVGltZUZvcm1hdFBhcnRbXSk6IERhdGUge1xuICAgIGNvbnN0IGRhdGUgPSBuZXcgRGF0ZSgpO1xuICAgIGNvbnN0IHV0YyA9IHBhcnRzLmZpbmQoXG4gICAgICAocGFydCkgPT4gcGFydC50eXBlID09PSBcInRpbWVab25lTmFtZVwiICYmIHBhcnQudmFsdWUgPT09IFwiVVRDXCIsXG4gICAgKTtcblxuICAgIGNvbnN0IGRheVBhcnQgPSBwYXJ0cy5maW5kKChwYXJ0KSA9PiBwYXJ0LnR5cGUgPT09IFwiZGF5XCIpO1xuXG4gICAgdXRjID8gZGF0ZS5zZXRVVENIb3VycygwLCAwLCAwLCAwKSA6IGRhdGUuc2V0SG91cnMoMCwgMCwgMCwgMCk7XG4gICAgZm9yIChjb25zdCBwYXJ0IG9mIHBhcnRzKSB7XG4gICAgICBzd2l0Y2ggKHBhcnQudHlwZSkge1xuICAgICAgICBjYXNlIFwieWVhclwiOiB7XG4gICAgICAgICAgY29uc3QgdmFsdWUgPSBOdW1iZXIocGFydC52YWx1ZS5wYWRTdGFydCg0LCBcIjIwXCIpKTtcbiAgICAgICAgICB1dGMgPyBkYXRlLnNldFVUQ0Z1bGxZZWFyKHZhbHVlKSA6IGRhdGUuc2V0RnVsbFllYXIodmFsdWUpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJtb250aFwiOiB7XG4gICAgICAgICAgY29uc3QgdmFsdWUgPSBOdW1iZXIocGFydC52YWx1ZSkgLSAxO1xuICAgICAgICAgIGlmIChkYXlQYXJ0KSB7XG4gICAgICAgICAgICB1dGNcbiAgICAgICAgICAgICAgPyBkYXRlLnNldFVUQ01vbnRoKHZhbHVlLCBOdW1iZXIoZGF5UGFydC52YWx1ZSkpXG4gICAgICAgICAgICAgIDogZGF0ZS5zZXRNb250aCh2YWx1ZSwgTnVtYmVyKGRheVBhcnQudmFsdWUpKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdXRjID8gZGF0ZS5zZXRVVENNb250aCh2YWx1ZSkgOiBkYXRlLnNldE1vbnRoKHZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImRheVwiOiB7XG4gICAgICAgICAgY29uc3QgdmFsdWUgPSBOdW1iZXIocGFydC52YWx1ZSk7XG4gICAgICAgICAgdXRjID8gZGF0ZS5zZXRVVENEYXRlKHZhbHVlKSA6IGRhdGUuc2V0RGF0ZSh2YWx1ZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImhvdXJcIjoge1xuICAgICAgICAgIGxldCB2YWx1ZSA9IE51bWJlcihwYXJ0LnZhbHVlKTtcbiAgICAgICAgICBjb25zdCBkYXlQZXJpb2QgPSBwYXJ0cy5maW5kKFxuICAgICAgICAgICAgKHBhcnQ6IERhdGVUaW1lRm9ybWF0UGFydCkgPT4gcGFydC50eXBlID09PSBcImRheVBlcmlvZFwiLFxuICAgICAgICAgICk7XG4gICAgICAgICAgaWYgKGRheVBlcmlvZD8udmFsdWUgPT09IFwiUE1cIikgdmFsdWUgKz0gMTI7XG4gICAgICAgICAgdXRjID8gZGF0ZS5zZXRVVENIb3Vycyh2YWx1ZSkgOiBkYXRlLnNldEhvdXJzKHZhbHVlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwibWludXRlXCI6IHtcbiAgICAgICAgICBjb25zdCB2YWx1ZSA9IE51bWJlcihwYXJ0LnZhbHVlKTtcbiAgICAgICAgICB1dGMgPyBkYXRlLnNldFVUQ01pbnV0ZXModmFsdWUpIDogZGF0ZS5zZXRNaW51dGVzKHZhbHVlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwic2Vjb25kXCI6IHtcbiAgICAgICAgICBjb25zdCB2YWx1ZSA9IE51bWJlcihwYXJ0LnZhbHVlKTtcbiAgICAgICAgICB1dGMgPyBkYXRlLnNldFVUQ1NlY29uZHModmFsdWUpIDogZGF0ZS5zZXRTZWNvbmRzKHZhbHVlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiZnJhY3Rpb25hbFNlY29uZFwiOiB7XG4gICAgICAgICAgY29uc3QgdmFsdWUgPSBOdW1iZXIocGFydC52YWx1ZSk7XG4gICAgICAgICAgdXRjID8gZGF0ZS5zZXRVVENNaWxsaXNlY29uZHModmFsdWUpIDogZGF0ZS5zZXRNaWxsaXNlY29uZHModmFsdWUpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBkYXRlO1xuICB9XG5cbiAgcGFyc2Uoc3RyaW5nOiBzdHJpbmcpOiBEYXRlIHtcbiAgICBjb25zdCBwYXJ0cyA9IHRoaXMucGFyc2VUb1BhcnRzKHN0cmluZyk7XG4gICAgY29uc3Qgc29ydFBhcnRzID0gdGhpcy5zb3J0RGF0ZVRpbWVGb3JtYXRQYXJ0KHBhcnRzKTtcbiAgICByZXR1cm4gdGhpcy5wYXJ0c1RvRGF0ZShzb3J0UGFydHMpO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFxQztBQTZCckMsT0FBTyxNQUFNO0lBQ1gsTUFBYztJQUVkLFlBQVksUUFBZ0IsRUFBRSxDQUFFO1FBQzlCLElBQUksQ0FBQyxRQUFRO0lBQ2Y7SUFFQSxRQUFRLElBQWtCLEVBQUUsRUFBb0IsRUFBYTtRQUMzRCxJQUFJLENBQUMsTUFBTSxLQUFLO1lBQUU7WUFBTTtRQUFHO1FBQzNCLE9BQU8sSUFBSTtJQUNiO0lBRUEsU0FDRSxNQUFjLEVBQ2QsV0FBVyxDQUFDLFFBQWlDLEtBQUssRUFDaEM7UUFDbEIsVUFBVSxVQUFVLEtBQWE7WUFDL0IsSUFBSSxRQUFRO1lBQ1osS0FBSyxNQUFNLFFBQVEsTUFBTztnQkFDeEIsTUFBTSxTQUFTLEtBQUssS0FBSztnQkFDekIsSUFBSSxRQUFRO29CQUNWLE1BQU0sRUFBRSxNQUFLLEVBQUUsT0FBTSxFQUFFLEdBQUc7b0JBQzFCLFNBQVM7b0JBQ1QsU0FBUyxPQUFPLE1BQU07b0JBQ3RCLE1BQU0sUUFBUTt3QkFBRSxHQUFHLEtBQUssR0FBRyxNQUFNO3dCQUFFO29CQUFNO29CQUN6QyxNQUFNLFNBQVM7b0JBQ2YsT0FBTyxVQUFVO2dCQUNuQjtZQUNGO1FBQ0Y7UUFDQSxNQUFNLGlCQUFpQixVQUFVLElBQUksQ0FBQztRQUV0QyxNQUFNLFNBQTJCLEVBQUU7UUFFbkMsS0FBSyxNQUFNLFNBQVMsZUFBZ0I7WUFDbEMsT0FBTyxLQUFLO1FBQ2Q7UUFFQSxJQUFJLE9BQU8sUUFBUTtZQUNqQixNQUFNLElBQUksTUFDUixDQUFDLHVDQUF1QyxFQUFFLE9BQU8sTUFBTSxHQUFHLElBQUksQ0FBQztRQUVuRTtRQUVBLE9BQU87SUFD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