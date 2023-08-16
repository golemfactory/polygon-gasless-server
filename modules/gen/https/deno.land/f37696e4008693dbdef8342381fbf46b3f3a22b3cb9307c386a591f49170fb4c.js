// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { difference, removeEmptyValues } from "./util.ts";
export function parse(rawDotenv) {
    const env = {};
    for (const line of rawDotenv.split("\n")){
        if (!isVariableStart(line)) continue;
        const key = line.slice(0, line.indexOf("=")).trim();
        let value = line.slice(line.indexOf("=") + 1).trim();
        if (hasSingleQuotes(value)) {
            value = value.slice(1, -1);
        } else if (hasDoubleQuotes(value)) {
            value = value.slice(1, -1);
            value = expandNewlines(value);
        } else value = value.trim();
        env[key] = value;
    }
    return env;
}
const defaultConfigOptions = {
    path: `.env`,
    export: false,
    safe: false,
    example: `.env.example`,
    allowEmptyValues: false,
    defaults: `.env.defaults`
};
export function configSync(options = {}) {
    const o = {
        ...defaultConfigOptions,
        ...options
    };
    const conf = parseFile(o.path);
    if (o.defaults) {
        const confDefaults = parseFile(o.defaults);
        for(const key in confDefaults){
            if (!(key in conf)) {
                conf[key] = confDefaults[key];
            }
        }
    }
    if (o.safe) {
        const confExample = parseFile(o.example);
        assertSafe(conf, confExample, o.allowEmptyValues);
    }
    if (o.export) {
        for(const key in conf){
            if (Deno.env.get(key) !== undefined) continue;
            Deno.env.set(key, conf[key]);
        }
    }
    return conf;
}
export async function config(options = {}) {
    const o = {
        ...defaultConfigOptions,
        ...options
    };
    const conf = await parseFileAsync(o.path);
    if (o.defaults) {
        const confDefaults = await parseFileAsync(o.defaults);
        for(const key in confDefaults){
            if (!(key in conf)) {
                conf[key] = confDefaults[key];
            }
        }
    }
    if (o.safe) {
        const confExample = await parseFileAsync(o.example);
        assertSafe(conf, confExample, o.allowEmptyValues);
    }
    if (o.export) {
        for(const key in conf){
            if (Deno.env.get(key) !== undefined) continue;
            Deno.env.set(key, conf[key]);
        }
    }
    return conf;
}
function parseFile(filepath) {
    try {
        // Avoid errors that occur in deno deploy
        // https://github.com/denoland/deno_std/issues/1957
        if (typeof Deno.readFileSync !== "function") {
            return {};
        }
        return parse(new TextDecoder("utf-8").decode(Deno.readFileSync(filepath)));
    } catch (e) {
        if (e instanceof Deno.errors.NotFound) return {};
        throw e;
    }
}
async function parseFileAsync(filepath) {
    try {
        return parse(new TextDecoder("utf-8").decode(await Deno.readFile(filepath)));
    } catch (e) {
        if (e instanceof Deno.errors.NotFound) return {};
        throw e;
    }
}
function isVariableStart(str) {
    return /^\s*[a-zA-Z_][a-zA-Z_0-9 ]*\s*=/.test(str);
}
function hasSingleQuotes(str) {
    return /^'([\s\S]*)'$/.test(str);
}
function hasDoubleQuotes(str) {
    return /^"([\s\S]*)"$/.test(str);
}
function expandNewlines(str) {
    return str.replaceAll("\\n", "\n");
}
function assertSafe(conf, confExample, allowEmptyValues) {
    const currentEnv = Deno.env.toObject();
    // Not all the variables have to be defined in .env, they can be supplied externally
    const confWithEnv = Object.assign({}, currentEnv, conf);
    const missing = difference(Object.keys(confExample), // If allowEmptyValues is false, filter out empty values from configuration
    Object.keys(allowEmptyValues ? confWithEnv : removeEmptyValues(confWithEnv)));
    if (missing.length > 0) {
        const errorMessages = [
            `The following variables were defined in the example file but are not present in the environment:\n  ${missing.join(", ")}`,
            `Make sure to add them to your env file.`,
            !allowEmptyValues && `If you expect any of these variables to be empty, you can set the allowEmptyValues option to true.`
        ];
        throw new MissingEnvVarsError(errorMessages.filter(Boolean).join("\n\n"));
    }
}
export class MissingEnvVarsError extends Error {
    constructor(message){
        super(message);
        this.name = "MissingEnvVarsError";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjEzMy4wL2RvdGVudi9tb2QudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMiB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cblxuaW1wb3J0IHsgZGlmZmVyZW5jZSwgcmVtb3ZlRW1wdHlWYWx1ZXMgfSBmcm9tIFwiLi91dGlsLnRzXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRG90ZW52Q29uZmlnIHtcbiAgW2tleTogc3RyaW5nXTogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENvbmZpZ09wdGlvbnMge1xuICBwYXRoPzogc3RyaW5nO1xuICBleHBvcnQ/OiBib29sZWFuO1xuICBzYWZlPzogYm9vbGVhbjtcbiAgZXhhbXBsZT86IHN0cmluZztcbiAgYWxsb3dFbXB0eVZhbHVlcz86IGJvb2xlYW47XG4gIGRlZmF1bHRzPzogc3RyaW5nO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2UocmF3RG90ZW52OiBzdHJpbmcpOiBEb3RlbnZDb25maWcge1xuICBjb25zdCBlbnY6IERvdGVudkNvbmZpZyA9IHt9O1xuXG4gIGZvciAoY29uc3QgbGluZSBvZiByYXdEb3RlbnYuc3BsaXQoXCJcXG5cIikpIHtcbiAgICBpZiAoIWlzVmFyaWFibGVTdGFydChsaW5lKSkgY29udGludWU7XG4gICAgY29uc3Qga2V5ID0gbGluZS5zbGljZSgwLCBsaW5lLmluZGV4T2YoXCI9XCIpKS50cmltKCk7XG4gICAgbGV0IHZhbHVlID0gbGluZS5zbGljZShsaW5lLmluZGV4T2YoXCI9XCIpICsgMSkudHJpbSgpO1xuICAgIGlmIChoYXNTaW5nbGVRdW90ZXModmFsdWUpKSB7XG4gICAgICB2YWx1ZSA9IHZhbHVlLnNsaWNlKDEsIC0xKTtcbiAgICB9IGVsc2UgaWYgKGhhc0RvdWJsZVF1b3Rlcyh2YWx1ZSkpIHtcbiAgICAgIHZhbHVlID0gdmFsdWUuc2xpY2UoMSwgLTEpO1xuICAgICAgdmFsdWUgPSBleHBhbmROZXdsaW5lcyh2YWx1ZSk7XG4gICAgfSBlbHNlIHZhbHVlID0gdmFsdWUudHJpbSgpO1xuICAgIGVudltrZXldID0gdmFsdWU7XG4gIH1cblxuICByZXR1cm4gZW52O1xufVxuXG5jb25zdCBkZWZhdWx0Q29uZmlnT3B0aW9ucyA9IHtcbiAgcGF0aDogYC5lbnZgLFxuICBleHBvcnQ6IGZhbHNlLFxuICBzYWZlOiBmYWxzZSxcbiAgZXhhbXBsZTogYC5lbnYuZXhhbXBsZWAsXG4gIGFsbG93RW1wdHlWYWx1ZXM6IGZhbHNlLFxuICBkZWZhdWx0czogYC5lbnYuZGVmYXVsdHNgLFxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIGNvbmZpZ1N5bmMob3B0aW9uczogQ29uZmlnT3B0aW9ucyA9IHt9KTogRG90ZW52Q29uZmlnIHtcbiAgY29uc3QgbzogUmVxdWlyZWQ8Q29uZmlnT3B0aW9ucz4gPSB7IC4uLmRlZmF1bHRDb25maWdPcHRpb25zLCAuLi5vcHRpb25zIH07XG5cbiAgY29uc3QgY29uZiA9IHBhcnNlRmlsZShvLnBhdGgpO1xuXG4gIGlmIChvLmRlZmF1bHRzKSB7XG4gICAgY29uc3QgY29uZkRlZmF1bHRzID0gcGFyc2VGaWxlKG8uZGVmYXVsdHMpO1xuICAgIGZvciAoY29uc3Qga2V5IGluIGNvbmZEZWZhdWx0cykge1xuICAgICAgaWYgKCEoa2V5IGluIGNvbmYpKSB7XG4gICAgICAgIGNvbmZba2V5XSA9IGNvbmZEZWZhdWx0c1trZXldO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmIChvLnNhZmUpIHtcbiAgICBjb25zdCBjb25mRXhhbXBsZSA9IHBhcnNlRmlsZShvLmV4YW1wbGUpO1xuICAgIGFzc2VydFNhZmUoY29uZiwgY29uZkV4YW1wbGUsIG8uYWxsb3dFbXB0eVZhbHVlcyk7XG4gIH1cblxuICBpZiAoby5leHBvcnQpIHtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBjb25mKSB7XG4gICAgICBpZiAoRGVuby5lbnYuZ2V0KGtleSkgIT09IHVuZGVmaW5lZCkgY29udGludWU7XG4gICAgICBEZW5vLmVudi5zZXQoa2V5LCBjb25mW2tleV0pO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBjb25mO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29uZmlnKFxuICBvcHRpb25zOiBDb25maWdPcHRpb25zID0ge30sXG4pOiBQcm9taXNlPERvdGVudkNvbmZpZz4ge1xuICBjb25zdCBvOiBSZXF1aXJlZDxDb25maWdPcHRpb25zPiA9IHsgLi4uZGVmYXVsdENvbmZpZ09wdGlvbnMsIC4uLm9wdGlvbnMgfTtcblxuICBjb25zdCBjb25mID0gYXdhaXQgcGFyc2VGaWxlQXN5bmMoby5wYXRoKTtcblxuICBpZiAoby5kZWZhdWx0cykge1xuICAgIGNvbnN0IGNvbmZEZWZhdWx0cyA9IGF3YWl0IHBhcnNlRmlsZUFzeW5jKG8uZGVmYXVsdHMpO1xuICAgIGZvciAoY29uc3Qga2V5IGluIGNvbmZEZWZhdWx0cykge1xuICAgICAgaWYgKCEoa2V5IGluIGNvbmYpKSB7XG4gICAgICAgIGNvbmZba2V5XSA9IGNvbmZEZWZhdWx0c1trZXldO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmIChvLnNhZmUpIHtcbiAgICBjb25zdCBjb25mRXhhbXBsZSA9IGF3YWl0IHBhcnNlRmlsZUFzeW5jKG8uZXhhbXBsZSk7XG4gICAgYXNzZXJ0U2FmZShjb25mLCBjb25mRXhhbXBsZSwgby5hbGxvd0VtcHR5VmFsdWVzKTtcbiAgfVxuXG4gIGlmIChvLmV4cG9ydCkge1xuICAgIGZvciAoY29uc3Qga2V5IGluIGNvbmYpIHtcbiAgICAgIGlmIChEZW5vLmVudi5nZXQoa2V5KSAhPT0gdW5kZWZpbmVkKSBjb250aW51ZTtcbiAgICAgIERlbm8uZW52LnNldChrZXksIGNvbmZba2V5XSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGNvbmY7XG59XG5cbmZ1bmN0aW9uIHBhcnNlRmlsZShmaWxlcGF0aDogc3RyaW5nKSB7XG4gIHRyeSB7XG4gICAgLy8gQXZvaWQgZXJyb3JzIHRoYXQgb2NjdXIgaW4gZGVubyBkZXBsb3lcbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vZGVub2xhbmQvZGVub19zdGQvaXNzdWVzLzE5NTdcbiAgICBpZiAodHlwZW9mIERlbm8ucmVhZEZpbGVTeW5jICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIHJldHVybiB7fTtcbiAgICB9XG4gICAgcmV0dXJuIHBhcnNlKG5ldyBUZXh0RGVjb2RlcihcInV0Zi04XCIpLmRlY29kZShEZW5vLnJlYWRGaWxlU3luYyhmaWxlcGF0aCkpKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGlmIChlIGluc3RhbmNlb2YgRGVuby5lcnJvcnMuTm90Rm91bmQpIHJldHVybiB7fTtcbiAgICB0aHJvdyBlO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHBhcnNlRmlsZUFzeW5jKGZpbGVwYXRoOiBzdHJpbmcpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gcGFyc2UoXG4gICAgICBuZXcgVGV4dERlY29kZXIoXCJ1dGYtOFwiKS5kZWNvZGUoYXdhaXQgRGVuby5yZWFkRmlsZShmaWxlcGF0aCkpLFxuICAgICk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBpZiAoZSBpbnN0YW5jZW9mIERlbm8uZXJyb3JzLk5vdEZvdW5kKSByZXR1cm4ge307XG4gICAgdGhyb3cgZTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc1ZhcmlhYmxlU3RhcnQoc3RyOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIC9eXFxzKlthLXpBLVpfXVthLXpBLVpfMC05IF0qXFxzKj0vLnRlc3Qoc3RyKTtcbn1cblxuZnVuY3Rpb24gaGFzU2luZ2xlUXVvdGVzKHN0cjogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHJldHVybiAvXicoW1xcc1xcU10qKSckLy50ZXN0KHN0cik7XG59XG5cbmZ1bmN0aW9uIGhhc0RvdWJsZVF1b3RlcyhzdHI6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gL15cIihbXFxzXFxTXSopXCIkLy50ZXN0KHN0cik7XG59XG5cbmZ1bmN0aW9uIGV4cGFuZE5ld2xpbmVzKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlQWxsKFwiXFxcXG5cIiwgXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIGFzc2VydFNhZmUoXG4gIGNvbmY6IERvdGVudkNvbmZpZyxcbiAgY29uZkV4YW1wbGU6IERvdGVudkNvbmZpZyxcbiAgYWxsb3dFbXB0eVZhbHVlczogYm9vbGVhbixcbikge1xuICBjb25zdCBjdXJyZW50RW52ID0gRGVuby5lbnYudG9PYmplY3QoKTtcblxuICAvLyBOb3QgYWxsIHRoZSB2YXJpYWJsZXMgaGF2ZSB0byBiZSBkZWZpbmVkIGluIC5lbnYsIHRoZXkgY2FuIGJlIHN1cHBsaWVkIGV4dGVybmFsbHlcbiAgY29uc3QgY29uZldpdGhFbnYgPSBPYmplY3QuYXNzaWduKHt9LCBjdXJyZW50RW52LCBjb25mKTtcblxuICBjb25zdCBtaXNzaW5nID0gZGlmZmVyZW5jZShcbiAgICBPYmplY3Qua2V5cyhjb25mRXhhbXBsZSksXG4gICAgLy8gSWYgYWxsb3dFbXB0eVZhbHVlcyBpcyBmYWxzZSwgZmlsdGVyIG91dCBlbXB0eSB2YWx1ZXMgZnJvbSBjb25maWd1cmF0aW9uXG4gICAgT2JqZWN0LmtleXMoXG4gICAgICBhbGxvd0VtcHR5VmFsdWVzID8gY29uZldpdGhFbnYgOiByZW1vdmVFbXB0eVZhbHVlcyhjb25mV2l0aEVudiksXG4gICAgKSxcbiAgKTtcblxuICBpZiAobWlzc2luZy5sZW5ndGggPiAwKSB7XG4gICAgY29uc3QgZXJyb3JNZXNzYWdlcyA9IFtcbiAgICAgIGBUaGUgZm9sbG93aW5nIHZhcmlhYmxlcyB3ZXJlIGRlZmluZWQgaW4gdGhlIGV4YW1wbGUgZmlsZSBidXQgYXJlIG5vdCBwcmVzZW50IGluIHRoZSBlbnZpcm9ubWVudDpcXG4gICR7XG4gICAgICAgIG1pc3Npbmcuam9pbihcbiAgICAgICAgICBcIiwgXCIsXG4gICAgICAgIClcbiAgICAgIH1gLFxuICAgICAgYE1ha2Ugc3VyZSB0byBhZGQgdGhlbSB0byB5b3VyIGVudiBmaWxlLmAsXG4gICAgICAhYWxsb3dFbXB0eVZhbHVlcyAmJlxuICAgICAgYElmIHlvdSBleHBlY3QgYW55IG9mIHRoZXNlIHZhcmlhYmxlcyB0byBiZSBlbXB0eSwgeW91IGNhbiBzZXQgdGhlIGFsbG93RW1wdHlWYWx1ZXMgb3B0aW9uIHRvIHRydWUuYCxcbiAgICBdO1xuXG4gICAgdGhyb3cgbmV3IE1pc3NpbmdFbnZWYXJzRXJyb3IoZXJyb3JNZXNzYWdlcy5maWx0ZXIoQm9vbGVhbikuam9pbihcIlxcblxcblwiKSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIE1pc3NpbmdFbnZWYXJzRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKG1lc3NhZ2U/OiBzdHJpbmcpIHtcbiAgICBzdXBlcihtZXNzYWdlKTtcbiAgICB0aGlzLm5hbWUgPSBcIk1pc3NpbmdFbnZWYXJzRXJyb3JcIjtcbiAgICBPYmplY3Quc2V0UHJvdG90eXBlT2YodGhpcywgbmV3LnRhcmdldC5wcm90b3R5cGUpO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBRTFFLFNBQVMsVUFBVSxFQUFFLGlCQUFpQixRQUFRLFlBQVk7QUFlMUQsT0FBTyxTQUFTLE1BQU0sU0FBaUI7SUFDckMsTUFBTSxNQUFvQixDQUFDO0lBRTNCLEtBQUssTUFBTSxRQUFRLFVBQVUsTUFBTSxNQUFPO1FBQ3hDLElBQUksQ0FBQyxnQkFBZ0IsT0FBTztRQUM1QixNQUFNLE1BQU0sS0FBSyxNQUFNLEdBQUcsS0FBSyxRQUFRLE1BQU07UUFDN0MsSUFBSSxRQUFRLEtBQUssTUFBTSxLQUFLLFFBQVEsT0FBTyxHQUFHO1FBQzlDLElBQUksZ0JBQWdCLFFBQVE7WUFDMUIsUUFBUSxNQUFNLE1BQU0sR0FBRyxDQUFDO1FBQzFCLE9BQU8sSUFBSSxnQkFBZ0IsUUFBUTtZQUNqQyxRQUFRLE1BQU0sTUFB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