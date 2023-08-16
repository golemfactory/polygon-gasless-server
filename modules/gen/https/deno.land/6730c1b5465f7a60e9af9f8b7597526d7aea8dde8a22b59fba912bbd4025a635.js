// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { assert } from "../_util/assert.ts";
const { hasOwn  } = Object;
function get(obj, key) {
    if (hasOwn(obj, key)) {
        return obj[key];
    }
}
function getForce(obj, key) {
    const v = get(obj, key);
    assert(v != null);
    return v;
}
function isNumber(x) {
    if (typeof x === "number") return true;
    if (/^0x[0-9a-f]+$/i.test(String(x))) return true;
    return /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(e[-+]?\d+)?$/.test(String(x));
}
function hasKey(obj, keys) {
    let o = obj;
    keys.slice(0, -1).forEach((key)=>{
        o = get(o, key) ?? {};
    });
    const key = keys[keys.length - 1];
    return key in o;
}
/** Take a set of command line arguments, optionally with a set of options, and
 * return an object representing the flags found in the passed arguments.
 *
 * By default any arguments starting with `-` or `--` are considered boolean
 * flags. If the argument name is followed by an equal sign (`=`) it is
 * considered a key-value pair. Any arguments which could not be parsed are
 * available in the `_` property of the returned object.
 *
 * ```ts
 * import { parse } from "./mod.ts";
 * const parsedArgs = parse(Deno.args);
 * ```
 *
 * ```ts
 * import { parse } from "./mod.ts";
 * const parsedArgs = parse(["--foo", "--bar=baz", "--no-qux", "./quux.txt"]);
 * // parsedArgs: { foo: true, bar: "baz", qux: false, _: ["./quux.txt"] }
 * ```
 */ export function parse(args, { "--": doubleDash = false , alias ={} , boolean =false , default: defaults = {} , stopEarly =false , string =[] , unknown =(i)=>i  } = {}) {
    const flags = {
        bools: {},
        strings: {},
        unknownFn: unknown,
        allBools: false
    };
    if (boolean !== undefined) {
        if (typeof boolean === "boolean") {
            flags.allBools = !!boolean;
        } else {
            const booleanArgs = typeof boolean === "string" ? [
                boolean
            ] : boolean;
            for (const key of booleanArgs.filter(Boolean)){
                flags.bools[key] = true;
            }
        }
    }
    const aliases = {};
    if (alias !== undefined) {
        for(const key in alias){
            const val = getForce(alias, key);
            if (typeof val === "string") {
                aliases[key] = [
                    val
                ];
            } else {
                aliases[key] = val;
            }
            for (const alias of getForce(aliases, key)){
                aliases[alias] = [
                    key
                ].concat(aliases[key].filter((y)=>alias !== y));
            }
        }
    }
    if (string !== undefined) {
        const stringArgs = typeof string === "string" ? [
            string
        ] : string;
        for (const key of stringArgs.filter(Boolean)){
            flags.strings[key] = true;
            const alias = get(aliases, key);
            if (alias) {
                for (const al of alias){
                    flags.strings[al] = true;
                }
            }
        }
    }
    const argv = {
        _: []
    };
    function argDefined(key, arg) {
        return flags.allBools && /^--[^=]+$/.test(arg) || get(flags.bools, key) || !!get(flags.strings, key) || !!get(aliases, key);
    }
    function setKey(obj, keys, value) {
        let o = obj;
        keys.slice(0, -1).forEach(function(key) {
            if (get(o, key) === undefined) {
                o[key] = {};
            }
            o = get(o, key);
        });
        const key = keys[keys.length - 1];
        if (get(o, key) === undefined || get(flags.bools, key) || typeof get(o, key) === "boolean") {
            o[key] = value;
        } else if (Array.isArray(get(o, key))) {
            o[key].push(value);
        } else {
            o[key] = [
                get(o, key),
                value
            ];
        }
    }
    function setArg(key, val, arg = undefined) {
        if (arg && flags.unknownFn && !argDefined(key, arg)) {
            if (flags.unknownFn(arg, key, val) === false) return;
        }
        const value = !get(flags.strings, key) && isNumber(val) ? Number(val) : val;
        setKey(argv, key.split("."), value);
        const alias = get(aliases, key);
        if (alias) {
            for (const x of alias){
                setKey(argv, x.split("."), value);
            }
        }
    }
    function aliasIsBoolean(key) {
        return getForce(aliases, key).some((x)=>typeof get(flags.bools, x) === "boolean");
    }
    for (const key of Object.keys(flags.bools)){
        setArg(key, defaults[key] === undefined ? false : defaults[key]);
    }
    let notFlags = [];
    // all args after "--" are not parsed
    if (args.includes("--")) {
        notFlags = args.slice(args.indexOf("--") + 1);
        args = args.slice(0, args.indexOf("--"));
    }
    for(let i = 0; i < args.length; i++){
        const arg = args[i];
        if (/^--.+=/.test(arg)) {
            const m = arg.match(/^--([^=]+)=(.*)$/s);
            assert(m != null);
            const [, key, value] = m;
            if (flags.bools[key]) {
                const booleanValue = value !== "false";
                setArg(key, booleanValue, arg);
            } else {
                setArg(key, value, arg);
            }
        } else if (/^--no-.+/.test(arg)) {
            const m = arg.match(/^--no-(.+)/);
            assert(m != null);
            setArg(m[1], false, arg);
        } else if (/^--.+/.test(arg)) {
            const m = arg.match(/^--(.+)/);
            assert(m != null);
            const [, key] = m;
            const next = args[i + 1];
            if (next !== undefined && !/^-/.test(next) && !get(flags.bools, key) && !flags.allBools && (get(aliases, key) ? !aliasIsBoolean(key) : true)) {
                setArg(key, next, arg);
                i++;
            } else if (/^(true|false)$/.test(next)) {
                setArg(key, next === "true", arg);
                i++;
            } else {
                setArg(key, get(flags.strings, key) ? "" : true, arg);
            }
        } else if (/^-[^-]+/.test(arg)) {
            const letters = arg.slice(1, -1).split("");
            let broken = false;
            for(let j = 0; j < letters.length; j++){
                const next = arg.slice(j + 2);
                if (next === "-") {
                    setArg(letters[j], next, arg);
                    continue;
                }
                if (/[A-Za-z]/.test(letters[j]) && /=/.test(next)) {
                    setArg(letters[j], next.split(/=(.+)/)[1], arg);
                    broken = true;
                    break;
                }
                if (/[A-Za-z]/.test(letters[j]) && /-?\d+(\.\d*)?(e-?\d+)?$/.test(next)) {
                    setArg(letters[j], next, arg);
                    broken = true;
                    break;
                }
                if (letters[j + 1] && letters[j + 1].match(/\W/)) {
                    setArg(letters[j], arg.slice(j + 2), arg);
                    broken = true;
                    break;
                } else {
                    setArg(letters[j], get(flags.strings, letters[j]) ? "" : true, arg);
                }
            }
            const [key] = arg.slice(-1);
            if (!broken && key !== "-") {
                if (args[i + 1] && !/^(-|--)[^-]/.test(args[i + 1]) && !get(flags.bools, key) && (get(aliases, key) ? !aliasIsBoolean(key) : true)) {
                    setArg(key, args[i + 1], arg);
                    i++;
                } else if (args[i + 1] && /^(true|false)$/.test(args[i + 1])) {
                    setArg(key, args[i + 1] === "true", arg);
                    i++;
                } else {
                    setArg(key, get(flags.strings, key) ? "" : true, arg);
                }
            }
        } else {
            if (!flags.unknownFn || flags.unknownFn(arg) !== false) {
                argv._.push(flags.strings["_"] ?? !isNumber(arg) ? arg : Number(arg));
            }
            if (stopEarly) {
                argv._.push(...args.slice(i + 1));
                break;
            }
        }
    }
    for (const key of Object.keys(defaults)){
        if (!hasKey(argv, key.split("."))) {
            setKey(argv, key.split("."), defaults[key]);
            if (aliases[key]) {
                for (const x of aliases[key]){
                    setKey(argv, x.split("."), defaults[key]);
                }
            }
        }
    }
    if (doubleDash) {
        argv["--"] = [];
        for (const key of notFlags){
            argv["--"].push(key);
        }
    } else {
        for (const key of notFlags){
            argv._.push(key);
        }
    }
    return argv;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjEzMy4wL2ZsYWdzL21vZC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIyIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQgeyBhc3NlcnQgfSBmcm9tIFwiLi4vX3V0aWwvYXNzZXJ0LnRzXCI7XG5cbi8qKiBUaGUgdmFsdWUgcmV0dXJuZWQgZnJvbSBgcGFyc2VgLiAqL1xuZXhwb3J0IGludGVyZmFjZSBBcmdzIHtcbiAgLyoqIENvbnRhaW5zIGFsbCB0aGUgYXJndW1lbnRzIHRoYXQgZGlkbid0IGhhdmUgYW4gb3B0aW9uIGFzc29jaWF0ZWQgd2l0aFxuICAgKiB0aGVtLiAqL1xuICBfOiBBcnJheTxzdHJpbmcgfCBudW1iZXI+O1xuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBba2V5OiBzdHJpbmddOiBhbnk7XG59XG5cbi8qKiBUaGUgb3B0aW9ucyBmb3IgdGhlIGBwYXJzZWAgY2FsbC4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUGFyc2VPcHRpb25zIHtcbiAgLyoqIFdoZW4gYHRydWVgLCBwb3B1bGF0ZSB0aGUgcmVzdWx0IGBfYCB3aXRoIGV2ZXJ5dGhpbmcgYmVmb3JlIHRoZSBgLS1gIGFuZFxuICAgKiB0aGUgcmVzdWx0IGBbJy0tJ11gIHdpdGggZXZlcnl0aGluZyBhZnRlciB0aGUgYC0tYC4gSGVyZSdzIGFuIGV4YW1wbGU6XG4gICAqXG4gICAqIGBgYHRzXG4gICAqIC8vICQgZGVubyBydW4gZXhhbXBsZS50cyAtLSBhIGFyZzFcbiAgICogaW1wb3J0IHsgcGFyc2UgfSBmcm9tIFwiLi9tb2QudHNcIjtcbiAgICogY29uc29sZS5kaXIocGFyc2UoRGVuby5hcmdzLCB7IFwiLS1cIjogZmFsc2UgfSkpO1xuICAgKiAvLyBvdXRwdXQ6IHsgXzogWyBcImFcIiwgXCJhcmcxXCIgXSB9XG4gICAqIGNvbnNvbGUuZGlyKHBhcnNlKERlbm8uYXJncywgeyBcIi0tXCI6IHRydWUgfSkpO1xuICAgKiAvLyBvdXRwdXQ6IHsgXzogW10sIC0tOiBbIFwiYVwiLCBcImFyZzFcIiBdIH1cbiAgICogYGBgXG4gICAqXG4gICAqIERlZmF1bHRzIHRvIGBmYWxzZWAuXG4gICAqL1xuICBcIi0tXCI/OiBib29sZWFuO1xuXG4gIC8qKiBBbiBvYmplY3QgbWFwcGluZyBzdHJpbmcgbmFtZXMgdG8gc3RyaW5ncyBvciBhcnJheXMgb2Ygc3RyaW5nIGFyZ3VtZW50XG4gICAqIG5hbWVzIHRvIHVzZSBhcyBhbGlhc2VzLiAqL1xuICBhbGlhcz86IFJlY29yZDxzdHJpbmcsIHN0cmluZyB8IHN0cmluZ1tdPjtcblxuICAvKiogQSBib29sZWFuLCBzdHJpbmcgb3IgYXJyYXkgb2Ygc3RyaW5ncyB0byBhbHdheXMgdHJlYXQgYXMgYm9vbGVhbnMuIElmXG4gICAqIGB0cnVlYCB3aWxsIHRyZWF0IGFsbCBkb3VibGUgaHlwaGVuYXRlZCBhcmd1bWVudHMgd2l0aG91dCBlcXVhbCBzaWducyBhc1xuICAgKiBgYm9vbGVhbmAgKGUuZy4gYWZmZWN0cyBgLS1mb29gLCBub3QgYC1mYCBvciBgLS1mb289YmFyYCkgKi9cbiAgYm9vbGVhbj86IGJvb2xlYW4gfCBzdHJpbmcgfCBzdHJpbmdbXTtcblxuICAvKiogQW4gb2JqZWN0IG1hcHBpbmcgc3RyaW5nIGFyZ3VtZW50IG5hbWVzIHRvIGRlZmF1bHQgdmFsdWVzLiAqL1xuICBkZWZhdWx0PzogUmVjb3JkPHN0cmluZywgdW5rbm93bj47XG5cbiAgLyoqIFdoZW4gYHRydWVgLCBwb3B1bGF0ZSB0aGUgcmVzdWx0IGBfYCB3aXRoIGV2ZXJ5dGhpbmcgYWZ0ZXIgdGhlIGZpcnN0XG4gICAqIG5vbi1vcHRpb24uICovXG4gIHN0b3BFYXJseT86IGJvb2xlYW47XG5cbiAgLyoqIEEgc3RyaW5nIG9yIGFycmF5IG9mIHN0cmluZ3MgYXJndW1lbnQgbmFtZXMgdG8gYWx3YXlzIHRyZWF0IGFzIHN0cmluZ3MuICovXG4gIHN0cmluZz86IHN0cmluZyB8IHN0cmluZ1tdO1xuXG4gIC8qKiBBIGZ1bmN0aW9uIHdoaWNoIGlzIGludm9rZWQgd2l0aCBhIGNvbW1hbmQgbGluZSBwYXJhbWV0ZXIgbm90IGRlZmluZWQgaW5cbiAgICogdGhlIGBvcHRpb25zYCBjb25maWd1cmF0aW9uIG9iamVjdC4gSWYgdGhlIGZ1bmN0aW9uIHJldHVybnMgYGZhbHNlYCwgdGhlXG4gICAqIHVua25vd24gb3B0aW9uIGlzIG5vdCBhZGRlZCB0byBgcGFyc2VkQXJnc2AuICovXG4gIHVua25vd24/OiAoYXJnOiBzdHJpbmcsIGtleT86IHN0cmluZywgdmFsdWU/OiB1bmtub3duKSA9PiB1bmtub3duO1xufVxuXG5pbnRlcmZhY2UgRmxhZ3Mge1xuICBib29sczogUmVjb3JkPHN0cmluZywgYm9vbGVhbj47XG4gIHN0cmluZ3M6IFJlY29yZDxzdHJpbmcsIGJvb2xlYW4+O1xuICB1bmtub3duRm46IChhcmc6IHN0cmluZywga2V5Pzogc3RyaW5nLCB2YWx1ZT86IHVua25vd24pID0+IHVua25vd247XG4gIGFsbEJvb2xzOiBib29sZWFuO1xufVxuXG5pbnRlcmZhY2UgTmVzdGVkTWFwcGluZyB7XG4gIFtrZXk6IHN0cmluZ106IE5lc3RlZE1hcHBpbmcgfCB1bmtub3duO1xufVxuXG5jb25zdCB7IGhhc093biB9ID0gT2JqZWN0O1xuXG5mdW5jdGlvbiBnZXQ8VD4ob2JqOiBSZWNvcmQ8c3RyaW5nLCBUPiwga2V5OiBzdHJpbmcpOiBUIHwgdW5kZWZpbmVkIHtcbiAgaWYgKGhhc093bihvYmosIGtleSkpIHtcbiAgICByZXR1cm4gb2JqW2tleV07XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0Rm9yY2U8VD4ob2JqOiBSZWNvcmQ8c3RyaW5nLCBUPiwga2V5OiBzdHJpbmcpOiBUIHtcbiAgY29uc3QgdiA9IGdldChvYmosIGtleSk7XG4gIGFzc2VydCh2ICE9IG51bGwpO1xuICByZXR1cm4gdjtcbn1cblxuZnVuY3Rpb24gaXNOdW1iZXIoeDogdW5rbm93bik6IGJvb2xlYW4ge1xuICBpZiAodHlwZW9mIHggPT09IFwibnVtYmVyXCIpIHJldHVybiB0cnVlO1xuICBpZiAoL14weFswLTlhLWZdKyQvaS50ZXN0KFN0cmluZyh4KSkpIHJldHVybiB0cnVlO1xuICByZXR1cm4gL15bLStdPyg/OlxcZCsoPzpcXC5cXGQqKT98XFwuXFxkKykoZVstK10/XFxkKyk/JC8udGVzdChTdHJpbmcoeCkpO1xufVxuXG5mdW5jdGlvbiBoYXNLZXkob2JqOiBOZXN0ZWRNYXBwaW5nLCBrZXlzOiBzdHJpbmdbXSk6IGJvb2xlYW4ge1xuICBsZXQgbyA9IG9iajtcbiAga2V5cy5zbGljZSgwLCAtMSkuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgbyA9IChnZXQobywga2V5KSA/PyB7fSkgYXMgTmVzdGVkTWFwcGluZztcbiAgfSk7XG5cbiAgY29uc3Qga2V5ID0ga2V5c1trZXlzLmxlbmd0aCAtIDFdO1xuICByZXR1cm4ga2V5IGluIG87XG59XG5cbi8qKiBUYWtlIGEgc2V0IG9mIGNvbW1hbmQgbGluZSBhcmd1bWVudHMsIG9wdGlvbmFsbHkgd2l0aCBhIHNldCBvZiBvcHRpb25zLCBhbmRcbiAqIHJldHVybiBhbiBvYmplY3QgcmVwcmVzZW50aW5nIHRoZSBmbGFncyBmb3VuZCBpbiB0aGUgcGFzc2VkIGFyZ3VtZW50cy5cbiAqXG4gKiBCeSBkZWZhdWx0IGFueSBhcmd1bWVudHMgc3RhcnRpbmcgd2l0aCBgLWAgb3IgYC0tYCBhcmUgY29uc2lkZXJlZCBib29sZWFuXG4gKiBmbGFncy4gSWYgdGhlIGFyZ3VtZW50IG5hbWUgaXMgZm9sbG93ZWQgYnkgYW4gZXF1YWwgc2lnbiAoYD1gKSBpdCBpc1xuICogY29uc2lkZXJlZCBhIGtleS12YWx1ZSBwYWlyLiBBbnkgYXJndW1lbnRzIHdoaWNoIGNvdWxkIG5vdCBiZSBwYXJzZWQgYXJlXG4gKiBhdmFpbGFibGUgaW4gdGhlIGBfYCBwcm9wZXJ0eSBvZiB0aGUgcmV0dXJuZWQgb2JqZWN0LlxuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBwYXJzZSB9IGZyb20gXCIuL21vZC50c1wiO1xuICogY29uc3QgcGFyc2VkQXJncyA9IHBhcnNlKERlbm8uYXJncyk7XG4gKiBgYGBcbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgcGFyc2UgfSBmcm9tIFwiLi9tb2QudHNcIjtcbiAqIGNvbnN0IHBhcnNlZEFyZ3MgPSBwYXJzZShbXCItLWZvb1wiLCBcIi0tYmFyPWJhelwiLCBcIi0tbm8tcXV4XCIsIFwiLi9xdXV4LnR4dFwiXSk7XG4gKiAvLyBwYXJzZWRBcmdzOiB7IGZvbzogdHJ1ZSwgYmFyOiBcImJhelwiLCBxdXg6IGZhbHNlLCBfOiBbXCIuL3F1dXgudHh0XCJdIH1cbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2UoXG4gIGFyZ3M6IHN0cmluZ1tdLFxuICB7XG4gICAgXCItLVwiOiBkb3VibGVEYXNoID0gZmFsc2UsXG4gICAgYWxpYXMgPSB7fSxcbiAgICBib29sZWFuID0gZmFsc2UsXG4gICAgZGVmYXVsdDogZGVmYXVsdHMgPSB7fSxcbiAgICBzdG9wRWFybHkgPSBmYWxzZSxcbiAgICBzdHJpbmcgPSBbXSxcbiAgICB1bmtub3duID0gKGk6IHN0cmluZyk6IHVua25vd24gPT4gaSxcbiAgfTogUGFyc2VPcHRpb25zID0ge30sXG4pOiBBcmdzIHtcbiAgY29uc3QgZmxhZ3M6IEZsYWdzID0ge1xuICAgIGJvb2xzOiB7fSxcbiAgICBzdHJpbmdzOiB7fSxcbiAgICB1bmtub3duRm46IHVua25vd24sXG4gICAgYWxsQm9vbHM6IGZhbHNlLFxuICB9O1xuXG4gIGlmIChib29sZWFuICE9PSB1bmRlZmluZWQpIHtcbiAgICBpZiAodHlwZW9mIGJvb2xlYW4gPT09IFwiYm9vbGVhblwiKSB7XG4gICAgICBmbGFncy5hbGxCb29scyA9ICEhYm9vbGVhbjtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgYm9vbGVhbkFyZ3MgPSB0eXBlb2YgYm9vbGVhbiA9PT0gXCJzdHJpbmdcIiA/IFtib29sZWFuXSA6IGJvb2xlYW47XG5cbiAgICAgIGZvciAoY29uc3Qga2V5IG9mIGJvb2xlYW5BcmdzLmZpbHRlcihCb29sZWFuKSkge1xuICAgICAgICBmbGFncy5ib29sc1trZXldID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBjb25zdCBhbGlhc2VzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmdbXT4gPSB7fTtcbiAgaWYgKGFsaWFzICE9PSB1bmRlZmluZWQpIHtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBhbGlhcykge1xuICAgICAgY29uc3QgdmFsID0gZ2V0Rm9yY2UoYWxpYXMsIGtleSk7XG4gICAgICBpZiAodHlwZW9mIHZhbCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICBhbGlhc2VzW2tleV0gPSBbdmFsXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFsaWFzZXNba2V5XSA9IHZhbDtcbiAgICAgIH1cbiAgICAgIGZvciAoY29uc3QgYWxpYXMgb2YgZ2V0Rm9yY2UoYWxpYXNlcywga2V5KSkge1xuICAgICAgICBhbGlhc2VzW2FsaWFzXSA9IFtrZXldLmNvbmNhdChhbGlhc2VzW2tleV0uZmlsdGVyKCh5KSA9PiBhbGlhcyAhPT0geSkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmIChzdHJpbmcgIT09IHVuZGVmaW5lZCkge1xuICAgIGNvbnN0IHN0cmluZ0FyZ3MgPSB0eXBlb2Ygc3RyaW5nID09PSBcInN0cmluZ1wiID8gW3N0cmluZ10gOiBzdHJpbmc7XG5cbiAgICBmb3IgKGNvbnN0IGtleSBvZiBzdHJpbmdBcmdzLmZpbHRlcihCb29sZWFuKSkge1xuICAgICAgZmxhZ3Muc3RyaW5nc1trZXldID0gdHJ1ZTtcbiAgICAgIGNvbnN0IGFsaWFzID0gZ2V0KGFsaWFzZXMsIGtleSk7XG4gICAgICBpZiAoYWxpYXMpIHtcbiAgICAgICAgZm9yIChjb25zdCBhbCBvZiBhbGlhcykge1xuICAgICAgICAgIGZsYWdzLnN0cmluZ3NbYWxdID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGFyZ3Y6IEFyZ3MgPSB7IF86IFtdIH07XG5cbiAgZnVuY3Rpb24gYXJnRGVmaW5lZChrZXk6IHN0cmluZywgYXJnOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gKFxuICAgICAgKGZsYWdzLmFsbEJvb2xzICYmIC9eLS1bXj1dKyQvLnRlc3QoYXJnKSkgfHxcbiAgICAgIGdldChmbGFncy5ib29scywga2V5KSB8fFxuICAgICAgISFnZXQoZmxhZ3Muc3RyaW5ncywga2V5KSB8fFxuICAgICAgISFnZXQoYWxpYXNlcywga2V5KVxuICAgICk7XG4gIH1cblxuICBmdW5jdGlvbiBzZXRLZXkob2JqOiBOZXN0ZWRNYXBwaW5nLCBrZXlzOiBzdHJpbmdbXSwgdmFsdWU6IHVua25vd24pOiB2b2lkIHtcbiAgICBsZXQgbyA9IG9iajtcbiAgICBrZXlzLnNsaWNlKDAsIC0xKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpOiB2b2lkIHtcbiAgICAgIGlmIChnZXQobywga2V5KSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIG9ba2V5XSA9IHt9O1xuICAgICAgfVxuICAgICAgbyA9IGdldChvLCBrZXkpIGFzIE5lc3RlZE1hcHBpbmc7XG4gICAgfSk7XG5cbiAgICBjb25zdCBrZXkgPSBrZXlzW2tleXMubGVuZ3RoIC0gMV07XG4gICAgaWYgKFxuICAgICAgZ2V0KG8sIGtleSkgPT09IHVuZGVmaW5lZCB8fFxuICAgICAgZ2V0KGZsYWdzLmJvb2xzLCBrZXkpIHx8XG4gICAgICB0eXBlb2YgZ2V0KG8sIGtleSkgPT09IFwiYm9vbGVhblwiXG4gICAgKSB7XG4gICAgICBvW2tleV0gPSB2YWx1ZTtcbiAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoZ2V0KG8sIGtleSkpKSB7XG4gICAgICAob1trZXldIGFzIHVua25vd25bXSkucHVzaCh2YWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG9ba2V5XSA9IFtnZXQobywga2V5KSwgdmFsdWVdO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHNldEFyZyhcbiAgICBrZXk6IHN0cmluZyxcbiAgICB2YWw6IHVua25vd24sXG4gICAgYXJnOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXG4gICk6IHZvaWQge1xuICAgIGlmIChhcmcgJiYgZmxhZ3MudW5rbm93bkZuICYmICFhcmdEZWZpbmVkKGtleSwgYXJnKSkge1xuICAgICAgaWYgKGZsYWdzLnVua25vd25GbihhcmcsIGtleSwgdmFsKSA9PT0gZmFsc2UpIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB2YWx1ZSA9ICFnZXQoZmxhZ3Muc3RyaW5ncywga2V5KSAmJiBpc051bWJlcih2YWwpID8gTnVtYmVyKHZhbCkgOiB2YWw7XG4gICAgc2V0S2V5KGFyZ3YsIGtleS5zcGxpdChcIi5cIiksIHZhbHVlKTtcblxuICAgIGNvbnN0IGFsaWFzID0gZ2V0KGFsaWFzZXMsIGtleSk7XG4gICAgaWYgKGFsaWFzKSB7XG4gICAgICBmb3IgKGNvbnN0IHggb2YgYWxpYXMpIHtcbiAgICAgICAgc2V0S2V5KGFyZ3YsIHguc3BsaXQoXCIuXCIpLCB2YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gYWxpYXNJc0Jvb2xlYW4oa2V5OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gZ2V0Rm9yY2UoYWxpYXNlcywga2V5KS5zb21lKFxuICAgICAgKHgpID0+IHR5cGVvZiBnZXQoZmxhZ3MuYm9vbHMsIHgpID09PSBcImJvb2xlYW5cIixcbiAgICApO1xuICB9XG5cbiAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMoZmxhZ3MuYm9vbHMpKSB7XG4gICAgc2V0QXJnKGtleSwgZGVmYXVsdHNba2V5XSA9PT0gdW5kZWZpbmVkID8gZmFsc2UgOiBkZWZhdWx0c1trZXldKTtcbiAgfVxuXG4gIGxldCBub3RGbGFnczogc3RyaW5nW10gPSBbXTtcblxuICAvLyBhbGwgYXJncyBhZnRlciBcIi0tXCIgYXJlIG5vdCBwYXJzZWRcbiAgaWYgKGFyZ3MuaW5jbHVkZXMoXCItLVwiKSkge1xuICAgIG5vdEZsYWdzID0gYXJncy5zbGljZShhcmdzLmluZGV4T2YoXCItLVwiKSArIDEpO1xuICAgIGFyZ3MgPSBhcmdzLnNsaWNlKDAsIGFyZ3MuaW5kZXhPZihcIi0tXCIpKTtcbiAgfVxuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGFyZyA9IGFyZ3NbaV07XG5cbiAgICBpZiAoL14tLS4rPS8udGVzdChhcmcpKSB7XG4gICAgICBjb25zdCBtID0gYXJnLm1hdGNoKC9eLS0oW149XSspPSguKikkL3MpO1xuICAgICAgYXNzZXJ0KG0gIT0gbnVsbCk7XG4gICAgICBjb25zdCBbLCBrZXksIHZhbHVlXSA9IG07XG5cbiAgICAgIGlmIChmbGFncy5ib29sc1trZXldKSB7XG4gICAgICAgIGNvbnN0IGJvb2xlYW5WYWx1ZSA9IHZhbHVlICE9PSBcImZhbHNlXCI7XG4gICAgICAgIHNldEFyZyhrZXksIGJvb2xlYW5WYWx1ZSwgYXJnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldEFyZyhrZXksIHZhbHVlLCBhcmcpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoL14tLW5vLS4rLy50ZXN0KGFyZykpIHtcbiAgICAgIGNvbnN0IG0gPSBhcmcubWF0Y2goL14tLW5vLSguKykvKTtcbiAgICAgIGFzc2VydChtICE9IG51bGwpO1xuICAgICAgc2V0QXJnKG1bMV0sIGZhbHNlLCBhcmcpO1xuICAgIH0gZWxzZSBpZiAoL14tLS4rLy50ZXN0KGFyZykpIHtcbiAgICAgIGNvbnN0IG0gPSBhcmcubWF0Y2goL14tLSguKykvKTtcbiAgICAgIGFzc2VydChtICE9IG51bGwpO1xuICAgICAgY29uc3QgWywga2V5XSA9IG07XG4gICAgICBjb25zdCBuZXh0ID0gYXJnc1tpICsgMV07XG4gICAgICBpZiAoXG4gICAgICAgIG5leHQgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgICAhL14tLy50ZXN0KG5leHQpICYmXG4gICAgICAgICFnZXQoZmxhZ3MuYm9vbHMsIGtleSkgJiZcbiAgICAgICAgIWZsYWdzLmFsbEJvb2xzICYmXG4gICAgICAgIChnZXQoYWxpYXNlcywga2V5KSA/ICFhbGlhc0lzQm9vbGVhbihrZXkpIDogdHJ1ZSlcbiAgICAgICkge1xuICAgICAgICBzZXRBcmcoa2V5LCBuZXh0LCBhcmcpO1xuICAgICAgICBpKys7XG4gICAgICB9IGVsc2UgaWYgKC9eKHRydWV8ZmFsc2UpJC8udGVzdChuZXh0KSkge1xuICAgICAgICBzZXRBcmcoa2V5LCBuZXh0ID09PSBcInRydWVcIiwgYXJnKTtcbiAgICAgICAgaSsrO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0QXJnKGtleSwgZ2V0KGZsYWdzLnN0cmluZ3MsIGtleSkgPyBcIlwiIDogdHJ1ZSwgYXJnKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKC9eLVteLV0rLy50ZXN0KGFyZykpIHtcbiAgICAgIGNvbnN0IGxldHRlcnMgPSBhcmcuc2xpY2UoMSwgLTEpLnNwbGl0KFwiXCIpO1xuXG4gICAgICBsZXQgYnJva2VuID0gZmFsc2U7XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGxldHRlcnMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgY29uc3QgbmV4dCA9IGFyZy5zbGljZShqICsgMik7XG5cbiAgICAgICAgaWYgKG5leHQgPT09IFwiLVwiKSB7XG4gICAgICAgICAgc2V0QXJnKGxldHRlcnNbal0sIG5leHQsIGFyZyk7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoL1tBLVphLXpdLy50ZXN0KGxldHRlcnNbal0pICYmIC89Ly50ZXN0KG5leHQpKSB7XG4gICAgICAgICAgc2V0QXJnKGxldHRlcnNbal0sIG5leHQuc3BsaXQoLz0oLispLylbMV0sIGFyZyk7XG4gICAgICAgICAgYnJva2VuID0gdHJ1ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChcbiAgICAgICAgICAvW0EtWmEtel0vLnRlc3QobGV0dGVyc1tqXSkgJiZcbiAgICAgICAgICAvLT9cXGQrKFxcLlxcZCopPyhlLT9cXGQrKT8kLy50ZXN0KG5leHQpXG4gICAgICAgICkge1xuICAgICAgICAgIHNldEFyZyhsZXR0ZXJzW2pdLCBuZXh0LCBhcmcpO1xuICAgICAgICAgIGJyb2tlbiA9IHRydWU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobGV0dGVyc1tqICsgMV0gJiYgbGV0dGVyc1tqICsgMV0ubWF0Y2goL1xcVy8pKSB7XG4gICAgICAgICAgc2V0QXJnKGxldHRlcnNbal0sIGFyZy5zbGljZShqICsgMiksIGFyZyk7XG4gICAgICAgICAgYnJva2VuID0gdHJ1ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZXRBcmcobGV0dGVyc1tqXSwgZ2V0KGZsYWdzLnN0cmluZ3MsIGxldHRlcnNbal0pID8gXCJcIiA6IHRydWUsIGFyZyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgW2tleV0gPSBhcmcuc2xpY2UoLTEpO1xuICAgICAgaWYgKCFicm9rZW4gJiYga2V5ICE9PSBcIi1cIikge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgYXJnc1tpICsgMV0gJiZcbiAgICAgICAgICAhL14oLXwtLSlbXi1dLy50ZXN0KGFyZ3NbaSArIDFdKSAmJlxuICAgICAgICAgICFnZXQoZmxhZ3MuYm9vbHMsIGtleSkgJiZcbiAgICAgICAgICAoZ2V0KGFsaWFzZXMsIGtleSkgPyAhYWxpYXNJc0Jvb2xlYW4oa2V5KSA6IHRydWUpXG4gICAgICAgICkge1xuICAgICAgICAgIHNldEFyZyhrZXksIGFyZ3NbaSArIDFdLCBhcmcpO1xuICAgICAgICAgIGkrKztcbiAgICAgICAgfSBlbHNlIGlmIChhcmdzW2kgKyAxXSAmJiAvXih0cnVlfGZhbHNlKSQvLnRlc3QoYXJnc1tpICsgMV0pKSB7XG4gICAgICAgICAgc2V0QXJnKGtleSwgYXJnc1tpICsgMV0gPT09IFwidHJ1ZVwiLCBhcmcpO1xuICAgICAgICAgIGkrKztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZXRBcmcoa2V5LCBnZXQoZmxhZ3Muc3RyaW5ncywga2V5KSA/IFwiXCIgOiB0cnVlLCBhcmcpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICghZmxhZ3MudW5rbm93bkZuIHx8IGZsYWdzLnVua25vd25GbihhcmcpICE9PSBmYWxzZSkge1xuICAgICAgICBhcmd2Ll8ucHVzaChmbGFncy5zdHJpbmdzW1wiX1wiXSA/PyAhaXNOdW1iZXIoYXJnKSA/IGFyZyA6IE51bWJlcihhcmcpKTtcbiAgICAgIH1cbiAgICAgIGlmIChzdG9wRWFybHkpIHtcbiAgICAgICAgYXJndi5fLnB1c2goLi4uYXJncy5zbGljZShpICsgMSkpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhkZWZhdWx0cykpIHtcbiAgICBpZiAoIWhhc0tleShhcmd2LCBrZXkuc3BsaXQoXCIuXCIpKSkge1xuICAgICAgc2V0S2V5KGFyZ3YsIGtleS5zcGxpdChcIi5cIiksIGRlZmF1bHRzW2tleV0pO1xuXG4gICAgICBpZiAoYWxpYXNlc1trZXldKSB7XG4gICAgICAgIGZvciAoY29uc3QgeCBvZiBhbGlhc2VzW2tleV0pIHtcbiAgICAgICAgICBzZXRLZXkoYXJndiwgeC5zcGxpdChcIi5cIiksIGRlZmF1bHRzW2tleV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKGRvdWJsZURhc2gpIHtcbiAgICBhcmd2W1wiLS1cIl0gPSBbXTtcbiAgICBmb3IgKGNvbnN0IGtleSBvZiBub3RGbGFncykge1xuICAgICAgYXJndltcIi0tXCJdLnB1c2goa2V5KTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgZm9yIChjb25zdCBrZXkgb2Ygbm90RmxhZ3MpIHtcbiAgICAgIGFyZ3YuXy5wdXNoKGtleSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGFyZ3Y7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUVyQyxTQUFTLE1BQU0sUUFBUSxxQkFBcUI7QUFpRTVDLE1BQU0sRUFBRSxPQUFNLEVBQUUsR0FBRztBQUVuQixTQUFTLElBQU8sR0FBc0IsRUFBRSxHQUFXO0lBQ2pELElBQUksT0FBTyxLQUFLLE1BQU07UUFDcEIsT0FBTyxHQUFHLENBQUMsSUFBSTtJQUNqQjtBQUNGO0FBRUEsU0FBUyxTQUFZLEdBQXNCLEVBQUUsR0FBVztJQUN0RCxNQUFNLElBQUksSUFBSSxLQUFLO0lBQ25CLE9BQU8sS0FBSztJQUNaLE9BQU87QUFDVDtBQUVBLFNBQVMsU0FBUyxDQUFVO0lBQzFCLElBQUksT0FBTyxNQUFNLFVBQVUsT0FBTztJQUNsQyxJQUFJLGlCQUFpQixLQUFLLE9BQU8sS0FBSyxPQUFPO0lBQzdDLE9BQU8sNkNBQTZDLEtBQUssT0FBTztBQUNsRTtBQUVBLFNBQVMsT0FBTyxHQUFrQixFQUFFLElBQWM7SUFDaEQsSUFBSSxJQUFJO0lBQ1IsS0FBSyxNQUFNLEdBQUcsQ0FBQyxHQUFHLFFBQVEsQ0FBQztRQUN6QixJQUFLLElBQUksR0FBRyxRQUFRLENBQUM7SUFDdkI7SUFFQSxNQUFNLE1BQU0sSUFBSSxDQUFDLEtBQUssU0FBUyxFQUFFO0lBQ2pDLE9BQU8sT0FBTztBQUNoQjtBQUVBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FrQkMsR0FDRCxPQUFPLFNBQVMsTUFDZCxJQUFjLEVBQ2QsRUFDRSxNQUFNLGFBQWEsS0FBSyxDQUFBLEVBQ3hCLE9BQVEsQ0FBQyxFQUFDLEVBQ1YsU0FBVSxNQUFLLEVBQ2YsU0FBUyxXQUFXLENBQUMsQ0FBQyxDQUFBLEVBQ3RCLFdBQVksTUFBSyxFQUNqQixRQUFTLEVBQUUsQ0FBQSxFQUNYLFNBQVUsQ0FBQyxJQUF1QixFQUFDLEVBQ3RCLEdBQUcsQ0FBQyxDQUFDO0lBRXBCLE1BQU0sUUFBZTtRQUNuQixPQUFPLENBQUM7UUFDUixTQUFTLENBQUM7UUFDVixXQUFXO1FBQ1gsVUFBVTtJQUNaO0lBRUEsSUFBSSxZQUFZLFdBQVc7UUFDekIsSUFBSSxPQUFPLFlBQVksV0FBVztZQUNoQyxNQUFNLFdBQVcsQ0FBQyxDQUFDO1FBQ3JCLE9BQU87WUFDTCxNQUFNLGNBQWMsT0FBTyxZQUFZLFdBQVc7Z0JBQUM7YUFBUSxHQUFHO1lBRTlELEtBQUssTUFBTSxPQUFPLFlBQVksT0FBTyxTQUFVO2dCQUM3QyxNQUFNLEtBQUssQ0FBQyxJQUFJLEdBQUc7WUFDckI7UUFDRjtJQUNGO0lBRUEsTUFBTSxVQUFvQyxDQUFDO0lBQzNDLElBQUksVUFBVSxXQUFXO1FBQ3ZCLElBQUssTUFBTSxPQUFPLE1BQU87WUFDdkIsTUFBTSxNQUFNLFNBQVMsT0FBTztZQUM1QixJQUFJLE9BQU8sUUFBUSxVQUFVO2dCQUMzQixPQUFPLENBQUMsSUFBSSxHQUFHO29CQUFDO2lCQUFJO1lBQ3RCLE9BQU87Z0JBQ0wsT0FBTyxDQUFDLElBQUksR0FBRztZQUNqQjtZQUNBLEtBQUssTUFBTSxTQUFTLFNBQVMsU0FBUyxLQUFNO2dCQUMxQyxPQUFPLENBQUMsTUFBTSxHQUFHO29CQUFDO2lCQUFJLENBQUMsT0FBTyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFNLFVBQVU7WUFDckU7UUFDRjtJQUNGO0lBRUEsSUFBSSxXQUFXLFdBQVc7UUFDeEIsTUFBTSxhQUFhLE9BQU8sV0FBVyxXQUFXO1lBQUM7U0FBTyxHQUFHO1FBRTNELEtBQUssTUFBTSxPQUFPLFdBQVcsT0FBTyxTQUFVO1lBQzVDLE1BQU0sT0FBTyxDQUFDLElBQUksR0FBRztZQUNyQixNQUFNLFFBQVEsSUFBSSxTQUFTO1lBQzNCLElBQUksT0FBTztnQkFDVCxLQUFLLE1BQU0sTUFBTSxNQUFPO29CQUN0QixNQUFNLE9BQU8sQ0FBQyxHQUFHLEdBQUc7Z0JBQ3RCO1lBQ0Y7UUFDRjtJQUNGO0lBRUEsTUFBTSxPQUFhO1FBQUUsR0FBRyxFQUFFO0lBQUM7SUFFM0IsU0FBUyxXQUFXLEdBQVcsRUFBRSxHQUFXO1FBQzFDLE9BQ0UsQUFBQyxNQUFNLFlBQVksWUFBWSxLQUFLLFFBQ3BDLElBQUksTUFBTSxPQUFPLFFBQ2pCLENBQUMsQ0FBQyxJQUFJLE1BQU0sU0FBUyxRQUNyQixDQUFDLENBQUMsSUFBSSxTQUFTO0lBRW5CO0lBRUEsU0FBUyxPQUFPLEdBQWtCLEVBQUUsSUFBYyxFQUFFLEtBQWM7UUFDaEUsSUFBSSxJQUFJO1FBQ1IsS0FBSyxNQUFNLEdBQUcsQ0FBQyxHQUFHLFFBQVEsU0FBVSxHQUFHO1lBQ3JDLElBQUksSUFBSSxHQUFHLFNBQVMsV0FBVztnQkFDN0IsQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDO1lBQ1o7WUFDQSxJQUFJLElBQUksR0FBRztRQUNiO1FBRUEsTUFBTSxNQUFNLElBQUksQ0FBQyxLQUFLLFNBQVMsRUFBRTtRQUNqQyxJQUNFLElBQUksR0FBRyxTQUFTLGFBQ2hCLElBQUksTUFBTSxPQUFPLFFBQ2pCLE9BQU8sSUFBSSxHQUFHLFNBQVMsV0FDdkI7WUFDQSxDQUFDLENBQUMsSUFBSSxHQUFHO1FBQ1gsT0FBTyxJQUFJLE1BQU0sUUFBUSxJQUFJLEdBQUcsT0FBTztZQUNwQyxDQUFDLENBQUMsSUFBSSxDQUFlLEtBQUs7UUFDN0IsT0FBTztZQUNMLENBQUMsQ0FBQyxJQUFJLEdBQUc7Z0JBQUMsSUFBSSxHQUFHO2dCQUFNO2FBQU07UUFDL0I7SUFDRjtJQUVBLFNBQVMsT0FDUCxHQUFXLEVBQ1gsR0FBWSxFQUNaLE1BQTBCLFNBQVM7UUFFbkMsSUFBSSxPQUFPLE1BQU0sYUFBYSxDQUFDLFdBQVcsS0FBSyxNQUFNO1lBQ25ELElBQUksTUFBTSxVQUFVLEtBQUssS0FBSyxTQUFTLE9BQU87UUFDaEQ7UUFFQSxNQUFNLFFBQVEsQ0FBQyxJQUFJLE1BQU0sU0FBUyxRQUFRLFNBQVMsT0FBTyxPQUFPLE9BQU87UUFDeEUsT0FBTyxNQUFNLElBQUksTUFBTSxNQUFNO1FBRTdCLE1BQU0sUUFBUSxJQUFJLFNBQVM7UUFDM0IsSUFBSSxPQUFPO1lBQ1QsS0FBSyxNQUFNLEtBQUssTUFBTztnQkFDckIsT0FBTyxNQUFNLEVBQUUsTUFBTSxNQUFNO1lBQzdCO1FBQ0Y7SUFDRjtJQUVBLFNBQVMsZUFBZSxHQUFXO1FBQ2pDLE9BQU8sU0FBUyxTQUFTLEtBQUssS0FDNUIsQ0FBQyxJQUFNLE9BQU8sSUFBSSxNQUFNLE9BQU8sT0FBTztJQUUxQztJQUVBLEtBQUssTUFBTSxPQUFPLE9BQU8sS0FBSyxNQUFNLE9BQVE7UUFDMUMsT0FBTyxLQUFLLFFBQVEsQ0FBQyxJQUFJLEtBQUssWUFBWSxRQUFRLFFBQVEsQ0FBQyxJQUFJO0lBQ2pFO0lBRUEsSUFBSSxXQUFxQixFQUFFO0lBRTNCLHFDQUFxQztJQUNyQyxJQUFJLEtBQUssU0FBUyxPQUFPO1FBQ3ZCLFdBQVcsS0FBSyxNQUFNLEtBQUssUUFBUSxRQUFRO1FBQzNDLE9BQU8sS0FBSyxNQUFNLEdBQUcsS0FBSyxRQUFRO0lBQ3BDO0lBRUEsSUFBSyxJQUFJLElBQUksR0FBRyxJQUFJLEtBQUssUUFBUSxJQUFLO1FBQ3BDLE1BQU0sTUFBTSxJQUFJLENBQUMsRUFBRTtRQUVuQixJQUFJLFNBQVMsS0FBSyxNQUFNO1lBQ3RCLE1BQU0sSUFBSSxJQUFJLE1BQU07WUFDcEIsT0FBTyxLQUFLO1lBQ1osTUFBTSxHQUFHLEtBQUssTUFBTSxHQUFHO1lBRXZCLElBQUksTUFBTSxLQUFLLENBQUMsSUFBSSxFQUFFO2dCQUNwQixNQUFNLGVBQWUsVUFBVTtnQkFDL0IsT0FBTyxLQUFLLGNBQWM7WUFDNUIsT0FBTztnQkFDTCxPQUFPLEtBQUssT0FBTztZQUNyQjtRQUNGLE9BQU8sSUFBSSxXQUFXLEtBQUssTUFBTTtZQUMvQixNQUFNLElBQUksSUFBSSxNQUFNO1lBQ3BCLE9BQU8sS0FBSztZQUNaLE9BQU8sQ0FBQyxDQUFDLEVBQUUsRUFBRSxPQUFPO1FBQ3RCLE9BQU8sSUFBSSxRQUFRLEtBQUssTUFBTTtZQUM1QixNQUFNLElBQUksSUFBSSxNQUFNO1lBQ3BCLE9BQU8sS0FBSztZQUNaLE1BQU0sR0FBRyxJQUFJLEdBQUc7WUFDaEIsTUFBTSxPQUFPLElBQUksQ0FBQyxJQUFJLEVBQUU7WUFDeEIsSUFDRSxTQUFTLGFBQ1QsQ0FBQyxLQUFLLEtBQUssU0FDWCxDQUFDLElBQUksTUFBTSxPQUFPLFFBQ2xCLENBQUMsTUFBTSxZQUNQLENBQUMsSUFBSSxTQUFTLE9BQU8sQ0FBQyxlQUFlLE9BQU8sSUFBSSxHQUNoRDtnQkFDQSxPQUFPLEtBQUssTUFBTTtnQkFDbEI7WUFDRixPQUFPLElBQUksaUJBQWlCLEtBQUssT0FBTztnQkFDdEMsT0FBTyxLQUFLLFNBQVMsUUFBUTtnQkFDN0I7WUFDRixPQUFPO2dCQUNMLE9BQU8sS0FBSyxJQUFJLE1BQU0sU0FBUyxPQUFPLEtBQUssTUFBTTtZQUNuRDtRQUNGLE9BQU8sSUFBSSxVQUFVLEtBQUssTUFBTTtZQUM5QixNQUFNLFVBQVUsSUFBSSxNQUFNLEdBQUcsQ0FBQyxHQUFHLE1BQU07WUFFdkMsSUFBSSxTQUFTO1lBQ2IsSUFBSyxJQUFJLElBQUksR0FBRyxJQUFJLFFBQVEsUUFBUSxJQUFLO2dCQUN2QyxNQUFNLE9BQU8sSUFBSSxNQUFNLElBQUk7Z0JBRTNCLElBQUksU0FBUyxLQUFLO29CQUNoQixPQUFPLE9BQU8sQ0FBQyxFQUFFLEVBQUUsTUFBTTtvQkFDekI7Z0JBQ0Y7Z0JBRUEsSUFBSSxXQUFXLEtBQUssT0FBTyxDQUFDLEVBQUUsS0FBSyxJQUFJLEtBQUssT0FBTztvQkFDakQsT0FBTyxPQUFPLENBQUMsRUFBRSxFQUFFLEtBQUssTUFBTSxRQUFRLENBQUMsRUFBRSxFQUFFO29CQUMzQyxTQUFTO29CQUNUO2dCQUNGO2dCQUVBLElBQ0UsV0FBVyxLQUFLLE9BQU8sQ0FBQyxFQUFFLEtBQzFCLDBCQUEwQixLQUFLLE9BQy9CO29CQUNBLE9BQU8sT0FBTyxDQUFDLEVBQUUsRUFBRSxNQUFNO29CQUN6QixTQUFTO29CQUNUO2dCQUNGO2dCQUVBLElBQUksT0FBTyxDQUFDLElBQUksRUFBRSxJQUFJLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxNQUFNLE9BQU87b0JBQ2hELE9BQU8sT0FBTyxDQUFDLEVBQUUsRUFBRSxJQUFJLE1BQU0sSUFBSSxJQUFJO29CQUNyQyxTQUFTO29CQUNUO2dCQUNGLE9BQU87b0JBQ0wsT0FBTyxPQUFPLENBQUMsRUFBRSxFQUFFLElBQUksTUFBTSxTQUFTLE9BQU8sQ0FBQyxFQUFFLElBQUksS0FBSyxNQUFNO2dCQUNqRTtZQUNGO1lBRUEsTUFBTSxDQUFDLElBQUksR0FBRyxJQUFJLE1BQU0sQ0FBQztZQUN6QixJQUFJLENBQUMsVUFBVSxRQUFRLEtBQUs7Z0JBQzFCLElBQ0UsSUFBSSxDQUFDLElBQUksRUFBRSxJQUNYLENBQUMsY0FBYyxLQUFLLElBQUksQ0FBQyxJQUFJLEVBQUUsS0FDL0IsQ0FBQyxJQUFJLE1BQU0sT0FBTyxRQUNsQixDQUFDLElBQUksU0FBUyxPQUFPLENBQUMsZUFBZSxPQUFPLElBQUksR0FDaEQ7b0JBQ0EsT0FBTyxLQUFLLElBQUksQ0FBQyxJQUFJLEVBQUUsRUFBRTtvQkFDekI7Z0JBQ0YsT0FBTyxJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxpQkFBaUIsS0FBSyxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUc7b0JBQzVELE9BQU8sS0FBSyxJQUFJLENBQUMsSUFBSSxFQUFFLEtBQUssUUFBUTtvQkFDcEM7Z0JBQ0YsT0FBTztvQkFDTCxPQUFPLEtBQUssSUFBSSxNQUFNLFNBQVMsT0FBTyxLQUFLLE1BQU07Z0JBQ25EO1lBQ0Y7UUFDRixPQUFPO1lBQ0wsSUFBSSxDQUFDLE1BQU0sYUFBYSxNQUFNLFVBQVUsU0FBUyxPQUFPO2dCQUN0RCxLQUFLLEVBQUUsS0FBSyxNQUFNLE9BQU8sQ0FBQyxJQUFJLElBQUksQ0FBQyxTQUFTLE9BQU8sTUFBTSxPQUFPO1lBQ2xFO1lBQ0EsSUFBSSxXQUFXO2dCQUNiLEtBQUssRUFBRSxRQUFRLEtBQUssTUFBTSxJQUFJO2dCQUM5QjtZQUNGO1FBQ0Y7SUFDRjtJQUVBLEtBQUssTUFBTSxPQUFPLE9BQU8sS0FBSyxVQUFXO1FBQ3ZDLElBQUksQ0FBQyxPQUFPLE1BQU0sSUFBSSxNQUFNLE9BQU87WUFDakMsT0FBTyxNQUFNLElBQUksTUFBTSxNQUFNLFFBQVEsQ0FBQyxJQUFJO1lBRTFDLElBQUksT0FBTyxDQUFDLElBQUksRUFBRTtnQkFDaEIsS0FBSyxNQUFNLEtBQUssT0FBTyxDQUFDLElBQUksQ0FBRTtvQkFDNUIsT0FBTyxNQUFNLEVBQUUsTUFBTSxNQUFNLFFBQVEsQ0FBQyxJQUFJO2dCQUMxQztZQUNGO1FBQ0Y7SUFDRjtJQUVBLElBQUksWUFBWTtRQUNkLElBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRTtRQUNmLEtBQUssTUFBTSxPQUFPLFNBQVU7WUFDMUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLO1FBQ2xCO0lBQ0YsT0FBTztRQUNMLEtBQUssTUFBTSxPQUFPLFNBQVU7WUFDMUIsS0FBSyxFQUFFLEtBQUs7UUFDZDtJQUNGO0lBRUEsT0FBTztBQUNUIn0=