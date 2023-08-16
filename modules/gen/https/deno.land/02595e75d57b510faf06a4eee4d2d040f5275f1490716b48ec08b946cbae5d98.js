// Copyright 2018-2023 the oak authors. All rights reserved. MIT license.
import { createHttpError, errors, readerFromStreamReader, Status } from "./deps.ts";
import { isMediaType } from "./isMediaType.ts";
import { FormDataReader } from "./multipart.ts";
import { assert } from "./util.ts";
const DEFAULT_LIMIT = 10_485_760; // 10mb
const defaultBodyContentTypes = {
    json: [
        "json",
        "application/*+json",
        "application/csp-report"
    ],
    form: [
        "urlencoded"
    ],
    formData: [
        "multipart"
    ],
    text: [
        "text"
    ]
};
function resolveType(contentType, contentTypes) {
    const contentTypesJson = [
        ...defaultBodyContentTypes.json,
        ...contentTypes.json ?? []
    ];
    const contentTypesForm = [
        ...defaultBodyContentTypes.form,
        ...contentTypes.form ?? []
    ];
    const contentTypesFormData = [
        ...defaultBodyContentTypes.formData,
        ...contentTypes.formData ?? []
    ];
    const contentTypesText = [
        ...defaultBodyContentTypes.text,
        ...contentTypes.text ?? []
    ];
    if (contentTypes.bytes && isMediaType(contentType, contentTypes.bytes)) {
        return "bytes";
    } else if (isMediaType(contentType, contentTypesJson)) {
        return "json";
    } else if (isMediaType(contentType, contentTypesForm)) {
        return "form";
    } else if (isMediaType(contentType, contentTypesFormData)) {
        return "form-data";
    } else if (isMediaType(contentType, contentTypesText)) {
        return "text";
    }
    return "bytes";
}
const decoder = new TextDecoder(undefined, {
    fatal: true
});
export class RequestBody {
    #body;
    #formDataReader;
    #headers;
    #jsonBodyReviver;
    #stream;
    #readAllBody;
    #readBody;
    #type;
    #exceedsLimit(limit) {
        if (!limit || limit === Infinity) {
            return false;
        }
        if (!this.#body) {
            return false;
        }
        const contentLength = this.#headers.get("content-length") ?? "0";
        const parsed = parseInt(contentLength, 10);
        if (isNaN(parsed)) {
            return true;
        }
        return parsed > limit;
    }
    #parse(type, limit) {
        switch(type){
            case "form":
                this.#type = "bytes";
                if (this.#exceedsLimit(limit)) {
                    return ()=>Promise.reject(createHttpError(Status.BadRequest, `Body exceeds a limit of ${limit}.`, {
                            expose: false
                        }));
                }
                return async ()=>new URLSearchParams(decoder.decode(await this.#valuePromise()).replace(/\+/g, " "));
            case "form-data":
                this.#type = "form-data";
                return ()=>{
                    const contentType = this.#headers.get("content-type");
                    assert(contentType);
                    const readableStream = this.#body ?? new ReadableStream();
                    try {
                        return this.#formDataReader ?? (this.#formDataReader = new FormDataReader(contentType, readerFromStreamReader(readableStream.getReader())));
                    } catch (err) {
                        const message = err instanceof Error ? err.message : "Malformed request body.";
                        throw createHttpError(Status.BadRequest, message, {
                            expose: false
                        });
                    }
                };
            case "json":
                this.#type = "bytes";
                if (this.#exceedsLimit(limit)) {
                    return ()=>Promise.reject(createHttpError(Status.BadRequest, `Body exceeds a limit of ${limit}.`, {
                            expose: false
                        }));
                }
                return async ()=>{
                    const value = await this.#valuePromise();
                    try {
                        return value.length ? JSON.parse(decoder.decode(await this.#valuePromise()), this.#jsonBodyReviver) : null;
                    } catch (err) {
                        const message = err instanceof Error ? err.message : "Malformed request body.";
                        throw createHttpError(Status.BadRequest, message, {
                            expose: false
                        });
                    }
                };
            case "bytes":
                this.#type = "bytes";
                if (this.#exceedsLimit(limit)) {
                    return ()=>Promise.reject(createHttpError(Status.BadRequest, `Body exceeds a limit of ${limit}.`, {
                            expose: false
                        }));
                }
                return ()=>this.#valuePromise();
            case "text":
                this.#type = "bytes";
                if (this.#exceedsLimit(limit)) {
                    return ()=>Promise.reject(createHttpError(Status.BadRequest, `Body exceeds a limit of ${limit}.`, {
                            expose: false
                        }));
                }
                return async ()=>{
                    try {
                        return decoder.decode(await this.#valuePromise());
                    } catch (err) {
                        const message = err instanceof Error ? err.message : "Malformed request body.";
                        throw createHttpError(Status.BadRequest, message, {
                            expose: false
                        });
                    }
                };
            default:
                throw createHttpError(Status.InternalServerError, `Invalid body type: "${type}"`, {
                    expose: true
                });
        }
    }
    #validateGetArgs(type, contentTypes) {
        if (type === "reader" && this.#type && this.#type !== "reader") {
            throw new TypeError(`Body already consumed as "${this.#type}" and cannot be returned as a reader.`);
        }
        if (type === "stream" && this.#type && this.#type !== "stream") {
            throw new TypeError(`Body already consumed as "${this.#type}" and cannot be returned as a stream.`);
        }
        if (type === "form-data" && this.#type && this.#type !== "form-data") {
            throw new TypeError(`Body already consumed as "${this.#type}" and cannot be returned as a stream.`);
        }
        if (this.#type === "reader" && type !== "reader") {
            throw new TypeError("Body already consumed as a reader and can only be returned as a reader.");
        }
        if (this.#type === "stream" && type !== "stream") {
            throw new TypeError("Body already consumed as a stream and can only be returned as a stream.");
        }
        if (this.#type === "form-data" && type !== "form-data") {
            throw new TypeError("Body already consumed as form data and can only be returned as form data.");
        }
        if (type && Object.keys(contentTypes).length) {
            throw new TypeError(`"type" and "contentTypes" cannot be specified at the same time`);
        }
    }
    #valuePromise() {
        return this.#readAllBody ?? (this.#readAllBody = this.#readBody());
    }
    constructor({ body , readBody  }, headers, jsonBodyReviver){
        this.#body = body;
        this.#headers = headers;
        this.#jsonBodyReviver = jsonBodyReviver;
        this.#readBody = readBody;
    }
    get({ limit =DEFAULT_LIMIT , type , contentTypes ={}  } = {}) {
        this.#validateGetArgs(type, contentTypes);
        if (type === "reader") {
            if (!this.#body) {
                this.#type = "undefined";
                throw new TypeError(`Body is undefined and cannot be returned as "reader".`);
            }
            this.#type = "reader";
            return {
                type,
                value: readerFromStreamReader(this.#body.getReader())
            };
        }
        if (type === "stream") {
            if (!this.#body) {
                this.#type = "undefined";
                throw new TypeError(`Body is undefined and cannot be returned as "stream".`);
            }
            this.#type = "stream";
            const streams = (this.#stream ?? this.#body).tee();
            this.#stream = streams[1];
            return {
                type,
                value: streams[0]
            };
        }
        if (!this.has()) {
            this.#type = "undefined";
        } else if (!this.#type) {
            const encoding = this.#headers.get("content-encoding") ?? "identity";
            if (encoding !== "identity") {
                throw new errors.UnsupportedMediaType(`Unsupported content-encoding: ${encoding}`);
            }
        }
        if (this.#type === "undefined" && (!type || type === "undefined")) {
            return {
                type: "undefined",
                value: undefined
            };
        }
        if (!type) {
            const contentType = this.#headers.get("content-type");
            if (!contentType) {
                throw createHttpError(Status.BadRequest, "The Content-Type header is missing from the request");
            }
            type = resolveType(contentType, contentTypes);
        }
        assert(type);
        const body = Object.create(null);
        Object.defineProperties(body, {
            type: {
                value: type,
                configurable: true,
                enumerable: true
            },
            value: {
                get: this.#parse(type, limit),
                configurable: true,
                enumerable: true
            }
        });
        return body;
    }
    /** Returns if the request might have a body or not, without attempting to
   * consume it.
   *
   * **WARNING** This is an unreliable API. In HTTP/2 it is not possible to
   * determine if certain HTTP methods have a body or not without attempting to
   * read the body. As of Deno 1.16.1 and later, for HTTP/1.1 aligns to the
   * HTTP/2 behaviour.
   */ has() {
        return this.#body != null;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvb2FrQHYxMi42LjAvYm9keS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIzIHRoZSBvYWsgYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG5cbmltcG9ydCB7XG4gIGNyZWF0ZUh0dHBFcnJvcixcbiAgZXJyb3JzLFxuICByZWFkZXJGcm9tU3RyZWFtUmVhZGVyLFxuICBTdGF0dXMsXG59IGZyb20gXCIuL2RlcHMudHNcIjtcbmltcG9ydCB7IGlzTWVkaWFUeXBlIH0gZnJvbSBcIi4vaXNNZWRpYVR5cGUudHNcIjtcbmltcG9ydCB7IEZvcm1EYXRhUmVhZGVyIH0gZnJvbSBcIi4vbXVsdGlwYXJ0LnRzXCI7XG5pbXBvcnQgdHlwZSB7IFNlcnZlclJlcXVlc3RCb2R5IH0gZnJvbSBcIi4vdHlwZXMuZC50c1wiO1xuaW1wb3J0IHsgYXNzZXJ0IH0gZnJvbSBcIi4vdXRpbC50c1wiO1xuXG4vKiogVGhlIHR5cGUgb2YgdGhlIGJvZHksIHdoZXJlOlxuICpcbiAqIC0gYFwiYnl0ZXNcImAgLSB0aGUgYm9keSBpcyBwcm92aWRlZCBhcyBhIHByb21pc2Ugd2hpY2ggcmVzb2x2ZXMgdG8gYW5cbiAqICAge0BsaW5rY29kZSBVaW50OEFycmF5fS4gVGhpcyBpcyBlc3NlbnRpYWxseSBhIFwicmF3XCIgYm9keSB0eXBlLlxuICogLSBgXCJmb3JtXCJgIC0gdGhlIGJvZHkgd2FzIGRlY29kZWQgYXMgYSBmb3JtIHdpdGggdGhlIGNvbnRlbnRzIHByb3ZpZGVkIGFzIGFcbiAqICAgcHJvbWlzZSB3aGljaCByZXNvbHZlcyB3aXRoIGEge0BsaW5rY29kZSBVUkxTZWFyY2hQYXJhbXN9LlxuICogLSBgXCJmb3JtLWRhdGFcImAgLSB0aGUgYm9keSB3YXMgZGVjb2RlZCBhcyBhIG11bHRpLXBhcnQgZm9ybSBkYXRhIGFuZCB0aGVcbiAqICAgY29udGVudHMgYXJlIHByb3ZpZGVkIGFzIGEgcHJvbWlzZSB3aGljaCByZXNvbHZlcyB3aXRoIGFcbiAqICAge0BsaW5rY29kZSBGb3JtRGF0YVJlYWRlcn0uXG4gKiAtIGBcImpzb25cImAgLSB0aGUgYm9keSB3YXMgZGVjb2RlZCBhcyBKU09OLCB3aGVyZSB0aGUgY29udGVudHMgYXJlIHByb3ZpZGVkIGFzXG4gKiAgIHRoZSByZXN1bHQgb2YgdXNpbmcgYEpTT04ucGFyc2UoKWAgb24gdGhlIHN0cmluZyBjb250ZW50cyBvZiB0aGUgYm9keS5cbiAqIC0gYFwidGV4dFwiYCAtIHRoZSBib2R5IHdhcyBkZWNvZGVkIGFzIHRleHQsIHdoZXJlIHRoZSBjb250ZW50cyBhcmUgcHJvdmlkZWQgYXNcbiAqICAgYSBzdHJpbmcuXG4gKiAtIGBcInJlYWRlclwiYCAtIHRoZSBib2R5IGlzIHByb3ZpZGVkIGFzIHtAbGlua2NvZGUgRGVuby5SZWFkZXJ9IGludGVyZmFjZSBmb3JcbiAqICAgcmVhZGluZyB0aGUgXCJyYXdcIiBib2R5LlxuICogLSBgXCJzdHJlYW1cImAgLSB0aGUgYm9keSBpcyBwcm92aWRlZCBhcyBhXG4gKiAgIHtAbGlua2NvZGUgUmVhZGFibGVTdHJlYW08VWludDhBcnJheT59IGZvciByZWFkaW5nIHRoZSBcInJhd1wiIGJvZHkuXG4gKiAtIGBcInVuZGVmaW5lZFwiYCAtIHRoZXJlIGlzIG5vIHJlcXVlc3QgYm9keSBvciBpdCBjb3VsZCBub3QgYmUgZGVjb2RlZC5cbiAqL1xuZXhwb3J0IHR5cGUgQm9keVR5cGUgPVxuICB8IFwiYnl0ZXNcIlxuICB8IFwiZm9ybVwiXG4gIHwgXCJmb3JtLWRhdGFcIlxuICB8IFwianNvblwiXG4gIHwgXCJ0ZXh0XCJcbiAgfCBcInJlYWRlclwiXG4gIHwgXCJzdHJlYW1cIlxuICB8IFwidW5kZWZpbmVkXCI7XG5cbi8qKiBUaGUgdGFnZ2VkIHR5cGUgZm9yIGBcImJ5dGVzXCJgIGJvZGllcy4gKi9cbmV4cG9ydCB0eXBlIEJvZHlCeXRlcyA9IHtcbiAgcmVhZG9ubHkgdHlwZTogXCJieXRlc1wiO1xuICByZWFkb25seSB2YWx1ZTogUHJvbWlzZTxVaW50OEFycmF5Pjtcbn07XG4vKiogVGhlIHRhZ2dlZCB0eXBlIGZvciBgXCJqc29uXCJgIGJvZGllcy4gKi9cbmV4cG9ydCB0eXBlIEJvZHlKc29uID0ge1xuICByZWFkb25seSB0eXBlOiBcImpzb25cIjtcbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgcmVhZG9ubHkgdmFsdWU6IFByb21pc2U8YW55Pjtcbn07XG4vKiogVGhlIHRhZ2dlZCB0eXBlIGZvciBgXCJmb3JtXCJgIGJvZGllcy4gKi9cbmV4cG9ydCB0eXBlIEJvZHlGb3JtID0ge1xuICByZWFkb25seSB0eXBlOiBcImZvcm1cIjtcbiAgcmVhZG9ubHkgdmFsdWU6IFByb21pc2U8VVJMU2VhcmNoUGFyYW1zPjtcbn07XG4vKiogVGhlIHRhZ2dlZCB0eXBlIGZvciBgXCJmb3JtLWRhdGFcImAgYm9kaWVzLiAqL1xuZXhwb3J0IHR5cGUgQm9keUZvcm1EYXRhID0ge1xuICByZWFkb25seSB0eXBlOiBcImZvcm0tZGF0YVwiO1xuICByZWFkb25seSB2YWx1ZTogRm9ybURhdGFSZWFkZXI7XG59O1xuLyoqIFRoZSB0YWdnZWQgdHlwZSBmb3IgYFwidGV4dFwiYCBib2RpZXMuICovXG5leHBvcnQgdHlwZSBCb2R5VGV4dCA9IHtcbiAgcmVhZG9ubHkgdHlwZTogXCJ0ZXh0XCI7XG4gIHJlYWRvbmx5IHZhbHVlOiBQcm9taXNlPHN0cmluZz47XG59O1xuLyoqIFRoZSB0YWdnZWQgdHlwZSBmb3IgYFwidW5kZWZpbmVkXCJgIGJvZGllcy4gKi9cbmV4cG9ydCB0eXBlIEJvZHlVbmRlZmluZWQgPSB7XG4gIHJlYWRvbmx5IHR5cGU6IFwidW5kZWZpbmVkXCI7XG4gIHJlYWRvbmx5IHZhbHVlOiB1bmRlZmluZWQ7XG59O1xuLyoqIFRoZSB0YWdnZWQgdHlwZSBmb3IgYFwicmVhZGVyXCJgIGJvZGllcy4gKi9cbmV4cG9ydCB0eXBlIEJvZHlSZWFkZXIgPSB7XG4gIHJlYWRvbmx5IHR5cGU6IFwicmVhZGVyXCI7XG4gIHJlYWRvbmx5IHZhbHVlOiBEZW5vLlJlYWRlcjtcbn07XG4vKiogVGhlIHRhZ2dlZCB0eXBlIGZvciBgXCJzdHJlYW1cImAgYm9kaWVzLiAqL1xuZXhwb3J0IHR5cGUgQm9keVN0cmVhbSA9IHtcbiAgcmVhZG9ubHkgdHlwZTogXCJzdHJlYW1cIjtcbiAgcmVhZG9ubHkgdmFsdWU6IFJlYWRhYmxlU3RyZWFtPFVpbnQ4QXJyYXk+O1xufTtcblxuLyoqIFRoZSB0eXBlIHJldHVybmVkIGZyb20gdGhlIGAuYm9keSgpYCBmdW5jdGlvbiwgd2hpY2ggaXMgYSB0YWdnZWQgdW5pb24gdHlwZVxuICogb2YgYWxsIHRoZSBkaWZmZXJlbnQgdHlwZXMgb2YgYm9kaWVzIHdoaWNoIGNhbiBiZSBpZGVudGlmaWVkIGJ5IHRoZSBgLnR5cGVgXG4gKiBwcm9wZXJ0eSB3aGljaCB3aWxsIGJlIG9mIHR5cGUge0BsaW5rY29kZSBCb2R5VHlwZX0gYW5kIHRoZSBgLnZhbHVlYFxuICogcHJvcGVydHkgYmVpbmcgYSBgUHJvbWlzZWAgd2hpY2ggcmVzb2x2ZXMgd2l0aCB0aGUgYXBwcm9wcmlhdGUgdmFsdWUsIG9yXG4gKiBgdW5kZWZpbmVkYCBpZiB0aGVyZSBpcyBubyBib2R5LiAqL1xuZXhwb3J0IHR5cGUgQm9keSA9XG4gIHwgQm9keUJ5dGVzXG4gIHwgQm9keUpzb25cbiAgfCBCb2R5Rm9ybVxuICB8IEJvZHlGb3JtRGF0YVxuICB8IEJvZHlUZXh0XG4gIHwgQm9keVVuZGVmaW5lZDtcblxudHlwZSBCb2R5VmFsdWVHZXR0ZXIgPSAoKSA9PiBCb2R5W1widmFsdWVcIl07XG5cbi8qKiBXaGVuIHNldHRpbmcgdGhlIGBjb250ZW50VHlwZXNgIHByb3BlcnR5IG9mIHtAbGlua2NvZGUgQm9keU9wdGlvbnN9LCBwcm92aWRlXG4gKiBhZGRpdGlvbmFsIGNvbnRlbnQgdHlwZXMgd2hpY2ggY2FuIGluZmx1ZW5jZSBob3cgdGhlIGJvZHkgaXMgZGVjb2RlZC4gVGhpc1xuICogaXMgc3BlY2lmaWNhbGx5IGRlc2lnbmVkIHRvIGFsbG93IGEgc2VydmVyIHRvIHN1cHBvcnQgY3VzdG9tIG9yIHNwZWNpYWxpemVkXG4gKiBtZWRpYSB0eXBlcyB0aGF0IGFyZSBub3QgcGFydCBvZiB0aGUgcHVibGljIGRhdGFiYXNlLiAqL1xuZXhwb3J0IGludGVyZmFjZSBCb2R5T3B0aW9uc0NvbnRlbnRUeXBlcyB7XG4gIC8qKiBDb250ZW50IHR5cGVzIGxpc3RlZCBoZXJlIHdpbGwgYWx3YXlzIHJldHVybiBhbiBVaW50OEFycmF5LiAqL1xuICBieXRlcz86IHN0cmluZ1tdO1xuICAvKiogQ29udGVudCB0eXBlcyBsaXN0ZWQgaGVyZSB3aWxsIGJlIHBhcnNlZCBhcyBhIEpTT04gc3RyaW5nLiAqL1xuICBqc29uPzogc3RyaW5nW107XG4gIC8qKiBDb250ZW50IHR5cGVzIGxpc3RlZCBoZXJlIHdpbGwgYmUgcGFyc2VkIGFzIGZvcm0gZGF0YSBhbmQgcmV0dXJuXG4gICAqIGBVUkxTZWFyY2hQYXJhbWV0ZXJzYCBhcyB0aGUgdmFsdWUgb2YgdGhlIGJvZHkuICovXG4gIGZvcm0/OiBzdHJpbmdbXTtcbiAgLyoqIENvbnRlbnQgdHlwZXMgbGlzdGVkIGhlcmUgd2lsbCBiZSBwYXJzZWQgYXMgZnJvbSBkYXRhIGFuZCByZXR1cm4gYVxuICAgKiBgRm9ybURhdGFCb2R5YCBpbnRlcmZhY2UgYXMgdGhlIHZhbHVlIG9mIHRoZSBib2R5LiAqL1xuICBmb3JtRGF0YT86IHN0cmluZ1tdO1xuICAvKiogQ29udGVudCB0eXBlcyBsaXN0ZWQgaGVyZSB3aWxsIGJlIHBhcnNlZCBhcyB0ZXh0LiAqL1xuICB0ZXh0Pzogc3RyaW5nW107XG59XG5cbi8qKiBPcHRpb25zIHdoaWNoIGNhbiBiZSB1c2VkIHdoZW4gYWNjZXNzaW5nIHRoZSBgLmJvZHkoKWAgb2YgYSByZXF1ZXN0LlxuICpcbiAqIEB0ZW1wbGF0ZSBUIHRoZSB7QGxpbmtjb2RlIEJvZHlUeXBlfSB0byBhdHRlbXB0IHRvIHVzZSB3aGVuIGRlY29kaW5nIHRoZVxuICogICAgICAgICAgICAgcmVxdWVzdCBib2R5LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIEJvZHlPcHRpb25zPFQgZXh0ZW5kcyBCb2R5VHlwZSA9IEJvZHlUeXBlPiB7XG4gIC8qKiBXaGVuIHJlYWRpbmcgYSBub24tc3RyZWFtaW5nIGJvZHksIHNldCBhIGxpbWl0IHdoZXJlYnkgaWYgdGhlIGNvbnRlbnRcbiAgICogbGVuZ3RoIGlzIGdyZWF0ZXIgdGhlbiB0aGUgbGltaXQgb3Igbm90IHNldCwgcmVhZGluZyB0aGUgYm9keSB3aWxsIHRocm93LlxuICAgKlxuICAgKiBUaGlzIGlzIHRvIHByZXZlbnQgbWFsaWNpb3VzIHJlcXVlc3RzIHdoZXJlIHRoZSBib2R5IGV4Y2VlZHMgdGhlIGNhcGFjaXR5XG4gICAqIG9mIHRoZSBzZXJ2ZXIuIFNldCB0aGUgbGltaXQgdG8gMCB0byBhbGxvdyB1bmJvdW5kZWQgcmVhZHMuICBUaGUgZGVmYXVsdFxuICAgKiBpcyAxMCBNaWIuICovXG4gIGxpbWl0PzogbnVtYmVyO1xuICAvKiogSW5zdGVhZCBvZiB1dGlsaXppbmcgdGhlIGNvbnRlbnQgdHlwZSBvZiB0aGUgcmVxdWVzdCwgYXR0ZW1wdCB0byBwYXJzZSB0aGVcbiAgICogYm9keSBhcyB0aGUgdHlwZSBzcGVjaWZpZWQuIFRoZSB2YWx1ZSBoYXMgdG8gYmUgb2Yge0BsaW5rY29kZSBCb2R5VHlwZX0uICovXG4gIHR5cGU/OiBUO1xuICAvKiogQSBtYXAgb2YgZXh0cmEgY29udGVudCB0eXBlcyB0byBkZXRlcm1pbmUgaG93IHRvIHBhcnNlIHRoZSBib2R5LiAqL1xuICBjb250ZW50VHlwZXM/OiBCb2R5T3B0aW9uc0NvbnRlbnRUeXBlcztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBCb2R5Q29udGVudFR5cGVzIHtcbiAganNvbj86IHN0cmluZ1tdO1xuICBmb3JtPzogc3RyaW5nW107XG4gIHRleHQ/OiBzdHJpbmdbXTtcbn1cblxuY29uc3QgREVGQVVMVF9MSU1JVCA9IDEwXzQ4NV83NjA7IC8vIDEwbWJcblxuY29uc3QgZGVmYXVsdEJvZHlDb250ZW50VHlwZXMgPSB7XG4gIGpzb246IFtcImpzb25cIiwgXCJhcHBsaWNhdGlvbi8qK2pzb25cIiwgXCJhcHBsaWNhdGlvbi9jc3AtcmVwb3J0XCJdLFxuICBmb3JtOiBbXCJ1cmxlbmNvZGVkXCJdLFxuICBmb3JtRGF0YTogW1wibXVsdGlwYXJ0XCJdLFxuICB0ZXh0OiBbXCJ0ZXh0XCJdLFxufTtcblxuZnVuY3Rpb24gcmVzb2x2ZVR5cGUoXG4gIGNvbnRlbnRUeXBlOiBzdHJpbmcsXG4gIGNvbnRlbnRUeXBlczogQm9keU9wdGlvbnNDb250ZW50VHlwZXMsXG4pOiBCb2R5VHlwZSB7XG4gIGNvbnN0IGNvbnRlbnRUeXBlc0pzb24gPSBbXG4gICAgLi4uZGVmYXVsdEJvZHlDb250ZW50VHlwZXMuanNvbixcbiAgICAuLi4oY29udGVudFR5cGVzLmpzb24gPz8gW10pLFxuICBdO1xuICBjb25zdCBjb250ZW50VHlwZXNGb3JtID0gW1xuICAgIC4uLmRlZmF1bHRCb2R5Q29udGVudFR5cGVzLmZvcm0sXG4gICAgLi4uKGNvbnRlbnRUeXBlcy5mb3JtID8/IFtdKSxcbiAgXTtcbiAgY29uc3QgY29udGVudFR5cGVzRm9ybURhdGEgPSBbXG4gICAgLi4uZGVmYXVsdEJvZHlDb250ZW50VHlwZXMuZm9ybURhdGEsXG4gICAgLi4uKGNvbnRlbnRUeXBlcy5mb3JtRGF0YSA/PyBbXSksXG4gIF07XG4gIGNvbnN0IGNvbnRlbnRUeXBlc1RleHQgPSBbXG4gICAgLi4uZGVmYXVsdEJvZHlDb250ZW50VHlwZXMudGV4dCxcbiAgICAuLi4oY29udGVudFR5cGVzLnRleHQgPz8gW10pLFxuICBdO1xuICBpZiAoY29udGVudFR5cGVzLmJ5dGVzICYmIGlzTWVkaWFUeXBlKGNvbnRlbnRUeXBlLCBjb250ZW50VHlwZXMuYnl0ZXMpKSB7XG4gICAgcmV0dXJuIFwiYnl0ZXNcIjtcbiAgfSBlbHNlIGlmIChpc01lZGlhVHlwZShjb250ZW50VHlwZSwgY29udGVudFR5cGVzSnNvbikpIHtcbiAgICByZXR1cm4gXCJqc29uXCI7XG4gIH0gZWxzZSBpZiAoaXNNZWRpYVR5cGUoY29udGVudFR5cGUsIGNvbnRlbnRUeXBlc0Zvcm0pKSB7XG4gICAgcmV0dXJuIFwiZm9ybVwiO1xuICB9IGVsc2UgaWYgKGlzTWVkaWFUeXBlKGNvbnRlbnRUeXBlLCBjb250ZW50VHlwZXNGb3JtRGF0YSkpIHtcbiAgICByZXR1cm4gXCJmb3JtLWRhdGFcIjtcbiAgfSBlbHNlIGlmIChpc01lZGlhVHlwZShjb250ZW50VHlwZSwgY29udGVudFR5cGVzVGV4dCkpIHtcbiAgICByZXR1cm4gXCJ0ZXh0XCI7XG4gIH1cbiAgcmV0dXJuIFwiYnl0ZXNcIjtcbn1cblxuY29uc3QgZGVjb2RlciA9IG5ldyBUZXh0RGVjb2Rlcih1bmRlZmluZWQsIHsgZmF0YWw6IHRydWUgfSk7XG5cbmV4cG9ydCBjbGFzcyBSZXF1ZXN0Qm9keSB7XG4gICNib2R5OiBSZWFkYWJsZVN0cmVhbTxVaW50OEFycmF5PiB8IG51bGw7XG4gICNmb3JtRGF0YVJlYWRlcj86IEZvcm1EYXRhUmVhZGVyO1xuICAjaGVhZGVyczogSGVhZGVycztcbiAgI2pzb25Cb2R5UmV2aXZlcj86IChrZXk6IHN0cmluZywgdmFsdWU6IHVua25vd24pID0+IHVua25vd247XG4gICNzdHJlYW0/OiBSZWFkYWJsZVN0cmVhbTxVaW50OEFycmF5PjtcbiAgI3JlYWRBbGxCb2R5PzogUHJvbWlzZTxVaW50OEFycmF5PjtcbiAgI3JlYWRCb2R5OiAoKSA9PiBQcm9taXNlPFVpbnQ4QXJyYXk+O1xuICAjdHlwZT86IFwiYnl0ZXNcIiB8IFwiZm9ybS1kYXRhXCIgfCBcInJlYWRlclwiIHwgXCJzdHJlYW1cIiB8IFwidW5kZWZpbmVkXCI7XG5cbiAgI2V4Y2VlZHNMaW1pdChsaW1pdDogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgaWYgKCFsaW1pdCB8fCBsaW1pdCA9PT0gSW5maW5pdHkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKCF0aGlzLiNib2R5KSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGNvbnN0IGNvbnRlbnRMZW5ndGggPSB0aGlzLiNoZWFkZXJzLmdldChcImNvbnRlbnQtbGVuZ3RoXCIpID8/IFwiMFwiO1xuICAgIGNvbnN0IHBhcnNlZCA9IHBhcnNlSW50KGNvbnRlbnRMZW5ndGgsIDEwKTtcbiAgICBpZiAoaXNOYU4ocGFyc2VkKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBwYXJzZWQgPiBsaW1pdDtcbiAgfVxuXG4gICNwYXJzZSh0eXBlOiBCb2R5VHlwZSwgbGltaXQ6IG51bWJlcik6IEJvZHlWYWx1ZUdldHRlciB7XG4gICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICBjYXNlIFwiZm9ybVwiOlxuICAgICAgICB0aGlzLiN0eXBlID0gXCJieXRlc1wiO1xuICAgICAgICBpZiAodGhpcy4jZXhjZWVkc0xpbWl0KGxpbWl0KSkge1xuICAgICAgICAgIHJldHVybiAoKSA9PlxuICAgICAgICAgICAgUHJvbWlzZS5yZWplY3QoXG4gICAgICAgICAgICAgIGNyZWF0ZUh0dHBFcnJvcihcbiAgICAgICAgICAgICAgICBTdGF0dXMuQmFkUmVxdWVzdCxcbiAgICAgICAgICAgICAgICBgQm9keSBleGNlZWRzIGEgbGltaXQgb2YgJHtsaW1pdH0uYCxcbiAgICAgICAgICAgICAgICB7IGV4cG9zZTogZmFsc2UgfSxcbiAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFzeW5jICgpID0+XG4gICAgICAgICAgbmV3IFVSTFNlYXJjaFBhcmFtcyhcbiAgICAgICAgICAgIGRlY29kZXIuZGVjb2RlKGF3YWl0IHRoaXMuI3ZhbHVlUHJvbWlzZSgpKS5yZXBsYWNlKC9cXCsvZywgXCIgXCIpLFxuICAgICAgICAgICk7XG4gICAgICBjYXNlIFwiZm9ybS1kYXRhXCI6XG4gICAgICAgIHRoaXMuI3R5cGUgPSBcImZvcm0tZGF0YVwiO1xuICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgIGNvbnN0IGNvbnRlbnRUeXBlID0gdGhpcy4jaGVhZGVycy5nZXQoXCJjb250ZW50LXR5cGVcIik7XG4gICAgICAgICAgYXNzZXJ0KGNvbnRlbnRUeXBlKTtcbiAgICAgICAgICBjb25zdCByZWFkYWJsZVN0cmVhbSA9IHRoaXMuI2JvZHkgPz8gbmV3IFJlYWRhYmxlU3RyZWFtKCk7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLiNmb3JtRGF0YVJlYWRlciA/P1xuICAgICAgICAgICAgICAodGhpcy4jZm9ybURhdGFSZWFkZXIgPSBuZXcgRm9ybURhdGFSZWFkZXIoXG4gICAgICAgICAgICAgICAgY29udGVudFR5cGUsXG4gICAgICAgICAgICAgICAgcmVhZGVyRnJvbVN0cmVhbVJlYWRlcihcbiAgICAgICAgICAgICAgICAgIChyZWFkYWJsZVN0cmVhbSBhcyBSZWFkYWJsZVN0cmVhbTxVaW50OEFycmF5PikuZ2V0UmVhZGVyKCksXG4gICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgKSk7XG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zdCBtZXNzYWdlID0gZXJyIGluc3RhbmNlb2YgRXJyb3JcbiAgICAgICAgICAgICAgPyBlcnIubWVzc2FnZVxuICAgICAgICAgICAgICA6IFwiTWFsZm9ybWVkIHJlcXVlc3QgYm9keS5cIjtcbiAgICAgICAgICAgIHRocm93IGNyZWF0ZUh0dHBFcnJvcihcbiAgICAgICAgICAgICAgU3RhdHVzLkJhZFJlcXVlc3QsXG4gICAgICAgICAgICAgIG1lc3NhZ2UsXG4gICAgICAgICAgICAgIHsgZXhwb3NlOiBmYWxzZSB9LFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICBjYXNlIFwianNvblwiOlxuICAgICAgICB0aGlzLiN0eXBlID0gXCJieXRlc1wiO1xuICAgICAgICBpZiAodGhpcy4jZXhjZWVkc0xpbWl0KGxpbWl0KSkge1xuICAgICAgICAgIHJldHVybiAoKSA9PlxuICAgICAgICAgICAgUHJvbWlzZS5yZWplY3QoY3JlYXRlSHR0cEVycm9yKFxuICAgICAgICAgICAgICBTdGF0dXMuQmFkUmVxdWVzdCxcbiAgICAgICAgICAgICAgYEJvZHkgZXhjZWVkcyBhIGxpbWl0IG9mICR7bGltaXR9LmAsXG4gICAgICAgICAgICAgIHsgZXhwb3NlOiBmYWxzZSB9LFxuICAgICAgICAgICAgKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFzeW5jICgpID0+IHtcbiAgICAgICAgICBjb25zdCB2YWx1ZSA9IGF3YWl0IHRoaXMuI3ZhbHVlUHJvbWlzZSgpO1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWUubGVuZ3RoXG4gICAgICAgICAgICAgID8gSlNPTi5wYXJzZShcbiAgICAgICAgICAgICAgICBkZWNvZGVyLmRlY29kZShhd2FpdCB0aGlzLiN2YWx1ZVByb21pc2UoKSksXG4gICAgICAgICAgICAgICAgdGhpcy4janNvbkJvZHlSZXZpdmVyLFxuICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgIDogbnVsbDtcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnN0IG1lc3NhZ2UgPSBlcnIgaW5zdGFuY2VvZiBFcnJvclxuICAgICAgICAgICAgICA/IGVyci5tZXNzYWdlXG4gICAgICAgICAgICAgIDogXCJNYWxmb3JtZWQgcmVxdWVzdCBib2R5LlwiO1xuICAgICAgICAgICAgdGhyb3cgY3JlYXRlSHR0cEVycm9yKFxuICAgICAgICAgICAgICBTdGF0dXMuQmFkUmVxdWVzdCxcbiAgICAgICAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgICAgICAgeyBleHBvc2U6IGZhbHNlIH0sXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIGNhc2UgXCJieXRlc1wiOlxuICAgICAgICB0aGlzLiN0eXBlID0gXCJieXRlc1wiO1xuICAgICAgICBpZiAodGhpcy4jZXhjZWVkc0xpbWl0KGxpbWl0KSkge1xuICAgICAgICAgIHJldHVybiAoKSA9PlxuICAgICAgICAgICAgUHJvbWlzZS5yZWplY3QoY3JlYXRlSHR0cEVycm9yKFxuICAgICAgICAgICAgICBTdGF0dXMuQmFkUmVxdWVzdCxcbiAgICAgICAgICAgICAgYEJvZHkgZXhjZWVkcyBhIGxpbWl0IG9mICR7bGltaXR9LmAsXG4gICAgICAgICAgICAgIHsgZXhwb3NlOiBmYWxzZSB9LFxuICAgICAgICAgICAgKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICgpID0+IHRoaXMuI3ZhbHVlUHJvbWlzZSgpO1xuICAgICAgY2FzZSBcInRleHRcIjpcbiAgICAgICAgdGhpcy4jdHlwZSA9IFwiYnl0ZXNcIjtcbiAgICAgICAgaWYgKHRoaXMuI2V4Y2VlZHNMaW1pdChsaW1pdCkpIHtcbiAgICAgICAgICByZXR1cm4gKCkgPT5cbiAgICAgICAgICAgIFByb21pc2UucmVqZWN0KGNyZWF0ZUh0dHBFcnJvcihcbiAgICAgICAgICAgICAgU3RhdHVzLkJhZFJlcXVlc3QsXG4gICAgICAgICAgICAgIGBCb2R5IGV4Y2VlZHMgYSBsaW1pdCBvZiAke2xpbWl0fS5gLFxuICAgICAgICAgICAgICB7IGV4cG9zZTogZmFsc2UgfSxcbiAgICAgICAgICAgICkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiBkZWNvZGVyLmRlY29kZShhd2FpdCB0aGlzLiN2YWx1ZVByb21pc2UoKSk7XG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zdCBtZXNzYWdlID0gZXJyIGluc3RhbmNlb2YgRXJyb3JcbiAgICAgICAgICAgICAgPyBlcnIubWVzc2FnZVxuICAgICAgICAgICAgICA6IFwiTWFsZm9ybWVkIHJlcXVlc3QgYm9keS5cIjtcbiAgICAgICAgICAgIHRocm93IGNyZWF0ZUh0dHBFcnJvcihcbiAgICAgICAgICAgICAgU3RhdHVzLkJhZFJlcXVlc3QsXG4gICAgICAgICAgICAgIG1lc3NhZ2UsXG4gICAgICAgICAgICAgIHsgZXhwb3NlOiBmYWxzZSB9LFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyBjcmVhdGVIdHRwRXJyb3IoXG4gICAgICAgICAgU3RhdHVzLkludGVybmFsU2VydmVyRXJyb3IsXG4gICAgICAgICAgYEludmFsaWQgYm9keSB0eXBlOiBcIiR7dHlwZX1cImAsXG4gICAgICAgICAgeyBleHBvc2U6IHRydWUgfSxcbiAgICAgICAgKTtcbiAgICB9XG4gIH1cblxuICAjdmFsaWRhdGVHZXRBcmdzKFxuICAgIHR5cGU6IEJvZHlUeXBlIHwgdW5kZWZpbmVkLFxuICAgIGNvbnRlbnRUeXBlczogQm9keU9wdGlvbnNDb250ZW50VHlwZXMsXG4gICkge1xuICAgIGlmICh0eXBlID09PSBcInJlYWRlclwiICYmIHRoaXMuI3R5cGUgJiYgdGhpcy4jdHlwZSAhPT0gXCJyZWFkZXJcIikge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgYEJvZHkgYWxyZWFkeSBjb25zdW1lZCBhcyBcIiR7dGhpcy4jdHlwZX1cIiBhbmQgY2Fubm90IGJlIHJldHVybmVkIGFzIGEgcmVhZGVyLmAsXG4gICAgICApO1xuICAgIH1cbiAgICBpZiAodHlwZSA9PT0gXCJzdHJlYW1cIiAmJiB0aGlzLiN0eXBlICYmIHRoaXMuI3R5cGUgIT09IFwic3RyZWFtXCIpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgIGBCb2R5IGFscmVhZHkgY29uc3VtZWQgYXMgXCIke3RoaXMuI3R5cGV9XCIgYW5kIGNhbm5vdCBiZSByZXR1cm5lZCBhcyBhIHN0cmVhbS5gLFxuICAgICAgKTtcbiAgICB9XG4gICAgaWYgKHR5cGUgPT09IFwiZm9ybS1kYXRhXCIgJiYgdGhpcy4jdHlwZSAmJiB0aGlzLiN0eXBlICE9PSBcImZvcm0tZGF0YVwiKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICBgQm9keSBhbHJlYWR5IGNvbnN1bWVkIGFzIFwiJHt0aGlzLiN0eXBlfVwiIGFuZCBjYW5ub3QgYmUgcmV0dXJuZWQgYXMgYSBzdHJlYW0uYCxcbiAgICAgICk7XG4gICAgfVxuICAgIGlmICh0aGlzLiN0eXBlID09PSBcInJlYWRlclwiICYmIHR5cGUgIT09IFwicmVhZGVyXCIpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgIFwiQm9keSBhbHJlYWR5IGNvbnN1bWVkIGFzIGEgcmVhZGVyIGFuZCBjYW4gb25seSBiZSByZXR1cm5lZCBhcyBhIHJlYWRlci5cIixcbiAgICAgICk7XG4gICAgfVxuICAgIGlmICh0aGlzLiN0eXBlID09PSBcInN0cmVhbVwiICYmIHR5cGUgIT09IFwic3RyZWFtXCIpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgIFwiQm9keSBhbHJlYWR5IGNvbnN1bWVkIGFzIGEgc3RyZWFtIGFuZCBjYW4gb25seSBiZSByZXR1cm5lZCBhcyBhIHN0cmVhbS5cIixcbiAgICAgICk7XG4gICAgfVxuICAgIGlmICh0aGlzLiN0eXBlID09PSBcImZvcm0tZGF0YVwiICYmIHR5cGUgIT09IFwiZm9ybS1kYXRhXCIpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgIFwiQm9keSBhbHJlYWR5IGNvbnN1bWVkIGFzIGZvcm0gZGF0YSBhbmQgY2FuIG9ubHkgYmUgcmV0dXJuZWQgYXMgZm9ybSBkYXRhLlwiLFxuICAgICAgKTtcbiAgICB9XG4gICAgaWYgKHR5cGUgJiYgT2JqZWN0LmtleXMoY29udGVudFR5cGVzKS5sZW5ndGgpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgIGBcInR5cGVcIiBhbmQgXCJjb250ZW50VHlwZXNcIiBjYW5ub3QgYmUgc3BlY2lmaWVkIGF0IHRoZSBzYW1lIHRpbWVgLFxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICAjdmFsdWVQcm9taXNlKCkge1xuICAgIHJldHVybiB0aGlzLiNyZWFkQWxsQm9keSA/PyAodGhpcy4jcmVhZEFsbEJvZHkgPSB0aGlzLiNyZWFkQm9keSgpKTtcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHsgYm9keSwgcmVhZEJvZHkgfTogU2VydmVyUmVxdWVzdEJvZHksXG4gICAgaGVhZGVyczogSGVhZGVycyxcbiAgICBqc29uQm9keVJldml2ZXI/OiAoa2V5OiBzdHJpbmcsIHZhbHVlOiB1bmtub3duKSA9PiB1bmtub3duLFxuICApIHtcbiAgICB0aGlzLiNib2R5ID0gYm9keTtcbiAgICB0aGlzLiNoZWFkZXJzID0gaGVhZGVycztcbiAgICB0aGlzLiNqc29uQm9keVJldml2ZXIgPSBqc29uQm9keVJldml2ZXI7XG4gICAgdGhpcy4jcmVhZEJvZHkgPSByZWFkQm9keTtcbiAgfVxuXG4gIGdldChcbiAgICB7IGxpbWl0ID0gREVGQVVMVF9MSU1JVCwgdHlwZSwgY29udGVudFR5cGVzID0ge30gfTogQm9keU9wdGlvbnMgPSB7fSxcbiAgKTogQm9keSB8IEJvZHlSZWFkZXIgfCBCb2R5U3RyZWFtIHtcbiAgICB0aGlzLiN2YWxpZGF0ZUdldEFyZ3ModHlwZSwgY29udGVudFR5cGVzKTtcbiAgICBpZiAodHlwZSA9PT0gXCJyZWFkZXJcIikge1xuICAgICAgaWYgKCF0aGlzLiNib2R5KSB7XG4gICAgICAgIHRoaXMuI3R5cGUgPSBcInVuZGVmaW5lZFwiO1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAgIGBCb2R5IGlzIHVuZGVmaW5lZCBhbmQgY2Fubm90IGJlIHJldHVybmVkIGFzIFwicmVhZGVyXCIuYCxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuI3R5cGUgPSBcInJlYWRlclwiO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZSxcbiAgICAgICAgdmFsdWU6IHJlYWRlckZyb21TdHJlYW1SZWFkZXIodGhpcy4jYm9keS5nZXRSZWFkZXIoKSksXG4gICAgICB9O1xuICAgIH1cbiAgICBpZiAodHlwZSA9PT0gXCJzdHJlYW1cIikge1xuICAgICAgaWYgKCF0aGlzLiNib2R5KSB7XG4gICAgICAgIHRoaXMuI3R5cGUgPSBcInVuZGVmaW5lZFwiO1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAgIGBCb2R5IGlzIHVuZGVmaW5lZCBhbmQgY2Fubm90IGJlIHJldHVybmVkIGFzIFwic3RyZWFtXCIuYCxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuI3R5cGUgPSBcInN0cmVhbVwiO1xuICAgICAgY29uc3Qgc3RyZWFtcyA9XG4gICAgICAgICgodGhpcy4jc3RyZWFtID8/IHRoaXMuI2JvZHkpIGFzIFJlYWRhYmxlU3RyZWFtPFVpbnQ4QXJyYXk+KVxuICAgICAgICAgIC50ZWUoKTtcbiAgICAgIHRoaXMuI3N0cmVhbSA9IHN0cmVhbXNbMV07XG4gICAgICByZXR1cm4geyB0eXBlLCB2YWx1ZTogc3RyZWFtc1swXSB9O1xuICAgIH1cbiAgICBpZiAoIXRoaXMuaGFzKCkpIHtcbiAgICAgIHRoaXMuI3R5cGUgPSBcInVuZGVmaW5lZFwiO1xuICAgIH0gZWxzZSBpZiAoIXRoaXMuI3R5cGUpIHtcbiAgICAgIGNvbnN0IGVuY29kaW5nID0gdGhpcy4jaGVhZGVycy5nZXQoXCJjb250ZW50LWVuY29kaW5nXCIpID8/XG4gICAgICAgIFwiaWRlbnRpdHlcIjtcbiAgICAgIGlmIChlbmNvZGluZyAhPT0gXCJpZGVudGl0eVwiKSB7XG4gICAgICAgIHRocm93IG5ldyBlcnJvcnMuVW5zdXBwb3J0ZWRNZWRpYVR5cGUoXG4gICAgICAgICAgYFVuc3VwcG9ydGVkIGNvbnRlbnQtZW5jb2Rpbmc6ICR7ZW5jb2Rpbmd9YCxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHRoaXMuI3R5cGUgPT09IFwidW5kZWZpbmVkXCIgJiYgKCF0eXBlIHx8IHR5cGUgPT09IFwidW5kZWZpbmVkXCIpKSB7XG4gICAgICByZXR1cm4geyB0eXBlOiBcInVuZGVmaW5lZFwiLCB2YWx1ZTogdW5kZWZpbmVkIH07XG4gICAgfVxuICAgIGlmICghdHlwZSkge1xuICAgICAgY29uc3QgY29udGVudFR5cGUgPSB0aGlzLiNoZWFkZXJzLmdldChcImNvbnRlbnQtdHlwZVwiKTtcbiAgICAgIGlmICghY29udGVudFR5cGUpIHtcbiAgICAgICAgdGhyb3cgY3JlYXRlSHR0cEVycm9yKFxuICAgICAgICAgIFN0YXR1cy5CYWRSZXF1ZXN0LFxuICAgICAgICAgIFwiVGhlIENvbnRlbnQtVHlwZSBoZWFkZXIgaXMgbWlzc2luZyBmcm9tIHRoZSByZXF1ZXN0XCIsXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICB0eXBlID0gcmVzb2x2ZVR5cGUoY29udGVudFR5cGUsIGNvbnRlbnRUeXBlcyk7XG4gICAgfVxuICAgIGFzc2VydCh0eXBlKTtcbiAgICBjb25zdCBib2R5OiBCb2R5ID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyhib2R5LCB7XG4gICAgICB0eXBlOiB7XG4gICAgICAgIHZhbHVlOiB0eXBlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICB9LFxuICAgICAgdmFsdWU6IHtcbiAgICAgICAgZ2V0OiB0aGlzLiNwYXJzZSh0eXBlLCBsaW1pdCksXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgcmV0dXJuIGJvZHk7XG4gIH1cblxuICAvKiogUmV0dXJucyBpZiB0aGUgcmVxdWVzdCBtaWdodCBoYXZlIGEgYm9keSBvciBub3QsIHdpdGhvdXQgYXR0ZW1wdGluZyB0b1xuICAgKiBjb25zdW1lIGl0LlxuICAgKlxuICAgKiAqKldBUk5JTkcqKiBUaGlzIGlzIGFuIHVucmVsaWFibGUgQVBJLiBJbiBIVFRQLzIgaXQgaXMgbm90IHBvc3NpYmxlIHRvXG4gICAqIGRldGVybWluZSBpZiBjZXJ0YWluIEhUVFAgbWV0aG9kcyBoYXZlIGEgYm9keSBvciBub3Qgd2l0aG91dCBhdHRlbXB0aW5nIHRvXG4gICAqIHJlYWQgdGhlIGJvZHkuIEFzIG9mIERlbm8gMS4xNi4xIGFuZCBsYXRlciwgZm9yIEhUVFAvMS4xIGFsaWducyB0byB0aGVcbiAgICogSFRUUC8yIGJlaGF2aW91ci5cbiAgICovXG4gIGhhcygpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy4jYm9keSAhPSBudWxsO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEseUVBQXlFO0FBRXpFLFNBQ0UsZUFBZSxFQUNmLE1BQU0sRUFDTixzQkFBc0IsRUFDdEIsTUFBTSxRQUNELFlBQVk7QUFDbkIsU0FBUyxXQUFXLFFBQVEsbUJBQW1CO0FBQy9DLFNBQVMsY0FBYyxRQUFRLGlCQUFpQjtBQUVoRCxTQUFTLE1BQU0sUUFBUSxZQUFZO0FBcUluQyxNQUFNLGdCQUFnQixZQUFZLE9BQU87QUFFekMsTUFBTSwwQkFBMEI7SUFDOUIsTUFBTTtRQUFDO1FBQVE7UUFBc0I7S0FBeUI7SUFDOUQsTUFBTTtRQUFDO0tBQWE7SUFDcEIsVUFBVTtRQUFDO0tBQVk7SUFDdkIsTUFBTTtRQUFDO0tBQU87QUFDaEI7QUFFQSxTQUFTLFlBQ1AsV0FBbUIsRUFDbkIsWUFBcUM7SUFFckMsTUFBTSxtQkFBbUI7V0FDcEIsd0JBQXdCO1dBQ3ZCLGFBQWEsUUFBUSxFQUFFO0tBQzVCO0lBQ0QsTUFBTSxtQkFBbUI7V0FDcEIsd0JBQXdCO1dBQ3ZCLGFBQWEsUUFBUSxFQUFFO0tBQzVCO0lBQ0QsTUFBTSx1QkFBdUI7V0FDeEIsd0JBQXdCO1dBQ3ZCLGFBQWEsWUFBWSxFQUFFO0tBQ2hD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