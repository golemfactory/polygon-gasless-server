// Copyright 2018-2023 the oak authors. All rights reserved. MIT license.
import { RequestBody } from "./body.ts";
import { accepts, acceptsEncodings, acceptsLanguages, UserAgent } from "./deps.ts";
/** An interface which provides information about the current request. The
 * instance related to the current request is available on the
 * {@linkcode Context}'s `.request` property.
 *
 * The interface contains several properties to get information about the
 * request as well as several methods, which include content negotiation and
 * the ability to decode a request body.
 */ export class Request {
    #body;
    #proxy;
    #secure;
    #serverRequest;
    #url;
    #userAgent;
    #getRemoteAddr() {
        return this.#serverRequest.remoteAddr ?? "";
    }
    /** Is `true` if the request might have a body, otherwise `false`.
   *
   * **WARNING** this is an unreliable API. In HTTP/2 in many situations you
   * cannot determine if a request has a body or not unless you attempt to read
   * the body, due to the streaming nature of HTTP/2. As of Deno 1.16.1, for
   * HTTP/1.1, Deno also reflects that behaviour.  The only reliable way to
   * determine if a request has a body or not is to attempt to read the body.
   */ get hasBody() {
        return this.#body.has();
    }
    /** The `Headers` supplied in the request. */ get headers() {
        return this.#serverRequest.headers;
    }
    /** Request remote address. When the application's `.proxy` is true, the
   * `X-Forwarded-For` will be used to determine the requesting remote address.
   */ get ip() {
        return (this.#proxy ? this.ips[0] : this.#getRemoteAddr()) ?? "";
    }
    /** When the application's `.proxy` is `true`, this will be set to an array of
   * IPs, ordered from upstream to downstream, based on the value of the header
   * `X-Forwarded-For`.  When `false` an empty array is returned. */ get ips() {
        return this.#proxy ? (this.#serverRequest.headers.get("x-forwarded-for") ?? this.#getRemoteAddr()).split(/\s*,\s*/) : [];
    }
    /** The HTTP Method used by the request. */ get method() {
        return this.#serverRequest.method;
    }
    /** Shortcut to `request.url.protocol === "https:"`. */ get secure() {
        return this.#secure;
    }
    /** Set to the value of the _original_ Deno server request. */ get originalRequest() {
        return this.#serverRequest;
    }
    /** A parsed URL for the request which complies with the browser standards.
   * When the application's `.proxy` is `true`, this value will be based off of
   * the `X-Forwarded-Proto` and `X-Forwarded-Host` header values if present in
   * the request. */ get url() {
        if (!this.#url) {
            const serverRequest = this.#serverRequest;
            if (!this.#proxy) {
                // between 1.9.0 and 1.9.1 the request.url of the native HTTP started
                // returning the full URL, where previously it only returned the path
                // so we will try to use that URL here, but default back to old logic
                // if the URL isn't valid.
                try {
                    if (serverRequest.rawUrl) {
                        this.#url = new URL(serverRequest.rawUrl);
                        return this.#url;
                    }
                } catch  {
                // we don't care about errors here
                }
            }
            let proto;
            let host;
            if (this.#proxy) {
                proto = serverRequest.headers.get("x-forwarded-proto")?.split(/\s*,\s*/, 1)[0] ?? "http";
                host = serverRequest.headers.get("x-forwarded-host") ?? serverRequest.headers.get("host") ?? "";
            } else {
                proto = this.#secure ? "https" : "http";
                host = serverRequest.headers.get("host") ?? "";
            }
            try {
                this.#url = new URL(`${proto}://${host}${serverRequest.url}`);
            } catch  {
                throw new TypeError(`The server request URL of "${proto}://${host}${serverRequest.url}" is invalid.`);
            }
        }
        return this.#url;
    }
    /** An object representing the requesting user agent. If the `User-Agent`
   * header isn't defined in the request, all the properties will be undefined.
   *
   * See [std/http/user_agent#UserAgent](https://deno.land/std@0.193.0/http/user_agent.ts?s=UserAgent)
   * for more information.
   */ get userAgent() {
        return this.#userAgent;
    }
    constructor(serverRequest, { proxy =false , secure =false , jsonBodyReviver  } = {}){
        this.#proxy = proxy;
        this.#secure = secure;
        this.#serverRequest = serverRequest;
        this.#body = new RequestBody(serverRequest.getBody(), serverRequest.headers, jsonBodyReviver);
        this.#userAgent = new UserAgent(serverRequest.headers.get("user-agent"));
    }
    accepts(...types) {
        if (!this.#serverRequest.headers.has("Accept")) {
            return types.length ? types[0] : [
                "*/*"
            ];
        }
        if (types.length) {
            return accepts(this.#serverRequest, ...types);
        }
        return accepts(this.#serverRequest);
    }
    acceptsEncodings(...encodings) {
        if (!this.#serverRequest.headers.has("Accept-Encoding")) {
            return encodings.length ? encodings[0] : [
                "*"
            ];
        }
        if (encodings.length) {
            return acceptsEncodings(this.#serverRequest, ...encodings);
        }
        return acceptsEncodings(this.#serverRequest);
    }
    acceptsLanguages(...langs) {
        if (!this.#serverRequest.headers.get("Accept-Language")) {
            return langs.length ? langs[0] : [
                "*"
            ];
        }
        if (langs.length) {
            return acceptsLanguages(this.#serverRequest, ...langs);
        }
        return acceptsLanguages(this.#serverRequest);
    }
    /** Access the body of the request. This is a method, because there are
   * several options which can be provided which can influence how the body is
   * handled. */ body(options = {}) {
        return this.#body.get(options);
    }
    [Symbol.for("Deno.customInspect")](inspect) {
        const { hasBody , headers , ip , ips , method , secure , url  } = this;
        return `${this.constructor.name} ${inspect({
            hasBody,
            headers,
            ip,
            ips,
            method,
            secure,
            url: url.toString()
        })}`;
    }
    [Symbol.for("nodejs.util.inspect.custom")](depth, // deno-lint-ignore no-explicit-any
    options, inspect) {
        if (depth < 0) {
            return options.stylize(`[${this.constructor.name}]`, "special");
        }
        const newOptions = Object.assign({}, options, {
            depth: options.depth === null ? null : options.depth - 1
        });
        const { hasBody , headers , ip , ips , method , secure , url  } = this;
        return `${options.stylize(this.constructor.name, "special")} ${inspect({
            hasBody,
            headers,
            ip,
            ips,
            method,
            secure,
            url
        }, newOptions)}`;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvb2FrQHYxMi42LjAvcmVxdWVzdC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIzIHRoZSBvYWsgYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG5cbmltcG9ydCB0eXBlIHtcbiAgQm9keSxcbiAgQm9keUJ5dGVzLFxuICBCb2R5Rm9ybSxcbiAgQm9keUZvcm1EYXRhLFxuICBCb2R5SnNvbixcbiAgQm9keU9wdGlvbnMsXG4gIEJvZHlSZWFkZXIsXG4gIEJvZHlTdHJlYW0sXG4gIEJvZHlUZXh0LFxufSBmcm9tIFwiLi9ib2R5LnRzXCI7XG5pbXBvcnQgeyBSZXF1ZXN0Qm9keSB9IGZyb20gXCIuL2JvZHkudHNcIjtcbmltcG9ydCB7XG4gIGFjY2VwdHMsXG4gIGFjY2VwdHNFbmNvZGluZ3MsXG4gIGFjY2VwdHNMYW5ndWFnZXMsXG4gIHR5cGUgSFRUUE1ldGhvZHMsXG4gIFVzZXJBZ2VudCxcbn0gZnJvbSBcIi4vZGVwcy50c1wiO1xuaW1wb3J0IHR5cGUgeyBTZXJ2ZXJSZXF1ZXN0IH0gZnJvbSBcIi4vdHlwZXMuZC50c1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIE9ha1JlcXVlc3RPcHRpb25zIHtcbiAganNvbkJvZHlSZXZpdmVyPzogKGtleTogc3RyaW5nLCB2YWx1ZTogdW5rbm93bikgPT4gdW5rbm93bjtcbiAgcHJveHk/OiBib29sZWFuO1xuICBzZWN1cmU/OiBib29sZWFuO1xufVxuXG4vKiogQW4gaW50ZXJmYWNlIHdoaWNoIHByb3ZpZGVzIGluZm9ybWF0aW9uIGFib3V0IHRoZSBjdXJyZW50IHJlcXVlc3QuIFRoZVxuICogaW5zdGFuY2UgcmVsYXRlZCB0byB0aGUgY3VycmVudCByZXF1ZXN0IGlzIGF2YWlsYWJsZSBvbiB0aGVcbiAqIHtAbGlua2NvZGUgQ29udGV4dH0ncyBgLnJlcXVlc3RgIHByb3BlcnR5LlxuICpcbiAqIFRoZSBpbnRlcmZhY2UgY29udGFpbnMgc2V2ZXJhbCBwcm9wZXJ0aWVzIHRvIGdldCBpbmZvcm1hdGlvbiBhYm91dCB0aGVcbiAqIHJlcXVlc3QgYXMgd2VsbCBhcyBzZXZlcmFsIG1ldGhvZHMsIHdoaWNoIGluY2x1ZGUgY29udGVudCBuZWdvdGlhdGlvbiBhbmRcbiAqIHRoZSBhYmlsaXR5IHRvIGRlY29kZSBhIHJlcXVlc3QgYm9keS5cbiAqL1xuZXhwb3J0IGNsYXNzIFJlcXVlc3Qge1xuICAjYm9keTogUmVxdWVzdEJvZHk7XG4gICNwcm94eTogYm9vbGVhbjtcbiAgI3NlY3VyZTogYm9vbGVhbjtcbiAgI3NlcnZlclJlcXVlc3Q6IFNlcnZlclJlcXVlc3Q7XG4gICN1cmw/OiBVUkw7XG4gICN1c2VyQWdlbnQ6IFVzZXJBZ2VudDtcblxuICAjZ2V0UmVtb3RlQWRkcigpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLiNzZXJ2ZXJSZXF1ZXN0LnJlbW90ZUFkZHIgPz8gXCJcIjtcbiAgfVxuXG4gIC8qKiBJcyBgdHJ1ZWAgaWYgdGhlIHJlcXVlc3QgbWlnaHQgaGF2ZSBhIGJvZHksIG90aGVyd2lzZSBgZmFsc2VgLlxuICAgKlxuICAgKiAqKldBUk5JTkcqKiB0aGlzIGlzIGFuIHVucmVsaWFibGUgQVBJLiBJbiBIVFRQLzIgaW4gbWFueSBzaXR1YXRpb25zIHlvdVxuICAgKiBjYW5ub3QgZGV0ZXJtaW5lIGlmIGEgcmVxdWVzdCBoYXMgYSBib2R5IG9yIG5vdCB1bmxlc3MgeW91IGF0dGVtcHQgdG8gcmVhZFxuICAgKiB0aGUgYm9keSwgZHVlIHRvIHRoZSBzdHJlYW1pbmcgbmF0dXJlIG9mIEhUVFAvMi4gQXMgb2YgRGVubyAxLjE2LjEsIGZvclxuICAgKiBIVFRQLzEuMSwgRGVubyBhbHNvIHJlZmxlY3RzIHRoYXQgYmVoYXZpb3VyLiAgVGhlIG9ubHkgcmVsaWFibGUgd2F5IHRvXG4gICAqIGRldGVybWluZSBpZiBhIHJlcXVlc3QgaGFzIGEgYm9keSBvciBub3QgaXMgdG8gYXR0ZW1wdCB0byByZWFkIHRoZSBib2R5LlxuICAgKi9cbiAgZ2V0IGhhc0JvZHkoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuI2JvZHkuaGFzKCk7XG4gIH1cblxuICAvKiogVGhlIGBIZWFkZXJzYCBzdXBwbGllZCBpbiB0aGUgcmVxdWVzdC4gKi9cbiAgZ2V0IGhlYWRlcnMoKTogSGVhZGVycyB7XG4gICAgcmV0dXJuIHRoaXMuI3NlcnZlclJlcXVlc3QuaGVhZGVycztcbiAgfVxuXG4gIC8qKiBSZXF1ZXN0IHJlbW90ZSBhZGRyZXNzLiBXaGVuIHRoZSBhcHBsaWNhdGlvbidzIGAucHJveHlgIGlzIHRydWUsIHRoZVxuICAgKiBgWC1Gb3J3YXJkZWQtRm9yYCB3aWxsIGJlIHVzZWQgdG8gZGV0ZXJtaW5lIHRoZSByZXF1ZXN0aW5nIHJlbW90ZSBhZGRyZXNzLlxuICAgKi9cbiAgZ2V0IGlwKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuICh0aGlzLiNwcm94eSA/IHRoaXMuaXBzWzBdIDogdGhpcy4jZ2V0UmVtb3RlQWRkcigpKSA/PyBcIlwiO1xuICB9XG5cbiAgLyoqIFdoZW4gdGhlIGFwcGxpY2F0aW9uJ3MgYC5wcm94eWAgaXMgYHRydWVgLCB0aGlzIHdpbGwgYmUgc2V0IHRvIGFuIGFycmF5IG9mXG4gICAqIElQcywgb3JkZXJlZCBmcm9tIHVwc3RyZWFtIHRvIGRvd25zdHJlYW0sIGJhc2VkIG9uIHRoZSB2YWx1ZSBvZiB0aGUgaGVhZGVyXG4gICAqIGBYLUZvcndhcmRlZC1Gb3JgLiAgV2hlbiBgZmFsc2VgIGFuIGVtcHR5IGFycmF5IGlzIHJldHVybmVkLiAqL1xuICBnZXQgaXBzKCk6IHN0cmluZ1tdIHtcbiAgICByZXR1cm4gdGhpcy4jcHJveHlcbiAgICAgID8gKHRoaXMuI3NlcnZlclJlcXVlc3QuaGVhZGVycy5nZXQoXCJ4LWZvcndhcmRlZC1mb3JcIikgPz9cbiAgICAgICAgdGhpcy4jZ2V0UmVtb3RlQWRkcigpKS5zcGxpdCgvXFxzKixcXHMqLylcbiAgICAgIDogW107XG4gIH1cblxuICAvKiogVGhlIEhUVFAgTWV0aG9kIHVzZWQgYnkgdGhlIHJlcXVlc3QuICovXG4gIGdldCBtZXRob2QoKTogSFRUUE1ldGhvZHMge1xuICAgIHJldHVybiB0aGlzLiNzZXJ2ZXJSZXF1ZXN0Lm1ldGhvZCBhcyBIVFRQTWV0aG9kcztcbiAgfVxuXG4gIC8qKiBTaG9ydGN1dCB0byBgcmVxdWVzdC51cmwucHJvdG9jb2wgPT09IFwiaHR0cHM6XCJgLiAqL1xuICBnZXQgc2VjdXJlKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLiNzZWN1cmU7XG4gIH1cblxuICAvKiogU2V0IHRvIHRoZSB2YWx1ZSBvZiB0aGUgX29yaWdpbmFsXyBEZW5vIHNlcnZlciByZXF1ZXN0LiAqL1xuICBnZXQgb3JpZ2luYWxSZXF1ZXN0KCk6IFNlcnZlclJlcXVlc3Qge1xuICAgIHJldHVybiB0aGlzLiNzZXJ2ZXJSZXF1ZXN0O1xuICB9XG5cbiAgLyoqIEEgcGFyc2VkIFVSTCBmb3IgdGhlIHJlcXVlc3Qgd2hpY2ggY29tcGxpZXMgd2l0aCB0aGUgYnJvd3NlciBzdGFuZGFyZHMuXG4gICAqIFdoZW4gdGhlIGFwcGxpY2F0aW9uJ3MgYC5wcm94eWAgaXMgYHRydWVgLCB0aGlzIHZhbHVlIHdpbGwgYmUgYmFzZWQgb2ZmIG9mXG4gICAqIHRoZSBgWC1Gb3J3YXJkZWQtUHJvdG9gIGFuZCBgWC1Gb3J3YXJkZWQtSG9zdGAgaGVhZGVyIHZhbHVlcyBpZiBwcmVzZW50IGluXG4gICAqIHRoZSByZXF1ZXN0LiAqL1xuICBnZXQgdXJsKCk6IFVSTCB7XG4gICAgaWYgKCF0aGlzLiN1cmwpIHtcbiAgICAgIGNvbnN0IHNlcnZlclJlcXVlc3QgPSB0aGlzLiNzZXJ2ZXJSZXF1ZXN0O1xuICAgICAgaWYgKCF0aGlzLiNwcm94eSkge1xuICAgICAgICAvLyBiZXR3ZWVuIDEuOS4wIGFuZCAxLjkuMSB0aGUgcmVxdWVzdC51cmwgb2YgdGhlIG5hdGl2ZSBIVFRQIHN0YXJ0ZWRcbiAgICAgICAgLy8gcmV0dXJuaW5nIHRoZSBmdWxsIFVSTCwgd2hlcmUgcHJldmlvdXNseSBpdCBvbmx5IHJldHVybmVkIHRoZSBwYXRoXG4gICAgICAgIC8vIHNvIHdlIHdpbGwgdHJ5IHRvIHVzZSB0aGF0IFVSTCBoZXJlLCBidXQgZGVmYXVsdCBiYWNrIHRvIG9sZCBsb2dpY1xuICAgICAgICAvLyBpZiB0aGUgVVJMIGlzbid0IHZhbGlkLlxuICAgICAgICB0cnkge1xuICAgICAgICAgIGlmIChzZXJ2ZXJSZXF1ZXN0LnJhd1VybCkge1xuICAgICAgICAgICAgdGhpcy4jdXJsID0gbmV3IFVSTChzZXJ2ZXJSZXF1ZXN0LnJhd1VybCk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy4jdXJsO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgLy8gd2UgZG9uJ3QgY2FyZSBhYm91dCBlcnJvcnMgaGVyZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBsZXQgcHJvdG86IHN0cmluZztcbiAgICAgIGxldCBob3N0OiBzdHJpbmc7XG4gICAgICBpZiAodGhpcy4jcHJveHkpIHtcbiAgICAgICAgcHJvdG8gPSBzZXJ2ZXJSZXF1ZXN0XG4gICAgICAgICAgLmhlYWRlcnMuZ2V0KFwieC1mb3J3YXJkZWQtcHJvdG9cIik/LnNwbGl0KC9cXHMqLFxccyovLCAxKVswXSA/P1xuICAgICAgICAgIFwiaHR0cFwiO1xuICAgICAgICBob3N0ID0gc2VydmVyUmVxdWVzdC5oZWFkZXJzLmdldChcIngtZm9yd2FyZGVkLWhvc3RcIikgPz9cbiAgICAgICAgICBzZXJ2ZXJSZXF1ZXN0LmhlYWRlcnMuZ2V0KFwiaG9zdFwiKSA/PyBcIlwiO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcHJvdG8gPSB0aGlzLiNzZWN1cmUgPyBcImh0dHBzXCIgOiBcImh0dHBcIjtcbiAgICAgICAgaG9zdCA9IHNlcnZlclJlcXVlc3QuaGVhZGVycy5nZXQoXCJob3N0XCIpID8/IFwiXCI7XG4gICAgICB9XG4gICAgICB0cnkge1xuICAgICAgICB0aGlzLiN1cmwgPSBuZXcgVVJMKGAke3Byb3RvfTovLyR7aG9zdH0ke3NlcnZlclJlcXVlc3QudXJsfWApO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgICAgYFRoZSBzZXJ2ZXIgcmVxdWVzdCBVUkwgb2YgXCIke3Byb3RvfTovLyR7aG9zdH0ke3NlcnZlclJlcXVlc3QudXJsfVwiIGlzIGludmFsaWQuYCxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuI3VybDtcbiAgfVxuXG4gIC8qKiBBbiBvYmplY3QgcmVwcmVzZW50aW5nIHRoZSByZXF1ZXN0aW5nIHVzZXIgYWdlbnQuIElmIHRoZSBgVXNlci1BZ2VudGBcbiAgICogaGVhZGVyIGlzbid0IGRlZmluZWQgaW4gdGhlIHJlcXVlc3QsIGFsbCB0aGUgcHJvcGVydGllcyB3aWxsIGJlIHVuZGVmaW5lZC5cbiAgICpcbiAgICogU2VlIFtzdGQvaHR0cC91c2VyX2FnZW50I1VzZXJBZ2VudF0oaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQDAuMTkzLjAvaHR0cC91c2VyX2FnZW50LnRzP3M9VXNlckFnZW50KVxuICAgKiBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICovXG4gIGdldCB1c2VyQWdlbnQoKTogVXNlckFnZW50IHtcbiAgICByZXR1cm4gdGhpcy4jdXNlckFnZW50O1xuICB9XG5cbiAgY29uc3RydWN0b3IoXG4gICAgc2VydmVyUmVxdWVzdDogU2VydmVyUmVxdWVzdCxcbiAgICB7IHByb3h5ID0gZmFsc2UsIHNlY3VyZSA9IGZhbHNlLCBqc29uQm9keVJldml2ZXIgfTogT2FrUmVxdWVzdE9wdGlvbnMgPSB7fSxcbiAgKSB7XG4gICAgdGhpcy4jcHJveHkgPSBwcm94eTtcbiAgICB0aGlzLiNzZWN1cmUgPSBzZWN1cmU7XG4gICAgdGhpcy4jc2VydmVyUmVxdWVzdCA9IHNlcnZlclJlcXVlc3Q7XG4gICAgdGhpcy4jYm9keSA9IG5ldyBSZXF1ZXN0Qm9keShcbiAgICAgIHNlcnZlclJlcXVlc3QuZ2V0Qm9keSgpLFxuICAgICAgc2VydmVyUmVxdWVzdC5oZWFkZXJzLFxuICAgICAganNvbkJvZHlSZXZpdmVyLFxuICAgICk7XG4gICAgdGhpcy4jdXNlckFnZW50ID0gbmV3IFVzZXJBZ2VudChzZXJ2ZXJSZXF1ZXN0LmhlYWRlcnMuZ2V0KFwidXNlci1hZ2VudFwiKSk7XG4gIH1cblxuICAvKiogUmV0dXJucyBhbiBhcnJheSBvZiBtZWRpYSB0eXBlcywgYWNjZXB0ZWQgYnkgdGhlIHJlcXVlc3RvciwgaW4gb3JkZXIgb2ZcbiAgICogcHJlZmVyZW5jZS4gIElmIHRoZXJlIGFyZSBubyBlbmNvZGluZ3Mgc3VwcGxpZWQgYnkgdGhlIHJlcXVlc3RvcixcbiAgICogdGhlbiBhY2NlcHRpbmcgYW55IGlzIGltcGxpZWQgaXMgcmV0dXJuZWQuXG4gICAqL1xuICBhY2NlcHRzKCk6IHN0cmluZ1tdIHwgdW5kZWZpbmVkO1xuICAvKiogRm9yIGEgZ2l2ZW4gc2V0IG9mIG1lZGlhIHR5cGVzLCByZXR1cm4gdGhlIGJlc3QgbWF0Y2ggYWNjZXB0ZWQgYnkgdGhlXG4gICAqIHJlcXVlc3Rvci4gIElmIHRoZXJlIGFyZSBubyBlbmNvZGluZyB0aGF0IG1hdGNoLCB0aGVuIHRoZSBtZXRob2QgcmV0dXJuc1xuICAgKiBgdW5kZWZpbmVkYC5cbiAgICovXG4gIGFjY2VwdHMoLi4udHlwZXM6IHN0cmluZ1tdKTogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICBhY2NlcHRzKC4uLnR5cGVzOiBzdHJpbmdbXSk6IHN0cmluZyB8IHN0cmluZ1tdIHwgdW5kZWZpbmVkIHtcbiAgICBpZiAoIXRoaXMuI3NlcnZlclJlcXVlc3QuaGVhZGVycy5oYXMoXCJBY2NlcHRcIikpIHtcbiAgICAgIHJldHVybiB0eXBlcy5sZW5ndGggPyB0eXBlc1swXSA6IFtcIiovKlwiXTtcbiAgICB9XG4gICAgaWYgKHR5cGVzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIGFjY2VwdHModGhpcy4jc2VydmVyUmVxdWVzdCwgLi4udHlwZXMpO1xuICAgIH1cbiAgICByZXR1cm4gYWNjZXB0cyh0aGlzLiNzZXJ2ZXJSZXF1ZXN0KTtcbiAgfVxuXG4gIC8qKiBSZXR1cm5zIGFuIGFycmF5IG9mIGVuY29kaW5ncywgYWNjZXB0ZWQgYnkgdGhlIHJlcXVlc3RvciwgaW4gb3JkZXIgb2ZcbiAgICogcHJlZmVyZW5jZS4gIElmIHRoZXJlIGFyZSBubyBlbmNvZGluZ3Mgc3VwcGxpZWQgYnkgdGhlIHJlcXVlc3RvcixcbiAgICogdGhlbiBgW1wiKlwiXWAgaXMgcmV0dXJuZWQsIG1hdGNoaW5nIGFueS5cbiAgICovXG4gIGFjY2VwdHNFbmNvZGluZ3MoKTogc3RyaW5nW10gfCB1bmRlZmluZWQ7XG4gIC8qKiBGb3IgYSBnaXZlbiBzZXQgb2YgZW5jb2RpbmdzLCByZXR1cm4gdGhlIGJlc3QgbWF0Y2ggYWNjZXB0ZWQgYnkgdGhlXG4gICAqIHJlcXVlc3Rvci4gIElmIHRoZXJlIGFyZSBubyBlbmNvZGluZ3MgdGhhdCBtYXRjaCwgdGhlbiB0aGUgbWV0aG9kIHJldHVybnNcbiAgICogYHVuZGVmaW5lZGAuXG4gICAqXG4gICAqICoqTk9URToqKiBZb3Ugc2hvdWxkIGFsd2F5cyBzdXBwbHkgYGlkZW50aXR5YCBhcyBvbmUgb2YgdGhlIGVuY29kaW5nc1xuICAgKiB0byBlbnN1cmUgdGhhdCB0aGVyZSBpcyBhIG1hdGNoIHdoZW4gdGhlIGBBY2NlcHQtRW5jb2RpbmdgIGhlYWRlciBpcyBwYXJ0XG4gICAqIG9mIHRoZSByZXF1ZXN0LlxuICAgKi9cbiAgYWNjZXB0c0VuY29kaW5ncyguLi5lbmNvZGluZ3M6IHN0cmluZ1tdKTogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICBhY2NlcHRzRW5jb2RpbmdzKC4uLmVuY29kaW5nczogc3RyaW5nW10pOiBzdHJpbmdbXSB8IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgaWYgKCF0aGlzLiNzZXJ2ZXJSZXF1ZXN0LmhlYWRlcnMuaGFzKFwiQWNjZXB0LUVuY29kaW5nXCIpKSB7XG4gICAgICByZXR1cm4gZW5jb2RpbmdzLmxlbmd0aCA/IGVuY29kaW5nc1swXSA6IFtcIipcIl07XG4gICAgfVxuICAgIGlmIChlbmNvZGluZ3MubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gYWNjZXB0c0VuY29kaW5ncyh0aGlzLiNzZXJ2ZXJSZXF1ZXN0LCAuLi5lbmNvZGluZ3MpO1xuICAgIH1cbiAgICByZXR1cm4gYWNjZXB0c0VuY29kaW5ncyh0aGlzLiNzZXJ2ZXJSZXF1ZXN0KTtcbiAgfVxuXG4gIC8qKiBSZXR1cm5zIGFuIGFycmF5IG9mIGxhbmd1YWdlcywgYWNjZXB0ZWQgYnkgdGhlIHJlcXVlc3RvciwgaW4gb3JkZXIgb2ZcbiAgICogcHJlZmVyZW5jZS4gIElmIHRoZXJlIGFyZSBubyBsYW5ndWFnZXMgc3VwcGxpZWQgYnkgdGhlIHJlcXVlc3RvcixcbiAgICogYFtcIipcIl1gIGlzIHJldHVybmVkLCBpbmRpY2F0aW5nIGFueSBsYW5ndWFnZSBpcyBhY2NlcHRlZC5cbiAgICovXG4gIGFjY2VwdHNMYW5ndWFnZXMoKTogc3RyaW5nW10gfCB1bmRlZmluZWQ7XG4gIC8qKiBGb3IgYSBnaXZlbiBzZXQgb2YgbGFuZ3VhZ2VzLCByZXR1cm4gdGhlIGJlc3QgbWF0Y2ggYWNjZXB0ZWQgYnkgdGhlXG4gICAqIHJlcXVlc3Rvci4gIElmIHRoZXJlIGFyZSBubyBsYW5ndWFnZXMgdGhhdCBtYXRjaCwgdGhlbiB0aGUgbWV0aG9kIHJldHVybnNcbiAgICogYHVuZGVmaW5lZGAuICovXG4gIGFjY2VwdHNMYW5ndWFnZXMoLi4ubGFuZ3M6IHN0cmluZ1tdKTogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICBhY2NlcHRzTGFuZ3VhZ2VzKC4uLmxhbmdzOiBzdHJpbmdbXSk6IHN0cmluZ1tdIHwgc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICBpZiAoIXRoaXMuI3NlcnZlclJlcXVlc3QuaGVhZGVycy5nZXQoXCJBY2NlcHQtTGFuZ3VhZ2VcIikpIHtcbiAgICAgIHJldHVybiBsYW5ncy5sZW5ndGggPyBsYW5nc1swXSA6IFtcIipcIl07XG4gICAgfVxuICAgIGlmIChsYW5ncy5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBhY2NlcHRzTGFuZ3VhZ2VzKHRoaXMuI3NlcnZlclJlcXVlc3QsIC4uLmxhbmdzKTtcbiAgICB9XG4gICAgcmV0dXJuIGFjY2VwdHNMYW5ndWFnZXModGhpcy4jc2VydmVyUmVxdWVzdCk7XG4gIH1cblxuICBib2R5KG9wdGlvbnM6IEJvZHlPcHRpb25zPFwiYnl0ZXNcIj4pOiBCb2R5Qnl0ZXM7XG4gIGJvZHkob3B0aW9uczogQm9keU9wdGlvbnM8XCJmb3JtXCI+KTogQm9keUZvcm07XG4gIGJvZHkob3B0aW9uczogQm9keU9wdGlvbnM8XCJmb3JtLWRhdGFcIj4pOiBCb2R5Rm9ybURhdGE7XG4gIGJvZHkob3B0aW9uczogQm9keU9wdGlvbnM8XCJqc29uXCI+KTogQm9keUpzb247XG4gIGJvZHkob3B0aW9uczogQm9keU9wdGlvbnM8XCJyZWFkZXJcIj4pOiBCb2R5UmVhZGVyO1xuICBib2R5KG9wdGlvbnM6IEJvZHlPcHRpb25zPFwic3RyZWFtXCI+KTogQm9keVN0cmVhbTtcbiAgYm9keShvcHRpb25zOiBCb2R5T3B0aW9uczxcInRleHRcIj4pOiBCb2R5VGV4dDtcbiAgYm9keShvcHRpb25zPzogQm9keU9wdGlvbnMpOiBCb2R5O1xuICAvKiogQWNjZXNzIHRoZSBib2R5IG9mIHRoZSByZXF1ZXN0LiBUaGlzIGlzIGEgbWV0aG9kLCBiZWNhdXNlIHRoZXJlIGFyZVxuICAgKiBzZXZlcmFsIG9wdGlvbnMgd2hpY2ggY2FuIGJlIHByb3ZpZGVkIHdoaWNoIGNhbiBpbmZsdWVuY2UgaG93IHRoZSBib2R5IGlzXG4gICAqIGhhbmRsZWQuICovXG4gIGJvZHkob3B0aW9uczogQm9keU9wdGlvbnMgPSB7fSk6IEJvZHkgfCBCb2R5UmVhZGVyIHwgQm9keVN0cmVhbSB7XG4gICAgcmV0dXJuIHRoaXMuI2JvZHkuZ2V0KG9wdGlvbnMpO1xuICB9XG5cbiAgW1N5bWJvbC5mb3IoXCJEZW5vLmN1c3RvbUluc3BlY3RcIildKGluc3BlY3Q6ICh2YWx1ZTogdW5rbm93bikgPT4gc3RyaW5nKSB7XG4gICAgY29uc3QgeyBoYXNCb2R5LCBoZWFkZXJzLCBpcCwgaXBzLCBtZXRob2QsIHNlY3VyZSwgdXJsIH0gPSB0aGlzO1xuICAgIHJldHVybiBgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9ICR7XG4gICAgICBpbnNwZWN0KHtcbiAgICAgICAgaGFzQm9keSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgICAgaXAsXG4gICAgICAgIGlwcyxcbiAgICAgICAgbWV0aG9kLFxuICAgICAgICBzZWN1cmUsXG4gICAgICAgIHVybDogdXJsLnRvU3RyaW5nKCksXG4gICAgICB9KVxuICAgIH1gO1xuICB9XG5cbiAgW1N5bWJvbC5mb3IoXCJub2RlanMudXRpbC5pbnNwZWN0LmN1c3RvbVwiKV0oXG4gICAgZGVwdGg6IG51bWJlcixcbiAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAgIG9wdGlvbnM6IGFueSxcbiAgICBpbnNwZWN0OiAodmFsdWU6IHVua25vd24sIG9wdGlvbnM/OiB1bmtub3duKSA9PiBzdHJpbmcsXG4gICkge1xuICAgIGlmIChkZXB0aCA8IDApIHtcbiAgICAgIHJldHVybiBvcHRpb25zLnN0eWxpemUoYFske3RoaXMuY29uc3RydWN0b3IubmFtZX1dYCwgXCJzcGVjaWFsXCIpO1xuICAgIH1cblxuICAgIGNvbnN0IG5ld09wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCBvcHRpb25zLCB7XG4gICAgICBkZXB0aDogb3B0aW9ucy5kZXB0aCA9PT0gbnVsbCA/IG51bGwgOiBvcHRpb25zLmRlcHRoIC0gMSxcbiAgICB9KTtcbiAgICBjb25zdCB7IGhhc0JvZHksIGhlYWRlcnMsIGlwLCBpcHMsIG1ldGhvZCwgc2VjdXJlLCB1cmwgfSA9IHRoaXM7XG4gICAgcmV0dXJuIGAke29wdGlvbnMuc3R5bGl6ZSh0aGlzLmNvbnN0cnVjdG9yLm5hbWUsIFwic3BlY2lhbFwiKX0gJHtcbiAgICAgIGluc3BlY3QoXG4gICAgICAgIHsgaGFzQm9keSwgaGVhZGVycywgaXAsIGlwcywgbWV0aG9kLCBzZWN1cmUsIHVybCB9LFxuICAgICAgICBuZXdPcHRpb25zLFxuICAgICAgKVxuICAgIH1gO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEseUVBQXlFO0FBYXpFLFNBQVMsV0FBVyxRQUFRLFlBQVk7QUFDeEMsU0FDRSxPQUFPLEVBQ1AsZ0JBQWdCLEVBQ2hCLGdCQUFnQixFQUVoQixTQUFTLFFBQ0osWUFBWTtBQVNuQjs7Ozs7OztDQU9DLEdBQ0QsT0FBTyxNQUFNO0lBQ1gsQ0FBQyxJQUFJLENBQWM7SUFDbkIsQ0FBQyxLQUFLLENBQVU7SUFDaEIsQ0FBQyxNQUFNLENBQVU7SUFDakIsQ0FBQyxhQUFhLENBQWdCO0lBQzlCLENBQUMsR0FBRyxDQUFPO0lBQ1gsQ0FBQyxTQUFTLENBQVk7SUFFdEIsQ0FBQyxhQUFhO1FBQ1osT0FBTyxJQUFJLENBQUMsQ0FBQyxhQUFhLENBQUMsY0FBYztJQUMzQztJQUVBOzs7Ozs7O0dBT0MsR0FDRCxJQUFJLFVBQW1CO1FBQ3JCLE9BQU8sSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDO0lBQ3BCO0lBRUEsMkNBQTJDLEdBQzNDLElBQUksVUFBbUI7UUFDckIsT0FBTyxJQUFJLENBQUMsQ0FBQyxhQUFhLENBQUM7SUFDN0I7SUFFQTs7R0FFQyxHQUNELElBQUksS0FBYTtRQUNmLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUMsYUFBYSxFQUFFLEtBQUs7SUFDaEU7SUFFQTs7a0VBRWdFLEdBQ2hFLElBQUksTUFBZ0I7UUFDbEIsT0FBTyxJQUFJLENBQUMsQ0FBQyxLQUFLLEdBQ2QsQ0FBQyxJQUFJLENBQUMsQ0FBQyxhQUFhLENBQUMsUUFBUSxJQUFJLHNCQUNqQyxJQUFJLENBQUMsQ0FBQyxhQUFhLEVBQUUsRUFBRSxNQUFNLGFBQzdCLEVBQUU7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