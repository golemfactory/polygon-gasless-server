// Copyright 2018-2023 the oak authors. All rights reserved. MIT license.
import { BufReader } from "./buf_reader.ts";
import { getFilename } from "./content_disposition.ts";
import { equals, errors, extension, writeAll } from "./deps.ts";
import { readHeaders, toParamRegExp, unquote } from "./headers.ts";
import { getRandomFilename, skipLWSPChar, stripEol } from "./util.ts";
const decoder = new TextDecoder();
const encoder = new TextEncoder();
const BOUNDARY_PARAM_REGEX = toParamRegExp("boundary", "i");
const DEFAULT_BUFFER_SIZE = 1_048_576; // 1mb
const DEFAULT_MAX_FILE_SIZE = 10_485_760; // 10mb
const DEFAULT_MAX_SIZE = 0; // all files written to disc
const NAME_PARAM_REGEX = toParamRegExp("name", "i");
function append(a, b) {
    const ab = new Uint8Array(a.length + b.length);
    ab.set(a, 0);
    ab.set(b, a.length);
    return ab;
}
function isEqual(a, b) {
    return equals(skipLWSPChar(a), b);
}
async function readToStartOrEnd(body, start, end) {
    let lineResult;
    while(lineResult = await body.readLine()){
        if (isEqual(lineResult.bytes, start)) {
            return true;
        }
        if (isEqual(lineResult.bytes, end)) {
            return false;
        }
    }
    throw new errors.BadRequest("Unable to find multi-part boundary.");
}
/** Yield up individual parts by reading the body and parsing out the ford
 * data values. */ async function* parts({ body , customContentTypes ={} , final , part , maxFileSize , maxSize , outPath , prefix  }) {
    async function getFile(contentType) {
        const ext = customContentTypes[contentType.toLowerCase()] ?? extension(contentType);
        if (!ext) {
            throw new errors.BadRequest(`The form contained content type "${contentType}" which is not supported by the server.`);
        }
        if (!outPath) {
            outPath = await Deno.makeTempDir();
        }
        const filename = `${outPath}/${await getRandomFilename(prefix, ext)}`;
        const file = await Deno.open(filename, {
            write: true,
            createNew: true
        });
        return [
            filename,
            file
        ];
    }
    while(true){
        const headers = await readHeaders(body);
        const contentType = headers["content-type"];
        const contentDisposition = headers["content-disposition"];
        if (!contentDisposition) {
            throw new errors.BadRequest("Form data part missing content-disposition header");
        }
        if (!contentDisposition.match(/^form-data;/i)) {
            throw new errors.BadRequest(`Unexpected content-disposition header: "${contentDisposition}"`);
        }
        const matches = NAME_PARAM_REGEX.exec(contentDisposition);
        if (!matches) {
            throw new errors.BadRequest(`Unable to determine name of form body part`);
        }
        let [, name] = matches;
        name = unquote(name);
        if (contentType) {
            const originalName = getFilename(contentDisposition);
            let byteLength = 0;
            let file;
            let filename;
            let buf;
            if (maxSize) {
                buf = new Uint8Array();
            } else {
                const result = await getFile(contentType);
                filename = result[0];
                file = result[1];
            }
            while(true){
                const readResult = await body.readLine(false);
                if (!readResult) {
                    throw new errors.BadRequest("Unexpected EOF reached");
                }
                const { bytes  } = readResult;
                const strippedBytes = stripEol(bytes);
                if (isEqual(strippedBytes, part) || isEqual(strippedBytes, final)) {
                    if (file) {
                        // remove extra 2 bytes ([CR, LF]) from result file
                        const bytesDiff = bytes.length - strippedBytes.length;
                        if (bytesDiff) {
                            const originalBytesSize = await file.seek(-bytesDiff, Deno.SeekMode.Current);
                            await file.truncate(originalBytesSize);
                        }
                        file.close();
                    }
                    yield [
                        name,
                        {
                            content: buf,
                            contentType,
                            name,
                            filename,
                            originalName
                        }
                    ];
                    if (isEqual(strippedBytes, final)) {
                        return;
                    }
                    break;
                }
                byteLength += bytes.byteLength;
                if (byteLength > maxFileSize) {
                    if (file) {
                        file.close();
                    }
                    throw new errors.RequestEntityTooLarge(`File size exceeds limit of ${maxFileSize} bytes.`);
                }
                if (buf) {
                    if (byteLength > maxSize) {
                        const result = await getFile(contentType);
                        filename = result[0];
                        file = result[1];
                        await writeAll(file, buf);
                        buf = undefined;
                    } else {
                        buf = append(buf, bytes);
                    }
                }
                if (file) {
                    await writeAll(file, bytes);
                }
            }
        } else {
            const lines = [];
            while(true){
                const readResult = await body.readLine();
                if (!readResult) {
                    throw new errors.BadRequest("Unexpected EOF reached");
                }
                const { bytes  } = readResult;
                if (isEqual(bytes, part) || isEqual(bytes, final)) {
                    yield [
                        name,
                        lines.join("\n")
                    ];
                    if (isEqual(bytes, final)) {
                        return;
                    }
                    break;
                }
                lines.push(decoder.decode(bytes));
            }
        }
    }
}
/** An interface which provides an interface to access the fields of a
 * `multipart/form-data` body.
 *
 * Normally an instance of this is accessed when handling a request body, and
 * dealing with decoding it.  There are options that can be set when attempting
 * to read a multi-part body (see: {@linkcode FormDataReadOptions}).
 *
 * If you `.read()` the value, then a promise is provided of type
 * {@linkcode FormDataBody}. If you use the `.stream()` property, it is an async
 * iterator which yields up a tuple of with the first element being a
 *
 * ### Examples
 *
 * Using `.read()`:
 *
 * ```ts
 * import { Application } from "https://deno.land/x/oak/mod.ts";
 *
 * const app = new Application();
 *
 * app.use(async (ctx) => {
 *   const body = ctx.request.body();
 *   if (body.type === "form-data") {
 *     const value = body.value;
 *     const formData = await value.read();
 *     // the form data is fully available
 *   }
 * });
 * ```
 *
 *  Using `.stream()`:
 *
 * ```ts
 * import { Application } from "https://deno.land/x/oak/mod.ts";
 *
 * const app = new Application();
 *
 * app.use(async (ctx) => {
 *   const body = ctx.request.body();
 *   if (body.type === "form-data") {
 *     const value = body.value;
 *     for await (const [name, value] of value.stream()) {
 *       // asynchronously iterate each part of the body
 *     }
 *   }
 * });
 * ```
 */ export class FormDataReader {
    #body;
    #boundaryFinal;
    #boundaryPart;
    #reading = false;
    constructor(contentType, body){
        const matches = contentType.match(BOUNDARY_PARAM_REGEX);
        if (!matches) {
            throw new errors.BadRequest(`Content type "${contentType}" does not contain a valid boundary.`);
        }
        let [, boundary] = matches;
        boundary = unquote(boundary);
        this.#boundaryPart = encoder.encode(`--${boundary}`);
        this.#boundaryFinal = encoder.encode(`--${boundary}--`);
        this.#body = body;
    }
    /** Reads the multipart body of the response and resolves with an object which
   * contains fields and files that were part of the response.
   *
   * *Note*: this method handles multiple files with the same `name` attribute
   * in the request, but by design it does not handle multiple fields that share
   * the same `name`.  If you expect the request body to contain multiple form
   * data fields with the same name, it is better to use the `.stream()` method
   * which will iterate over each form data field individually. */ async read(options = {}) {
        if (this.#reading) {
            throw new Error("Body is already being read.");
        }
        this.#reading = true;
        const { outPath , maxFileSize =DEFAULT_MAX_FILE_SIZE , maxSize =DEFAULT_MAX_SIZE , bufferSize =DEFAULT_BUFFER_SIZE , customContentTypes  } = options;
        const body = new BufReader(this.#body, bufferSize);
        const result = {
            fields: {}
        };
        if (!await readToStartOrEnd(body, this.#boundaryPart, this.#boundaryFinal)) {
            return result;
        }
        try {
            for await (const part of parts({
                body,
                customContentTypes,
                part: this.#boundaryPart,
                final: this.#boundaryFinal,
                maxFileSize,
                maxSize,
                outPath
            })){
                const [key, value] = part;
                if (typeof value === "string") {
                    result.fields[key] = value;
                } else {
                    if (!result.files) {
                        result.files = [];
                    }
                    result.files.push(value);
                }
            }
        } catch (err) {
            if (err instanceof Deno.errors.PermissionDenied) {
                console.error(err.stack ? err.stack : `${err.name}: ${err.message}`);
            } else {
                throw err;
            }
        }
        return result;
    }
    /** Returns an iterator which will asynchronously yield each part of the form
   * data.  The yielded value is a tuple, where the first element is the name
   * of the part and the second element is a `string` or a `FormDataFile`
   * object. */ async *stream(options = {}) {
        if (this.#reading) {
            throw new Error("Body is already being read.");
        }
        this.#reading = true;
        const { outPath , customContentTypes , maxFileSize =DEFAULT_MAX_FILE_SIZE , maxSize =DEFAULT_MAX_SIZE , bufferSize =32000  } = options;
        const body = new BufReader(this.#body, bufferSize);
        if (!await readToStartOrEnd(body, this.#boundaryPart, this.#boundaryFinal)) {
            return;
        }
        try {
            for await (const part of parts({
                body,
                customContentTypes,
                part: this.#boundaryPart,
                final: this.#boundaryFinal,
                maxFileSize,
                maxSize,
                outPath
            })){
                yield part;
            }
        } catch (err) {
            if (err instanceof Deno.errors.PermissionDenied) {
                console.error(err.stack ? err.stack : `${err.name}: ${err.message}`);
            } else {
                throw err;
            }
        }
    }
    [Symbol.for("Deno.customInspect")](inspect) {
        return `${this.constructor.name} ${inspect({})}`;
    }
    [Symbol.for("nodejs.util.inspect.custom")](depth, // deno-lint-ignore no-explicit-any
    options, inspect) {
        if (depth < 0) {
            return options.stylize(`[${this.constructor.name}]`, "special");
        }
        const newOptions = Object.assign({}, options, {
            depth: options.depth === null ? null : options.depth - 1
        });
        return `${options.stylize(this.constructor.name, "special")} ${inspect({}, newOptions)}`;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvb2FrQHYxMi42LjAvbXVsdGlwYXJ0LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjMgdGhlIG9hayBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cblxuaW1wb3J0IHsgQnVmUmVhZGVyLCBSZWFkTGluZVJlc3VsdCB9IGZyb20gXCIuL2J1Zl9yZWFkZXIudHNcIjtcbmltcG9ydCB7IGdldEZpbGVuYW1lIH0gZnJvbSBcIi4vY29udGVudF9kaXNwb3NpdGlvbi50c1wiO1xuaW1wb3J0IHsgZXF1YWxzLCBlcnJvcnMsIGV4dGVuc2lvbiwgd3JpdGVBbGwgfSBmcm9tIFwiLi9kZXBzLnRzXCI7XG5pbXBvcnQgeyByZWFkSGVhZGVycywgdG9QYXJhbVJlZ0V4cCwgdW5xdW90ZSB9IGZyb20gXCIuL2hlYWRlcnMudHNcIjtcbmltcG9ydCB7IGdldFJhbmRvbUZpbGVuYW1lLCBza2lwTFdTUENoYXIsIHN0cmlwRW9sIH0gZnJvbSBcIi4vdXRpbC50c1wiO1xuXG5jb25zdCBkZWNvZGVyID0gbmV3IFRleHREZWNvZGVyKCk7XG5jb25zdCBlbmNvZGVyID0gbmV3IFRleHRFbmNvZGVyKCk7XG5cbmNvbnN0IEJPVU5EQVJZX1BBUkFNX1JFR0VYID0gdG9QYXJhbVJlZ0V4cChcImJvdW5kYXJ5XCIsIFwiaVwiKTtcbmNvbnN0IERFRkFVTFRfQlVGRkVSX1NJWkUgPSAxXzA0OF81NzY7IC8vIDFtYlxuY29uc3QgREVGQVVMVF9NQVhfRklMRV9TSVpFID0gMTBfNDg1Xzc2MDsgLy8gMTBtYlxuY29uc3QgREVGQVVMVF9NQVhfU0laRSA9IDA7IC8vIGFsbCBmaWxlcyB3cml0dGVuIHRvIGRpc2NcbmNvbnN0IE5BTUVfUEFSQU1fUkVHRVggPSB0b1BhcmFtUmVnRXhwKFwibmFtZVwiLCBcImlcIik7XG5cbi8qKiBXaGVuIHJlYWRpbmcgYSBib2R5IGluIGZ1bGwgdmlhIGAucmVhZCgpYCBmcm9tIGEge0BsaW5rY29kZSBGb3JtRGF0YVJlYWRlcn1cbiAqIHRoaXMgaXMgd2hhdCBpcyB3aGF0IHRoZSB2YWx1ZSBpcyByZXNvbHZlZCwgcHJvdmlkaW5nIGEgc3BsaXQgYmV0d2VlbiBhbnlcbiAqIGZpZWxkcywgYW5kIG11bHRpLXBhcnQgZmlsZXMgdGhhdCB3ZXJlIHByb3ZpZGVkLiAqL1xuZXhwb3J0IGludGVyZmFjZSBGb3JtRGF0YUJvZHkge1xuICAvKiogQSByZWNvcmQgb2YgZm9ybSBwYXJ0cyB3aGVyZSB0aGUga2V5IHdhcyB0aGUgYG5hbWVgIG9mIHRoZSBwYXJ0IGFuZCB0aGVcbiAgICogdmFsdWUgd2FzIHRoZSB2YWx1ZSBvZiB0aGUgcGFydC4gVGhpcyByZWNvcmQgZG9lcyBub3QgaW5jbHVkZSBhbnkgZmlsZXNcbiAgICogdGhhdCB3ZXJlIHBhcnQgb2YgdGhlIGZvcm0gZGF0YS5cbiAgICpcbiAgICogKk5vdGUqOiBEdXBsaWNhdGUgbmFtZXMgYXJlIG5vdCBpbmNsdWRlZCBpbiB0aGlzIHJlY29yZCwgaWYgdGhlcmUgYXJlXG4gICAqIGR1cGxpY2F0ZXMsIHRoZSBsYXN0IHZhbHVlIHdpbGwgYmUgdGhlIHZhbHVlIHRoYXQgaXMgc2V0IGhlcmUuICBJZiB0aGVyZVxuICAgKiBpcyBhIHBvc3NpYmlsaXR5IG9mIGR1cGxpY2F0ZSB2YWx1ZXMsIHVzZSB0aGUgYC5zdHJlYW0oKWAgbWV0aG9kIG9uXG4gICAqIHtAbGlua2NvZGUgRm9ybURhdGFSZWFkZXJ9IHRvIGl0ZXJhdGUgb3ZlciB0aGUgdmFsdWVzLiAqL1xuICBmaWVsZHM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG5cbiAgLyoqIEFuIGFycmF5IG9mIGFueSBmaWxlcyB0aGF0IHdlcmUgcGFydCBvZiB0aGUgZm9ybSBkYXRhLiAqL1xuICBmaWxlcz86IEZvcm1EYXRhRmlsZVtdO1xufVxuXG4vKiogQSByZXByZXNlbnRhdGlvbiBvZiBhIGZpbGUgdGhhdCBoYXMgYmVlbiByZWFkIGZyb20gYSBmb3JtIGRhdGEgYm9keS4gQmFzZWRcbiAqIG9uIHRoZSB7QGxpbmtjb2RlIEZvcm1EYXRhUmVhZE9wdGlvbnN9IHRoYXQgd2VyZSBwYXNzZWQgd2hlbiByZWFkaW5nIHdpbGxcbiAqIGRldGVybWluZSBpZiBmaWxlcyBhcmUgd3JpdHRlbiB0byBkaXNrIG9yIG5vdCBhbmQgaG93IHRoZXkgYXJlIHdyaXR0ZW4gdG9cbiAqIGRpc2suICBXaGVuIHdyaXR0ZW4gdG8gZGlzaywgdGhlIGV4dGVuc2lvbiBvZiB0aGUgZmlsZSB3aWxsIGJlIGRldGVybWluZWQgYnlcbiAqIHRoZSBjb250ZW50IHR5cGUsIHdpdGggdGhlIGAuZmlsZW5hbWVgIHByb3BlcnR5IGNvbnRhaW5pbmcgdGhlIGZ1bGwgcGF0aCB0b1xuICogdGhlIGZpbGUuXG4gKlxuICogVGhlIG9yaWdpbmFsIGZpbGVuYW1lIGFzIHBhcnQgb2YgdGhlIGZvcm0gZGF0YSBpcyBhdmFpbGFibGUgaW5cbiAqIGBvcmlnaW5hbE5hbWVgLCBidXQgZm9yIHNlY3VyaXR5IGFuZCBzdGFiaWxpdHkgcmVhc29ucywgaXQgaXMgbm90IHVzZWQgdG9cbiAqIGRldGVybWluZSB0aGUgbmFtZSBvZiB0aGUgZmlsZSBvbiBkaXNrLiBJZiBmdXJ0aGVyIHByb2Nlc3Npbmcgb3IgcmVuYW1pbmdcbiAqIGlzIHJlcXVpcmVkLCB0aGUgaW1wbGVtZW50b3Igc2hvdWxkIGRvIHRoYXQgcHJvY2Vzc2luZy4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRm9ybURhdGFGaWxlIHtcbiAgLyoqIFdoZW4gdGhlIGZpbGUgaGFzIG5vdCBiZWVuIHdyaXR0ZW4gb3V0IHRvIGRpc2MsIHRoZSBjb250ZW50cyBvZiB0aGUgZmlsZVxuICAgKiBhcyBhIHtAbGlua2NvZGUgVWludDhBcnJheX0uICovXG4gIGNvbnRlbnQ/OiBVaW50OEFycmF5O1xuXG4gIC8qKiBUaGUgY29udGVudCB0eXBlIG9mIHRoZSBmb3JtIGRhdGEgZmlsZS4gKi9cbiAgY29udGVudFR5cGU6IHN0cmluZztcblxuICAvKiogV2hlbiB0aGUgZmlsZSBoYXMgYmVlbiB3cml0dGVuIG91dCB0byBkaXNjLCB0aGUgZnVsbCBwYXRoIHRvIHRoZSBmaWxlLiAqL1xuICBmaWxlbmFtZT86IHN0cmluZztcblxuICAvKiogVGhlIGBuYW1lYCB0aGF0IHdhcyBhc3NpZ25lZCB0byB0aGUgZm9ybSBkYXRhIGZpbGUuICovXG4gIG5hbWU6IHN0cmluZztcblxuICAvKiogVGhlIGBmaWxlbmFtZWAgdGhhdCB3YXMgcHJvdmlkZWQgaW4gdGhlIGZvcm0gZGF0YSBmaWxlLiAqL1xuICBvcmlnaW5hbE5hbWU6IHN0cmluZztcbn1cblxuLyoqIE9wdGlvbnMgd2hpY2ggaW1wYWN0IGhvdyB0aGUgZm9ybSBkYXRhIGlzIGRlY29kZWQgZm9yIGFcbiAqIHtAbGlua2NvZGUgRm9ybURhdGFSZWFkZXJ9LiBBbGwgdGhlc2Ugb3B0aW9ucyBoYXZlIHNlbnNpYmxlIGRlZmF1bHRzIGZvclxuICogbW9zdCBhcHBsaWNhdGlvbnMsIGJ1dCBjYW4gYmUgbW9kaWZpZWQgZm9yIGRpZmZlcmVudCB1c2UgY2FzZXMuIE1hbnkgb2YgdGhlc2VcbiAqIG9wdGlvbnMgY2FuIGhhdmUgYW4gaW1wYWN0IG9uIHRoZSBzdGFiaWxpdHkgb2YgYSBzZXJ2ZXIsIGVzcGVjaWFsbHkgaWYgdGhlcmVcbiAqIGlzIHNvbWVvbmUgYXR0ZW1wdGluZyBhIGRlbmlhbCBvZiBzZXJ2aWNlIGF0dGFjayBvbiB5b3VyIHNlcnZlciwgc28gYmVcbiAqIGNhcmVmdWwgd2hlbiBjaGFuZ2luZyB0aGUgZGVmYXVsdHMuICovXG5leHBvcnQgaW50ZXJmYWNlIEZvcm1EYXRhUmVhZE9wdGlvbnMge1xuICAvKiogVGhlIHNpemUgb2YgdGhlIGJ1ZmZlciB0byByZWFkIGZyb20gdGhlIHJlcXVlc3QgYm9keSBhdCBhIHNpbmdsZSB0aW1lLlxuICAgKiBUaGlzIGRlZmF1bHRzIHRvIDFtYi4gKi9cbiAgYnVmZmVyU2l6ZT86IG51bWJlcjtcblxuICAvKiogQSBtYXBwaW5nIG9mIGN1c3RvbSBtZWRpYSB0eXBlcyB0aGF0IGFyZSBzdXBwb3J0ZWQsIG1hcHBlZCB0byB0aGVpclxuICAgKiBleHRlbnNpb24gd2hlbiBkZXRlcm1pbmluZyB0aGUgZXh0ZW5zaW9uIGZvciBhIGZpbGUuIFRoZSBrZXkgc2hvdWxkIGJlIGFuXG4gICAqIGFsbCBsb3dlcmNhc2UgbWVkaWEgdHlwZSB3aXRoIHRoZSB2YWx1ZSBiZWluZyB0aGUgZXh0ZW5zaW9uICh3aXRob3V0IGFuXG4gICAqIGluaXRpYWwgcGVyaW9kKSwgdG8gYmUgdXNlZCB3aGVuIGRlY29kaW5nIHRoZSBmaWxlLlxuICAgKlxuICAgKiAjIyMgRXhhbXBsZVxuICAgKlxuICAgKiBGb3JtIGRhdGEgdGhhdCBpcyBzZW50IHdpdGggY29udGVudCBoYXZpbmcgYSB0eXBlIG9mIGB0ZXh0L3Zkbi5jdXN0b21gIHdpbGxcbiAgICogYmUgZGVjb2RlZCBhbmQgYXNzaWduZWQgYSBmaWxlbmFtZSBlbmRpbmcgd2l0aCBgLnR4dGA6XG4gICAqXG4gICAqIGBgYHRzXG4gICAqIGltcG9ydCB7IEFwcGxpY2F0aW9uIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3gvb2FrL21vZC50c1wiO1xuICAgKlxuICAgKiBjb25zdCBhcHAgPSBuZXcgQXBwbGljYXRpb24oKTtcbiAgICogYXBwLnVzZShhc3luYyAoY3R4KSA9PiB7XG4gICAqICAgY29uc3QgYm9keSA9IGN0eC5yZXF1ZXN0LmJvZHkoKTtcbiAgICogICBpZiAoYm9keS50eXBlID09PSBcImZvcm0tZGF0YVwiKSB7XG4gICAqICAgICBjb25zdCBmb3JtYXREYXRhID0gYXdhaXQgYm9keS52YWx1ZS5yZWFkKHtcbiAgICogICAgICAgY3VzdG9tQ29udGVudFR5cGVzOiB7XG4gICAqICAgICAgICAgXCJ0ZXh0L3ZuZC5jdXN0b21cIjogXCJ0eHRcIlxuICAgKiAgICAgICB9XG4gICAqICAgICB9KTtcbiAgICogICAgIGNvbnNvbGUubG9nKGZvcm1EYXRhKTtcbiAgICogICB9XG4gICAqIH0pO1xuICAgKiBgYGBcbiAgICovXG4gIGN1c3RvbUNvbnRlbnRUeXBlcz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG5cbiAgLyoqIFRoZSBtYXhpbXVtIGZpbGUgc2l6ZSAoaW4gYnl0ZXMpIHRoYXQgY2FuIGJlIGhhbmRsZWQuICBUaGlzIGRlZmF1bHRzIHRvXG4gICAqIDEwTUIgd2hlbiBub3Qgc3BlY2lmaWVkLiAgVGhpcyBpcyB0byB0cnkgdG8gYXZvaWQgRE9TIGF0dGFja3Mgd2hlcmVcbiAgICogc29tZW9uZSB3b3VsZCBjb250aW51ZSB0byB0cnkgdG8gc2VuZCBhIFwiZmlsZVwiIGNvbnRpbnVvdXNseSB1bnRpbCBhIGhvc3RcbiAgICogbGltaXQgd2FzIHJlYWNoZWQgY3Jhc2hpbmcgdGhlIHNlcnZlciBvciB0aGUgaG9zdC4gQWxzbyBzZWUgYG1heFNpemVgLiAqL1xuICBtYXhGaWxlU2l6ZT86IG51bWJlcjtcblxuICAvKiogVGhlIG1heGltdW0gc2l6ZSAoaW4gYnl0ZXMpIG9mIGEgZmlsZSB0byBob2xkIGluIG1lbW9yeSwgYW5kIG5vdCB3cml0ZVxuICAgKiB0byBkaXNrLiBUaGlzIGRlZmF1bHRzIHRvIGAwYCwgc28gdGhhdCBhbGwgbXVsdGlwYXJ0IGZvcm0gZmlsZXMgYXJlXG4gICAqIHdyaXR0ZW4gdG8gZGlzay4gV2hlbiBzZXQgdG8gYSBwb3NpdGl2ZSBpbnRlZ2VyLCBpZiB0aGUgZm9ybSBkYXRhIGZpbGUgaXNcbiAgICogc21hbGxlciwgaXQgd2lsbCBiZSByZXRhaW5lZCBpbiBtZW1vcnkgYW5kIGF2YWlsYWJsZSBpbiB0aGUgYC5jb250ZW50YFxuICAgKiBwcm9wZXJ0eSBvZiB0aGUgYEZvcm1EYXRhRmlsZWAgb2JqZWN0LiAgSWYgdGhlIGZpbGUgZXhjZWVkcyB0aGUgYG1heFNpemVgXG4gICAqIGl0IHdpbGwgYmUgd3JpdHRlbiB0byBkaXNrIGFuZCB0aGUgYC5maWxlbmFtZWAgcHJvcGVydHkgd2lsbCBjb250YWluIHRoZVxuICAgKiBmdWxsIHBhdGggdG8gdGhlIG91dHB1dCBmaWxlLiAqL1xuICBtYXhTaXplPzogbnVtYmVyO1xuXG4gIC8qKiBXaGVuIHdyaXRpbmcgZm9ybSBkYXRhIGZpbGVzIHRvIGRpc2ssIHRoZSBvdXRwdXQgcGF0aC4gIFRoaXMgd2lsbCBkZWZhdWx0XG4gICAqIHRvIGEgdGVtcG9yYXJ5IHBhdGggZ2VuZXJhdGVkIGJ5IGBEZW5vLm1ha2VUZW1wRGlyKClgLiAqL1xuICBvdXRQYXRoPzogc3RyaW5nO1xuXG4gIC8qKiBXaGVuIGEgZm9ybSBkYXRhIGZpbGUgaXMgd3JpdHRlbiB0byBkaXNrLCBpdCB3aWxsIGJlIGdlbmVyYXRlZCB3aXRoIGFcbiAgICogcmFuZG9tIGZpbGVuYW1lIGFuZCBoYXZlIGFuIGV4dGVuc2lvbiBiYXNlZCBvZmYgdGhlIGNvbnRlbnQgdHlwZSBmb3IgdGhlXG4gICAqIGZpbGUuICBgcHJlZml4YCBjYW4gYmUgc3BlY2lmaWVkIHRob3VnaCB0byBwcmVwZW5kIHRvIHRoZSBmaWxlIG5hbWUuICovXG4gIHByZWZpeD86IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIFBhcnRzT3B0aW9ucyB7XG4gIGJvZHk6IEJ1ZlJlYWRlcjtcbiAgY3VzdG9tQ29udGVudFR5cGVzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbiAgZmluYWw6IFVpbnQ4QXJyYXk7XG4gIG1heEZpbGVTaXplOiBudW1iZXI7XG4gIG1heFNpemU6IG51bWJlcjtcbiAgb3V0UGF0aD86IHN0cmluZztcbiAgcGFydDogVWludDhBcnJheTtcbiAgcHJlZml4Pzogc3RyaW5nO1xufVxuXG5mdW5jdGlvbiBhcHBlbmQoYTogVWludDhBcnJheSwgYjogVWludDhBcnJheSk6IFVpbnQ4QXJyYXkge1xuICBjb25zdCBhYiA9IG5ldyBVaW50OEFycmF5KGEubGVuZ3RoICsgYi5sZW5ndGgpO1xuICBhYi5zZXQoYSwgMCk7XG4gIGFiLnNldChiLCBhLmxlbmd0aCk7XG4gIHJldHVybiBhYjtcbn1cblxuZnVuY3Rpb24gaXNFcXVhbChhOiBVaW50OEFycmF5LCBiOiBVaW50OEFycmF5KTogYm9vbGVhbiB7XG4gIHJldHVybiBlcXVhbHMoc2tpcExXU1BDaGFyKGEpLCBiKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcmVhZFRvU3RhcnRPckVuZChcbiAgYm9keTogQnVmUmVhZGVyLFxuICBzdGFydDogVWludDhBcnJheSxcbiAgZW5kOiBVaW50OEFycmF5LFxuKTogUHJvbWlzZTxib29sZWFuPiB7XG4gIGxldCBsaW5lUmVzdWx0OiBSZWFkTGluZVJlc3VsdCB8IG51bGw7XG4gIHdoaWxlICgobGluZVJlc3VsdCA9IGF3YWl0IGJvZHkucmVhZExpbmUoKSkpIHtcbiAgICBpZiAoaXNFcXVhbChsaW5lUmVzdWx0LmJ5dGVzLCBzdGFydCkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAoaXNFcXVhbChsaW5lUmVzdWx0LmJ5dGVzLCBlbmQpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIHRocm93IG5ldyBlcnJvcnMuQmFkUmVxdWVzdChcbiAgICBcIlVuYWJsZSB0byBmaW5kIG11bHRpLXBhcnQgYm91bmRhcnkuXCIsXG4gICk7XG59XG5cbi8qKiBZaWVsZCB1cCBpbmRpdmlkdWFsIHBhcnRzIGJ5IHJlYWRpbmcgdGhlIGJvZHkgYW5kIHBhcnNpbmcgb3V0IHRoZSBmb3JkXG4gKiBkYXRhIHZhbHVlcy4gKi9cbmFzeW5jIGZ1bmN0aW9uKiBwYXJ0cyhcbiAge1xuICAgIGJvZHksXG4gICAgY3VzdG9tQ29udGVudFR5cGVzID0ge30sXG4gICAgZmluYWwsXG4gICAgcGFydCxcbiAgICBtYXhGaWxlU2l6ZSxcbiAgICBtYXhTaXplLFxuICAgIG91dFBhdGgsXG4gICAgcHJlZml4LFxuICB9OiBQYXJ0c09wdGlvbnMsXG4pOiBBc3luY0l0ZXJhYmxlSXRlcmF0b3I8W3N0cmluZywgc3RyaW5nIHwgRm9ybURhdGFGaWxlXT4ge1xuICBhc3luYyBmdW5jdGlvbiBnZXRGaWxlKGNvbnRlbnRUeXBlOiBzdHJpbmcpOiBQcm9taXNlPFtzdHJpbmcsIERlbm8uRnNGaWxlXT4ge1xuICAgIGNvbnN0IGV4dCA9IGN1c3RvbUNvbnRlbnRUeXBlc1tjb250ZW50VHlwZS50b0xvd2VyQ2FzZSgpXSA/P1xuICAgICAgZXh0ZW5zaW9uKGNvbnRlbnRUeXBlKTtcbiAgICBpZiAoIWV4dCkge1xuICAgICAgdGhyb3cgbmV3IGVycm9ycy5CYWRSZXF1ZXN0KFxuICAgICAgICBgVGhlIGZvcm0gY29udGFpbmVkIGNvbnRlbnQgdHlwZSBcIiR7Y29udGVudFR5cGV9XCIgd2hpY2ggaXMgbm90IHN1cHBvcnRlZCBieSB0aGUgc2VydmVyLmAsXG4gICAgICApO1xuICAgIH1cbiAgICBpZiAoIW91dFBhdGgpIHtcbiAgICAgIG91dFBhdGggPSBhd2FpdCBEZW5vLm1ha2VUZW1wRGlyKCk7XG4gICAgfVxuICAgIGNvbnN0IGZpbGVuYW1lID0gYCR7b3V0UGF0aH0vJHthd2FpdCBnZXRSYW5kb21GaWxlbmFtZShwcmVmaXgsIGV4dCl9YDtcbiAgICBjb25zdCBmaWxlID0gYXdhaXQgRGVuby5vcGVuKGZpbGVuYW1lLCB7IHdyaXRlOiB0cnVlLCBjcmVhdGVOZXc6IHRydWUgfSk7XG4gICAgcmV0dXJuIFtmaWxlbmFtZSwgZmlsZV07XG4gIH1cblxuICB3aGlsZSAodHJ1ZSkge1xuICAgIGNvbnN0IGhlYWRlcnMgPSBhd2FpdCByZWFkSGVhZGVycyhib2R5KTtcbiAgICBjb25zdCBjb250ZW50VHlwZSA9IGhlYWRlcnNbXCJjb250ZW50LXR5cGVcIl07XG4gICAgY29uc3QgY29udGVudERpc3Bvc2l0aW9uID0gaGVhZGVyc1tcImNvbnRlbnQtZGlzcG9zaXRpb25cIl07XG4gICAgaWYgKCFjb250ZW50RGlzcG9zaXRpb24pIHtcbiAgICAgIHRocm93IG5ldyBlcnJvcnMuQmFkUmVxdWVzdChcbiAgICAgICAgXCJGb3JtIGRhdGEgcGFydCBtaXNzaW5nIGNvbnRlbnQtZGlzcG9zaXRpb24gaGVhZGVyXCIsXG4gICAgICApO1xuICAgIH1cbiAgICBpZiAoIWNvbnRlbnREaXNwb3NpdGlvbi5tYXRjaCgvXmZvcm0tZGF0YTsvaSkpIHtcbiAgICAgIHRocm93IG5ldyBlcnJvcnMuQmFkUmVxdWVzdChcbiAgICAgICAgYFVuZXhwZWN0ZWQgY29udGVudC1kaXNwb3NpdGlvbiBoZWFkZXI6IFwiJHtjb250ZW50RGlzcG9zaXRpb259XCJgLFxuICAgICAgKTtcbiAgICB9XG4gICAgY29uc3QgbWF0Y2hlcyA9IE5BTUVfUEFSQU1fUkVHRVguZXhlYyhjb250ZW50RGlzcG9zaXRpb24pO1xuICAgIGlmICghbWF0Y2hlcykge1xuICAgICAgdGhyb3cgbmV3IGVycm9ycy5CYWRSZXF1ZXN0KFxuICAgICAgICBgVW5hYmxlIHRvIGRldGVybWluZSBuYW1lIG9mIGZvcm0gYm9keSBwYXJ0YCxcbiAgICAgICk7XG4gICAgfVxuICAgIGxldCBbLCBuYW1lXSA9IG1hdGNoZXM7XG4gICAgbmFtZSA9IHVucXVvdGUobmFtZSk7XG4gICAgaWYgKGNvbnRlbnRUeXBlKSB7XG4gICAgICBjb25zdCBvcmlnaW5hbE5hbWUgPSBnZXRGaWxlbmFtZShjb250ZW50RGlzcG9zaXRpb24pO1xuICAgICAgbGV0IGJ5dGVMZW5ndGggPSAwO1xuICAgICAgbGV0IGZpbGU6IERlbm8uRnNGaWxlIHwgdW5kZWZpbmVkO1xuICAgICAgbGV0IGZpbGVuYW1lOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gICAgICBsZXQgYnVmOiBVaW50OEFycmF5IHwgdW5kZWZpbmVkO1xuICAgICAgaWYgKG1heFNpemUpIHtcbiAgICAgICAgYnVmID0gbmV3IFVpbnQ4QXJyYXkoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGdldEZpbGUoY29udGVudFR5cGUpO1xuICAgICAgICBmaWxlbmFtZSA9IHJlc3VsdFswXTtcbiAgICAgICAgZmlsZSA9IHJlc3VsdFsxXTtcbiAgICAgIH1cbiAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgIGNvbnN0IHJlYWRSZXN1bHQgPSBhd2FpdCBib2R5LnJlYWRMaW5lKGZhbHNlKTtcbiAgICAgICAgaWYgKCFyZWFkUmVzdWx0KSB7XG4gICAgICAgICAgdGhyb3cgbmV3IGVycm9ycy5CYWRSZXF1ZXN0KFwiVW5leHBlY3RlZCBFT0YgcmVhY2hlZFwiKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB7IGJ5dGVzIH0gPSByZWFkUmVzdWx0O1xuICAgICAgICBjb25zdCBzdHJpcHBlZEJ5dGVzID0gc3RyaXBFb2woYnl0ZXMpO1xuICAgICAgICBpZiAoaXNFcXVhbChzdHJpcHBlZEJ5dGVzLCBwYXJ0KSB8fCBpc0VxdWFsKHN0cmlwcGVkQnl0ZXMsIGZpbmFsKSkge1xuICAgICAgICAgIGlmIChmaWxlKSB7XG4gICAgICAgICAgICAvLyByZW1vdmUgZXh0cmEgMiBieXRlcyAoW0NSLCBMRl0pIGZyb20gcmVzdWx0IGZpbGVcbiAgICAgICAgICAgIGNvbnN0IGJ5dGVzRGlmZiA9IGJ5dGVzLmxlbmd0aCAtIHN0cmlwcGVkQnl0ZXMubGVuZ3RoO1xuICAgICAgICAgICAgaWYgKGJ5dGVzRGlmZikge1xuICAgICAgICAgICAgICBjb25zdCBvcmlnaW5hbEJ5dGVzU2l6ZSA9IGF3YWl0IGZpbGUuc2VlayhcbiAgICAgICAgICAgICAgICAtYnl0ZXNEaWZmLFxuICAgICAgICAgICAgICAgIERlbm8uU2Vla01vZGUuQ3VycmVudCxcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgYXdhaXQgZmlsZS50cnVuY2F0ZShvcmlnaW5hbEJ5dGVzU2l6ZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZpbGUuY2xvc2UoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgeWllbGQgW1xuICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgY29udGVudDogYnVmLFxuICAgICAgICAgICAgICBjb250ZW50VHlwZSxcbiAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgZmlsZW5hbWUsXG4gICAgICAgICAgICAgIG9yaWdpbmFsTmFtZSxcbiAgICAgICAgICAgIH0gYXMgRm9ybURhdGFGaWxlLFxuICAgICAgICAgIF07XG4gICAgICAgICAgaWYgKGlzRXF1YWwoc3RyaXBwZWRCeXRlcywgZmluYWwpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGJ5dGVMZW5ndGggKz0gYnl0ZXMuYnl0ZUxlbmd0aDtcbiAgICAgICAgaWYgKGJ5dGVMZW5ndGggPiBtYXhGaWxlU2l6ZSkge1xuICAgICAgICAgIGlmIChmaWxlKSB7XG4gICAgICAgICAgICBmaWxlLmNsb3NlKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRocm93IG5ldyBlcnJvcnMuUmVxdWVzdEVudGl0eVRvb0xhcmdlKFxuICAgICAgICAgICAgYEZpbGUgc2l6ZSBleGNlZWRzIGxpbWl0IG9mICR7bWF4RmlsZVNpemV9IGJ5dGVzLmAsXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYnVmKSB7XG4gICAgICAgICAgaWYgKGJ5dGVMZW5ndGggPiBtYXhTaXplKSB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBnZXRGaWxlKGNvbnRlbnRUeXBlKTtcbiAgICAgICAgICAgIGZpbGVuYW1lID0gcmVzdWx0WzBdO1xuICAgICAgICAgICAgZmlsZSA9IHJlc3VsdFsxXTtcbiAgICAgICAgICAgIGF3YWl0IHdyaXRlQWxsKGZpbGUsIGJ1Zik7XG4gICAgICAgICAgICBidWYgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGJ1ZiA9IGFwcGVuZChidWYsIGJ5dGVzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZpbGUpIHtcbiAgICAgICAgICBhd2FpdCB3cml0ZUFsbChmaWxlLCBieXRlcyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgbGluZXM6IHN0cmluZ1tdID0gW107XG4gICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICBjb25zdCByZWFkUmVzdWx0ID0gYXdhaXQgYm9keS5yZWFkTGluZSgpO1xuICAgICAgICBpZiAoIXJlYWRSZXN1bHQpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgZXJyb3JzLkJhZFJlcXVlc3QoXCJVbmV4cGVjdGVkIEVPRiByZWFjaGVkXCIpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHsgYnl0ZXMgfSA9IHJlYWRSZXN1bHQ7XG4gICAgICAgIGlmIChpc0VxdWFsKGJ5dGVzLCBwYXJ0KSB8fCBpc0VxdWFsKGJ5dGVzLCBmaW5hbCkpIHtcbiAgICAgICAgICB5aWVsZCBbbmFtZSwgbGluZXMuam9pbihcIlxcblwiKV07XG4gICAgICAgICAgaWYgKGlzRXF1YWwoYnl0ZXMsIGZpbmFsKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBsaW5lcy5wdXNoKGRlY29kZXIuZGVjb2RlKGJ5dGVzKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKiBBbiBpbnRlcmZhY2Ugd2hpY2ggcHJvdmlkZXMgYW4gaW50ZXJmYWNlIHRvIGFjY2VzcyB0aGUgZmllbGRzIG9mIGFcbiAqIGBtdWx0aXBhcnQvZm9ybS1kYXRhYCBib2R5LlxuICpcbiAqIE5vcm1hbGx5IGFuIGluc3RhbmNlIG9mIHRoaXMgaXMgYWNjZXNzZWQgd2hlbiBoYW5kbGluZyBhIHJlcXVlc3QgYm9keSwgYW5kXG4gKiBkZWFsaW5nIHdpdGggZGVjb2RpbmcgaXQuICBUaGVyZSBhcmUgb3B0aW9ucyB0aGF0IGNhbiBiZSBzZXQgd2hlbiBhdHRlbXB0aW5nXG4gKiB0byByZWFkIGEgbXVsdGktcGFydCBib2R5IChzZWU6IHtAbGlua2NvZGUgRm9ybURhdGFSZWFkT3B0aW9uc30pLlxuICpcbiAqIElmIHlvdSBgLnJlYWQoKWAgdGhlIHZhbHVlLCB0aGVuIGEgcHJvbWlzZSBpcyBwcm92aWRlZCBvZiB0eXBlXG4gKiB7QGxpbmtjb2RlIEZvcm1EYXRhQm9keX0uIElmIHlvdSB1c2UgdGhlIGAuc3RyZWFtKClgIHByb3BlcnR5LCBpdCBpcyBhbiBhc3luY1xuICogaXRlcmF0b3Igd2hpY2ggeWllbGRzIHVwIGEgdHVwbGUgb2Ygd2l0aCB0aGUgZmlyc3QgZWxlbWVudCBiZWluZyBhXG4gKlxuICogIyMjIEV4YW1wbGVzXG4gKlxuICogVXNpbmcgYC5yZWFkKClgOlxuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBBcHBsaWNhdGlvbiB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC94L29hay9tb2QudHNcIjtcbiAqXG4gKiBjb25zdCBhcHAgPSBuZXcgQXBwbGljYXRpb24oKTtcbiAqXG4gKiBhcHAudXNlKGFzeW5jIChjdHgpID0+IHtcbiAqICAgY29uc3QgYm9keSA9IGN0eC5yZXF1ZXN0LmJvZHkoKTtcbiAqICAgaWYgKGJvZHkudHlwZSA9PT0gXCJmb3JtLWRhdGFcIikge1xuICogICAgIGNvbnN0IHZhbHVlID0gYm9keS52YWx1ZTtcbiAqICAgICBjb25zdCBmb3JtRGF0YSA9IGF3YWl0IHZhbHVlLnJlYWQoKTtcbiAqICAgICAvLyB0aGUgZm9ybSBkYXRhIGlzIGZ1bGx5IGF2YWlsYWJsZVxuICogICB9XG4gKiB9KTtcbiAqIGBgYFxuICpcbiAqICBVc2luZyBgLnN0cmVhbSgpYDpcbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgQXBwbGljYXRpb24gfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQveC9vYWsvbW9kLnRzXCI7XG4gKlxuICogY29uc3QgYXBwID0gbmV3IEFwcGxpY2F0aW9uKCk7XG4gKlxuICogYXBwLnVzZShhc3luYyAoY3R4KSA9PiB7XG4gKiAgIGNvbnN0IGJvZHkgPSBjdHgucmVxdWVzdC5ib2R5KCk7XG4gKiAgIGlmIChib2R5LnR5cGUgPT09IFwiZm9ybS1kYXRhXCIpIHtcbiAqICAgICBjb25zdCB2YWx1ZSA9IGJvZHkudmFsdWU7XG4gKiAgICAgZm9yIGF3YWl0IChjb25zdCBbbmFtZSwgdmFsdWVdIG9mIHZhbHVlLnN0cmVhbSgpKSB7XG4gKiAgICAgICAvLyBhc3luY2hyb25vdXNseSBpdGVyYXRlIGVhY2ggcGFydCBvZiB0aGUgYm9keVxuICogICAgIH1cbiAqICAgfVxuICogfSk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNsYXNzIEZvcm1EYXRhUmVhZGVyIHtcbiAgI2JvZHk6IERlbm8uUmVhZGVyO1xuICAjYm91bmRhcnlGaW5hbDogVWludDhBcnJheTtcbiAgI2JvdW5kYXJ5UGFydDogVWludDhBcnJheTtcbiAgI3JlYWRpbmcgPSBmYWxzZTtcblxuICBjb25zdHJ1Y3Rvcihjb250ZW50VHlwZTogc3RyaW5nLCBib2R5OiBEZW5vLlJlYWRlcikge1xuICAgIGNvbnN0IG1hdGNoZXMgPSBjb250ZW50VHlwZS5tYXRjaChCT1VOREFSWV9QQVJBTV9SRUdFWCk7XG4gICAgaWYgKCFtYXRjaGVzKSB7XG4gICAgICB0aHJvdyBuZXcgZXJyb3JzLkJhZFJlcXVlc3QoXG4gICAgICAgIGBDb250ZW50IHR5cGUgXCIke2NvbnRlbnRUeXBlfVwiIGRvZXMgbm90IGNvbnRhaW4gYSB2YWxpZCBib3VuZGFyeS5gLFxuICAgICAgKTtcbiAgICB9XG4gICAgbGV0IFssIGJvdW5kYXJ5XSA9IG1hdGNoZXM7XG4gICAgYm91bmRhcnkgPSB1bnF1b3RlKGJvdW5kYXJ5KTtcbiAgICB0aGlzLiNib3VuZGFyeVBhcnQgPSBlbmNvZGVyLmVuY29kZShgLS0ke2JvdW5kYXJ5fWApO1xuICAgIHRoaXMuI2JvdW5kYXJ5RmluYWwgPSBlbmNvZGVyLmVuY29kZShgLS0ke2JvdW5kYXJ5fS0tYCk7XG4gICAgdGhpcy4jYm9keSA9IGJvZHk7XG4gIH1cblxuICAvKiogUmVhZHMgdGhlIG11bHRpcGFydCBib2R5IG9mIHRoZSByZXNwb25zZSBhbmQgcmVzb2x2ZXMgd2l0aCBhbiBvYmplY3Qgd2hpY2hcbiAgICogY29udGFpbnMgZmllbGRzIGFuZCBmaWxlcyB0aGF0IHdlcmUgcGFydCBvZiB0aGUgcmVzcG9uc2UuXG4gICAqXG4gICAqICpOb3RlKjogdGhpcyBtZXRob2QgaGFuZGxlcyBtdWx0aXBsZSBmaWxlcyB3aXRoIHRoZSBzYW1lIGBuYW1lYCBhdHRyaWJ1dGVcbiAgICogaW4gdGhlIHJlcXVlc3QsIGJ1dCBieSBkZXNpZ24gaXQgZG9lcyBub3QgaGFuZGxlIG11bHRpcGxlIGZpZWxkcyB0aGF0IHNoYXJlXG4gICAqIHRoZSBzYW1lIGBuYW1lYC4gIElmIHlvdSBleHBlY3QgdGhlIHJlcXVlc3QgYm9keSB0byBjb250YWluIG11bHRpcGxlIGZvcm1cbiAgICogZGF0YSBmaWVsZHMgd2l0aCB0aGUgc2FtZSBuYW1lLCBpdCBpcyBiZXR0ZXIgdG8gdXNlIHRoZSBgLnN0cmVhbSgpYCBtZXRob2RcbiAgICogd2hpY2ggd2lsbCBpdGVyYXRlIG92ZXIgZWFjaCBmb3JtIGRhdGEgZmllbGQgaW5kaXZpZHVhbGx5LiAqL1xuICBhc3luYyByZWFkKG9wdGlvbnM6IEZvcm1EYXRhUmVhZE9wdGlvbnMgPSB7fSk6IFByb21pc2U8Rm9ybURhdGFCb2R5PiB7XG4gICAgaWYgKHRoaXMuI3JlYWRpbmcpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkJvZHkgaXMgYWxyZWFkeSBiZWluZyByZWFkLlwiKTtcbiAgICB9XG4gICAgdGhpcy4jcmVhZGluZyA9IHRydWU7XG4gICAgY29uc3Qge1xuICAgICAgb3V0UGF0aCxcbiAgICAgIG1heEZpbGVTaXplID0gREVGQVVMVF9NQVhfRklMRV9TSVpFLFxuICAgICAgbWF4U2l6ZSA9IERFRkFVTFRfTUFYX1NJWkUsXG4gICAgICBidWZmZXJTaXplID0gREVGQVVMVF9CVUZGRVJfU0laRSxcbiAgICAgIGN1c3RvbUNvbnRlbnRUeXBlcyxcbiAgICB9ID0gb3B0aW9ucztcbiAgICBjb25zdCBib2R5ID0gbmV3IEJ1ZlJlYWRlcih0aGlzLiNib2R5LCBidWZmZXJTaXplKTtcbiAgICBjb25zdCByZXN1bHQ6IEZvcm1EYXRhQm9keSA9IHsgZmllbGRzOiB7fSB9O1xuICAgIGlmIChcbiAgICAgICEoYXdhaXQgcmVhZFRvU3RhcnRPckVuZChib2R5LCB0aGlzLiNib3VuZGFyeVBhcnQsIHRoaXMuI2JvdW5kYXJ5RmluYWwpKVxuICAgICkge1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgIGZvciBhd2FpdCAoXG4gICAgICAgIGNvbnN0IHBhcnQgb2YgcGFydHMoe1xuICAgICAgICAgIGJvZHksXG4gICAgICAgICAgY3VzdG9tQ29udGVudFR5cGVzLFxuICAgICAgICAgIHBhcnQ6IHRoaXMuI2JvdW5kYXJ5UGFydCxcbiAgICAgICAgICBmaW5hbDogdGhpcy4jYm91bmRhcnlGaW5hbCxcbiAgICAgICAgICBtYXhGaWxlU2l6ZSxcbiAgICAgICAgICBtYXhTaXplLFxuICAgICAgICAgIG91dFBhdGgsXG4gICAgICAgIH0pXG4gICAgICApIHtcbiAgICAgICAgY29uc3QgW2tleSwgdmFsdWVdID0gcGFydDtcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgIHJlc3VsdC5maWVsZHNba2V5XSA9IHZhbHVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICghcmVzdWx0LmZpbGVzKSB7XG4gICAgICAgICAgICByZXN1bHQuZmlsZXMgPSBbXTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmVzdWx0LmZpbGVzLnB1c2godmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBpZiAoZXJyIGluc3RhbmNlb2YgRGVuby5lcnJvcnMuUGVybWlzc2lvbkRlbmllZCkge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVyci5zdGFjayA/IGVyci5zdGFjayA6IGAke2Vyci5uYW1lfTogJHtlcnIubWVzc2FnZX1gKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IGVycjtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKiBSZXR1cm5zIGFuIGl0ZXJhdG9yIHdoaWNoIHdpbGwgYXN5bmNocm9ub3VzbHkgeWllbGQgZWFjaCBwYXJ0IG9mIHRoZSBmb3JtXG4gICAqIGRhdGEuICBUaGUgeWllbGRlZCB2YWx1ZSBpcyBhIHR1cGxlLCB3aGVyZSB0aGUgZmlyc3QgZWxlbWVudCBpcyB0aGUgbmFtZVxuICAgKiBvZiB0aGUgcGFydCBhbmQgdGhlIHNlY29uZCBlbGVtZW50IGlzIGEgYHN0cmluZ2Agb3IgYSBgRm9ybURhdGFGaWxlYFxuICAgKiBvYmplY3QuICovXG4gIGFzeW5jICpzdHJlYW0oXG4gICAgb3B0aW9uczogRm9ybURhdGFSZWFkT3B0aW9ucyA9IHt9LFxuICApOiBBc3luY0l0ZXJhYmxlSXRlcmF0b3I8W25hbWU6IHN0cmluZywgdmFsdWU6IHN0cmluZyB8IEZvcm1EYXRhRmlsZV0+IHtcbiAgICBpZiAodGhpcy4jcmVhZGluZykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQm9keSBpcyBhbHJlYWR5IGJlaW5nIHJlYWQuXCIpO1xuICAgIH1cbiAgICB0aGlzLiNyZWFkaW5nID0gdHJ1ZTtcbiAgICBjb25zdCB7XG4gICAgICBvdXRQYXRoLFxuICAgICAgY3VzdG9tQ29udGVudFR5cGVzLFxuICAgICAgbWF4RmlsZVNpemUgPSBERUZBVUxUX01BWF9GSUxFX1NJWkUsXG4gICAgICBtYXhTaXplID0gREVGQVVMVF9NQVhfU0laRSxcbiAgICAgIGJ1ZmZlclNpemUgPSAzMjAwMCxcbiAgICB9ID0gb3B0aW9ucztcbiAgICBjb25zdCBib2R5ID0gbmV3IEJ1ZlJlYWRlcih0aGlzLiNib2R5LCBidWZmZXJTaXplKTtcbiAgICBpZiAoXG4gICAgICAhKGF3YWl0IHJlYWRUb1N0YXJ0T3JFbmQoYm9keSwgdGhpcy4jYm91bmRhcnlQYXJ0LCB0aGlzLiNib3VuZGFyeUZpbmFsKSlcbiAgICApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgIGZvciBhd2FpdCAoXG4gICAgICAgIGNvbnN0IHBhcnQgb2YgcGFydHMoe1xuICAgICAgICAgIGJvZHksXG4gICAgICAgICAgY3VzdG9tQ29udGVudFR5cGVzLFxuICAgICAgICAgIHBhcnQ6IHRoaXMuI2JvdW5kYXJ5UGFydCxcbiAgICAgICAgICBmaW5hbDogdGhpcy4jYm91bmRhcnlGaW5hbCxcbiAgICAgICAgICBtYXhGaWxlU2l6ZSxcbiAgICAgICAgICBtYXhTaXplLFxuICAgICAgICAgIG91dFBhdGgsXG4gICAgICAgIH0pXG4gICAgICApIHtcbiAgICAgICAgeWllbGQgcGFydDtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGlmIChlcnIgaW5zdGFuY2VvZiBEZW5vLmVycm9ycy5QZXJtaXNzaW9uRGVuaWVkKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyLnN0YWNrID8gZXJyLnN0YWNrIDogYCR7ZXJyLm5hbWV9OiAke2Vyci5tZXNzYWdlfWApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIFtTeW1ib2wuZm9yKFwiRGVuby5jdXN0b21JbnNwZWN0XCIpXShpbnNwZWN0OiAodmFsdWU6IHVua25vd24pID0+IHN0cmluZykge1xuICAgIHJldHVybiBgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9ICR7aW5zcGVjdCh7fSl9YDtcbiAgfVxuXG4gIFtTeW1ib2wuZm9yKFwibm9kZWpzLnV0aWwuaW5zcGVjdC5jdXN0b21cIildKFxuICAgIGRlcHRoOiBudW1iZXIsXG4gICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICBvcHRpb25zOiBhbnksXG4gICAgaW5zcGVjdDogKHZhbHVlOiB1bmtub3duLCBvcHRpb25zPzogdW5rbm93bikgPT4gc3RyaW5nLFxuICApIHtcbiAgICBpZiAoZGVwdGggPCAwKSB7XG4gICAgICByZXR1cm4gb3B0aW9ucy5zdHlsaXplKGBbJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9XWAsIFwic3BlY2lhbFwiKTtcbiAgICB9XG5cbiAgICBjb25zdCBuZXdPcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucywge1xuICAgICAgZGVwdGg6IG9wdGlvbnMuZGVwdGggPT09IG51bGwgPyBudWxsIDogb3B0aW9ucy5kZXB0aCAtIDEsXG4gICAgfSk7XG4gICAgcmV0dXJuIGAke29wdGlvbnMuc3R5bGl6ZSh0aGlzLmNvbnN0cnVjdG9yLm5hbWUsIFwic3BlY2lhbFwiKX0gJHtcbiAgICAgIGluc3BlY3Qoe30sIG5ld09wdGlvbnMpXG4gICAgfWA7XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSx5RUFBeUU7QUFFekUsU0FBUyxTQUFTLFFBQXdCLGtCQUFrQjtBQUM1RCxTQUFTLFdBQVcsUUFBUSwyQkFBMkI7QUFDdkQsU0FBUyxNQUFNLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxRQUFRLFFBQVEsWUFBWTtBQUNoRSxTQUFTLFdBQVcsRUFBRSxhQUFhLEVBQUUsT0FBTyxRQUFRLGVBQWU7QUFDbkUsU0FBUyxpQkFBaUIsRUFBRSxZQUFZLEVBQUUsUUFBUSxRQUFRLFlBQVk7QUFFdEUsTUFBTSxVQUFVLElBQUk7QUFDcEIsTUFBTSxVQUFVLElBQUk7QUFFcEIsTUFBTSx1QkFBdUIsY0FBYyxZQUFZO0FBQ3ZELE1BQU0sc0JBQXNCLFdBQVcsTUFBTTtBQUM3QyxNQUFNLHdCQUF3QixZQUFZLE9BQU87QUFDakQsTUFBTSxtQkFBbUIsR0FBRyw0QkFBNEI7QUFDeEQsTUFBTSxtQkFBbUIsY0FBYyxRQUFRO0FBNkgvQyxTQUFTLE9BQU8sQ0FBYSxFQUFFLENBQWE7SUFDMUMsTUFBTSxLQUFLLElBQUksV0FBVyxFQUFFLFNBQVMsRUFBRTtJQUN2QyxHQUFHLElBQUksR0FBRztJQUNWLEdBQUcsSUFBSSxHQUFHLEVBQUU7SUFDWixPQUFPO0FBQ1Q7QUFFQSxTQUFTLFFBQVEsQ0FBYSxFQUFFLENBQWE7SUFD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