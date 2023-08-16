import { errorUtil } from "./helpers/errorUtil.ts";
import { addIssueToContext, getParsedType, INVALID, isAborted, isAsync, isDirty, isValid, makeIssue, OK, ParseStatus, ZodParsedType } from "./helpers/parseUtil.ts";
import { util } from "./helpers/util.ts";
import { defaultErrorMap, overrideErrorMap, ZodError, ZodIssueCode } from "./ZodError.ts";
class ParseInputLazyPath {
    parent;
    data;
    _path;
    _key;
    constructor(parent, value, path, key){
        this.parent = parent;
        this.data = value;
        this._path = path;
        this._key = key;
    }
    get path() {
        return this._path.concat(this._key);
    }
}
const handleResult = (ctx, result)=>{
    if (isValid(result)) {
        return {
            success: true,
            data: result.value
        };
    } else {
        if (!ctx.common.issues.length) {
            throw new Error("Validation failed but no issues detected.");
        }
        const error = new ZodError(ctx.common.issues);
        return {
            success: false,
            error
        };
    }
};
function processCreateParams(params) {
    if (!params) return {};
    const { errorMap , invalid_type_error , required_error , description  } = params;
    if (errorMap && (invalid_type_error || required_error)) {
        throw new Error(`Can't use "invalid" or "required" in conjunction with custom error map.`);
    }
    if (errorMap) return {
        errorMap: errorMap,
        description
    };
    const customMap = (iss, ctx)=>{
        if (iss.code !== "invalid_type") return {
            message: ctx.defaultError
        };
        if (typeof ctx.data === "undefined" && required_error) return {
            message: required_error
        };
        if (params.invalid_type_error) return {
            message: params.invalid_type_error
        };
        return {
            message: ctx.defaultError
        };
    };
    return {
        errorMap: customMap,
        description
    };
}
export class ZodType {
    _type;
    _output;
    _input;
    _def;
    get description() {
        return this._def.description;
    }
    _getType(input) {
        return getParsedType(input.data);
    }
    _getOrReturnCtx(input, ctx) {
        return ctx || {
            common: input.parent.common,
            data: input.data,
            parsedType: getParsedType(input.data),
            schemaErrorMap: this._def.errorMap,
            path: input.path,
            parent: input.parent
        };
    }
    _processInputParams(input) {
        return {
            status: new ParseStatus(),
            ctx: {
                common: input.parent.common,
                data: input.data,
                parsedType: getParsedType(input.data),
                schemaErrorMap: this._def.errorMap,
                path: input.path,
                parent: input.parent
            }
        };
    }
    _parseSync(input) {
        const result = this._parse(input);
        if (isAsync(result)) {
            throw new Error("Synchronous parse encountered promise.");
        }
        return result;
    }
    _parseAsync(input) {
        const result = this._parse(input);
        return Promise.resolve(result);
    }
    parse(data, params) {
        const result = this.safeParse(data, params);
        if (result.success) return result.data;
        throw result.error;
    }
    safeParse(data, params) {
        const ctx = {
            common: {
                issues: [],
                async: params?.async ?? false,
                contextualErrorMap: params?.errorMap
            },
            path: params?.path || [],
            schemaErrorMap: this._def.errorMap,
            parent: null,
            data,
            parsedType: getParsedType(data)
        };
        const result = this._parseSync({
            data,
            path: ctx.path,
            parent: ctx
        });
        return handleResult(ctx, result);
    }
    async parseAsync(data, params) {
        const result = await this.safeParseAsync(data, params);
        if (result.success) return result.data;
        throw result.error;
    }
    async safeParseAsync(data, params) {
        const ctx = {
            common: {
                issues: [],
                contextualErrorMap: params?.errorMap,
                async: true
            },
            path: params?.path || [],
            schemaErrorMap: this._def.errorMap,
            parent: null,
            data,
            parsedType: getParsedType(data)
        };
        const maybeAsyncResult = this._parse({
            data,
            path: [],
            parent: ctx
        });
        const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
        return handleResult(ctx, result);
    }
    /** Alias of safeParseAsync */ spa = this.safeParseAsync;
    refine(check, message) {
        const getIssueProperties = (val)=>{
            if (typeof message === "string" || typeof message === "undefined") {
                return {
                    message
                };
            } else if (typeof message === "function") {
                return message(val);
            } else {
                return message;
            }
        };
        return this._refinement((val, ctx)=>{
            const result = check(val);
            const setError = ()=>ctx.addIssue({
                    code: ZodIssueCode.custom,
                    ...getIssueProperties(val)
                });
            if (typeof Promise !== "undefined" && result instanceof Promise) {
                return result.then((data)=>{
                    if (!data) {
                        setError();
                        return false;
                    } else {
                        return true;
                    }
                });
            }
            if (!result) {
                setError();
                return false;
            } else {
                return true;
            }
        });
    }
    refinement(check, refinementData) {
        return this._refinement((val, ctx)=>{
            if (!check(val)) {
                ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
                return false;
            } else {
                return true;
            }
        });
    }
    _refinement(refinement) {
        return new ZodEffects({
            schema: this,
            typeName: ZodFirstPartyTypeKind.ZodEffects,
            effect: {
                type: "refinement",
                refinement
            }
        });
    }
    superRefine = this._refinement;
    constructor(def){
        this._def = def;
        this.parse = this.parse.bind(this);
        this.safeParse = this.safeParse.bind(this);
        this.parseAsync = this.parseAsync.bind(this);
        this.safeParseAsync = this.safeParseAsync.bind(this);
        this.spa = this.spa.bind(this);
        this.refine = this.refine.bind(this);
        this.refinement = this.refinement.bind(this);
        this.superRefine = this.superRefine.bind(this);
        this.optional = this.optional.bind(this);
        this.nullable = this.nullable.bind(this);
        this.nullish = this.nullish.bind(this);
        this.array = this.array.bind(this);
        this.promise = this.promise.bind(this);
        this.or = this.or.bind(this);
        this.and = this.and.bind(this);
        this.transform = this.transform.bind(this);
        this.default = this.default.bind(this);
        this.describe = this.describe.bind(this);
        this.isNullable = this.isNullable.bind(this);
        this.isOptional = this.isOptional.bind(this);
    }
    optional() {
        "";
        "asdf";
        return ZodOptional.create(this);
    }
    nullable() {
        return ZodNullable.create(this);
    }
    nullish() {
        return this.optional().nullable();
    }
    array() {
        return ZodArray.create(this);
    }
    promise() {
        return ZodPromise.create(this);
    }
    or(option) {
        return ZodUnion.create([
            this,
            option
        ]);
    }
    and(incoming) {
        return ZodIntersection.create(this, incoming);
    }
    transform(transform) {
        return new ZodEffects({
            schema: this,
            typeName: ZodFirstPartyTypeKind.ZodEffects,
            effect: {
                type: "transform",
                transform
            }
        });
    }
    default(def) {
        const defaultValueFunc = typeof def === "function" ? def : ()=>def;
        return new ZodDefault({
            innerType: this,
            defaultValue: defaultValueFunc,
            typeName: ZodFirstPartyTypeKind.ZodDefault
        });
    }
    describe(description) {
        const This = this.constructor;
        return new This({
            ...this._def,
            description
        });
    }
    isOptional() {
        return this.safeParse(undefined).success;
    }
    isNullable() {
        return this.safeParse(null).success;
    }
}
const cuidRegex = /^c[^\s-]{8,}$/i;
const uuidRegex = /^([a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12}|00000000-0000-0000-0000-000000000000)$/i;
// from https://stackoverflow.com/a/46181/1550155
// old version: too slow, didn't support unicode
// const emailRegex = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i;
// eslint-disable-next-line
const emailRegex = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
export class ZodString extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.string) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.string,
                received: ctx.parsedType
            });
            return INVALID;
        }
        const status = new ParseStatus();
        let ctx = undefined;
        for (const check of this._def.checks){
            if (check.kind === "min") {
                if (input.data.length < check.value) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_small,
                        minimum: check.value,
                        type: "string",
                        inclusive: true,
                        message: check.message
                    });
                    status.dirty();
                }
            } else if (check.kind === "max") {
                if (input.data.length > check.value) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_big,
                        maximum: check.value,
                        type: "string",
                        inclusive: true,
                        message: check.message
                    });
                    status.dirty();
                }
            } else if (check.kind === "email") {
                if (!emailRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "email",
                        code: ZodIssueCode.invalid_string,
                        message: check.message
                    });
                    status.dirty();
                }
            } else if (check.kind === "uuid") {
                if (!uuidRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "uuid",
                        code: ZodIssueCode.invalid_string,
                        message: check.message
                    });
                    status.dirty();
                }
            } else if (check.kind === "cuid") {
                if (!cuidRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "cuid",
                        code: ZodIssueCode.invalid_string,
                        message: check.message
                    });
                    status.dirty();
                }
            } else if (check.kind === "url") {
                try {
                    new URL(input.data);
                } catch  {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "url",
                        code: ZodIssueCode.invalid_string,
                        message: check.message
                    });
                    status.dirty();
                }
            } else if (check.kind === "regex") {
                check.regex.lastIndex = 0;
                const testResult = check.regex.test(input.data);
                if (!testResult) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "regex",
                        code: ZodIssueCode.invalid_string,
                        message: check.message
                    });
                    status.dirty();
                }
            }
        }
        return {
            status: status.value,
            value: input.data
        };
    }
    _regex = (regex, validation, message)=>this.refinement((data)=>regex.test(data), {
            validation,
            code: ZodIssueCode.invalid_string,
            ...errorUtil.errToObj(message)
        });
    _addCheck(check) {
        return new ZodString({
            ...this._def,
            checks: [
                ...this._def.checks,
                check
            ]
        });
    }
    email(message) {
        return this._addCheck({
            kind: "email",
            ...errorUtil.errToObj(message)
        });
    }
    url(message) {
        return this._addCheck({
            kind: "url",
            ...errorUtil.errToObj(message)
        });
    }
    uuid(message) {
        return this._addCheck({
            kind: "uuid",
            ...errorUtil.errToObj(message)
        });
    }
    cuid(message) {
        return this._addCheck({
            kind: "cuid",
            ...errorUtil.errToObj(message)
        });
    }
    regex(regex, message) {
        return this._addCheck({
            kind: "regex",
            regex: regex,
            ...errorUtil.errToObj(message)
        });
    }
    min(minLength, message) {
        return this._addCheck({
            kind: "min",
            value: minLength,
            ...errorUtil.errToObj(message)
        });
    }
    max(maxLength, message) {
        return this._addCheck({
            kind: "max",
            value: maxLength,
            ...errorUtil.errToObj(message)
        });
    }
    length(len, message) {
        return this.min(len, message).max(len, message);
    }
    /**
   * Deprecated.
   * Use z.string().min(1) instead.
   */ nonempty = (message)=>this.min(1, errorUtil.errToObj(message));
    get isEmail() {
        return !!this._def.checks.find((ch)=>ch.kind === "email");
    }
    get isURL() {
        return !!this._def.checks.find((ch)=>ch.kind === "url");
    }
    get isUUID() {
        return !!this._def.checks.find((ch)=>ch.kind === "uuid");
    }
    get isCUID() {
        return !!this._def.checks.find((ch)=>ch.kind === "cuid");
    }
    get minLength() {
        let min = -Infinity;
        this._def.checks.map((ch)=>{
            if (ch.kind === "min") {
                if (min === null || ch.value > min) {
                    min = ch.value;
                }
            }
        });
        return min;
    }
    get maxLength() {
        let max = null;
        this._def.checks.map((ch)=>{
            if (ch.kind === "max") {
                if (max === null || ch.value < max) {
                    max = ch.value;
                }
            }
        });
        return max;
    }
    static create = (params)=>{
        return new ZodString({
            checks: [],
            typeName: ZodFirstPartyTypeKind.ZodString,
            ...processCreateParams(params)
        });
    };
}
// https://stackoverflow.com/questions/3966484/why-does-modulus-operator-return-fractional-number-in-javascript/31711034#31711034
function floatSafeRemainder(val, step) {
    const valDecCount = (val.toString().split(".")[1] || "").length;
    const stepDecCount = (step.toString().split(".")[1] || "").length;
    const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
    const valInt = parseInt(val.toFixed(decCount).replace(".", ""));
    const stepInt = parseInt(step.toFixed(decCount).replace(".", ""));
    return valInt % stepInt / Math.pow(10, decCount);
}
export class ZodNumber extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.number) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.number,
                received: ctx.parsedType
            });
            return INVALID;
        }
        let ctx = undefined;
        const status = new ParseStatus();
        for (const check of this._def.checks){
            if (check.kind === "int") {
                if (!util.isInteger(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.invalid_type,
                        expected: "integer",
                        received: "float",
                        message: check.message
                    });
                    status.dirty();
                }
            } else if (check.kind === "min") {
                const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
                if (tooSmall) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_small,
                        minimum: check.value,
                        type: "number",
                        inclusive: check.inclusive,
                        message: check.message
                    });
                    status.dirty();
                }
            } else if (check.kind === "max") {
                const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
                if (tooBig) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_big,
                        maximum: check.value,
                        type: "number",
                        inclusive: check.inclusive,
                        message: check.message
                    });
                    status.dirty();
                }
            } else if (check.kind === "multipleOf") {
                if (floatSafeRemainder(input.data, check.value) !== 0) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.not_multiple_of,
                        multipleOf: check.value,
                        message: check.message
                    });
                    status.dirty();
                }
            } else {
                util.assertNever(check);
            }
        }
        return {
            status: status.value,
            value: input.data
        };
    }
    static create = (params)=>{
        return new ZodNumber({
            checks: [],
            typeName: ZodFirstPartyTypeKind.ZodNumber,
            ...processCreateParams(params)
        });
    };
    gte(value, message) {
        return this.setLimit("min", value, true, errorUtil.toString(message));
    }
    min = this.gte;
    gt(value, message) {
        return this.setLimit("min", value, false, errorUtil.toString(message));
    }
    lte(value, message) {
        return this.setLimit("max", value, true, errorUtil.toString(message));
    }
    max = this.lte;
    lt(value, message) {
        return this.setLimit("max", value, false, errorUtil.toString(message));
    }
    setLimit(kind, value, inclusive, message) {
        return new ZodNumber({
            ...this._def,
            checks: [
                ...this._def.checks,
                {
                    kind,
                    value,
                    inclusive,
                    message: errorUtil.toString(message)
                }
            ]
        });
    }
    _addCheck(check) {
        return new ZodNumber({
            ...this._def,
            checks: [
                ...this._def.checks,
                check
            ]
        });
    }
    int(message) {
        return this._addCheck({
            kind: "int",
            message: errorUtil.toString(message)
        });
    }
    positive(message) {
        return this._addCheck({
            kind: "min",
            value: 0,
            inclusive: false,
            message: errorUtil.toString(message)
        });
    }
    negative(message) {
        return this._addCheck({
            kind: "max",
            value: 0,
            inclusive: false,
            message: errorUtil.toString(message)
        });
    }
    nonpositive(message) {
        return this._addCheck({
            kind: "max",
            value: 0,
            inclusive: true,
            message: errorUtil.toString(message)
        });
    }
    nonnegative(message) {
        return this._addCheck({
            kind: "min",
            value: 0,
            inclusive: true,
            message: errorUtil.toString(message)
        });
    }
    multipleOf(value, message) {
        return this._addCheck({
            kind: "multipleOf",
            value: value,
            message: errorUtil.toString(message)
        });
    }
    step = this.multipleOf;
    get minValue() {
        let min = null;
        for (const ch of this._def.checks){
            if (ch.kind === "min") {
                if (min === null || ch.value > min) min = ch.value;
            }
        }
        return min;
    }
    get maxValue() {
        let max = null;
        for (const ch of this._def.checks){
            if (ch.kind === "max") {
                if (max === null || ch.value < max) max = ch.value;
            }
        }
        return max;
    }
    get isInt() {
        return !!this._def.checks.find((ch)=>ch.kind === "int");
    }
}
export class ZodBigInt extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.bigint) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.bigint,
                received: ctx.parsedType
            });
            return INVALID;
        }
        return OK(input.data);
    }
    static create = (params)=>{
        return new ZodBigInt({
            typeName: ZodFirstPartyTypeKind.ZodBigInt,
            ...processCreateParams(params)
        });
    };
}
export class ZodBoolean extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.boolean) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.boolean,
                received: ctx.parsedType
            });
            return INVALID;
        }
        return OK(input.data);
    }
    static create = (params)=>{
        return new ZodBoolean({
            typeName: ZodFirstPartyTypeKind.ZodBoolean,
            ...processCreateParams(params)
        });
    };
}
export class ZodDate extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.date) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.date,
                received: ctx.parsedType
            });
            return INVALID;
        }
        if (isNaN(input.data.getTime())) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_date
            });
            return INVALID;
        }
        return {
            status: "valid",
            value: new Date(input.data.getTime())
        };
    }
    static create = (params)=>{
        return new ZodDate({
            typeName: ZodFirstPartyTypeKind.ZodDate,
            ...processCreateParams(params)
        });
    };
}
export class ZodUndefined extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.undefined) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.undefined,
                received: ctx.parsedType
            });
            return INVALID;
        }
        return OK(input.data);
    }
    params;
    static create = (params)=>{
        return new ZodUndefined({
            typeName: ZodFirstPartyTypeKind.ZodUndefined,
            ...processCreateParams(params)
        });
    };
}
export class ZodNull extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.null) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.null,
                received: ctx.parsedType
            });
            return INVALID;
        }
        return OK(input.data);
    }
    static create = (params)=>{
        return new ZodNull({
            typeName: ZodFirstPartyTypeKind.ZodNull,
            ...processCreateParams(params)
        });
    };
}
export class ZodAny extends ZodType {
    // to prevent instances of other classes from extending ZodAny. this causes issues with catchall in ZodObject.
    _any = true;
    _parse(input) {
        return OK(input.data);
    }
    static create = (params)=>{
        return new ZodAny({
            typeName: ZodFirstPartyTypeKind.ZodAny,
            ...processCreateParams(params)
        });
    };
}
export class ZodUnknown extends ZodType {
    // required
    _unknown = true;
    _parse(input) {
        return OK(input.data);
    }
    static create = (params)=>{
        return new ZodUnknown({
            typeName: ZodFirstPartyTypeKind.ZodUnknown,
            ...processCreateParams(params)
        });
    };
}
export class ZodNever extends ZodType {
    _parse(input) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.never,
            received: ctx.parsedType
        });
        return INVALID;
    }
    static create = (params)=>{
        return new ZodNever({
            typeName: ZodFirstPartyTypeKind.ZodNever,
            ...processCreateParams(params)
        });
    };
}
export class ZodVoid extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.undefined) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.void,
                received: ctx.parsedType
            });
            return INVALID;
        }
        return OK(input.data);
    }
    static create = (params)=>{
        return new ZodVoid({
            typeName: ZodFirstPartyTypeKind.ZodVoid,
            ...processCreateParams(params)
        });
    };
}
export class ZodArray extends ZodType {
    _parse(input) {
        const { ctx , status  } = this._processInputParams(input);
        const def = this._def;
        if (ctx.parsedType !== ZodParsedType.array) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.array,
                received: ctx.parsedType
            });
            return INVALID;
        }
        if (def.minLength !== null) {
            if (ctx.data.length < def.minLength.value) {
                addIssueToContext(ctx, {
                    code: ZodIssueCode.too_small,
                    minimum: def.minLength.value,
                    type: "array",
                    inclusive: true,
                    message: def.minLength.message
                });
                status.dirty();
            }
        }
        if (def.maxLength !== null) {
            if (ctx.data.length > def.maxLength.value) {
                addIssueToContext(ctx, {
                    code: ZodIssueCode.too_big,
                    maximum: def.maxLength.value,
                    type: "array",
                    inclusive: true,
                    message: def.maxLength.message
                });
                status.dirty();
            }
        }
        if (ctx.common.async) {
            return Promise.all(ctx.data.map((item, i)=>{
                return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
            })).then((result)=>{
                return ParseStatus.mergeArray(status, result);
            });
        }
        const result = ctx.data.map((item, i)=>{
            return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
        });
        return ParseStatus.mergeArray(status, result);
    }
    get element() {
        return this._def.type;
    }
    min(minLength, message) {
        return new ZodArray({
            ...this._def,
            minLength: {
                value: minLength,
                message: errorUtil.toString(message)
            }
        });
    }
    max(maxLength, message) {
        return new ZodArray({
            ...this._def,
            maxLength: {
                value: maxLength,
                message: errorUtil.toString(message)
            }
        });
    }
    length(len, message) {
        return this.min(len, message).max(len, message);
    }
    nonempty(message) {
        return this.min(1, message);
    }
    static create = (schema, params)=>{
        return new ZodArray({
            type: schema,
            minLength: null,
            maxLength: null,
            typeName: ZodFirstPartyTypeKind.ZodArray,
            ...processCreateParams(params)
        });
    };
}
/////////////////////////////////////////
/////////////////////////////////////////
//////////                     //////////
//////////      ZodObject      //////////
//////////                     //////////
/////////////////////////////////////////
/////////////////////////////////////////
export var objectUtil;
(function(objectUtil) {
    var mergeShapes = objectUtil.mergeShapes = (first, second)=>{
        return {
            ...first,
            ...second
        };
    };
})(objectUtil || (objectUtil = {}));
const AugmentFactory = (def)=>(augmentation)=>{
        return new ZodObject({
            ...def,
            shape: ()=>({
                    ...def.shape(),
                    ...augmentation
                })
        });
    };
function deepPartialify(schema) {
    if (schema instanceof ZodObject) {
        const newShape = {};
        for(const key in schema.shape){
            const fieldSchema = schema.shape[key];
            newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
        }
        return new ZodObject({
            ...schema._def,
            shape: ()=>newShape
        });
    } else if (schema instanceof ZodArray) {
        return ZodArray.create(deepPartialify(schema.element));
    } else if (schema instanceof ZodOptional) {
        return ZodOptional.create(deepPartialify(schema.unwrap()));
    } else if (schema instanceof ZodNullable) {
        return ZodNullable.create(deepPartialify(schema.unwrap()));
    } else if (schema instanceof ZodTuple) {
        return ZodTuple.create(schema.items.map((item)=>deepPartialify(item)));
    } else {
        return schema;
    }
}
export class ZodObject extends ZodType {
    _shape;
    _unknownKeys;
    _catchall;
    _cached = null;
    _getCached() {
        if (this._cached !== null) return this._cached;
        const shape = this._def.shape();
        const keys = util.objectKeys(shape);
        return this._cached = {
            shape,
            keys
        };
    }
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.object) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.object,
                received: ctx.parsedType
            });
            return INVALID;
        }
        const { status , ctx  } = this._processInputParams(input);
        const { shape , keys: shapeKeys  } = this._getCached();
        const extraKeys = [];
        for(const key in ctx.data){
            if (!shapeKeys.includes(key)) {
                extraKeys.push(key);
            }
        }
        const pairs = [];
        for (const key of shapeKeys){
            const keyValidator = shape[key];
            const value = ctx.data[key];
            pairs.push({
                key: {
                    status: "valid",
                    value: key
                },
                value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
                alwaysSet: key in ctx.data
            });
        }
        if (this._def.catchall instanceof ZodNever) {
            const unknownKeys = this._def.unknownKeys;
            if (unknownKeys === "passthrough") {
                for (const key of extraKeys){
                    pairs.push({
                        key: {
                            status: "valid",
                            value: key
                        },
                        value: {
                            status: "valid",
                            value: ctx.data[key]
                        }
                    });
                }
            } else if (unknownKeys === "strict") {
                if (extraKeys.length > 0) {
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.unrecognized_keys,
                        keys: extraKeys
                    });
                    status.dirty();
                }
            } else if (unknownKeys === "strip") {} else {
                throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
            }
        } else {
            // run catchall validation
            const catchall = this._def.catchall;
            for (const key of extraKeys){
                const value = ctx.data[key];
                pairs.push({
                    key: {
                        status: "valid",
                        value: key
                    },
                    value: catchall._parse(new ParseInputLazyPath(ctx, value, ctx.path, key) //, ctx.child(key), value, getParsedType(value)
                    ),
                    alwaysSet: key in ctx.data
                });
            }
        }
        if (ctx.common.async) {
            return Promise.resolve().then(async ()=>{
                const syncPairs = [];
                for (const pair of pairs){
                    const key = await pair.key;
                    syncPairs.push({
                        key,
                        value: await pair.value,
                        alwaysSet: pair.alwaysSet
                    });
                }
                return syncPairs;
            }).then((syncPairs)=>{
                return ParseStatus.mergeObjectSync(status, syncPairs);
            });
        } else {
            return ParseStatus.mergeObjectSync(status, pairs);
        }
    }
    get shape() {
        return this._def.shape();
    }
    strict(message) {
        errorUtil.errToObj;
        return new ZodObject({
            ...this._def,
            unknownKeys: "strict",
            ...message !== undefined ? {
                errorMap: (issue, ctx)=>{
                    const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
                    if (issue.code === "unrecognized_keys") return {
                        message: errorUtil.errToObj(message).message ?? defaultError
                    };
                    return {
                        message: defaultError
                    };
                }
            } : {}
        });
    }
    strip() {
        return new ZodObject({
            ...this._def,
            unknownKeys: "strip"
        });
    }
    passthrough() {
        return new ZodObject({
            ...this._def,
            unknownKeys: "passthrough"
        });
    }
    /**
   * @deprecated In most cases, this is no longer needed - unknown properties are now silently stripped.
   * If you want to pass through unknown properties, use `.passthrough()` instead.
   */ nonstrict = this.passthrough;
    augment = AugmentFactory(this._def);
    extend = AugmentFactory(this._def);
    setKey(key, schema) {
        return this.augment({
            [key]: schema
        });
    }
    /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */ merge(merging) {
        // const mergedShape = objectUtil.mergeShapes(
        //   this._def.shape(),
        //   merging._def.shape()
        // );
        const merged = new ZodObject({
            unknownKeys: merging._def.unknownKeys,
            catchall: merging._def.catchall,
            shape: ()=>objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
            typeName: ZodFirstPartyTypeKind.ZodObject
        });
        return merged;
    }
    catchall(index) {
        return new ZodObject({
            ...this._def,
            catchall: index
        });
    }
    pick(mask) {
        const shape = {};
        util.objectKeys(mask).map((key)=>{
            shape[key] = this.shape[key];
        });
        return new ZodObject({
            ...this._def,
            shape: ()=>shape
        });
    }
    omit(mask) {
        const shape = {};
        util.objectKeys(this.shape).map((key)=>{
            if (util.objectKeys(mask).indexOf(key) === -1) {
                shape[key] = this.shape[key];
            }
        });
        return new ZodObject({
            ...this._def,
            shape: ()=>shape
        });
    }
    deepPartial() {
        return deepPartialify(this);
    }
    partial(mask) {
        const newShape = {};
        if (mask) {
            util.objectKeys(this.shape).map((key)=>{
                if (util.objectKeys(mask).indexOf(key) === -1) {
                    newShape[key] = this.shape[key];
                } else {
                    newShape[key] = this.shape[key].optional();
                }
            });
            return new ZodObject({
                ...this._def,
                shape: ()=>newShape
            });
        } else {
            for(const key in this.shape){
                const fieldSchema = this.shape[key];
                newShape[key] = fieldSchema.optional();
            }
        }
        return new ZodObject({
            ...this._def,
            shape: ()=>newShape
        });
    }
    required() {
        const newShape = {};
        for(const key in this.shape){
            const fieldSchema = this.shape[key];
            let newField = fieldSchema;
            while(newField instanceof ZodOptional){
                newField = newField._def.innerType;
            }
            newShape[key] = newField;
        }
        return new ZodObject({
            ...this._def,
            shape: ()=>newShape
        });
    }
    static create = (shape, params)=>{
        return new ZodObject({
            shape: ()=>shape,
            unknownKeys: "strip",
            catchall: ZodNever.create(),
            typeName: ZodFirstPartyTypeKind.ZodObject,
            ...processCreateParams(params)
        });
    };
    static strictCreate = (shape, params)=>{
        return new ZodObject({
            shape: ()=>shape,
            unknownKeys: "strict",
            catchall: ZodNever.create(),
            typeName: ZodFirstPartyTypeKind.ZodObject,
            ...processCreateParams(params)
        });
    };
    static lazycreate = (shape, params)=>{
        return new ZodObject({
            shape,
            unknownKeys: "strip",
            catchall: ZodNever.create(),
            typeName: ZodFirstPartyTypeKind.ZodObject,
            ...processCreateParams(params)
        });
    };
}
export class ZodUnion extends ZodType {
    _parse(input) {
        const { ctx  } = this._processInputParams(input);
        const options = this._def.options;
        function handleResults(results) {
            // return first issue-free validation if it exists
            for (const result of results){
                if (result.result.status === "valid") {
                    return result.result;
                }
            }
            for (const result of results){
                if (result.result.status === "dirty") {
                    // add issues from dirty option
                    ctx.common.issues.push(...result.ctx.common.issues);
                    return result.result;
                }
            }
            // return invalid
            const unionErrors = results.map((result)=>new ZodError(result.ctx.common.issues));
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_union,
                unionErrors
            });
            return INVALID;
        }
        if (ctx.common.async) {
            return Promise.all(options.map(async (option)=>{
                const childCtx = {
                    ...ctx,
                    common: {
                        ...ctx.common,
                        issues: []
                    },
                    parent: null
                };
                return {
                    result: await option._parseAsync({
                        data: ctx.data,
                        path: ctx.path,
                        parent: childCtx
                    }),
                    ctx: childCtx
                };
            })).then(handleResults);
        } else {
            let dirty = undefined;
            const issues = [];
            for (const option of options){
                const childCtx = {
                    ...ctx,
                    common: {
                        ...ctx.common,
                        issues: []
                    },
                    parent: null
                };
                const result = option._parseSync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: childCtx
                });
                if (result.status === "valid") {
                    return result;
                } else if (result.status === "dirty" && !dirty) {
                    dirty = {
                        result,
                        ctx: childCtx
                    };
                }
                if (childCtx.common.issues.length) {
                    issues.push(childCtx.common.issues);
                }
            }
            if (dirty) {
                ctx.common.issues.push(...dirty.ctx.common.issues);
                return dirty.result;
            }
            const unionErrors = issues.map((issues)=>new ZodError(issues));
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_union,
                unionErrors
            });
            return INVALID;
        }
    }
    get options() {
        return this._def.options;
    }
    static create = (types, params)=>{
        return new ZodUnion({
            options: types,
            typeName: ZodFirstPartyTypeKind.ZodUnion,
            ...processCreateParams(params)
        });
    };
}
export class ZodDiscriminatedUnion extends ZodType {
    _parse(input) {
        const { ctx  } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.object) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.object,
                received: ctx.parsedType
            });
            return INVALID;
        }
        const discriminator = this.discriminator;
        const discriminatorValue = ctx.data[discriminator];
        const option = this.options.get(discriminatorValue);
        if (!option) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_union_discriminator,
                options: this.validDiscriminatorValues,
                path: [
                    discriminator
                ]
            });
            return INVALID;
        }
        if (ctx.common.async) {
            return option._parseAsync({
                data: ctx.data,
                path: ctx.path,
                parent: ctx
            });
        } else {
            return option._parseSync({
                data: ctx.data,
                path: ctx.path,
                parent: ctx
            });
        }
    }
    get discriminator() {
        return this._def.discriminator;
    }
    get validDiscriminatorValues() {
        return Array.from(this.options.keys());
    }
    get options() {
        return this._def.options;
    }
    /**
   * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
   * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
   * have a different value for each object in the union.
   * @param discriminator the name of the discriminator property
   * @param types an array of object schemas
   * @param params
   */ static create(discriminator, types, params) {
        // Get all the valid discriminator values
        const options = new Map();
        try {
            types.forEach((type)=>{
                const discriminatorValue = type.shape[discriminator].value;
                options.set(discriminatorValue, type);
            });
        } catch (e) {
            throw new Error("The discriminator value could not be extracted from all the provided schemas");
        }
        // Assert that all the discriminator values are unique
        if (options.size !== types.length) {
            throw new Error("Some of the discriminator values are not unique");
        }
        return new ZodDiscriminatedUnion({
            typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
            discriminator,
            options,
            ...processCreateParams(params)
        });
    }
}
function mergeValues(a, b) {
    const aType = getParsedType(a);
    const bType = getParsedType(b);
    if (a === b) {
        return {
            valid: true,
            data: a
        };
    } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
        const bKeys = util.objectKeys(b);
        const sharedKeys = util.objectKeys(a).filter((key)=>bKeys.indexOf(key) !== -1);
        const newObj = {
            ...a,
            ...b
        };
        for (const key of sharedKeys){
            const sharedValue = mergeValues(a[key], b[key]);
            if (!sharedValue.valid) {
                return {
                    valid: false
                };
            }
            newObj[key] = sharedValue.data;
        }
        return {
            valid: true,
            data: newObj
        };
    } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
        if (a.length !== b.length) {
            return {
                valid: false
            };
        }
        const newArray = [];
        for(let index = 0; index < a.length; index++){
            const itemA = a[index];
            const itemB = b[index];
            const sharedValue = mergeValues(itemA, itemB);
            if (!sharedValue.valid) {
                return {
                    valid: false
                };
            }
            newArray.push(sharedValue.data);
        }
        return {
            valid: true,
            data: newArray
        };
    } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
        return {
            valid: true,
            data: a
        };
    } else {
        return {
            valid: false
        };
    }
}
export class ZodIntersection extends ZodType {
    _parse(input) {
        const { status , ctx  } = this._processInputParams(input);
        const handleParsed = (parsedLeft, parsedRight)=>{
            if (isAborted(parsedLeft) || isAborted(parsedRight)) {
                return INVALID;
            }
            const merged = mergeValues(parsedLeft.value, parsedRight.value);
            if (!merged.valid) {
                addIssueToContext(ctx, {
                    code: ZodIssueCode.invalid_intersection_types
                });
                return INVALID;
            }
            if (isDirty(parsedLeft) || isDirty(parsedRight)) {
                status.dirty();
            }
            return {
                status: status.value,
                value: merged.data
            };
        };
        if (ctx.common.async) {
            return Promise.all([
                this._def.left._parseAsync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx
                }),
                this._def.right._parseAsync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx
                })
            ]).then(([left, right])=>handleParsed(left, right));
        } else {
            return handleParsed(this._def.left._parseSync({
                data: ctx.data,
                path: ctx.path,
                parent: ctx
            }), this._def.right._parseSync({
                data: ctx.data,
                path: ctx.path,
                parent: ctx
            }));
        }
    }
    static create = (left, right, params)=>{
        return new ZodIntersection({
            left: left,
            right: right,
            typeName: ZodFirstPartyTypeKind.ZodIntersection,
            ...processCreateParams(params)
        });
    };
}
export class ZodTuple extends ZodType {
    _parse(input) {
        const { status , ctx  } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.array) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.array,
                received: ctx.parsedType
            });
            return INVALID;
        }
        if (ctx.data.length < this._def.items.length) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.too_small,
                minimum: this._def.items.length,
                inclusive: true,
                type: "array"
            });
            return INVALID;
        }
        const rest = this._def.rest;
        if (!rest && ctx.data.length > this._def.items.length) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.too_big,
                maximum: this._def.items.length,
                inclusive: true,
                type: "array"
            });
            status.dirty();
        }
        const items = ctx.data.map((item, itemIndex)=>{
            const schema = this._def.items[itemIndex] || this._def.rest;
            if (!schema) return null;
            return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
        }).filter((x)=>!!x); // filter nulls
        if (ctx.common.async) {
            return Promise.all(items).then((results)=>{
                return ParseStatus.mergeArray(status, results);
            });
        } else {
            return ParseStatus.mergeArray(status, items);
        }
    }
    get items() {
        return this._def.items;
    }
    rest(rest) {
        return new ZodTuple({
            ...this._def,
            rest
        });
    }
    static create = (schemas, params)=>{
        return new ZodTuple({
            items: schemas,
            typeName: ZodFirstPartyTypeKind.ZodTuple,
            rest: null,
            ...processCreateParams(params)
        });
    };
}
export class ZodRecord extends ZodType {
    get keySchema() {
        return this._def.keyType;
    }
    get valueSchema() {
        return this._def.valueType;
    }
    _parse(input) {
        const { status , ctx  } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.object) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.object,
                received: ctx.parsedType
            });
            return INVALID;
        }
        const pairs = [];
        const keyType = this._def.keyType;
        const valueType = this._def.valueType;
        for(const key in ctx.data){
            pairs.push({
                key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
                value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key))
            });
        }
        if (ctx.common.async) {
            return ParseStatus.mergeObjectAsync(status, pairs);
        } else {
            return ParseStatus.mergeObjectSync(status, pairs);
        }
    }
    get element() {
        return this._def.valueType;
    }
    static create(first, second, third) {
        if (second instanceof ZodType) {
            return new ZodRecord({
                keyType: first,
                valueType: second,
                typeName: ZodFirstPartyTypeKind.ZodRecord,
                ...processCreateParams(third)
            });
        }
        return new ZodRecord({
            keyType: ZodString.create(),
            valueType: first,
            typeName: ZodFirstPartyTypeKind.ZodRecord,
            ...processCreateParams(second)
        });
    }
}
export class ZodMap extends ZodType {
    _parse(input) {
        const { status , ctx  } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.map) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.map,
                received: ctx.parsedType
            });
            return INVALID;
        }
        const keyType = this._def.keyType;
        const valueType = this._def.valueType;
        const pairs = [
            ...ctx.data.entries()
        ].map(([key, value], index)=>{
            return {
                key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [
                    index,
                    "key"
                ])),
                value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [
                    index,
                    "value"
                ]))
            };
        });
        if (ctx.common.async) {
            const finalMap = new Map();
            return Promise.resolve().then(async ()=>{
                for (const pair of pairs){
                    const key = await pair.key;
                    const value = await pair.value;
                    if (key.status === "aborted" || value.status === "aborted") {
                        return INVALID;
                    }
                    if (key.status === "dirty" || value.status === "dirty") {
                        status.dirty();
                    }
                    finalMap.set(key.value, value.value);
                }
                return {
                    status: status.value,
                    value: finalMap
                };
            });
        } else {
            const finalMap = new Map();
            for (const pair of pairs){
                const key = pair.key;
                const value = pair.value;
                if (key.status === "aborted" || value.status === "aborted") {
                    return INVALID;
                }
                if (key.status === "dirty" || value.status === "dirty") {
                    status.dirty();
                }
                finalMap.set(key.value, value.value);
            }
            return {
                status: status.value,
                value: finalMap
            };
        }
    }
    static create = (keyType, valueType, params)=>{
        return new ZodMap({
            valueType,
            keyType,
            typeName: ZodFirstPartyTypeKind.ZodMap,
            ...processCreateParams(params)
        });
    };
}
export class ZodSet extends ZodType {
    _parse(input) {
        const { status , ctx  } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.set) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.set,
                received: ctx.parsedType
            });
            return INVALID;
        }
        const def = this._def;
        if (def.minSize !== null) {
            if (ctx.data.size < def.minSize.value) {
                addIssueToContext(ctx, {
                    code: ZodIssueCode.too_small,
                    minimum: def.minSize.value,
                    type: "set",
                    inclusive: true,
                    message: def.minSize.message
                });
                status.dirty();
            }
        }
        if (def.maxSize !== null) {
            if (ctx.data.size > def.maxSize.value) {
                addIssueToContext(ctx, {
                    code: ZodIssueCode.too_big,
                    maximum: def.maxSize.value,
                    type: "set",
                    inclusive: true,
                    message: def.maxSize.message
                });
                status.dirty();
            }
        }
        const valueType = this._def.valueType;
        function finalizeSet(elements) {
            const parsedSet = new Set();
            for (const element of elements){
                if (element.status === "aborted") return INVALID;
                if (element.status === "dirty") status.dirty();
                parsedSet.add(element.value);
            }
            return {
                status: status.value,
                value: parsedSet
            };
        }
        const elements = [
            ...ctx.data.values()
        ].map((item, i)=>valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
        if (ctx.common.async) {
            return Promise.all(elements).then((elements)=>finalizeSet(elements));
        } else {
            return finalizeSet(elements);
        }
    }
    min(minSize, message) {
        return new ZodSet({
            ...this._def,
            minSize: {
                value: minSize,
                message: errorUtil.toString(message)
            }
        });
    }
    max(maxSize, message) {
        return new ZodSet({
            ...this._def,
            maxSize: {
                value: maxSize,
                message: errorUtil.toString(message)
            }
        });
    }
    size(size, message) {
        return this.min(size, message).max(size, message);
    }
    nonempty(message) {
        return this.min(1, message);
    }
    static create = (valueType, params)=>{
        return new ZodSet({
            valueType,
            minSize: null,
            maxSize: null,
            typeName: ZodFirstPartyTypeKind.ZodSet,
            ...processCreateParams(params)
        });
    };
}
export class ZodFunction extends ZodType {
    _parse(input) {
        const { ctx  } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.function) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.function,
                received: ctx.parsedType
            });
            return INVALID;
        }
        function makeArgsIssue(args, error) {
            return makeIssue({
                data: args,
                path: ctx.path,
                errorMaps: [
                    ctx.common.contextualErrorMap,
                    ctx.schemaErrorMap,
                    overrideErrorMap,
                    defaultErrorMap
                ].filter((x)=>!!x),
                issueData: {
                    code: ZodIssueCode.invalid_arguments,
                    argumentsError: error
                }
            });
        }
        function makeReturnsIssue(returns, error) {
            return makeIssue({
                data: returns,
                path: ctx.path,
                errorMaps: [
                    ctx.common.contextualErrorMap,
                    ctx.schemaErrorMap,
                    overrideErrorMap,
                    defaultErrorMap
                ].filter((x)=>!!x),
                issueData: {
                    code: ZodIssueCode.invalid_return_type,
                    returnTypeError: error
                }
            });
        }
        const params = {
            errorMap: ctx.common.contextualErrorMap
        };
        const fn = ctx.data;
        if (this._def.returns instanceof ZodPromise) {
            return OK(async (...args)=>{
                const error = new ZodError([]);
                const parsedArgs = await this._def.args.parseAsync(args, params).catch((e)=>{
                    error.addIssue(makeArgsIssue(args, e));
                    throw error;
                });
                const result = await fn(...parsedArgs);
                const parsedReturns = await this._def.returns._def.type.parseAsync(result, params).catch((e)=>{
                    error.addIssue(makeReturnsIssue(result, e));
                    throw error;
                });
                return parsedReturns;
            });
        } else {
            return OK((...args)=>{
                const parsedArgs = this._def.args.safeParse(args, params);
                if (!parsedArgs.success) {
                    throw new ZodError([
                        makeArgsIssue(args, parsedArgs.error)
                    ]);
                }
                const result = fn(...parsedArgs.data);
                const parsedReturns = this._def.returns.safeParse(result, params);
                if (!parsedReturns.success) {
                    throw new ZodError([
                        makeReturnsIssue(result, parsedReturns.error)
                    ]);
                }
                return parsedReturns.data;
            });
        }
    }
    parameters() {
        return this._def.args;
    }
    returnType() {
        return this._def.returns;
    }
    args(...items) {
        return new ZodFunction({
            ...this._def,
            args: ZodTuple.create(items).rest(ZodUnknown.create())
        });
    }
    returns(returnType) {
        return new ZodFunction({
            ...this._def,
            returns: returnType
        });
    }
    implement(func) {
        const validatedFunc = this.parse(func);
        return validatedFunc;
    }
    strictImplement(func) {
        const validatedFunc = this.parse(func);
        return validatedFunc;
    }
    validate = this.implement;
    static create = (args, returns, params)=>{
        return new ZodFunction({
            args: args ? args.rest(ZodUnknown.create()) : ZodTuple.create([]).rest(ZodUnknown.create()),
            returns: returns || ZodUnknown.create(),
            typeName: ZodFirstPartyTypeKind.ZodFunction,
            ...processCreateParams(params)
        });
    };
}
export class ZodLazy extends ZodType {
    get schema() {
        return this._def.getter();
    }
    _parse(input) {
        const { ctx  } = this._processInputParams(input);
        const lazySchema = this._def.getter();
        return lazySchema._parse({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
        });
    }
    static create = (getter, params)=>{
        return new ZodLazy({
            getter: getter,
            typeName: ZodFirstPartyTypeKind.ZodLazy,
            ...processCreateParams(params)
        });
    };
}
export class ZodLiteral extends ZodType {
    _parse(input) {
        if (input.data !== this._def.value) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_literal,
                expected: this._def.value
            });
            return INVALID;
        }
        return {
            status: "valid",
            value: input.data
        };
    }
    get value() {
        return this._def.value;
    }
    static create = (value, params)=>{
        return new ZodLiteral({
            value: value,
            typeName: ZodFirstPartyTypeKind.ZodLiteral,
            ...processCreateParams(params)
        });
    };
}
function createZodEnum(values) {
    return new ZodEnum({
        values: values,
        typeName: ZodFirstPartyTypeKind.ZodEnum
    });
}
export class ZodEnum extends ZodType {
    _parse(input) {
        if (this._def.values.indexOf(input.data) === -1) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_enum_value,
                options: this._def.values
            });
            return INVALID;
        }
        return OK(input.data);
    }
    get options() {
        return this._def.values;
    }
    get enum() {
        const enumValues = {};
        for (const val of this._def.values){
            enumValues[val] = val;
        }
        return enumValues;
    }
    get Values() {
        const enumValues = {};
        for (const val of this._def.values){
            enumValues[val] = val;
        }
        return enumValues;
    }
    get Enum() {
        const enumValues = {};
        for (const val of this._def.values){
            enumValues[val] = val;
        }
        return enumValues;
    }
    static create = createZodEnum;
}
export class ZodNativeEnum extends ZodType {
    _parse(input) {
        const nativeEnumValues = util.getValidEnumValues(this._def.values);
        if (nativeEnumValues.indexOf(input.data) === -1) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_enum_value,
                options: util.objectValues(nativeEnumValues)
            });
            return INVALID;
        }
        return OK(input.data);
    }
    get enum() {
        return this._def.values;
    }
    static create = (values, params)=>{
        return new ZodNativeEnum({
            values: values,
            typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
            ...processCreateParams(params)
        });
    };
}
export class ZodPromise extends ZodType {
    _parse(input) {
        const { ctx  } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.promise,
                received: ctx.parsedType
            });
            return INVALID;
        }
        const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
        return OK(promisified.then((data)=>{
            return this._def.type.parseAsync(data, {
                path: ctx.path,
                errorMap: ctx.common.contextualErrorMap
            });
        }));
    }
    static create = (schema, params)=>{
        return new ZodPromise({
            type: schema,
            typeName: ZodFirstPartyTypeKind.ZodPromise,
            ...processCreateParams(params)
        });
    };
}
export class ZodEffects extends ZodType {
    innerType() {
        return this._def.schema;
    }
    _parse(input) {
        const { status , ctx  } = this._processInputParams(input);
        const effect = this._def.effect || null;
        if (effect.type === "preprocess") {
            const processed = effect.transform(ctx.data);
            if (ctx.common.async) {
                return Promise.resolve(processed).then((processed)=>{
                    return this._def.schema._parseAsync({
                        data: processed,
                        path: ctx.path,
                        parent: ctx
                    });
                });
            } else {
                return this._def.schema._parseSync({
                    data: processed,
                    path: ctx.path,
                    parent: ctx
                });
            }
        }
        if (effect.type === "refinement") {
            const checkCtx = {
                addIssue: (arg)=>{
                    addIssueToContext(ctx, arg);
                    if (arg.fatal) {
                        status.abort();
                    } else {
                        status.dirty();
                    }
                },
                get path () {
                    return ctx.path;
                }
            };
            checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
            const executeRefinement = (acc)=>{
                const result = effect.refinement(acc, checkCtx);
                if (ctx.common.async) {
                    return Promise.resolve(result);
                }
                if (result instanceof Promise) {
                    throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
                }
                return acc;
            };
            if (ctx.common.async === false) {
                const inner = this._def.schema._parseSync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx
                });
                if (inner.status === "aborted") return INVALID;
                if (inner.status === "dirty") status.dirty();
                // return value is ignored
                executeRefinement(inner.value);
                return {
                    status: status.value,
                    value: inner.value
                };
            } else {
                return this._def.schema._parseAsync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx
                }).then((inner)=>{
                    if (inner.status === "aborted") return INVALID;
                    if (inner.status === "dirty") status.dirty();
                    return executeRefinement(inner.value).then(()=>{
                        return {
                            status: status.value,
                            value: inner.value
                        };
                    });
                });
            }
        }
        if (effect.type === "transform") {
            if (ctx.common.async === false) {
                const base = this._def.schema._parseSync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx
                });
                // if (base.status === "aborted") return INVALID;
                // if (base.status === "dirty") {
                //   return { status: "dirty", value: base.value };
                // }
                if (!isValid(base)) return base;
                const result = effect.transform(base.value);
                if (result instanceof Promise) {
                    throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
                }
                return OK(result);
            } else {
                return this._def.schema._parseAsync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx
                }).then((base)=>{
                    if (!isValid(base)) return base;
                    // if (base.status === "aborted") return INVALID;
                    // if (base.status === "dirty") {
                    //   return { status: "dirty", value: base.value };
                    // }
                    return Promise.resolve(effect.transform(base.value)).then(OK);
                });
            }
        }
        util.assertNever(effect);
    }
    static create = (schema, effect, params)=>{
        return new ZodEffects({
            schema,
            typeName: ZodFirstPartyTypeKind.ZodEffects,
            effect,
            ...processCreateParams(params)
        });
    };
    static createWithPreprocess = (preprocess, schema, params)=>{
        return new ZodEffects({
            schema,
            effect: {
                type: "preprocess",
                transform: preprocess
            },
            typeName: ZodFirstPartyTypeKind.ZodEffects,
            ...processCreateParams(params)
        });
    };
}
export { ZodEffects as ZodTransformer };
export class ZodOptional extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType === ZodParsedType.undefined) {
            return OK(undefined);
        }
        return this._def.innerType._parse(input);
    }
    unwrap() {
        return this._def.innerType;
    }
    static create = (type, params)=>{
        return new ZodOptional({
            innerType: type,
            typeName: ZodFirstPartyTypeKind.ZodOptional,
            ...processCreateParams(params)
        });
    };
}
export class ZodNullable extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType === ZodParsedType.null) {
            return OK(null);
        }
        return this._def.innerType._parse(input);
    }
    unwrap() {
        return this._def.innerType;
    }
    static create = (type, params)=>{
        return new ZodNullable({
            innerType: type,
            typeName: ZodFirstPartyTypeKind.ZodNullable,
            ...processCreateParams(params)
        });
    };
}
export class ZodDefault extends ZodType {
    _parse(input) {
        const { ctx  } = this._processInputParams(input);
        let data = ctx.data;
        if (ctx.parsedType === ZodParsedType.undefined) {
            data = this._def.defaultValue();
        }
        return this._def.innerType._parse({
            data,
            path: ctx.path,
            parent: ctx
        });
    }
    removeDefault() {
        return this._def.innerType;
    }
    static create = (type, params)=>{
        return new ZodOptional({
            innerType: type,
            typeName: ZodFirstPartyTypeKind.ZodOptional,
            ...processCreateParams(params)
        });
    };
}
export class ZodNaN extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.nan) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.nan,
                received: ctx.parsedType
            });
            return INVALID;
        }
        return {
            status: "valid",
            value: input.data
        };
    }
    static create = (params)=>{
        return new ZodNaN({
            typeName: ZodFirstPartyTypeKind.ZodNaN,
            ...processCreateParams(params)
        });
    };
}
export const custom = (check, params)=>{
    if (check) return ZodAny.create().refine(check, params);
    return ZodAny.create();
};
export { ZodType as Schema, ZodType as ZodSchema };
export const late = {
    object: ZodObject.lazycreate
};
export var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind) {
    ZodFirstPartyTypeKind["ZodString"] = "ZodString";
    ZodFirstPartyTypeKind["ZodNumber"] = "ZodNumber";
    ZodFirstPartyTypeKind["ZodNaN"] = "ZodNaN";
    ZodFirstPartyTypeKind["ZodBigInt"] = "ZodBigInt";
    ZodFirstPartyTypeKind["ZodBoolean"] = "ZodBoolean";
    ZodFirstPartyTypeKind["ZodDate"] = "ZodDate";
    ZodFirstPartyTypeKind["ZodUndefined"] = "ZodUndefined";
    ZodFirstPartyTypeKind["ZodNull"] = "ZodNull";
    ZodFirstPartyTypeKind["ZodAny"] = "ZodAny";
    ZodFirstPartyTypeKind["ZodUnknown"] = "ZodUnknown";
    ZodFirstPartyTypeKind["ZodNever"] = "ZodNever";
    ZodFirstPartyTypeKind["ZodVoid"] = "ZodVoid";
    ZodFirstPartyTypeKind["ZodArray"] = "ZodArray";
    ZodFirstPartyTypeKind["ZodObject"] = "ZodObject";
    ZodFirstPartyTypeKind["ZodUnion"] = "ZodUnion";
    ZodFirstPartyTypeKind["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
    ZodFirstPartyTypeKind["ZodIntersection"] = "ZodIntersection";
    ZodFirstPartyTypeKind["ZodTuple"] = "ZodTuple";
    ZodFirstPartyTypeKind["ZodRecord"] = "ZodRecord";
    ZodFirstPartyTypeKind["ZodMap"] = "ZodMap";
    ZodFirstPartyTypeKind["ZodSet"] = "ZodSet";
    ZodFirstPartyTypeKind["ZodFunction"] = "ZodFunction";
    ZodFirstPartyTypeKind["ZodLazy"] = "ZodLazy";
    ZodFirstPartyTypeKind["ZodLiteral"] = "ZodLiteral";
    ZodFirstPartyTypeKind["ZodEnum"] = "ZodEnum";
    ZodFirstPartyTypeKind["ZodEffects"] = "ZodEffects";
    ZodFirstPartyTypeKind["ZodNativeEnum"] = "ZodNativeEnum";
    ZodFirstPartyTypeKind["ZodOptional"] = "ZodOptional";
    ZodFirstPartyTypeKind["ZodNullable"] = "ZodNullable";
    ZodFirstPartyTypeKind["ZodDefault"] = "ZodDefault";
    ZodFirstPartyTypeKind["ZodPromise"] = "ZodPromise";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
const instanceOfType = (cls, params = {
    message: `Input not instance of ${cls.name}`
})=>custom((data)=>data instanceof cls, params);
const stringType = ZodString.create;
const numberType = ZodNumber.create;
const nanType = ZodNaN.create;
const bigIntType = ZodBigInt.create;
const booleanType = ZodBoolean.create;
const dateType = ZodDate.create;
const undefinedType = ZodUndefined.create;
const nullType = ZodNull.create;
const anyType = ZodAny.create;
const unknownType = ZodUnknown.create;
const neverType = ZodNever.create;
const voidType = ZodVoid.create;
const arrayType = ZodArray.create;
const objectType = ZodObject.create;
const strictObjectType = ZodObject.strictCreate;
const unionType = ZodUnion.create;
const discriminatedUnionType = ZodDiscriminatedUnion.create;
const intersectionType = ZodIntersection.create;
const tupleType = ZodTuple.create;
const recordType = ZodRecord.create;
const mapType = ZodMap.create;
const setType = ZodSet.create;
const functionType = ZodFunction.create;
const lazyType = ZodLazy.create;
const literalType = ZodLiteral.create;
const enumType = ZodEnum.create;
const nativeEnumType = ZodNativeEnum.create;
const promiseType = ZodPromise.create;
const effectsType = ZodEffects.create;
const optionalType = ZodOptional.create;
const nullableType = ZodNullable.create;
const preprocessType = ZodEffects.createWithPreprocess;
const ostring = ()=>stringType().optional();
const onumber = ()=>numberType().optional();
const oboolean = ()=>booleanType().optional();
export { anyType as any, arrayType as array, bigIntType as bigint, booleanType as boolean, dateType as date, discriminatedUnionType as discriminatedUnion, effectsType as effect, enumType as enum, functionType as function, instanceOfType as instanceof, intersectionType as intersection, lazyType as lazy, literalType as literal, mapType as map, nanType as nan, nativeEnumType as nativeEnum, neverType as never, nullType as null, nullableType as nullable, numberType as number, objectType as object, oboolean, onumber, optionalType as optional, ostring, preprocessType as preprocess, promiseType as promise, recordType as record, setType as set, strictObjectType as strictObject, stringType as string, effectsType as transformer, tupleType as tuple, undefinedType as undefined, unionType as union, unknownType as unknown, voidType as void };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvem9kQHYzLjE0LjQvdHlwZXMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZXJyb3JVdGlsIH0gZnJvbSBcIi4vaGVscGVycy9lcnJvclV0aWwudHNcIjtcbmltcG9ydCB7XG4gIGFkZElzc3VlVG9Db250ZXh0LFxuICBBc3luY1BhcnNlUmV0dXJuVHlwZSxcbiAgRElSVFksXG4gIGdldFBhcnNlZFR5cGUsXG4gIElOVkFMSUQsXG4gIGlzQWJvcnRlZCxcbiAgaXNBc3luYyxcbiAgaXNEaXJ0eSxcbiAgaXNWYWxpZCxcbiAgbWFrZUlzc3VlLFxuICBPSyxcbiAgUGFyc2VDb250ZXh0LFxuICBQYXJzZUlucHV0LFxuICBQYXJzZVBhcmFtcyxcbiAgUGFyc2VQYXRoLFxuICBQYXJzZVJldHVyblR5cGUsXG4gIFBhcnNlU3RhdHVzLFxuICBTeW5jUGFyc2VSZXR1cm5UeXBlLFxuICBab2RQYXJzZWRUeXBlLFxufSBmcm9tIFwiLi9oZWxwZXJzL3BhcnNlVXRpbC50c1wiO1xuaW1wb3J0IHsgcGFydGlhbFV0aWwgfSBmcm9tIFwiLi9oZWxwZXJzL3BhcnRpYWxVdGlsLnRzXCI7XG5pbXBvcnQgeyBQcmltaXRpdmUgfSBmcm9tIFwiLi9oZWxwZXJzL3R5cGVBbGlhc2VzLnRzXCI7XG5pbXBvcnQgeyB1dGlsIH0gZnJvbSBcIi4vaGVscGVycy91dGlsLnRzXCI7XG5pbXBvcnQge1xuICBkZWZhdWx0RXJyb3JNYXAsXG4gIElzc3VlRGF0YSxcbiAgb3ZlcnJpZGVFcnJvck1hcCxcbiAgU3RyaW5nVmFsaWRhdGlvbixcbiAgWm9kQ3VzdG9tSXNzdWUsXG4gIFpvZEVycm9yLFxuICBab2RFcnJvck1hcCxcbiAgWm9kSXNzdWUsXG4gIFpvZElzc3VlQ29kZSxcbn0gZnJvbSBcIi4vWm9kRXJyb3IudHNcIjtcblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8vLy8vLy8gICAgICAgICAgICAgICAgICAgLy8vLy8vLy8vL1xuLy8vLy8vLy8vLyAgICAgIFpvZFR5cGUgICAgICAvLy8vLy8vLy8vXG4vLy8vLy8vLy8vICAgICAgICAgICAgICAgICAgIC8vLy8vLy8vLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmV4cG9ydCB0eXBlIFJlZmluZW1lbnRDdHggPSB7XG4gIGFkZElzc3VlOiAoYXJnOiBJc3N1ZURhdGEpID0+IHZvaWQ7XG4gIHBhdGg6IChzdHJpbmcgfCBudW1iZXIpW107XG59O1xuZXhwb3J0IHR5cGUgWm9kUmF3U2hhcGUgPSB7IFtrOiBzdHJpbmddOiBab2RUeXBlQW55IH07XG5leHBvcnQgdHlwZSBab2RUeXBlQW55ID0gWm9kVHlwZTxhbnksIGFueSwgYW55PjtcbmV4cG9ydCB0eXBlIFR5cGVPZjxUIGV4dGVuZHMgWm9kVHlwZTxhbnksIGFueSwgYW55Pj4gPSBUW1wiX291dHB1dFwiXTtcbmV4cG9ydCB0eXBlIGlucHV0PFQgZXh0ZW5kcyBab2RUeXBlPGFueSwgYW55LCBhbnk+PiA9IFRbXCJfaW5wdXRcIl07XG5leHBvcnQgdHlwZSBvdXRwdXQ8VCBleHRlbmRzIFpvZFR5cGU8YW55LCBhbnksIGFueT4+ID0gVFtcIl9vdXRwdXRcIl07XG5cbnR5cGUgYWxsS2V5czxUPiA9IFQgZXh0ZW5kcyBhbnkgPyBrZXlvZiBUIDogbmV2ZXI7XG5leHBvcnQgdHlwZSBUeXBlT2ZGbGF0dGVuZWRFcnJvcjxcbiAgVCBleHRlbmRzIFpvZFR5cGU8YW55LCBhbnksIGFueT4sXG4gIFUgPSBzdHJpbmdcbj4gPSB7XG4gIGZvcm1FcnJvcnM6IFVbXTtcbiAgZmllbGRFcnJvcnM6IHtcbiAgICBbUCBpbiBhbGxLZXlzPFR5cGVPZjxUPj5dPzogVVtdO1xuICB9O1xufTtcbmV4cG9ydCB0eXBlIFR5cGVPZkZvcm1FcnJvcnM8VCBleHRlbmRzIFpvZFR5cGU8YW55LCBhbnksIGFueT4+ID1cbiAgVHlwZU9mRmxhdHRlbmVkRXJyb3I8VD47XG5leHBvcnQgdHlwZSB7XG4gIFR5cGVPZiBhcyBpbmZlcixcbiAgVHlwZU9mRmxhdHRlbmVkRXJyb3IgYXMgaW5mZXJGbGF0dGVuZWRFcnJvcnMsXG4gIFR5cGVPZkZvcm1FcnJvcnMgYXMgaW5mZXJGb3JtRXJyb3JzLFxufTtcblxuZXhwb3J0IHR5cGUgQ3VzdG9tRXJyb3JQYXJhbXMgPSBQYXJ0aWFsPHV0aWwuT21pdDxab2RDdXN0b21Jc3N1ZSwgXCJjb2RlXCI+PjtcbmV4cG9ydCBpbnRlcmZhY2UgWm9kVHlwZURlZiB7XG4gIGVycm9yTWFwPzogWm9kRXJyb3JNYXA7XG4gIGRlc2NyaXB0aW9uPzogc3RyaW5nO1xufVxuXG5jbGFzcyBQYXJzZUlucHV0TGF6eVBhdGggaW1wbGVtZW50cyBQYXJzZUlucHV0IHtcbiAgcGFyZW50OiBQYXJzZUNvbnRleHQ7XG4gIGRhdGE6IGFueTtcbiAgX3BhdGg6IFBhcnNlUGF0aDtcbiAgX2tleTogc3RyaW5nIHwgbnVtYmVyIHwgKHN0cmluZyB8IG51bWJlcilbXTtcbiAgY29uc3RydWN0b3IoXG4gICAgcGFyZW50OiBQYXJzZUNvbnRleHQsXG4gICAgdmFsdWU6IGFueSxcbiAgICBwYXRoOiBQYXJzZVBhdGgsXG4gICAga2V5OiBzdHJpbmcgfCBudW1iZXIgfCAoc3RyaW5nIHwgbnVtYmVyKVtdXG4gICkge1xuICAgIHRoaXMucGFyZW50ID0gcGFyZW50O1xuICAgIHRoaXMuZGF0YSA9IHZhbHVlO1xuICAgIHRoaXMuX3BhdGggPSBwYXRoO1xuICAgIHRoaXMuX2tleSA9IGtleTtcbiAgfVxuICBnZXQgcGF0aCgpIHtcbiAgICByZXR1cm4gdGhpcy5fcGF0aC5jb25jYXQodGhpcy5fa2V5KTtcbiAgfVxufVxuXG5jb25zdCBoYW5kbGVSZXN1bHQgPSA8SW5wdXQsIE91dHB1dD4oXG4gIGN0eDogUGFyc2VDb250ZXh0LFxuICByZXN1bHQ6IFN5bmNQYXJzZVJldHVyblR5cGU8T3V0cHV0PlxuKTpcbiAgfCB7IHN1Y2Nlc3M6IHRydWU7IGRhdGE6IE91dHB1dCB9XG4gIHwgeyBzdWNjZXNzOiBmYWxzZTsgZXJyb3I6IFpvZEVycm9yPElucHV0PiB9ID0+IHtcbiAgaWYgKGlzVmFsaWQocmVzdWx0KSkge1xuICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IHJlc3VsdC52YWx1ZSB9O1xuICB9IGVsc2Uge1xuICAgIGlmICghY3R4LmNvbW1vbi5pc3N1ZXMubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJWYWxpZGF0aW9uIGZhaWxlZCBidXQgbm8gaXNzdWVzIGRldGVjdGVkLlwiKTtcbiAgICB9XG4gICAgY29uc3QgZXJyb3IgPSBuZXcgWm9kRXJyb3IoY3R4LmNvbW1vbi5pc3N1ZXMpO1xuICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvciB9O1xuICB9XG59O1xuXG50eXBlIFJhd0NyZWF0ZVBhcmFtcyA9XG4gIHwge1xuICAgICAgZXJyb3JNYXA/OiBab2RFcnJvck1hcDtcbiAgICAgIGludmFsaWRfdHlwZV9lcnJvcj86IHN0cmluZztcbiAgICAgIHJlcXVpcmVkX2Vycm9yPzogc3RyaW5nO1xuICAgICAgZGVzY3JpcHRpb24/OiBzdHJpbmc7XG4gICAgfVxuICB8IHVuZGVmaW5lZDtcbnR5cGUgUHJvY2Vzc2VkQ3JlYXRlUGFyYW1zID0geyBlcnJvck1hcD86IFpvZEVycm9yTWFwOyBkZXNjcmlwdGlvbj86IHN0cmluZyB9O1xuZnVuY3Rpb24gcHJvY2Vzc0NyZWF0ZVBhcmFtcyhwYXJhbXM6IFJhd0NyZWF0ZVBhcmFtcyk6IFByb2Nlc3NlZENyZWF0ZVBhcmFtcyB7XG4gIGlmICghcGFyYW1zKSByZXR1cm4ge307XG4gIGNvbnN0IHsgZXJyb3JNYXAsIGludmFsaWRfdHlwZV9lcnJvciwgcmVxdWlyZWRfZXJyb3IsIGRlc2NyaXB0aW9uIH0gPSBwYXJhbXM7XG4gIGlmIChlcnJvck1hcCAmJiAoaW52YWxpZF90eXBlX2Vycm9yIHx8IHJlcXVpcmVkX2Vycm9yKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgIGBDYW4ndCB1c2UgXCJpbnZhbGlkXCIgb3IgXCJyZXF1aXJlZFwiIGluIGNvbmp1bmN0aW9uIHdpdGggY3VzdG9tIGVycm9yIG1hcC5gXG4gICAgKTtcbiAgfVxuICBpZiAoZXJyb3JNYXApIHJldHVybiB7IGVycm9yTWFwOiBlcnJvck1hcCwgZGVzY3JpcHRpb24gfTtcbiAgY29uc3QgY3VzdG9tTWFwOiBab2RFcnJvck1hcCA9IChpc3MsIGN0eCkgPT4ge1xuICAgIGlmIChpc3MuY29kZSAhPT0gXCJpbnZhbGlkX3R5cGVcIikgcmV0dXJuIHsgbWVzc2FnZTogY3R4LmRlZmF1bHRFcnJvciB9O1xuICAgIGlmICh0eXBlb2YgY3R4LmRhdGEgPT09IFwidW5kZWZpbmVkXCIgJiYgcmVxdWlyZWRfZXJyb3IpXG4gICAgICByZXR1cm4geyBtZXNzYWdlOiByZXF1aXJlZF9lcnJvciB9O1xuICAgIGlmIChwYXJhbXMuaW52YWxpZF90eXBlX2Vycm9yKVxuICAgICAgcmV0dXJuIHsgbWVzc2FnZTogcGFyYW1zLmludmFsaWRfdHlwZV9lcnJvciB9O1xuICAgIHJldHVybiB7IG1lc3NhZ2U6IGN0eC5kZWZhdWx0RXJyb3IgfTtcbiAgfTtcbiAgcmV0dXJuIHsgZXJyb3JNYXA6IGN1c3RvbU1hcCwgZGVzY3JpcHRpb24gfTtcbn1cblxuZXhwb3J0IHR5cGUgU2FmZVBhcnNlU3VjY2VzczxPdXRwdXQ+ID0geyBzdWNjZXNzOiB0cnVlOyBkYXRhOiBPdXRwdXQgfTtcbmV4cG9ydCB0eXBlIFNhZmVQYXJzZUVycm9yPElucHV0PiA9IHsgc3VjY2VzczogZmFsc2U7IGVycm9yOiBab2RFcnJvcjxJbnB1dD4gfTtcblxuZXhwb3J0IHR5cGUgU2FmZVBhcnNlUmV0dXJuVHlwZTxJbnB1dCwgT3V0cHV0PiA9XG4gIHwgU2FmZVBhcnNlU3VjY2VzczxPdXRwdXQ+XG4gIHwgU2FmZVBhcnNlRXJyb3I8SW5wdXQ+O1xuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgWm9kVHlwZTxcbiAgT3V0cHV0ID0gYW55LFxuICBEZWYgZXh0ZW5kcyBab2RUeXBlRGVmID0gWm9kVHlwZURlZixcbiAgSW5wdXQgPSBPdXRwdXRcbj4ge1xuICByZWFkb25seSBfdHlwZSE6IE91dHB1dDtcbiAgcmVhZG9ubHkgX291dHB1dCE6IE91dHB1dDtcbiAgcmVhZG9ubHkgX2lucHV0ITogSW5wdXQ7XG4gIHJlYWRvbmx5IF9kZWYhOiBEZWY7XG5cbiAgZ2V0IGRlc2NyaXB0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl9kZWYuZGVzY3JpcHRpb247XG4gIH1cblxuICBhYnN0cmFjdCBfcGFyc2UoaW5wdXQ6IFBhcnNlSW5wdXQpOiBQYXJzZVJldHVyblR5cGU8T3V0cHV0PjtcblxuICBfZ2V0VHlwZShpbnB1dDogUGFyc2VJbnB1dCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGdldFBhcnNlZFR5cGUoaW5wdXQuZGF0YSk7XG4gIH1cblxuICBfZ2V0T3JSZXR1cm5DdHgoXG4gICAgaW5wdXQ6IFBhcnNlSW5wdXQsXG4gICAgY3R4PzogUGFyc2VDb250ZXh0IHwgdW5kZWZpbmVkXG4gICk6IFBhcnNlQ29udGV4dCB7XG4gICAgcmV0dXJuIChcbiAgICAgIGN0eCB8fCB7XG4gICAgICAgIGNvbW1vbjogaW5wdXQucGFyZW50LmNvbW1vbixcbiAgICAgICAgZGF0YTogaW5wdXQuZGF0YSxcblxuICAgICAgICBwYXJzZWRUeXBlOiBnZXRQYXJzZWRUeXBlKGlucHV0LmRhdGEpLFxuXG4gICAgICAgIHNjaGVtYUVycm9yTWFwOiB0aGlzLl9kZWYuZXJyb3JNYXAsXG4gICAgICAgIHBhdGg6IGlucHV0LnBhdGgsXG4gICAgICAgIHBhcmVudDogaW5wdXQucGFyZW50LFxuICAgICAgfVxuICAgICk7XG4gIH1cblxuICBfcHJvY2Vzc0lucHV0UGFyYW1zKGlucHV0OiBQYXJzZUlucHV0KToge1xuICAgIHN0YXR1czogUGFyc2VTdGF0dXM7XG4gICAgY3R4OiBQYXJzZUNvbnRleHQ7XG4gIH0ge1xuICAgIHJldHVybiB7XG4gICAgICBzdGF0dXM6IG5ldyBQYXJzZVN0YXR1cygpLFxuICAgICAgY3R4OiB7XG4gICAgICAgIGNvbW1vbjogaW5wdXQucGFyZW50LmNvbW1vbixcbiAgICAgICAgZGF0YTogaW5wdXQuZGF0YSxcblxuICAgICAgICBwYXJzZWRUeXBlOiBnZXRQYXJzZWRUeXBlKGlucHV0LmRhdGEpLFxuXG4gICAgICAgIHNjaGVtYUVycm9yTWFwOiB0aGlzLl9kZWYuZXJyb3JNYXAsXG4gICAgICAgIHBhdGg6IGlucHV0LnBhdGgsXG4gICAgICAgIHBhcmVudDogaW5wdXQucGFyZW50LFxuICAgICAgfSxcbiAgICB9O1xuICB9XG5cbiAgX3BhcnNlU3luYyhpbnB1dDogUGFyc2VJbnB1dCk6IFN5bmNQYXJzZVJldHVyblR5cGU8T3V0cHV0PiB7XG4gICAgY29uc3QgcmVzdWx0ID0gdGhpcy5fcGFyc2UoaW5wdXQpO1xuICAgIGlmIChpc0FzeW5jKHJlc3VsdCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlN5bmNocm9ub3VzIHBhcnNlIGVuY291bnRlcmVkIHByb21pc2UuXCIpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgX3BhcnNlQXN5bmMoaW5wdXQ6IFBhcnNlSW5wdXQpOiBBc3luY1BhcnNlUmV0dXJuVHlwZTxPdXRwdXQ+IHtcbiAgICBjb25zdCByZXN1bHQgPSB0aGlzLl9wYXJzZShpbnB1dCk7XG5cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJlc3VsdCk7XG4gIH1cblxuICBwYXJzZShkYXRhOiB1bmtub3duLCBwYXJhbXM/OiBQYXJ0aWFsPFBhcnNlUGFyYW1zPik6IE91dHB1dCB7XG4gICAgY29uc3QgcmVzdWx0ID0gdGhpcy5zYWZlUGFyc2UoZGF0YSwgcGFyYW1zKTtcbiAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpIHJldHVybiByZXN1bHQuZGF0YTtcbiAgICB0aHJvdyByZXN1bHQuZXJyb3I7XG4gIH1cblxuICBzYWZlUGFyc2UoXG4gICAgZGF0YTogdW5rbm93bixcbiAgICBwYXJhbXM/OiBQYXJ0aWFsPFBhcnNlUGFyYW1zPlxuICApOiBTYWZlUGFyc2VSZXR1cm5UeXBlPElucHV0LCBPdXRwdXQ+IHtcbiAgICBjb25zdCBjdHg6IFBhcnNlQ29udGV4dCA9IHtcbiAgICAgIGNvbW1vbjoge1xuICAgICAgICBpc3N1ZXM6IFtdLFxuICAgICAgICBhc3luYzogcGFyYW1zPy5hc3luYyA/PyBmYWxzZSxcbiAgICAgICAgY29udGV4dHVhbEVycm9yTWFwOiBwYXJhbXM/LmVycm9yTWFwLFxuICAgICAgfSxcbiAgICAgIHBhdGg6IHBhcmFtcz8ucGF0aCB8fCBbXSxcbiAgICAgIHNjaGVtYUVycm9yTWFwOiB0aGlzLl9kZWYuZXJyb3JNYXAsXG4gICAgICBwYXJlbnQ6IG51bGwsXG4gICAgICBkYXRhLFxuICAgICAgcGFyc2VkVHlwZTogZ2V0UGFyc2VkVHlwZShkYXRhKSxcbiAgICB9O1xuICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuX3BhcnNlU3luYyh7IGRhdGEsIHBhdGg6IGN0eC5wYXRoLCBwYXJlbnQ6IGN0eCB9KTtcblxuICAgIHJldHVybiBoYW5kbGVSZXN1bHQoY3R4LCByZXN1bHQpO1xuICB9XG5cbiAgYXN5bmMgcGFyc2VBc3luYyhcbiAgICBkYXRhOiB1bmtub3duLFxuICAgIHBhcmFtcz86IFBhcnRpYWw8UGFyc2VQYXJhbXM+XG4gICk6IFByb21pc2U8T3V0cHV0PiB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5zYWZlUGFyc2VBc3luYyhkYXRhLCBwYXJhbXMpO1xuICAgIGlmIChyZXN1bHQuc3VjY2VzcykgcmV0dXJuIHJlc3VsdC5kYXRhO1xuICAgIHRocm93IHJlc3VsdC5lcnJvcjtcbiAgfVxuXG4gIGFzeW5jIHNhZmVQYXJzZUFzeW5jKFxuICAgIGRhdGE6IHVua25vd24sXG4gICAgcGFyYW1zPzogUGFydGlhbDxQYXJzZVBhcmFtcz5cbiAgKTogUHJvbWlzZTxTYWZlUGFyc2VSZXR1cm5UeXBlPElucHV0LCBPdXRwdXQ+PiB7XG4gICAgY29uc3QgY3R4OiBQYXJzZUNvbnRleHQgPSB7XG4gICAgICBjb21tb246IHtcbiAgICAgICAgaXNzdWVzOiBbXSxcbiAgICAgICAgY29udGV4dHVhbEVycm9yTWFwOiBwYXJhbXM/LmVycm9yTWFwLFxuICAgICAgICBhc3luYzogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBwYXRoOiBwYXJhbXM/LnBhdGggfHwgW10sXG4gICAgICBzY2hlbWFFcnJvck1hcDogdGhpcy5fZGVmLmVycm9yTWFwLFxuICAgICAgcGFyZW50OiBudWxsLFxuICAgICAgZGF0YSxcbiAgICAgIHBhcnNlZFR5cGU6IGdldFBhcnNlZFR5cGUoZGF0YSksXG4gICAgfTtcblxuICAgIGNvbnN0IG1heWJlQXN5bmNSZXN1bHQgPSB0aGlzLl9wYXJzZSh7IGRhdGEsIHBhdGg6IFtdLCBwYXJlbnQ6IGN0eCB9KTtcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCAoaXNBc3luYyhtYXliZUFzeW5jUmVzdWx0KVxuICAgICAgPyBtYXliZUFzeW5jUmVzdWx0XG4gICAgICA6IFByb21pc2UucmVzb2x2ZShtYXliZUFzeW5jUmVzdWx0KSk7XG4gICAgcmV0dXJuIGhhbmRsZVJlc3VsdChjdHgsIHJlc3VsdCk7XG4gIH1cblxuICAvKiogQWxpYXMgb2Ygc2FmZVBhcnNlQXN5bmMgKi9cbiAgc3BhID0gdGhpcy5zYWZlUGFyc2VBc3luYztcblxuICByZWZpbmU8UmVmaW5lZE91dHB1dCBleHRlbmRzIE91dHB1dD4oXG4gICAgY2hlY2s6IChhcmc6IE91dHB1dCkgPT4gYXJnIGlzIFJlZmluZWRPdXRwdXQsXG4gICAgbWVzc2FnZT86IHN0cmluZyB8IEN1c3RvbUVycm9yUGFyYW1zIHwgKChhcmc6IE91dHB1dCkgPT4gQ3VzdG9tRXJyb3JQYXJhbXMpXG4gICk6IFpvZEVmZmVjdHM8dGhpcywgUmVmaW5lZE91dHB1dCwgUmVmaW5lZE91dHB1dD47XG4gIHJlZmluZShcbiAgICBjaGVjazogKGFyZzogT3V0cHV0KSA9PiB1bmtub3duIHwgUHJvbWlzZTx1bmtub3duPixcbiAgICBtZXNzYWdlPzogc3RyaW5nIHwgQ3VzdG9tRXJyb3JQYXJhbXMgfCAoKGFyZzogT3V0cHV0KSA9PiBDdXN0b21FcnJvclBhcmFtcylcbiAgKTogWm9kRWZmZWN0czx0aGlzLCBPdXRwdXQsIElucHV0PjtcbiAgcmVmaW5lKFxuICAgIGNoZWNrOiAoYXJnOiBPdXRwdXQpID0+IHVua25vd24sXG4gICAgbWVzc2FnZT86IHN0cmluZyB8IEN1c3RvbUVycm9yUGFyYW1zIHwgKChhcmc6IE91dHB1dCkgPT4gQ3VzdG9tRXJyb3JQYXJhbXMpXG4gICk6IFpvZEVmZmVjdHM8dGhpcywgT3V0cHV0LCBJbnB1dD4ge1xuICAgIGNvbnN0IGdldElzc3VlUHJvcGVydGllczogYW55ID0gKHZhbDogT3V0cHV0KSA9PiB7XG4gICAgICBpZiAodHlwZW9mIG1lc3NhZ2UgPT09IFwic3RyaW5nXCIgfHwgdHlwZW9mIG1lc3NhZ2UgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgcmV0dXJuIHsgbWVzc2FnZSB9O1xuICAgICAgfSBlbHNlIGlmICh0eXBlb2YgbWVzc2FnZSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHJldHVybiBtZXNzYWdlKHZhbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbWVzc2FnZTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybiB0aGlzLl9yZWZpbmVtZW50KCh2YWwsIGN0eCkgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gY2hlY2sodmFsKTtcbiAgICAgIGNvbnN0IHNldEVycm9yID0gKCkgPT5cbiAgICAgICAgY3R4LmFkZElzc3VlKHtcbiAgICAgICAgICBjb2RlOiBab2RJc3N1ZUNvZGUuY3VzdG9tLFxuICAgICAgICAgIC4uLmdldElzc3VlUHJvcGVydGllcyh2YWwpLFxuICAgICAgICB9KTtcbiAgICAgIGlmICh0eXBlb2YgUHJvbWlzZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiByZXN1bHQgaW5zdGFuY2VvZiBQcm9taXNlKSB7XG4gICAgICAgIHJldHVybiByZXN1bHQudGhlbigoZGF0YSkgPT4ge1xuICAgICAgICAgIGlmICghZGF0YSkge1xuICAgICAgICAgICAgc2V0RXJyb3IoKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGlmICghcmVzdWx0KSB7XG4gICAgICAgIHNldEVycm9yKCk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgcmVmaW5lbWVudDxSZWZpbmVkT3V0cHV0IGV4dGVuZHMgT3V0cHV0PihcbiAgICBjaGVjazogKGFyZzogT3V0cHV0KSA9PiBhcmcgaXMgUmVmaW5lZE91dHB1dCxcbiAgICByZWZpbmVtZW50RGF0YTogSXNzdWVEYXRhIHwgKChhcmc6IE91dHB1dCwgY3R4OiBSZWZpbmVtZW50Q3R4KSA9PiBJc3N1ZURhdGEpXG4gICk6IFpvZEVmZmVjdHM8dGhpcywgUmVmaW5lZE91dHB1dCwgUmVmaW5lZE91dHB1dD47XG4gIHJlZmluZW1lbnQoXG4gICAgY2hlY2s6IChhcmc6IE91dHB1dCkgPT4gYm9vbGVhbixcbiAgICByZWZpbmVtZW50RGF0YTogSXNzdWVEYXRhIHwgKChhcmc6IE91dHB1dCwgY3R4OiBSZWZpbmVtZW50Q3R4KSA9PiBJc3N1ZURhdGEpXG4gICk6IFpvZEVmZmVjdHM8dGhpcywgT3V0cHV0LCBJbnB1dD47XG4gIHJlZmluZW1lbnQoXG4gICAgY2hlY2s6IChhcmc6IE91dHB1dCkgPT4gdW5rbm93bixcbiAgICByZWZpbmVtZW50RGF0YTogSXNzdWVEYXRhIHwgKChhcmc6IE91dHB1dCwgY3R4OiBSZWZpbmVtZW50Q3R4KSA9PiBJc3N1ZURhdGEpXG4gICk6IFpvZEVmZmVjdHM8dGhpcywgT3V0cHV0LCBJbnB1dD4ge1xuICAgIHJldHVybiB0aGlzLl9yZWZpbmVtZW50KCh2YWwsIGN0eCkgPT4ge1xuICAgICAgaWYgKCFjaGVjayh2YWwpKSB7XG4gICAgICAgIGN0eC5hZGRJc3N1ZShcbiAgICAgICAgICB0eXBlb2YgcmVmaW5lbWVudERhdGEgPT09IFwiZnVuY3Rpb25cIlxuICAgICAgICAgICAgPyByZWZpbmVtZW50RGF0YSh2YWwsIGN0eClcbiAgICAgICAgICAgIDogcmVmaW5lbWVudERhdGFcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBfcmVmaW5lbWVudChcbiAgICByZWZpbmVtZW50OiBSZWZpbmVtZW50RWZmZWN0PE91dHB1dD5bXCJyZWZpbmVtZW50XCJdXG4gICk6IFpvZEVmZmVjdHM8dGhpcywgT3V0cHV0LCBJbnB1dD4ge1xuICAgIHJldHVybiBuZXcgWm9kRWZmZWN0cyh7XG4gICAgICBzY2hlbWE6IHRoaXMsXG4gICAgICB0eXBlTmFtZTogWm9kRmlyc3RQYXJ0eVR5cGVLaW5kLlpvZEVmZmVjdHMsXG4gICAgICBlZmZlY3Q6IHsgdHlwZTogXCJyZWZpbmVtZW50XCIsIHJlZmluZW1lbnQgfSxcbiAgICB9KTtcbiAgfVxuICBzdXBlclJlZmluZSA9IHRoaXMuX3JlZmluZW1lbnQ7XG5cbiAgY29uc3RydWN0b3IoZGVmOiBEZWYpIHtcbiAgICB0aGlzLl9kZWYgPSBkZWY7XG4gICAgdGhpcy5wYXJzZSA9IHRoaXMucGFyc2UuYmluZCh0aGlzKTtcbiAgICB0aGlzLnNhZmVQYXJzZSA9IHRoaXMuc2FmZVBhcnNlLmJpbmQodGhpcyk7XG4gICAgdGhpcy5wYXJzZUFzeW5jID0gdGhpcy5wYXJzZUFzeW5jLmJpbmQodGhpcyk7XG4gICAgdGhpcy5zYWZlUGFyc2VBc3luYyA9IHRoaXMuc2FmZVBhcnNlQXN5bmMuYmluZCh0aGlzKTtcbiAgICB0aGlzLnNwYSA9IHRoaXMuc3BhLmJpbmQodGhpcyk7XG4gICAgdGhpcy5yZWZpbmUgPSB0aGlzLnJlZmluZS5iaW5kKHRoaXMpO1xuICAgIHRoaXMucmVmaW5lbWVudCA9IHRoaXMucmVmaW5lbWVudC5iaW5kKHRoaXMpO1xuICAgIHRoaXMuc3VwZXJSZWZpbmUgPSB0aGlzLnN1cGVyUmVmaW5lLmJpbmQodGhpcyk7XG4gICAgdGhpcy5vcHRpb25hbCA9IHRoaXMub3B0aW9uYWwuYmluZCh0aGlzKTtcbiAgICB0aGlzLm51bGxhYmxlID0gdGhpcy5udWxsYWJsZS5iaW5kKHRoaXMpO1xuICAgIHRoaXMubnVsbGlzaCA9IHRoaXMubnVsbGlzaC5iaW5kKHRoaXMpO1xuICAgIHRoaXMuYXJyYXkgPSB0aGlzLmFycmF5LmJpbmQodGhpcyk7XG4gICAgdGhpcy5wcm9taXNlID0gdGhpcy5wcm9taXNlLmJpbmQodGhpcyk7XG4gICAgdGhpcy5vciA9IHRoaXMub3IuYmluZCh0aGlzKTtcbiAgICB0aGlzLmFuZCA9IHRoaXMuYW5kLmJpbmQodGhpcyk7XG4gICAgdGhpcy50cmFuc2Zvcm0gPSB0aGlzLnRyYW5zZm9ybS5iaW5kKHRoaXMpO1xuICAgIHRoaXMuZGVmYXVsdCA9IHRoaXMuZGVmYXVsdC5iaW5kKHRoaXMpO1xuICAgIHRoaXMuZGVzY3JpYmUgPSB0aGlzLmRlc2NyaWJlLmJpbmQodGhpcyk7XG4gICAgdGhpcy5pc051bGxhYmxlID0gdGhpcy5pc051bGxhYmxlLmJpbmQodGhpcyk7XG4gICAgdGhpcy5pc09wdGlvbmFsID0gdGhpcy5pc09wdGlvbmFsLmJpbmQodGhpcyk7XG4gIH1cblxuICBvcHRpb25hbCgpOiBab2RPcHRpb25hbDx0aGlzPiB7XG4gICAgKFwiXCIpO1xuICAgIChcImFzZGZcIik7XG4gICAgcmV0dXJuIFpvZE9wdGlvbmFsLmNyZWF0ZSh0aGlzKSBhcyBhbnk7XG4gIH1cbiAgbnVsbGFibGUoKTogWm9kTnVsbGFibGU8dGhpcz4ge1xuICAgIHJldHVybiBab2ROdWxsYWJsZS5jcmVhdGUodGhpcykgYXMgYW55O1xuICB9XG4gIG51bGxpc2goKTogWm9kTnVsbGFibGU8Wm9kT3B0aW9uYWw8dGhpcz4+IHtcbiAgICByZXR1cm4gdGhpcy5vcHRpb25hbCgpLm51bGxhYmxlKCk7XG4gIH1cbiAgYXJyYXkoKTogWm9kQXJyYXk8dGhpcz4ge1xuICAgIHJldHVybiBab2RBcnJheS5jcmVhdGUodGhpcyk7XG4gIH1cbiAgcHJvbWlzZSgpOiBab2RQcm9taXNlPHRoaXM+IHtcbiAgICByZXR1cm4gWm9kUHJvbWlzZS5jcmVhdGUodGhpcyk7XG4gIH1cblxuICBvcjxUIGV4dGVuZHMgWm9kVHlwZUFueT4ob3B0aW9uOiBUKTogWm9kVW5pb248W3RoaXMsIFRdPiB7XG4gICAgcmV0dXJuIFpvZFVuaW9uLmNyZWF0ZShbdGhpcywgb3B0aW9uXSkgYXMgYW55O1xuICB9XG5cbiAgYW5kPFQgZXh0ZW5kcyBab2RUeXBlQW55PihpbmNvbWluZzogVCk6IFpvZEludGVyc2VjdGlvbjx0aGlzLCBUPiB7XG4gICAgcmV0dXJuIFpvZEludGVyc2VjdGlvbi5jcmVhdGUodGhpcywgaW5jb21pbmcpO1xuICB9XG5cbiAgdHJhbnNmb3JtPE5ld091dD4oXG4gICAgdHJhbnNmb3JtOiAoYXJnOiBPdXRwdXQpID0+IE5ld091dCB8IFByb21pc2U8TmV3T3V0PlxuICApOiBab2RFZmZlY3RzPHRoaXMsIE5ld091dD4ge1xuICAgIHJldHVybiBuZXcgWm9kRWZmZWN0cyh7XG4gICAgICBzY2hlbWE6IHRoaXMsXG4gICAgICB0eXBlTmFtZTogWm9kRmlyc3RQYXJ0eVR5cGVLaW5kLlpvZEVmZmVjdHMsXG4gICAgICBlZmZlY3Q6IHsgdHlwZTogXCJ0cmFuc2Zvcm1cIiwgdHJhbnNmb3JtIH0sXG4gICAgfSkgYXMgYW55O1xuICB9XG5cbiAgZGVmYXVsdChkZWY6IHV0aWwubm9VbmRlZmluZWQ8SW5wdXQ+KTogWm9kRGVmYXVsdDx0aGlzPjtcbiAgZGVmYXVsdChkZWY6ICgpID0+IHV0aWwubm9VbmRlZmluZWQ8SW5wdXQ+KTogWm9kRGVmYXVsdDx0aGlzPjtcbiAgZGVmYXVsdChkZWY6IGFueSkge1xuICAgIGNvbnN0IGRlZmF1bHRWYWx1ZUZ1bmMgPSB0eXBlb2YgZGVmID09PSBcImZ1bmN0aW9uXCIgPyBkZWYgOiAoKSA9PiBkZWY7XG5cbiAgICByZXR1cm4gbmV3IFpvZERlZmF1bHQoe1xuICAgICAgaW5uZXJUeXBlOiB0aGlzLFxuICAgICAgZGVmYXVsdFZhbHVlOiBkZWZhdWx0VmFsdWVGdW5jLFxuICAgICAgdHlwZU5hbWU6IFpvZEZpcnN0UGFydHlUeXBlS2luZC5ab2REZWZhdWx0LFxuICAgIH0pIGFzIGFueTtcbiAgfVxuXG4gIGRlc2NyaWJlKGRlc2NyaXB0aW9uOiBzdHJpbmcpOiB0aGlzIHtcbiAgICBjb25zdCBUaGlzID0gKHRoaXMgYXMgYW55KS5jb25zdHJ1Y3RvcjtcbiAgICByZXR1cm4gbmV3IFRoaXMoe1xuICAgICAgLi4udGhpcy5fZGVmLFxuICAgICAgZGVzY3JpcHRpb24sXG4gICAgfSk7XG4gIH1cblxuICBpc09wdGlvbmFsKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLnNhZmVQYXJzZSh1bmRlZmluZWQpLnN1Y2Nlc3M7XG4gIH1cbiAgaXNOdWxsYWJsZSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5zYWZlUGFyc2UobnVsbCkuc3VjY2VzcztcbiAgfVxufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8vLy8vLy8gICAgICAgICAgICAgICAgICAgICAvLy8vLy8vLy8vXG4vLy8vLy8vLy8vICAgICAgWm9kU3RyaW5nICAgICAgLy8vLy8vLy8vL1xuLy8vLy8vLy8vLyAgICAgICAgICAgICAgICAgICAgIC8vLy8vLy8vLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xudHlwZSBab2RTdHJpbmdDaGVjayA9XG4gIHwgeyBraW5kOiBcIm1pblwiOyB2YWx1ZTogbnVtYmVyOyBtZXNzYWdlPzogc3RyaW5nIH1cbiAgfCB7IGtpbmQ6IFwibWF4XCI7IHZhbHVlOiBudW1iZXI7IG1lc3NhZ2U/OiBzdHJpbmcgfVxuICB8IHsga2luZDogXCJlbWFpbFwiOyBtZXNzYWdlPzogc3RyaW5nIH1cbiAgfCB7IGtpbmQ6IFwidXJsXCI7IG1lc3NhZ2U/OiBzdHJpbmcgfVxuICB8IHsga2luZDogXCJ1dWlkXCI7IG1lc3NhZ2U/OiBzdHJpbmcgfVxuICB8IHsga2luZDogXCJjdWlkXCI7IG1lc3NhZ2U/OiBzdHJpbmcgfVxuICB8IHsga2luZDogXCJyZWdleFwiOyByZWdleDogUmVnRXhwOyBtZXNzYWdlPzogc3RyaW5nIH07XG5cbmV4cG9ydCBpbnRlcmZhY2UgWm9kU3RyaW5nRGVmIGV4dGVuZHMgWm9kVHlwZURlZiB7XG4gIGNoZWNrczogWm9kU3RyaW5nQ2hlY2tbXTtcbiAgdHlwZU5hbWU6IFpvZEZpcnN0UGFydHlUeXBlS2luZC5ab2RTdHJpbmc7XG59XG5cbmNvbnN0IGN1aWRSZWdleCA9IC9eY1teXFxzLV17OCx9JC9pO1xuY29uc3QgdXVpZFJlZ2V4ID1cbiAgL14oW2EtZjAtOV17OH0tW2EtZjAtOV17NH0tWzEtNV1bYS1mMC05XXszfS1bYS1mMC05XXs0fS1bYS1mMC05XXsxMn18MDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAwKSQvaTtcbi8vIGZyb20gaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9hLzQ2MTgxLzE1NTAxNTVcbi8vIG9sZCB2ZXJzaW9uOiB0b28gc2xvdywgZGlkbid0IHN1cHBvcnQgdW5pY29kZVxuLy8gY29uc3QgZW1haWxSZWdleCA9IC9eKCgoW2Etel18XFxkfFshI1xcJCUmJ1xcKlxcK1xcLVxcLz1cXD9cXF5fYHtcXHx9fl18W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pKyhcXC4oW2Etel18XFxkfFshI1xcJCUmJ1xcKlxcK1xcLVxcLz1cXD9cXF5fYHtcXHx9fl18W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pKykqKXwoKFxceDIyKSgoKChcXHgyMHxcXHgwOSkqKFxceDBkXFx4MGEpKT8oXFx4MjB8XFx4MDkpKyk/KChbXFx4MDEtXFx4MDhcXHgwYlxceDBjXFx4MGUtXFx4MWZcXHg3Zl18XFx4MjF8W1xceDIzLVxceDViXXxbXFx4NWQtXFx4N2VdfFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKXwoXFxcXChbXFx4MDEtXFx4MDlcXHgwYlxceDBjXFx4MGQtXFx4N2ZdfFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKSkpKSooKChcXHgyMHxcXHgwOSkqKFxceDBkXFx4MGEpKT8oXFx4MjB8XFx4MDkpKyk/KFxceDIyKSkpQCgoKFthLXpdfFxcZHxbXFx1MDBBMC1cXHVEN0ZGXFx1RjkwMC1cXHVGRENGXFx1RkRGMC1cXHVGRkVGXSl8KChbYS16XXxcXGR8W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pKFthLXpdfFxcZHwtfFxcLnxffH58W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pKihbYS16XXxcXGR8W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pKSlcXC4pKygoW2Etel18W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pfCgoW2Etel18W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pKFthLXpdfFxcZHwtfFxcLnxffH58W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pKihbYS16XXxbXFx1MDBBMC1cXHVEN0ZGXFx1RjkwMC1cXHVGRENGXFx1RkRGMC1cXHVGRkVGXSkpKSQvaTtcbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZVxuY29uc3QgZW1haWxSZWdleCA9XG4gIC9eKChbXjw+KClbXFxdXFwuLDs6XFxzQFxcXCJdKyhcXC5bXjw+KClbXFxdXFwuLDs6XFxzQFxcXCJdKykqKXwoXFxcIi4rXFxcIikpQCgoW148PigpW1xcXVxcLiw7Olxcc0BcXFwiXStcXC4pK1tePD4oKVtcXF1cXC4sOzpcXHNAXFxcIl17Mix9KSQvaTtcblxuZXhwb3J0IGNsYXNzIFpvZFN0cmluZyBleHRlbmRzIFpvZFR5cGU8c3RyaW5nLCBab2RTdHJpbmdEZWY+IHtcbiAgX3BhcnNlKGlucHV0OiBQYXJzZUlucHV0KTogUGFyc2VSZXR1cm5UeXBlPHN0cmluZz4ge1xuICAgIGNvbnN0IHBhcnNlZFR5cGUgPSB0aGlzLl9nZXRUeXBlKGlucHV0KTtcblxuICAgIGlmIChwYXJzZWRUeXBlICE9PSBab2RQYXJzZWRUeXBlLnN0cmluZykge1xuICAgICAgY29uc3QgY3R4ID0gdGhpcy5fZ2V0T3JSZXR1cm5DdHgoaW5wdXQpO1xuICAgICAgYWRkSXNzdWVUb0NvbnRleHQoXG4gICAgICAgIGN0eCxcbiAgICAgICAge1xuICAgICAgICAgIGNvZGU6IFpvZElzc3VlQ29kZS5pbnZhbGlkX3R5cGUsXG4gICAgICAgICAgZXhwZWN0ZWQ6IFpvZFBhcnNlZFR5cGUuc3RyaW5nLFxuICAgICAgICAgIHJlY2VpdmVkOiBjdHgucGFyc2VkVHlwZSxcbiAgICAgICAgfVxuICAgICAgICAvL1xuICAgICAgKTtcbiAgICAgIHJldHVybiBJTlZBTElEO1xuICAgIH1cblxuICAgIGNvbnN0IHN0YXR1cyA9IG5ldyBQYXJzZVN0YXR1cygpO1xuICAgIGxldCBjdHg6IHVuZGVmaW5lZCB8IFBhcnNlQ29udGV4dCA9IHVuZGVmaW5lZDtcblxuICAgIGZvciAoY29uc3QgY2hlY2sgb2YgdGhpcy5fZGVmLmNoZWNrcykge1xuICAgICAgaWYgKGNoZWNrLmtpbmQgPT09IFwibWluXCIpIHtcbiAgICAgICAgaWYgKGlucHV0LmRhdGEubGVuZ3RoIDwgY2hlY2sudmFsdWUpIHtcbiAgICAgICAgICBjdHggPSB0aGlzLl9nZXRPclJldHVybkN0eChpbnB1dCwgY3R4KTtcbiAgICAgICAgICBhZGRJc3N1ZVRvQ29udGV4dChjdHgsIHtcbiAgICAgICAgICAgIGNvZGU6IFpvZElzc3VlQ29kZS50b29fc21hbGwsXG4gICAgICAgICAgICBtaW5pbXVtOiBjaGVjay52YWx1ZSxcbiAgICAgICAgICAgIHR5cGU6IFwic3RyaW5nXCIsXG4gICAgICAgICAgICBpbmNsdXNpdmU6IHRydWUsXG4gICAgICAgICAgICBtZXNzYWdlOiBjaGVjay5tZXNzYWdlLFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHN0YXR1cy5kaXJ0eSgpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGNoZWNrLmtpbmQgPT09IFwibWF4XCIpIHtcbiAgICAgICAgaWYgKGlucHV0LmRhdGEubGVuZ3RoID4gY2hlY2sudmFsdWUpIHtcbiAgICAgICAgICBjdHggPSB0aGlzLl9nZXRPclJldHVybkN0eChpbnB1dCwgY3R4KTtcbiAgICAgICAgICBhZGRJc3N1ZVRvQ29udGV4dChjdHgsIHtcbiAgICAgICAgICAgIGNvZGU6IFpvZElzc3VlQ29kZS50b29fYmlnLFxuICAgICAgICAgICAgbWF4aW11bTogY2hlY2sudmFsdWUsXG4gICAgICAgICAgICB0eXBlOiBcInN0cmluZ1wiLFxuICAgICAgICAgICAgaW5jbHVzaXZlOiB0cnVlLFxuICAgICAgICAgICAgbWVzc2FnZTogY2hlY2subWVzc2FnZSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBzdGF0dXMuZGlydHkoKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChjaGVjay5raW5kID09PSBcImVtYWlsXCIpIHtcbiAgICAgICAgaWYgKCFlbWFpbFJlZ2V4LnRlc3QoaW5wdXQuZGF0YSkpIHtcbiAgICAgICAgICBjdHggPSB0aGlzLl9nZXRPclJldHVybkN0eChpbnB1dCwgY3R4KTtcbiAgICAgICAgICBhZGRJc3N1ZVRvQ29udGV4dChjdHgsIHtcbiAgICAgICAgICAgIHZhbGlkYXRpb246IFwiZW1haWxcIixcbiAgICAgICAgICAgIGNvZGU6IFpvZElzc3VlQ29kZS5pbnZhbGlkX3N0cmluZyxcbiAgICAgICAgICAgIG1lc3NhZ2U6IGNoZWNrLm1lc3NhZ2UsXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgc3RhdHVzLmRpcnR5KCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoY2hlY2sua2luZCA9PT0gXCJ1dWlkXCIpIHtcbiAgICAgICAgaWYgKCF1dWlkUmVnZXgudGVzdChpbnB1dC5kYXRhKSkge1xuICAgICAgICAgIGN0eCA9IHRoaXMuX2dldE9yUmV0dXJuQ3R4KGlucHV0LCBjdHgpO1xuICAgICAgICAgIGFkZElzc3VlVG9Db250ZXh0KGN0eCwge1xuICAgICAgICAgICAgdmFsaWRhdGlvbjogXCJ1dWlkXCIsXG4gICAgICAgICAgICBjb2RlOiBab2RJc3N1ZUNvZGUuaW52YWxpZF9zdHJpbmcsXG4gICAgICAgICAgICBtZXNzYWdlOiBjaGVjay5tZXNzYWdlLFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHN0YXR1cy5kaXJ0eSgpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGNoZWNrLmtpbmQgPT09IFwiY3VpZFwiKSB7XG4gICAgICAgIGlmICghY3VpZFJlZ2V4LnRlc3QoaW5wdXQuZGF0YSkpIHtcbiAgICAgICAgICBjdHggPSB0aGlzLl9nZXRPclJldHVybkN0eChpbnB1dCwgY3R4KTtcbiAgICAgICAgICBhZGRJc3N1ZVRvQ29udGV4dChjdHgsIHtcbiAgICAgICAgICAgIHZhbGlkYXRpb246IFwiY3VpZFwiLFxuICAgICAgICAgICAgY29kZTogWm9kSXNzdWVDb2RlLmludmFsaWRfc3RyaW5nLFxuICAgICAgICAgICAgbWVzc2FnZTogY2hlY2subWVzc2FnZSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBzdGF0dXMuZGlydHkoKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChjaGVjay5raW5kID09PSBcInVybFwiKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgbmV3IFVSTChpbnB1dC5kYXRhKTtcbiAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgY3R4ID0gdGhpcy5fZ2V0T3JSZXR1cm5DdHgoaW5wdXQsIGN0eCk7XG4gICAgICAgICAgYWRkSXNzdWVUb0NvbnRleHQoY3R4LCB7XG4gICAgICAgICAgICB2YWxpZGF0aW9uOiBcInVybFwiLFxuICAgICAgICAgICAgY29kZTogWm9kSXNzdWVDb2RlLmludmFsaWRfc3RyaW5nLFxuICAgICAgICAgICAgbWVzc2FnZTogY2hlY2subWVzc2FnZSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBzdGF0dXMuZGlydHkoKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChjaGVjay5raW5kID09PSBcInJlZ2V4XCIpIHtcbiAgICAgICAgY2hlY2sucmVnZXgubGFzdEluZGV4ID0gMDtcbiAgICAgICAgY29uc3QgdGVzdFJlc3VsdCA9IGNoZWNrLnJlZ2V4LnRlc3QoaW5wdXQuZGF0YSk7XG4gICAgICAgIGlmICghdGVzdFJlc3VsdCkge1xuICAgICAgICAgIGN0eCA9IHRoaXMuX2dldE9yUmV0dXJuQ3R4KGlucHV0LCBjdHgpO1xuICAgICAgICAgIGFkZElzc3VlVG9Db250ZXh0KGN0eCwge1xuICAgICAgICAgICAgdmFsaWRhdGlvbjogXCJyZWdleFwiLFxuICAgICAgICAgICAgY29kZTogWm9kSXNzdWVDb2RlLmludmFsaWRfc3RyaW5nLFxuICAgICAgICAgICAgbWVzc2FnZTogY2hlY2subWVzc2FnZSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBzdGF0dXMuZGlydHkoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7IHN0YXR1czogc3RhdHVzLnZhbHVlLCB2YWx1ZTogaW5wdXQuZGF0YSB9O1xuICB9XG5cbiAgcHJvdGVjdGVkIF9yZWdleCA9IChcbiAgICByZWdleDogUmVnRXhwLFxuICAgIHZhbGlkYXRpb246IFN0cmluZ1ZhbGlkYXRpb24sXG4gICAgbWVzc2FnZT86IGVycm9yVXRpbC5FcnJNZXNzYWdlXG4gICkgPT5cbiAgICB0aGlzLnJlZmluZW1lbnQoKGRhdGEpID0+IHJlZ2V4LnRlc3QoZGF0YSksIHtcbiAgICAgIHZhbGlkYXRpb24sXG4gICAgICBjb2RlOiBab2RJc3N1ZUNvZGUuaW52YWxpZF9zdHJpbmcsXG4gICAgICAuLi5lcnJvclV0aWwuZXJyVG9PYmoobWVzc2FnZSksXG4gICAgfSk7XG5cbiAgX2FkZENoZWNrKGNoZWNrOiBab2RTdHJpbmdDaGVjaykge1xuICAgIHJldHVybiBuZXcgWm9kU3RyaW5nKHtcbiAgICAgIC4uLnRoaXMuX2RlZixcbiAgICAgIGNoZWNrczogWy4uLnRoaXMuX2RlZi5jaGVja3MsIGNoZWNrXSxcbiAgICB9KTtcbiAgfVxuXG4gIGVtYWlsKG1lc3NhZ2U/OiBlcnJvclV0aWwuRXJyTWVzc2FnZSkge1xuICAgIHJldHVybiB0aGlzLl9hZGRDaGVjayh7IGtpbmQ6IFwiZW1haWxcIiwgLi4uZXJyb3JVdGlsLmVyclRvT2JqKG1lc3NhZ2UpIH0pO1xuICB9XG4gIHVybChtZXNzYWdlPzogZXJyb3JVdGlsLkVyck1lc3NhZ2UpIHtcbiAgICByZXR1cm4gdGhpcy5fYWRkQ2hlY2soeyBraW5kOiBcInVybFwiLCAuLi5lcnJvclV0aWwuZXJyVG9PYmoobWVzc2FnZSkgfSk7XG4gIH1cbiAgdXVpZChtZXNzYWdlPzogZXJyb3JVdGlsLkVyck1lc3NhZ2UpIHtcbiAgICByZXR1cm4gdGhpcy5fYWRkQ2hlY2soeyBraW5kOiBcInV1aWRcIiwgLi4uZXJyb3JVdGlsLmVyclRvT2JqKG1lc3NhZ2UpIH0pO1xuICB9XG4gIGN1aWQobWVzc2FnZT86IGVycm9yVXRpbC5FcnJNZXNzYWdlKSB7XG4gICAgcmV0dXJuIHRoaXMuX2FkZENoZWNrKHsga2luZDogXCJjdWlkXCIsIC4uLmVycm9yVXRpbC5lcnJUb09iaihtZXNzYWdlKSB9KTtcbiAgfVxuICByZWdleChyZWdleDogUmVnRXhwLCBtZXNzYWdlPzogZXJyb3JVdGlsLkVyck1lc3NhZ2UpIHtcbiAgICByZXR1cm4gdGhpcy5fYWRkQ2hlY2soe1xuICAgICAga2luZDogXCJyZWdleFwiLFxuICAgICAgcmVnZXg6IHJlZ2V4LFxuICAgICAgLi4uZXJyb3JVdGlsLmVyclRvT2JqKG1lc3NhZ2UpLFxuICAgIH0pO1xuICB9XG5cbiAgbWluKG1pbkxlbmd0aDogbnVtYmVyLCBtZXNzYWdlPzogZXJyb3JVdGlsLkVyck1lc3NhZ2UpIHtcbiAgICByZXR1cm4gdGhpcy5fYWRkQ2hlY2soe1xuICAgICAga2luZDogXCJtaW5cIixcbiAgICAgIHZhbHVlOiBtaW5MZW5ndGgsXG4gICAgICAuLi5lcnJvclV0aWwuZXJyVG9PYmoobWVzc2FnZSksXG4gICAgfSk7XG4gIH1cblxuICBtYXgobWF4TGVuZ3RoOiBudW1iZXIsIG1lc3NhZ2U/OiBlcnJvclV0aWwuRXJyTWVzc2FnZSkge1xuICAgIHJldHVybiB0aGlzLl9hZGRDaGVjayh7XG4gICAgICBraW5kOiBcIm1heFwiLFxuICAgICAgdmFsdWU6IG1heExlbmd0aCxcbiAgICAgIC4uLmVycm9yVXRpbC5lcnJUb09iaihtZXNzYWdlKSxcbiAgICB9KTtcbiAgfVxuXG4gIGxlbmd0aChsZW46IG51bWJlciwgbWVzc2FnZT86IGVycm9yVXRpbC5FcnJNZXNzYWdlKSB7XG4gICAgcmV0dXJuIHRoaXMubWluKGxlbiwgbWVzc2FnZSkubWF4KGxlbiwgbWVzc2FnZSk7XG4gIH1cblxuICAvKipcbiAgICogRGVwcmVjYXRlZC5cbiAgICogVXNlIHouc3RyaW5nKCkubWluKDEpIGluc3RlYWQuXG4gICAqL1xuICBub25lbXB0eSA9IChtZXNzYWdlPzogZXJyb3JVdGlsLkVyck1lc3NhZ2UpID0+XG4gICAgdGhpcy5taW4oMSwgZXJyb3JVdGlsLmVyclRvT2JqKG1lc3NhZ2UpKTtcblxuICBnZXQgaXNFbWFpbCgpIHtcbiAgICByZXR1cm4gISF0aGlzLl9kZWYuY2hlY2tzLmZpbmQoKGNoKSA9PiBjaC5raW5kID09PSBcImVtYWlsXCIpO1xuICB9XG4gIGdldCBpc1VSTCgpIHtcbiAgICByZXR1cm4gISF0aGlzLl9kZWYuY2hlY2tzLmZpbmQoKGNoKSA9PiBjaC5raW5kID09PSBcInVybFwiKTtcbiAgfVxuICBnZXQgaXNVVUlEKCkge1xuICAgIHJldHVybiAhIXRoaXMuX2RlZi5jaGVja3MuZmluZCgoY2gpID0+IGNoLmtpbmQgPT09IFwidXVpZFwiKTtcbiAgfVxuICBnZXQgaXNDVUlEKCkge1xuICAgIHJldHVybiAhIXRoaXMuX2RlZi5jaGVja3MuZmluZCgoY2gpID0+IGNoLmtpbmQgPT09IFwiY3VpZFwiKTtcbiAgfVxuICBnZXQgbWluTGVuZ3RoKCkge1xuICAgIGxldCBtaW46IG51bWJlciB8IG51bGwgPSAtSW5maW5pdHk7XG4gICAgdGhpcy5fZGVmLmNoZWNrcy5tYXAoKGNoKSA9PiB7XG4gICAgICBpZiAoY2gua2luZCA9PT0gXCJtaW5cIikge1xuICAgICAgICBpZiAobWluID09PSBudWxsIHx8IGNoLnZhbHVlID4gbWluKSB7XG4gICAgICAgICAgbWluID0gY2gudmFsdWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gbWluO1xuICB9XG4gIGdldCBtYXhMZW5ndGgoKSB7XG4gICAgbGV0IG1heDogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG4gICAgdGhpcy5fZGVmLmNoZWNrcy5tYXAoKGNoKSA9PiB7XG4gICAgICBpZiAoY2gua2luZCA9PT0gXCJtYXhcIikge1xuICAgICAgICBpZiAobWF4ID09PSBudWxsIHx8IGNoLnZhbHVlIDwgbWF4KSB7XG4gICAgICAgICAgbWF4ID0gY2gudmFsdWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gbWF4O1xuICB9XG4gIHN0YXRpYyBjcmVhdGUgPSAocGFyYW1zPzogUmF3Q3JlYXRlUGFyYW1zKTogWm9kU3RyaW5nID0+IHtcbiAgICByZXR1cm4gbmV3IFpvZFN0cmluZyh7XG4gICAgICBjaGVja3M6IFtdLFxuICAgICAgdHlwZU5hbWU6IFpvZEZpcnN0UGFydHlUeXBlS2luZC5ab2RTdHJpbmcsXG4gICAgICAuLi5wcm9jZXNzQ3JlYXRlUGFyYW1zKHBhcmFtcyksXG4gICAgfSk7XG4gIH07XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLy8vLy8vLyAgICAgICAgICAgICAgICAgICAgIC8vLy8vLy8vLy9cbi8vLy8vLy8vLy8gICAgICBab2ROdW1iZXIgICAgICAvLy8vLy8vLy8vXG4vLy8vLy8vLy8vICAgICAgICAgICAgICAgICAgICAgLy8vLy8vLy8vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG50eXBlIFpvZE51bWJlckNoZWNrID1cbiAgfCB7IGtpbmQ6IFwibWluXCI7IHZhbHVlOiBudW1iZXI7IGluY2x1c2l2ZTogYm9vbGVhbjsgbWVzc2FnZT86IHN0cmluZyB9XG4gIHwgeyBraW5kOiBcIm1heFwiOyB2YWx1ZTogbnVtYmVyOyBpbmNsdXNpdmU6IGJvb2xlYW47IG1lc3NhZ2U/OiBzdHJpbmcgfVxuICB8IHsga2luZDogXCJpbnRcIjsgbWVzc2FnZT86IHN0cmluZyB9XG4gIHwgeyBraW5kOiBcIm11bHRpcGxlT2ZcIjsgdmFsdWU6IG51bWJlcjsgbWVzc2FnZT86IHN0cmluZyB9O1xuXG4vLyBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8zOTY2NDg0L3doeS1kb2VzLW1vZHVsdXMtb3BlcmF0b3ItcmV0dXJuLWZyYWN0aW9uYWwtbnVtYmVyLWluLWphdmFzY3JpcHQvMzE3MTEwMzQjMzE3MTEwMzRcbmZ1bmN0aW9uIGZsb2F0U2FmZVJlbWFpbmRlcih2YWw6IG51bWJlciwgc3RlcDogbnVtYmVyKSB7XG4gIGNvbnN0IHZhbERlY0NvdW50ID0gKHZhbC50b1N0cmluZygpLnNwbGl0KFwiLlwiKVsxXSB8fCBcIlwiKS5sZW5ndGg7XG4gIGNvbnN0IHN0ZXBEZWNDb3VudCA9IChzdGVwLnRvU3RyaW5nKCkuc3BsaXQoXCIuXCIpWzFdIHx8IFwiXCIpLmxlbmd0aDtcbiAgY29uc3QgZGVjQ291bnQgPSB2YWxEZWNDb3VudCA+IHN0ZXBEZWNDb3VudCA/IHZhbERlY0NvdW50IDogc3RlcERlY0NvdW50O1xuICBjb25zdCB2YWxJbnQgPSBwYXJzZUludCh2YWwudG9GaXhlZChkZWNDb3VudCkucmVwbGFjZShcIi5cIiwgXCJcIikpO1xuICBjb25zdCBzdGVwSW50ID0gcGFyc2VJbnQoc3RlcC50b0ZpeGVkKGRlY0NvdW50KS5yZXBsYWNlKFwiLlwiLCBcIlwiKSk7XG4gIHJldHVybiAodmFsSW50ICUgc3RlcEludCkgLyBNYXRoLnBvdygxMCwgZGVjQ291bnQpO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFpvZE51bWJlckRlZiBleHRlbmRzIFpvZFR5cGVEZWYge1xuICBjaGVja3M6IFpvZE51bWJlckNoZWNrW107XG4gIHR5cGVOYW1lOiBab2RGaXJzdFBhcnR5VHlwZUtpbmQuWm9kTnVtYmVyO1xufVxuXG5leHBvcnQgY2xhc3MgWm9kTnVtYmVyIGV4dGVuZHMgWm9kVHlwZTxudW1iZXIsIFpvZE51bWJlckRlZj4ge1xuICBfcGFyc2UoaW5wdXQ6IFBhcnNlSW5wdXQpOiBQYXJzZVJldHVyblR5cGU8bnVtYmVyPiB7XG4gICAgY29uc3QgcGFyc2VkVHlwZSA9IHRoaXMuX2dldFR5cGUoaW5wdXQpO1xuICAgIGlmIChwYXJzZWRUeXBlICE9PSBab2RQYXJzZWRUeXBlLm51bWJlcikge1xuICAgICAgY29uc3QgY3R4ID0gdGhpcy5fZ2V0T3JSZXR1cm5DdHgoaW5wdXQpO1xuICAgICAgYWRkSXNzdWVUb0NvbnRleHQoY3R4LCB7XG4gICAgICAgIGNvZGU6IFpvZElzc3VlQ29kZS5pbnZhbGlkX3R5cGUsXG4gICAgICAgIGV4cGVjdGVkOiBab2RQYXJzZWRUeXBlLm51bWJlcixcbiAgICAgICAgcmVjZWl2ZWQ6IGN0eC5wYXJzZWRUeXBlLFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gSU5WQUxJRDtcbiAgICB9XG5cbiAgICBsZXQgY3R4OiB1bmRlZmluZWQgfCBQYXJzZUNvbnRleHQgPSB1bmRlZmluZWQ7XG4gICAgY29uc3Qgc3RhdHVzID0gbmV3IFBhcnNlU3RhdHVzKCk7XG5cbiAgICBmb3IgKGNvbnN0IGNoZWNrIG9mIHRoaXMuX2RlZi5jaGVja3MpIHtcbiAgICAgIGlmIChjaGVjay5raW5kID09PSBcImludFwiKSB7XG4gICAgICAgIGlmICghdXRpbC5pc0ludGVnZXIoaW5wdXQuZGF0YSkpIHtcbiAgICAgICAgICBjdHggPSB0aGlzLl9nZXRPclJldHVybkN0eChpbnB1dCwgY3R4KTtcbiAgICAgICAgICBhZGRJc3N1ZVRvQ29udGV4dChjdHgsIHtcbiAgICAgICAgICAgIGNvZGU6IFpvZElzc3VlQ29kZS5pbnZhbGlkX3R5cGUsXG4gICAgICAgICAgICBleHBlY3RlZDogXCJpbnRlZ2VyXCIsXG4gICAgICAgICAgICByZWNlaXZlZDogXCJmbG9hdFwiLFxuICAgICAgICAgICAgbWVzc2FnZTogY2hlY2subWVzc2FnZSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBzdGF0dXMuZGlydHkoKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChjaGVjay5raW5kID09PSBcIm1pblwiKSB7XG4gICAgICAgIGNvbnN0IHRvb1NtYWxsID0gY2hlY2suaW5jbHVzaXZlXG4gICAgICAgICAgPyBpbnB1dC5kYXRhIDwgY2hlY2sudmFsdWVcbiAgICAgICAgICA6IGlucHV0LmRhdGEgPD0gY2hlY2sudmFsdWU7XG4gICAgICAgIGlmICh0b29TbWFsbCkge1xuICAgICAgICAgIGN0eCA9IHRoaXMuX2dldE9yUmV0dXJuQ3R4KGlucHV0LCBjdHgpO1xuICAgICAgICAgIGFkZElzc3VlVG9Db250ZXh0KGN0eCwge1xuICAgICAgICAgICAgY29kZTogWm9kSXNzdWVDb2RlLnRvb19zbWFsbCxcbiAgICAgICAgICAgIG1pbmltdW06IGNoZWNrLnZhbHVlLFxuICAgICAgICAgICAgdHlwZTogXCJudW1iZXJcIixcbiAgICAgICAgICAgIGluY2x1c2l2ZTogY2hlY2suaW5jbHVzaXZlLFxuICAgICAgICAgICAgbWVzc2FnZTogY2hlY2subWVzc2FnZSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBzdGF0dXMuZGlydHkoKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChjaGVjay5raW5kID09PSBcIm1heFwiKSB7XG4gICAgICAgIGNvbnN0IHRvb0JpZyA9IGNoZWNrLmluY2x1c2l2ZVxuICAgICAgICAgID8gaW5wdXQuZGF0YSA+IGNoZWNrLnZhbHVlXG4gICAgICAgICAgOiBpbnB1dC5kYXRhID49IGNoZWNrLnZhbHVlO1xuICAgICAgICBpZiAodG9vQmlnKSB7XG4gICAgICAgICAgY3R4ID0gdGhpcy5fZ2V0T3JSZXR1cm5DdHgoaW5wdXQsIGN0eCk7XG4gICAgICAgICAgYWRkSXNzdWVUb0NvbnRleHQoY3R4LCB7XG4gICAgICAgICAgICBjb2RlOiBab2RJc3N1ZUNvZGUudG9vX2JpZyxcbiAgICAgICAgICAgIG1heGltdW06IGNoZWNrLnZhbHVlLFxuICAgICAgICAgICAgdHlwZTogXCJudW1iZXJcIixcbiAgICAgICAgICAgIGluY2x1c2l2ZTogY2hlY2suaW5jbHVzaXZlLFxuICAgICAgICAgICAgbWVzc2FnZTogY2hlY2subWVzc2FnZSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBzdGF0dXMuZGlydHkoKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChjaGVjay5raW5kID09PSBcIm11bHRpcGxlT2ZcIikge1xuICAgICAgICBpZiAoZmxvYXRTYWZlUmVtYWluZGVyKGlucHV0LmRhdGEsIGNoZWNrLnZhbHVlKSAhPT0gMCkge1xuICAgICAgICAgIGN0eCA9IHRoaXMuX2dldE9yUmV0dXJuQ3R4KGlucHV0LCBjdHgpO1xuICAgICAgICAgIGFkZElzc3VlVG9Db250ZXh0KGN0eCwge1xuICAgICAgICAgICAgY29kZTogWm9kSXNzdWVDb2RlLm5vdF9tdWx0aXBsZV9vZixcbiAgICAgICAgICAgIG11bHRpcGxlT2Y6IGNoZWNrLnZhbHVlLFxuICAgICAgICAgICAgbWVzc2FnZTogY2hlY2subWVzc2FnZSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBzdGF0dXMuZGlydHkoKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdXRpbC5hc3NlcnROZXZlcihjaGVjayk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHsgc3RhdHVzOiBzdGF0dXMudmFsdWUsIHZhbHVlOiBpbnB1dC5kYXRhIH07XG4gIH1cblxuICBzdGF0aWMgY3JlYXRlID0gKHBhcmFtcz86IFJhd0NyZWF0ZVBhcmFtcyk6IFpvZE51bWJlciA9PiB7XG4gICAgcmV0dXJuIG5ldyBab2ROdW1iZXIoe1xuICAgICAgY2hlY2tzOiBbXSxcbiAgICAgIHR5cGVOYW1lOiBab2RGaXJzdFBhcnR5VHlwZUtpbmQuWm9kTnVtYmVyLFxuICAgICAgLi4ucHJvY2Vzc0NyZWF0ZVBhcmFtcyhwYXJhbXMpLFxuICAgIH0pO1xuICB9O1xuXG4gIGd0ZSh2YWx1ZTogbnVtYmVyLCBtZXNzYWdlPzogZXJyb3JVdGlsLkVyck1lc3NhZ2UpIHtcbiAgICByZXR1cm4gdGhpcy5zZXRMaW1pdChcIm1pblwiLCB2YWx1ZSwgdHJ1ZSwgZXJyb3JVdGlsLnRvU3RyaW5nKG1lc3NhZ2UpKTtcbiAgfVxuICBtaW4gPSB0aGlzLmd0ZTtcblxuICBndCh2YWx1ZTogbnVtYmVyLCBtZXNzYWdlPzogZXJyb3JVdGlsLkVyck1lc3NhZ2UpIHtcbiAgICByZXR1cm4gdGhpcy5zZXRMaW1pdChcIm1pblwiLCB2YWx1ZSwgZmFsc2UsIGVycm9yVXRpbC50b1N0cmluZyhtZXNzYWdlKSk7XG4gIH1cblxuICBsdGUodmFsdWU6IG51bWJlciwgbWVzc2FnZT86IGVycm9yVXRpbC5FcnJNZXNzYWdlKSB7XG4gICAgcmV0dXJuIHRoaXMuc2V0TGltaXQoXCJtYXhcIiwgdmFsdWUsIHRydWUsIGVycm9yVXRpbC50b1N0cmluZyhtZXNzYWdlKSk7XG4gIH1cbiAgbWF4ID0gdGhpcy5sdGU7XG5cbiAgbHQodmFsdWU6IG51bWJlciwgbWVzc2FnZT86IGVycm9yVXRpbC5FcnJNZXNzYWdlKSB7XG4gICAgcmV0dXJuIHRoaXMuc2V0TGltaXQoXCJtYXhcIiwgdmFsdWUsIGZhbHNlLCBlcnJvclV0aWwudG9TdHJpbmcobWVzc2FnZSkpO1xuICB9XG5cbiAgcHJvdGVjdGVkIHNldExpbWl0KFxuICAgIGtpbmQ6IFwibWluXCIgfCBcIm1heFwiLFxuICAgIHZhbHVlOiBudW1iZXIsXG4gICAgaW5jbHVzaXZlOiBib29sZWFuLFxuICAgIG1lc3NhZ2U/OiBzdHJpbmdcbiAgKSB7XG4gICAgcmV0dXJuIG5ldyBab2ROdW1iZXIoe1xuICAgICAgLi4udGhpcy5fZGVmLFxuICAgICAgY2hlY2tzOiBbXG4gICAgICAgIC4uLnRoaXMuX2RlZi5jaGVja3MsXG4gICAgICAgIHtcbiAgICAgICAgICBraW5kLFxuICAgICAgICAgIHZhbHVlLFxuICAgICAgICAgIGluY2x1c2l2ZSxcbiAgICAgICAgICBtZXNzYWdlOiBlcnJvclV0aWwudG9TdHJpbmcobWVzc2FnZSksXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0pO1xuICB9XG5cbiAgX2FkZENoZWNrKGNoZWNrOiBab2ROdW1iZXJDaGVjaykge1xuICAgIHJldHVybiBuZXcgWm9kTnVtYmVyKHtcbiAgICAgIC4uLnRoaXMuX2RlZixcbiAgICAgIGNoZWNrczogWy4uLnRoaXMuX2RlZi5jaGVja3MsIGNoZWNrXSxcbiAgICB9KTtcbiAgfVxuXG4gIGludChtZXNzYWdlPzogZXJyb3JVdGlsLkVyck1lc3NhZ2UpIHtcbiAgICByZXR1cm4gdGhpcy5fYWRkQ2hlY2soe1xuICAgICAga2luZDogXCJpbnRcIixcbiAgICAgIG1lc3NhZ2U6IGVycm9yVXRpbC50b1N0cmluZyhtZXNzYWdlKSxcbiAgICB9KTtcbiAgfVxuXG4gIHBvc2l0aXZlKG1lc3NhZ2U/OiBlcnJvclV0aWwuRXJyTWVzc2FnZSkge1xuICAgIHJldHVybiB0aGlzLl9hZGRDaGVjayh7XG4gICAgICBraW5kOiBcIm1pblwiLFxuICAgICAgdmFsdWU6IDAsXG4gICAgICBpbmNsdXNpdmU6IGZhbHNlLFxuICAgICAgbWVzc2FnZTogZXJyb3JVdGlsLnRvU3RyaW5nKG1lc3NhZ2UpLFxuICAgIH0pO1xuICB9XG5cbiAgbmVnYXRpdmUobWVzc2FnZT86IGVycm9yVXRpbC5FcnJNZXNzYWdlKSB7XG4gICAgcmV0dXJuIHRoaXMuX2FkZENoZWNrKHtcbiAgICAgIGtpbmQ6IFwibWF4XCIsXG4gICAgICB2YWx1ZTogMCxcbiAgICAgIGluY2x1c2l2ZTogZmFsc2UsXG4gICAgICBtZXNzYWdlOiBlcnJvclV0aWwudG9TdHJpbmcobWVzc2FnZSksXG4gICAgfSk7XG4gIH1cblxuICBub25wb3NpdGl2ZShtZXNzYWdlPzogZXJyb3JVdGlsLkVyck1lc3NhZ2UpIHtcbiAgICByZXR1cm4gdGhpcy5fYWRkQ2hlY2soe1xuICAgICAga2luZDogXCJtYXhcIixcbiAgICAgIHZhbHVlOiAwLFxuICAgICAgaW5jbHVzaXZlOiB0cnVlLFxuICAgICAgbWVzc2FnZTogZXJyb3JVdGlsLnRvU3RyaW5nKG1lc3NhZ2UpLFxuICAgIH0pO1xuICB9XG5cbiAgbm9ubmVnYXRpdmUobWVzc2FnZT86IGVycm9yVXRpbC5FcnJNZXNzYWdlKSB7XG4gICAgcmV0dXJuIHRoaXMuX2FkZENoZWNrKHtcbiAgICAgIGtpbmQ6IFwibWluXCIsXG4gICAgICB2YWx1ZTogMCxcbiAgICAgIGluY2x1c2l2ZTogdHJ1ZSxcbiAgICAgIG1lc3NhZ2U6IGVycm9yVXRpbC50b1N0cmluZyhtZXNzYWdlKSxcbiAgICB9KTtcbiAgfVxuXG4gIG11bHRpcGxlT2YodmFsdWU6IG51bWJlciwgbWVzc2FnZT86IGVycm9yVXRpbC5FcnJNZXNzYWdlKSB7XG4gICAgcmV0dXJuIHRoaXMuX2FkZENoZWNrKHtcbiAgICAgIGtpbmQ6IFwibXVsdGlwbGVPZlwiLFxuICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgbWVzc2FnZTogZXJyb3JVdGlsLnRvU3RyaW5nKG1lc3NhZ2UpLFxuICAgIH0pO1xuICB9XG5cbiAgc3RlcCA9IHRoaXMubXVsdGlwbGVPZjtcblxuICBnZXQgbWluVmFsdWUoKSB7XG4gICAgbGV0IG1pbjogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG4gICAgZm9yIChjb25zdCBjaCBvZiB0aGlzLl9kZWYuY2hlY2tzKSB7XG4gICAgICBpZiAoY2gua2luZCA9PT0gXCJtaW5cIikge1xuICAgICAgICBpZiAobWluID09PSBudWxsIHx8IGNoLnZhbHVlID4gbWluKSBtaW4gPSBjaC52YWx1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG1pbjtcbiAgfVxuXG4gIGdldCBtYXhWYWx1ZSgpIHtcbiAgICBsZXQgbWF4OiBudW1iZXIgfCBudWxsID0gbnVsbDtcbiAgICBmb3IgKGNvbnN0IGNoIG9mIHRoaXMuX2RlZi5jaGVja3MpIHtcbiAgICAgIGlmIChjaC5raW5kID09PSBcIm1heFwiKSB7XG4gICAgICAgIGlmIChtYXggPT09IG51bGwgfHwgY2gudmFsdWUgPCBtYXgpIG1heCA9IGNoLnZhbHVlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbWF4O1xuICB9XG5cbiAgZ2V0IGlzSW50KCkge1xuICAgIHJldHVybiAhIXRoaXMuX2RlZi5jaGVja3MuZmluZCgoY2gpID0+IGNoLmtpbmQgPT09IFwiaW50XCIpO1xuICB9XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLy8vLy8vLyAgICAgICAgICAgICAgICAgICAgIC8vLy8vLy8vLy9cbi8vLy8vLy8vLy8gICAgICBab2RCaWdJbnQgICAgICAvLy8vLy8vLy8vXG4vLy8vLy8vLy8vICAgICAgICAgICAgICAgICAgICAgLy8vLy8vLy8vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmV4cG9ydCBpbnRlcmZhY2UgWm9kQmlnSW50RGVmIGV4dGVuZHMgWm9kVHlwZURlZiB7XG4gIHR5cGVOYW1lOiBab2RGaXJzdFBhcnR5VHlwZUtpbmQuWm9kQmlnSW50O1xufVxuXG5leHBvcnQgY2xhc3MgWm9kQmlnSW50IGV4dGVuZHMgWm9kVHlwZTxiaWdpbnQsIFpvZEJpZ0ludERlZj4ge1xuICBfcGFyc2UoaW5wdXQ6IFBhcnNlSW5wdXQpOiBQYXJzZVJldHVyblR5cGU8YmlnaW50PiB7XG4gICAgY29uc3QgcGFyc2VkVHlwZSA9IHRoaXMuX2dldFR5cGUoaW5wdXQpO1xuICAgIGlmIChwYXJzZWRUeXBlICE9PSBab2RQYXJzZWRUeXBlLmJpZ2ludCkge1xuICAgICAgY29uc3QgY3R4ID0gdGhpcy5fZ2V0T3JSZXR1cm5DdHgoaW5wdXQpO1xuICAgICAgYWRkSXNzdWVUb0NvbnRleHQoY3R4LCB7XG4gICAgICAgIGNvZGU6IFpvZElzc3VlQ29kZS5pbnZhbGlkX3R5cGUsXG4gICAgICAgIGV4cGVjdGVkOiBab2RQYXJzZWRUeXBlLmJpZ2ludCxcbiAgICAgICAgcmVjZWl2ZWQ6IGN0eC5wYXJzZWRUeXBlLFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gSU5WQUxJRDtcbiAgICB9XG4gICAgcmV0dXJuIE9LKGlucHV0LmRhdGEpO1xuICB9XG5cbiAgc3RhdGljIGNyZWF0ZSA9IChwYXJhbXM/OiBSYXdDcmVhdGVQYXJhbXMpOiBab2RCaWdJbnQgPT4ge1xuICAgIHJldHVybiBuZXcgWm9kQmlnSW50KHtcbiAgICAgIHR5cGVOYW1lOiBab2RGaXJzdFBhcnR5VHlwZUtpbmQuWm9kQmlnSW50LFxuICAgICAgLi4ucHJvY2Vzc0NyZWF0ZVBhcmFtcyhwYXJhbXMpLFxuICAgIH0pO1xuICB9O1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLy8vLy8vLyAgICAgICAgICAgICAgICAgICAgIC8vLy8vLy8vLy8vXG4vLy8vLy8vLy8vICAgICAgWm9kQm9vbGVhbiAgICAgIC8vLy8vLy8vLy9cbi8vLy8vLy8vLy8gICAgICAgICAgICAgICAgICAgICAvLy8vLy8vLy8vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbmV4cG9ydCBpbnRlcmZhY2UgWm9kQm9vbGVhbkRlZiBleHRlbmRzIFpvZFR5cGVEZWYge1xuICB0eXBlTmFtZTogWm9kRmlyc3RQYXJ0eVR5cGVLaW5kLlpvZEJvb2xlYW47XG59XG5cbmV4cG9ydCBjbGFzcyBab2RCb29sZWFuIGV4dGVuZHMgWm9kVHlwZTxib29sZWFuLCBab2RCb29sZWFuRGVmPiB7XG4gIF9wYXJzZShpbnB1dDogUGFyc2VJbnB1dCk6IFBhcnNlUmV0dXJuVHlwZTxib29sZWFuPiB7XG4gICAgY29uc3QgcGFyc2VkVHlwZSA9IHRoaXMuX2dldFR5cGUoaW5wdXQpO1xuICAgIGlmIChwYXJzZWRUeXBlICE9PSBab2RQYXJzZWRUeXBlLmJvb2xlYW4pIHtcbiAgICAgIGNvbnN0IGN0eCA9IHRoaXMuX2dldE9yUmV0dXJuQ3R4KGlucHV0KTtcbiAgICAgIGFkZElzc3VlVG9Db250ZXh0KGN0eCwge1xuICAgICAgICBjb2RlOiBab2RJc3N1ZUNvZGUuaW52YWxpZF90eXBlLFxuICAgICAgICBleHBlY3RlZDogWm9kUGFyc2VkVHlwZS5ib29sZWFuLFxuICAgICAgICByZWNlaXZlZDogY3R4LnBhcnNlZFR5cGUsXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBJTlZBTElEO1xuICAgIH1cbiAgICByZXR1cm4gT0soaW5wdXQuZGF0YSk7XG4gIH1cblxuICBzdGF0aWMgY3JlYXRlID0gKHBhcmFtcz86IFJhd0NyZWF0ZVBhcmFtcyk6IFpvZEJvb2xlYW4gPT4ge1xuICAgIHJldHVybiBuZXcgWm9kQm9vbGVhbih7XG4gICAgICB0eXBlTmFtZTogWm9kRmlyc3RQYXJ0eVR5cGVLaW5kLlpvZEJvb2xlYW4sXG4gICAgICAuLi5wcm9jZXNzQ3JlYXRlUGFyYW1zKHBhcmFtcyksXG4gICAgfSk7XG4gIH07XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vLy8vLy8vICAgICAgICAgICAgICAgICAgICAgLy8vLy8vLy9cbi8vLy8vLy8vLy8gICAgICBab2REYXRlICAgICAgICAvLy8vLy8vL1xuLy8vLy8vLy8vLyAgICAgICAgICAgICAgICAgICAgIC8vLy8vLy8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuZXhwb3J0IGludGVyZmFjZSBab2REYXRlRGVmIGV4dGVuZHMgWm9kVHlwZURlZiB7XG4gIHR5cGVOYW1lOiBab2RGaXJzdFBhcnR5VHlwZUtpbmQuWm9kRGF0ZTtcbn1cblxuZXhwb3J0IGNsYXNzIFpvZERhdGUgZXh0ZW5kcyBab2RUeXBlPERhdGUsIFpvZERhdGVEZWY+IHtcbiAgX3BhcnNlKGlucHV0OiBQYXJzZUlucHV0KTogUGFyc2VSZXR1cm5UeXBlPHRoaXNbXCJfb3V0cHV0XCJdPiB7XG4gICAgY29uc3QgcGFyc2VkVHlwZSA9IHRoaXMuX2dldFR5cGUoaW5wdXQpO1xuICAgIGlmIChwYXJzZWRUeXBlICE9PSBab2RQYXJzZWRUeXBlLmRhdGUpIHtcbiAgICAgIGNvbnN0IGN0eCA9IHRoaXMuX2dldE9yUmV0dXJuQ3R4KGlucHV0KTtcbiAgICAgIGFkZElzc3VlVG9Db250ZXh0KGN0eCwge1xuICAgICAgICBjb2RlOiBab2RJc3N1ZUNvZGUuaW52YWxpZF90eXBlLFxuICAgICAgICBleHBlY3RlZDogWm9kUGFyc2VkVHlwZS5kYXRlLFxuICAgICAgICByZWNlaXZlZDogY3R4LnBhcnNlZFR5cGUsXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBJTlZBTElEO1xuICAgIH1cbiAgICBpZiAoaXNOYU4oaW5wdXQuZGF0YS5nZXRUaW1lKCkpKSB7XG4gICAgICBjb25zdCBjdHggPSB0aGlzLl9nZXRPclJldHVybkN0eChpbnB1dCk7XG4gICAgICBhZGRJc3N1ZVRvQ29udGV4dChjdHgsIHtcbiAgICAgICAgY29kZTogWm9kSXNzdWVDb2RlLmludmFsaWRfZGF0ZSxcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIElOVkFMSUQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHN0YXR1czogXCJ2YWxpZFwiLFxuICAgICAgdmFsdWU6IG5ldyBEYXRlKChpbnB1dC5kYXRhIGFzIERhdGUpLmdldFRpbWUoKSksXG4gICAgfTtcbiAgfVxuXG4gIHN0YXRpYyBjcmVhdGUgPSAocGFyYW1zPzogUmF3Q3JlYXRlUGFyYW1zKTogWm9kRGF0ZSA9PiB7XG4gICAgcmV0dXJuIG5ldyBab2REYXRlKHtcbiAgICAgIHR5cGVOYW1lOiBab2RGaXJzdFBhcnR5VHlwZUtpbmQuWm9kRGF0ZSxcbiAgICAgIC4uLnByb2Nlc3NDcmVhdGVQYXJhbXMocGFyYW1zKSxcbiAgICB9KTtcbiAgfTtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vLy8vLy8vICAgICAgICAgICAgICAgICAgICAgICAgLy8vLy8vLy8vL1xuLy8vLy8vLy8vLyAgICAgIFpvZFVuZGVmaW5lZCAgICAgIC8vLy8vLy8vLy9cbi8vLy8vLy8vLy8gICAgICAgICAgICAgICAgICAgICAgICAvLy8vLy8vLy8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbmV4cG9ydCBpbnRlcmZhY2UgWm9kVW5kZWZpbmVkRGVmIGV4dGVuZHMgWm9kVHlwZURlZiB7XG4gIHR5cGVOYW1lOiBab2RGaXJzdFBhcnR5VHlwZUtpbmQuWm9kVW5kZWZpbmVkO1xufVxuXG5leHBvcnQgY2xhc3MgWm9kVW5kZWZpbmVkIGV4dGVuZHMgWm9kVHlwZTx1bmRlZmluZWQsIFpvZFVuZGVmaW5lZERlZj4ge1xuICBfcGFyc2UoaW5wdXQ6IFBhcnNlSW5wdXQpOiBQYXJzZVJldHVyblR5cGU8dGhpc1tcIl9vdXRwdXRcIl0+IHtcbiAgICBjb25zdCBwYXJzZWRUeXBlID0gdGhpcy5fZ2V0VHlwZShpbnB1dCk7XG4gICAgaWYgKHBhcnNlZFR5cGUgIT09IFpvZFBhcnNlZFR5cGUudW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCBjdHggPSB0aGlzLl9nZXRPclJldHVybkN0eChpbnB1dCk7XG4gICAgICBhZGRJc3N1ZVRvQ29udGV4dChjdHgsIHtcbiAgICAgICAgY29kZTogWm9kSXNzdWVDb2RlLmludmFsaWRfdHlwZSxcbiAgICAgICAgZXhwZWN0ZWQ6IFpvZFBhcnNlZFR5cGUudW5kZWZpbmVkLFxuICAgICAgICByZWNlaXZlZDogY3R4LnBhcnNlZFR5cGUsXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBJTlZBTElEO1xuICAgIH1cbiAgICByZXR1cm4gT0soaW5wdXQuZGF0YSk7XG4gIH1cbiAgcGFyYW1zPzogUmF3Q3JlYXRlUGFyYW1zO1xuXG4gIHN0YXRpYyBjcmVhdGUgPSAocGFyYW1zPzogUmF3Q3JlYXRlUGFyYW1zKTogWm9kVW5kZWZpbmVkID0+IHtcbiAgICByZXR1cm4gbmV3IFpvZFVuZGVmaW5lZCh7XG4gICAgICB0eXBlTmFtZTogWm9kRmlyc3RQYXJ0eVR5cGVLaW5kLlpvZFVuZGVmaW5lZCxcbiAgICAgIC4uLnByb2Nlc3NDcmVhdGVQYXJhbXMocGFyYW1zKSxcbiAgICB9KTtcbiAgfTtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8vLy8vLy8gICAgICAgICAgICAgICAgICAgLy8vLy8vLy8vL1xuLy8vLy8vLy8vLyAgICAgIFpvZE51bGwgICAgICAvLy8vLy8vLy8vXG4vLy8vLy8vLy8vICAgICAgICAgICAgICAgICAgIC8vLy8vLy8vLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5leHBvcnQgaW50ZXJmYWNlIFpvZE51bGxEZWYgZXh0ZW5kcyBab2RUeXBlRGVmIHtcbiAgdHlwZU5hbWU6IFpvZEZpcnN0UGFydHlUeXBlS2luZC5ab2ROdWxsO1xufVxuXG5leHBvcnQgY2xhc3MgWm9kTnVsbCBleHRlbmRzIFpvZFR5cGU8bnVsbCwgWm9kTnVsbERlZj4ge1xuICBfcGFyc2UoaW5wdXQ6IFBhcnNlSW5wdXQpOiBQYXJzZVJldHVyblR5cGU8dGhpc1tcIl9vdXRwdXRcIl0+IHtcbiAgICBjb25zdCBwYXJzZWRUeXBlID0gdGhpcy5fZ2V0VHlwZShpbnB1dCk7XG4gICAgaWYgKHBhcnNlZFR5cGUgIT09IFpvZFBhcnNlZFR5cGUubnVsbCkge1xuICAgICAgY29uc3QgY3R4ID0gdGhpcy5fZ2V0T3JSZXR1cm5DdHgoaW5wdXQpO1xuICAgICAgYWRkSXNzdWVUb0NvbnRleHQoY3R4LCB7XG4gICAgICAgIGNvZGU6IFpvZElzc3VlQ29kZS5pbnZhbGlkX3R5cGUsXG4gICAgICAgIGV4cGVjdGVkOiBab2RQYXJzZWRUeXBlLm51bGwsXG4gICAgICAgIHJlY2VpdmVkOiBjdHgucGFyc2VkVHlwZSxcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIElOVkFMSUQ7XG4gICAgfVxuICAgIHJldHVybiBPSyhpbnB1dC5kYXRhKTtcbiAgfVxuICBzdGF0aWMgY3JlYXRlID0gKHBhcmFtcz86IFJhd0NyZWF0ZVBhcmFtcyk6IFpvZE51bGwgPT4ge1xuICAgIHJldHVybiBuZXcgWm9kTnVsbCh7XG4gICAgICB0eXBlTmFtZTogWm9kRmlyc3RQYXJ0eVR5cGVLaW5kLlpvZE51bGwsXG4gICAgICAuLi5wcm9jZXNzQ3JlYXRlUGFyYW1zKHBhcmFtcyksXG4gICAgfSk7XG4gIH07XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLy8vLy8vLyAgICAgICAgICAgICAgICAgIC8vLy8vLy8vLy9cbi8vLy8vLy8vLy8gICAgICBab2RBbnkgICAgICAvLy8vLy8vLy8vXG4vLy8vLy8vLy8vICAgICAgICAgICAgICAgICAgLy8vLy8vLy8vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5leHBvcnQgaW50ZXJmYWNlIFpvZEFueURlZiBleHRlbmRzIFpvZFR5cGVEZWYge1xuICB0eXBlTmFtZTogWm9kRmlyc3RQYXJ0eVR5cGVLaW5kLlpvZEFueTtcbn1cblxuZXhwb3J0IGNsYXNzIFpvZEFueSBleHRlbmRzIFpvZFR5cGU8YW55LCBab2RBbnlEZWY+IHtcbiAgLy8gdG8gcHJldmVudCBpbnN0YW5jZXMgb2Ygb3RoZXIgY2xhc3NlcyBmcm9tIGV4dGVuZGluZyBab2RBbnkuIHRoaXMgY2F1c2VzIGlzc3VlcyB3aXRoIGNhdGNoYWxsIGluIFpvZE9iamVjdC5cbiAgX2FueTogdHJ1ZSA9IHRydWU7XG4gIF9wYXJzZShpbnB1dDogUGFyc2VJbnB1dCk6IFBhcnNlUmV0dXJuVHlwZTx0aGlzW1wiX291dHB1dFwiXT4ge1xuICAgIHJldHVybiBPSyhpbnB1dC5kYXRhKTtcbiAgfVxuICBzdGF0aWMgY3JlYXRlID0gKHBhcmFtcz86IFJhd0NyZWF0ZVBhcmFtcyk6IFpvZEFueSA9PiB7XG4gICAgcmV0dXJuIG5ldyBab2RBbnkoe1xuICAgICAgdHlwZU5hbWU6IFpvZEZpcnN0UGFydHlUeXBlS2luZC5ab2RBbnksXG4gICAgICAuLi5wcm9jZXNzQ3JlYXRlUGFyYW1zKHBhcmFtcyksXG4gICAgfSk7XG4gIH07XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vLy8vLy8vICAgICAgICAgICAgICAgICAgICAgIC8vLy8vLy8vLy9cbi8vLy8vLy8vLy8gICAgICBab2RVbmtub3duICAgICAgLy8vLy8vLy8vL1xuLy8vLy8vLy8vLyAgICAgICAgICAgICAgICAgICAgICAvLy8vLy8vLy8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuZXhwb3J0IGludGVyZmFjZSBab2RVbmtub3duRGVmIGV4dGVuZHMgWm9kVHlwZURlZiB7XG4gIHR5cGVOYW1lOiBab2RGaXJzdFBhcnR5VHlwZUtpbmQuWm9kVW5rbm93bjtcbn1cblxuZXhwb3J0IGNsYXNzIFpvZFVua25vd24gZXh0ZW5kcyBab2RUeXBlPHVua25vd24sIFpvZFVua25vd25EZWY+IHtcbiAgLy8gcmVxdWlyZWRcbiAgX3Vua25vd246IHRydWUgPSB0cnVlO1xuICBfcGFyc2UoaW5wdXQ6IFBhcnNlSW5wdXQpOiBQYXJzZVJldHVyblR5cGU8dGhpc1tcIl9vdXRwdXRcIl0+IHtcbiAgICByZXR1cm4gT0soaW5wdXQuZGF0YSk7XG4gIH1cblxuICBzdGF0aWMgY3JlYXRlID0gKHBhcmFtcz86IFJhd0NyZWF0ZVBhcmFtcyk6IFpvZFVua25vd24gPT4ge1xuICAgIHJldHVybiBuZXcgWm9kVW5rbm93bih7XG4gICAgICB0eXBlTmFtZTogWm9kRmlyc3RQYXJ0eVR5cGVLaW5kLlpvZFVua25vd24sXG4gICAgICAuLi5wcm9jZXNzQ3JlYXRlUGFyYW1zKHBhcmFtcyksXG4gICAgfSk7XG4gIH07XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8vLy8vLy8gICAgICAgICAgICAgICAgICAgIC8vLy8vLy8vLy9cbi8vLy8vLy8vLy8gICAgICBab2ROZXZlciAgICAgIC8vLy8vLy8vLy9cbi8vLy8vLy8vLy8gICAgICAgICAgICAgICAgICAgIC8vLy8vLy8vLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbmV4cG9ydCBpbnRlcmZhY2UgWm9kTmV2ZXJEZWYgZXh0ZW5kcyBab2RUeXBlRGVmIHtcbiAgdHlwZU5hbWU6IFpvZEZpcnN0UGFydHlUeXBlS2luZC5ab2ROZXZlcjtcbn1cblxuZXhwb3J0IGNsYXNzIFpvZE5ldmVyIGV4dGVuZHMgWm9kVHlwZTxuZXZlciwgWm9kTmV2ZXJEZWY+IHtcbiAgX3BhcnNlKGlucHV0OiBQYXJzZUlucHV0KTogUGFyc2VSZXR1cm5UeXBlPHRoaXNbXCJfb3V0cHV0XCJdPiB7XG4gICAgY29uc3QgY3R4ID0gdGhpcy5fZ2V0T3JSZXR1cm5DdHgoaW5wdXQpO1xuICAgIGFkZElzc3VlVG9Db250ZXh0KGN0eCwge1xuICAgICAgY29kZTogWm9kSXNzdWVDb2RlLmludmFsaWRfdHlwZSxcbiAgICAgIGV4cGVjdGVkOiBab2RQYXJzZWRUeXBlLm5ldmVyLFxuICAgICAgcmVjZWl2ZWQ6IGN0eC5wYXJzZWRUeXBlLFxuICAgIH0pO1xuICAgIHJldHVybiBJTlZBTElEO1xuICB9XG4gIHN0YXRpYyBjcmVhdGUgPSAocGFyYW1zPzogUmF3Q3JlYXRlUGFyYW1zKTogWm9kTmV2ZXIgPT4ge1xuICAgIHJldHVybiBuZXcgWm9kTmV2ZXIoe1xuICAgICAgdHlwZU5hbWU6IFpvZEZpcnN0UGFydHlUeXBlS2luZC5ab2ROZXZlcixcbiAgICAgIC4uLnByb2Nlc3NDcmVhdGVQYXJhbXMocGFyYW1zKSxcbiAgICB9KTtcbiAgfTtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8vLy8vLy8gICAgICAgICAgICAgICAgICAgLy8vLy8vLy8vL1xuLy8vLy8vLy8vLyAgICAgIFpvZFZvaWQgICAgICAvLy8vLy8vLy8vXG4vLy8vLy8vLy8vICAgICAgICAgICAgICAgICAgIC8vLy8vLy8vLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5leHBvcnQgaW50ZXJmYWNlIFpvZFZvaWREZWYgZXh0ZW5kcyBab2RUeXBlRGVmIHtcbiAgdHlwZU5hbWU6IFpvZEZpcnN0UGFydHlUeXBlS2luZC5ab2RWb2lkO1xufVxuXG5leHBvcnQgY2xhc3MgWm9kVm9pZCBleHRlbmRzIFpvZFR5cGU8dm9pZCwgWm9kVm9pZERlZj4ge1xuICBfcGFyc2UoaW5wdXQ6IFBhcnNlSW5wdXQpOiBQYXJzZVJldHVyblR5cGU8dGhpc1tcIl9vdXRwdXRcIl0+IHtcbiAgICBjb25zdCBwYXJzZWRUeXBlID0gdGhpcy5fZ2V0VHlwZShpbnB1dCk7XG4gICAgaWYgKHBhcnNlZFR5cGUgIT09IFpvZFBhcnNlZFR5cGUudW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCBjdHggPSB0aGlzLl9nZXRPclJldHVybkN0eChpbnB1dCk7XG4gICAgICBhZGRJc3N1ZVRvQ29udGV4dChjdHgsIHtcbiAgICAgICAgY29kZTogWm9kSXNzdWVDb2RlLmludmFsaWRfdHlwZSxcbiAgICAgICAgZXhwZWN0ZWQ6IFpvZFBhcnNlZFR5cGUudm9pZCxcbiAgICAgICAgcmVjZWl2ZWQ6IGN0eC5wYXJzZWRUeXBlLFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gSU5WQUxJRDtcbiAgICB9XG4gICAgcmV0dXJuIE9LKGlucHV0LmRhdGEpO1xuICB9XG5cbiAgc3RhdGljIGNyZWF0ZSA9IChwYXJhbXM/OiBSYXdDcmVhdGVQYXJhbXMpOiBab2RWb2lkID0+IHtcbiAgICByZXR1cm4gbmV3IFpvZFZvaWQoe1xuICAgICAgdHlwZU5hbWU6IFpvZEZpcnN0UGFydHlUeXBlS2luZC5ab2RWb2lkLFxuICAgICAgLi4ucHJvY2Vzc0NyZWF0ZVBhcmFtcyhwYXJhbXMpLFxuICAgIH0pO1xuICB9O1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vLy8vLy8vICAgICAgICAgICAgICAgICAgICAvLy8vLy8vLy8vXG4vLy8vLy8vLy8vICAgICAgWm9kQXJyYXkgICAgICAvLy8vLy8vLy8vXG4vLy8vLy8vLy8vICAgICAgICAgICAgICAgICAgICAvLy8vLy8vLy8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5leHBvcnQgaW50ZXJmYWNlIFpvZEFycmF5RGVmPFQgZXh0ZW5kcyBab2RUeXBlQW55ID0gWm9kVHlwZUFueT5cbiAgZXh0ZW5kcyBab2RUeXBlRGVmIHtcbiAgdHlwZTogVDtcbiAgdHlwZU5hbWU6IFpvZEZpcnN0UGFydHlUeXBlS2luZC5ab2RBcnJheTtcbiAgbWluTGVuZ3RoOiB7IHZhbHVlOiBudW1iZXI7IG1lc3NhZ2U/OiBzdHJpbmcgfSB8IG51bGw7XG4gIG1heExlbmd0aDogeyB2YWx1ZTogbnVtYmVyOyBtZXNzYWdlPzogc3RyaW5nIH0gfCBudWxsO1xufVxuXG5leHBvcnQgdHlwZSBBcnJheUNhcmRpbmFsaXR5ID0gXCJtYW55XCIgfCBcImF0bGVhc3RvbmVcIjtcbnR5cGUgYXJyYXlPdXRwdXRUeXBlPFxuICBUIGV4dGVuZHMgWm9kVHlwZUFueSxcbiAgQ2FyZGluYWxpdHkgZXh0ZW5kcyBBcnJheUNhcmRpbmFsaXR5ID0gXCJtYW55XCJcbj4gPSBDYXJkaW5hbGl0eSBleHRlbmRzIFwiYXRsZWFzdG9uZVwiXG4gID8gW1RbXCJfb3V0cHV0XCJdLCAuLi5UW1wiX291dHB1dFwiXVtdXVxuICA6IFRbXCJfb3V0cHV0XCJdW107XG5cbmV4cG9ydCBjbGFzcyBab2RBcnJheTxcbiAgVCBleHRlbmRzIFpvZFR5cGVBbnksXG4gIENhcmRpbmFsaXR5IGV4dGVuZHMgQXJyYXlDYXJkaW5hbGl0eSA9IFwibWFueVwiXG4+IGV4dGVuZHMgWm9kVHlwZTxcbiAgYXJyYXlPdXRwdXRUeXBlPFQsIENhcmRpbmFsaXR5PixcbiAgWm9kQXJyYXlEZWY8VD4sXG4gIENhcmRpbmFsaXR5IGV4dGVuZHMgXCJhdGxlYXN0b25lXCJcbiAgICA/IFtUW1wiX2lucHV0XCJdLCAuLi5UW1wiX2lucHV0XCJdW11dXG4gICAgOiBUW1wiX2lucHV0XCJdW11cbj4ge1xuICBfcGFyc2UoaW5wdXQ6IFBhcnNlSW5wdXQpOiBQYXJzZVJldHVyblR5cGU8dGhpc1tcIl9vdXRwdXRcIl0+IHtcbiAgICBjb25zdCB7IGN0eCwgc3RhdHVzIH0gPSB0aGlzLl9wcm9jZXNzSW5wdXRQYXJhbXMoaW5wdXQpO1xuXG4gICAgY29uc3QgZGVmID0gdGhpcy5fZGVmO1xuXG4gICAgaWYgKGN0eC5wYXJzZWRUeXBlICE9PSBab2RQYXJzZWRUeXBlLmFycmF5KSB7XG4gICAgICBhZGRJc3N1ZVRvQ29udGV4dChjdHgsIHtcbiAgICAgICAgY29kZTogWm9kSXNzdWVDb2RlLmludmFsaWRfdHlwZSxcbiAgICAgICAgZXhwZWN0ZWQ6IFpvZFBhcnNlZFR5cGUuYXJyYXksXG4gICAgICAgIHJlY2VpdmVkOiBjdHgucGFyc2VkVHlwZSxcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIElOVkFMSUQ7XG4gICAgfVxuXG4gICAgaWYgKGRlZi5taW5MZW5ndGggIT09IG51bGwpIHtcbiAgICAgIGlmIChjdHguZGF0YS5sZW5ndGggPCBkZWYubWluTGVuZ3RoLnZhbHVlKSB7XG4gICAgICAgIGFkZElzc3VlVG9Db250ZXh0KGN0eCwge1xuICAgICAgICAgIGNvZGU6IFpvZElzc3VlQ29kZS50b29fc21hbGwsXG4gICAgICAgICAgbWluaW11bTogZGVmLm1pbkxlbmd0aC52YWx1ZSxcbiAgICAgICAgICB0eXBlOiBcImFycmF5XCIsXG4gICAgICAgICAgaW5jbHVzaXZlOiB0cnVlLFxuICAgICAgICAgIG1lc3NhZ2U6IGRlZi5taW5MZW5ndGgubWVzc2FnZSxcbiAgICAgICAgfSk7XG4gICAgICAgIHN0YXR1cy5kaXJ0eSgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChkZWYubWF4TGVuZ3RoICE9PSBudWxsKSB7XG4gICAgICBpZiAoY3R4LmRhdGEubGVuZ3RoID4gZGVmLm1heExlbmd0aC52YWx1ZSkge1xuICAgICAgICBhZGRJc3N1ZVRvQ29udGV4dChjdHgsIHtcbiAgICAgICAgICBjb2RlOiBab2RJc3N1ZUNvZGUudG9vX2JpZyxcbiAgICAgICAgICBtYXhpbXVtOiBkZWYubWF4TGVuZ3RoLnZhbHVlLFxuICAgICAgICAgIHR5cGU6IFwiYXJyYXlcIixcbiAgICAgICAgICBpbmNsdXNpdmU6IHRydWUsXG4gICAgICAgICAgbWVzc2FnZTogZGVmLm1heExlbmd0aC5tZXNzYWdlLFxuICAgICAgICB9KTtcbiAgICAgICAgc3RhdHVzLmRpcnR5KCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGN0eC5jb21tb24uYXN5bmMpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLmFsbChcbiAgICAgICAgKGN0eC5kYXRhIGFzIGFueVtdKS5tYXAoKGl0ZW0sIGkpID0+IHtcbiAgICAgICAgICByZXR1cm4gZGVmLnR5cGUuX3BhcnNlQXN5bmMoXG4gICAgICAgICAgICBuZXcgUGFyc2VJbnB1dExhenlQYXRoKGN0eCwgaXRlbSwgY3R4LnBhdGgsIGkpXG4gICAgICAgICAgKTtcbiAgICAgICAgfSlcbiAgICAgICkudGhlbigocmVzdWx0KSA9PiB7XG4gICAgICAgIHJldHVybiBQYXJzZVN0YXR1cy5tZXJnZUFycmF5KHN0YXR1cywgcmVzdWx0KTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IHJlc3VsdCA9IChjdHguZGF0YSBhcyBhbnlbXSkubWFwKChpdGVtLCBpKSA9PiB7XG4gICAgICByZXR1cm4gZGVmLnR5cGUuX3BhcnNlU3luYyhcbiAgICAgICAgbmV3IFBhcnNlSW5wdXRMYXp5UGF0aChjdHgsIGl0ZW0sIGN0eC5wYXRoLCBpKVxuICAgICAgKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBQYXJzZVN0YXR1cy5tZXJnZUFycmF5KHN0YXR1cywgcmVzdWx0KTtcbiAgfVxuXG4gIGdldCBlbGVtZW50KCkge1xuICAgIHJldHVybiB0aGlzLl9kZWYudHlwZTtcbiAgfVxuXG4gIG1pbihtaW5MZW5ndGg6IG51bWJlciwgbWVzc2FnZT86IGVycm9yVXRpbC5FcnJNZXNzYWdlKTogdGhpcyB7XG4gICAgcmV0dXJuIG5ldyBab2RBcnJheSh7XG4gICAgICAuLi50aGlzLl9kZWYsXG4gICAgICBtaW5MZW5ndGg6IHsgdmFsdWU6IG1pbkxlbmd0aCwgbWVzc2FnZTogZXJyb3JVdGlsLnRvU3RyaW5nKG1lc3NhZ2UpIH0sXG4gICAgfSkgYXMgYW55O1xuICB9XG5cbiAgbWF4KG1heExlbmd0aDogbnVtYmVyLCBtZXNzYWdlPzogZXJyb3JVdGlsLkVyck1lc3NhZ2UpOiB0aGlzIHtcbiAgICByZXR1cm4gbmV3IFpvZEFycmF5KHtcbiAgICAgIC4uLnRoaXMuX2RlZixcbiAgICAgIG1heExlbmd0aDogeyB2YWx1ZTogbWF4TGVuZ3RoLCBtZXNzYWdlOiBlcnJvclV0aWwudG9TdHJpbmcobWVzc2FnZSkgfSxcbiAgICB9KSBhcyBhbnk7XG4gIH1cblxuICBsZW5ndGgobGVuOiBudW1iZXIsIG1lc3NhZ2U/OiBlcnJvclV0aWwuRXJyTWVzc2FnZSk6IHRoaXMge1xuICAgIHJldHVybiB0aGlzLm1pbihsZW4sIG1lc3NhZ2UpLm1heChsZW4sIG1lc3NhZ2UpIGFzIGFueTtcbiAgfVxuXG4gIG5vbmVtcHR5KG1lc3NhZ2U/OiBlcnJvclV0aWwuRXJyTWVzc2FnZSk6IFpvZEFycmF5PFQsIFwiYXRsZWFzdG9uZVwiPiB7XG4gICAgcmV0dXJuIHRoaXMubWluKDEsIG1lc3NhZ2UpIGFzIGFueTtcbiAgfVxuXG4gIHN0YXRpYyBjcmVhdGUgPSA8VCBleHRlbmRzIFpvZFR5cGVBbnk+KFxuICAgIHNjaGVtYTogVCxcbiAgICBwYXJhbXM/OiBSYXdDcmVhdGVQYXJhbXNcbiAgKTogWm9kQXJyYXk8VD4gPT4ge1xuICAgIHJldHVybiBuZXcgWm9kQXJyYXkoe1xuICAgICAgdHlwZTogc2NoZW1hLFxuICAgICAgbWluTGVuZ3RoOiBudWxsLFxuICAgICAgbWF4TGVuZ3RoOiBudWxsLFxuICAgICAgdHlwZU5hbWU6IFpvZEZpcnN0UGFydHlUeXBlS2luZC5ab2RBcnJheSxcbiAgICAgIC4uLnByb2Nlc3NDcmVhdGVQYXJhbXMocGFyYW1zKSxcbiAgICB9KTtcbiAgfTtcbn1cblxuZXhwb3J0IHR5cGUgWm9kTm9uRW1wdHlBcnJheTxUIGV4dGVuZHMgWm9kVHlwZUFueT4gPSBab2RBcnJheTxULCBcImF0bGVhc3RvbmVcIj47XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLy8vLy8vLyAgICAgICAgICAgICAgICAgICAgIC8vLy8vLy8vLy9cbi8vLy8vLy8vLy8gICAgICBab2RPYmplY3QgICAgICAvLy8vLy8vLy8vXG4vLy8vLy8vLy8vICAgICAgICAgICAgICAgICAgICAgLy8vLy8vLy8vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmV4cG9ydCBuYW1lc3BhY2Ugb2JqZWN0VXRpbCB7XG4gIGV4cG9ydCB0eXBlIE1lcmdlU2hhcGVzPFUgZXh0ZW5kcyBab2RSYXdTaGFwZSwgViBleHRlbmRzIFpvZFJhd1NoYXBlPiA9IHtcbiAgICBbayBpbiBFeGNsdWRlPGtleW9mIFUsIGtleW9mIFY+XTogVVtrXTtcbiAgfSAmIFY7XG5cbiAgdHlwZSBvcHRpb25hbEtleXM8VCBleHRlbmRzIG9iamVjdD4gPSB7XG4gICAgW2sgaW4ga2V5b2YgVF06IHVuZGVmaW5lZCBleHRlbmRzIFRba10gPyBrIDogbmV2ZXI7XG4gIH1ba2V5b2YgVF07XG5cbiAgLy8gdHlwZSByZXF1aXJlZEtleXM8VCBleHRlbmRzIG9iamVjdD4gPSBFeGNsdWRlPGtleW9mIFQsIG9wdGlvbmFsS2V5czxUPj47XG4gIHR5cGUgcmVxdWlyZWRLZXlzPFQgZXh0ZW5kcyBvYmplY3Q+ID0ge1xuICAgIFtrIGluIGtleW9mIFRdOiB1bmRlZmluZWQgZXh0ZW5kcyBUW2tdID8gbmV2ZXIgOiBrO1xuICB9W2tleW9mIFRdO1xuXG4gIGV4cG9ydCB0eXBlIGFkZFF1ZXN0aW9uTWFya3M8VCBleHRlbmRzIG9iamVjdD4gPSB7XG4gICAgW2sgaW4gb3B0aW9uYWxLZXlzPFQ+XT86IFRba107XG4gIH0gJiB7IFtrIGluIHJlcXVpcmVkS2V5czxUPl06IFRba10gfTtcblxuICBleHBvcnQgdHlwZSBpZGVudGl0eTxUPiA9IFQ7XG4gIGV4cG9ydCB0eXBlIGZsYXR0ZW48VCBleHRlbmRzIG9iamVjdD4gPSBpZGVudGl0eTx7IFtrIGluIGtleW9mIFRdOiBUW2tdIH0+O1xuXG4gIGV4cG9ydCB0eXBlIG5vTmV2ZXJLZXlzPFQgZXh0ZW5kcyBab2RSYXdTaGFwZT4gPSB7XG4gICAgW2sgaW4ga2V5b2YgVF06IFtUW2tdXSBleHRlbmRzIFtuZXZlcl0gPyBuZXZlciA6IGs7XG4gIH1ba2V5b2YgVF07XG5cbiAgZXhwb3J0IHR5cGUgbm9OZXZlcjxUIGV4dGVuZHMgWm9kUmF3U2hhcGU+ID0gaWRlbnRpdHk8e1xuICAgIFtrIGluIG5vTmV2ZXJLZXlzPFQ+XTogayBleHRlbmRzIGtleW9mIFQgPyBUW2tdIDogbmV2ZXI7XG4gIH0+O1xuXG4gIGV4cG9ydCBjb25zdCBtZXJnZVNoYXBlcyA9IDxVIGV4dGVuZHMgWm9kUmF3U2hhcGUsIFQgZXh0ZW5kcyBab2RSYXdTaGFwZT4oXG4gICAgZmlyc3Q6IFUsXG4gICAgc2Vjb25kOiBUXG4gICk6IFQgJiBVID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgLi4uZmlyc3QsXG4gICAgICAuLi5zZWNvbmQsIC8vIHNlY29uZCBvdmVyd3JpdGVzIGZpcnN0XG4gICAgfTtcbiAgfTtcbn1cblxuZXhwb3J0IHR5cGUgZXh0ZW5kU2hhcGU8QSwgQj4gPSB7XG4gIFtrIGluIEV4Y2x1ZGU8a2V5b2YgQSwga2V5b2YgQj5dOiBBW2tdO1xufSAmIHsgW2sgaW4ga2V5b2YgQl06IEJba10gfTtcblxuY29uc3QgQXVnbWVudEZhY3RvcnkgPVxuICA8RGVmIGV4dGVuZHMgWm9kT2JqZWN0RGVmPihkZWY6IERlZikgPT5cbiAgPEF1Z21lbnRhdGlvbiBleHRlbmRzIFpvZFJhd1NoYXBlPihcbiAgICBhdWdtZW50YXRpb246IEF1Z21lbnRhdGlvblxuICApOiBab2RPYmplY3Q8XG4gICAgZXh0ZW5kU2hhcGU8UmV0dXJuVHlwZTxEZWZbXCJzaGFwZVwiXT4sIEF1Z21lbnRhdGlvbj4sXG4gICAgRGVmW1widW5rbm93bktleXNcIl0sXG4gICAgRGVmW1wiY2F0Y2hhbGxcIl1cbiAgPiA9PiB7XG4gICAgcmV0dXJuIG5ldyBab2RPYmplY3Qoe1xuICAgICAgLi4uZGVmLFxuICAgICAgc2hhcGU6ICgpID0+ICh7XG4gICAgICAgIC4uLmRlZi5zaGFwZSgpLFxuICAgICAgICAuLi5hdWdtZW50YXRpb24sXG4gICAgICB9KSxcbiAgICB9KSBhcyBhbnk7XG4gIH07XG5cbnR5cGUgVW5rbm93bktleXNQYXJhbSA9IFwicGFzc3Rocm91Z2hcIiB8IFwic3RyaWN0XCIgfCBcInN0cmlwXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgWm9kT2JqZWN0RGVmPFxuICBUIGV4dGVuZHMgWm9kUmF3U2hhcGUgPSBab2RSYXdTaGFwZSxcbiAgVW5rbm93bktleXMgZXh0ZW5kcyBVbmtub3duS2V5c1BhcmFtID0gVW5rbm93bktleXNQYXJhbSxcbiAgQ2F0Y2hhbGwgZXh0ZW5kcyBab2RUeXBlQW55ID0gWm9kVHlwZUFueVxuPiBleHRlbmRzIFpvZFR5cGVEZWYge1xuICB0eXBlTmFtZTogWm9kRmlyc3RQYXJ0eVR5cGVLaW5kLlpvZE9iamVjdDtcbiAgc2hhcGU6ICgpID0+IFQ7XG4gIGNhdGNoYWxsOiBDYXRjaGFsbDtcbiAgdW5rbm93bktleXM6IFVua25vd25LZXlzO1xufVxuXG5leHBvcnQgdHlwZSBiYXNlT2JqZWN0T3V0cHV0VHlwZTxTaGFwZSBleHRlbmRzIFpvZFJhd1NoYXBlPiA9XG4gIG9iamVjdFV0aWwuZmxhdHRlbjxcbiAgICBvYmplY3RVdGlsLmFkZFF1ZXN0aW9uTWFya3M8e1xuICAgICAgW2sgaW4ga2V5b2YgU2hhcGVdOiBTaGFwZVtrXVtcIl9vdXRwdXRcIl07XG4gICAgfT5cbiAgPjtcblxuZXhwb3J0IHR5cGUgb2JqZWN0T3V0cHV0VHlwZTxcbiAgU2hhcGUgZXh0ZW5kcyBab2RSYXdTaGFwZSxcbiAgQ2F0Y2hhbGwgZXh0ZW5kcyBab2RUeXBlQW55XG4+ID0gWm9kVHlwZUFueSBleHRlbmRzIENhdGNoYWxsXG4gID8gYmFzZU9iamVjdE91dHB1dFR5cGU8U2hhcGU+XG4gIDogb2JqZWN0VXRpbC5mbGF0dGVuPFxuICAgICAgYmFzZU9iamVjdE91dHB1dFR5cGU8U2hhcGU+ICYgeyBbazogc3RyaW5nXTogQ2F0Y2hhbGxbXCJfb3V0cHV0XCJdIH1cbiAgICA+O1xuXG5leHBvcnQgdHlwZSBiYXNlT2JqZWN0SW5wdXRUeXBlPFNoYXBlIGV4dGVuZHMgWm9kUmF3U2hhcGU+ID0gb2JqZWN0VXRpbC5mbGF0dGVuPFxuICBvYmplY3RVdGlsLmFkZFF1ZXN0aW9uTWFya3M8e1xuICAgIFtrIGluIGtleW9mIFNoYXBlXTogU2hhcGVba11bXCJfaW5wdXRcIl07XG4gIH0+XG4+O1xuXG5leHBvcnQgdHlwZSBvYmplY3RJbnB1dFR5cGU8XG4gIFNoYXBlIGV4dGVuZHMgWm9kUmF3U2hhcGUsXG4gIENhdGNoYWxsIGV4dGVuZHMgWm9kVHlwZUFueVxuPiA9IFpvZFR5cGVBbnkgZXh0ZW5kcyBDYXRjaGFsbFxuICA/IGJhc2VPYmplY3RJbnB1dFR5cGU8U2hhcGU+XG4gIDogb2JqZWN0VXRpbC5mbGF0dGVuPFxuICAgICAgYmFzZU9iamVjdElucHV0VHlwZTxTaGFwZT4gJiB7IFtrOiBzdHJpbmddOiBDYXRjaGFsbFtcIl9pbnB1dFwiXSB9XG4gICAgPjtcblxudHlwZSBkZW9wdGlvbmFsPFQgZXh0ZW5kcyBab2RUeXBlQW55PiA9IFQgZXh0ZW5kcyBab2RPcHRpb25hbDxpbmZlciBVPlxuICA/IGRlb3B0aW9uYWw8VT5cbiAgOiBUO1xuXG5leHBvcnQgdHlwZSBTb21lWm9kT2JqZWN0ID0gWm9kT2JqZWN0PFxuICBab2RSYXdTaGFwZSxcbiAgVW5rbm93bktleXNQYXJhbSxcbiAgWm9kVHlwZUFueSxcbiAgYW55LFxuICBhbnlcbj47XG5cbmZ1bmN0aW9uIGRlZXBQYXJ0aWFsaWZ5KHNjaGVtYTogWm9kVHlwZUFueSk6IGFueSB7XG4gIGlmIChzY2hlbWEgaW5zdGFuY2VvZiBab2RPYmplY3QpIHtcbiAgICBjb25zdCBuZXdTaGFwZTogYW55ID0ge307XG5cbiAgICBmb3IgKGNvbnN0IGtleSBpbiBzY2hlbWEuc2hhcGUpIHtcbiAgICAgIGNvbnN0IGZpZWxkU2NoZW1hID0gc2NoZW1hLnNoYXBlW2tleV07XG4gICAgICBuZXdTaGFwZVtrZXldID0gWm9kT3B0aW9uYWwuY3JlYXRlKGRlZXBQYXJ0aWFsaWZ5KGZpZWxkU2NoZW1hKSk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgWm9kT2JqZWN0KHtcbiAgICAgIC4uLnNjaGVtYS5fZGVmLFxuICAgICAgc2hhcGU6ICgpID0+IG5ld1NoYXBlLFxuICAgIH0pIGFzIGFueTtcbiAgfSBlbHNlIGlmIChzY2hlbWEgaW5zdGFuY2VvZiBab2RBcnJheSkge1xuICAgIHJldHVybiBab2RBcnJheS5jcmVhdGUoZGVlcFBhcnRpYWxpZnkoc2NoZW1hLmVsZW1lbnQpKTtcbiAgfSBlbHNlIGlmIChzY2hlbWEgaW5zdGFuY2VvZiBab2RPcHRpb25hbCkge1xuICAgIHJldHVybiBab2RPcHRpb25hbC5jcmVhdGUoZGVlcFBhcnRpYWxpZnkoc2NoZW1hLnVud3JhcCgpKSk7XG4gIH0gZWxzZSBpZiAoc2NoZW1hIGluc3RhbmNlb2YgWm9kTnVsbGFibGUpIHtcbiAgICByZXR1cm4gWm9kTnVsbGFibGUuY3JlYXRlKGRlZXBQYXJ0aWFsaWZ5KHNjaGVtYS51bndyYXAoKSkpO1xuICB9IGVsc2UgaWYgKHNjaGVtYSBpbnN0YW5jZW9mIFpvZFR1cGxlKSB7XG4gICAgcmV0dXJuIFpvZFR1cGxlLmNyZWF0ZShcbiAgICAgIHNjaGVtYS5pdGVtcy5tYXAoKGl0ZW06IGFueSkgPT4gZGVlcFBhcnRpYWxpZnkoaXRlbSkpXG4gICAgKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gc2NoZW1hO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBab2RPYmplY3Q8XG4gIFQgZXh0ZW5kcyBab2RSYXdTaGFwZSxcbiAgVW5rbm93bktleXMgZXh0ZW5kcyBVbmtub3duS2V5c1BhcmFtID0gXCJzdHJpcFwiLFxuICBDYXRjaGFsbCBleHRlbmRzIFpvZFR5cGVBbnkgPSBab2RUeXBlQW55LFxuICBPdXRwdXQgPSBvYmplY3RPdXRwdXRUeXBlPFQsIENhdGNoYWxsPixcbiAgSW5wdXQgPSBvYmplY3RJbnB1dFR5cGU8VCwgQ2F0Y2hhbGw+XG4+IGV4dGVuZHMgWm9kVHlwZTxPdXRwdXQsIFpvZE9iamVjdERlZjxULCBVbmtub3duS2V5cywgQ2F0Y2hhbGw+LCBJbnB1dD4ge1xuICByZWFkb25seSBfc2hhcGUhOiBUO1xuICByZWFkb25seSBfdW5rbm93bktleXMhOiBVbmtub3duS2V5cztcbiAgcmVhZG9ubHkgX2NhdGNoYWxsITogQ2F0Y2hhbGw7XG4gIHByaXZhdGUgX2NhY2hlZDogeyBzaGFwZTogVDsga2V5czogc3RyaW5nW10gfSB8IG51bGwgPSBudWxsO1xuXG4gIF9nZXRDYWNoZWQoKTogeyBzaGFwZTogVDsga2V5czogc3RyaW5nW10gfSB7XG4gICAgaWYgKHRoaXMuX2NhY2hlZCAhPT0gbnVsbCkgcmV0dXJuIHRoaXMuX2NhY2hlZDtcbiAgICBjb25zdCBzaGFwZSA9IHRoaXMuX2RlZi5zaGFwZSgpO1xuICAgIGNvbnN0IGtleXMgPSB1dGlsLm9iamVjdEtleXMoc2hhcGUpO1xuICAgIHJldHVybiAodGhpcy5fY2FjaGVkID0geyBzaGFwZSwga2V5cyB9KTtcbiAgfVxuXG4gIF9wYXJzZShpbnB1dDogUGFyc2VJbnB1dCk6IFBhcnNlUmV0dXJuVHlwZTx0aGlzW1wiX291dHB1dFwiXT4ge1xuICAgIGNvbnN0IHBhcnNlZFR5cGUgPSB0aGlzLl9nZXRUeXBlKGlucHV0KTtcbiAgICBpZiAocGFyc2VkVHlwZSAhPT0gWm9kUGFyc2VkVHlwZS5vYmplY3QpIHtcbiAgICAgIGNvbnN0IGN0eCA9IHRoaXMuX2dldE9yUmV0dXJuQ3R4KGlucHV0KTtcbiAgICAgIGFkZElzc3VlVG9Db250ZXh0KGN0eCwge1xuICAgICAgICBjb2RlOiBab2RJc3N1ZUNvZGUuaW52YWxpZF90eXBlLFxuICAgICAgICBleHBlY3RlZDogWm9kUGFyc2VkVHlwZS5vYmplY3QsXG4gICAgICAgIHJlY2VpdmVkOiBjdHgucGFyc2VkVHlwZSxcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIElOVkFMSUQ7XG4gICAgfVxuXG4gICAgY29uc3QgeyBzdGF0dXMsIGN0eCB9ID0gdGhpcy5fcHJvY2Vzc0lucHV0UGFyYW1zKGlucHV0KTtcblxuICAgIGNvbnN0IHsgc2hhcGUsIGtleXM6IHNoYXBlS2V5cyB9ID0gdGhpcy5fZ2V0Q2FjaGVkKCk7XG4gICAgY29uc3QgZXh0cmFLZXlzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGZvciAoY29uc3Qga2V5IGluIGN0eC5kYXRhKSB7XG4gICAgICBpZiAoIXNoYXBlS2V5cy5pbmNsdWRlcyhrZXkpKSB7XG4gICAgICAgIGV4dHJhS2V5cy5wdXNoKGtleSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgcGFpcnM6IHtcbiAgICAgIGtleTogUGFyc2VSZXR1cm5UeXBlPGFueT47XG4gICAgICB2YWx1ZTogUGFyc2VSZXR1cm5UeXBlPGFueT47XG4gICAgICBhbHdheXNTZXQ/OiBib29sZWFuO1xuICAgIH1bXSA9IFtdO1xuICAgIGZvciAoY29uc3Qga2V5IG9mIHNoYXBlS2V5cykge1xuICAgICAgY29uc3Qga2V5VmFsaWRhdG9yID0gc2hhcGVba2V5XTtcbiAgICAgIGNvbnN0IHZhbHVlID0gY3R4LmRhdGFba2V5XTtcbiAgICAgIHBhaXJzLnB1c2goe1xuICAgICAgICBrZXk6IHsgc3RhdHVzOiBcInZhbGlkXCIsIHZhbHVlOiBrZXkgfSxcbiAgICAgICAgdmFsdWU6IGtleVZhbGlkYXRvci5fcGFyc2UoXG4gICAgICAgICAgbmV3IFBhcnNlSW5wdXRMYXp5UGF0aChjdHgsIHZhbHVlLCBjdHgucGF0aCwga2V5KVxuICAgICAgICApLFxuICAgICAgICBhbHdheXNTZXQ6IGtleSBpbiBjdHguZGF0YSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9kZWYuY2F0Y2hhbGwgaW5zdGFuY2VvZiBab2ROZXZlcikge1xuICAgICAgY29uc3QgdW5rbm93bktleXMgPSB0aGlzLl9kZWYudW5rbm93bktleXM7XG5cbiAgICAgIGlmICh1bmtub3duS2V5cyA9PT0gXCJwYXNzdGhyb3VnaFwiKSB7XG4gICAgICAgIGZvciAoY29uc3Qga2V5IG9mIGV4dHJhS2V5cykge1xuICAgICAgICAgIHBhaXJzLnB1c2goe1xuICAgICAgICAgICAga2V5OiB7IHN0YXR1czogXCJ2YWxpZFwiLCB2YWx1ZToga2V5IH0sXG4gICAgICAgICAgICB2YWx1ZTogeyBzdGF0dXM6IFwidmFsaWRcIiwgdmFsdWU6IGN0eC5kYXRhW2tleV0gfSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh1bmtub3duS2V5cyA9PT0gXCJzdHJpY3RcIikge1xuICAgICAgICBpZiAoZXh0cmFLZXlzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBhZGRJc3N1ZVRvQ29udGV4dChjdHgsIHtcbiAgICAgICAgICAgIGNvZGU6IFpvZElzc3VlQ29kZS51bnJlY29nbml6ZWRfa2V5cyxcbiAgICAgICAgICAgIGtleXM6IGV4dHJhS2V5cyxcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBzdGF0dXMuZGlydHkoKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh1bmtub3duS2V5cyA9PT0gXCJzdHJpcFwiKSB7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludGVybmFsIFpvZE9iamVjdCBlcnJvcjogaW52YWxpZCB1bmtub3duS2V5cyB2YWx1ZS5gKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gcnVuIGNhdGNoYWxsIHZhbGlkYXRpb25cbiAgICAgIGNvbnN0IGNhdGNoYWxsID0gdGhpcy5fZGVmLmNhdGNoYWxsO1xuXG4gICAgICBmb3IgKGNvbnN0IGtleSBvZiBleHRyYUtleXMpIHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBjdHguZGF0YVtrZXldO1xuICAgICAgICBwYWlycy5wdXNoKHtcbiAgICAgICAgICBrZXk6IHsgc3RhdHVzOiBcInZhbGlkXCIsIHZhbHVlOiBrZXkgfSxcbiAgICAgICAgICB2YWx1ZTogY2F0Y2hhbGwuX3BhcnNlKFxuICAgICAgICAgICAgbmV3IFBhcnNlSW5wdXRMYXp5UGF0aChjdHgsIHZhbHVlLCBjdHgucGF0aCwga2V5KSAvLywgY3R4LmNoaWxkKGtleSksIHZhbHVlLCBnZXRQYXJzZWRUeXBlKHZhbHVlKVxuICAgICAgICAgICksXG4gICAgICAgICAgYWx3YXlzU2V0OiBrZXkgaW4gY3R4LmRhdGEsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChjdHguY29tbW9uLmFzeW5jKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcbiAgICAgICAgLnRoZW4oYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIGNvbnN0IHN5bmNQYWlyczogYW55W10gPSBbXTtcbiAgICAgICAgICBmb3IgKGNvbnN0IHBhaXIgb2YgcGFpcnMpIHtcbiAgICAgICAgICAgIGNvbnN0IGtleSA9IGF3YWl0IHBhaXIua2V5O1xuICAgICAgICAgICAgc3luY1BhaXJzLnB1c2goe1xuICAgICAgICAgICAgICBrZXksXG4gICAgICAgICAgICAgIHZhbHVlOiBhd2FpdCBwYWlyLnZhbHVlLFxuICAgICAgICAgICAgICBhbHdheXNTZXQ6IHBhaXIuYWx3YXlzU2V0LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBzeW5jUGFpcnM7XG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKChzeW5jUGFpcnMpID0+IHtcbiAgICAgICAgICByZXR1cm4gUGFyc2VTdGF0dXMubWVyZ2VPYmplY3RTeW5jKHN0YXR1cywgc3luY1BhaXJzKTtcbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQYXJzZVN0YXR1cy5tZXJnZU9iamVjdFN5bmMoc3RhdHVzLCBwYWlycyBhcyBhbnkpO1xuICAgIH1cbiAgfVxuXG4gIGdldCBzaGFwZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fZGVmLnNoYXBlKCk7XG4gIH1cblxuICBzdHJpY3QobWVzc2FnZT86IGVycm9yVXRpbC5FcnJNZXNzYWdlKTogWm9kT2JqZWN0PFQsIFwic3RyaWN0XCIsIENhdGNoYWxsPiB7XG4gICAgZXJyb3JVdGlsLmVyclRvT2JqO1xuICAgIHJldHVybiBuZXcgWm9kT2JqZWN0KHtcbiAgICAgIC4uLnRoaXMuX2RlZixcbiAgICAgIHVua25vd25LZXlzOiBcInN0cmljdFwiLFxuICAgICAgLi4uKG1lc3NhZ2UgIT09IHVuZGVmaW5lZFxuICAgICAgICA/IHtcbiAgICAgICAgICAgIGVycm9yTWFwOiAoaXNzdWUsIGN0eCkgPT4ge1xuICAgICAgICAgICAgICBjb25zdCBkZWZhdWx0RXJyb3IgPVxuICAgICAgICAgICAgICAgIHRoaXMuX2RlZi5lcnJvck1hcD8uKGlzc3VlLCBjdHgpLm1lc3NhZ2UgPz8gY3R4LmRlZmF1bHRFcnJvcjtcbiAgICAgICAgICAgICAgaWYgKGlzc3VlLmNvZGUgPT09IFwidW5yZWNvZ25pemVkX2tleXNcIilcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgbWVzc2FnZTogZXJyb3JVdGlsLmVyclRvT2JqKG1lc3NhZ2UpLm1lc3NhZ2UgPz8gZGVmYXVsdEVycm9yLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogZGVmYXVsdEVycm9yLFxuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9XG4gICAgICAgIDoge30pLFxuICAgIH0pIGFzIGFueTtcbiAgfVxuXG4gIHN0cmlwKCk6IFpvZE9iamVjdDxULCBcInN0cmlwXCIsIENhdGNoYWxsPiB7XG4gICAgcmV0dXJuIG5ldyBab2RPYmplY3Qoe1xuICAgICAgLi4udGhpcy5fZGVmLFxuICAgICAgdW5rbm93bktleXM6IFwic3RyaXBcIixcbiAgICB9KSBhcyBhbnk7XG4gIH1cblxuICBwYXNzdGhyb3VnaCgpOiBab2RPYmplY3Q8VCwgXCJwYXNzdGhyb3VnaFwiLCBDYXRjaGFsbD4ge1xuICAgIHJldHVybiBuZXcgWm9kT2JqZWN0KHtcbiAgICAgIC4uLnRoaXMuX2RlZixcbiAgICAgIHVua25vd25LZXlzOiBcInBhc3N0aHJvdWdoXCIsXG4gICAgfSkgYXMgYW55O1xuICB9XG5cbiAgLyoqXG4gICAqIEBkZXByZWNhdGVkIEluIG1vc3QgY2FzZXMsIHRoaXMgaXMgbm8gbG9uZ2VyIG5lZWRlZCAtIHVua25vd24gcHJvcGVydGllcyBhcmUgbm93IHNpbGVudGx5IHN0cmlwcGVkLlxuICAgKiBJZiB5b3Ugd2FudCB0byBwYXNzIHRocm91Z2ggdW5rbm93biBwcm9wZXJ0aWVzLCB1c2UgYC5wYXNzdGhyb3VnaCgpYCBpbnN0ZWFkLlxuICAgKi9cbiAgbm9uc3RyaWN0ID0gdGhpcy5wYXNzdGhyb3VnaDtcblxuICBhdWdtZW50ID0gQXVnbWVudEZhY3Rvcnk8Wm9kT2JqZWN0RGVmPFQsIFVua25vd25LZXlzLCBDYXRjaGFsbD4+KHRoaXMuX2RlZik7XG4gIGV4dGVuZCA9IEF1Z21lbnRGYWN0b3J5PFpvZE9iamVjdERlZjxULCBVbmtub3duS2V5cywgQ2F0Y2hhbGw+Pih0aGlzLl9kZWYpO1xuXG4gIHNldEtleTxLZXkgZXh0ZW5kcyBzdHJpbmcsIFNjaGVtYSBleHRlbmRzIFpvZFR5cGVBbnk+KFxuICAgIGtleTogS2V5LFxuICAgIHNjaGVtYTogU2NoZW1hXG4gICk6IFpvZE9iamVjdDxUICYgeyBbayBpbiBLZXldOiBTY2hlbWEgfSwgVW5rbm93bktleXMsIENhdGNoYWxsPiB7XG4gICAgcmV0dXJuIHRoaXMuYXVnbWVudCh7IFtrZXldOiBzY2hlbWEgfSkgYXMgYW55O1xuICB9XG5cbiAgLyoqXG4gICAqIFByaW9yIHRvIHpvZEAxLjAuMTIgdGhlcmUgd2FzIGEgYnVnIGluIHRoZVxuICAgKiBpbmZlcnJlZCB0eXBlIG9mIG1lcmdlZCBvYmplY3RzLiBQbGVhc2VcbiAgICogdXBncmFkZSBpZiB5b3UgYXJlIGV4cGVyaWVuY2luZyBpc3N1ZXMuXG4gICAqL1xuICBtZXJnZTxJbmNvbWluZyBleHRlbmRzIEFueVpvZE9iamVjdD4oXG4gICAgbWVyZ2luZzogSW5jb21pbmdcbiAgKTogLy9ab2RPYmplY3Q8VCAmIEluY29taW5nW1wiX3NoYXBlXCJdLCBVbmtub3duS2V5cywgQ2F0Y2hhbGw+ID0gKG1lcmdpbmcpID0+IHtcbiAgWm9kT2JqZWN0PGV4dGVuZFNoYXBlPFQsIEluY29taW5nW1wiX3NoYXBlXCJdPiwgVW5rbm93bktleXMsIENhdGNoYWxsPiB7XG4gICAgLy8gY29uc3QgbWVyZ2VkU2hhcGUgPSBvYmplY3RVdGlsLm1lcmdlU2hhcGVzKFxuICAgIC8vICAgdGhpcy5fZGVmLnNoYXBlKCksXG4gICAgLy8gICBtZXJnaW5nLl9kZWYuc2hhcGUoKVxuICAgIC8vICk7XG4gICAgY29uc3QgbWVyZ2VkOiBhbnkgPSBuZXcgWm9kT2JqZWN0KHtcbiAgICAgIHVua25vd25LZXlzOiBtZXJnaW5nLl9kZWYudW5rbm93bktleXMsXG4gICAgICBjYXRjaGFsbDogbWVyZ2luZy5fZGVmLmNhdGNoYWxsLFxuICAgICAgc2hhcGU6ICgpID0+XG4gICAgICAgIG9iamVjdFV0aWwubWVyZ2VTaGFwZXModGhpcy5fZGVmLnNoYXBlKCksIG1lcmdpbmcuX2RlZi5zaGFwZSgpKSxcbiAgICAgIHR5cGVOYW1lOiBab2RGaXJzdFBhcnR5VHlwZUtpbmQuWm9kT2JqZWN0LFxuICAgIH0pIGFzIGFueTtcbiAgICByZXR1cm4gbWVyZ2VkO1xuICB9XG5cbiAgY2F0Y2hhbGw8SW5kZXggZXh0ZW5kcyBab2RUeXBlQW55PihcbiAgICBpbmRleDogSW5kZXhcbiAgKTogWm9kT2JqZWN0PFQsIFVua25vd25LZXlzLCBJbmRleD4ge1xuICAgIHJldHVybiBuZXcgWm9kT2JqZWN0KHtcbiAgICAgIC4uLnRoaXMuX2RlZixcbiAgICAgIGNhdGNoYWxsOiBpbmRleCxcbiAgICB9KSBhcyBhbnk7XG4gIH1cblxuICBwaWNrPE1hc2sgZXh0ZW5kcyB7IFtrIGluIGtleW9mIFRdPzogdHJ1ZSB9PihcbiAgICBtYXNrOiBNYXNrXG4gICk6IFpvZE9iamVjdDxcbiAgICBvYmplY3RVdGlsLm5vTmV2ZXI8eyBbayBpbiBrZXlvZiBNYXNrXTogayBleHRlbmRzIGtleW9mIFQgPyBUW2tdIDogbmV2ZXIgfT4sXG4gICAgVW5rbm93bktleXMsXG4gICAgQ2F0Y2hhbGxcbiAgPiB7XG4gICAgY29uc3Qgc2hhcGU6IGFueSA9IHt9O1xuICAgIHV0aWwub2JqZWN0S2V5cyhtYXNrKS5tYXAoKGtleSkgPT4ge1xuICAgICAgc2hhcGVba2V5XSA9IHRoaXMuc2hhcGVba2V5XTtcbiAgICB9KTtcbiAgICByZXR1cm4gbmV3IFpvZE9iamVjdCh7XG4gICAgICAuLi50aGlzLl9kZWYsXG4gICAgICBzaGFwZTogKCkgPT4gc2hhcGUsXG4gICAgfSkgYXMgYW55O1xuICB9XG5cbiAgb21pdDxNYXNrIGV4dGVuZHMgeyBbayBpbiBrZXlvZiBUXT86IHRydWUgfT4oXG4gICAgbWFzazogTWFza1xuICApOiBab2RPYmplY3Q8XG4gICAgb2JqZWN0VXRpbC5ub05ldmVyPHsgW2sgaW4ga2V5b2YgVF06IGsgZXh0ZW5kcyBrZXlvZiBNYXNrID8gbmV2ZXIgOiBUW2tdIH0+LFxuICAgIFVua25vd25LZXlzLFxuICAgIENhdGNoYWxsXG4gID4ge1xuICAgIGNvbnN0IHNoYXBlOiBhbnkgPSB7fTtcbiAgICB1dGlsLm9iamVjdEtleXModGhpcy5zaGFwZSkubWFwKChrZXkpID0+IHtcbiAgICAgIGlmICh1dGlsLm9iamVjdEtleXMobWFzaykuaW5kZXhPZihrZXkpID09PSAtMSkge1xuICAgICAgICBzaGFwZVtrZXldID0gdGhpcy5zaGFwZVtrZXldO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBuZXcgWm9kT2JqZWN0KHtcbiAgICAgIC4uLnRoaXMuX2RlZixcbiAgICAgIHNoYXBlOiAoKSA9PiBzaGFwZSxcbiAgICB9KSBhcyBhbnk7XG4gIH1cblxuICBkZWVwUGFydGlhbCgpOiBwYXJ0aWFsVXRpbC5EZWVwUGFydGlhbDx0aGlzPiB7XG4gICAgcmV0dXJuIGRlZXBQYXJ0aWFsaWZ5KHRoaXMpIGFzIGFueTtcbiAgfVxuXG4gIHBhcnRpYWwoKTogWm9kT2JqZWN0PFxuICAgIHsgW2sgaW4ga2V5b2YgVF06IFpvZE9wdGlvbmFsPFRba10+IH0sXG4gICAgVW5rbm93bktleXMsXG4gICAgQ2F0Y2hhbGxcbiAgPjtcbiAgcGFydGlhbDxNYXNrIGV4dGVuZHMgeyBbayBpbiBrZXlvZiBUXT86IHRydWUgfT4oXG4gICAgbWFzazogTWFza1xuICApOiBab2RPYmplY3Q8XG4gICAgb2JqZWN0VXRpbC5ub05ldmVyPHtcbiAgICAgIFtrIGluIGtleW9mIFRdOiBrIGV4dGVuZHMga2V5b2YgTWFzayA/IFpvZE9wdGlvbmFsPFRba10+IDogVFtrXTtcbiAgICB9PixcbiAgICBVbmtub3duS2V5cyxcbiAgICBDYXRjaGFsbFxuICA+O1xuICBwYXJ0aWFsKG1hc2s/OiBhbnkpIHtcbiAgICBjb25zdCBuZXdTaGFwZTogYW55ID0ge307XG4gICAgaWYgKG1hc2spIHtcbiAgICAgIHV0aWwub2JqZWN0S2V5cyh0aGlzLnNoYXBlKS5tYXAoKGtleSkgPT4ge1xuICAgICAgICBpZiAodXRpbC5vYmplY3RLZXlzKG1hc2spLmluZGV4T2Yoa2V5KSA9PT0gLTEpIHtcbiAgICAgICAgICBuZXdTaGFwZVtrZXldID0gdGhpcy5zaGFwZVtrZXldO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5ld1NoYXBlW2tleV0gPSB0aGlzLnNoYXBlW2tleV0ub3B0aW9uYWwoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICByZXR1cm4gbmV3IFpvZE9iamVjdCh7XG4gICAgICAgIC4uLnRoaXMuX2RlZixcbiAgICAgICAgc2hhcGU6ICgpID0+IG5ld1NoYXBlLFxuICAgICAgfSkgYXMgYW55O1xuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKGNvbnN0IGtleSBpbiB0aGlzLnNoYXBlKSB7XG4gICAgICAgIGNvbnN0IGZpZWxkU2NoZW1hID0gdGhpcy5zaGFwZVtrZXldO1xuICAgICAgICBuZXdTaGFwZVtrZXldID0gZmllbGRTY2hlbWEub3B0aW9uYWwoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFpvZE9iamVjdCh7XG4gICAgICAuLi50aGlzLl9kZWYsXG4gICAgICBzaGFwZTogKCkgPT4gbmV3U2hhcGUsXG4gICAgfSkgYXMgYW55O1xuICB9XG5cbiAgcmVxdWlyZWQoKTogWm9kT2JqZWN0PFxuICAgIHsgW2sgaW4ga2V5b2YgVF06IGRlb3B0aW9uYWw8VFtrXT4gfSxcbiAgICBVbmtub3duS2V5cyxcbiAgICBDYXRjaGFsbFxuICA+IHtcbiAgICBjb25zdCBuZXdTaGFwZTogYW55ID0ge307XG4gICAgZm9yIChjb25zdCBrZXkgaW4gdGhpcy5zaGFwZSkge1xuICAgICAgY29uc3QgZmllbGRTY2hlbWEgPSB0aGlzLnNoYXBlW2tleV07XG4gICAgICBsZXQgbmV3RmllbGQgPSBmaWVsZFNjaGVtYTtcbiAgICAgIHdoaWxlIChuZXdGaWVsZCBpbnN0YW5jZW9mIFpvZE9wdGlvbmFsKSB7XG4gICAgICAgIG5ld0ZpZWxkID0gKG5ld0ZpZWxkIGFzIFpvZE9wdGlvbmFsPGFueT4pLl9kZWYuaW5uZXJUeXBlO1xuICAgICAgfVxuXG4gICAgICBuZXdTaGFwZVtrZXldID0gbmV3RmllbGQ7XG4gICAgfVxuICAgIHJldHVybiBuZXcgWm9kT2JqZWN0KHtcbiAgICAgIC4uLnRoaXMuX2RlZixcbiAgICAgIHNoYXBlOiAoKSA9PiBuZXdTaGFwZSxcbiAgICB9KSBhcyBhbnk7XG4gIH1cblxuICBzdGF0aWMgY3JlYXRlID0gPFQgZXh0ZW5kcyBab2RSYXdTaGFwZT4oXG4gICAgc2hhcGU6IFQsXG4gICAgcGFyYW1zPzogUmF3Q3JlYXRlUGFyYW1zXG4gICk6IFpvZE9iamVjdDxUPiA9PiB7XG4gICAgcmV0dXJuIG5ldyBab2RPYmplY3Qoe1xuICAgICAgc2hhcGU6ICgpID0+IHNoYXBlLFxuICAgICAgdW5rbm93bktleXM6IFwic3RyaXBcIixcbiAgICAgIGNhdGNoYWxsOiBab2ROZXZlci5jcmVhdGUoKSxcbiAgICAgIHR5cGVOYW1lOiBab2RGaXJzdFBhcnR5VHlwZUtpbmQuWm9kT2JqZWN0LFxuICAgICAgLi4ucHJvY2Vzc0NyZWF0ZVBhcmFtcyhwYXJhbXMpLFxuICAgIH0pIGFzIGFueTtcbiAgfTtcblxuICBzdGF0aWMgc3RyaWN0Q3JlYXRlID0gPFQgZXh0ZW5kcyBab2RSYXdTaGFwZT4oXG4gICAgc2hhcGU6IFQsXG4gICAgcGFyYW1zPzogUmF3Q3JlYXRlUGFyYW1zXG4gICk6IFpvZE9iamVjdDxULCBcInN0cmljdFwiPiA9PiB7XG4gICAgcmV0dXJuIG5ldyBab2RPYmplY3Qoe1xuICAgICAgc2hhcGU6ICgpID0+IHNoYXBlLFxuICAgICAgdW5rbm93bktleXM6IFwic3RyaWN0XCIsXG4gICAgICBjYXRjaGFsbDogWm9kTmV2ZXIuY3JlYXRlKCksXG4gICAgICB0eXBlTmFtZTogWm9kRmlyc3RQYXJ0eVR5cGVLaW5kLlpvZE9iamVjdCxcbiAgICAgIC4uLnByb2Nlc3NDcmVhdGVQYXJhbXMocGFyYW1zKSxcbiAgICB9KSBhcyBhbnk7XG4gIH07XG5cbiAgc3RhdGljIGxhenljcmVhdGUgPSA8VCBleHRlbmRzIFpvZFJhd1NoYXBlPihcbiAgICBzaGFwZTogKCkgPT4gVCxcbiAgICBwYXJhbXM/OiBSYXdDcmVhdGVQYXJhbXNcbiAgKTogWm9kT2JqZWN0PFQ+ID0+IHtcbiAgICByZXR1cm4gbmV3IFpvZE9iamVjdCh7XG4gICAgICBzaGFwZSxcbiAgICAgIHVua25vd25LZXlzOiBcInN0cmlwXCIsXG4gICAgICBjYXRjaGFsbDogWm9kTmV2ZXIuY3JlYXRlKCksXG4gICAgICB0eXBlTmFtZTogWm9kRmlyc3RQYXJ0eVR5cGVLaW5kLlpvZE9iamVjdCxcbiAgICAgIC4uLnByb2Nlc3NDcmVhdGVQYXJhbXMocGFyYW1zKSxcbiAgICB9KSBhcyBhbnk7XG4gIH07XG59XG5cbmV4cG9ydCB0eXBlIEFueVpvZE9iamVjdCA9IFpvZE9iamVjdDxhbnksIGFueSwgYW55PjtcblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLy8vLy8vLyAgICAgICAgICAgICAgICAgICAgLy8vLy8vLy8vL1xuLy8vLy8vLy8vLyAgICAgIFpvZFVuaW9uICAgICAgLy8vLy8vLy8vL1xuLy8vLy8vLy8vLyAgICAgICAgICAgICAgICAgICAgLy8vLy8vLy8vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xudHlwZSBab2RVbmlvbk9wdGlvbnMgPSBSZWFkb25seTxbWm9kVHlwZUFueSwgLi4uWm9kVHlwZUFueVtdXT47XG5leHBvcnQgaW50ZXJmYWNlIFpvZFVuaW9uRGVmPFxuICBUIGV4dGVuZHMgWm9kVW5pb25PcHRpb25zID0gUmVhZG9ubHk8XG4gICAgW1pvZFR5cGVBbnksIFpvZFR5cGVBbnksIC4uLlpvZFR5cGVBbnlbXV1cbiAgPlxuPiBleHRlbmRzIFpvZFR5cGVEZWYge1xuICBvcHRpb25zOiBUO1xuICB0eXBlTmFtZTogWm9kRmlyc3RQYXJ0eVR5cGVLaW5kLlpvZFVuaW9uO1xufVxuXG5leHBvcnQgY2xhc3MgWm9kVW5pb248VCBleHRlbmRzIFpvZFVuaW9uT3B0aW9ucz4gZXh0ZW5kcyBab2RUeXBlPFxuICBUW251bWJlcl1bXCJfb3V0cHV0XCJdLFxuICBab2RVbmlvbkRlZjxUPixcbiAgVFtudW1iZXJdW1wiX2lucHV0XCJdXG4+IHtcbiAgX3BhcnNlKGlucHV0OiBQYXJzZUlucHV0KTogUGFyc2VSZXR1cm5UeXBlPHRoaXNbXCJfb3V0cHV0XCJdPiB7XG4gICAgY29uc3QgeyBjdHggfSA9IHRoaXMuX3Byb2Nlc3NJbnB1dFBhcmFtcyhpbnB1dCk7XG4gICAgY29uc3Qgb3B0aW9ucyA9IHRoaXMuX2RlZi5vcHRpb25zO1xuXG4gICAgZnVuY3Rpb24gaGFuZGxlUmVzdWx0cyhcbiAgICAgIHJlc3VsdHM6IHsgY3R4OiBQYXJzZUNvbnRleHQ7IHJlc3VsdDogU3luY1BhcnNlUmV0dXJuVHlwZTxhbnk+IH1bXVxuICAgICkge1xuICAgICAgLy8gcmV0dXJuIGZpcnN0IGlzc3VlLWZyZWUgdmFsaWRhdGlvbiBpZiBpdCBleGlzdHNcbiAgICAgIGZvciAoY29uc3QgcmVzdWx0IG9mIHJlc3VsdHMpIHtcbiAgICAgICAgaWYgKHJlc3VsdC5yZXN1bHQuc3RhdHVzID09PSBcInZhbGlkXCIpIHtcbiAgICAgICAgICByZXR1cm4gcmVzdWx0LnJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmb3IgKGNvbnN0IHJlc3VsdCBvZiByZXN1bHRzKSB7XG4gICAgICAgIGlmIChyZXN1bHQucmVzdWx0LnN0YXR1cyA9PT0gXCJkaXJ0eVwiKSB7XG4gICAgICAgICAgLy8gYWRkIGlzc3VlcyBmcm9tIGRpcnR5IG9wdGlvblxuXG4gICAgICAgICAgY3R4LmNvbW1vbi5pc3N1ZXMucHVzaCguLi5yZXN1bHQuY3R4LmNvbW1vbi5pc3N1ZXMpO1xuICAgICAgICAgIHJldHVybiByZXN1bHQucmVzdWx0O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIHJldHVybiBpbnZhbGlkXG4gICAgICBjb25zdCB1bmlvbkVycm9ycyA9IHJlc3VsdHMubWFwKFxuICAgICAgICAocmVzdWx0KSA9PiBuZXcgWm9kRXJyb3IocmVzdWx0LmN0eC5jb21tb24uaXNzdWVzKVxuICAgICAgKTtcblxuICAgICAgYWRkSXNzdWVUb0NvbnRleHQoY3R4LCB7XG4gICAgICAgIGNvZGU6IFpvZElzc3VlQ29kZS5pbnZhbGlkX3VuaW9uLFxuICAgICAgICB1bmlvbkVycm9ycyxcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIElOVkFMSUQ7XG4gICAgfVxuXG4gICAgaWYgKGN0eC5jb21tb24uYXN5bmMpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLmFsbChcbiAgICAgICAgb3B0aW9ucy5tYXAoYXN5bmMgKG9wdGlvbikgPT4ge1xuICAgICAgICAgIGNvbnN0IGNoaWxkQ3R4OiBQYXJzZUNvbnRleHQgPSB7XG4gICAgICAgICAgICAuLi5jdHgsXG4gICAgICAgICAgICBjb21tb246IHtcbiAgICAgICAgICAgICAgLi4uY3R4LmNvbW1vbixcbiAgICAgICAgICAgICAgaXNzdWVzOiBbXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwYXJlbnQ6IG51bGwsXG4gICAgICAgICAgfTtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdWx0OiBhd2FpdCBvcHRpb24uX3BhcnNlQXN5bmMoe1xuICAgICAgICAgICAgICBkYXRhOiBjdHguZGF0YSxcbiAgICAgICAgICAgICAgcGF0aDogY3R4LnBhdGgsXG4gICAgICAgICAgICAgIHBhcmVudDogY2hpbGRDdHgsXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIGN0eDogY2hpbGRDdHgsXG4gICAgICAgICAgfTtcbiAgICAgICAgfSlcbiAgICAgICkudGhlbihoYW5kbGVSZXN1bHRzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IGRpcnR5OiB1bmRlZmluZWQgfCB7IHJlc3VsdDogRElSVFk8YW55PjsgY3R4OiBQYXJzZUNvbnRleHQgfSA9XG4gICAgICAgIHVuZGVmaW5lZDtcbiAgICAgIGNvbnN0IGlzc3VlczogWm9kSXNzdWVbXVtdID0gW107XG4gICAgICBmb3IgKGNvbnN0IG9wdGlvbiBvZiBvcHRpb25zKSB7XG4gICAgICAgIGNvbnN0IGNoaWxkQ3R4OiBQYXJzZUNvbnRleHQgPSB7XG4gICAgICAgICAgLi4uY3R4LFxuICAgICAgICAgIGNvbW1vbjoge1xuICAgICAgICAgICAgLi4uY3R4LmNvbW1vbixcbiAgICAgICAgICAgIGlzc3VlczogW10sXG4gICAgICAgICAgfSxcbiAgICAgICAgICBwYXJlbnQ6IG51bGwsXG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IG9wdGlvbi5fcGFyc2VTeW5jKHtcbiAgICAgICAgICBkYXRhOiBjdHguZGF0YSxcbiAgICAgICAgICBwYXRoOiBjdHgucGF0aCxcbiAgICAgICAgICBwYXJlbnQ6IGNoaWxkQ3R4LFxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAocmVzdWx0LnN0YXR1cyA9PT0gXCJ2YWxpZFwiKSB7XG4gICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfSBlbHNlIGlmIChyZXN1bHQuc3RhdHVzID09PSBcImRpcnR5XCIgJiYgIWRpcnR5KSB7XG4gICAgICAgICAgZGlydHkgPSB7IHJlc3VsdCwgY3R4OiBjaGlsZEN0eCB9O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNoaWxkQ3R4LmNvbW1vbi5pc3N1ZXMubGVuZ3RoKSB7XG4gICAgICAgICAgaXNzdWVzLnB1c2goY2hpbGRDdHguY29tbW9uLmlzc3Vlcyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGRpcnR5KSB7XG4gICAgICAgIGN0eC5jb21tb24uaXNzdWVzLnB1c2goLi4uZGlydHkuY3R4LmNvbW1vbi5pc3N1ZXMpO1xuICAgICAgICByZXR1cm4gZGlydHkucmVzdWx0O1xuICAgICAgfVxuXG4gICAgICBjb25zdCB1bmlvbkVycm9ycyA9IGlzc3Vlcy5tYXAoKGlzc3VlcykgPT4gbmV3IFpvZEVycm9yKGlzc3VlcykpO1xuICAgICAgYWRkSXNzdWVUb0NvbnRleHQoY3R4LCB7XG4gICAgICAgIGNvZGU6IFpvZElzc3VlQ29kZS5pbnZhbGlkX3VuaW9uLFxuICAgICAgICB1bmlvbkVycm9ycyxcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gSU5WQUxJRDtcbiAgICB9XG4gIH1cblxuICBnZXQgb3B0aW9ucygpIHtcbiAgICByZXR1cm4gdGhpcy5fZGVmLm9wdGlvbnM7XG4gIH1cblxuICBzdGF0aWMgY3JlYXRlID0gPFxuICAgIFQgZXh0ZW5kcyBSZWFkb25seTxbWm9kVHlwZUFueSwgWm9kVHlwZUFueSwgLi4uWm9kVHlwZUFueVtdXT5cbiAgPihcbiAgICB0eXBlczogVCxcbiAgICBwYXJhbXM/OiBSYXdDcmVhdGVQYXJhbXNcbiAgKTogWm9kVW5pb248VD4gPT4ge1xuICAgIHJldHVybiBuZXcgWm9kVW5pb24oe1xuICAgICAgb3B0aW9uczogdHlwZXMsXG4gICAgICB0eXBlTmFtZTogWm9kRmlyc3RQYXJ0eVR5cGVLaW5kLlpvZFVuaW9uLFxuICAgICAgLi4ucHJvY2Vzc0NyZWF0ZVBhcmFtcyhwYXJhbXMpLFxuICAgIH0pO1xuICB9O1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8vLy8vLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLy8vLy8vLy8vXG4vLy8vLy8vLy8vICAgICAgWm9kRGlzY3JpbWluYXRlZFVuaW9uICAgICAgLy8vLy8vLy8vL1xuLy8vLy8vLy8vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vLy8vLy8vLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5leHBvcnQgdHlwZSBab2REaXNjcmltaW5hdGVkVW5pb25PcHRpb248XG4gIERpc2NyaW1pbmF0b3IgZXh0ZW5kcyBzdHJpbmcsXG4gIERpc2NyaW1pbmF0b3JWYWx1ZSBleHRlbmRzIFByaW1pdGl2ZVxuPiA9IFpvZE9iamVjdDxcbiAgeyBba2V5IGluIERpc2NyaW1pbmF0b3JdOiBab2RMaXRlcmFsPERpc2NyaW1pbmF0b3JWYWx1ZT4gfSAmIFpvZFJhd1NoYXBlLFxuICBhbnksXG4gIGFueVxuPjtcblxuZXhwb3J0IGludGVyZmFjZSBab2REaXNjcmltaW5hdGVkVW5pb25EZWY8XG4gIERpc2NyaW1pbmF0b3IgZXh0ZW5kcyBzdHJpbmcsXG4gIERpc2NyaW1pbmF0b3JWYWx1ZSBleHRlbmRzIFByaW1pdGl2ZSxcbiAgT3B0aW9uIGV4dGVuZHMgWm9kRGlzY3JpbWluYXRlZFVuaW9uT3B0aW9uPERpc2NyaW1pbmF0b3IsIERpc2NyaW1pbmF0b3JWYWx1ZT5cbj4gZXh0ZW5kcyBab2RUeXBlRGVmIHtcbiAgZGlzY3JpbWluYXRvcjogRGlzY3JpbWluYXRvcjtcbiAgb3B0aW9uczogTWFwPERpc2NyaW1pbmF0b3JWYWx1ZSwgT3B0aW9uPjtcbiAgdHlwZU5hbWU6IFpvZEZpcnN0UGFydHlUeXBlS2luZC5ab2REaXNjcmltaW5hdGVkVW5pb247XG59XG5cbmV4cG9ydCBjbGFzcyBab2REaXNjcmltaW5hdGVkVW5pb248XG4gIERpc2NyaW1pbmF0b3IgZXh0ZW5kcyBzdHJpbmcsXG4gIERpc2NyaW1pbmF0b3JWYWx1ZSBleHRlbmRzIFByaW1pdGl2ZSxcbiAgT3B0aW9uIGV4dGVuZHMgWm9kRGlzY3JpbWluYXRlZFVuaW9uT3B0aW9uPERpc2NyaW1pbmF0b3IsIERpc2NyaW1pbmF0b3JWYWx1ZT5cbj4gZXh0ZW5kcyBab2RUeXBlPFxuICBPcHRpb25bXCJfb3V0cHV0XCJdLFxuICBab2REaXNjcmltaW5hdGVkVW5pb25EZWY8RGlzY3JpbWluYXRvciwgRGlzY3JpbWluYXRvclZhbHVlLCBPcHRpb24+LFxuICBPcHRpb25bXCJfaW5wdXRcIl1cbj4ge1xuICBfcGFyc2UoaW5wdXQ6IFBhcnNlSW5wdXQpOiBQYXJzZVJldHVyblR5cGU8dGhpc1tcIl9vdXRwdXRcIl0+IHtcbiAgICBjb25zdCB7IGN0eCB9ID0gdGhpcy5fcHJvY2Vzc0lucHV0UGFyYW1zKGlucHV0KTtcblxuICAgIGlmIChjdHgucGFyc2VkVHlwZSAhPT0gWm9kUGFyc2VkVHlwZS5vYmplY3QpIHtcbiAgICAgIGFkZElzc3VlVG9Db250ZXh0KGN0eCwge1xuICAgICAgICBjb2RlOiBab2RJc3N1ZUNvZGUuaW52YWxpZF90eXBlLFxuICAgICAgICBleHBlY3RlZDogWm9kUGFyc2VkVHlwZS5vYmplY3QsXG4gICAgICAgIHJlY2VpdmVkOiBjdHgucGFyc2VkVHlwZSxcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIElOVkFMSUQ7XG4gICAgfVxuXG4gICAgY29uc3QgZGlzY3JpbWluYXRvciA9IHRoaXMuZGlzY3JpbWluYXRvcjtcbiAgICBjb25zdCBkaXNjcmltaW5hdG9yVmFsdWU6IERpc2NyaW1pbmF0b3JWYWx1ZSA9IGN0eC5kYXRhW2Rpc2NyaW1pbmF0b3JdO1xuICAgIGNvbnN0IG9wdGlvbiA9IHRoaXMub3B0aW9ucy5nZXQoZGlzY3JpbWluYXRvclZhbHVlKTtcblxuICAgIGlmICghb3B0aW9uKSB7XG4gICAgICBhZGRJc3N1ZVRvQ29udGV4dChjdHgsIHtcbiAgICAgICAgY29kZTogWm9kSXNzdWVDb2RlLmludmFsaWRfdW5pb25fZGlzY3JpbWluYXRvcixcbiAgICAgICAgb3B0aW9uczogdGhpcy52YWxpZERpc2NyaW1pbmF0b3JWYWx1ZXMsXG4gICAgICAgIHBhdGg6IFtkaXNjcmltaW5hdG9yXSxcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIElOVkFMSUQ7XG4gICAgfVxuXG4gICAgaWYgKGN0eC5jb21tb24uYXN5bmMpIHtcbiAgICAgIHJldHVybiBvcHRpb24uX3BhcnNlQXN5bmMoe1xuICAgICAgICBkYXRhOiBjdHguZGF0YSxcbiAgICAgICAgcGF0aDogY3R4LnBhdGgsXG4gICAgICAgIHBhcmVudDogY3R4LFxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBvcHRpb24uX3BhcnNlU3luYyh7XG4gICAgICAgIGRhdGE6IGN0eC5kYXRhLFxuICAgICAgICBwYXRoOiBjdHgucGF0aCxcbiAgICAgICAgcGFyZW50OiBjdHgsXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBnZXQgZGlzY3JpbWluYXRvcigpIHtcbiAgICByZXR1cm4gdGhpcy5fZGVmLmRpc2NyaW1pbmF0b3I7XG4gIH1cblxuICBnZXQgdmFsaWREaXNjcmltaW5hdG9yVmFsdWVzKCkge1xuICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMub3B0aW9ucy5rZXlzKCkpO1xuICB9XG5cbiAgZ2V0IG9wdGlvbnMoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2RlZi5vcHRpb25zO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBjb25zdHJ1Y3RvciBvZiB0aGUgZGlzY3JpbWluYXRlZCB1bmlvbiBzY2hlbWEuIEl0cyBiZWhhdmlvdXIgaXMgdmVyeSBzaW1pbGFyIHRvIHRoYXQgb2YgdGhlIG5vcm1hbCB6LnVuaW9uKCkgY29uc3RydWN0b3IuXG4gICAqIEhvd2V2ZXIsIGl0IG9ubHkgYWxsb3dzIGEgdW5pb24gb2Ygb2JqZWN0cywgYWxsIG9mIHdoaWNoIG5lZWQgdG8gc2hhcmUgYSBkaXNjcmltaW5hdG9yIHByb3BlcnR5LiBUaGlzIHByb3BlcnR5IG11c3RcbiAgICogaGF2ZSBhIGRpZmZlcmVudCB2YWx1ZSBmb3IgZWFjaCBvYmplY3QgaW4gdGhlIHVuaW9uLlxuICAgKiBAcGFyYW0gZGlzY3JpbWluYXRvciB0aGUgbmFtZSBvZiB0aGUgZGlzY3JpbWluYXRvciBwcm9wZXJ0eVxuICAgKiBAcGFyYW0gdHlwZXMgYW4gYXJyYXkgb2Ygb2JqZWN0IHNjaGVtYXNcbiAgICogQHBhcmFtIHBhcmFtc1xuICAgKi9cbiAgc3RhdGljIGNyZWF0ZTxcbiAgICBEaXNjcmltaW5hdG9yIGV4dGVuZHMgc3RyaW5nLFxuICAgIERpc2NyaW1pbmF0b3JWYWx1ZSBleHRlbmRzIFByaW1pdGl2ZSxcbiAgICBUeXBlcyBleHRlbmRzIFtcbiAgICAgIFpvZERpc2NyaW1pbmF0ZWRVbmlvbk9wdGlvbjxEaXNjcmltaW5hdG9yLCBEaXNjcmltaW5hdG9yVmFsdWU+LFxuICAgICAgWm9kRGlzY3JpbWluYXRlZFVuaW9uT3B0aW9uPERpc2NyaW1pbmF0b3IsIERpc2NyaW1pbmF0b3JWYWx1ZT4sXG4gICAgICAuLi5ab2REaXNjcmltaW5hdGVkVW5pb25PcHRpb248RGlzY3JpbWluYXRvciwgRGlzY3JpbWluYXRvclZhbHVlPltdXG4gICAgXVxuICA+KFxuICAgIGRpc2NyaW1pbmF0b3I6IERpc2NyaW1pbmF0b3IsXG4gICAgdHlwZXM6IFR5cGVzLFxuICAgIHBhcmFtcz86IFJhd0NyZWF0ZVBhcmFtc1xuICApOiBab2REaXNjcmltaW5hdGVkVW5pb248RGlzY3JpbWluYXRvciwgRGlzY3JpbWluYXRvclZhbHVlLCBUeXBlc1tudW1iZXJdPiB7XG4gICAgLy8gR2V0IGFsbCB0aGUgdmFsaWQgZGlzY3JpbWluYXRvciB2YWx1ZXNcbiAgICBjb25zdCBvcHRpb25zOiBNYXA8RGlzY3JpbWluYXRvclZhbHVlLCBUeXBlc1tudW1iZXJdPiA9IG5ldyBNYXAoKTtcblxuICAgIHRyeSB7XG4gICAgICB0eXBlcy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgIGNvbnN0IGRpc2NyaW1pbmF0b3JWYWx1ZSA9IHR5cGUuc2hhcGVbZGlzY3JpbWluYXRvcl0udmFsdWU7XG4gICAgICAgIG9wdGlvbnMuc2V0KGRpc2NyaW1pbmF0b3JWYWx1ZSwgdHlwZSk7XG4gICAgICB9KTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIFwiVGhlIGRpc2NyaW1pbmF0b3IgdmFsdWUgY291bGQgbm90IGJlIGV4dHJhY3RlZCBmcm9tIGFsbCB0aGUgcHJvdmlkZWQgc2NoZW1hc1wiXG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIEFzc2VydCB0aGF0IGFsbCB0aGUgZGlzY3JpbWluYXRvciB2YWx1ZXMgYXJlIHVuaXF1ZVxuICAgIGlmIChvcHRpb25zLnNpemUgIT09IHR5cGVzLmxlbmd0aCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU29tZSBvZiB0aGUgZGlzY3JpbWluYXRvciB2YWx1ZXMgYXJlIG5vdCB1bmlxdWVcIik7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBab2REaXNjcmltaW5hdGVkVW5pb248XG4gICAgICBEaXNjcmltaW5hdG9yLFxuICAgICAgRGlzY3JpbWluYXRvclZhbHVlLFxuICAgICAgVHlwZXNbbnVtYmVyXVxuICAgID4oe1xuICAgICAgdHlwZU5hbWU6IFpvZEZpcnN0UGFydHlUeXBlS2luZC5ab2REaXNjcmltaW5hdGVkVW5pb24sXG4gICAgICBkaXNjcmltaW5hdG9yLFxuICAgICAgb3B0aW9ucyxcbiAgICAgIC4uLnByb2Nlc3NDcmVhdGVQYXJhbXMocGFyYW1zKSxcbiAgICB9KTtcbiAgfVxufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8vLy8vLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAvLy8vLy8vLy8vXG4vLy8vLy8vLy8vICAgICAgWm9kSW50ZXJzZWN0aW9uICAgICAgLy8vLy8vLy8vL1xuLy8vLy8vLy8vLyAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vLy8vLy8vLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuZXhwb3J0IGludGVyZmFjZSBab2RJbnRlcnNlY3Rpb25EZWY8XG4gIFQgZXh0ZW5kcyBab2RUeXBlQW55ID0gWm9kVHlwZUFueSxcbiAgVSBleHRlbmRzIFpvZFR5cGVBbnkgPSBab2RUeXBlQW55XG4+IGV4dGVuZHMgWm9kVHlwZURlZiB7XG4gIGxlZnQ6IFQ7XG4gIHJpZ2h0OiBVO1xuICB0eXBlTmFtZTogWm9kRmlyc3RQYXJ0eVR5cGVLaW5kLlpvZEludGVyc2VjdGlvbjtcbn1cblxuZnVuY3Rpb24gbWVyZ2VWYWx1ZXMoXG4gIGE6IGFueSxcbiAgYjogYW55XG4pOiB7IHZhbGlkOiB0cnVlOyBkYXRhOiBhbnkgfSB8IHsgdmFsaWQ6IGZhbHNlIH0ge1xuICBjb25zdCBhVHlwZSA9IGdldFBhcnNlZFR5cGUoYSk7XG4gIGNvbnN0IGJUeXBlID0gZ2V0UGFyc2VkVHlwZShiKTtcblxuICBpZiAoYSA9PT0gYikge1xuICAgIHJldHVybiB7IHZhbGlkOiB0cnVlLCBkYXRhOiBhIH07XG4gIH0gZWxzZSBpZiAoYVR5cGUgPT09IFpvZFBhcnNlZFR5cGUub2JqZWN0ICYmIGJUeXBlID09PSBab2RQYXJzZWRUeXBlLm9iamVjdCkge1xuICAgIGNvbnN0IGJLZXlzID0gdXRpbC5vYmplY3RLZXlzKGIpO1xuICAgIGNvbnN0IHNoYXJlZEtleXMgPSB1dGlsXG4gICAgICAub2JqZWN0S2V5cyhhKVxuICAgICAgLmZpbHRlcigoa2V5KSA9PiBiS2V5cy5pbmRleE9mKGtleSkgIT09IC0xKTtcblxuICAgIGNvbnN0IG5ld09iajogYW55ID0geyAuLi5hLCAuLi5iIH07XG4gICAgZm9yIChjb25zdCBrZXkgb2Ygc2hhcmVkS2V5cykge1xuICAgICAgY29uc3Qgc2hhcmVkVmFsdWUgPSBtZXJnZVZhbHVlcyhhW2tleV0sIGJba2V5XSk7XG4gICAgICBpZiAoIXNoYXJlZFZhbHVlLnZhbGlkKSB7XG4gICAgICAgIHJldHVybiB7IHZhbGlkOiBmYWxzZSB9O1xuICAgICAgfVxuICAgICAgbmV3T2JqW2tleV0gPSBzaGFyZWRWYWx1ZS5kYXRhO1xuICAgIH1cblxuICAgIHJldHVybiB7IHZhbGlkOiB0cnVlLCBkYXRhOiBuZXdPYmogfTtcbiAgfSBlbHNlIGlmIChhVHlwZSA9PT0gWm9kUGFyc2VkVHlwZS5hcnJheSAmJiBiVHlwZSA9PT0gWm9kUGFyc2VkVHlwZS5hcnJheSkge1xuICAgIGlmIChhLmxlbmd0aCAhPT0gYi5sZW5ndGgpIHtcbiAgICAgIHJldHVybiB7IHZhbGlkOiBmYWxzZSB9O1xuICAgIH1cblxuICAgIGNvbnN0IG5ld0FycmF5ID0gW107XG4gICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IGEubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICBjb25zdCBpdGVtQSA9IGFbaW5kZXhdO1xuICAgICAgY29uc3QgaXRlbUIgPSBiW2luZGV4XTtcbiAgICAgIGNvbnN0IHNoYXJlZFZhbHVlID0gbWVyZ2VWYWx1ZXMoaXRlbUEsIGl0ZW1CKTtcblxuICAgICAgaWYgKCFzaGFyZWRWYWx1ZS52YWxpZCkge1xuICAgICAgICByZXR1cm4geyB2YWxpZDogZmFsc2UgfTtcbiAgICAgIH1cblxuICAgICAgbmV3QXJyYXkucHVzaChzaGFyZWRWYWx1ZS5kYXRhKTtcbiAgICB9XG5cbiAgICByZXR1cm4geyB2YWxpZDogdHJ1ZSwgZGF0YTogbmV3QXJyYXkgfTtcbiAgfSBlbHNlIGlmIChcbiAgICBhVHlwZSA9PT0gWm9kUGFyc2VkVHlwZS5kYXRlICYmXG4gICAgYlR5cGUgPT09IFpvZFBhcnNlZFR5cGUuZGF0ZSAmJlxuICAgICthID09PSArYlxuICApIHtcbiAgICByZXR1cm4geyB2YWxpZDogdHJ1ZSwgZGF0YTogYSB9O1xuICB9IGVsc2Uge1xuICAgIHJldHVybiB7IHZhbGlkOiBmYWxzZSB9O1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBab2RJbnRlcnNlY3Rpb248XG4gIFQgZXh0ZW5kcyBab2RUeXBlQW55LFxuICBVIGV4dGVuZHMgWm9kVHlwZUFueVxuPiBleHRlbmRzIFpvZFR5cGU8XG4gIFRbXCJfb3V0cHV0XCJdICYgVVtcIl9vdXRwdXRcIl0sXG4gIFpvZEludGVyc2VjdGlvbkRlZjxULCBVPixcbiAgVFtcIl9pbnB1dFwiXSAmIFVbXCJfaW5wdXRcIl1cbj4ge1xuICBfcGFyc2UoaW5wdXQ6IFBhcnNlSW5wdXQpOiBQYXJzZVJldHVyblR5cGU8dGhpc1tcIl9vdXRwdXRcIl0+IHtcbiAgICBjb25zdCB7IHN0YXR1cywgY3R4IH0gPSB0aGlzLl9wcm9jZXNzSW5wdXRQYXJhbXMoaW5wdXQpO1xuICAgIGNvbnN0IGhhbmRsZVBhcnNlZCA9IChcbiAgICAgIHBhcnNlZExlZnQ6IFN5bmNQYXJzZVJldHVyblR5cGUsXG4gICAgICBwYXJzZWRSaWdodDogU3luY1BhcnNlUmV0dXJuVHlwZVxuICAgICk6IFN5bmNQYXJzZVJldHVyblR5cGU8VCAmIFU+ID0+IHtcbiAgICAgIGlmIChpc0Fib3J0ZWQocGFyc2VkTGVmdCkgfHwgaXNBYm9ydGVkKHBhcnNlZFJpZ2h0KSkge1xuICAgICAgICByZXR1cm4gSU5WQUxJRDtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbWVyZ2VkID0gbWVyZ2VWYWx1ZXMocGFyc2VkTGVmdC52YWx1ZSwgcGFyc2VkUmlnaHQudmFsdWUpO1xuXG4gICAgICBpZiAoIW1lcmdlZC52YWxpZCkge1xuICAgICAgICBhZGRJc3N1ZVRvQ29udGV4dChjdHgsIHtcbiAgICAgICAgICBjb2RlOiBab2RJc3N1ZUNvZGUuaW52YWxpZF9pbnRlcnNlY3Rpb25fdHlwZXMsXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gSU5WQUxJRDtcbiAgICAgIH1cblxuICAgICAgaWYgKGlzRGlydHkocGFyc2VkTGVmdCkgfHwgaXNEaXJ0eShwYXJzZWRSaWdodCkpIHtcbiAgICAgICAgc3RhdHVzLmRpcnR5KCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7IHN0YXR1czogc3RhdHVzLnZhbHVlLCB2YWx1ZTogbWVyZ2VkLmRhdGEgYXMgYW55IH07XG4gICAgfTtcblxuICAgIGlmIChjdHguY29tbW9uLmFzeW5jKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5hbGwoW1xuICAgICAgICB0aGlzLl9kZWYubGVmdC5fcGFyc2VBc3luYyh7XG4gICAgICAgICAgZGF0YTogY3R4LmRhdGEsXG4gICAgICAgICAgcGF0aDogY3R4LnBhdGgsXG4gICAgICAgICAgcGFyZW50OiBjdHgsXG4gICAgICAgIH0pLFxuICAgICAgICB0aGlzLl9kZWYucmlnaHQuX3BhcnNlQXN5bmMoe1xuICAgICAgICAgIGRhdGE6IGN0eC5kYXRhLFxuICAgICAgICAgIHBhdGg6IGN0eC5wYXRoLFxuICAgICAgICAgIHBhcmVudDogY3R4LFxuICAgICAgICB9KSxcbiAgICAgIF0pLnRoZW4oKFtsZWZ0LCByaWdodF06IGFueSkgPT4gaGFuZGxlUGFyc2VkKGxlZnQsIHJpZ2h0KSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBoYW5kbGVQYXJzZWQoXG4gICAgICAgIHRoaXMuX2RlZi5sZWZ0Ll9wYXJzZVN5bmMoe1xuICAgICAgICAgIGRhdGE6IGN0eC5kYXRhLFxuICAgICAgICAgIHBhdGg6IGN0eC5wYXRoLFxuICAgICAgICAgIHBhcmVudDogY3R4LFxuICAgICAgICB9KSxcbiAgICAgICAgdGhpcy5fZGVmLnJpZ2h0Ll9wYXJzZVN5bmMoe1xuICAgICAgICAgIGRhdGE6IGN0eC5kYXRhLFxuICAgICAgICAgIHBhdGg6IGN0eC5wYXRoLFxuICAgICAgICAgIHBhcmVudDogY3R4LFxuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICBzdGF0aWMgY3JlYXRlID0gPFQgZXh0ZW5kcyBab2RUeXBlQW55LCBVIGV4dGVuZHMgWm9kVHlwZUFueT4oXG4gICAgbGVmdDogVCxcbiAgICByaWdodDogVSxcbiAgICBwYXJhbXM/OiBSYXdDcmVhdGVQYXJhbXNcbiAgKTogWm9kSW50ZXJzZWN0aW9uPFQsIFU+ID0+IHtcbiAgICByZXR1cm4gbmV3IFpvZEludGVyc2VjdGlvbih7XG4gICAgICBsZWZ0OiBsZWZ0LFxuICAgICAgcmlnaHQ6IHJpZ2h0LFxuICAgICAgdHlwZU5hbWU6IFpvZEZpcnN0UGFydHlUeXBlS2luZC5ab2RJbnRlcnNlY3Rpb24sXG4gICAgICAuLi5wcm9jZXNzQ3JlYXRlUGFyYW1zKHBhcmFtcyksXG4gICAgfSk7XG4gIH07XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8vLy8vLy8gICAgICAgICAgICAgICAgICAgIC8vLy8vLy8vLy9cbi8vLy8vLy8vLy8gICAgICBab2RUdXBsZSAgICAgIC8vLy8vLy8vLy9cbi8vLy8vLy8vLy8gICAgICAgICAgICAgICAgICAgIC8vLy8vLy8vLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbmV4cG9ydCB0eXBlIFpvZFR1cGxlSXRlbXMgPSBbWm9kVHlwZUFueSwgLi4uWm9kVHlwZUFueVtdXTtcbmV4cG9ydCB0eXBlIEFzc2VydEFycmF5PFQ+ID0gVCBleHRlbmRzIGFueVtdID8gVCA6IG5ldmVyO1xuZXhwb3J0IHR5cGUgT3V0cHV0VHlwZU9mVHVwbGU8VCBleHRlbmRzIFpvZFR1cGxlSXRlbXMgfCBbXT4gPSBBc3NlcnRBcnJheTx7XG4gIFtrIGluIGtleW9mIFRdOiBUW2tdIGV4dGVuZHMgWm9kVHlwZTxhbnksIGFueT4gPyBUW2tdW1wiX291dHB1dFwiXSA6IG5ldmVyO1xufT47XG5leHBvcnQgdHlwZSBPdXRwdXRUeXBlT2ZUdXBsZVdpdGhSZXN0PFxuICBUIGV4dGVuZHMgWm9kVHVwbGVJdGVtcyB8IFtdLFxuICBSZXN0IGV4dGVuZHMgWm9kVHlwZUFueSB8IG51bGwgPSBudWxsXG4+ID0gUmVzdCBleHRlbmRzIFpvZFR5cGVBbnlcbiAgPyBbLi4uT3V0cHV0VHlwZU9mVHVwbGU8VD4sIC4uLlJlc3RbXCJfb3V0cHV0XCJdW11dXG4gIDogT3V0cHV0VHlwZU9mVHVwbGU8VD47XG5cbmV4cG9ydCB0eXBlIElucHV0VHlwZU9mVHVwbGU8VCBleHRlbmRzIFpvZFR1cGxlSXRlbXMgfCBbXT4gPSBBc3NlcnRBcnJheTx7XG4gIFtrIGluIGtleW9mIFRdOiBUW2tdIGV4dGVuZHMgWm9kVHlwZTxhbnksIGFueT4gPyBUW2tdW1wiX2lucHV0XCJdIDogbmV2ZXI7XG59PjtcbmV4cG9ydCB0eXBlIElucHV0VHlwZU9mVHVwbGVXaXRoUmVzdDxcbiAgVCBleHRlbmRzIFpvZFR1cGxlSXRlbXMgfCBbXSxcbiAgUmVzdCBleHRlbmRzIFpvZFR5cGVBbnkgfCBudWxsID0gbnVsbFxuPiA9IFJlc3QgZXh0ZW5kcyBab2RUeXBlQW55XG4gID8gWy4uLklucHV0VHlwZU9mVHVwbGU8VD4sIC4uLlJlc3RbXCJfaW5wdXRcIl1bXV1cbiAgOiBJbnB1dFR5cGVPZlR1cGxlPFQ+O1xuXG5leHBvcnQgaW50ZXJmYWNlIFpvZFR1cGxlRGVmPFxuICBUIGV4dGVuZHMgWm9kVHVwbGVJdGVtcyB8IFtdID0gWm9kVHVwbGVJdGVtcyxcbiAgUmVzdCBleHRlbmRzIFpvZFR5cGVBbnkgfCBudWxsID0gbnVsbFxuPiBleHRlbmRzIFpvZFR5cGVEZWYge1xuICBpdGVtczogVDtcbiAgcmVzdDogUmVzdDtcbiAgdHlwZU5hbWU6IFpvZEZpcnN0UGFydHlUeXBlS2luZC5ab2RUdXBsZTtcbn1cblxuZXhwb3J0IGNsYXNzIFpvZFR1cGxlPFxuICBUIGV4dGVuZHMgW1pvZFR5cGVBbnksIC4uLlpvZFR5cGVBbnlbXV0gfCBbXSA9IFtab2RUeXBlQW55LCAuLi5ab2RUeXBlQW55W11dLFxuICBSZXN0IGV4dGVuZHMgWm9kVHlwZUFueSB8IG51bGwgPSBudWxsXG4+IGV4dGVuZHMgWm9kVHlwZTxcbiAgT3V0cHV0VHlwZU9mVHVwbGVXaXRoUmVzdDxULCBSZXN0PixcbiAgWm9kVHVwbGVEZWY8VCwgUmVzdD4sXG4gIElucHV0VHlwZU9mVHVwbGVXaXRoUmVzdDxULCBSZXN0PlxuPiB7XG4gIF9wYXJzZShpbnB1dDogUGFyc2VJbnB1dCk6IFBhcnNlUmV0dXJuVHlwZTx0aGlzW1wiX291dHB1dFwiXT4ge1xuICAgIGNvbnN0IHsgc3RhdHVzLCBjdHggfSA9IHRoaXMuX3Byb2Nlc3NJbnB1dFBhcmFtcyhpbnB1dCk7XG4gICAgaWYgKGN0eC5wYXJzZWRUeXBlICE9PSBab2RQYXJzZWRUeXBlLmFycmF5KSB7XG4gICAgICBhZGRJc3N1ZVRvQ29udGV4dChjdHgsIHtcbiAgICAgICAgY29kZTogWm9kSXNzdWVDb2RlLmludmFsaWRfdHlwZSxcbiAgICAgICAgZXhwZWN0ZWQ6IFpvZFBhcnNlZFR5cGUuYXJyYXksXG4gICAgICAgIHJlY2VpdmVkOiBjdHgucGFyc2VkVHlwZSxcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIElOVkFMSUQ7XG4gICAgfVxuXG4gICAgaWYgKGN0eC5kYXRhLmxlbmd0aCA8IHRoaXMuX2RlZi5pdGVtcy5sZW5ndGgpIHtcbiAgICAgIGFkZElzc3VlVG9Db250ZXh0KGN0eCwge1xuICAgICAgICBjb2RlOiBab2RJc3N1ZUNvZGUudG9vX3NtYWxsLFxuICAgICAgICBtaW5pbXVtOiB0aGlzLl9kZWYuaXRlbXMubGVuZ3RoLFxuICAgICAgICBpbmNsdXNpdmU6IHRydWUsXG4gICAgICAgIHR5cGU6IFwiYXJyYXlcIixcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gSU5WQUxJRDtcbiAgICB9XG5cbiAgICBjb25zdCByZXN0ID0gdGhpcy5fZGVmLnJlc3Q7XG5cbiAgICBpZiAoIXJlc3QgJiYgY3R4LmRhdGEubGVuZ3RoID4gdGhpcy5fZGVmLml0ZW1zLmxlbmd0aCkge1xuICAgICAgYWRkSXNzdWVUb0NvbnRleHQoY3R4LCB7XG4gICAgICAgIGNvZGU6IFpvZElzc3VlQ29kZS50b29fYmlnLFxuICAgICAgICBtYXhpbXVtOiB0aGlzLl9kZWYuaXRlbXMubGVuZ3RoLFxuICAgICAgICBpbmNsdXNpdmU6IHRydWUsXG4gICAgICAgIHR5cGU6IFwiYXJyYXlcIixcbiAgICAgIH0pO1xuICAgICAgc3RhdHVzLmRpcnR5KCk7XG4gICAgfVxuXG4gICAgY29uc3QgaXRlbXMgPSAoY3R4LmRhdGEgYXMgYW55W10pXG4gICAgICAubWFwKChpdGVtLCBpdGVtSW5kZXgpID0+IHtcbiAgICAgICAgY29uc3Qgc2NoZW1hID0gdGhpcy5fZGVmLml0ZW1zW2l0ZW1JbmRleF0gfHwgdGhpcy5fZGVmLnJlc3Q7XG4gICAgICAgIGlmICghc2NoZW1hKSByZXR1cm4gbnVsbCBhcyBhbnkgYXMgU3luY1BhcnNlUmV0dXJuVHlwZTxhbnk+O1xuICAgICAgICByZXR1cm4gc2NoZW1hLl9wYXJzZShcbiAgICAgICAgICBuZXcgUGFyc2VJbnB1dExhenlQYXRoKGN0eCwgaXRlbSwgY3R4LnBhdGgsIGl0ZW1JbmRleClcbiAgICAgICAgKTtcbiAgICAgIH0pXG4gICAgICAuZmlsdGVyKCh4KSA9PiAhIXgpOyAvLyBmaWx0ZXIgbnVsbHNcblxuICAgIGlmIChjdHguY29tbW9uLmFzeW5jKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5hbGwoaXRlbXMpLnRoZW4oKHJlc3VsdHMpID0+IHtcbiAgICAgICAgcmV0dXJuIFBhcnNlU3RhdHVzLm1lcmdlQXJyYXkoc3RhdHVzLCByZXN1bHRzKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUGFyc2VTdGF0dXMubWVyZ2VBcnJheShzdGF0dXMsIGl0ZW1zIGFzIFN5bmNQYXJzZVJldHVyblR5cGVbXSk7XG4gICAgfVxuICB9XG5cbiAgZ2V0IGl0ZW1zKCkge1xuICAgIHJldHVybiB0aGlzLl9kZWYuaXRlbXM7XG4gIH1cblxuICByZXN0PFJlc3QgZXh0ZW5kcyBab2RUeXBlQW55PihyZXN0OiBSZXN0KTogWm9kVHVwbGU8VCwgUmVzdD4ge1xuICAgIHJldHVybiBuZXcgWm9kVHVwbGUoe1xuICAgICAgLi4udGhpcy5fZGVmLFxuICAgICAgcmVzdCxcbiAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyBjcmVhdGUgPSA8VCBleHRlbmRzIFtab2RUeXBlQW55LCAuLi5ab2RUeXBlQW55W11dIHwgW10+KFxuICAgIHNjaGVtYXM6IFQsXG4gICAgcGFyYW1zPzogUmF3Q3JlYXRlUGFyYW1zXG4gICk6IFpvZFR1cGxlPFQsIG51bGw+ID0+IHtcbiAgICByZXR1cm4gbmV3IFpvZFR1cGxlKHtcbiAgICAgIGl0ZW1zOiBzY2hlbWFzLFxuICAgICAgdHlwZU5hbWU6IFpvZEZpcnN0UGFydHlUeXBlS2luZC5ab2RUdXBsZSxcbiAgICAgIHJlc3Q6IG51bGwsXG4gICAgICAuLi5wcm9jZXNzQ3JlYXRlUGFyYW1zKHBhcmFtcyksXG4gICAgfSk7XG4gIH07XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLy8vLy8vLyAgICAgICAgICAgICAgICAgICAgIC8vLy8vLy8vLy9cbi8vLy8vLy8vLy8gICAgICBab2RSZWNvcmQgICAgICAvLy8vLy8vLy8vXG4vLy8vLy8vLy8vICAgICAgICAgICAgICAgICAgICAgLy8vLy8vLy8vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5leHBvcnQgaW50ZXJmYWNlIFpvZFJlY29yZERlZjxcbiAgS2V5IGV4dGVuZHMgS2V5U2NoZW1hID0gWm9kU3RyaW5nLFxuICBWYWx1ZSBleHRlbmRzIFpvZFR5cGVBbnkgPSBab2RUeXBlQW55XG4+IGV4dGVuZHMgWm9kVHlwZURlZiB7XG4gIHZhbHVlVHlwZTogVmFsdWU7XG4gIGtleVR5cGU6IEtleTtcbiAgdHlwZU5hbWU6IFpvZEZpcnN0UGFydHlUeXBlS2luZC5ab2RSZWNvcmQ7XG59XG5cbnR5cGUgS2V5U2NoZW1hID0gWm9kVHlwZTxzdHJpbmcgfCBudW1iZXIgfCBzeW1ib2wsIGFueSwgYW55PjtcbnR5cGUgUmVjb3JkVHlwZTxLIGV4dGVuZHMgc3RyaW5nIHwgbnVtYmVyIHwgc3ltYm9sLCBWPiA9IFtzdHJpbmddIGV4dGVuZHMgW0tdXG4gID8gUmVjb3JkPEssIFY+XG4gIDogW251bWJlcl0gZXh0ZW5kcyBbS11cbiAgPyBSZWNvcmQ8SywgVj5cbiAgOiBbc3ltYm9sXSBleHRlbmRzIFtLXVxuICA/IFJlY29yZDxLLCBWPlxuICA6IFBhcnRpYWw8UmVjb3JkPEssIFY+PjtcbmV4cG9ydCBjbGFzcyBab2RSZWNvcmQ8XG4gIEtleSBleHRlbmRzIEtleVNjaGVtYSA9IFpvZFN0cmluZyxcbiAgVmFsdWUgZXh0ZW5kcyBab2RUeXBlQW55ID0gWm9kVHlwZUFueVxuPiBleHRlbmRzIFpvZFR5cGU8XG4gIFJlY29yZFR5cGU8S2V5W1wiX291dHB1dFwiXSwgVmFsdWVbXCJfb3V0cHV0XCJdPixcbiAgWm9kUmVjb3JkRGVmPEtleSwgVmFsdWU+LFxuICBSZWNvcmRUeXBlPEtleVtcIl9pbnB1dFwiXSwgVmFsdWVbXCJfaW5wdXRcIl0+XG4+IHtcbiAgZ2V0IGtleVNjaGVtYSgpIHtcbiAgICByZXR1cm4gdGhpcy5fZGVmLmtleVR5cGU7XG4gIH1cbiAgZ2V0IHZhbHVlU2NoZW1hKCkge1xuICAgIHJldHVybiB0aGlzLl9kZWYudmFsdWVUeXBlO1xuICB9XG4gIF9wYXJzZShpbnB1dDogUGFyc2VJbnB1dCk6IFBhcnNlUmV0dXJuVHlwZTx0aGlzW1wiX291dHB1dFwiXT4ge1xuICAgIGNvbnN0IHsgc3RhdHVzLCBjdHggfSA9IHRoaXMuX3Byb2Nlc3NJbnB1dFBhcmFtcyhpbnB1dCk7XG4gICAgaWYgKGN0eC5wYXJzZWRUeXBlICE9PSBab2RQYXJzZWRUeXBlLm9iamVjdCkge1xuICAgICAgYWRkSXNzdWVUb0NvbnRleHQoY3R4LCB7XG4gICAgICAgIGNvZGU6IFpvZElzc3VlQ29kZS5pbnZhbGlkX3R5cGUsXG4gICAgICAgIGV4cGVjdGVkOiBab2RQYXJzZWRUeXBlLm9iamVjdCxcbiAgICAgICAgcmVjZWl2ZWQ6IGN0eC5wYXJzZWRUeXBlLFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gSU5WQUxJRDtcbiAgICB9XG5cbiAgICBjb25zdCBwYWlyczoge1xuICAgICAga2V5OiBQYXJzZVJldHVyblR5cGU8YW55PjtcbiAgICAgIHZhbHVlOiBQYXJzZVJldHVyblR5cGU8YW55PjtcbiAgICB9W10gPSBbXTtcblxuICAgIGNvbnN0IGtleVR5cGUgPSB0aGlzLl9kZWYua2V5VHlwZTtcbiAgICBjb25zdCB2YWx1ZVR5cGUgPSB0aGlzLl9kZWYudmFsdWVUeXBlO1xuXG4gICAgZm9yIChjb25zdCBrZXkgaW4gY3R4LmRhdGEpIHtcbiAgICAgIHBhaXJzLnB1c2goe1xuICAgICAgICBrZXk6IGtleVR5cGUuX3BhcnNlKG5ldyBQYXJzZUlucHV0TGF6eVBhdGgoY3R4LCBrZXksIGN0eC5wYXRoLCBrZXkpKSxcbiAgICAgICAgdmFsdWU6IHZhbHVlVHlwZS5fcGFyc2UoXG4gICAgICAgICAgbmV3IFBhcnNlSW5wdXRMYXp5UGF0aChjdHgsIGN0eC5kYXRhW2tleV0sIGN0eC5wYXRoLCBrZXkpXG4gICAgICAgICksXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoY3R4LmNvbW1vbi5hc3luYykge1xuICAgICAgcmV0dXJuIFBhcnNlU3RhdHVzLm1lcmdlT2JqZWN0QXN5bmMoc3RhdHVzLCBwYWlycyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQYXJzZVN0YXR1cy5tZXJnZU9iamVjdFN5bmMoc3RhdHVzLCBwYWlycyBhcyBhbnkpO1xuICAgIH1cbiAgfVxuXG4gIGdldCBlbGVtZW50KCkge1xuICAgIHJldHVybiB0aGlzLl9kZWYudmFsdWVUeXBlO1xuICB9XG5cbiAgc3RhdGljIGNyZWF0ZTxWYWx1ZSBleHRlbmRzIFpvZFR5cGVBbnk+KFxuICAgIHZhbHVlVHlwZTogVmFsdWUsXG4gICAgcGFyYW1zPzogUmF3Q3JlYXRlUGFyYW1zXG4gICk6IFpvZFJlY29yZDxab2RTdHJpbmcsIFZhbHVlPjtcbiAgc3RhdGljIGNyZWF0ZTxLZXlzIGV4dGVuZHMgS2V5U2NoZW1hLCBWYWx1ZSBleHRlbmRzIFpvZFR5cGVBbnk+KFxuICAgIGtleVNjaGVtYTogS2V5cyxcbiAgICB2YWx1ZVR5cGU6IFZhbHVlLFxuICAgIHBhcmFtcz86IFJhd0NyZWF0ZVBhcmFtc1xuICApOiBab2RSZWNvcmQ8S2V5cywgVmFsdWU+O1xuICBzdGF0aWMgY3JlYXRlKGZpcnN0OiBhbnksIHNlY29uZD86IGFueSwgdGhpcmQ/OiBhbnkpOiBab2RSZWNvcmQ8YW55LCBhbnk+IHtcbiAgICBpZiAoc2Vjb25kIGluc3RhbmNlb2YgWm9kVHlwZSkge1xuICAgICAgcmV0dXJuIG5ldyBab2RSZWNvcmQoe1xuICAgICAgICBrZXlUeXBlOiBmaXJzdCxcbiAgICAgICAgdmFsdWVUeXBlOiBzZWNvbmQsXG4gICAgICAgIHR5cGVOYW1lOiBab2RGaXJzdFBhcnR5VHlwZUtpbmQuWm9kUmVjb3JkLFxuICAgICAgICAuLi5wcm9jZXNzQ3JlYXRlUGFyYW1zKHRoaXJkKSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgWm9kUmVjb3JkKHtcbiAgICAgIGtleVR5cGU6IFpvZFN0cmluZy5jcmVhdGUoKSxcbiAgICAgIHZhbHVlVHlwZTogZmlyc3QsXG4gICAgICB0eXBlTmFtZTogWm9kRmlyc3RQYXJ0eVR5cGVLaW5kLlpvZFJlY29yZCxcbiAgICAgIC4uLnByb2Nlc3NDcmVhdGVQYXJhbXMoc2Vjb25kKSxcbiAgICB9KTtcbiAgfVxufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8vLy8vLy8gICAgICAgICAgICAgICAgICAvLy8vLy8vLy8vXG4vLy8vLy8vLy8vICAgICAgWm9kTWFwICAgICAgLy8vLy8vLy8vL1xuLy8vLy8vLy8vLyAgICAgICAgICAgICAgICAgIC8vLy8vLy8vLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuZXhwb3J0IGludGVyZmFjZSBab2RNYXBEZWY8XG4gIEtleSBleHRlbmRzIFpvZFR5cGVBbnkgPSBab2RUeXBlQW55LFxuICBWYWx1ZSBleHRlbmRzIFpvZFR5cGVBbnkgPSBab2RUeXBlQW55XG4+IGV4dGVuZHMgWm9kVHlwZURlZiB7XG4gIHZhbHVlVHlwZTogVmFsdWU7XG4gIGtleVR5cGU6IEtleTtcbiAgdHlwZU5hbWU6IFpvZEZpcnN0UGFydHlUeXBlS2luZC5ab2RNYXA7XG59XG5cbmV4cG9ydCBjbGFzcyBab2RNYXA8XG4gIEtleSBleHRlbmRzIFpvZFR5cGVBbnkgPSBab2RUeXBlQW55LFxuICBWYWx1ZSBleHRlbmRzIFpvZFR5cGVBbnkgPSBab2RUeXBlQW55XG4+IGV4dGVuZHMgWm9kVHlwZTxcbiAgTWFwPEtleVtcIl9vdXRwdXRcIl0sIFZhbHVlW1wiX291dHB1dFwiXT4sXG4gIFpvZE1hcERlZjxLZXksIFZhbHVlPixcbiAgTWFwPEtleVtcIl9pbnB1dFwiXSwgVmFsdWVbXCJfaW5wdXRcIl0+XG4+IHtcbiAgX3BhcnNlKGlucHV0OiBQYXJzZUlucHV0KTogUGFyc2VSZXR1cm5UeXBlPHRoaXNbXCJfb3V0cHV0XCJdPiB7XG4gICAgY29uc3QgeyBzdGF0dXMsIGN0eCB9ID0gdGhpcy5fcHJvY2Vzc0lucHV0UGFyYW1zKGlucHV0KTtcbiAgICBpZiAoY3R4LnBhcnNlZFR5cGUgIT09IFpvZFBhcnNlZFR5cGUubWFwKSB7XG4gICAgICBhZGRJc3N1ZVRvQ29udGV4dChjdHgsIHtcbiAgICAgICAgY29kZTogWm9kSXNzdWVDb2RlLmludmFsaWRfdHlwZSxcbiAgICAgICAgZXhwZWN0ZWQ6IFpvZFBhcnNlZFR5cGUubWFwLFxuICAgICAgICByZWNlaXZlZDogY3R4LnBhcnNlZFR5cGUsXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBJTlZBTElEO1xuICAgIH1cblxuICAgIGNvbnN0IGtleVR5cGUgPSB0aGlzLl9kZWYua2V5VHlwZTtcbiAgICBjb25zdCB2YWx1ZVR5cGUgPSB0aGlzLl9kZWYudmFsdWVUeXBlO1xuXG4gICAgY29uc3QgcGFpcnMgPSBbLi4uKGN0eC5kYXRhIGFzIE1hcDx1bmtub3duLCB1bmtub3duPikuZW50cmllcygpXS5tYXAoXG4gICAgICAoW2tleSwgdmFsdWVdLCBpbmRleCkgPT4ge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGtleToga2V5VHlwZS5fcGFyc2UoXG4gICAgICAgICAgICBuZXcgUGFyc2VJbnB1dExhenlQYXRoKGN0eCwga2V5LCBjdHgucGF0aCwgW2luZGV4LCBcImtleVwiXSlcbiAgICAgICAgICApLFxuICAgICAgICAgIHZhbHVlOiB2YWx1ZVR5cGUuX3BhcnNlKFxuICAgICAgICAgICAgbmV3IFBhcnNlSW5wdXRMYXp5UGF0aChjdHgsIHZhbHVlLCBjdHgucGF0aCwgW2luZGV4LCBcInZhbHVlXCJdKVxuICAgICAgICAgICksXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgKTtcblxuICAgIGlmIChjdHguY29tbW9uLmFzeW5jKSB7XG4gICAgICBjb25zdCBmaW5hbE1hcCA9IG5ldyBNYXAoKTtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKGFzeW5jICgpID0+IHtcbiAgICAgICAgZm9yIChjb25zdCBwYWlyIG9mIHBhaXJzKSB7XG4gICAgICAgICAgY29uc3Qga2V5ID0gYXdhaXQgcGFpci5rZXk7XG4gICAgICAgICAgY29uc3QgdmFsdWUgPSBhd2FpdCBwYWlyLnZhbHVlO1xuICAgICAgICAgIGlmIChrZXkuc3RhdHVzID09PSBcImFib3J0ZWRcIiB8fCB2YWx1ZS5zdGF0dXMgPT09IFwiYWJvcnRlZFwiKSB7XG4gICAgICAgICAgICByZXR1cm4gSU5WQUxJRDtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGtleS5zdGF0dXMgPT09IFwiZGlydHlcIiB8fCB2YWx1ZS5zdGF0dXMgPT09IFwiZGlydHlcIikge1xuICAgICAgICAgICAgc3RhdHVzLmRpcnR5KCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZmluYWxNYXAuc2V0KGtleS52YWx1ZSwgdmFsdWUudmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7IHN0YXR1czogc3RhdHVzLnZhbHVlLCB2YWx1ZTogZmluYWxNYXAgfTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBmaW5hbE1hcCA9IG5ldyBNYXAoKTtcbiAgICAgIGZvciAoY29uc3QgcGFpciBvZiBwYWlycykge1xuICAgICAgICBjb25zdCBrZXkgPSBwYWlyLmtleSBhcyBTeW5jUGFyc2VSZXR1cm5UeXBlO1xuICAgICAgICBjb25zdCB2YWx1ZSA9IHBhaXIudmFsdWUgYXMgU3luY1BhcnNlUmV0dXJuVHlwZTtcbiAgICAgICAgaWYgKGtleS5zdGF0dXMgPT09IFwiYWJvcnRlZFwiIHx8IHZhbHVlLnN0YXR1cyA9PT0gXCJhYm9ydGVkXCIpIHtcbiAgICAgICAgICByZXR1cm4gSU5WQUxJRDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoa2V5LnN0YXR1cyA9PT0gXCJkaXJ0eVwiIHx8IHZhbHVlLnN0YXR1cyA9PT0gXCJkaXJ0eVwiKSB7XG4gICAgICAgICAgc3RhdHVzLmRpcnR5KCk7XG4gICAgICAgIH1cblxuICAgICAgICBmaW5hbE1hcC5zZXQoa2V5LnZhbHVlLCB2YWx1ZS52YWx1ZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4geyBzdGF0dXM6IHN0YXR1cy52YWx1ZSwgdmFsdWU6IGZpbmFsTWFwIH07XG4gICAgfVxuICB9XG4gIHN0YXRpYyBjcmVhdGUgPSA8XG4gICAgS2V5IGV4dGVuZHMgWm9kVHlwZUFueSA9IFpvZFR5cGVBbnksXG4gICAgVmFsdWUgZXh0ZW5kcyBab2RUeXBlQW55ID0gWm9kVHlwZUFueVxuICA+KFxuICAgIGtleVR5cGU6IEtleSxcbiAgICB2YWx1ZVR5cGU6IFZhbHVlLFxuICAgIHBhcmFtcz86IFJhd0NyZWF0ZVBhcmFtc1xuICApOiBab2RNYXA8S2V5LCBWYWx1ZT4gPT4ge1xuICAgIHJldHVybiBuZXcgWm9kTWFwKHtcbiAgICAgIHZhbHVlVHlwZSxcbiAgICAgIGtleVR5cGUsXG4gICAgICB0eXBlTmFtZTogWm9kRmlyc3RQYXJ0eVR5cGVLaW5kLlpvZE1hcCxcbiAgICAgIC4uLnByb2Nlc3NDcmVhdGVQYXJhbXMocGFyYW1zKSxcbiAgICB9KTtcbiAgfTtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vLy8vLy8vICAgICAgICAgICAgICAgICAgLy8vLy8vLy8vL1xuLy8vLy8vLy8vLyAgICAgIFpvZFNldCAgICAgIC8vLy8vLy8vLy9cbi8vLy8vLy8vLy8gICAgICAgICAgICAgICAgICAvLy8vLy8vLy8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbmV4cG9ydCBpbnRlcmZhY2UgWm9kU2V0RGVmPFZhbHVlIGV4dGVuZHMgWm9kVHlwZUFueSA9IFpvZFR5cGVBbnk+XG4gIGV4dGVuZHMgWm9kVHlwZURlZiB7XG4gIHZhbHVlVHlwZTogVmFsdWU7XG4gIHR5cGVOYW1lOiBab2RGaXJzdFBhcnR5VHlwZUtpbmQuWm9kU2V0O1xuICBtaW5TaXplOiB7IHZhbHVlOiBudW1iZXI7IG1lc3NhZ2U/OiBzdHJpbmcgfSB8IG51bGw7XG4gIG1heFNpemU6IHsgdmFsdWU6IG51bWJlcjsgbWVzc2FnZT86IHN0cmluZyB9IHwgbnVsbDtcbn1cblxuZXhwb3J0IGNsYXNzIFpvZFNldDxWYWx1ZSBleHRlbmRzIFpvZFR5cGVBbnkgPSBab2RUeXBlQW55PiBleHRlbmRzIFpvZFR5cGU8XG4gIFNldDxWYWx1ZVtcIl9vdXRwdXRcIl0+LFxuICBab2RTZXREZWY8VmFsdWU+LFxuICBTZXQ8VmFsdWVbXCJfaW5wdXRcIl0+XG4+IHtcbiAgX3BhcnNlKGlucHV0OiBQYXJzZUlucHV0KTogUGFyc2VSZXR1cm5UeXBlPHRoaXNbXCJfb3V0cHV0XCJdPiB7XG4gICAgY29uc3QgeyBzdGF0dXMsIGN0eCB9ID0gdGhpcy5fcHJvY2Vzc0lucHV0UGFyYW1zKGlucHV0KTtcbiAgICBpZiAoY3R4LnBhcnNlZFR5cGUgIT09IFpvZFBhcnNlZFR5cGUuc2V0KSB7XG4gICAgICBhZGRJc3N1ZVRvQ29udGV4dChjdHgsIHtcbiAgICAgICAgY29kZTogWm9kSXNzdWVDb2RlLmludmFsaWRfdHlwZSxcbiAgICAgICAgZXhwZWN0ZWQ6IFpvZFBhcnNlZFR5cGUuc2V0LFxuICAgICAgICByZWNlaXZlZDogY3R4LnBhcnNlZFR5cGUsXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBJTlZBTElEO1xuICAgIH1cblxuICAgIGNvbnN0IGRlZiA9IHRoaXMuX2RlZjtcblxuICAgIGlmIChkZWYubWluU2l6ZSAhPT0gbnVsbCkge1xuICAgICAgaWYgKGN0eC5kYXRhLnNpemUgPCBkZWYubWluU2l6ZS52YWx1ZSkge1xuICAgICAgICBhZGRJc3N1ZVRvQ29udGV4dChjdHgsIHtcbiAgICAgICAgICBjb2RlOiBab2RJc3N1ZUNvZGUudG9vX3NtYWxsLFxuICAgICAgICAgIG1pbmltdW06IGRlZi5taW5TaXplLnZhbHVlLFxuICAgICAgICAgIHR5cGU6IFwic2V0XCIsXG4gICAgICAgICAgaW5jbHVzaXZlOiB0cnVlLFxuICAgICAgICAgIG1lc3NhZ2U6IGRlZi5taW5TaXplLm1lc3NhZ2UsXG4gICAgICAgIH0pO1xuICAgICAgICBzdGF0dXMuZGlydHkoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZGVmLm1heFNpemUgIT09IG51bGwpIHtcbiAgICAgIGlmIChjdHguZGF0YS5zaXplID4gZGVmLm1heFNpemUudmFsdWUpIHtcbiAgICAgICAgYWRkSXNzdWVUb0NvbnRleHQoY3R4LCB7XG4gICAgICAgICAgY29kZTogWm9kSXNzdWVDb2RlLnRvb19iaWcsXG4gICAgICAgICAgbWF4aW11bTogZGVmLm1heFNpemUudmFsdWUsXG4gICAgICAgICAgdHlwZTogXCJzZXRcIixcbiAgICAgICAgICBpbmNsdXNpdmU6IHRydWUsXG4gICAgICAgICAgbWVzc2FnZTogZGVmLm1heFNpemUubWVzc2FnZSxcbiAgICAgICAgfSk7XG4gICAgICAgIHN0YXR1cy5kaXJ0eSgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHZhbHVlVHlwZSA9IHRoaXMuX2RlZi52YWx1ZVR5cGU7XG5cbiAgICBmdW5jdGlvbiBmaW5hbGl6ZVNldChlbGVtZW50czogU3luY1BhcnNlUmV0dXJuVHlwZTxhbnk+W10pIHtcbiAgICAgIGNvbnN0IHBhcnNlZFNldCA9IG5ldyBTZXQoKTtcbiAgICAgIGZvciAoY29uc3QgZWxlbWVudCBvZiBlbGVtZW50cykge1xuICAgICAgICBpZiAoZWxlbWVudC5zdGF0dXMgPT09IFwiYWJvcnRlZFwiKSByZXR1cm4gSU5WQUxJRDtcbiAgICAgICAgaWYgKGVsZW1lbnQuc3RhdHVzID09PSBcImRpcnR5XCIpIHN0YXR1cy5kaXJ0eSgpO1xuICAgICAgICBwYXJzZWRTZXQuYWRkKGVsZW1lbnQudmFsdWUpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHsgc3RhdHVzOiBzdGF0dXMudmFsdWUsIHZhbHVlOiBwYXJzZWRTZXQgfTtcbiAgICB9XG5cbiAgICBjb25zdCBlbGVtZW50cyA9IFsuLi4oY3R4LmRhdGEgYXMgU2V0PHVua25vd24+KS52YWx1ZXMoKV0ubWFwKChpdGVtLCBpKSA9PlxuICAgICAgdmFsdWVUeXBlLl9wYXJzZShuZXcgUGFyc2VJbnB1dExhenlQYXRoKGN0eCwgaXRlbSwgY3R4LnBhdGgsIGkpKVxuICAgICk7XG5cbiAgICBpZiAoY3R4LmNvbW1vbi5hc3luYykge1xuICAgICAgcmV0dXJuIFByb21pc2UuYWxsKGVsZW1lbnRzKS50aGVuKChlbGVtZW50cykgPT4gZmluYWxpemVTZXQoZWxlbWVudHMpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZpbmFsaXplU2V0KGVsZW1lbnRzIGFzIFN5bmNQYXJzZVJldHVyblR5cGVbXSk7XG4gICAgfVxuICB9XG5cbiAgbWluKG1pblNpemU6IG51bWJlciwgbWVzc2FnZT86IGVycm9yVXRpbC5FcnJNZXNzYWdlKTogdGhpcyB7XG4gICAgcmV0dXJuIG5ldyBab2RTZXQoe1xuICAgICAgLi4udGhpcy5fZGVmLFxuICAgICAgbWluU2l6ZTogeyB2YWx1ZTogbWluU2l6ZSwgbWVzc2FnZTogZXJyb3JVdGlsLnRvU3RyaW5nKG1lc3NhZ2UpIH0sXG4gICAgfSkgYXMgYW55O1xuICB9XG5cbiAgbWF4KG1heFNpemU6IG51bWJlciwgbWVzc2FnZT86IGVycm9yVXRpbC5FcnJNZXNzYWdlKTogdGhpcyB7XG4gICAgcmV0dXJuIG5ldyBab2RTZXQoe1xuICAgICAgLi4udGhpcy5fZGVmLFxuICAgICAgbWF4U2l6ZTogeyB2YWx1ZTogbWF4U2l6ZSwgbWVzc2FnZTogZXJyb3JVdGlsLnRvU3RyaW5nKG1lc3NhZ2UpIH0sXG4gICAgfSkgYXMgYW55O1xuICB9XG5cbiAgc2l6ZShzaXplOiBudW1iZXIsIG1lc3NhZ2U/OiBlcnJvclV0aWwuRXJyTWVzc2FnZSk6IHRoaXMge1xuICAgIHJldHVybiB0aGlzLm1pbihzaXplLCBtZXNzYWdlKS5tYXgoc2l6ZSwgbWVzc2FnZSkgYXMgYW55O1xuICB9XG5cbiAgbm9uZW1wdHkobWVzc2FnZT86IGVycm9yVXRpbC5FcnJNZXNzYWdlKTogWm9kU2V0PFZhbHVlPiB7XG4gICAgcmV0dXJuIHRoaXMubWluKDEsIG1lc3NhZ2UpIGFzIGFueTtcbiAgfVxuXG4gIHN0YXRpYyBjcmVhdGUgPSA8VmFsdWUgZXh0ZW5kcyBab2RUeXBlQW55ID0gWm9kVHlwZUFueT4oXG4gICAgdmFsdWVUeXBlOiBWYWx1ZSxcbiAgICBwYXJhbXM/OiBSYXdDcmVhdGVQYXJhbXNcbiAgKTogWm9kU2V0PFZhbHVlPiA9PiB7XG4gICAgcmV0dXJuIG5ldyBab2RTZXQoe1xuICAgICAgdmFsdWVUeXBlLFxuICAgICAgbWluU2l6ZTogbnVsbCxcbiAgICAgIG1heFNpemU6IG51bGwsXG4gICAgICB0eXBlTmFtZTogWm9kRmlyc3RQYXJ0eVR5cGVLaW5kLlpvZFNldCxcbiAgICAgIC4uLnByb2Nlc3NDcmVhdGVQYXJhbXMocGFyYW1zKSxcbiAgICB9KTtcbiAgfTtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLy8vLy8vLyAgICAgICAgICAgICAgICAgICAgICAgLy8vLy8vLy8vL1xuLy8vLy8vLy8vLyAgICAgIFpvZEZ1bmN0aW9uICAgICAgLy8vLy8vLy8vL1xuLy8vLy8vLy8vLyAgICAgICAgICAgICAgICAgICAgICAgLy8vLy8vLy8vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuZXhwb3J0IGludGVyZmFjZSBab2RGdW5jdGlvbkRlZjxcbiAgQXJncyBleHRlbmRzIFpvZFR1cGxlPGFueSwgYW55PiA9IFpvZFR1cGxlPGFueSwgYW55PixcbiAgUmV0dXJucyBleHRlbmRzIFpvZFR5cGVBbnkgPSBab2RUeXBlQW55XG4+IGV4dGVuZHMgWm9kVHlwZURlZiB7XG4gIGFyZ3M6IEFyZ3M7XG4gIHJldHVybnM6IFJldHVybnM7XG4gIHR5cGVOYW1lOiBab2RGaXJzdFBhcnR5VHlwZUtpbmQuWm9kRnVuY3Rpb247XG59XG5cbmV4cG9ydCB0eXBlIE91dGVyVHlwZU9mRnVuY3Rpb248XG4gIEFyZ3MgZXh0ZW5kcyBab2RUdXBsZTxhbnksIGFueT4sXG4gIFJldHVybnMgZXh0ZW5kcyBab2RUeXBlQW55XG4+ID0gQXJnc1tcIl9pbnB1dFwiXSBleHRlbmRzIEFycmF5PGFueT5cbiAgPyAoLi4uYXJnczogQXJnc1tcIl9pbnB1dFwiXSkgPT4gUmV0dXJuc1tcIl9vdXRwdXRcIl1cbiAgOiBuZXZlcjtcblxuZXhwb3J0IHR5cGUgSW5uZXJUeXBlT2ZGdW5jdGlvbjxcbiAgQXJncyBleHRlbmRzIFpvZFR1cGxlPGFueSwgYW55PixcbiAgUmV0dXJucyBleHRlbmRzIFpvZFR5cGVBbnlcbj4gPSBBcmdzW1wiX291dHB1dFwiXSBleHRlbmRzIEFycmF5PGFueT5cbiAgPyAoLi4uYXJnczogQXJnc1tcIl9vdXRwdXRcIl0pID0+IFJldHVybnNbXCJfaW5wdXRcIl1cbiAgOiBuZXZlcjtcblxuZXhwb3J0IGNsYXNzIFpvZEZ1bmN0aW9uPFxuICBBcmdzIGV4dGVuZHMgWm9kVHVwbGU8YW55LCBhbnk+LFxuICBSZXR1cm5zIGV4dGVuZHMgWm9kVHlwZUFueVxuPiBleHRlbmRzIFpvZFR5cGU8XG4gIE91dGVyVHlwZU9mRnVuY3Rpb248QXJncywgUmV0dXJucz4sXG4gIFpvZEZ1bmN0aW9uRGVmPEFyZ3MsIFJldHVybnM+LFxuICBJbm5lclR5cGVPZkZ1bmN0aW9uPEFyZ3MsIFJldHVybnM+XG4+IHtcbiAgX3BhcnNlKGlucHV0OiBQYXJzZUlucHV0KTogUGFyc2VSZXR1cm5UeXBlPGFueT4ge1xuICAgIGNvbnN0IHsgY3R4IH0gPSB0aGlzLl9wcm9jZXNzSW5wdXRQYXJhbXMoaW5wdXQpO1xuICAgIGlmIChjdHgucGFyc2VkVHlwZSAhPT0gWm9kUGFyc2VkVHlwZS5mdW5jdGlvbikge1xuICAgICAgYWRkSXNzdWVUb0NvbnRleHQoY3R4LCB7XG4gICAgICAgIGNvZGU6IFpvZElzc3VlQ29kZS5pbnZhbGlkX3R5cGUsXG4gICAgICAgIGV4cGVjdGVkOiBab2RQYXJzZWRUeXBlLmZ1bmN0aW9uLFxuICAgICAgICByZWNlaXZlZDogY3R4LnBhcnNlZFR5cGUsXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBJTlZBTElEO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1ha2VBcmdzSXNzdWUoYXJnczogYW55LCBlcnJvcjogWm9kRXJyb3IpOiBab2RJc3N1ZSB7XG4gICAgICByZXR1cm4gbWFrZUlzc3VlKHtcbiAgICAgICAgZGF0YTogYXJncyxcbiAgICAgICAgcGF0aDogY3R4LnBhdGgsXG4gICAgICAgIGVycm9yTWFwczogW1xuICAgICAgICAgIGN0eC5jb21tb24uY29udGV4dHVhbEVycm9yTWFwLFxuICAgICAgICAgIGN0eC5zY2hlbWFFcnJvck1hcCxcbiAgICAgICAgICBvdmVycmlkZUVycm9yTWFwLFxuICAgICAgICAgIGRlZmF1bHRFcnJvck1hcCxcbiAgICAgICAgXS5maWx0ZXIoKHgpID0+ICEheCkgYXMgWm9kRXJyb3JNYXBbXSxcbiAgICAgICAgaXNzdWVEYXRhOiB7XG4gICAgICAgICAgY29kZTogWm9kSXNzdWVDb2RlLmludmFsaWRfYXJndW1lbnRzLFxuICAgICAgICAgIGFyZ3VtZW50c0Vycm9yOiBlcnJvcixcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1ha2VSZXR1cm5zSXNzdWUocmV0dXJuczogYW55LCBlcnJvcjogWm9kRXJyb3IpOiBab2RJc3N1ZSB7XG4gICAgICByZXR1cm4gbWFrZUlzc3VlKHtcbiAgICAgICAgZGF0YTogcmV0dXJucyxcbiAgICAgICAgcGF0aDogY3R4LnBhdGgsXG4gICAgICAgIGVycm9yTWFwczogW1xuICAgICAgICAgIGN0eC5jb21tb24uY29udGV4dHVhbEVycm9yTWFwLFxuICAgICAgICAgIGN0eC5zY2hlbWFFcnJvck1hcCxcbiAgICAgICAgICBvdmVycmlkZUVycm9yTWFwLFxuICAgICAgICAgIGRlZmF1bHRFcnJvck1hcCxcbiAgICAgICAgXS5maWx0ZXIoKHgpID0+ICEheCkgYXMgWm9kRXJyb3JNYXBbXSxcbiAgICAgICAgaXNzdWVEYXRhOiB7XG4gICAgICAgICAgY29kZTogWm9kSXNzdWVDb2RlLmludmFsaWRfcmV0dXJuX3R5cGUsXG4gICAgICAgICAgcmV0dXJuVHlwZUVycm9yOiBlcnJvcixcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IHBhcmFtcyA9IHsgZXJyb3JNYXA6IGN0eC5jb21tb24uY29udGV4dHVhbEVycm9yTWFwIH07XG4gICAgY29uc3QgZm4gPSBjdHguZGF0YTtcblxuICAgIGlmICh0aGlzLl9kZWYucmV0dXJucyBpbnN0YW5jZW9mIFpvZFByb21pc2UpIHtcbiAgICAgIHJldHVybiBPSyhhc3luYyAoLi4uYXJnczogYW55W10pID0+IHtcbiAgICAgICAgY29uc3QgZXJyb3IgPSBuZXcgWm9kRXJyb3IoW10pO1xuICAgICAgICBjb25zdCBwYXJzZWRBcmdzID0gYXdhaXQgdGhpcy5fZGVmLmFyZ3NcbiAgICAgICAgICAucGFyc2VBc3luYyhhcmdzLCBwYXJhbXMpXG4gICAgICAgICAgLmNhdGNoKChlKSA9PiB7XG4gICAgICAgICAgICBlcnJvci5hZGRJc3N1ZShtYWtlQXJnc0lzc3VlKGFyZ3MsIGUpKTtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgIH0pO1xuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBmbiguLi4ocGFyc2VkQXJncyBhcyBhbnkpKTtcbiAgICAgICAgY29uc3QgcGFyc2VkUmV0dXJucyA9IGF3YWl0IChcbiAgICAgICAgICB0aGlzLl9kZWYucmV0dXJucyBhcyBab2RQcm9taXNlPFpvZFR5cGVBbnk+XG4gICAgICAgICkuX2RlZi50eXBlXG4gICAgICAgICAgLnBhcnNlQXN5bmMocmVzdWx0LCBwYXJhbXMpXG4gICAgICAgICAgLmNhdGNoKChlKSA9PiB7XG4gICAgICAgICAgICBlcnJvci5hZGRJc3N1ZShtYWtlUmV0dXJuc0lzc3VlKHJlc3VsdCwgZSkpO1xuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBwYXJzZWRSZXR1cm5zO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBPSygoLi4uYXJnczogYW55W10pID0+IHtcbiAgICAgICAgY29uc3QgcGFyc2VkQXJncyA9IHRoaXMuX2RlZi5hcmdzLnNhZmVQYXJzZShhcmdzLCBwYXJhbXMpO1xuICAgICAgICBpZiAoIXBhcnNlZEFyZ3Muc3VjY2Vzcykge1xuICAgICAgICAgIHRocm93IG5ldyBab2RFcnJvcihbbWFrZUFyZ3NJc3N1ZShhcmdzLCBwYXJzZWRBcmdzLmVycm9yKV0pO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGZuKC4uLihwYXJzZWRBcmdzLmRhdGEgYXMgYW55KSk7XG4gICAgICAgIGNvbnN0IHBhcnNlZFJldHVybnMgPSB0aGlzLl9kZWYucmV0dXJucy5zYWZlUGFyc2UocmVzdWx0LCBwYXJhbXMpO1xuICAgICAgICBpZiAoIXBhcnNlZFJldHVybnMuc3VjY2Vzcykge1xuICAgICAgICAgIHRocm93IG5ldyBab2RFcnJvcihbbWFrZVJldHVybnNJc3N1ZShyZXN1bHQsIHBhcnNlZFJldHVybnMuZXJyb3IpXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHBhcnNlZFJldHVybnMuZGF0YTtcbiAgICAgIH0pIGFzIGFueTtcbiAgICB9XG4gIH1cblxuICBwYXJhbWV0ZXJzKCkge1xuICAgIHJldHVybiB0aGlzLl9kZWYuYXJncztcbiAgfVxuXG4gIHJldHVyblR5cGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2RlZi5yZXR1cm5zO1xuICB9XG5cbiAgYXJnczxJdGVtcyBleHRlbmRzIFBhcmFtZXRlcnM8dHlwZW9mIFpvZFR1cGxlW1wiY3JlYXRlXCJdPlswXT4oXG4gICAgLi4uaXRlbXM6IEl0ZW1zXG4gICk6IFpvZEZ1bmN0aW9uPFpvZFR1cGxlPEl0ZW1zLCBab2RVbmtub3duPiwgUmV0dXJucz4ge1xuICAgIHJldHVybiBuZXcgWm9kRnVuY3Rpb24oe1xuICAgICAgLi4udGhpcy5fZGVmLFxuICAgICAgYXJnczogWm9kVHVwbGUuY3JlYXRlKGl0ZW1zKS5yZXN0KFpvZFVua25vd24uY3JlYXRlKCkpIGFzIGFueSxcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybnM8TmV3UmV0dXJuVHlwZSBleHRlbmRzIFpvZFR5cGU8YW55LCBhbnk+PihcbiAgICByZXR1cm5UeXBlOiBOZXdSZXR1cm5UeXBlXG4gICk6IFpvZEZ1bmN0aW9uPEFyZ3MsIE5ld1JldHVyblR5cGU+IHtcbiAgICByZXR1cm4gbmV3IFpvZEZ1bmN0aW9uKHtcbiAgICAgIC4uLnRoaXMuX2RlZixcbiAgICAgIHJldHVybnM6IHJldHVyblR5cGUsXG4gICAgfSk7XG4gIH1cblxuICBpbXBsZW1lbnQ8RiBleHRlbmRzIElubmVyVHlwZU9mRnVuY3Rpb248QXJncywgUmV0dXJucz4+KGZ1bmM6IEYpOiBGIHtcbiAgICBjb25zdCB2YWxpZGF0ZWRGdW5jID0gdGhpcy5wYXJzZShmdW5jKTtcbiAgICByZXR1cm4gdmFsaWRhdGVkRnVuYyBhcyBhbnk7XG4gIH1cblxuICBzdHJpY3RJbXBsZW1lbnQoXG4gICAgZnVuYzogSW5uZXJUeXBlT2ZGdW5jdGlvbjxBcmdzLCBSZXR1cm5zPlxuICApOiBJbm5lclR5cGVPZkZ1bmN0aW9uPEFyZ3MsIFJldHVybnM+IHtcbiAgICBjb25zdCB2YWxpZGF0ZWRGdW5jID0gdGhpcy5wYXJzZShmdW5jKTtcbiAgICByZXR1cm4gdmFsaWRhdGVkRnVuYyBhcyBhbnk7XG4gIH1cblxuICB2YWxpZGF0ZSA9IHRoaXMuaW1wbGVtZW50O1xuXG4gIHN0YXRpYyBjcmVhdGUgPSA8XG4gICAgVCBleHRlbmRzIFpvZFR1cGxlPGFueSwgYW55PiA9IFpvZFR1cGxlPFtdLCBab2RVbmtub3duPixcbiAgICBVIGV4dGVuZHMgWm9kVHlwZUFueSA9IFpvZFVua25vd25cbiAgPihcbiAgICBhcmdzPzogVCxcbiAgICByZXR1cm5zPzogVSxcbiAgICBwYXJhbXM/OiBSYXdDcmVhdGVQYXJhbXNcbiAgKTogWm9kRnVuY3Rpb248VCwgVT4gPT4ge1xuICAgIHJldHVybiBuZXcgWm9kRnVuY3Rpb24oe1xuICAgICAgYXJnczogKGFyZ3NcbiAgICAgICAgPyBhcmdzLnJlc3QoWm9kVW5rbm93bi5jcmVhdGUoKSlcbiAgICAgICAgOiBab2RUdXBsZS5jcmVhdGUoW10pLnJlc3QoWm9kVW5rbm93bi5jcmVhdGUoKSkpIGFzIGFueSxcbiAgICAgIHJldHVybnM6IHJldHVybnMgfHwgWm9kVW5rbm93bi5jcmVhdGUoKSxcbiAgICAgIHR5cGVOYW1lOiBab2RGaXJzdFBhcnR5VHlwZUtpbmQuWm9kRnVuY3Rpb24sXG4gICAgICAuLi5wcm9jZXNzQ3JlYXRlUGFyYW1zKHBhcmFtcyksXG4gICAgfSkgYXMgYW55O1xuICB9O1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLy8vLy8vLyAgICAgICAgICAgICAgICAgICAvLy8vLy8vLy8vXG4vLy8vLy8vLy8vICAgICAgWm9kTGF6eSAgICAgIC8vLy8vLy8vLy9cbi8vLy8vLy8vLy8gICAgICAgICAgICAgICAgICAgLy8vLy8vLy8vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbmV4cG9ydCBpbnRlcmZhY2UgWm9kTGF6eURlZjxUIGV4dGVuZHMgWm9kVHlwZUFueSA9IFpvZFR5cGVBbnk+XG4gIGV4dGVuZHMgWm9kVHlwZURlZiB7XG4gIGdldHRlcjogKCkgPT4gVDtcbiAgdHlwZU5hbWU6IFpvZEZpcnN0UGFydHlUeXBlS2luZC5ab2RMYXp5O1xufVxuXG5leHBvcnQgY2xhc3MgWm9kTGF6eTxUIGV4dGVuZHMgWm9kVHlwZUFueT4gZXh0ZW5kcyBab2RUeXBlPFxuICBvdXRwdXQ8VD4sXG4gIFpvZExhenlEZWY8VD4sXG4gIGlucHV0PFQ+XG4+IHtcbiAgZ2V0IHNjaGVtYSgpOiBUIHtcbiAgICByZXR1cm4gdGhpcy5fZGVmLmdldHRlcigpO1xuICB9XG5cbiAgX3BhcnNlKGlucHV0OiBQYXJzZUlucHV0KTogUGFyc2VSZXR1cm5UeXBlPHRoaXNbXCJfb3V0cHV0XCJdPiB7XG4gICAgY29uc3QgeyBjdHggfSA9IHRoaXMuX3Byb2Nlc3NJbnB1dFBhcmFtcyhpbnB1dCk7XG4gICAgY29uc3QgbGF6eVNjaGVtYSA9IHRoaXMuX2RlZi5nZXR0ZXIoKTtcbiAgICByZXR1cm4gbGF6eVNjaGVtYS5fcGFyc2UoeyBkYXRhOiBjdHguZGF0YSwgcGF0aDogY3R4LnBhdGgsIHBhcmVudDogY3R4IH0pO1xuICB9XG5cbiAgc3RhdGljIGNyZWF0ZSA9IDxUIGV4dGVuZHMgWm9kVHlwZUFueT4oXG4gICAgZ2V0dGVyOiAoKSA9PiBULFxuICAgIHBhcmFtcz86IFJhd0NyZWF0ZVBhcmFtc1xuICApOiBab2RMYXp5PFQ+ID0+IHtcbiAgICByZXR1cm4gbmV3IFpvZExhenkoe1xuICAgICAgZ2V0dGVyOiBnZXR0ZXIsXG4gICAgICB0eXBlTmFtZTogWm9kRmlyc3RQYXJ0eVR5cGVLaW5kLlpvZExhenksXG4gICAgICAuLi5wcm9jZXNzQ3JlYXRlUGFyYW1zKHBhcmFtcyksXG4gICAgfSk7XG4gIH07XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vLy8vLy8vICAgICAgICAgICAgICAgICAgICAgIC8vLy8vLy8vLy9cbi8vLy8vLy8vLy8gICAgICBab2RMaXRlcmFsICAgICAgLy8vLy8vLy8vL1xuLy8vLy8vLy8vLyAgICAgICAgICAgICAgICAgICAgICAvLy8vLy8vLy8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuZXhwb3J0IGludGVyZmFjZSBab2RMaXRlcmFsRGVmPFQgPSBhbnk+IGV4dGVuZHMgWm9kVHlwZURlZiB7XG4gIHZhbHVlOiBUO1xuICB0eXBlTmFtZTogWm9kRmlyc3RQYXJ0eVR5cGVLaW5kLlpvZExpdGVyYWw7XG59XG5cbmV4cG9ydCBjbGFzcyBab2RMaXRlcmFsPFQ+IGV4dGVuZHMgWm9kVHlwZTxULCBab2RMaXRlcmFsRGVmPFQ+PiB7XG4gIF9wYXJzZShpbnB1dDogUGFyc2VJbnB1dCk6IFBhcnNlUmV0dXJuVHlwZTx0aGlzW1wiX291dHB1dFwiXT4ge1xuICAgIGlmIChpbnB1dC5kYXRhICE9PSB0aGlzLl9kZWYudmFsdWUpIHtcbiAgICAgIGNvbnN0IGN0eCA9IHRoaXMuX2dldE9yUmV0dXJuQ3R4KGlucHV0KTtcbiAgICAgIGFkZElzc3VlVG9Db250ZXh0KGN0eCwge1xuICAgICAgICBjb2RlOiBab2RJc3N1ZUNvZGUuaW52YWxpZF9saXRlcmFsLFxuICAgICAgICBleHBlY3RlZDogdGhpcy5fZGVmLnZhbHVlLFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gSU5WQUxJRDtcbiAgICB9XG4gICAgcmV0dXJuIHsgc3RhdHVzOiBcInZhbGlkXCIsIHZhbHVlOiBpbnB1dC5kYXRhIH07XG4gIH1cblxuICBnZXQgdmFsdWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2RlZi52YWx1ZTtcbiAgfVxuXG4gIHN0YXRpYyBjcmVhdGUgPSA8VCBleHRlbmRzIFByaW1pdGl2ZT4oXG4gICAgdmFsdWU6IFQsXG4gICAgcGFyYW1zPzogUmF3Q3JlYXRlUGFyYW1zXG4gICk6IFpvZExpdGVyYWw8VD4gPT4ge1xuICAgIHJldHVybiBuZXcgWm9kTGl0ZXJhbCh7XG4gICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICB0eXBlTmFtZTogWm9kRmlyc3RQYXJ0eVR5cGVLaW5kLlpvZExpdGVyYWwsXG4gICAgICAuLi5wcm9jZXNzQ3JlYXRlUGFyYW1zKHBhcmFtcyksXG4gICAgfSk7XG4gIH07XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vLy8vLy8vICAgICAgICAgICAgICAgICAgIC8vLy8vLy8vLy9cbi8vLy8vLy8vLy8gICAgICBab2RFbnVtICAgICAgLy8vLy8vLy8vL1xuLy8vLy8vLy8vLyAgICAgICAgICAgICAgICAgICAvLy8vLy8vLy8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuZXhwb3J0IHR5cGUgQXJyYXlLZXlzID0ga2V5b2YgYW55W107XG5leHBvcnQgdHlwZSBJbmRpY2VzPFQ+ID0gRXhjbHVkZTxrZXlvZiBULCBBcnJheUtleXM+O1xuXG50eXBlIEVudW1WYWx1ZXMgPSBbc3RyaW5nLCAuLi5zdHJpbmdbXV07XG5cbnR5cGUgVmFsdWVzPFQgZXh0ZW5kcyBFbnVtVmFsdWVzPiA9IHtcbiAgW2sgaW4gVFtudW1iZXJdXTogaztcbn07XG5cbmV4cG9ydCBpbnRlcmZhY2UgWm9kRW51bURlZjxUIGV4dGVuZHMgRW51bVZhbHVlcyA9IEVudW1WYWx1ZXM+XG4gIGV4dGVuZHMgWm9kVHlwZURlZiB7XG4gIHZhbHVlczogVDtcbiAgdHlwZU5hbWU6IFpvZEZpcnN0UGFydHlUeXBlS2luZC5ab2RFbnVtO1xufVxuXG50eXBlIFdyaXRlYWJsZTxUPiA9IHsgLXJlYWRvbmx5IFtQIGluIGtleW9mIFRdOiBUW1BdIH07XG5cbmZ1bmN0aW9uIGNyZWF0ZVpvZEVudW08VSBleHRlbmRzIHN0cmluZywgVCBleHRlbmRzIFJlYWRvbmx5PFtVLCAuLi5VW11dPj4oXG4gIHZhbHVlczogVFxuKTogWm9kRW51bTxXcml0ZWFibGU8VD4+O1xuZnVuY3Rpb24gY3JlYXRlWm9kRW51bTxVIGV4dGVuZHMgc3RyaW5nLCBUIGV4dGVuZHMgW1UsIC4uLlVbXV0+KFxuICB2YWx1ZXM6IFRcbik6IFpvZEVudW08VD47XG5mdW5jdGlvbiBjcmVhdGVab2RFbnVtKHZhbHVlczogYW55KSB7XG4gIHJldHVybiBuZXcgWm9kRW51bSh7XG4gICAgdmFsdWVzOiB2YWx1ZXMgYXMgYW55LFxuICAgIHR5cGVOYW1lOiBab2RGaXJzdFBhcnR5VHlwZUtpbmQuWm9kRW51bSxcbiAgfSkgYXMgYW55O1xufVxuXG5leHBvcnQgY2xhc3MgWm9kRW51bTxUIGV4dGVuZHMgW3N0cmluZywgLi4uc3RyaW5nW11dPiBleHRlbmRzIFpvZFR5cGU8XG4gIFRbbnVtYmVyXSxcbiAgWm9kRW51bURlZjxUPlxuPiB7XG4gIF9wYXJzZShpbnB1dDogUGFyc2VJbnB1dCk6IFBhcnNlUmV0dXJuVHlwZTx0aGlzW1wiX291dHB1dFwiXT4ge1xuICAgIGlmICh0aGlzLl9kZWYudmFsdWVzLmluZGV4T2YoaW5wdXQuZGF0YSkgPT09IC0xKSB7XG4gICAgICBjb25zdCBjdHggPSB0aGlzLl9nZXRPclJldHVybkN0eChpbnB1dCk7XG4gICAgICBhZGRJc3N1ZVRvQ29udGV4dChjdHgsIHtcbiAgICAgICAgY29kZTogWm9kSXNzdWVDb2RlLmludmFsaWRfZW51bV92YWx1ZSxcbiAgICAgICAgb3B0aW9uczogdGhpcy5fZGVmLnZhbHVlcyxcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIElOVkFMSUQ7XG4gICAgfVxuICAgIHJldHVybiBPSyhpbnB1dC5kYXRhKTtcbiAgfVxuXG4gIGdldCBvcHRpb25zKCkge1xuICAgIHJldHVybiB0aGlzLl9kZWYudmFsdWVzO1xuICB9XG5cbiAgZ2V0IGVudW0oKTogVmFsdWVzPFQ+IHtcbiAgICBjb25zdCBlbnVtVmFsdWVzOiBhbnkgPSB7fTtcbiAgICBmb3IgKGNvbnN0IHZhbCBvZiB0aGlzLl9kZWYudmFsdWVzKSB7XG4gICAgICBlbnVtVmFsdWVzW3ZhbF0gPSB2YWw7XG4gICAgfVxuICAgIHJldHVybiBlbnVtVmFsdWVzIGFzIGFueTtcbiAgfVxuXG4gIGdldCBWYWx1ZXMoKTogVmFsdWVzPFQ+IHtcbiAgICBjb25zdCBlbnVtVmFsdWVzOiBhbnkgPSB7fTtcbiAgICBmb3IgKGNvbnN0IHZhbCBvZiB0aGlzLl9kZWYudmFsdWVzKSB7XG4gICAgICBlbnVtVmFsdWVzW3ZhbF0gPSB2YWw7XG4gICAgfVxuICAgIHJldHVybiBlbnVtVmFsdWVzIGFzIGFueTtcbiAgfVxuXG4gIGdldCBFbnVtKCk6IFZhbHVlczxUPiB7XG4gICAgY29uc3QgZW51bVZhbHVlczogYW55ID0ge307XG4gICAgZm9yIChjb25zdCB2YWwgb2YgdGhpcy5fZGVmLnZhbHVlcykge1xuICAgICAgZW51bVZhbHVlc1t2YWxdID0gdmFsO1xuICAgIH1cbiAgICByZXR1cm4gZW51bVZhbHVlcyBhcyBhbnk7XG4gIH1cblxuICBzdGF0aWMgY3JlYXRlID0gY3JlYXRlWm9kRW51bTtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8vLy8vLy8gICAgICAgICAgICAgICAgICAgICAgICAgLy8vLy8vLy8vL1xuLy8vLy8vLy8vLyAgICAgIFpvZE5hdGl2ZUVudW0gICAgICAvLy8vLy8vLy8vXG4vLy8vLy8vLy8vICAgICAgICAgICAgICAgICAgICAgICAgIC8vLy8vLy8vLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5leHBvcnQgaW50ZXJmYWNlIFpvZE5hdGl2ZUVudW1EZWY8VCBleHRlbmRzIEVudW1MaWtlID0gRW51bUxpa2U+XG4gIGV4dGVuZHMgWm9kVHlwZURlZiB7XG4gIHZhbHVlczogVDtcbiAgdHlwZU5hbWU6IFpvZEZpcnN0UGFydHlUeXBlS2luZC5ab2ROYXRpdmVFbnVtO1xufVxuXG50eXBlIEVudW1MaWtlID0geyBbazogc3RyaW5nXTogc3RyaW5nIHwgbnVtYmVyOyBbbnU6IG51bWJlcl06IHN0cmluZyB9O1xuXG5leHBvcnQgY2xhc3MgWm9kTmF0aXZlRW51bTxUIGV4dGVuZHMgRW51bUxpa2U+IGV4dGVuZHMgWm9kVHlwZTxcbiAgVFtrZXlvZiBUXSxcbiAgWm9kTmF0aXZlRW51bURlZjxUPlxuPiB7XG4gIF9wYXJzZShpbnB1dDogUGFyc2VJbnB1dCk6IFBhcnNlUmV0dXJuVHlwZTxUW2tleW9mIFRdPiB7XG4gICAgY29uc3QgbmF0aXZlRW51bVZhbHVlcyA9IHV0aWwuZ2V0VmFsaWRFbnVtVmFsdWVzKHRoaXMuX2RlZi52YWx1ZXMpO1xuICAgIGlmIChuYXRpdmVFbnVtVmFsdWVzLmluZGV4T2YoaW5wdXQuZGF0YSkgPT09IC0xKSB7XG4gICAgICBjb25zdCBjdHggPSB0aGlzLl9nZXRPclJldHVybkN0eChpbnB1dCk7XG4gICAgICBhZGRJc3N1ZVRvQ29udGV4dChjdHgsIHtcbiAgICAgICAgY29kZTogWm9kSXNzdWVDb2RlLmludmFsaWRfZW51bV92YWx1ZSxcbiAgICAgICAgb3B0aW9uczogdXRpbC5vYmplY3RWYWx1ZXMobmF0aXZlRW51bVZhbHVlcyksXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBJTlZBTElEO1xuICAgIH1cbiAgICByZXR1cm4gT0soaW5wdXQuZGF0YSk7XG4gIH1cblxuICBnZXQgZW51bSgpIHtcbiAgICByZXR1cm4gdGhpcy5fZGVmLnZhbHVlcztcbiAgfVxuXG4gIHN0YXRpYyBjcmVhdGUgPSA8VCBleHRlbmRzIEVudW1MaWtlPihcbiAgICB2YWx1ZXM6IFQsXG4gICAgcGFyYW1zPzogUmF3Q3JlYXRlUGFyYW1zXG4gICk6IFpvZE5hdGl2ZUVudW08VD4gPT4ge1xuICAgIHJldHVybiBuZXcgWm9kTmF0aXZlRW51bSh7XG4gICAgICB2YWx1ZXM6IHZhbHVlcyxcbiAgICAgIHR5cGVOYW1lOiBab2RGaXJzdFBhcnR5VHlwZUtpbmQuWm9kTmF0aXZlRW51bSxcbiAgICAgIC4uLnByb2Nlc3NDcmVhdGVQYXJhbXMocGFyYW1zKSxcbiAgICB9KTtcbiAgfTtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8vLy8vLy8gICAgICAgICAgICAgICAgICAgICAgLy8vLy8vLy8vL1xuLy8vLy8vLy8vLyAgICAgIFpvZFByb21pc2UgICAgICAvLy8vLy8vLy8vXG4vLy8vLy8vLy8vICAgICAgICAgICAgICAgICAgICAgIC8vLy8vLy8vLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5leHBvcnQgaW50ZXJmYWNlIFpvZFByb21pc2VEZWY8VCBleHRlbmRzIFpvZFR5cGVBbnkgPSBab2RUeXBlQW55PlxuICBleHRlbmRzIFpvZFR5cGVEZWYge1xuICB0eXBlOiBUO1xuICB0eXBlTmFtZTogWm9kRmlyc3RQYXJ0eVR5cGVLaW5kLlpvZFByb21pc2U7XG59XG5cbmV4cG9ydCBjbGFzcyBab2RQcm9taXNlPFQgZXh0ZW5kcyBab2RUeXBlQW55PiBleHRlbmRzIFpvZFR5cGU8XG4gIFByb21pc2U8VFtcIl9vdXRwdXRcIl0+LFxuICBab2RQcm9taXNlRGVmPFQ+LFxuICBQcm9taXNlPFRbXCJfaW5wdXRcIl0+XG4+IHtcbiAgX3BhcnNlKGlucHV0OiBQYXJzZUlucHV0KTogUGFyc2VSZXR1cm5UeXBlPHRoaXNbXCJfb3V0cHV0XCJdPiB7XG4gICAgY29uc3QgeyBjdHggfSA9IHRoaXMuX3Byb2Nlc3NJbnB1dFBhcmFtcyhpbnB1dCk7XG4gICAgaWYgKFxuICAgICAgY3R4LnBhcnNlZFR5cGUgIT09IFpvZFBhcnNlZFR5cGUucHJvbWlzZSAmJlxuICAgICAgY3R4LmNvbW1vbi5hc3luYyA9PT0gZmFsc2VcbiAgICApIHtcbiAgICAgIGFkZElzc3VlVG9Db250ZXh0KGN0eCwge1xuICAgICAgICBjb2RlOiBab2RJc3N1ZUNvZGUuaW52YWxpZF90eXBlLFxuICAgICAgICBleHBlY3RlZDogWm9kUGFyc2VkVHlwZS5wcm9taXNlLFxuICAgICAgICByZWNlaXZlZDogY3R4LnBhcnNlZFR5cGUsXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBJTlZBTElEO1xuICAgIH1cblxuICAgIGNvbnN0IHByb21pc2lmaWVkID1cbiAgICAgIGN0eC5wYXJzZWRUeXBlID09PSBab2RQYXJzZWRUeXBlLnByb21pc2VcbiAgICAgICAgPyBjdHguZGF0YVxuICAgICAgICA6IFByb21pc2UucmVzb2x2ZShjdHguZGF0YSk7XG5cbiAgICByZXR1cm4gT0soXG4gICAgICBwcm9taXNpZmllZC50aGVuKChkYXRhOiBhbnkpID0+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2RlZi50eXBlLnBhcnNlQXN5bmMoZGF0YSwge1xuICAgICAgICAgIHBhdGg6IGN0eC5wYXRoLFxuICAgICAgICAgIGVycm9yTWFwOiBjdHguY29tbW9uLmNvbnRleHR1YWxFcnJvck1hcCxcbiAgICAgICAgfSk7XG4gICAgICB9KVxuICAgICk7XG4gIH1cblxuICBzdGF0aWMgY3JlYXRlID0gPFQgZXh0ZW5kcyBab2RUeXBlQW55PihcbiAgICBzY2hlbWE6IFQsXG4gICAgcGFyYW1zPzogUmF3Q3JlYXRlUGFyYW1zXG4gICk6IFpvZFByb21pc2U8VD4gPT4ge1xuICAgIHJldHVybiBuZXcgWm9kUHJvbWlzZSh7XG4gICAgICB0eXBlOiBzY2hlbWEsXG4gICAgICB0eXBlTmFtZTogWm9kRmlyc3RQYXJ0eVR5cGVLaW5kLlpvZFByb21pc2UsXG4gICAgICAuLi5wcm9jZXNzQ3JlYXRlUGFyYW1zKHBhcmFtcyksXG4gICAgfSk7XG4gIH07XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8vLy8vLy8gICAgICAgICAgICAgICAgICAgICAgICAgIC8vLy8vLy8vLy9cbi8vLy8vLy8vLy8gICAgICAgIFpvZEVmZmVjdHMgICAgICAgIC8vLy8vLy8vLy9cbi8vLy8vLy8vLy8gICAgICAgICAgICAgICAgICAgICAgICAgIC8vLy8vLy8vLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuZXhwb3J0IHR5cGUgUmVmaW5lbWVudDxUPiA9IChhcmc6IFQsIGN0eDogUmVmaW5lbWVudEN0eCkgPT4gYW55O1xuZXhwb3J0IHR5cGUgU3VwZXJSZWZpbmVtZW50PFQ+ID0gKGFyZzogVCwgY3R4OiBSZWZpbmVtZW50Q3R4KSA9PiB2b2lkO1xuXG5leHBvcnQgdHlwZSBSZWZpbmVtZW50RWZmZWN0PFQ+ID0ge1xuICB0eXBlOiBcInJlZmluZW1lbnRcIjtcbiAgcmVmaW5lbWVudDogKGFyZzogVCwgY3R4OiBSZWZpbmVtZW50Q3R4KSA9PiBhbnk7XG59O1xuZXhwb3J0IHR5cGUgVHJhbnNmb3JtRWZmZWN0PFQ+ID0ge1xuICB0eXBlOiBcInRyYW5zZm9ybVwiO1xuICB0cmFuc2Zvcm06IChhcmc6IFQpID0+IGFueTtcbn07XG5leHBvcnQgdHlwZSBQcmVwcm9jZXNzRWZmZWN0PFQ+ID0ge1xuICB0eXBlOiBcInByZXByb2Nlc3NcIjtcbiAgdHJhbnNmb3JtOiAoYXJnOiBUKSA9PiBhbnk7XG59O1xuZXhwb3J0IHR5cGUgRWZmZWN0PFQ+ID1cbiAgfCBSZWZpbmVtZW50RWZmZWN0PFQ+XG4gIHwgVHJhbnNmb3JtRWZmZWN0PFQ+XG4gIHwgUHJlcHJvY2Vzc0VmZmVjdDxUPjtcblxuZXhwb3J0IGludGVyZmFjZSBab2RFZmZlY3RzRGVmPFQgZXh0ZW5kcyBab2RUeXBlQW55ID0gWm9kVHlwZUFueT5cbiAgZXh0ZW5kcyBab2RUeXBlRGVmIHtcbiAgc2NoZW1hOiBUO1xuICB0eXBlTmFtZTogWm9kRmlyc3RQYXJ0eVR5cGVLaW5kLlpvZEVmZmVjdHM7XG4gIGVmZmVjdDogRWZmZWN0PGFueT47XG59XG5cbmV4cG9ydCBjbGFzcyBab2RFZmZlY3RzPFxuICBUIGV4dGVuZHMgWm9kVHlwZUFueSxcbiAgT3V0cHV0ID0gVFtcIl9vdXRwdXRcIl0sXG4gIElucHV0ID0gVFtcIl9pbnB1dFwiXVxuPiBleHRlbmRzIFpvZFR5cGU8T3V0cHV0LCBab2RFZmZlY3RzRGVmPFQ+LCBJbnB1dD4ge1xuICBpbm5lclR5cGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2RlZi5zY2hlbWE7XG4gIH1cblxuICBfcGFyc2UoaW5wdXQ6IFBhcnNlSW5wdXQpOiBQYXJzZVJldHVyblR5cGU8dGhpc1tcIl9vdXRwdXRcIl0+IHtcbiAgICBjb25zdCB7IHN0YXR1cywgY3R4IH0gPSB0aGlzLl9wcm9jZXNzSW5wdXRQYXJhbXMoaW5wdXQpO1xuXG4gICAgY29uc3QgZWZmZWN0ID0gdGhpcy5fZGVmLmVmZmVjdCB8fCBudWxsO1xuXG4gICAgaWYgKGVmZmVjdC50eXBlID09PSBcInByZXByb2Nlc3NcIikge1xuICAgICAgY29uc3QgcHJvY2Vzc2VkID0gZWZmZWN0LnRyYW5zZm9ybShjdHguZGF0YSk7XG5cbiAgICAgIGlmIChjdHguY29tbW9uLmFzeW5jKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUocHJvY2Vzc2VkKS50aGVuKChwcm9jZXNzZWQpID0+IHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5fZGVmLnNjaGVtYS5fcGFyc2VBc3luYyh7XG4gICAgICAgICAgICBkYXRhOiBwcm9jZXNzZWQsXG4gICAgICAgICAgICBwYXRoOiBjdHgucGF0aCxcbiAgICAgICAgICAgIHBhcmVudDogY3R4LFxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9kZWYuc2NoZW1hLl9wYXJzZVN5bmMoe1xuICAgICAgICAgIGRhdGE6IHByb2Nlc3NlZCxcbiAgICAgICAgICBwYXRoOiBjdHgucGF0aCxcbiAgICAgICAgICBwYXJlbnQ6IGN0eCxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGVmZmVjdC50eXBlID09PSBcInJlZmluZW1lbnRcIikge1xuICAgICAgY29uc3QgY2hlY2tDdHg6IFJlZmluZW1lbnRDdHggPSB7XG4gICAgICAgIGFkZElzc3VlOiAoYXJnOiBJc3N1ZURhdGEpID0+IHtcbiAgICAgICAgICBhZGRJc3N1ZVRvQ29udGV4dChjdHgsIGFyZyk7XG4gICAgICAgICAgaWYgKGFyZy5mYXRhbCkge1xuICAgICAgICAgICAgc3RhdHVzLmFib3J0KCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN0YXR1cy5kaXJ0eSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgZ2V0IHBhdGgoKSB7XG4gICAgICAgICAgcmV0dXJuIGN0eC5wYXRoO1xuICAgICAgICB9LFxuICAgICAgfTtcblxuICAgICAgY2hlY2tDdHguYWRkSXNzdWUgPSBjaGVja0N0eC5hZGRJc3N1ZS5iaW5kKGNoZWNrQ3R4KTtcblxuICAgICAgY29uc3QgZXhlY3V0ZVJlZmluZW1lbnQgPSAoXG4gICAgICAgIGFjYzogdW5rbm93blxuICAgICAgICAvLyBlZmZlY3Q6IFJlZmluZW1lbnRFZmZlY3Q8YW55PlxuICAgICAgKTogYW55ID0+IHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gZWZmZWN0LnJlZmluZW1lbnQoYWNjLCBjaGVja0N0eCk7XG4gICAgICAgIGlmIChjdHguY29tbW9uLmFzeW5jKSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShyZXN1bHQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZXN1bHQgaW5zdGFuY2VvZiBQcm9taXNlKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgXCJBc3luYyByZWZpbmVtZW50IGVuY291bnRlcmVkIGR1cmluZyBzeW5jaHJvbm91cyBwYXJzZSBvcGVyYXRpb24uIFVzZSAucGFyc2VBc3luYyBpbnN0ZWFkLlwiXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgfTtcblxuICAgICAgaWYgKGN0eC5jb21tb24uYXN5bmMgPT09IGZhbHNlKSB7XG4gICAgICAgIGNvbnN0IGlubmVyID0gdGhpcy5fZGVmLnNjaGVtYS5fcGFyc2VTeW5jKHtcbiAgICAgICAgICBkYXRhOiBjdHguZGF0YSxcbiAgICAgICAgICBwYXRoOiBjdHgucGF0aCxcbiAgICAgICAgICBwYXJlbnQ6IGN0eCxcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChpbm5lci5zdGF0dXMgPT09IFwiYWJvcnRlZFwiKSByZXR1cm4gSU5WQUxJRDtcbiAgICAgICAgaWYgKGlubmVyLnN0YXR1cyA9PT0gXCJkaXJ0eVwiKSBzdGF0dXMuZGlydHkoKTtcblxuICAgICAgICAvLyByZXR1cm4gdmFsdWUgaXMgaWdub3JlZFxuICAgICAgICBleGVjdXRlUmVmaW5lbWVudChpbm5lci52YWx1ZSk7XG4gICAgICAgIHJldHVybiB7IHN0YXR1czogc3RhdHVzLnZhbHVlLCB2YWx1ZTogaW5uZXIudmFsdWUgfTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9kZWYuc2NoZW1hXG4gICAgICAgICAgLl9wYXJzZUFzeW5jKHsgZGF0YTogY3R4LmRhdGEsIHBhdGg6IGN0eC5wYXRoLCBwYXJlbnQ6IGN0eCB9KVxuICAgICAgICAgIC50aGVuKChpbm5lcikgPT4ge1xuICAgICAgICAgICAgaWYgKGlubmVyLnN0YXR1cyA9PT0gXCJhYm9ydGVkXCIpIHJldHVybiBJTlZBTElEO1xuICAgICAgICAgICAgaWYgKGlubmVyLnN0YXR1cyA9PT0gXCJkaXJ0eVwiKSBzdGF0dXMuZGlydHkoKTtcblxuICAgICAgICAgICAgcmV0dXJuIGV4ZWN1dGVSZWZpbmVtZW50KGlubmVyLnZhbHVlKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgcmV0dXJuIHsgc3RhdHVzOiBzdGF0dXMudmFsdWUsIHZhbHVlOiBpbm5lci52YWx1ZSB9O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGVmZmVjdC50eXBlID09PSBcInRyYW5zZm9ybVwiKSB7XG4gICAgICBpZiAoY3R4LmNvbW1vbi5hc3luYyA9PT0gZmFsc2UpIHtcbiAgICAgICAgY29uc3QgYmFzZSA9IHRoaXMuX2RlZi5zY2hlbWEuX3BhcnNlU3luYyh7XG4gICAgICAgICAgZGF0YTogY3R4LmRhdGEsXG4gICAgICAgICAgcGF0aDogY3R4LnBhdGgsXG4gICAgICAgICAgcGFyZW50OiBjdHgsXG4gICAgICAgIH0pO1xuICAgICAgICAvLyBpZiAoYmFzZS5zdGF0dXMgPT09IFwiYWJvcnRlZFwiKSByZXR1cm4gSU5WQUxJRDtcbiAgICAgICAgLy8gaWYgKGJhc2Uuc3RhdHVzID09PSBcImRpcnR5XCIpIHtcbiAgICAgICAgLy8gICByZXR1cm4geyBzdGF0dXM6IFwiZGlydHlcIiwgdmFsdWU6IGJhc2UudmFsdWUgfTtcbiAgICAgICAgLy8gfVxuICAgICAgICBpZiAoIWlzVmFsaWQoYmFzZSkpIHJldHVybiBiYXNlO1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGVmZmVjdC50cmFuc2Zvcm0oYmFzZS52YWx1ZSk7XG4gICAgICAgIGlmIChyZXN1bHQgaW5zdGFuY2VvZiBQcm9taXNlKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgYEFzeW5jaHJvbm91cyB0cmFuc2Zvcm0gZW5jb3VudGVyZWQgZHVyaW5nIHN5bmNocm9ub3VzIHBhcnNlIG9wZXJhdGlvbi4gVXNlIC5wYXJzZUFzeW5jIGluc3RlYWQuYFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIE9LKHJlc3VsdCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy5fZGVmLnNjaGVtYVxuICAgICAgICAgIC5fcGFyc2VBc3luYyh7IGRhdGE6IGN0eC5kYXRhLCBwYXRoOiBjdHgucGF0aCwgcGFyZW50OiBjdHggfSlcbiAgICAgICAgICAudGhlbigoYmFzZSkgPT4ge1xuICAgICAgICAgICAgaWYgKCFpc1ZhbGlkKGJhc2UpKSByZXR1cm4gYmFzZTtcbiAgICAgICAgICAgIC8vIGlmIChiYXNlLnN0YXR1cyA9PT0gXCJhYm9ydGVkXCIpIHJldHVybiBJTlZBTElEO1xuICAgICAgICAgICAgLy8gaWYgKGJhc2Uuc3RhdHVzID09PSBcImRpcnR5XCIpIHtcbiAgICAgICAgICAgIC8vICAgcmV0dXJuIHsgc3RhdHVzOiBcImRpcnR5XCIsIHZhbHVlOiBiYXNlLnZhbHVlIH07XG4gICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGVmZmVjdC50cmFuc2Zvcm0oYmFzZS52YWx1ZSkpLnRoZW4oT0spO1xuICAgICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHV0aWwuYXNzZXJ0TmV2ZXIoZWZmZWN0KTtcbiAgfVxuXG4gIHN0YXRpYyBjcmVhdGUgPSA8SSBleHRlbmRzIFpvZFR5cGVBbnk+KFxuICAgIHNjaGVtYTogSSxcbiAgICBlZmZlY3Q6IEVmZmVjdDxJW1wiX291dHB1dFwiXT4sXG4gICAgcGFyYW1zPzogUmF3Q3JlYXRlUGFyYW1zXG4gICk6IFpvZEVmZmVjdHM8SSwgSVtcIl9vdXRwdXRcIl0+ID0+IHtcbiAgICByZXR1cm4gbmV3IFpvZEVmZmVjdHMoe1xuICAgICAgc2NoZW1hLFxuICAgICAgdHlwZU5hbWU6IFpvZEZpcnN0UGFydHlUeXBlS2luZC5ab2RFZmZlY3RzLFxuICAgICAgZWZmZWN0LFxuICAgICAgLi4ucHJvY2Vzc0NyZWF0ZVBhcmFtcyhwYXJhbXMpLFxuICAgIH0pO1xuICB9O1xuXG4gIHN0YXRpYyBjcmVhdGVXaXRoUHJlcHJvY2VzcyA9IDxJIGV4dGVuZHMgWm9kVHlwZUFueT4oXG4gICAgcHJlcHJvY2VzczogKGFyZzogdW5rbm93bikgPT4gdW5rbm93bixcbiAgICBzY2hlbWE6IEksXG4gICAgcGFyYW1zPzogUmF3Q3JlYXRlUGFyYW1zXG4gICk6IFpvZEVmZmVjdHM8SSwgSVtcIl9vdXRwdXRcIl0+ID0+IHtcbiAgICByZXR1cm4gbmV3IFpvZEVmZmVjdHMoe1xuICAgICAgc2NoZW1hLFxuICAgICAgZWZmZWN0OiB7IHR5cGU6IFwicHJlcHJvY2Vzc1wiLCB0cmFuc2Zvcm06IHByZXByb2Nlc3MgfSxcbiAgICAgIHR5cGVOYW1lOiBab2RGaXJzdFBhcnR5VHlwZUtpbmQuWm9kRWZmZWN0cyxcbiAgICAgIC4uLnByb2Nlc3NDcmVhdGVQYXJhbXMocGFyYW1zKSxcbiAgICB9KTtcbiAgfTtcbn1cblxuZXhwb3J0IHsgWm9kRWZmZWN0cyBhcyBab2RUcmFuc2Zvcm1lciB9O1xuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vLy8vLy8vICAgICAgICAgICAgICAgICAgICAgICAvLy8vLy8vLy8vXG4vLy8vLy8vLy8vICAgICAgWm9kT3B0aW9uYWwgICAgICAvLy8vLy8vLy8vXG4vLy8vLy8vLy8vICAgICAgICAgICAgICAgICAgICAgICAvLy8vLy8vLy8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5leHBvcnQgaW50ZXJmYWNlIFpvZE9wdGlvbmFsRGVmPFQgZXh0ZW5kcyBab2RUeXBlQW55ID0gWm9kVHlwZUFueT5cbiAgZXh0ZW5kcyBab2RUeXBlRGVmIHtcbiAgaW5uZXJUeXBlOiBUO1xuICB0eXBlTmFtZTogWm9kRmlyc3RQYXJ0eVR5cGVLaW5kLlpvZE9wdGlvbmFsO1xufVxuXG5leHBvcnQgdHlwZSBab2RPcHRpb25hbFR5cGU8VCBleHRlbmRzIFpvZFR5cGVBbnk+ID0gWm9kT3B0aW9uYWw8VD47XG5cbmV4cG9ydCBjbGFzcyBab2RPcHRpb25hbDxUIGV4dGVuZHMgWm9kVHlwZUFueT4gZXh0ZW5kcyBab2RUeXBlPFxuICBUW1wiX291dHB1dFwiXSB8IHVuZGVmaW5lZCxcbiAgWm9kT3B0aW9uYWxEZWY8VD4sXG4gIFRbXCJfaW5wdXRcIl0gfCB1bmRlZmluZWRcbj4ge1xuICBfcGFyc2UoaW5wdXQ6IFBhcnNlSW5wdXQpOiBQYXJzZVJldHVyblR5cGU8dGhpc1tcIl9vdXRwdXRcIl0+IHtcbiAgICBjb25zdCBwYXJzZWRUeXBlID0gdGhpcy5fZ2V0VHlwZShpbnB1dCk7XG4gICAgaWYgKHBhcnNlZFR5cGUgPT09IFpvZFBhcnNlZFR5cGUudW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gT0sodW5kZWZpbmVkKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX2RlZi5pbm5lclR5cGUuX3BhcnNlKGlucHV0KTtcbiAgfVxuXG4gIHVud3JhcCgpIHtcbiAgICByZXR1cm4gdGhpcy5fZGVmLmlubmVyVHlwZTtcbiAgfVxuXG4gIHN0YXRpYyBjcmVhdGUgPSA8VCBleHRlbmRzIFpvZFR5cGVBbnk+KFxuICAgIHR5cGU6IFQsXG4gICAgcGFyYW1zPzogUmF3Q3JlYXRlUGFyYW1zXG4gICk6IFpvZE9wdGlvbmFsPFQ+ID0+IHtcbiAgICByZXR1cm4gbmV3IFpvZE9wdGlvbmFsKHtcbiAgICAgIGlubmVyVHlwZTogdHlwZSxcbiAgICAgIHR5cGVOYW1lOiBab2RGaXJzdFBhcnR5VHlwZUtpbmQuWm9kT3B0aW9uYWwsXG4gICAgICAuLi5wcm9jZXNzQ3JlYXRlUGFyYW1zKHBhcmFtcyksXG4gICAgfSkgYXMgYW55O1xuICB9O1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vLy8vLy8vICAgICAgICAgICAgICAgICAgICAgICAvLy8vLy8vLy8vXG4vLy8vLy8vLy8vICAgICAgWm9kTnVsbGFibGUgICAgICAvLy8vLy8vLy8vXG4vLy8vLy8vLy8vICAgICAgICAgICAgICAgICAgICAgICAvLy8vLy8vLy8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5leHBvcnQgaW50ZXJmYWNlIFpvZE51bGxhYmxlRGVmPFQgZXh0ZW5kcyBab2RUeXBlQW55ID0gWm9kVHlwZUFueT5cbiAgZXh0ZW5kcyBab2RUeXBlRGVmIHtcbiAgaW5uZXJUeXBlOiBUO1xuICB0eXBlTmFtZTogWm9kRmlyc3RQYXJ0eVR5cGVLaW5kLlpvZE51bGxhYmxlO1xufVxuXG5leHBvcnQgdHlwZSBab2ROdWxsYWJsZVR5cGU8VCBleHRlbmRzIFpvZFR5cGVBbnk+ID0gWm9kTnVsbGFibGU8VD47XG5cbmV4cG9ydCBjbGFzcyBab2ROdWxsYWJsZTxUIGV4dGVuZHMgWm9kVHlwZUFueT4gZXh0ZW5kcyBab2RUeXBlPFxuICBUW1wiX291dHB1dFwiXSB8IG51bGwsXG4gIFpvZE51bGxhYmxlRGVmPFQ+LFxuICBUW1wiX2lucHV0XCJdIHwgbnVsbFxuPiB7XG4gIF9wYXJzZShpbnB1dDogUGFyc2VJbnB1dCk6IFBhcnNlUmV0dXJuVHlwZTx0aGlzW1wiX291dHB1dFwiXT4ge1xuICAgIGNvbnN0IHBhcnNlZFR5cGUgPSB0aGlzLl9nZXRUeXBlKGlucHV0KTtcbiAgICBpZiAocGFyc2VkVHlwZSA9PT0gWm9kUGFyc2VkVHlwZS5udWxsKSB7XG4gICAgICByZXR1cm4gT0sobnVsbCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9kZWYuaW5uZXJUeXBlLl9wYXJzZShpbnB1dCk7XG4gIH1cblxuICB1bndyYXAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2RlZi5pbm5lclR5cGU7XG4gIH1cblxuICBzdGF0aWMgY3JlYXRlID0gPFQgZXh0ZW5kcyBab2RUeXBlQW55PihcbiAgICB0eXBlOiBULFxuICAgIHBhcmFtcz86IFJhd0NyZWF0ZVBhcmFtc1xuICApOiBab2ROdWxsYWJsZTxUPiA9PiB7XG4gICAgcmV0dXJuIG5ldyBab2ROdWxsYWJsZSh7XG4gICAgICBpbm5lclR5cGU6IHR5cGUsXG4gICAgICB0eXBlTmFtZTogWm9kRmlyc3RQYXJ0eVR5cGVLaW5kLlpvZE51bGxhYmxlLFxuICAgICAgLi4ucHJvY2Vzc0NyZWF0ZVBhcmFtcyhwYXJhbXMpLFxuICAgIH0pIGFzIGFueTtcbiAgfTtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vLy8vLy8vICAgICAgICAgICAgICAgICAgICAgICAgLy8vLy8vLy8vL1xuLy8vLy8vLy8vLyAgICAgICBab2REZWZhdWx0ICAgICAgIC8vLy8vLy8vLy9cbi8vLy8vLy8vLy8gICAgICAgICAgICAgICAgICAgICAgICAvLy8vLy8vLy8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbmV4cG9ydCBpbnRlcmZhY2UgWm9kRGVmYXVsdERlZjxUIGV4dGVuZHMgWm9kVHlwZUFueSA9IFpvZFR5cGVBbnk+XG4gIGV4dGVuZHMgWm9kVHlwZURlZiB7XG4gIGlubmVyVHlwZTogVDtcbiAgZGVmYXVsdFZhbHVlOiAoKSA9PiB1dGlsLm5vVW5kZWZpbmVkPFRbXCJfaW5wdXRcIl0+O1xuICB0eXBlTmFtZTogWm9kRmlyc3RQYXJ0eVR5cGVLaW5kLlpvZERlZmF1bHQ7XG59XG5cbmV4cG9ydCBjbGFzcyBab2REZWZhdWx0PFQgZXh0ZW5kcyBab2RUeXBlQW55PiBleHRlbmRzIFpvZFR5cGU8XG4gIHV0aWwubm9VbmRlZmluZWQ8VFtcIl9vdXRwdXRcIl0+LFxuICBab2REZWZhdWx0RGVmPFQ+LFxuICBUW1wiX2lucHV0XCJdIHwgdW5kZWZpbmVkXG4+IHtcbiAgX3BhcnNlKGlucHV0OiBQYXJzZUlucHV0KTogUGFyc2VSZXR1cm5UeXBlPHRoaXNbXCJfb3V0cHV0XCJdPiB7XG4gICAgY29uc3QgeyBjdHggfSA9IHRoaXMuX3Byb2Nlc3NJbnB1dFBhcmFtcyhpbnB1dCk7XG4gICAgbGV0IGRhdGEgPSBjdHguZGF0YTtcbiAgICBpZiAoY3R4LnBhcnNlZFR5cGUgPT09IFpvZFBhcnNlZFR5cGUudW5kZWZpbmVkKSB7XG4gICAgICBkYXRhID0gdGhpcy5fZGVmLmRlZmF1bHRWYWx1ZSgpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fZGVmLmlubmVyVHlwZS5fcGFyc2Uoe1xuICAgICAgZGF0YSxcbiAgICAgIHBhdGg6IGN0eC5wYXRoLFxuICAgICAgcGFyZW50OiBjdHgsXG4gICAgfSk7XG4gIH1cblxuICByZW1vdmVEZWZhdWx0KCkge1xuICAgIHJldHVybiB0aGlzLl9kZWYuaW5uZXJUeXBlO1xuICB9XG5cbiAgc3RhdGljIGNyZWF0ZSA9IDxUIGV4dGVuZHMgWm9kVHlwZUFueT4oXG4gICAgdHlwZTogVCxcbiAgICBwYXJhbXM/OiBSYXdDcmVhdGVQYXJhbXNcbiAgKTogWm9kT3B0aW9uYWw8VD4gPT4ge1xuICAgIHJldHVybiBuZXcgWm9kT3B0aW9uYWwoe1xuICAgICAgaW5uZXJUeXBlOiB0eXBlLFxuICAgICAgdHlwZU5hbWU6IFpvZEZpcnN0UGFydHlUeXBlS2luZC5ab2RPcHRpb25hbCxcbiAgICAgIC4uLnByb2Nlc3NDcmVhdGVQYXJhbXMocGFyYW1zKSxcbiAgICB9KSBhcyBhbnk7XG4gIH07XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLy8vLy8vLyAgICAgICAgICAgICAgICAgICAgIC8vLy8vLy8vLy9cbi8vLy8vLy8vLy8gICAgICBab2ROYU4gICAgICAgICAvLy8vLy8vLy8vXG4vLy8vLy8vLy8vICAgICAgICAgICAgICAgICAgICAgLy8vLy8vLy8vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmV4cG9ydCBpbnRlcmZhY2UgWm9kTmFORGVmIGV4dGVuZHMgWm9kVHlwZURlZiB7XG4gIHR5cGVOYW1lOiBab2RGaXJzdFBhcnR5VHlwZUtpbmQuWm9kTmFOO1xufVxuXG5leHBvcnQgY2xhc3MgWm9kTmFOIGV4dGVuZHMgWm9kVHlwZTxudW1iZXIsIFpvZE5hTkRlZj4ge1xuICBfcGFyc2UoaW5wdXQ6IFBhcnNlSW5wdXQpOiBQYXJzZVJldHVyblR5cGU8YW55PiB7XG4gICAgY29uc3QgcGFyc2VkVHlwZSA9IHRoaXMuX2dldFR5cGUoaW5wdXQpO1xuICAgIGlmIChwYXJzZWRUeXBlICE9PSBab2RQYXJzZWRUeXBlLm5hbikge1xuICAgICAgY29uc3QgY3R4ID0gdGhpcy5fZ2V0T3JSZXR1cm5DdHgoaW5wdXQpO1xuICAgICAgYWRkSXNzdWVUb0NvbnRleHQoY3R4LCB7XG4gICAgICAgIGNvZGU6IFpvZElzc3VlQ29kZS5pbnZhbGlkX3R5cGUsXG4gICAgICAgIGV4cGVjdGVkOiBab2RQYXJzZWRUeXBlLm5hbixcbiAgICAgICAgcmVjZWl2ZWQ6IGN0eC5wYXJzZWRUeXBlLFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gSU5WQUxJRDtcbiAgICB9XG5cbiAgICByZXR1cm4geyBzdGF0dXM6IFwidmFsaWRcIiwgdmFsdWU6IGlucHV0LmRhdGEgfTtcbiAgfVxuXG4gIHN0YXRpYyBjcmVhdGUgPSAocGFyYW1zPzogUmF3Q3JlYXRlUGFyYW1zKTogWm9kTmFOID0+IHtcbiAgICByZXR1cm4gbmV3IFpvZE5hTih7XG4gICAgICB0eXBlTmFtZTogWm9kRmlyc3RQYXJ0eVR5cGVLaW5kLlpvZE5hTixcbiAgICAgIC4uLnByb2Nlc3NDcmVhdGVQYXJhbXMocGFyYW1zKSxcbiAgICB9KTtcbiAgfTtcbn1cblxuZXhwb3J0IGNvbnN0IGN1c3RvbSA9IDxUPihcbiAgY2hlY2s/OiAoZGF0YTogdW5rbm93bikgPT4gYW55LFxuICBwYXJhbXM/OiBQYXJhbWV0ZXJzPFpvZFR5cGVBbnlbXCJyZWZpbmVcIl0+WzFdXG4pOiBab2RUeXBlPFQ+ID0+IHtcbiAgaWYgKGNoZWNrKSByZXR1cm4gWm9kQW55LmNyZWF0ZSgpLnJlZmluZShjaGVjaywgcGFyYW1zKTtcbiAgcmV0dXJuIFpvZEFueS5jcmVhdGUoKTtcbn07XG5cbmV4cG9ydCB7IFpvZFR5cGUgYXMgU2NoZW1hLCBab2RUeXBlIGFzIFpvZFNjaGVtYSB9O1xuXG5leHBvcnQgY29uc3QgbGF0ZSA9IHtcbiAgb2JqZWN0OiBab2RPYmplY3QubGF6eWNyZWF0ZSxcbn07XG5cbmV4cG9ydCBlbnVtIFpvZEZpcnN0UGFydHlUeXBlS2luZCB7XG4gIFpvZFN0cmluZyA9IFwiWm9kU3RyaW5nXCIsXG4gIFpvZE51bWJlciA9IFwiWm9kTnVtYmVyXCIsXG4gIFpvZE5hTiA9IFwiWm9kTmFOXCIsXG4gIFpvZEJpZ0ludCA9IFwiWm9kQmlnSW50XCIsXG4gIFpvZEJvb2xlYW4gPSBcIlpvZEJvb2xlYW5cIixcbiAgWm9kRGF0ZSA9IFwiWm9kRGF0ZVwiLFxuICBab2RVbmRlZmluZWQgPSBcIlpvZFVuZGVmaW5lZFwiLFxuICBab2ROdWxsID0gXCJab2ROdWxsXCIsXG4gIFpvZEFueSA9IFwiWm9kQW55XCIsXG4gIFpvZFVua25vd24gPSBcIlpvZFVua25vd25cIixcbiAgWm9kTmV2ZXIgPSBcIlpvZE5ldmVyXCIsXG4gIFpvZFZvaWQgPSBcIlpvZFZvaWRcIixcbiAgWm9kQXJyYXkgPSBcIlpvZEFycmF5XCIsXG4gIFpvZE9iamVjdCA9IFwiWm9kT2JqZWN0XCIsXG4gIFpvZFVuaW9uID0gXCJab2RVbmlvblwiLFxuICBab2REaXNjcmltaW5hdGVkVW5pb24gPSBcIlpvZERpc2NyaW1pbmF0ZWRVbmlvblwiLFxuICBab2RJbnRlcnNlY3Rpb24gPSBcIlpvZEludGVyc2VjdGlvblwiLFxuICBab2RUdXBsZSA9IFwiWm9kVHVwbGVcIixcbiAgWm9kUmVjb3JkID0gXCJab2RSZWNvcmRcIixcbiAgWm9kTWFwID0gXCJab2RNYXBcIixcbiAgWm9kU2V0ID0gXCJab2RTZXRcIixcbiAgWm9kRnVuY3Rpb24gPSBcIlpvZEZ1bmN0aW9uXCIsXG4gIFpvZExhenkgPSBcIlpvZExhenlcIixcbiAgWm9kTGl0ZXJhbCA9IFwiWm9kTGl0ZXJhbFwiLFxuICBab2RFbnVtID0gXCJab2RFbnVtXCIsXG4gIFpvZEVmZmVjdHMgPSBcIlpvZEVmZmVjdHNcIixcbiAgWm9kTmF0aXZlRW51bSA9IFwiWm9kTmF0aXZlRW51bVwiLFxuICBab2RPcHRpb25hbCA9IFwiWm9kT3B0aW9uYWxcIixcbiAgWm9kTnVsbGFibGUgPSBcIlpvZE51bGxhYmxlXCIsXG4gIFpvZERlZmF1bHQgPSBcIlpvZERlZmF1bHRcIixcbiAgWm9kUHJvbWlzZSA9IFwiWm9kUHJvbWlzZVwiLFxufVxuZXhwb3J0IHR5cGUgWm9kRmlyc3RQYXJ0eVNjaGVtYVR5cGVzID1cbiAgfCBab2RTdHJpbmdcbiAgfCBab2ROdW1iZXJcbiAgfCBab2ROYU5cbiAgfCBab2RCaWdJbnRcbiAgfCBab2RCb29sZWFuXG4gIHwgWm9kRGF0ZVxuICB8IFpvZFVuZGVmaW5lZFxuICB8IFpvZE51bGxcbiAgfCBab2RBbnlcbiAgfCBab2RVbmtub3duXG4gIHwgWm9kTmV2ZXJcbiAgfCBab2RWb2lkXG4gIHwgWm9kQXJyYXk8YW55LCBhbnk+XG4gIHwgWm9kT2JqZWN0PGFueSwgYW55LCBhbnksIGFueSwgYW55PlxuICB8IFpvZFVuaW9uPGFueT5cbiAgfCBab2REaXNjcmltaW5hdGVkVW5pb248YW55LCBhbnksIGFueT5cbiAgfCBab2RJbnRlcnNlY3Rpb248YW55LCBhbnk+XG4gIHwgWm9kVHVwbGU8YW55LCBhbnk+XG4gIHwgWm9kUmVjb3JkPGFueSwgYW55PlxuICB8IFpvZE1hcDxhbnk+XG4gIHwgWm9kU2V0PGFueT5cbiAgfCBab2RGdW5jdGlvbjxhbnksIGFueT5cbiAgfCBab2RMYXp5PGFueT5cbiAgfCBab2RMaXRlcmFsPGFueT5cbiAgfCBab2RFbnVtPGFueT5cbiAgfCBab2RFZmZlY3RzPGFueSwgYW55LCBhbnk+XG4gIHwgWm9kTmF0aXZlRW51bTxhbnk+XG4gIHwgWm9kT3B0aW9uYWw8YW55PlxuICB8IFpvZE51bGxhYmxlPGFueT5cbiAgfCBab2REZWZhdWx0PGFueT5cbiAgfCBab2RQcm9taXNlPGFueT47XG5cbmNvbnN0IGluc3RhbmNlT2ZUeXBlID0gPFQgZXh0ZW5kcyBuZXcgKC4uLmFyZ3M6IGFueVtdKSA9PiBhbnk+KFxuICBjbHM6IFQsXG4gIHBhcmFtczogUGFyYW1ldGVyczxab2RUeXBlQW55W1wicmVmaW5lXCJdPlsxXSA9IHtcbiAgICBtZXNzYWdlOiBgSW5wdXQgbm90IGluc3RhbmNlIG9mICR7Y2xzLm5hbWV9YCxcbiAgfVxuKSA9PiBjdXN0b208SW5zdGFuY2VUeXBlPFQ+PigoZGF0YSkgPT4gZGF0YSBpbnN0YW5jZW9mIGNscywgcGFyYW1zKTtcblxuY29uc3Qgc3RyaW5nVHlwZSA9IFpvZFN0cmluZy5jcmVhdGU7XG5jb25zdCBudW1iZXJUeXBlID0gWm9kTnVtYmVyLmNyZWF0ZTtcbmNvbnN0IG5hblR5cGUgPSBab2ROYU4uY3JlYXRlO1xuY29uc3QgYmlnSW50VHlwZSA9IFpvZEJpZ0ludC5jcmVhdGU7XG5jb25zdCBib29sZWFuVHlwZSA9IFpvZEJvb2xlYW4uY3JlYXRlO1xuY29uc3QgZGF0ZVR5cGUgPSBab2REYXRlLmNyZWF0ZTtcbmNvbnN0IHVuZGVmaW5lZFR5cGUgPSBab2RVbmRlZmluZWQuY3JlYXRlO1xuY29uc3QgbnVsbFR5cGUgPSBab2ROdWxsLmNyZWF0ZTtcbmNvbnN0IGFueVR5cGUgPSBab2RBbnkuY3JlYXRlO1xuY29uc3QgdW5rbm93blR5cGUgPSBab2RVbmtub3duLmNyZWF0ZTtcbmNvbnN0IG5ldmVyVHlwZSA9IFpvZE5ldmVyLmNyZWF0ZTtcbmNvbnN0IHZvaWRUeXBlID0gWm9kVm9pZC5jcmVhdGU7XG5jb25zdCBhcnJheVR5cGUgPSBab2RBcnJheS5jcmVhdGU7XG5jb25zdCBvYmplY3RUeXBlID0gWm9kT2JqZWN0LmNyZWF0ZTtcbmNvbnN0IHN0cmljdE9iamVjdFR5cGUgPSBab2RPYmplY3Quc3RyaWN0Q3JlYXRlO1xuY29uc3QgdW5pb25UeXBlID0gWm9kVW5pb24uY3JlYXRlO1xuY29uc3QgZGlzY3JpbWluYXRlZFVuaW9uVHlwZSA9IFpvZERpc2NyaW1pbmF0ZWRVbmlvbi5jcmVhdGU7XG5jb25zdCBpbnRlcnNlY3Rpb25UeXBlID0gWm9kSW50ZXJzZWN0aW9uLmNyZWF0ZTtcbmNvbnN0IHR1cGxlVHlwZSA9IFpvZFR1cGxlLmNyZWF0ZTtcbmNvbnN0IHJlY29yZFR5cGUgPSBab2RSZWNvcmQuY3JlYXRlO1xuY29uc3QgbWFwVHlwZSA9IFpvZE1hcC5jcmVhdGU7XG5jb25zdCBzZXRUeXBlID0gWm9kU2V0LmNyZWF0ZTtcbmNvbnN0IGZ1bmN0aW9uVHlwZSA9IFpvZEZ1bmN0aW9uLmNyZWF0ZTtcbmNvbnN0IGxhenlUeXBlID0gWm9kTGF6eS5jcmVhdGU7XG5jb25zdCBsaXRlcmFsVHlwZSA9IFpvZExpdGVyYWwuY3JlYXRlO1xuY29uc3QgZW51bVR5cGUgPSBab2RFbnVtLmNyZWF0ZTtcbmNvbnN0IG5hdGl2ZUVudW1UeXBlID0gWm9kTmF0aXZlRW51bS5jcmVhdGU7XG5jb25zdCBwcm9taXNlVHlwZSA9IFpvZFByb21pc2UuY3JlYXRlO1xuY29uc3QgZWZmZWN0c1R5cGUgPSBab2RFZmZlY3RzLmNyZWF0ZTtcbmNvbnN0IG9wdGlvbmFsVHlwZSA9IFpvZE9wdGlvbmFsLmNyZWF0ZTtcbmNvbnN0IG51bGxhYmxlVHlwZSA9IFpvZE51bGxhYmxlLmNyZWF0ZTtcbmNvbnN0IHByZXByb2Nlc3NUeXBlID0gWm9kRWZmZWN0cy5jcmVhdGVXaXRoUHJlcHJvY2VzcztcbmNvbnN0IG9zdHJpbmcgPSAoKSA9PiBzdHJpbmdUeXBlKCkub3B0aW9uYWwoKTtcbmNvbnN0IG9udW1iZXIgPSAoKSA9PiBudW1iZXJUeXBlKCkub3B0aW9uYWwoKTtcbmNvbnN0IG9ib29sZWFuID0gKCkgPT4gYm9vbGVhblR5cGUoKS5vcHRpb25hbCgpO1xuXG5leHBvcnQge1xuICBhbnlUeXBlIGFzIGFueSxcbiAgYXJyYXlUeXBlIGFzIGFycmF5LFxuICBiaWdJbnRUeXBlIGFzIGJpZ2ludCxcbiAgYm9vbGVhblR5cGUgYXMgYm9vbGVhbixcbiAgZGF0ZVR5cGUgYXMgZGF0ZSxcbiAgZGlzY3JpbWluYXRlZFVuaW9uVHlwZSBhcyBkaXNjcmltaW5hdGVkVW5pb24sXG4gIGVmZmVjdHNUeXBlIGFzIGVmZmVjdCxcbiAgZW51bVR5cGUgYXMgZW51bSxcbiAgZnVuY3Rpb25UeXBlIGFzIGZ1bmN0aW9uLFxuICBpbnN0YW5jZU9mVHlwZSBhcyBpbnN0YW5jZW9mLFxuICBpbnRlcnNlY3Rpb25UeXBlIGFzIGludGVyc2VjdGlvbixcbiAgbGF6eVR5cGUgYXMgbGF6eSxcbiAgbGl0ZXJhbFR5cGUgYXMgbGl0ZXJhbCxcbiAgbWFwVHlwZSBhcyBtYXAsXG4gIG5hblR5cGUgYXMgbmFuLFxuICBuYXRpdmVFbnVtVHlwZSBhcyBuYXRpdmVFbnVtLFxuICBuZXZlclR5cGUgYXMgbmV2ZXIsXG4gIG51bGxUeXBlIGFzIG51bGwsXG4gIG51bGxhYmxlVHlwZSBhcyBudWxsYWJsZSxcbiAgbnVtYmVyVHlwZSBhcyBudW1iZXIsXG4gIG9iamVjdFR5cGUgYXMgb2JqZWN0LFxuICBvYm9vbGVhbixcbiAgb251bWJlcixcbiAgb3B0aW9uYWxUeXBlIGFzIG9wdGlvbmFsLFxuICBvc3RyaW5nLFxuICBwcmVwcm9jZXNzVHlwZSBhcyBwcmVwcm9jZXNzLFxuICBwcm9taXNlVHlwZSBhcyBwcm9taXNlLFxuICByZWNvcmRUeXBlIGFzIHJlY29yZCxcbiAgc2V0VHlwZSBhcyBzZXQsXG4gIHN0cmljdE9iamVjdFR5cGUgYXMgc3RyaWN0T2JqZWN0LFxuICBzdHJpbmdUeXBlIGFzIHN0cmluZyxcbiAgZWZmZWN0c1R5cGUgYXMgdHJhbnNmb3JtZXIsXG4gIHR1cGxlVHlwZSBhcyB0dXBsZSxcbiAgdW5kZWZpbmVkVHlwZSBhcyB1bmRlZmluZWQsXG4gIHVuaW9uVHlwZSBhcyB1bmlvbixcbiAgdW5rbm93blR5cGUgYXMgdW5rbm93bixcbiAgdm9pZFR5cGUgYXMgdm9pZCxcbn07XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsU0FBUyxTQUFTLFFBQVEseUJBQXlCO0FBQ25ELFNBQ0UsaUJBQWlCLEVBR2pCLGFBQWEsRUFDYixPQUFPLEVBQ1AsU0FBUyxFQUNULE9BQU8sRUFDUCxPQUFPLEVBQ1AsT0FBTyxFQUNQLFNBQVMsRUFDVCxFQUFFLEVBTUYsV0FBVyxFQUVYLGFBQWEsUUFDUix5QkFB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