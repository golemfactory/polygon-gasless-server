// Copyright 2021 Kitson P. Kelly. All rights reserved. MIT License.
// deno-lint-ignore-file no-explicit-any
import { charset, contentType } from "https://deno.land/x/media_types@v2.9.0/mod.ts";
function assert(cond, msg = "assertion failed") {
    if (!cond) {
        const err = new Error(msg);
        err.name = "AssertionError";
        throw err;
    }
}
function extractLength(response) {
    const values = response.headers.get("content-length")?.split(/\s*,\s*/) ?? [];
    let candidateValue = null;
    for (const value of values){
        if (candidateValue == null) {
            candidateValue = value;
        } else if (value !== candidateValue) {
            throw new Error("invalid content-length");
        }
    }
    if (candidateValue == "" || candidateValue == null) {
        return null;
    }
    const v = parseInt(candidateValue, 10);
    return Number.isNaN(v) ? null : v;
}
function getEssence(value) {
    return value.split(/\s*;\s*/)[0];
}
function extractMIMEType(headers) {
    let mimeType = null;
    const values = headers.get("content-type")?.split(/\s*,\s*/);
    if (!values) {
        throw new Error("missing content type");
    }
    for (const value of values){
        const temporaryMimeType = contentType(value);
        if (!temporaryMimeType || getEssence(temporaryMimeType) === "*/*") {
            continue;
        }
        mimeType = temporaryMimeType;
    }
    if (mimeType == null) {
        throw new Error("missing content type");
    }
    return mimeType;
}
function isHTMLMIMEType(value) {
    return getEssence(value) === "text/html";
}
function isXMLMIMEType(value) {
    const essence = getEssence(value);
    return essence.endsWith("+xml") || essence === "text/xml" || essence === "application/xml";
}
const decoder = new TextDecoder();
function parseJSONFromBytes(value) {
    const string = decoder.decode(value);
    return JSON.parse(string);
}
function appendBytes(...bytes) {
    let length = 0;
    for (const b of bytes){
        length += b.length;
    }
    const result = new Uint8Array(length);
    let offset = 0;
    for (const b of bytes){
        result.set(b, offset);
        offset += b.length;
    }
    return result;
}
class XMLHttpRequestEventTarget extends EventTarget {
    onabort = null;
    onerror = null;
    onload = null;
    onloadend = null;
    onloadstart = null;
    onprogress = null;
    ontimeout = null;
    dispatchEvent(evt) {
        if (evt instanceof ProgressEvent) {
            const xhr = this;
            switch(evt.type){
                case "abort":
                    if (this.onabort) {
                        this.onabort.call(xhr, evt);
                    }
                    break;
                case "error":
                    if (this.onerror) {
                        this.onerror.call(xhr, evt);
                    }
                    break;
                case "load":
                    if (this.onload) {
                        this.onload.call(xhr, evt);
                    }
                    break;
                case "loadend":
                    if (this.onloadend) {
                        this.onloadend.call(xhr, evt);
                    }
                    break;
                case "loadstart":
                    if (this.onloadstart) {
                        this.onloadstart.call(xhr, evt);
                    }
                    break;
                case "progress":
                    if (this.onprogress) {
                        this.onprogress.call(xhr, evt);
                    }
                    break;
                case "timeout":
                    if (this.ontimeout) {
                        this.ontimeout.call(xhr, evt);
                    }
            }
        }
        if (evt.cancelable && evt.defaultPrevented) {
            return false;
        } else {
            return super.dispatchEvent(evt);
        }
    }
}
class XMLHttpRequestUpload extends XMLHttpRequestEventTarget {
}
var State;
(function(State) {
    State[State["UNSENT"] = 0] = "UNSENT";
    State[State["OPENED"] = 1] = "OPENED";
    State[State["HEADERS_RECEIVED"] = 2] = "HEADERS_RECEIVED";
    State[State["LOADING"] = 3] = "LOADING";
    State[State["DONE"] = 4] = "DONE";
})(State || (State = {}));
const METHODS = [
    "GET",
    "HEAD",
    "POST",
    "DELETE",
    "OPTIONS",
    "PUT"
];
class XMLHttpRequest extends XMLHttpRequestEventTarget {
    #abortedFlag = false;
    #abortController;
    #crossOriginCredentials = false;
    #headers = new Headers();
    #mime;
    #receivedBytes = new Uint8Array();
    #requestMethod;
    #response;
    #responseObject = null;
    #responseType = "";
    #sendFlag = false;
    #state = State.UNSENT;
    #timedoutFlag = false;
    #timeout = 0;
    #upload = new XMLHttpRequestUpload();
    #uploadCompleteFlag = false;
    #uploadListener = false;
    #url;
    #getResponseMIMEType() {
        try {
            assert(this.#response);
            const mimeType = extractMIMEType(this.#response.headers);
            return mimeType;
        } catch  {
            return "text/xml";
        }
    }
    #getFinalMIMEType() {
        if (!this.#mime) {
            return this.#getResponseMIMEType();
        } else {
            return this.#mime;
        }
    }
    #getFinalEncoding() {
        return charset(this.#getFinalMIMEType())?.toLocaleLowerCase() ?? null;
    }
    #getTextResponse() {
        if (this.#response?.body == null) {
            return "";
        }
        let charset = this.#getFinalEncoding();
        if (this.#responseType === "" && charset == null && isXMLMIMEType(this.#getFinalMIMEType())) {
            charset = "utf-8";
        }
        charset = charset ?? "utf8";
        const decoder = new TextDecoder(charset);
        return decoder.decode(this.#receivedBytes);
    }
    #handleResponseEndOfBody() {
        assert(this.#response);
        const loaded = this.#receivedBytes.length;
        const total = extractLength(this.#response) ?? 0;
        this.dispatchEvent(new ProgressEvent("progress", {
            loaded,
            total
        }));
        this.#state = State.DONE;
        this.#sendFlag = false;
        this.dispatchEvent(new Event("readystatechange"));
        this.dispatchEvent(new ProgressEvent("load", {
            loaded,
            total
        }));
        this.dispatchEvent(new ProgressEvent("loadend", {
            loaded,
            total
        }));
    }
    #handleErrors() {
        if (!this.#sendFlag) {
            return;
        }
        if (this.#timedoutFlag) {
            this.#requestErrorSteps("timeout");
        } else if (this.#abortedFlag) {
            this.#requestErrorSteps("abort");
        } else {
            this.#requestErrorSteps("error");
        }
    }
    #requestErrorSteps(event) {
        this.#state = State.DONE;
        this.#sendFlag = false;
        this.dispatchEvent(new Event("readystatechange"));
        if (!this.#uploadCompleteFlag) {
            this.#uploadCompleteFlag = true;
            if (this.#uploadListener) {
                this.#upload.dispatchEvent(new ProgressEvent(event, {
                    loaded: 0,
                    total: 0
                }));
                this.#upload.dispatchEvent(new ProgressEvent("loadend", {
                    loaded: 0,
                    total: 0
                }));
            }
        }
        this.dispatchEvent(new ProgressEvent(event, {
            loaded: 0,
            total: 0
        }));
        this.dispatchEvent(new ProgressEvent("loadend", {
            loaded: 0,
            total: 0
        }));
    }
    #setDocumentResponse() {
        assert(this.#response);
        if (this.#response.body == null) {
            return;
        }
        const finalMIME = this.#getFinalMIMEType();
        if (!(isHTMLMIMEType(finalMIME) || isXMLMIMEType(finalMIME))) {
            return;
        }
        if (this.#responseType === "" && isHTMLMIMEType(finalMIME)) {
            return;
        }
        this.#responseObject = new DOMException("Document bodies are not supported", "SyntaxError");
    }
    #terminate() {
        if (this.#abortController) {
            this.#abortController.abort();
            this.#abortController = undefined;
        }
    }
    onreadystatechange = null;
    get readyState() {
        return this.#state;
    }
    get response() {
        if (this.#responseType === "" || this.#responseType === "text") {
            if (!(this.#state === State.LOADING || this.#state === State.DONE)) {
                return "";
            }
            return this.#getTextResponse();
        }
        if (this.#state !== State.DONE) {
            return null;
        }
        if (this.#responseObject instanceof Error) {
            return null;
        }
        if (this.#responseObject != null) {
            return this.#responseObject;
        }
        if (this.#responseType === "arraybuffer") {
            try {
                this.#responseObject = this.#receivedBytes.buffer.slice(this.#receivedBytes.byteOffset, this.#receivedBytes.byteLength + this.#receivedBytes.byteOffset);
            } catch (e) {
                this.#responseObject = e;
                return null;
            }
        } else if (this.#responseType === "blob") {
            this.#responseObject = new Blob([
                this.#receivedBytes
            ], {
                type: this.#getFinalMIMEType()
            });
        } else if (this.#responseType === "document") {
            this.#setDocumentResponse();
        } else {
            assert(this.#responseType === "json");
            if (this.#response?.body == null) {
                return null;
            }
            let jsonObject;
            try {
                jsonObject = parseJSONFromBytes(this.#receivedBytes);
            } catch  {
                return null;
            }
            this.#responseObject = jsonObject;
        }
        return this.#responseObject instanceof Error ? null : this.#responseObject;
    }
    get responseText() {
        if (!(this.#responseType === "" || this.#responseType === "text")) {
            throw new DOMException("Response type is not set properly", "InvalidStateError");
        }
        if (!(this.#state === State.LOADING || this.#state === State.DONE)) {
            return "";
        }
        return this.#getTextResponse();
    }
    get responseType() {
        return this.#responseType;
    }
    set responseType(value) {
        if (value === "document") {
            return;
        }
        if (this.#state === State.LOADING || this.#state === State.DONE) {
            throw new DOMException("The response type cannot be changed when loading or done", "InvalidStateError");
        }
        this.#responseType = value;
    }
    get responseURL() {
        return this.#response?.url ?? "";
    }
    get responseXML() {
        if (!(this.#responseType === "" || this.#responseType === "document")) {
            throw new DOMException("Response type is not properly set", "InvalidStateError");
        }
        if (this.#state !== State.DONE) {
            return null;
        }
        if (this.#setDocumentResponse instanceof Error) {
            return null;
        }
        this.#setDocumentResponse();
        return null;
    }
    get status() {
        return this.#response?.status ?? 0;
    }
    get statusText() {
        return this.#response?.statusText ?? "";
    }
    get timeout() {
        return this.#timeout;
    }
    set timeout(value) {
        this.#timeout = value;
    }
    get upload() {
        return this.#upload;
    }
    get withCredentials() {
        return this.#crossOriginCredentials;
    }
    set withCredentials(value) {
        if (!(this.#state === State.UNSENT || this.#state === State.OPENED)) {
            throw new DOMException("The request is not unsent or opened", "InvalidStateError");
        }
        if (this.#sendFlag) {
            throw new DOMException("The request has been sent", "InvalidStateError");
        }
        this.#crossOriginCredentials = value;
    }
    abort() {
        this.#terminate();
        if (this.#state === State.OPENED && this.#sendFlag || this.#state === State.HEADERS_RECEIVED || this.#state === State.LOADING) {
            this.#requestErrorSteps("abort");
        }
        if (this.#state === State.DONE) {
            this.#state = State.UNSENT;
            this.#response = undefined;
        }
    }
    dispatchEvent(evt) {
        switch(evt.type){
            case "readystatechange":
                if (this.onreadystatechange) {
                    this.onreadystatechange.call(this, evt);
                }
                break;
        }
        if (evt.cancelable && evt.defaultPrevented) {
            return false;
        } else {
            return super.dispatchEvent(evt);
        }
    }
    getAllResponseHeaders() {
        if (!this.#response) {
            return null;
        }
        const headers = [
            ...this.#response.headers
        ];
        headers.sort(([a], [b])=>a.localeCompare(b));
        return headers.map(([key, value])=>`${key}: ${value}`).join("\r\n");
    }
    getResponseHeader(name) {
        return this.#response?.headers.get(name) ?? null;
    }
    open(method, url, async = true, username = null, password = null) {
        method = method.toLocaleUpperCase();
        if (!METHODS.includes(method)) {
            throw new DOMException(`The method "${method}" is not allowed.`, "SyntaxError");
        }
        let parsedUrl;
        try {
            let base;
            try {
                base = window.location.toString();
            } catch  {
            // we just want to avoid the error about location in Deno
            }
            parsedUrl = new URL(url, base);
        } catch  {
            throw new DOMException(`The url "${url}" is invalid.`, "SyntaxError");
        }
        if (username != null) {
            parsedUrl.username = username;
        }
        if (password != null) {
            parsedUrl.password = password;
        }
        if (async === false) {
            throw new DOMException("The polyfill does not support sync operation.", "InvalidAccessError");
        }
        this.#terminate();
        this.#sendFlag = false;
        this.#uploadListener = false;
        this.#requestMethod = method;
        this.#url = parsedUrl;
        this.#headers = new Headers();
        this.#response = undefined;
        this.#state = State.OPENED;
        this.dispatchEvent(new Event("readystatechange"));
    }
    overrideMimeType(mime) {
        if (this.#state === State.LOADING || this.#state === State.DONE) {
            throw new DOMException("The request is in an invalid state", "InvalidStateError");
        }
        this.#mime = contentType(mime) ?? "application/octet-stream";
    }
    send(body = null) {
        if (this.#state !== State.OPENED) {
            throw new DOMException("Invalid state", "InvalidStateError");
        }
        if (this.#sendFlag) {
            throw new DOMException("Invalid state", "InvalidStateError");
        }
        if (this.#requestMethod === "GET" || this.#requestMethod === "HEAD") {
            body = null;
        }
        const abortController = this.#abortController = new AbortController();
        const req = new Request(this.#url.toString(), {
            method: this.#requestMethod,
            headers: this.#headers,
            body,
            mode: "cors",
            credentials: this.#crossOriginCredentials ? "include" : "same-origin",
            signal: abortController.signal
        });
        this.#uploadCompleteFlag = false;
        this.#timedoutFlag = false;
        if (req.body == null) {
            this.#uploadCompleteFlag = true;
        }
        this.#sendFlag = true;
        this.dispatchEvent(new ProgressEvent("loadstart", {
            loaded: 0,
            total: 0
        }));
        this.#upload.dispatchEvent(new ProgressEvent("loadstart", {
            loaded: 0,
            total: 0
        }));
        if (this.#state !== State.OPENED || !this.#sendFlag) {
            return;
        }
        const processRequestEndOfBody = ()=>{
            this.#uploadCompleteFlag = true;
            if (!this.#uploadListener) {
                return;
            }
            this.#upload.dispatchEvent(new ProgressEvent("progress", {
                loaded: 0,
                total: 0
            }));
            this.#upload.dispatchEvent(new ProgressEvent("load", {
                loaded: 0,
                total: 0
            }));
            this.#upload.dispatchEvent(new ProgressEvent("loadend", {
                loaded: 0,
                total: 0
            }));
        };
        const processResponse = async (response)=>{
            this.#response = response;
            this.#state = State.HEADERS_RECEIVED;
            this.dispatchEvent(new Event("readystatechange"));
            if (this.#state !== State.HEADERS_RECEIVED) {
                return;
            }
            if (response.body == null) {
                this.#handleResponseEndOfBody();
                return;
            }
            const total = extractLength(this.#response) ?? 0;
            let lastInvoked = 0;
            const processBodyChunk = (bytes)=>{
                this.#receivedBytes = appendBytes(this.#receivedBytes, bytes);
                if (Date.now() - lastInvoked <= 50) {
                    return;
                }
                lastInvoked = Date.now();
                if (this.#state === State.HEADERS_RECEIVED) {
                    this.#state = State.LOADING;
                }
                this.dispatchEvent(new Event("readystatechange"));
                this.dispatchEvent(new ProgressEvent("progress", {
                    loaded: this.#receivedBytes.length,
                    total
                }));
            };
            const processEndOfBody = ()=>{
                this.#handleResponseEndOfBody();
            };
            const processBodyError = ()=>{
                this.#handleErrors();
            };
            try {
                for await (const bytes of response.body){
                    processBodyChunk(bytes);
                }
                processEndOfBody();
            } catch  {
                processBodyError();
            }
        };
        const processRejection = ()=>{
            this.#handleErrors();
        };
        const p = fetch(req).then((response)=>{
            processRequestEndOfBody();
            return processResponse(response);
        }).catch(processRejection);
        if (this.#timeout > 0) {
            const t = new Promise((res)=>{
                setTimeout(()=>res(true), this.#timeout);
            });
            Promise.race([
                p,
                t
            ]).then((value)=>{
                if (value) {
                    this.#timedoutFlag = true;
                    this.#terminate();
                }
            });
        }
    }
    setRequestHeader(name, value) {
        if (this.#state !== State.OPENED) {
            throw new DOMException("Invalid state", "InvalidStateError");
        }
        if (this.#sendFlag) {
            throw new DOMException("Invalid state", "InvalidateStateError");
        }
        this.#headers.append(name, value);
    }
    get DONE() {
        return State.DONE;
    }
    get HEADERS_RECEIVED() {
        return State.HEADERS_RECEIVED;
    }
    get LOADING() {
        return State.LOADING;
    }
    get OPENED() {
        return State.OPENED;
    }
    get UNSENT() {
        return State.UNSENT;
    }
    static get DONE() {
        return State.DONE;
    }
    static get HEADERS_RECEIVED() {
        return State.HEADERS_RECEIVED;
    }
    static get LOADING() {
        return State.LOADING;
    }
    static get OPENED() {
        return State.OPENED;
    }
    static get UNSENT() {
        return State.UNSENT;
    }
}
// deno-lint-ignore ban-types
function maybeDefine(value, scope) {
    const name = value.name;
    if (!(name in globalThis)) {
        Object.defineProperty(scope, name, {
            value,
            writable: true,
            configurable: true,
            enumerable: false
        });
    }
}
maybeDefine(XMLHttpRequest, globalThis);
maybeDefine(XMLHttpRequestEventTarget, globalThis);
maybeDefine(XMLHttpRequestUpload, globalThis);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gveGhyQDAuMS4wL21vZC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMSBLaXRzb24gUC4gS2VsbHkuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBMaWNlbnNlLlxuXG4vLyBkZW5vLWxpbnQtaWdub3JlLWZpbGUgbm8tZXhwbGljaXQtYW55XG5cbmltcG9ydCB7XG4gIGNoYXJzZXQsXG4gIGNvbnRlbnRUeXBlLFxufSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQveC9tZWRpYV90eXBlc0B2Mi45LjAvbW9kLnRzXCI7XG5cbnR5cGUgWE1MSHR0cFJlcXVlc3RSZXNwb25zZVR5cGUgPVxuICB8IFwiXCJcbiAgfCBcImFycmF5YnVmZmVyXCJcbiAgfCBcImJsb2JcIlxuICB8IFwiZG9jdW1lbnRcIlxuICB8IFwianNvblwiXG4gIHwgXCJ0ZXh0XCI7XG5cbmZ1bmN0aW9uIGFzc2VydChjb25kOiB1bmtub3duLCBtc2cgPSBcImFzc2VydGlvbiBmYWlsZWRcIik6IGFzc2VydHMgY29uZCB7XG4gIGlmICghY29uZCkge1xuICAgIGNvbnN0IGVyciA9IG5ldyBFcnJvcihtc2cpO1xuICAgIGVyci5uYW1lID0gXCJBc3NlcnRpb25FcnJvclwiO1xuICAgIHRocm93IGVycjtcbiAgfVxufVxuXG5mdW5jdGlvbiBleHRyYWN0TGVuZ3RoKHJlc3BvbnNlOiBSZXNwb25zZSkge1xuICBjb25zdCB2YWx1ZXMgPSByZXNwb25zZS5oZWFkZXJzLmdldChcImNvbnRlbnQtbGVuZ3RoXCIpPy5zcGxpdCgvXFxzKixcXHMqLykgPz8gW107XG4gIGxldCBjYW5kaWRhdGVWYWx1ZTogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gIGZvciAoY29uc3QgdmFsdWUgb2YgdmFsdWVzKSB7XG4gICAgaWYgKGNhbmRpZGF0ZVZhbHVlID09IG51bGwpIHtcbiAgICAgIGNhbmRpZGF0ZVZhbHVlID0gdmFsdWU7XG4gICAgfSBlbHNlIGlmICh2YWx1ZSAhPT0gY2FuZGlkYXRlVmFsdWUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcImludmFsaWQgY29udGVudC1sZW5ndGhcIik7XG4gICAgfVxuICB9XG4gIGlmIChjYW5kaWRhdGVWYWx1ZSA9PSBcIlwiIHx8IGNhbmRpZGF0ZVZhbHVlID09IG51bGwpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICBjb25zdCB2ID0gcGFyc2VJbnQoY2FuZGlkYXRlVmFsdWUsIDEwKTtcbiAgcmV0dXJuIE51bWJlci5pc05hTih2KSA/IG51bGwgOiB2O1xufVxuXG5mdW5jdGlvbiBnZXRFc3NlbmNlKHZhbHVlOiBzdHJpbmcpIHtcbiAgcmV0dXJuIHZhbHVlLnNwbGl0KC9cXHMqO1xccyovKVswXTtcbn1cblxuZnVuY3Rpb24gZXh0cmFjdE1JTUVUeXBlKGhlYWRlcnM6IEhlYWRlcnMpIHtcbiAgbGV0IG1pbWVUeXBlOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgY29uc3QgdmFsdWVzID0gaGVhZGVycy5nZXQoXCJjb250ZW50LXR5cGVcIik/LnNwbGl0KC9cXHMqLFxccyovKTtcbiAgaWYgKCF2YWx1ZXMpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJtaXNzaW5nIGNvbnRlbnQgdHlwZVwiKTtcbiAgfVxuICBmb3IgKGNvbnN0IHZhbHVlIG9mIHZhbHVlcykge1xuICAgIGNvbnN0IHRlbXBvcmFyeU1pbWVUeXBlID0gY29udGVudFR5cGUodmFsdWUpO1xuICAgIGlmICghdGVtcG9yYXJ5TWltZVR5cGUgfHwgZ2V0RXNzZW5jZSh0ZW1wb3JhcnlNaW1lVHlwZSkgPT09IFwiKi8qXCIpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBtaW1lVHlwZSA9IHRlbXBvcmFyeU1pbWVUeXBlO1xuICB9XG4gIGlmIChtaW1lVHlwZSA9PSBudWxsKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwibWlzc2luZyBjb250ZW50IHR5cGVcIik7XG4gIH1cbiAgcmV0dXJuIG1pbWVUeXBlO1xufVxuXG5mdW5jdGlvbiBpc0hUTUxNSU1FVHlwZSh2YWx1ZTogc3RyaW5nKSB7XG4gIHJldHVybiBnZXRFc3NlbmNlKHZhbHVlKSA9PT0gXCJ0ZXh0L2h0bWxcIjtcbn1cblxuZnVuY3Rpb24gaXNYTUxNSU1FVHlwZSh2YWx1ZTogc3RyaW5nKSB7XG4gIGNvbnN0IGVzc2VuY2UgPSBnZXRFc3NlbmNlKHZhbHVlKTtcbiAgcmV0dXJuIGVzc2VuY2UuZW5kc1dpdGgoXCIreG1sXCIpIHx8IGVzc2VuY2UgPT09IFwidGV4dC94bWxcIiB8fFxuICAgIGVzc2VuY2UgPT09IFwiYXBwbGljYXRpb24veG1sXCI7XG59XG5cbmNvbnN0IGRlY29kZXIgPSBuZXcgVGV4dERlY29kZXIoKTtcblxuZnVuY3Rpb24gcGFyc2VKU09ORnJvbUJ5dGVzKHZhbHVlOiBVaW50OEFycmF5KTogYW55IHtcbiAgY29uc3Qgc3RyaW5nID0gZGVjb2Rlci5kZWNvZGUodmFsdWUpO1xuICByZXR1cm4gSlNPTi5wYXJzZShzdHJpbmcpO1xufVxuXG5mdW5jdGlvbiBhcHBlbmRCeXRlcyguLi5ieXRlczogVWludDhBcnJheVtdKTogVWludDhBcnJheSB7XG4gIGxldCBsZW5ndGggPSAwO1xuICBmb3IgKGNvbnN0IGIgb2YgYnl0ZXMpIHtcbiAgICBsZW5ndGggKz0gYi5sZW5ndGg7XG4gIH1cbiAgY29uc3QgcmVzdWx0ID0gbmV3IFVpbnQ4QXJyYXkobGVuZ3RoKTtcbiAgbGV0IG9mZnNldCA9IDA7XG4gIGZvciAoY29uc3QgYiBvZiBieXRlcykge1xuICAgIHJlc3VsdC5zZXQoYiwgb2Zmc2V0KTtcbiAgICBvZmZzZXQgKz0gYi5sZW5ndGg7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuY2xhc3MgWE1MSHR0cFJlcXVlc3RFdmVudFRhcmdldCBleHRlbmRzIEV2ZW50VGFyZ2V0IHtcbiAgb25hYm9ydDogKCh0aGlzOiBYTUxIdHRwUmVxdWVzdCwgZXY6IFByb2dyZXNzRXZlbnQpID0+IGFueSkgfCBudWxsID0gbnVsbDtcbiAgb25lcnJvcjogKCh0aGlzOiBYTUxIdHRwUmVxdWVzdCwgZXY6IFByb2dyZXNzRXZlbnQpID0+IGFueSkgfCBudWxsID0gbnVsbDtcbiAgb25sb2FkOiAoKHRoaXM6IFhNTEh0dHBSZXF1ZXN0LCBldjogUHJvZ3Jlc3NFdmVudCkgPT4gYW55KSB8IG51bGwgPSBudWxsO1xuICBvbmxvYWRlbmQ6ICgodGhpczogWE1MSHR0cFJlcXVlc3QsIGV2OiBQcm9ncmVzc0V2ZW50KSA9PiBhbnkpIHwgbnVsbCA9IG51bGw7XG4gIG9ubG9hZHN0YXJ0OiAoKHRoaXM6IFhNTEh0dHBSZXF1ZXN0LCBldjogUHJvZ3Jlc3NFdmVudCkgPT4gYW55KSB8IG51bGwgPSBudWxsO1xuICBvbnByb2dyZXNzOiAoKHRoaXM6IFhNTEh0dHBSZXF1ZXN0LCBldjogUHJvZ3Jlc3NFdmVudCkgPT4gYW55KSB8IG51bGwgPSBudWxsO1xuICBvbnRpbWVvdXQ6ICgodGhpczogWE1MSHR0cFJlcXVlc3QsIGV2OiBQcm9ncmVzc0V2ZW50KSA9PiBhbnkpIHwgbnVsbCA9IG51bGw7XG5cbiAgZGlzcGF0Y2hFdmVudChldnQ6IEV2ZW50KSB7XG4gICAgaWYgKGV2dCBpbnN0YW5jZW9mIFByb2dyZXNzRXZlbnQpIHtcbiAgICAgIGNvbnN0IHhocjogWE1MSHR0cFJlcXVlc3QgPSB0aGlzIGFzIGFueTtcbiAgICAgIHN3aXRjaCAoZXZ0LnR5cGUpIHtcbiAgICAgICAgY2FzZSBcImFib3J0XCI6XG4gICAgICAgICAgaWYgKHRoaXMub25hYm9ydCkge1xuICAgICAgICAgICAgdGhpcy5vbmFib3J0LmNhbGwoeGhyLCBldnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImVycm9yXCI6XG4gICAgICAgICAgaWYgKHRoaXMub25lcnJvcikge1xuICAgICAgICAgICAgdGhpcy5vbmVycm9yLmNhbGwoeGhyLCBldnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImxvYWRcIjpcbiAgICAgICAgICBpZiAodGhpcy5vbmxvYWQpIHtcbiAgICAgICAgICAgIHRoaXMub25sb2FkLmNhbGwoeGhyLCBldnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImxvYWRlbmRcIjpcbiAgICAgICAgICBpZiAodGhpcy5vbmxvYWRlbmQpIHtcbiAgICAgICAgICAgIHRoaXMub25sb2FkZW5kLmNhbGwoeGhyLCBldnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImxvYWRzdGFydFwiOlxuICAgICAgICAgIGlmICh0aGlzLm9ubG9hZHN0YXJ0KSB7XG4gICAgICAgICAgICB0aGlzLm9ubG9hZHN0YXJ0LmNhbGwoeGhyLCBldnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcInByb2dyZXNzXCI6XG4gICAgICAgICAgaWYgKHRoaXMub25wcm9ncmVzcykge1xuICAgICAgICAgICAgdGhpcy5vbnByb2dyZXNzLmNhbGwoeGhyLCBldnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcInRpbWVvdXRcIjpcbiAgICAgICAgICBpZiAodGhpcy5vbnRpbWVvdXQpIHtcbiAgICAgICAgICAgIHRoaXMub250aW1lb3V0LmNhbGwoeGhyLCBldnQpO1xuICAgICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGV2dC5jYW5jZWxhYmxlICYmIGV2dC5kZWZhdWx0UHJldmVudGVkKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBzdXBlci5kaXNwYXRjaEV2ZW50KGV2dCk7XG4gICAgfVxuICB9XG59XG5cbmNsYXNzIFhNTEh0dHBSZXF1ZXN0VXBsb2FkIGV4dGVuZHMgWE1MSHR0cFJlcXVlc3RFdmVudFRhcmdldCB7XG59XG5cbmVudW0gU3RhdGUge1xuICBVTlNFTlQgPSAwLFxuICBPUEVORUQgPSAxLFxuICBIRUFERVJTX1JFQ0VJVkVEID0gMixcbiAgTE9BRElORyA9IDMsXG4gIERPTkUgPSA0LFxufVxuXG5jb25zdCBNRVRIT0RTID0gW1wiR0VUXCIsIFwiSEVBRFwiLCBcIlBPU1RcIiwgXCJERUxFVEVcIiwgXCJPUFRJT05TXCIsIFwiUFVUXCJdO1xuXG5jbGFzcyBYTUxIdHRwUmVxdWVzdCBleHRlbmRzIFhNTEh0dHBSZXF1ZXN0RXZlbnRUYXJnZXQge1xuICAjYWJvcnRlZEZsYWcgPSBmYWxzZTtcbiAgI2Fib3J0Q29udHJvbGxlcj86IEFib3J0Q29udHJvbGxlcjtcbiAgI2Nyb3NzT3JpZ2luQ3JlZGVudGlhbHMgPSBmYWxzZTtcbiAgI2hlYWRlcnMgPSBuZXcgSGVhZGVycygpO1xuICAjbWltZT86IHN0cmluZztcbiAgI3JlY2VpdmVkQnl0ZXMgPSBuZXcgVWludDhBcnJheSgpO1xuICAjcmVxdWVzdE1ldGhvZD86IHN0cmluZztcbiAgI3Jlc3BvbnNlPzogUmVzcG9uc2U7XG4gICNyZXNwb25zZU9iamVjdDogYW55ID0gbnVsbDtcbiAgI3Jlc3BvbnNlVHlwZTogWE1MSHR0cFJlcXVlc3RSZXNwb25zZVR5cGUgPSBcIlwiO1xuICAjc2VuZEZsYWcgPSBmYWxzZTtcbiAgI3N0YXRlID0gU3RhdGUuVU5TRU5UO1xuICAjdGltZWRvdXRGbGFnID0gZmFsc2U7XG4gICN0aW1lb3V0ID0gMDtcbiAgI3VwbG9hZCA9IG5ldyBYTUxIdHRwUmVxdWVzdFVwbG9hZCgpO1xuICAjdXBsb2FkQ29tcGxldGVGbGFnID0gZmFsc2U7XG4gICN1cGxvYWRMaXN0ZW5lciA9IGZhbHNlO1xuICAjdXJsPzogVVJMO1xuXG4gICNnZXRSZXNwb25zZU1JTUVUeXBlKCkge1xuICAgIHRyeSB7XG4gICAgICBhc3NlcnQodGhpcy4jcmVzcG9uc2UpO1xuICAgICAgY29uc3QgbWltZVR5cGUgPSBleHRyYWN0TUlNRVR5cGUodGhpcy4jcmVzcG9uc2UuaGVhZGVycyk7XG4gICAgICByZXR1cm4gbWltZVR5cGU7XG4gICAgfSBjYXRjaCB7XG4gICAgICByZXR1cm4gXCJ0ZXh0L3htbFwiO1xuICAgIH1cbiAgfVxuXG4gICNnZXRGaW5hbE1JTUVUeXBlKCkge1xuICAgIGlmICghdGhpcy4jbWltZSkge1xuICAgICAgcmV0dXJuIHRoaXMuI2dldFJlc3BvbnNlTUlNRVR5cGUoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuI21pbWU7XG4gICAgfVxuICB9XG5cbiAgI2dldEZpbmFsRW5jb2RpbmcoKSB7XG4gICAgcmV0dXJuIGNoYXJzZXQodGhpcy4jZ2V0RmluYWxNSU1FVHlwZSgpKT8udG9Mb2NhbGVMb3dlckNhc2UoKSA/PyBudWxsO1xuICB9XG5cbiAgI2dldFRleHRSZXNwb25zZSgpIHtcbiAgICBpZiAodGhpcy4jcmVzcG9uc2U/LmJvZHkgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuICAgIGxldCBjaGFyc2V0ID0gdGhpcy4jZ2V0RmluYWxFbmNvZGluZygpO1xuICAgIGlmIChcbiAgICAgIHRoaXMuI3Jlc3BvbnNlVHlwZSA9PT0gXCJcIiAmJiBjaGFyc2V0ID09IG51bGwgJiZcbiAgICAgIGlzWE1MTUlNRVR5cGUodGhpcy4jZ2V0RmluYWxNSU1FVHlwZSgpKVxuICAgICkge1xuICAgICAgY2hhcnNldCA9IFwidXRmLThcIjtcbiAgICB9XG4gICAgY2hhcnNldCA9IGNoYXJzZXQgPz8gXCJ1dGY4XCI7XG4gICAgY29uc3QgZGVjb2RlciA9IG5ldyBUZXh0RGVjb2RlcihjaGFyc2V0KTtcbiAgICByZXR1cm4gZGVjb2Rlci5kZWNvZGUodGhpcy4jcmVjZWl2ZWRCeXRlcyk7XG4gIH1cblxuICAjaGFuZGxlUmVzcG9uc2VFbmRPZkJvZHkoKSB7XG4gICAgYXNzZXJ0KHRoaXMuI3Jlc3BvbnNlKTtcbiAgICBjb25zdCBsb2FkZWQgPSB0aGlzLiNyZWNlaXZlZEJ5dGVzLmxlbmd0aDtcbiAgICBjb25zdCB0b3RhbCA9IGV4dHJhY3RMZW5ndGgodGhpcy4jcmVzcG9uc2UpID8/IDA7XG4gICAgdGhpcy5kaXNwYXRjaEV2ZW50KG5ldyBQcm9ncmVzc0V2ZW50KFwicHJvZ3Jlc3NcIiwgeyBsb2FkZWQsIHRvdGFsIH0pKTtcbiAgICB0aGlzLiNzdGF0ZSA9IFN0YXRlLkRPTkU7XG4gICAgdGhpcy4jc2VuZEZsYWcgPSBmYWxzZTtcbiAgICB0aGlzLmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KFwicmVhZHlzdGF0ZWNoYW5nZVwiKSk7XG4gICAgdGhpcy5kaXNwYXRjaEV2ZW50KG5ldyBQcm9ncmVzc0V2ZW50KFwibG9hZFwiLCB7IGxvYWRlZCwgdG90YWwgfSkpO1xuICAgIHRoaXMuZGlzcGF0Y2hFdmVudChuZXcgUHJvZ3Jlc3NFdmVudChcImxvYWRlbmRcIiwgeyBsb2FkZWQsIHRvdGFsIH0pKTtcbiAgfVxuXG4gICNoYW5kbGVFcnJvcnMoKSB7XG4gICAgaWYgKCF0aGlzLiNzZW5kRmxhZykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodGhpcy4jdGltZWRvdXRGbGFnKSB7XG4gICAgICB0aGlzLiNyZXF1ZXN0RXJyb3JTdGVwcyhcInRpbWVvdXRcIik7XG4gICAgfSBlbHNlIGlmICh0aGlzLiNhYm9ydGVkRmxhZykge1xuICAgICAgdGhpcy4jcmVxdWVzdEVycm9yU3RlcHMoXCJhYm9ydFwiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy4jcmVxdWVzdEVycm9yU3RlcHMoXCJlcnJvclwiKTtcbiAgICB9XG4gIH1cblxuICAjcmVxdWVzdEVycm9yU3RlcHMoZXZlbnQ6IHN0cmluZykge1xuICAgIHRoaXMuI3N0YXRlID0gU3RhdGUuRE9ORTtcbiAgICB0aGlzLiNzZW5kRmxhZyA9IGZhbHNlO1xuICAgIHRoaXMuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoXCJyZWFkeXN0YXRlY2hhbmdlXCIpKTtcbiAgICBpZiAoIXRoaXMuI3VwbG9hZENvbXBsZXRlRmxhZykge1xuICAgICAgdGhpcy4jdXBsb2FkQ29tcGxldGVGbGFnID0gdHJ1ZTtcbiAgICAgIGlmICh0aGlzLiN1cGxvYWRMaXN0ZW5lcikge1xuICAgICAgICB0aGlzLiN1cGxvYWQuZGlzcGF0Y2hFdmVudChcbiAgICAgICAgICBuZXcgUHJvZ3Jlc3NFdmVudChldmVudCwgeyBsb2FkZWQ6IDAsIHRvdGFsOiAwIH0pLFxuICAgICAgICApO1xuICAgICAgICB0aGlzLiN1cGxvYWQuZGlzcGF0Y2hFdmVudChcbiAgICAgICAgICBuZXcgUHJvZ3Jlc3NFdmVudChcImxvYWRlbmRcIiwgeyBsb2FkZWQ6IDAsIHRvdGFsOiAwIH0pLFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmRpc3BhdGNoRXZlbnQobmV3IFByb2dyZXNzRXZlbnQoZXZlbnQsIHsgbG9hZGVkOiAwLCB0b3RhbDogMCB9KSk7XG4gICAgdGhpcy5kaXNwYXRjaEV2ZW50KG5ldyBQcm9ncmVzc0V2ZW50KFwibG9hZGVuZFwiLCB7IGxvYWRlZDogMCwgdG90YWw6IDAgfSkpO1xuICB9XG5cbiAgI3NldERvY3VtZW50UmVzcG9uc2UoKSB7XG4gICAgYXNzZXJ0KHRoaXMuI3Jlc3BvbnNlKTtcbiAgICBpZiAodGhpcy4jcmVzcG9uc2UuYm9keSA9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGZpbmFsTUlNRSA9IHRoaXMuI2dldEZpbmFsTUlNRVR5cGUoKTtcbiAgICBpZiAoIShpc0hUTUxNSU1FVHlwZShmaW5hbE1JTUUpIHx8IGlzWE1MTUlNRVR5cGUoZmluYWxNSU1FKSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHRoaXMuI3Jlc3BvbnNlVHlwZSA9PT0gXCJcIiAmJiBpc0hUTUxNSU1FVHlwZShmaW5hbE1JTUUpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuI3Jlc3BvbnNlT2JqZWN0ID0gbmV3IERPTUV4Y2VwdGlvbihcbiAgICAgIFwiRG9jdW1lbnQgYm9kaWVzIGFyZSBub3Qgc3VwcG9ydGVkXCIsXG4gICAgICBcIlN5bnRheEVycm9yXCIsXG4gICAgKTtcbiAgfVxuXG4gICN0ZXJtaW5hdGUoKSB7XG4gICAgaWYgKHRoaXMuI2Fib3J0Q29udHJvbGxlcikge1xuICAgICAgdGhpcy4jYWJvcnRDb250cm9sbGVyLmFib3J0KCk7XG4gICAgICB0aGlzLiNhYm9ydENvbnRyb2xsZXIgPSB1bmRlZmluZWQ7XG4gICAgfVxuICB9XG5cbiAgb25yZWFkeXN0YXRlY2hhbmdlOiAoKHRoaXM6IFhNTEh0dHBSZXF1ZXN0LCBldjogRXZlbnQpID0+IGFueSkgfCBudWxsID0gbnVsbDtcblxuICBnZXQgcmVhZHlTdGF0ZSgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLiNzdGF0ZTtcbiAgfVxuXG4gIGdldCByZXNwb25zZSgpOiBhbnkge1xuICAgIGlmICh0aGlzLiNyZXNwb25zZVR5cGUgPT09IFwiXCIgfHwgdGhpcy4jcmVzcG9uc2VUeXBlID09PSBcInRleHRcIikge1xuICAgICAgaWYgKCEodGhpcy4jc3RhdGUgPT09IFN0YXRlLkxPQURJTkcgfHwgdGhpcy4jc3RhdGUgPT09IFN0YXRlLkRPTkUpKSB7XG4gICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuI2dldFRleHRSZXNwb25zZSgpO1xuICAgIH1cbiAgICBpZiAodGhpcy4jc3RhdGUgIT09IFN0YXRlLkRPTkUpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBpZiAodGhpcy4jcmVzcG9uc2VPYmplY3QgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGlmICh0aGlzLiNyZXNwb25zZU9iamVjdCAhPSBudWxsKSB7XG4gICAgICByZXR1cm4gdGhpcy4jcmVzcG9uc2VPYmplY3Q7XG4gICAgfVxuICAgIGlmICh0aGlzLiNyZXNwb25zZVR5cGUgPT09IFwiYXJyYXlidWZmZXJcIikge1xuICAgICAgdHJ5IHtcbiAgICAgICAgdGhpcy4jcmVzcG9uc2VPYmplY3QgPSB0aGlzLiNyZWNlaXZlZEJ5dGVzLmJ1ZmZlci5zbGljZShcbiAgICAgICAgICB0aGlzLiNyZWNlaXZlZEJ5dGVzLmJ5dGVPZmZzZXQsXG4gICAgICAgICAgdGhpcy4jcmVjZWl2ZWRCeXRlcy5ieXRlTGVuZ3RoICsgdGhpcy4jcmVjZWl2ZWRCeXRlcy5ieXRlT2Zmc2V0LFxuICAgICAgICApO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICB0aGlzLiNyZXNwb25zZU9iamVjdCA9IGU7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodGhpcy4jcmVzcG9uc2VUeXBlID09PSBcImJsb2JcIikge1xuICAgICAgdGhpcy4jcmVzcG9uc2VPYmplY3QgPSBuZXcgQmxvYihbdGhpcy4jcmVjZWl2ZWRCeXRlc10sIHtcbiAgICAgICAgdHlwZTogdGhpcy4jZ2V0RmluYWxNSU1FVHlwZSgpLFxuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmICh0aGlzLiNyZXNwb25zZVR5cGUgPT09IFwiZG9jdW1lbnRcIikge1xuICAgICAgdGhpcy4jc2V0RG9jdW1lbnRSZXNwb25zZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBhc3NlcnQodGhpcy4jcmVzcG9uc2VUeXBlID09PSBcImpzb25cIik7XG4gICAgICBpZiAodGhpcy4jcmVzcG9uc2U/LmJvZHkgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICAgIGxldCBqc29uT2JqZWN0O1xuICAgICAgdHJ5IHtcbiAgICAgICAganNvbk9iamVjdCA9IHBhcnNlSlNPTkZyb21CeXRlcyh0aGlzLiNyZWNlaXZlZEJ5dGVzKTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICAgIHRoaXMuI3Jlc3BvbnNlT2JqZWN0ID0ganNvbk9iamVjdDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuI3Jlc3BvbnNlT2JqZWN0IGluc3RhbmNlb2YgRXJyb3IgPyBudWxsIDogdGhpcy4jcmVzcG9uc2VPYmplY3Q7XG4gIH1cblxuICBnZXQgcmVzcG9uc2VUZXh0KCk6IHN0cmluZyB7XG4gICAgaWYgKCEodGhpcy4jcmVzcG9uc2VUeXBlID09PSBcIlwiIHx8IHRoaXMuI3Jlc3BvbnNlVHlwZSA9PT0gXCJ0ZXh0XCIpKSB7XG4gICAgICB0aHJvdyBuZXcgRE9NRXhjZXB0aW9uKFxuICAgICAgICBcIlJlc3BvbnNlIHR5cGUgaXMgbm90IHNldCBwcm9wZXJseVwiLFxuICAgICAgICBcIkludmFsaWRTdGF0ZUVycm9yXCIsXG4gICAgICApO1xuICAgIH1cbiAgICBpZiAoISh0aGlzLiNzdGF0ZSA9PT0gU3RhdGUuTE9BRElORyB8fCB0aGlzLiNzdGF0ZSA9PT0gU3RhdGUuRE9ORSkpIHtcbiAgICAgIHJldHVybiBcIlwiO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy4jZ2V0VGV4dFJlc3BvbnNlKCk7XG4gIH1cblxuICBnZXQgcmVzcG9uc2VUeXBlKCk6IFhNTEh0dHBSZXF1ZXN0UmVzcG9uc2VUeXBlIHtcbiAgICByZXR1cm4gdGhpcy4jcmVzcG9uc2VUeXBlO1xuICB9XG5cbiAgc2V0IHJlc3BvbnNlVHlwZSh2YWx1ZTogWE1MSHR0cFJlcXVlc3RSZXNwb25zZVR5cGUpIHtcbiAgICBpZiAodmFsdWUgPT09IFwiZG9jdW1lbnRcIikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodGhpcy4jc3RhdGUgPT09IFN0YXRlLkxPQURJTkcgfHwgdGhpcy4jc3RhdGUgPT09IFN0YXRlLkRPTkUpIHtcbiAgICAgIHRocm93IG5ldyBET01FeGNlcHRpb24oXG4gICAgICAgIFwiVGhlIHJlc3BvbnNlIHR5cGUgY2Fubm90IGJlIGNoYW5nZWQgd2hlbiBsb2FkaW5nIG9yIGRvbmVcIixcbiAgICAgICAgXCJJbnZhbGlkU3RhdGVFcnJvclwiLFxuICAgICAgKTtcbiAgICB9XG4gICAgdGhpcy4jcmVzcG9uc2VUeXBlID0gdmFsdWU7XG4gIH1cblxuICBnZXQgcmVzcG9uc2VVUkwoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy4jcmVzcG9uc2U/LnVybCA/PyBcIlwiO1xuICB9XG5cbiAgZ2V0IHJlc3BvbnNlWE1MKCk6IG51bGwge1xuICAgIGlmICghKHRoaXMuI3Jlc3BvbnNlVHlwZSA9PT0gXCJcIiB8fCB0aGlzLiNyZXNwb25zZVR5cGUgPT09IFwiZG9jdW1lbnRcIikpIHtcbiAgICAgIHRocm93IG5ldyBET01FeGNlcHRpb24oXG4gICAgICAgIFwiUmVzcG9uc2UgdHlwZSBpcyBub3QgcHJvcGVybHkgc2V0XCIsXG4gICAgICAgIFwiSW52YWxpZFN0YXRlRXJyb3JcIixcbiAgICAgICk7XG4gICAgfVxuICAgIGlmICh0aGlzLiNzdGF0ZSAhPT0gU3RhdGUuRE9ORSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGlmICh0aGlzLiNzZXREb2N1bWVudFJlc3BvbnNlIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICB0aGlzLiNzZXREb2N1bWVudFJlc3BvbnNlKCk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBnZXQgc3RhdHVzKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuI3Jlc3BvbnNlPy5zdGF0dXMgPz8gMDtcbiAgfVxuXG4gIGdldCBzdGF0dXNUZXh0KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuI3Jlc3BvbnNlPy5zdGF0dXNUZXh0ID8/IFwiXCI7XG4gIH1cblxuICBnZXQgdGltZW91dCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLiN0aW1lb3V0O1xuICB9XG5cbiAgc2V0IHRpbWVvdXQodmFsdWU6IG51bWJlcikge1xuICAgIHRoaXMuI3RpbWVvdXQgPSB2YWx1ZTtcbiAgfVxuXG4gIGdldCB1cGxvYWQoKTogWE1MSHR0cFJlcXVlc3RVcGxvYWQge1xuICAgIHJldHVybiB0aGlzLiN1cGxvYWQ7XG4gIH1cblxuICBnZXQgd2l0aENyZWRlbnRpYWxzKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLiNjcm9zc09yaWdpbkNyZWRlbnRpYWxzO1xuICB9XG5cbiAgc2V0IHdpdGhDcmVkZW50aWFscyh2YWx1ZTogYm9vbGVhbikge1xuICAgIGlmIChcbiAgICAgICEodGhpcy4jc3RhdGUgPT09IFN0YXRlLlVOU0VOVCB8fCB0aGlzLiNzdGF0ZSA9PT0gU3RhdGUuT1BFTkVEKVxuICAgICkge1xuICAgICAgdGhyb3cgbmV3IERPTUV4Y2VwdGlvbihcbiAgICAgICAgXCJUaGUgcmVxdWVzdCBpcyBub3QgdW5zZW50IG9yIG9wZW5lZFwiLFxuICAgICAgICBcIkludmFsaWRTdGF0ZUVycm9yXCIsXG4gICAgICApO1xuICAgIH1cbiAgICBpZiAodGhpcy4jc2VuZEZsYWcpIHtcbiAgICAgIHRocm93IG5ldyBET01FeGNlcHRpb24oXCJUaGUgcmVxdWVzdCBoYXMgYmVlbiBzZW50XCIsIFwiSW52YWxpZFN0YXRlRXJyb3JcIik7XG4gICAgfVxuICAgIHRoaXMuI2Nyb3NzT3JpZ2luQ3JlZGVudGlhbHMgPSB2YWx1ZTtcbiAgfVxuXG4gIGFib3J0KCk6IHZvaWQge1xuICAgIHRoaXMuI3Rlcm1pbmF0ZSgpO1xuICAgIGlmIChcbiAgICAgICh0aGlzLiNzdGF0ZSA9PT0gU3RhdGUuT1BFTkVEICYmIHRoaXMuI3NlbmRGbGFnKSB8fFxuICAgICAgdGhpcy4jc3RhdGUgPT09IFN0YXRlLkhFQURFUlNfUkVDRUlWRUQgfHxcbiAgICAgIHRoaXMuI3N0YXRlID09PSBTdGF0ZS5MT0FESU5HXG4gICAgKSB7XG4gICAgICB0aGlzLiNyZXF1ZXN0RXJyb3JTdGVwcyhcImFib3J0XCIpO1xuICAgIH1cbiAgICBpZiAodGhpcy4jc3RhdGUgPT09IFN0YXRlLkRPTkUpIHtcbiAgICAgIHRoaXMuI3N0YXRlID0gU3RhdGUuVU5TRU5UO1xuICAgICAgdGhpcy4jcmVzcG9uc2UgPSB1bmRlZmluZWQ7XG4gICAgfVxuICB9XG5cbiAgZGlzcGF0Y2hFdmVudChldnQ6IEV2ZW50KSB7XG4gICAgc3dpdGNoIChldnQudHlwZSkge1xuICAgICAgY2FzZSBcInJlYWR5c3RhdGVjaGFuZ2VcIjpcbiAgICAgICAgaWYgKHRoaXMub25yZWFkeXN0YXRlY2hhbmdlKSB7XG4gICAgICAgICAgdGhpcy5vbnJlYWR5c3RhdGVjaGFuZ2UuY2FsbCh0aGlzLCBldnQpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBpZiAoZXZ0LmNhbmNlbGFibGUgJiYgZXZ0LmRlZmF1bHRQcmV2ZW50ZWQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHN1cGVyLmRpc3BhdGNoRXZlbnQoZXZ0KTtcbiAgICB9XG4gIH1cblxuICBnZXRBbGxSZXNwb25zZUhlYWRlcnMoKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgaWYgKCF0aGlzLiNyZXNwb25zZSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGNvbnN0IGhlYWRlcnMgPSBbLi4udGhpcy4jcmVzcG9uc2UuaGVhZGVyc107XG4gICAgaGVhZGVycy5zb3J0KChbYV0sIFtiXSkgPT4gYS5sb2NhbGVDb21wYXJlKGIpKTtcbiAgICByZXR1cm4gaGVhZGVycy5tYXAoKFtrZXksIHZhbHVlXSkgPT4gYCR7a2V5fTogJHt2YWx1ZX1gKS5qb2luKFwiXFxyXFxuXCIpO1xuICB9XG5cbiAgZ2V0UmVzcG9uc2VIZWFkZXIobmFtZTogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuI3Jlc3BvbnNlPy5oZWFkZXJzLmdldChuYW1lKSA/PyBudWxsO1xuICB9XG5cbiAgb3BlbihcbiAgICBtZXRob2Q6IHN0cmluZyxcbiAgICB1cmw6IHN0cmluZyxcbiAgICBhc3luYyA9IHRydWUsXG4gICAgdXNlcm5hbWU6IHN0cmluZyB8IG51bGwgPSBudWxsLFxuICAgIHBhc3N3b3JkOiBzdHJpbmcgfCBudWxsID0gbnVsbCxcbiAgKTogdm9pZCB7XG4gICAgbWV0aG9kID0gbWV0aG9kLnRvTG9jYWxlVXBwZXJDYXNlKCk7XG4gICAgaWYgKCFNRVRIT0RTLmluY2x1ZGVzKG1ldGhvZCkpIHtcbiAgICAgIHRocm93IG5ldyBET01FeGNlcHRpb24oXG4gICAgICAgIGBUaGUgbWV0aG9kIFwiJHttZXRob2R9XCIgaXMgbm90IGFsbG93ZWQuYCxcbiAgICAgICAgXCJTeW50YXhFcnJvclwiLFxuICAgICAgKTtcbiAgICB9XG4gICAgbGV0IHBhcnNlZFVybDogVVJMO1xuICAgIHRyeSB7XG4gICAgICBsZXQgYmFzZTogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICAgICAgdHJ5IHtcbiAgICAgICAgYmFzZSA9IHdpbmRvdy5sb2NhdGlvbi50b1N0cmluZygpO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIC8vIHdlIGp1c3Qgd2FudCB0byBhdm9pZCB0aGUgZXJyb3IgYWJvdXQgbG9jYXRpb24gaW4gRGVub1xuICAgICAgfVxuICAgICAgcGFyc2VkVXJsID0gbmV3IFVSTCh1cmwsIGJhc2UpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgdGhyb3cgbmV3IERPTUV4Y2VwdGlvbihgVGhlIHVybCBcIiR7dXJsfVwiIGlzIGludmFsaWQuYCwgXCJTeW50YXhFcnJvclwiKTtcbiAgICB9XG4gICAgaWYgKHVzZXJuYW1lICE9IG51bGwpIHtcbiAgICAgIHBhcnNlZFVybC51c2VybmFtZSA9IHVzZXJuYW1lO1xuICAgIH1cbiAgICBpZiAocGFzc3dvcmQgIT0gbnVsbCkge1xuICAgICAgcGFyc2VkVXJsLnBhc3N3b3JkID0gcGFzc3dvcmQ7XG4gICAgfVxuICAgIGlmIChhc3luYyA9PT0gZmFsc2UpIHtcbiAgICAgIHRocm93IG5ldyBET01FeGNlcHRpb24oXG4gICAgICAgIFwiVGhlIHBvbHlmaWxsIGRvZXMgbm90IHN1cHBvcnQgc3luYyBvcGVyYXRpb24uXCIsXG4gICAgICAgIFwiSW52YWxpZEFjY2Vzc0Vycm9yXCIsXG4gICAgICApO1xuICAgIH1cbiAgICB0aGlzLiN0ZXJtaW5hdGUoKTtcbiAgICB0aGlzLiNzZW5kRmxhZyA9IGZhbHNlO1xuICAgIHRoaXMuI3VwbG9hZExpc3RlbmVyID0gZmFsc2U7XG4gICAgdGhpcy4jcmVxdWVzdE1ldGhvZCA9IG1ldGhvZDtcbiAgICB0aGlzLiN1cmwgPSBwYXJzZWRVcmw7XG4gICAgdGhpcy4jaGVhZGVycyA9IG5ldyBIZWFkZXJzKCk7XG4gICAgdGhpcy4jcmVzcG9uc2UgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy4jc3RhdGUgPSBTdGF0ZS5PUEVORUQ7XG4gICAgdGhpcy5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudChcInJlYWR5c3RhdGVjaGFuZ2VcIikpO1xuICB9XG5cbiAgb3ZlcnJpZGVNaW1lVHlwZShtaW1lOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBpZiAodGhpcy4jc3RhdGUgPT09IFN0YXRlLkxPQURJTkcgfHwgdGhpcy4jc3RhdGUgPT09IFN0YXRlLkRPTkUpIHtcbiAgICAgIHRocm93IG5ldyBET01FeGNlcHRpb24oXG4gICAgICAgIFwiVGhlIHJlcXVlc3QgaXMgaW4gYW4gaW52YWxpZCBzdGF0ZVwiLFxuICAgICAgICBcIkludmFsaWRTdGF0ZUVycm9yXCIsXG4gICAgICApO1xuICAgIH1cbiAgICB0aGlzLiNtaW1lID0gY29udGVudFR5cGUobWltZSkgPz8gXCJhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW1cIjtcbiAgfVxuXG4gIHNlbmQoYm9keTogQm9keUluaXQgfCBudWxsID0gbnVsbCk6IHZvaWQge1xuICAgIGlmICh0aGlzLiNzdGF0ZSAhPT0gU3RhdGUuT1BFTkVEKSB7XG4gICAgICB0aHJvdyBuZXcgRE9NRXhjZXB0aW9uKFwiSW52YWxpZCBzdGF0ZVwiLCBcIkludmFsaWRTdGF0ZUVycm9yXCIpO1xuICAgIH1cbiAgICBpZiAodGhpcy4jc2VuZEZsYWcpIHtcbiAgICAgIHRocm93IG5ldyBET01FeGNlcHRpb24oXCJJbnZhbGlkIHN0YXRlXCIsIFwiSW52YWxpZFN0YXRlRXJyb3JcIik7XG4gICAgfVxuICAgIGlmICh0aGlzLiNyZXF1ZXN0TWV0aG9kID09PSBcIkdFVFwiIHx8IHRoaXMuI3JlcXVlc3RNZXRob2QgPT09IFwiSEVBRFwiKSB7XG4gICAgICBib2R5ID0gbnVsbDtcbiAgICB9XG4gICAgY29uc3QgYWJvcnRDb250cm9sbGVyID0gdGhpcy4jYWJvcnRDb250cm9sbGVyID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xuICAgIGNvbnN0IHJlcSA9IG5ldyBSZXF1ZXN0KHRoaXMuI3VybCEudG9TdHJpbmcoKSwge1xuICAgICAgbWV0aG9kOiB0aGlzLiNyZXF1ZXN0TWV0aG9kLFxuICAgICAgaGVhZGVyczogdGhpcy4jaGVhZGVycyxcbiAgICAgIGJvZHksXG4gICAgICBtb2RlOiBcImNvcnNcIixcbiAgICAgIGNyZWRlbnRpYWxzOiB0aGlzLiNjcm9zc09yaWdpbkNyZWRlbnRpYWxzID8gXCJpbmNsdWRlXCIgOiBcInNhbWUtb3JpZ2luXCIsXG4gICAgICBzaWduYWw6IGFib3J0Q29udHJvbGxlci5zaWduYWwsXG4gICAgfSk7XG4gICAgdGhpcy4jdXBsb2FkQ29tcGxldGVGbGFnID0gZmFsc2U7XG4gICAgdGhpcy4jdGltZWRvdXRGbGFnID0gZmFsc2U7XG4gICAgaWYgKHJlcS5ib2R5ID09IG51bGwpIHtcbiAgICAgIHRoaXMuI3VwbG9hZENvbXBsZXRlRmxhZyA9IHRydWU7XG4gICAgfVxuICAgIHRoaXMuI3NlbmRGbGFnID0gdHJ1ZTtcblxuICAgIHRoaXMuZGlzcGF0Y2hFdmVudChuZXcgUHJvZ3Jlc3NFdmVudChcImxvYWRzdGFydFwiLCB7IGxvYWRlZDogMCwgdG90YWw6IDAgfSkpO1xuICAgIHRoaXMuI3VwbG9hZC5kaXNwYXRjaEV2ZW50KFxuICAgICAgbmV3IFByb2dyZXNzRXZlbnQoXCJsb2Fkc3RhcnRcIiwgeyBsb2FkZWQ6IDAsIHRvdGFsOiAwIH0pLFxuICAgICk7XG4gICAgaWYgKHRoaXMuI3N0YXRlICE9PSBTdGF0ZS5PUEVORUQgfHwgIXRoaXMuI3NlbmRGbGFnKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHByb2Nlc3NSZXF1ZXN0RW5kT2ZCb2R5ID0gKCkgPT4ge1xuICAgICAgdGhpcy4jdXBsb2FkQ29tcGxldGVGbGFnID0gdHJ1ZTtcbiAgICAgIGlmICghdGhpcy4jdXBsb2FkTGlzdGVuZXIpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhpcy4jdXBsb2FkLmRpc3BhdGNoRXZlbnQoXG4gICAgICAgIG5ldyBQcm9ncmVzc0V2ZW50KFwicHJvZ3Jlc3NcIiwgeyBsb2FkZWQ6IDAsIHRvdGFsOiAwIH0pLFxuICAgICAgKTtcbiAgICAgIHRoaXMuI3VwbG9hZC5kaXNwYXRjaEV2ZW50KFxuICAgICAgICBuZXcgUHJvZ3Jlc3NFdmVudChcImxvYWRcIiwge1xuICAgICAgICAgIGxvYWRlZDogMCxcbiAgICAgICAgICB0b3RhbDogMCxcbiAgICAgICAgfSksXG4gICAgICApO1xuICAgICAgdGhpcy4jdXBsb2FkLmRpc3BhdGNoRXZlbnQoXG4gICAgICAgIG5ldyBQcm9ncmVzc0V2ZW50KFwibG9hZGVuZFwiLCB7IGxvYWRlZDogMCwgdG90YWw6IDAgfSksXG4gICAgICApO1xuICAgIH07XG4gICAgY29uc3QgcHJvY2Vzc1Jlc3BvbnNlID0gYXN5bmMgKHJlc3BvbnNlOiBSZXNwb25zZSkgPT4ge1xuICAgICAgdGhpcy4jcmVzcG9uc2UgPSByZXNwb25zZTtcbiAgICAgIHRoaXMuI3N0YXRlID0gU3RhdGUuSEVBREVSU19SRUNFSVZFRDtcbiAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoXCJyZWFkeXN0YXRlY2hhbmdlXCIpKTtcbiAgICAgIGlmICh0aGlzLiNzdGF0ZSAhPT0gU3RhdGUuSEVBREVSU19SRUNFSVZFRCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAocmVzcG9uc2UuYm9keSA9PSBudWxsKSB7XG4gICAgICAgIHRoaXMuI2hhbmRsZVJlc3BvbnNlRW5kT2ZCb2R5KCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHRvdGFsID0gZXh0cmFjdExlbmd0aCh0aGlzLiNyZXNwb25zZSkgPz8gMDtcbiAgICAgIGxldCBsYXN0SW52b2tlZCA9IDA7XG4gICAgICBjb25zdCBwcm9jZXNzQm9keUNodW5rID0gKGJ5dGVzOiBVaW50OEFycmF5KSA9PiB7XG4gICAgICAgIHRoaXMuI3JlY2VpdmVkQnl0ZXMgPSBhcHBlbmRCeXRlcyh0aGlzLiNyZWNlaXZlZEJ5dGVzLCBieXRlcyk7XG4gICAgICAgIGlmICgoRGF0ZS5ub3coKSAtIGxhc3RJbnZva2VkKSA8PSA1MCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBsYXN0SW52b2tlZCA9IERhdGUubm93KCk7XG4gICAgICAgIGlmICh0aGlzLiNzdGF0ZSA9PT0gU3RhdGUuSEVBREVSU19SRUNFSVZFRCkge1xuICAgICAgICAgIHRoaXMuI3N0YXRlID0gU3RhdGUuTE9BRElORztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KFwicmVhZHlzdGF0ZWNoYW5nZVwiKSk7XG4gICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudChcbiAgICAgICAgICBuZXcgUHJvZ3Jlc3NFdmVudChcInByb2dyZXNzXCIsIHtcbiAgICAgICAgICAgIGxvYWRlZDogdGhpcy4jcmVjZWl2ZWRCeXRlcy5sZW5ndGgsXG4gICAgICAgICAgICB0b3RhbCxcbiAgICAgICAgICB9KSxcbiAgICAgICAgKTtcbiAgICAgIH07XG4gICAgICBjb25zdCBwcm9jZXNzRW5kT2ZCb2R5ID0gKCkgPT4ge1xuICAgICAgICB0aGlzLiNoYW5kbGVSZXNwb25zZUVuZE9mQm9keSgpO1xuICAgICAgfTtcbiAgICAgIGNvbnN0IHByb2Nlc3NCb2R5RXJyb3IgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMuI2hhbmRsZUVycm9ycygpO1xuICAgICAgfTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGZvciBhd2FpdCAoY29uc3QgYnl0ZXMgb2YgcmVzcG9uc2UuYm9keSkge1xuICAgICAgICAgIHByb2Nlc3NCb2R5Q2h1bmsoYnl0ZXMpO1xuICAgICAgICB9XG4gICAgICAgIHByb2Nlc3NFbmRPZkJvZHkoKTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICBwcm9jZXNzQm9keUVycm9yKCk7XG4gICAgICB9XG4gICAgfTtcbiAgICBjb25zdCBwcm9jZXNzUmVqZWN0aW9uID0gKCkgPT4ge1xuICAgICAgdGhpcy4jaGFuZGxlRXJyb3JzKCk7XG4gICAgfTtcbiAgICBjb25zdCBwID0gZmV0Y2gocmVxKS50aGVuKChyZXNwb25zZSkgPT4ge1xuICAgICAgcHJvY2Vzc1JlcXVlc3RFbmRPZkJvZHkoKTtcbiAgICAgIHJldHVybiBwcm9jZXNzUmVzcG9uc2UocmVzcG9uc2UpO1xuICAgIH0pLmNhdGNoKHByb2Nlc3NSZWplY3Rpb24pO1xuICAgIGlmICh0aGlzLiN0aW1lb3V0ID4gMCkge1xuICAgICAgY29uc3QgdCA9IG5ldyBQcm9taXNlPGJvb2xlYW4+KChyZXMpID0+IHtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiByZXModHJ1ZSksIHRoaXMuI3RpbWVvdXQpO1xuICAgICAgfSk7XG4gICAgICBQcm9taXNlLnJhY2UoW3AsIHRdKS50aGVuKCh2YWx1ZSkgPT4ge1xuICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICB0aGlzLiN0aW1lZG91dEZsYWcgPSB0cnVlO1xuICAgICAgICAgIHRoaXMuI3Rlcm1pbmF0ZSgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBzZXRSZXF1ZXN0SGVhZGVyKG5hbWU6IHN0cmluZywgdmFsdWU6IHN0cmluZyk6IHZvaWQge1xuICAgIGlmICh0aGlzLiNzdGF0ZSAhPT0gU3RhdGUuT1BFTkVEKSB7XG4gICAgICB0aHJvdyBuZXcgRE9NRXhjZXB0aW9uKFwiSW52YWxpZCBzdGF0ZVwiLCBcIkludmFsaWRTdGF0ZUVycm9yXCIpO1xuICAgIH1cbiAgICBpZiAodGhpcy4jc2VuZEZsYWcpIHtcbiAgICAgIHRocm93IG5ldyBET01FeGNlcHRpb24oXCJJbnZhbGlkIHN0YXRlXCIsIFwiSW52YWxpZGF0ZVN0YXRlRXJyb3JcIik7XG4gICAgfVxuICAgIHRoaXMuI2hlYWRlcnMuYXBwZW5kKG5hbWUsIHZhbHVlKTtcbiAgfVxuXG4gIGdldCBET05FKCkge1xuICAgIHJldHVybiBTdGF0ZS5ET05FO1xuICB9XG5cbiAgZ2V0IEhFQURFUlNfUkVDRUlWRUQoKSB7XG4gICAgcmV0dXJuIFN0YXRlLkhFQURFUlNfUkVDRUlWRUQ7XG4gIH1cblxuICBnZXQgTE9BRElORygpIHtcbiAgICByZXR1cm4gU3RhdGUuTE9BRElORztcbiAgfVxuXG4gIGdldCBPUEVORUQoKSB7XG4gICAgcmV0dXJuIFN0YXRlLk9QRU5FRDtcbiAgfVxuXG4gIGdldCBVTlNFTlQoKSB7XG4gICAgcmV0dXJuIFN0YXRlLlVOU0VOVDtcbiAgfVxuXG4gIHN0YXRpYyBnZXQgRE9ORSgpIHtcbiAgICByZXR1cm4gU3RhdGUuRE9ORTtcbiAgfVxuXG4gIHN0YXRpYyBnZXQgSEVBREVSU19SRUNFSVZFRCgpIHtcbiAgICByZXR1cm4gU3RhdGUuSEVBREVSU19SRUNFSVZFRDtcbiAgfVxuXG4gIHN0YXRpYyBnZXQgTE9BRElORygpIHtcbiAgICByZXR1cm4gU3RhdGUuTE9BRElORztcbiAgfVxuXG4gIHN0YXRpYyBnZXQgT1BFTkVEKCkge1xuICAgIHJldHVybiBTdGF0ZS5PUEVORUQ7XG4gIH1cblxuICBzdGF0aWMgZ2V0IFVOU0VOVCgpIHtcbiAgICByZXR1cm4gU3RhdGUuVU5TRU5UO1xuICB9XG59XG5cbi8vIGRlbm8tbGludC1pZ25vcmUgYmFuLXR5cGVzXG5mdW5jdGlvbiBtYXliZURlZmluZSh2YWx1ZTogRnVuY3Rpb24sIHNjb3BlOiBvYmplY3QpIHtcbiAgY29uc3QgbmFtZSA9IHZhbHVlLm5hbWU7XG4gIGlmICghKG5hbWUgaW4gZ2xvYmFsVGhpcykpIHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoc2NvcGUsIG5hbWUsIHtcbiAgICAgIHZhbHVlLFxuICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICB9KTtcbiAgfVxufVxuXG5tYXliZURlZmluZShYTUxIdHRwUmVxdWVzdCwgZ2xvYmFsVGhpcyk7XG5tYXliZURlZmluZShYTUxIdHRwUmVxdWVzdEV2ZW50VGFyZ2V0LCBnbG9iYWxUaGlzKTtcbm1heWJlRGVmaW5lKFhNTEh0dHBSZXF1ZXN0VXBsb2FkLCBnbG9iYWxUaGlzKTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxvRUFBb0U7QUFFcEUsd0NBQXdDO0FBRXhDLFNBQ0UsT0FBTyxFQUNQLFdBQVcsUUFDTixnREFBZ0Q7QUFVdkQsU0FBUyxPQUFPLElBQWEsRUFBRSxNQUFNLGtCQUFrQjtJQUNyRCxJQUFJLENBQUMsTUFBTTtRQUNULE1BQU0sTUFBTSxJQUFJLE1BQU07UUFDdEIsSUFBSSxPQUFPO1FBQ1gsTUFBTTtJQUNSO0FBQ0Y7QUFFQSxTQUFTLGNBQWMsUUFBa0I7SUFDdkMsTUFBTSxTQUFTLFNBQVMsUUFBUSxJQUFJLG1CQUFtQixNQUFNLGNBQWMsRUFBRTtJQUM3RSxJQUFJLGlCQUFnQztJQUNwQyxLQUFLLE1BQU0sU0FBUyxPQUFRO1FBQzFCLElBQUksa0JBQWtCLE1BQU07WUFDMUIsaUJBQWlCO1FBQ25CLE9BQU8sSUFBSSxVQUFVLGdCQUFnQjtZQUNuQyxNQUFNLElBQUksTUFBTTtRQUNsQjtJQUNGO0lBQ0EsSUFBSSxrQkFBa0IsTUFBTSxrQkFBa0IsTUFBTTtRQUNsRCxPQUFPO0lBQ1Q7SUFDQSxNQUFNLElBQUksU0FBUyxnQkFBZ0I7SUFDbkMsT0FBTyxPQUFPLE1BQU0sS0FBSyxPQUFPO0FBQ2xDO0FBRUEsU0FBUyxXQUFXLEtBQWE7SUFDL0IsT0FBTyxNQUFNLE1BQU0sVUFBVSxDQUFDLEVBQUU7QUFDbEM7QUFFQSxTQUFTLGdCQUFnQixPQUFnQjtJQUN2QyxJQUFJLFdBQTBCO0lBQzlCLE1BQU0sU0FBUyxR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