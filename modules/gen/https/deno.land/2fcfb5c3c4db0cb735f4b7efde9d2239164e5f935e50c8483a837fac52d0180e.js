// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/** Provides a iterable map interfaces for managing cookies server side.
 *
 * @example
 * To access the keys in a request and have any set keys available for creating
 * a response:
 *
 * ```ts
 * import {
 *   CookieMap,
 *   mergeHeaders
 * } from "https://deno.land/std@$STD_VERSION/http/cookie_map.ts";
 *
 * const request = new Request("https://localhost/", {
 *   headers: { "cookie": "foo=bar; bar=baz;"}
 * });
 *
 * const cookies = new CookieMap(request, { secure: true });
 * console.log(cookies.get("foo")); // logs "bar"
 * cookies.set("session", "1234567", { secure: true });
 *
 * const response = new Response("hello", {
 *   headers: mergeHeaders({
 *     "content-type": "text/plain",
 *   }, cookies),
 * });
 * ```
 *
 * @example
 * To have automatic management of cryptographically signed cookies, you can use
 * the {@linkcode SecureCookieMap} instead of {@linkcode CookieMap}. The biggest
 * difference is that the methods operate async in order to be able to support
 * async signing and validation of cookies:
 *
 * ```ts
 * import {
 *   SecureCookieMap,
 *   mergeHeaders,
 *   type KeyRing,
 * } from "https://deno.land/std@$STD_VERSION/http/cookie_map.ts";
 *
 * const request = new Request("https://localhost/", {
 *   headers: { "cookie": "foo=bar; bar=baz;"}
 * });
 *
 * // The keys must implement the `KeyRing` interface.
 * declare const keys: KeyRing;
 *
 * const cookies = new SecureCookieMap(request, { keys, secure: true });
 * console.log(await cookies.get("foo")); // logs "bar"
 * // the cookie will be automatically signed using the supplied key ring.
 * await cookies.set("session", "1234567");
 *
 * const response = new Response("hello", {
 *   headers: mergeHeaders({
 *     "content-type": "text/plain",
 *   }, cookies),
 * });
 * ```
 *
 * In addition, if you have a {@linkcode Response} or {@linkcode Headers} for a
 * response at construction of the cookies object, they can be passed and any
 * set cookies will be added directly to those headers:
 *
 * ```ts
 * import { CookieMap } from "https://deno.land/std@$STD_VERSION/http/cookie_map.ts";
 *
 * const request = new Request("https://localhost/", {
 *   headers: { "cookie": "foo=bar; bar=baz;"}
 * });
 *
 * const response = new Response("hello", {
 *   headers: { "content-type": "text/plain" },
 * });
 *
 * const cookies = new CookieMap(request, { response });
 * console.log(cookies.get("foo")); // logs "bar"
 * cookies.set("session", "1234567");
 * ```
 *
 * @module
 */ // deno-lint-ignore no-control-regex
const FIELD_CONTENT_REGEXP = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;
const KEY_REGEXP = /(?:^|;) *([^=]*)=[^;]*/g;
const SAME_SITE_REGEXP = /^(?:lax|none|strict)$/i;
const matchCache = {};
function getPattern(name) {
    if (name in matchCache) {
        return matchCache[name];
    }
    return matchCache[name] = new RegExp(`(?:^|;) *${name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}=([^;]*)`);
}
function pushCookie(values, cookie) {
    if (cookie.overwrite) {
        for(let i = values.length - 1; i >= 0; i--){
            if (values[i].indexOf(`${cookie.name}=`) === 0) {
                values.splice(i, 1);
            }
        }
    }
    values.push(cookie.toHeaderValue());
}
function validateCookieProperty(key, value) {
    if (value && !FIELD_CONTENT_REGEXP.test(value)) {
        throw new TypeError(`The "${key}" of the cookie (${value}) is invalid.`);
    }
}
/** An internal abstraction to manage cookies. */ class Cookie {
    domain;
    expires;
    httpOnly = true;
    maxAge;
    name;
    overwrite = false;
    path = "/";
    sameSite = false;
    secure = false;
    signed;
    value;
    constructor(name, value, attributes){
        validateCookieProperty("name", name);
        this.name = name;
        validateCookieProperty("value", value);
        this.value = value ?? "";
        Object.assign(this, attributes);
        if (!this.value) {
            this.expires = new Date(0);
            this.maxAge = undefined;
        }
        validateCookieProperty("path", this.path);
        validateCookieProperty("domain", this.domain);
        if (this.sameSite && typeof this.sameSite === "string" && !SAME_SITE_REGEXP.test(this.sameSite)) {
            throw new TypeError(`The "sameSite" of the cookie ("${this.sameSite}") is invalid.`);
        }
    }
    toHeaderValue() {
        let value = this.toString();
        if (this.maxAge) {
            this.expires = new Date(Date.now() + this.maxAge * 1000);
        }
        if (this.path) {
            value += `; path=${this.path}`;
        }
        if (this.expires) {
            value += `; expires=${this.expires.toUTCString()}`;
        }
        if (this.domain) {
            value += `; domain=${this.domain}`;
        }
        if (this.sameSite) {
            value += `; samesite=${this.sameSite === true ? "strict" : this.sameSite.toLowerCase()}`;
        }
        if (this.secure) {
            value += "; secure";
        }
        if (this.httpOnly) {
            value += "; httponly";
        }
        return value;
    }
    toString() {
        return `${this.name}=${this.value}`;
    }
}
/** Symbol which is used in {@link mergeHeaders} to extract a
 * `[string | string][]` from an instance to generate the final set of
 * headers. */ export const cookieMapHeadersInitSymbol = Symbol.for("Deno.std.cookieMap.headersInit");
function isMergeable(value) {
    return value != null && typeof value === "object" && cookieMapHeadersInitSymbol in value;
}
/** Allows merging of various sources of headers into a final set of headers
 * which can be used in a {@linkcode Response}.
 *
 * Note, that unlike when passing a `Response` or {@linkcode Headers} used in a
 * response to {@linkcode CookieMap} or {@linkcode SecureCookieMap}, merging
 * will not ensure that there are no other `Set-Cookie` headers from other
 * sources, it will simply append the various headers together. */ export function mergeHeaders(...sources) {
    const headers = new Headers();
    for (const source of sources){
        let entries;
        if (source instanceof Headers) {
            entries = source;
        } else if ("headers" in source && source.headers instanceof Headers) {
            entries = source.headers;
        } else if (isMergeable(source)) {
            entries = source[cookieMapHeadersInitSymbol]();
        } else if (Array.isArray(source)) {
            entries = source;
        } else {
            entries = Object.entries(source);
        }
        for (const [key, value] of entries){
            headers.append(key, value);
        }
    }
    return headers;
}
const keys = Symbol("#keys");
const requestHeaders = Symbol("#requestHeaders");
const responseHeaders = Symbol("#responseHeaders");
const isSecure = Symbol("#secure");
const requestKeys = Symbol("#requestKeys");
/** An internal abstract class which provides common functionality for
 * {@link CookieMap} and {@link SecureCookieMap}. */ class CookieMapBase {
    [keys];
    [requestHeaders];
    [responseHeaders];
    [isSecure];
    [requestKeys]() {
        if (this[keys]) {
            return this[keys];
        }
        const result = this[keys] = [];
        const header = this[requestHeaders].get("cookie");
        if (!header) {
            return result;
        }
        let matches;
        while(matches = KEY_REGEXP.exec(header)){
            const [, key] = matches;
            result.push(key);
        }
        return result;
    }
    constructor(request, options){
        this[requestHeaders] = "headers" in request ? request.headers : request;
        const { secure =false , response =new Headers()  } = options;
        this[responseHeaders] = "headers" in response ? response.headers : response;
        this[isSecure] = secure;
    }
    /** A method used by {@linkcode mergeHeaders} to be able to merge
   * headers from various sources when forming a {@linkcode Response}. */ [cookieMapHeadersInitSymbol]() {
        const init = [];
        for (const [key, value] of this[responseHeaders]){
            if (key === "set-cookie") {
                init.push([
                    key,
                    value
                ]);
            }
        }
        return init;
    }
    [Symbol.for("Deno.customInspect")]() {
        return `${this.constructor.name} []`;
    }
    [Symbol.for("nodejs.util.inspect.custom")](depth, // deno-lint-ignore no-explicit-any
    options, inspect) {
        if (depth < 0) {
            return options.stylize(`[${this.constructor.name}]`, "special");
        }
        const newOptions = Object.assign({}, options, {
            depth: options.depth === null ? null : options.depth - 1
        });
        return `${options.stylize(this.constructor.name, "special")} ${inspect([], newOptions)}`;
    }
}
/**
 * Provides a way to manage cookies in a request and response on the server
 * as a single iterable collection.
 *
 * The methods and properties align to {@linkcode Map}. When constructing a
 * {@linkcode Request} or {@linkcode Headers} from the request need to be
 * provided, as well as optionally the {@linkcode Response} or `Headers` for the
 * response can be provided. Alternatively the {@linkcode mergeHeaders}
 * function can be used to generate a final set of headers for sending in the
 * response. */ export class CookieMap extends CookieMapBase {
    /** Contains the number of valid cookies in the request headers. */ get size() {
        return [
            ...this
        ].length;
    }
    constructor(request, options = {}){
        super(request, options);
    }
    /** Deletes all the cookies from the {@linkcode Request} in the response. */ clear(options = {}) {
        for (const key of this.keys()){
            this.set(key, null, options);
        }
    }
    /** Set a cookie to be deleted in the response.
   *
   * This is a convenience function for `set(key, null, options?)`.
   */ delete(key, options = {}) {
        this.set(key, null, options);
        return true;
    }
    /** Return the value of a matching key present in the {@linkcode Request}. If
   * the key is not present `undefined` is returned. */ get(key) {
        const headerValue = this[requestHeaders].get("cookie");
        if (!headerValue) {
            return undefined;
        }
        const match = headerValue.match(getPattern(key));
        if (!match) {
            return undefined;
        }
        const [, value] = match;
        return value;
    }
    /** Returns `true` if the matching key is present in the {@linkcode Request},
   * otherwise `false`. */ has(key) {
        const headerValue = this[requestHeaders].get("cookie");
        if (!headerValue) {
            return false;
        }
        return getPattern(key).test(headerValue);
    }
    /** Set a named cookie in the response. The optional
   * {@linkcode CookieMapSetDeleteOptions} are applied to the cookie being set.
   */ set(key, value, options = {}) {
        const resHeaders = this[responseHeaders];
        const values = [];
        for (const [key, value] of resHeaders){
            if (key === "set-cookie") {
                values.push(value);
            }
        }
        const secure = this[isSecure];
        if (!secure && options.secure && !options.ignoreInsecure) {
            throw new TypeError("Cannot send secure cookie over unencrypted connection.");
        }
        const cookie = new Cookie(key, value, options);
        cookie.secure = options.secure ?? secure;
        pushCookie(values, cookie);
        resHeaders.delete("set-cookie");
        for (const value of values){
            resHeaders.append("set-cookie", value);
        }
        return this;
    }
    /** Iterate over the cookie keys and values that are present in the
   * {@linkcode Request}. This is an alias of the `[Symbol.iterator]` method
   * present on the class. */ entries() {
        return this[Symbol.iterator]();
    }
    /** Iterate over the cookie keys that are present in the
   * {@linkcode Request}. */ *keys() {
        for (const [key] of this){
            yield key;
        }
    }
    /** Iterate over the cookie values that are present in the
   * {@linkcode Request}. */ *values() {
        for (const [, value] of this){
            yield value;
        }
    }
    /** Iterate over the cookie keys and values that are present in the
   * {@linkcode Request}. */ *[Symbol.iterator]() {
        const keys = this[requestKeys]();
        for (const key of keys){
            const value = this.get(key);
            if (value) {
                yield [
                    key,
                    value
                ];
            }
        }
    }
}
/** Provides an way to manage cookies in a request and response on the server
 * as a single iterable collection, as well as the ability to sign and verify
 * cookies to prevent tampering.
 *
 * The methods and properties align to {@linkcode Map}, but due to the need to
 * support asynchronous cryptographic keys, all the APIs operate async. When
 * constructing a {@linkcode Request} or {@linkcode Headers} from the request
 * need to be provided, as well as optionally the {@linkcode Response} or
 * `Headers` for the response can be provided. Alternatively the
 * {@linkcode mergeHeaders} function can be used to generate a final set
 * of headers for sending in the response.
 *
 * On construction, the optional set of keys implementing the
 * {@linkcode KeyRing} interface. While it is optional, if you don't plan to use
 * keys, you might want to consider using just the {@linkcode CookieMap}.
 *
 * @example
 */ export class SecureCookieMap extends CookieMapBase {
    #keyRing;
    /** Is set to a promise which resolves with the number of cookies in the
   * {@linkcode Request}. */ get size() {
        return (async ()=>{
            let size = 0;
            for await (const _ of this){
                size++;
            }
            return size;
        })();
    }
    constructor(request, options = {}){
        super(request, options);
        const { keys  } = options;
        this.#keyRing = keys;
    }
    /** Sets all cookies in the {@linkcode Request} to be deleted in the
   * response. */ async clear(options) {
        for await (const key of this.keys()){
            await this.set(key, null, options);
        }
    }
    /** Set a cookie to be deleted in the response.
   *
   * This is a convenience function for `set(key, null, options?)`. */ async delete(key, options = {}) {
        await this.set(key, null, options);
        return true;
    }
    /** Get the value of a cookie from the {@linkcode Request}.
   *
   * If the cookie is signed, and the signature is invalid, `undefined` will be
   * returned and the cookie will be set to be deleted in the response. If the
   * cookie is using an "old" key from the keyring, the cookie will be re-signed
   * with the current key and be added to the response to be updated. */ async get(key, options = {}) {
        const signed = options.signed ?? !!this.#keyRing;
        const nameSig = `${key}.sig`;
        const header = this[requestHeaders].get("cookie");
        if (!header) {
            return;
        }
        const match = header.match(getPattern(key));
        if (!match) {
            return;
        }
        const [, value] = match;
        if (!signed) {
            return value;
        }
        const digest = await this.get(nameSig, {
            signed: false
        });
        if (!digest) {
            return;
        }
        const data = `${key}=${value}`;
        if (!this.#keyRing) {
            throw new TypeError("key ring required for signed cookies");
        }
        const index = await this.#keyRing.indexOf(data, digest);
        if (index < 0) {
            await this.delete(nameSig, {
                path: "/",
                signed: false
            });
        } else {
            if (index) {
                await this.set(nameSig, await this.#keyRing.sign(data), {
                    signed: false
                });
            }
            return value;
        }
    }
    /** Returns `true` if the key is in the {@linkcode Request}.
   *
   * If the cookie is signed, and the signature is invalid, `false` will be
   * returned and the cookie will be set to be deleted in the response. If the
   * cookie is using an "old" key from the keyring, the cookie will be re-signed
   * with the current key and be added to the response to be updated. */ async has(key, options = {}) {
        const signed = options.signed ?? !!this.#keyRing;
        const nameSig = `${key}.sig`;
        const header = this[requestHeaders].get("cookie");
        if (!header) {
            return false;
        }
        const match = header.match(getPattern(key));
        if (!match) {
            return false;
        }
        if (!signed) {
            return true;
        }
        const digest = await this.get(nameSig, {
            signed: false
        });
        if (!digest) {
            return false;
        }
        const [, value] = match;
        const data = `${key}=${value}`;
        if (!this.#keyRing) {
            throw new TypeError("key ring required for signed cookies");
        }
        const index = await this.#keyRing.indexOf(data, digest);
        if (index < 0) {
            await this.delete(nameSig, {
                path: "/",
                signed: false
            });
            return false;
        } else {
            if (index) {
                await this.set(nameSig, await this.#keyRing.sign(data), {
                    signed: false
                });
            }
            return true;
        }
    }
    /** Set a cookie in the response headers.
   *
   * If there was a keyring set, cookies will be automatically signed, unless
   * overridden by the passed options. Cookies can be deleted by setting the
   * value to `null`. */ async set(key, value, options = {}) {
        const resHeaders = this[responseHeaders];
        const headers = [];
        for (const [key, value] of resHeaders.entries()){
            if (key === "set-cookie") {
                headers.push(value);
            }
        }
        const secure = this[isSecure];
        const signed = options.signed ?? !!this.#keyRing;
        if (!secure && options.secure && !options.ignoreInsecure) {
            throw new TypeError("Cannot send secure cookie over unencrypted connection.");
        }
        const cookie = new Cookie(key, value, options);
        cookie.secure = options.secure ?? secure;
        pushCookie(headers, cookie);
        if (signed) {
            if (!this.#keyRing) {
                throw new TypeError("keys required for signed cookies.");
            }
            cookie.value = await this.#keyRing.sign(cookie.toString());
            cookie.name += ".sig";
            pushCookie(headers, cookie);
        }
        resHeaders.delete("set-cookie");
        for (const header of headers){
            resHeaders.append("set-cookie", header);
        }
        return this;
    }
    /** Iterate over the {@linkcode Request} cookies, yielding up a tuple
   * containing the key and value of each cookie.
   *
   * If a key ring was provided, only properly signed cookie keys and values are
   * returned. */ entries() {
        return this[Symbol.asyncIterator]();
    }
    /** Iterate over the request's cookies, yielding up the key of each cookie.
   *
   * If a keyring was provided, only properly signed cookie keys are
   * returned. */ async *keys() {
        for await (const [key] of this){
            yield key;
        }
    }
    /** Iterate over the request's cookies, yielding up the value of each cookie.
   *
   * If a keyring was provided, only properly signed cookie values are
   * returned. */ async *values() {
        for await (const [, value] of this){
            yield value;
        }
    }
    /** Iterate over the {@linkcode Request} cookies, yielding up a tuple
   * containing the key and value of each cookie.
   *
   * If a key ring was provided, only properly signed cookie keys and values are
   * returned. */ async *[Symbol.asyncIterator]() {
        const keys = this[requestKeys]();
        for (const key of keys){
            const value = await this.get(key);
            if (value) {
                yield [
                    key,
                    value
                ];
            }
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5My4wL2h0dHAvY29va2llX21hcC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIzIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG4vKiogUHJvdmlkZXMgYSBpdGVyYWJsZSBtYXAgaW50ZXJmYWNlcyBmb3IgbWFuYWdpbmcgY29va2llcyBzZXJ2ZXIgc2lkZS5cbiAqXG4gKiBAZXhhbXBsZVxuICogVG8gYWNjZXNzIHRoZSBrZXlzIGluIGEgcmVxdWVzdCBhbmQgaGF2ZSBhbnkgc2V0IGtleXMgYXZhaWxhYmxlIGZvciBjcmVhdGluZ1xuICogYSByZXNwb25zZTpcbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHtcbiAqICAgQ29va2llTWFwLFxuICogICBtZXJnZUhlYWRlcnNcbiAqIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vaHR0cC9jb29raWVfbWFwLnRzXCI7XG4gKlxuICogY29uc3QgcmVxdWVzdCA9IG5ldyBSZXF1ZXN0KFwiaHR0cHM6Ly9sb2NhbGhvc3QvXCIsIHtcbiAqICAgaGVhZGVyczogeyBcImNvb2tpZVwiOiBcImZvbz1iYXI7IGJhcj1iYXo7XCJ9XG4gKiB9KTtcbiAqXG4gKiBjb25zdCBjb29raWVzID0gbmV3IENvb2tpZU1hcChyZXF1ZXN0LCB7IHNlY3VyZTogdHJ1ZSB9KTtcbiAqIGNvbnNvbGUubG9nKGNvb2tpZXMuZ2V0KFwiZm9vXCIpKTsgLy8gbG9ncyBcImJhclwiXG4gKiBjb29raWVzLnNldChcInNlc3Npb25cIiwgXCIxMjM0NTY3XCIsIHsgc2VjdXJlOiB0cnVlIH0pO1xuICpcbiAqIGNvbnN0IHJlc3BvbnNlID0gbmV3IFJlc3BvbnNlKFwiaGVsbG9cIiwge1xuICogICBoZWFkZXJzOiBtZXJnZUhlYWRlcnMoe1xuICogICAgIFwiY29udGVudC10eXBlXCI6IFwidGV4dC9wbGFpblwiLFxuICogICB9LCBjb29raWVzKSxcbiAqIH0pO1xuICogYGBgXG4gKlxuICogQGV4YW1wbGVcbiAqIFRvIGhhdmUgYXV0b21hdGljIG1hbmFnZW1lbnQgb2YgY3J5cHRvZ3JhcGhpY2FsbHkgc2lnbmVkIGNvb2tpZXMsIHlvdSBjYW4gdXNlXG4gKiB0aGUge0BsaW5rY29kZSBTZWN1cmVDb29raWVNYXB9IGluc3RlYWQgb2Yge0BsaW5rY29kZSBDb29raWVNYXB9LiBUaGUgYmlnZ2VzdFxuICogZGlmZmVyZW5jZSBpcyB0aGF0IHRoZSBtZXRob2RzIG9wZXJhdGUgYXN5bmMgaW4gb3JkZXIgdG8gYmUgYWJsZSB0byBzdXBwb3J0XG4gKiBhc3luYyBzaWduaW5nIGFuZCB2YWxpZGF0aW9uIG9mIGNvb2tpZXM6XG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7XG4gKiAgIFNlY3VyZUNvb2tpZU1hcCxcbiAqICAgbWVyZ2VIZWFkZXJzLFxuICogICB0eXBlIEtleVJpbmcsXG4gKiB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2h0dHAvY29va2llX21hcC50c1wiO1xuICpcbiAqIGNvbnN0IHJlcXVlc3QgPSBuZXcgUmVxdWVzdChcImh0dHBzOi8vbG9jYWxob3N0L1wiLCB7XG4gKiAgIGhlYWRlcnM6IHsgXCJjb29raWVcIjogXCJmb289YmFyOyBiYXI9YmF6O1wifVxuICogfSk7XG4gKlxuICogLy8gVGhlIGtleXMgbXVzdCBpbXBsZW1lbnQgdGhlIGBLZXlSaW5nYCBpbnRlcmZhY2UuXG4gKiBkZWNsYXJlIGNvbnN0IGtleXM6IEtleVJpbmc7XG4gKlxuICogY29uc3QgY29va2llcyA9IG5ldyBTZWN1cmVDb29raWVNYXAocmVxdWVzdCwgeyBrZXlzLCBzZWN1cmU6IHRydWUgfSk7XG4gKiBjb25zb2xlLmxvZyhhd2FpdCBjb29raWVzLmdldChcImZvb1wiKSk7IC8vIGxvZ3MgXCJiYXJcIlxuICogLy8gdGhlIGNvb2tpZSB3aWxsIGJlIGF1dG9tYXRpY2FsbHkgc2lnbmVkIHVzaW5nIHRoZSBzdXBwbGllZCBrZXkgcmluZy5cbiAqIGF3YWl0IGNvb2tpZXMuc2V0KFwic2Vzc2lvblwiLCBcIjEyMzQ1NjdcIik7XG4gKlxuICogY29uc3QgcmVzcG9uc2UgPSBuZXcgUmVzcG9uc2UoXCJoZWxsb1wiLCB7XG4gKiAgIGhlYWRlcnM6IG1lcmdlSGVhZGVycyh7XG4gKiAgICAgXCJjb250ZW50LXR5cGVcIjogXCJ0ZXh0L3BsYWluXCIsXG4gKiAgIH0sIGNvb2tpZXMpLFxuICogfSk7XG4gKiBgYGBcbiAqXG4gKiBJbiBhZGRpdGlvbiwgaWYgeW91IGhhdmUgYSB7QGxpbmtjb2RlIFJlc3BvbnNlfSBvciB7QGxpbmtjb2RlIEhlYWRlcnN9IGZvciBhXG4gKiByZXNwb25zZSBhdCBjb25zdHJ1Y3Rpb24gb2YgdGhlIGNvb2tpZXMgb2JqZWN0LCB0aGV5IGNhbiBiZSBwYXNzZWQgYW5kIGFueVxuICogc2V0IGNvb2tpZXMgd2lsbCBiZSBhZGRlZCBkaXJlY3RseSB0byB0aG9zZSBoZWFkZXJzOlxuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBDb29raWVNYXAgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9odHRwL2Nvb2tpZV9tYXAudHNcIjtcbiAqXG4gKiBjb25zdCByZXF1ZXN0ID0gbmV3IFJlcXVlc3QoXCJodHRwczovL2xvY2FsaG9zdC9cIiwge1xuICogICBoZWFkZXJzOiB7IFwiY29va2llXCI6IFwiZm9vPWJhcjsgYmFyPWJhejtcIn1cbiAqIH0pO1xuICpcbiAqIGNvbnN0IHJlc3BvbnNlID0gbmV3IFJlc3BvbnNlKFwiaGVsbG9cIiwge1xuICogICBoZWFkZXJzOiB7IFwiY29udGVudC10eXBlXCI6IFwidGV4dC9wbGFpblwiIH0sXG4gKiB9KTtcbiAqXG4gKiBjb25zdCBjb29raWVzID0gbmV3IENvb2tpZU1hcChyZXF1ZXN0LCB7IHJlc3BvbnNlIH0pO1xuICogY29uc29sZS5sb2coY29va2llcy5nZXQoXCJmb29cIikpOyAvLyBsb2dzIFwiYmFyXCJcbiAqIGNvb2tpZXMuc2V0KFwic2Vzc2lvblwiLCBcIjEyMzQ1NjdcIik7XG4gKiBgYGBcbiAqXG4gKiBAbW9kdWxlXG4gKi9cblxuZXhwb3J0IGludGVyZmFjZSBDb29raWVNYXBPcHRpb25zIHtcbiAgLyoqIFRoZSB7QGxpbmtjb2RlIFJlc3BvbnNlfSBvciB0aGUgaGVhZGVycyB0aGF0IHdpbGwgYmUgdXNlZCB3aXRoIHRoZVxuICAgKiByZXNwb25zZS4gV2hlbiBwcm92aWRlZCwgYFNldC1Db29raWVgIGhlYWRlcnMgd2lsbCBiZSBzZXQgaW4gdGhlIGhlYWRlcnNcbiAgICogd2hlbiBjb29raWVzIGFyZSBzZXQgb3IgZGVsZXRlZCBpbiB0aGUgbWFwLlxuICAgKlxuICAgKiBBbiBhbHRlcm5hdGl2ZSB3YXkgdG8gZXh0cmFjdCB0aGUgaGVhZGVycyBpcyB0byBwYXNzIHRoZSBjb29raWUgbWFwIHRvIHRoZVxuICAgKiB7QGxpbmtjb2RlIG1lcmdlSGVhZGVyc30gZnVuY3Rpb24gdG8gbWVyZ2UgdmFyaW91cyBzb3VyY2VzIG9mIHRoZVxuICAgKiBoZWFkZXJzIHRvIGJlIHByb3ZpZGVkIHdoZW4gY3JlYXRpbmcgb3IgdXBkYXRpbmcgYSByZXNwb25zZS5cbiAgICovXG4gIHJlc3BvbnNlPzogSGVhZGVyZWQgfCBIZWFkZXJzO1xuICAvKiogQSBmbGFnIHRoYXQgaW5kaWNhdGVzIGlmIHRoZSByZXF1ZXN0IGFuZCByZXNwb25zZSBhcmUgYmVpbmcgaGFuZGxlZCBvdmVyXG4gICAqIGEgc2VjdXJlIChlLmcuIEhUVFBTL1RMUykgY29ubmVjdGlvbi5cbiAgICpcbiAgICogQGRlZmF1bHQge2ZhbHNlfVxuICAgKi9cbiAgc2VjdXJlPzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDb29raWVNYXBTZXREZWxldGVPcHRpb25zIHtcbiAgLyoqIFRoZSBkb21haW4gdG8gc2NvcGUgdGhlIGNvb2tpZSBmb3IuICovXG4gIGRvbWFpbj86IHN0cmluZztcbiAgLyoqIFdoZW4gdGhlIGNvb2tpZSBleHBpcmVzLiAqL1xuICBleHBpcmVzPzogRGF0ZTtcbiAgLyoqIEEgZmxhZyB0aGF0IGluZGljYXRlcyBpZiB0aGUgY29va2llIGlzIHZhbGlkIG92ZXIgSFRUUCBvbmx5LiAqL1xuICBodHRwT25seT86IGJvb2xlYW47XG4gIC8qKiBEbyBub3QgZXJyb3Igd2hlbiBzaWduaW5nIGFuZCB2YWxpZGF0aW5nIGNvb2tpZXMgb3ZlciBhbiBpbnNlY3VyZVxuICAgKiBjb25uZWN0aW9uLiAqL1xuICBpZ25vcmVJbnNlY3VyZT86IGJvb2xlYW47XG4gIC8qKiBPdmVyd3JpdGUgYW4gZXhpc3RpbmcgdmFsdWUuICovXG4gIG92ZXJ3cml0ZT86IGJvb2xlYW47XG4gIC8qKiBUaGUgcGF0aCB0aGUgY29va2llIGlzIHZhbGlkIGZvci4gKi9cbiAgcGF0aD86IHN0cmluZztcbiAgLyoqIE92ZXJyaWRlIHRoZSBmbGFnIHRoYXQgd2FzIHNldCB3aGVuIHRoZSBpbnN0YW5jZSB3YXMgY3JlYXRlZC4gKi9cbiAgc2VjdXJlPzogYm9vbGVhbjtcbiAgLyoqIFNldCB0aGUgc2FtZS1zaXRlIGluZGljYXRvciBmb3IgYSBjb29raWUuICovXG4gIHNhbWVTaXRlPzogXCJzdHJpY3RcIiB8IFwibGF4XCIgfCBcIm5vbmVcIiB8IGJvb2xlYW47XG59XG5cbi8qKiBBbiBvYmplY3Qgd2hpY2ggY29udGFpbnMgYSBgaGVhZGVyc2AgcHJvcGVydHkgd2hpY2ggaGFzIGEgdmFsdWUgb2YgYW5cbiAqIGluc3RhbmNlIG9mIHtAbGlua2NvZGUgSGVhZGVyc30sIGxpa2Uge0BsaW5rY29kZSBSZXF1ZXN0fSBhbmRcbiAqIHtAbGlua2NvZGUgUmVzcG9uc2V9LiAqL1xuZXhwb3J0IGludGVyZmFjZSBIZWFkZXJlZCB7XG4gIGhlYWRlcnM6IEhlYWRlcnM7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWVyZ2VhYmxlIHtcbiAgW2Nvb2tpZU1hcEhlYWRlcnNJbml0U3ltYm9sXSgpOiBbc3RyaW5nLCBzdHJpbmddW107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2VjdXJlQ29va2llTWFwT3B0aW9ucyB7XG4gIC8qKiBLZXlzIHdoaWNoIHdpbGwgYmUgdXNlZCB0byB2YWxpZGF0ZSBhbmQgc2lnbiBjb29raWVzLiBUaGUga2V5IHJpbmcgc2hvdWxkXG4gICAqIGltcGxlbWVudCB0aGUge0BsaW5rY29kZSBLZXlSaW5nfSBpbnRlcmZhY2UuICovXG4gIGtleXM/OiBLZXlSaW5nO1xuXG4gIC8qKiBUaGUge0BsaW5rY29kZSBSZXNwb25zZX0gb3IgdGhlIGhlYWRlcnMgdGhhdCB3aWxsIGJlIHVzZWQgd2l0aCB0aGVcbiAgICogcmVzcG9uc2UuIFdoZW4gcHJvdmlkZWQsIGBTZXQtQ29va2llYCBoZWFkZXJzIHdpbGwgYmUgc2V0IGluIHRoZSBoZWFkZXJzXG4gICAqIHdoZW4gY29va2llcyBhcmUgc2V0IG9yIGRlbGV0ZWQgaW4gdGhlIG1hcC5cbiAgICpcbiAgICogQW4gYWx0ZXJuYXRpdmUgd2F5IHRvIGV4dHJhY3QgdGhlIGhlYWRlcnMgaXMgdG8gcGFzcyB0aGUgY29va2llIG1hcCB0byB0aGVcbiAgICoge0BsaW5rY29kZSBtZXJnZUhlYWRlcnN9IGZ1bmN0aW9uIHRvIG1lcmdlIHZhcmlvdXMgc291cmNlcyBvZiB0aGVcbiAgICogaGVhZGVycyB0byBiZSBwcm92aWRlZCB3aGVuIGNyZWF0aW5nIG9yIHVwZGF0aW5nIGEgcmVzcG9uc2UuXG4gICAqL1xuICByZXNwb25zZT86IEhlYWRlcmVkIHwgSGVhZGVycztcblxuICAvKiogQSBmbGFnIHRoYXQgaW5kaWNhdGVzIGlmIHRoZSByZXF1ZXN0IGFuZCByZXNwb25zZSBhcmUgYmVpbmcgaGFuZGxlZCBvdmVyXG4gICAqIGEgc2VjdXJlIChlLmcuIEhUVFBTL1RMUykgY29ubmVjdGlvbi5cbiAgICpcbiAgICogQGRlZmF1bHQge2ZhbHNlfVxuICAgKi9cbiAgc2VjdXJlPzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTZWN1cmVDb29raWVNYXBHZXRPcHRpb25zIHtcbiAgLyoqIE92ZXJyaWRlcyB0aGUgZmxhZyB0aGF0IHdhcyBzZXQgd2hlbiB0aGUgaW5zdGFuY2Ugd2FzIGNyZWF0ZWQuICovXG4gIHNpZ25lZD86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2VjdXJlQ29va2llTWFwU2V0RGVsZXRlT3B0aW9ucyB7XG4gIC8qKiBUaGUgZG9tYWluIHRvIHNjb3BlIHRoZSBjb29raWUgZm9yLiAqL1xuICBkb21haW4/OiBzdHJpbmc7XG4gIC8qKiBXaGVuIHRoZSBjb29raWUgZXhwaXJlcy4gKi9cbiAgZXhwaXJlcz86IERhdGU7XG4gIC8qKiBBIGZsYWcgdGhhdCBpbmRpY2F0ZXMgaWYgdGhlIGNvb2tpZSBpcyB2YWxpZCBvdmVyIEhUVFAgb25seS4gKi9cbiAgaHR0cE9ubHk/OiBib29sZWFuO1xuICAvKiogRG8gbm90IGVycm9yIHdoZW4gc2lnbmluZyBhbmQgdmFsaWRhdGluZyBjb29raWVzIG92ZXIgYW4gaW5zZWN1cmVcbiAgICogY29ubmVjdGlvbi4gKi9cbiAgaWdub3JlSW5zZWN1cmU/OiBib29sZWFuO1xuICAvKiogT3ZlcndyaXRlIGFuIGV4aXN0aW5nIHZhbHVlLiAqL1xuICBvdmVyd3JpdGU/OiBib29sZWFuO1xuICAvKiogVGhlIHBhdGggdGhlIGNvb2tpZSBpcyB2YWxpZCBmb3IuICovXG4gIHBhdGg/OiBzdHJpbmc7XG4gIC8qKiBPdmVycmlkZSB0aGUgZmxhZyB0aGF0IHdhcyBzZXQgd2hlbiB0aGUgaW5zdGFuY2Ugd2FzIGNyZWF0ZWQuICovXG4gIHNlY3VyZT86IGJvb2xlYW47XG4gIC8qKiBTZXQgdGhlIHNhbWUtc2l0ZSBpbmRpY2F0b3IgZm9yIGEgY29va2llLiAqL1xuICBzYW1lU2l0ZT86IFwic3RyaWN0XCIgfCBcImxheFwiIHwgXCJub25lXCIgfCBib29sZWFuO1xuICAvKiogT3ZlcnJpZGUgdGhlIGRlZmF1bHQgYmVoYXZpb3Igb2Ygc2lnbmluZyB0aGUgY29va2llLiAqL1xuICBzaWduZWQ/OiBib29sZWFuO1xufVxuXG50eXBlIENvb2tpZUF0dHJpYnV0ZXMgPSBTZWN1cmVDb29raWVNYXBTZXREZWxldGVPcHRpb25zO1xuXG4vLyBkZW5vLWxpbnQtaWdub3JlIG5vLWNvbnRyb2wtcmVnZXhcbmNvbnN0IEZJRUxEX0NPTlRFTlRfUkVHRVhQID0gL15bXFx1MDAwOVxcdTAwMjAtXFx1MDA3ZVxcdTAwODAtXFx1MDBmZl0rJC87XG5jb25zdCBLRVlfUkVHRVhQID0gLyg/Ol58OykgKihbXj1dKik9W147XSovZztcbmNvbnN0IFNBTUVfU0lURV9SRUdFWFAgPSAvXig/OmxheHxub25lfHN0cmljdCkkL2k7XG5cbmNvbnN0IG1hdGNoQ2FjaGU6IFJlY29yZDxzdHJpbmcsIFJlZ0V4cD4gPSB7fTtcbmZ1bmN0aW9uIGdldFBhdHRlcm4obmFtZTogc3RyaW5nKTogUmVnRXhwIHtcbiAgaWYgKG5hbWUgaW4gbWF0Y2hDYWNoZSkge1xuICAgIHJldHVybiBtYXRjaENhY2hlW25hbWVdO1xuICB9XG5cbiAgcmV0dXJuIG1hdGNoQ2FjaGVbbmFtZV0gPSBuZXcgUmVnRXhwKFxuICAgIGAoPzpefDspICoke25hbWUucmVwbGFjZSgvWy1bXFxde30oKSorPy4sXFxcXF4kfCNcXHNdL2csIFwiXFxcXCQmXCIpfT0oW147XSopYCxcbiAgKTtcbn1cblxuZnVuY3Rpb24gcHVzaENvb2tpZSh2YWx1ZXM6IHN0cmluZ1tdLCBjb29raWU6IENvb2tpZSkge1xuICBpZiAoY29va2llLm92ZXJ3cml0ZSkge1xuICAgIGZvciAobGV0IGkgPSB2YWx1ZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIGlmICh2YWx1ZXNbaV0uaW5kZXhPZihgJHtjb29raWUubmFtZX09YCkgPT09IDApIHtcbiAgICAgICAgdmFsdWVzLnNwbGljZShpLCAxKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgdmFsdWVzLnB1c2goY29va2llLnRvSGVhZGVyVmFsdWUoKSk7XG59XG5cbmZ1bmN0aW9uIHZhbGlkYXRlQ29va2llUHJvcGVydHkoXG4gIGtleTogc3RyaW5nLFxuICB2YWx1ZTogc3RyaW5nIHwgdW5kZWZpbmVkIHwgbnVsbCxcbikge1xuICBpZiAodmFsdWUgJiYgIUZJRUxEX0NPTlRFTlRfUkVHRVhQLnRlc3QodmFsdWUpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgVGhlIFwiJHtrZXl9XCIgb2YgdGhlIGNvb2tpZSAoJHt2YWx1ZX0pIGlzIGludmFsaWQuYCk7XG4gIH1cbn1cblxuLyoqIEFuIGludGVybmFsIGFic3RyYWN0aW9uIHRvIG1hbmFnZSBjb29raWVzLiAqL1xuY2xhc3MgQ29va2llIGltcGxlbWVudHMgQ29va2llQXR0cmlidXRlcyB7XG4gIGRvbWFpbj86IHN0cmluZztcbiAgZXhwaXJlcz86IERhdGU7XG4gIGh0dHBPbmx5ID0gdHJ1ZTtcbiAgbWF4QWdlPzogbnVtYmVyO1xuICBuYW1lOiBzdHJpbmc7XG4gIG92ZXJ3cml0ZSA9IGZhbHNlO1xuICBwYXRoID0gXCIvXCI7XG4gIHNhbWVTaXRlOiBcInN0cmljdFwiIHwgXCJsYXhcIiB8IFwibm9uZVwiIHwgYm9vbGVhbiA9IGZhbHNlO1xuICBzZWN1cmUgPSBmYWxzZTtcbiAgc2lnbmVkPzogYm9vbGVhbjtcbiAgdmFsdWU6IHN0cmluZztcblxuICBjb25zdHJ1Y3RvcihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgdmFsdWU6IHN0cmluZyB8IG51bGwsXG4gICAgYXR0cmlidXRlczogQ29va2llQXR0cmlidXRlcyxcbiAgKSB7XG4gICAgdmFsaWRhdGVDb29raWVQcm9wZXJ0eShcIm5hbWVcIiwgbmFtZSk7XG4gICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB2YWxpZGF0ZUNvb2tpZVByb3BlcnR5KFwidmFsdWVcIiwgdmFsdWUpO1xuICAgIHRoaXMudmFsdWUgPSB2YWx1ZSA/PyBcIlwiO1xuICAgIE9iamVjdC5hc3NpZ24odGhpcywgYXR0cmlidXRlcyk7XG4gICAgaWYgKCF0aGlzLnZhbHVlKSB7XG4gICAgICB0aGlzLmV4cGlyZXMgPSBuZXcgRGF0ZSgwKTtcbiAgICAgIHRoaXMubWF4QWdlID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIHZhbGlkYXRlQ29va2llUHJvcGVydHkoXCJwYXRoXCIsIHRoaXMucGF0aCk7XG4gICAgdmFsaWRhdGVDb29raWVQcm9wZXJ0eShcImRvbWFpblwiLCB0aGlzLmRvbWFpbik7XG4gICAgaWYgKFxuICAgICAgdGhpcy5zYW1lU2l0ZSAmJiB0eXBlb2YgdGhpcy5zYW1lU2l0ZSA9PT0gXCJzdHJpbmdcIiAmJlxuICAgICAgIVNBTUVfU0lURV9SRUdFWFAudGVzdCh0aGlzLnNhbWVTaXRlKVxuICAgICkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgYFRoZSBcInNhbWVTaXRlXCIgb2YgdGhlIGNvb2tpZSAoXCIke3RoaXMuc2FtZVNpdGV9XCIpIGlzIGludmFsaWQuYCxcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgdG9IZWFkZXJWYWx1ZSgpOiBzdHJpbmcge1xuICAgIGxldCB2YWx1ZSA9IHRoaXMudG9TdHJpbmcoKTtcbiAgICBpZiAodGhpcy5tYXhBZ2UpIHtcbiAgICAgIHRoaXMuZXhwaXJlcyA9IG5ldyBEYXRlKERhdGUubm93KCkgKyAodGhpcy5tYXhBZ2UgKiAxMDAwKSk7XG4gICAgfVxuICAgIGlmICh0aGlzLnBhdGgpIHtcbiAgICAgIHZhbHVlICs9IGA7IHBhdGg9JHt0aGlzLnBhdGh9YDtcbiAgICB9XG4gICAgaWYgKHRoaXMuZXhwaXJlcykge1xuICAgICAgdmFsdWUgKz0gYDsgZXhwaXJlcz0ke3RoaXMuZXhwaXJlcy50b1VUQ1N0cmluZygpfWA7XG4gICAgfVxuICAgIGlmICh0aGlzLmRvbWFpbikge1xuICAgICAgdmFsdWUgKz0gYDsgZG9tYWluPSR7dGhpcy5kb21haW59YDtcbiAgICB9XG4gICAgaWYgKHRoaXMuc2FtZVNpdGUpIHtcbiAgICAgIHZhbHVlICs9IGA7IHNhbWVzaXRlPSR7XG4gICAgICAgIHRoaXMuc2FtZVNpdGUgPT09IHRydWUgPyBcInN0cmljdFwiIDogdGhpcy5zYW1lU2l0ZS50b0xvd2VyQ2FzZSgpXG4gICAgICB9YDtcbiAgICB9XG4gICAgaWYgKHRoaXMuc2VjdXJlKSB7XG4gICAgICB2YWx1ZSArPSBcIjsgc2VjdXJlXCI7XG4gICAgfVxuICAgIGlmICh0aGlzLmh0dHBPbmx5KSB7XG4gICAgICB2YWx1ZSArPSBcIjsgaHR0cG9ubHlcIjtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG5cbiAgdG9TdHJpbmcoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYCR7dGhpcy5uYW1lfT0ke3RoaXMudmFsdWV9YDtcbiAgfVxufVxuXG4vKiogU3ltYm9sIHdoaWNoIGlzIHVzZWQgaW4ge0BsaW5rIG1lcmdlSGVhZGVyc30gdG8gZXh0cmFjdCBhXG4gKiBgW3N0cmluZyB8IHN0cmluZ11bXWAgZnJvbSBhbiBpbnN0YW5jZSB0byBnZW5lcmF0ZSB0aGUgZmluYWwgc2V0IG9mXG4gKiBoZWFkZXJzLiAqL1xuZXhwb3J0IGNvbnN0IGNvb2tpZU1hcEhlYWRlcnNJbml0U3ltYm9sID0gU3ltYm9sLmZvcihcbiAgXCJEZW5vLnN0ZC5jb29raWVNYXAuaGVhZGVyc0luaXRcIixcbik7XG5cbmZ1bmN0aW9uIGlzTWVyZ2VhYmxlKHZhbHVlOiB1bmtub3duKTogdmFsdWUgaXMgTWVyZ2VhYmxlIHtcbiAgcmV0dXJuIHZhbHVlICE9IG51bGwgJiYgdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmXG4gICAgY29va2llTWFwSGVhZGVyc0luaXRTeW1ib2wgaW4gdmFsdWU7XG59XG5cbi8qKiBBbGxvd3MgbWVyZ2luZyBvZiB2YXJpb3VzIHNvdXJjZXMgb2YgaGVhZGVycyBpbnRvIGEgZmluYWwgc2V0IG9mIGhlYWRlcnNcbiAqIHdoaWNoIGNhbiBiZSB1c2VkIGluIGEge0BsaW5rY29kZSBSZXNwb25zZX0uXG4gKlxuICogTm90ZSwgdGhhdCB1bmxpa2Ugd2hlbiBwYXNzaW5nIGEgYFJlc3BvbnNlYCBvciB7QGxpbmtjb2RlIEhlYWRlcnN9IHVzZWQgaW4gYVxuICogcmVzcG9uc2UgdG8ge0BsaW5rY29kZSBDb29raWVNYXB9IG9yIHtAbGlua2NvZGUgU2VjdXJlQ29va2llTWFwfSwgbWVyZ2luZ1xuICogd2lsbCBub3QgZW5zdXJlIHRoYXQgdGhlcmUgYXJlIG5vIG90aGVyIGBTZXQtQ29va2llYCBoZWFkZXJzIGZyb20gb3RoZXJcbiAqIHNvdXJjZXMsIGl0IHdpbGwgc2ltcGx5IGFwcGVuZCB0aGUgdmFyaW91cyBoZWFkZXJzIHRvZ2V0aGVyLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1lcmdlSGVhZGVycyhcbiAgLi4uc291cmNlczogKEhlYWRlcmVkIHwgSGVhZGVyc0luaXQgfCBNZXJnZWFibGUpW11cbik6IEhlYWRlcnMge1xuICBjb25zdCBoZWFkZXJzID0gbmV3IEhlYWRlcnMoKTtcbiAgZm9yIChjb25zdCBzb3VyY2Ugb2Ygc291cmNlcykge1xuICAgIGxldCBlbnRyaWVzOiBJdGVyYWJsZTxbc3RyaW5nLCBzdHJpbmddPjtcbiAgICBpZiAoc291cmNlIGluc3RhbmNlb2YgSGVhZGVycykge1xuICAgICAgZW50cmllcyA9IHNvdXJjZTtcbiAgICB9IGVsc2UgaWYgKFwiaGVhZGVyc1wiIGluIHNvdXJjZSAmJiBzb3VyY2UuaGVhZGVycyBpbnN0YW5jZW9mIEhlYWRlcnMpIHtcbiAgICAgIGVudHJpZXMgPSBzb3VyY2UuaGVhZGVycztcbiAgICB9IGVsc2UgaWYgKGlzTWVyZ2VhYmxlKHNvdXJjZSkpIHtcbiAgICAgIGVudHJpZXMgPSBzb3VyY2VbY29va2llTWFwSGVhZGVyc0luaXRTeW1ib2xdKCk7XG4gICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHNvdXJjZSkpIHtcbiAgICAgIGVudHJpZXMgPSBzb3VyY2UgYXMgW3N0cmluZywgc3RyaW5nXVtdO1xuICAgIH0gZWxzZSB7XG4gICAgICBlbnRyaWVzID0gT2JqZWN0LmVudHJpZXMoc291cmNlKTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgZW50cmllcykge1xuICAgICAgaGVhZGVycy5hcHBlbmQoa2V5LCB2YWx1ZSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBoZWFkZXJzO1xufVxuXG5jb25zdCBrZXlzID0gU3ltYm9sKFwiI2tleXNcIik7XG5jb25zdCByZXF1ZXN0SGVhZGVycyA9IFN5bWJvbChcIiNyZXF1ZXN0SGVhZGVyc1wiKTtcbmNvbnN0IHJlc3BvbnNlSGVhZGVycyA9IFN5bWJvbChcIiNyZXNwb25zZUhlYWRlcnNcIik7XG5jb25zdCBpc1NlY3VyZSA9IFN5bWJvbChcIiNzZWN1cmVcIik7XG5jb25zdCByZXF1ZXN0S2V5cyA9IFN5bWJvbChcIiNyZXF1ZXN0S2V5c1wiKTtcblxuLyoqIEFuIGludGVybmFsIGFic3RyYWN0IGNsYXNzIHdoaWNoIHByb3ZpZGVzIGNvbW1vbiBmdW5jdGlvbmFsaXR5IGZvclxuICoge0BsaW5rIENvb2tpZU1hcH0gYW5kIHtAbGluayBTZWN1cmVDb29raWVNYXB9LiAqL1xuYWJzdHJhY3QgY2xhc3MgQ29va2llTWFwQmFzZSBpbXBsZW1lbnRzIE1lcmdlYWJsZSB7XG4gIFtrZXlzXT86IHN0cmluZ1tdO1xuICBbcmVxdWVzdEhlYWRlcnNdOiBIZWFkZXJzO1xuICBbcmVzcG9uc2VIZWFkZXJzXTogSGVhZGVycztcbiAgW2lzU2VjdXJlXTogYm9vbGVhbjtcblxuICBbcmVxdWVzdEtleXNdKCk6IHN0cmluZ1tdIHtcbiAgICBpZiAodGhpc1trZXlzXSkge1xuICAgICAgcmV0dXJuIHRoaXNba2V5c107XG4gICAgfVxuICAgIGNvbnN0IHJlc3VsdCA9IHRoaXNba2V5c10gPSBbXSBhcyBzdHJpbmdbXTtcbiAgICBjb25zdCBoZWFkZXIgPSB0aGlzW3JlcXVlc3RIZWFkZXJzXS5nZXQoXCJjb29raWVcIik7XG4gICAgaWYgKCFoZWFkZXIpIHtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICAgIGxldCBtYXRjaGVzOiBSZWdFeHBFeGVjQXJyYXkgfCBudWxsO1xuICAgIHdoaWxlICgobWF0Y2hlcyA9IEtFWV9SRUdFWFAuZXhlYyhoZWFkZXIpKSkge1xuICAgICAgY29uc3QgWywga2V5XSA9IG1hdGNoZXM7XG4gICAgICByZXN1bHQucHVzaChrZXkpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgY29uc3RydWN0b3IocmVxdWVzdDogSGVhZGVycyB8IEhlYWRlcmVkLCBvcHRpb25zOiBDb29raWVNYXBPcHRpb25zKSB7XG4gICAgdGhpc1tyZXF1ZXN0SGVhZGVyc10gPSBcImhlYWRlcnNcIiBpbiByZXF1ZXN0ID8gcmVxdWVzdC5oZWFkZXJzIDogcmVxdWVzdDtcbiAgICBjb25zdCB7IHNlY3VyZSA9IGZhbHNlLCByZXNwb25zZSA9IG5ldyBIZWFkZXJzKCkgfSA9IG9wdGlvbnM7XG4gICAgdGhpc1tyZXNwb25zZUhlYWRlcnNdID0gXCJoZWFkZXJzXCIgaW4gcmVzcG9uc2UgPyByZXNwb25zZS5oZWFkZXJzIDogcmVzcG9uc2U7XG4gICAgdGhpc1tpc1NlY3VyZV0gPSBzZWN1cmU7XG4gIH1cblxuICAvKiogQSBtZXRob2QgdXNlZCBieSB7QGxpbmtjb2RlIG1lcmdlSGVhZGVyc30gdG8gYmUgYWJsZSB0byBtZXJnZVxuICAgKiBoZWFkZXJzIGZyb20gdmFyaW91cyBzb3VyY2VzIHdoZW4gZm9ybWluZyBhIHtAbGlua2NvZGUgUmVzcG9uc2V9LiAqL1xuICBbY29va2llTWFwSGVhZGVyc0luaXRTeW1ib2xdKCk6IFtzdHJpbmcsIHN0cmluZ11bXSB7XG4gICAgY29uc3QgaW5pdDogW3N0cmluZywgc3RyaW5nXVtdID0gW107XG4gICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgdGhpc1tyZXNwb25zZUhlYWRlcnNdKSB7XG4gICAgICBpZiAoa2V5ID09PSBcInNldC1jb29raWVcIikge1xuICAgICAgICBpbml0LnB1c2goW2tleSwgdmFsdWVdKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGluaXQ7XG4gIH1cblxuICBbU3ltYm9sLmZvcihcIkRlbm8uY3VzdG9tSW5zcGVjdFwiKV0oKSB7XG4gICAgcmV0dXJuIGAke3RoaXMuY29uc3RydWN0b3IubmFtZX0gW11gO1xuICB9XG5cbiAgW1N5bWJvbC5mb3IoXCJub2RlanMudXRpbC5pbnNwZWN0LmN1c3RvbVwiKV0oXG4gICAgZGVwdGg6IG51bWJlcixcbiAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAgIG9wdGlvbnM6IGFueSxcbiAgICBpbnNwZWN0OiAodmFsdWU6IHVua25vd24sIG9wdGlvbnM/OiB1bmtub3duKSA9PiBzdHJpbmcsXG4gICkge1xuICAgIGlmIChkZXB0aCA8IDApIHtcbiAgICAgIHJldHVybiBvcHRpb25zLnN0eWxpemUoYFske3RoaXMuY29uc3RydWN0b3IubmFtZX1dYCwgXCJzcGVjaWFsXCIpO1xuICAgIH1cblxuICAgIGNvbnN0IG5ld09wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCBvcHRpb25zLCB7XG4gICAgICBkZXB0aDogb3B0aW9ucy5kZXB0aCA9PT0gbnVsbCA/IG51bGwgOiBvcHRpb25zLmRlcHRoIC0gMSxcbiAgICB9KTtcbiAgICByZXR1cm4gYCR7b3B0aW9ucy5zdHlsaXplKHRoaXMuY29uc3RydWN0b3IubmFtZSwgXCJzcGVjaWFsXCIpfSAke1xuICAgICAgaW5zcGVjdChbXSwgbmV3T3B0aW9ucylcbiAgICB9YDtcbiAgfVxufVxuXG4vKipcbiAqIFByb3ZpZGVzIGEgd2F5IHRvIG1hbmFnZSBjb29raWVzIGluIGEgcmVxdWVzdCBhbmQgcmVzcG9uc2Ugb24gdGhlIHNlcnZlclxuICogYXMgYSBzaW5nbGUgaXRlcmFibGUgY29sbGVjdGlvbi5cbiAqXG4gKiBUaGUgbWV0aG9kcyBhbmQgcHJvcGVydGllcyBhbGlnbiB0byB7QGxpbmtjb2RlIE1hcH0uIFdoZW4gY29uc3RydWN0aW5nIGFcbiAqIHtAbGlua2NvZGUgUmVxdWVzdH0gb3Ige0BsaW5rY29kZSBIZWFkZXJzfSBmcm9tIHRoZSByZXF1ZXN0IG5lZWQgdG8gYmVcbiAqIHByb3ZpZGVkLCBhcyB3ZWxsIGFzIG9wdGlvbmFsbHkgdGhlIHtAbGlua2NvZGUgUmVzcG9uc2V9IG9yIGBIZWFkZXJzYCBmb3IgdGhlXG4gKiByZXNwb25zZSBjYW4gYmUgcHJvdmlkZWQuIEFsdGVybmF0aXZlbHkgdGhlIHtAbGlua2NvZGUgbWVyZ2VIZWFkZXJzfVxuICogZnVuY3Rpb24gY2FuIGJlIHVzZWQgdG8gZ2VuZXJhdGUgYSBmaW5hbCBzZXQgb2YgaGVhZGVycyBmb3Igc2VuZGluZyBpbiB0aGVcbiAqIHJlc3BvbnNlLiAqL1xuZXhwb3J0IGNsYXNzIENvb2tpZU1hcCBleHRlbmRzIENvb2tpZU1hcEJhc2Uge1xuICAvKiogQ29udGFpbnMgdGhlIG51bWJlciBvZiB2YWxpZCBjb29raWVzIGluIHRoZSByZXF1ZXN0IGhlYWRlcnMuICovXG4gIGdldCBzaXplKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIFsuLi50aGlzXS5sZW5ndGg7XG4gIH1cblxuICBjb25zdHJ1Y3RvcihyZXF1ZXN0OiBIZWFkZXJzIHwgSGVhZGVyZWQsIG9wdGlvbnM6IENvb2tpZU1hcE9wdGlvbnMgPSB7fSkge1xuICAgIHN1cGVyKHJlcXVlc3QsIG9wdGlvbnMpO1xuICB9XG5cbiAgLyoqIERlbGV0ZXMgYWxsIHRoZSBjb29raWVzIGZyb20gdGhlIHtAbGlua2NvZGUgUmVxdWVzdH0gaW4gdGhlIHJlc3BvbnNlLiAqL1xuICBjbGVhcihvcHRpb25zOiBDb29raWVNYXBTZXREZWxldGVPcHRpb25zID0ge30pIHtcbiAgICBmb3IgKGNvbnN0IGtleSBvZiB0aGlzLmtleXMoKSkge1xuICAgICAgdGhpcy5zZXQoa2V5LCBudWxsLCBvcHRpb25zKTtcbiAgICB9XG4gIH1cblxuICAvKiogU2V0IGEgY29va2llIHRvIGJlIGRlbGV0ZWQgaW4gdGhlIHJlc3BvbnNlLlxuICAgKlxuICAgKiBUaGlzIGlzIGEgY29udmVuaWVuY2UgZnVuY3Rpb24gZm9yIGBzZXQoa2V5LCBudWxsLCBvcHRpb25zPylgLlxuICAgKi9cbiAgZGVsZXRlKGtleTogc3RyaW5nLCBvcHRpb25zOiBDb29raWVNYXBTZXREZWxldGVPcHRpb25zID0ge30pOiBib29sZWFuIHtcbiAgICB0aGlzLnNldChrZXksIG51bGwsIG9wdGlvbnMpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqIFJldHVybiB0aGUgdmFsdWUgb2YgYSBtYXRjaGluZyBrZXkgcHJlc2VudCBpbiB0aGUge0BsaW5rY29kZSBSZXF1ZXN0fS4gSWZcbiAgICogdGhlIGtleSBpcyBub3QgcHJlc2VudCBgdW5kZWZpbmVkYCBpcyByZXR1cm5lZC4gKi9cbiAgZ2V0KGtleTogc3RyaW5nKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCBoZWFkZXJWYWx1ZSA9IHRoaXNbcmVxdWVzdEhlYWRlcnNdLmdldChcImNvb2tpZVwiKTtcbiAgICBpZiAoIWhlYWRlclZhbHVlKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBjb25zdCBtYXRjaCA9IGhlYWRlclZhbHVlLm1hdGNoKGdldFBhdHRlcm4oa2V5KSk7XG4gICAgaWYgKCFtYXRjaCkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgY29uc3QgWywgdmFsdWVdID0gbWF0Y2g7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG5cbiAgLyoqIFJldHVybnMgYHRydWVgIGlmIHRoZSBtYXRjaGluZyBrZXkgaXMgcHJlc2VudCBpbiB0aGUge0BsaW5rY29kZSBSZXF1ZXN0fSxcbiAgICogb3RoZXJ3aXNlIGBmYWxzZWAuICovXG4gIGhhcyhrZXk6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGhlYWRlclZhbHVlID0gdGhpc1tyZXF1ZXN0SGVhZGVyc10uZ2V0KFwiY29va2llXCIpO1xuICAgIGlmICghaGVhZGVyVmFsdWUpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIGdldFBhdHRlcm4oa2V5KS50ZXN0KGhlYWRlclZhbHVlKTtcbiAgfVxuXG4gIC8qKiBTZXQgYSBuYW1lZCBjb29raWUgaW4gdGhlIHJlc3BvbnNlLiBUaGUgb3B0aW9uYWxcbiAgICoge0BsaW5rY29kZSBDb29raWVNYXBTZXREZWxldGVPcHRpb25zfSBhcmUgYXBwbGllZCB0byB0aGUgY29va2llIGJlaW5nIHNldC5cbiAgICovXG4gIHNldChcbiAgICBrZXk6IHN0cmluZyxcbiAgICB2YWx1ZTogc3RyaW5nIHwgbnVsbCxcbiAgICBvcHRpb25zOiBDb29raWVNYXBTZXREZWxldGVPcHRpb25zID0ge30sXG4gICk6IHRoaXMge1xuICAgIGNvbnN0IHJlc0hlYWRlcnMgPSB0aGlzW3Jlc3BvbnNlSGVhZGVyc107XG4gICAgY29uc3QgdmFsdWVzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIHJlc0hlYWRlcnMpIHtcbiAgICAgIGlmIChrZXkgPT09IFwic2V0LWNvb2tpZVwiKSB7XG4gICAgICAgIHZhbHVlcy5wdXNoKHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3Qgc2VjdXJlID0gdGhpc1tpc1NlY3VyZV07XG5cbiAgICBpZiAoIXNlY3VyZSAmJiBvcHRpb25zLnNlY3VyZSAmJiAhb3B0aW9ucy5pZ25vcmVJbnNlY3VyZSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgXCJDYW5ub3Qgc2VuZCBzZWN1cmUgY29va2llIG92ZXIgdW5lbmNyeXB0ZWQgY29ubmVjdGlvbi5cIixcbiAgICAgICk7XG4gICAgfVxuXG4gICAgY29uc3QgY29va2llID0gbmV3IENvb2tpZShrZXksIHZhbHVlLCBvcHRpb25zKTtcbiAgICBjb29raWUuc2VjdXJlID0gb3B0aW9ucy5zZWN1cmUgPz8gc2VjdXJlO1xuICAgIHB1c2hDb29raWUodmFsdWVzLCBjb29raWUpO1xuXG4gICAgcmVzSGVhZGVycy5kZWxldGUoXCJzZXQtY29va2llXCIpO1xuICAgIGZvciAoY29uc3QgdmFsdWUgb2YgdmFsdWVzKSB7XG4gICAgICByZXNIZWFkZXJzLmFwcGVuZChcInNldC1jb29raWVcIiwgdmFsdWUpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKiBJdGVyYXRlIG92ZXIgdGhlIGNvb2tpZSBrZXlzIGFuZCB2YWx1ZXMgdGhhdCBhcmUgcHJlc2VudCBpbiB0aGVcbiAgICoge0BsaW5rY29kZSBSZXF1ZXN0fS4gVGhpcyBpcyBhbiBhbGlhcyBvZiB0aGUgYFtTeW1ib2wuaXRlcmF0b3JdYCBtZXRob2RcbiAgICogcHJlc2VudCBvbiB0aGUgY2xhc3MuICovXG4gIGVudHJpZXMoKTogSXRlcmFibGVJdGVyYXRvcjxbc3RyaW5nLCBzdHJpbmddPiB7XG4gICAgcmV0dXJuIHRoaXNbU3ltYm9sLml0ZXJhdG9yXSgpO1xuICB9XG5cbiAgLyoqIEl0ZXJhdGUgb3ZlciB0aGUgY29va2llIGtleXMgdGhhdCBhcmUgcHJlc2VudCBpbiB0aGVcbiAgICoge0BsaW5rY29kZSBSZXF1ZXN0fS4gKi9cbiAgKmtleXMoKTogSXRlcmFibGVJdGVyYXRvcjxzdHJpbmc+IHtcbiAgICBmb3IgKGNvbnN0IFtrZXldIG9mIHRoaXMpIHtcbiAgICAgIHlpZWxkIGtleTtcbiAgICB9XG4gIH1cblxuICAvKiogSXRlcmF0ZSBvdmVyIHRoZSBjb29raWUgdmFsdWVzIHRoYXQgYXJlIHByZXNlbnQgaW4gdGhlXG4gICAqIHtAbGlua2NvZGUgUmVxdWVzdH0uICovXG4gICp2YWx1ZXMoKTogSXRlcmFibGVJdGVyYXRvcjxzdHJpbmc+IHtcbiAgICBmb3IgKGNvbnN0IFssIHZhbHVlXSBvZiB0aGlzKSB7XG4gICAgICB5aWVsZCB2YWx1ZTtcbiAgICB9XG4gIH1cblxuICAvKiogSXRlcmF0ZSBvdmVyIHRoZSBjb29raWUga2V5cyBhbmQgdmFsdWVzIHRoYXQgYXJlIHByZXNlbnQgaW4gdGhlXG4gICAqIHtAbGlua2NvZGUgUmVxdWVzdH0uICovXG4gICpbU3ltYm9sLml0ZXJhdG9yXSgpOiBJdGVyYWJsZUl0ZXJhdG9yPFtzdHJpbmcsIHN0cmluZ10+IHtcbiAgICBjb25zdCBrZXlzID0gdGhpc1tyZXF1ZXN0S2V5c10oKTtcbiAgICBmb3IgKGNvbnN0IGtleSBvZiBrZXlzKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IHRoaXMuZ2V0KGtleSk7XG4gICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgeWllbGQgW2tleSwgdmFsdWVdO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKiogVHlwZXMgb2YgZGF0YSB0aGF0IGNhbiBiZSBzaWduZWQgY3J5cHRvZ3JhcGhpY2FsbHkuICovXG5leHBvcnQgdHlwZSBEYXRhID0gc3RyaW5nIHwgbnVtYmVyW10gfCBBcnJheUJ1ZmZlciB8IFVpbnQ4QXJyYXk7XG5cbi8qKiBBbiBpbnRlcmZhY2Ugd2hpY2ggZGVzY3JpYmVzIHRoZSBtZXRob2RzIHRoYXQge0BsaW5rY29kZSBTZWN1cmVDb29raWVNYXB9XG4gKiB1c2VzIHRvIHNpZ24gYW5kIHZlcmlmeSBjb29raWVzLiAqL1xuZXhwb3J0IGludGVyZmFjZSBLZXlSaW5nIHtcbiAgLyoqIEdpdmVuIGEgc2V0IG9mIGRhdGEgYW5kIGEgZGlnZXN0LCByZXR1cm4gdGhlIGtleSBpbmRleCBvZiB0aGUga2V5IHVzZWRcbiAgICogdG8gc2lnbiB0aGUgZGF0YS4gVGhlIGluZGV4IGlzIDAgYmFzZWQuIEEgbm9uLW5lZ2F0aXZlIG51bWJlciBpbmRpY2VzIHRoZVxuICAgKiBkaWdlc3QgaXMgdmFsaWQgYW5kIGEga2V5IHdhcyBmb3VuZC4gKi9cbiAgaW5kZXhPZihkYXRhOiBEYXRhLCBkaWdlc3Q6IHN0cmluZyk6IFByb21pc2U8bnVtYmVyPiB8IG51bWJlcjtcbiAgLyoqIFNpZ24gdGhlIGRhdGEsIHJldHVybmluZyBhIHN0cmluZyBiYXNlZCBkaWdlc3Qgb2YgdGhlIGRhdGEuICovXG4gIHNpZ24oZGF0YTogRGF0YSk6IFByb21pc2U8c3RyaW5nPiB8IHN0cmluZztcbiAgLyoqIFZlcmlmaWVzIHRoZSBkaWdlc3QgbWF0Y2hlcyB0aGUgcHJvdmlkZWQgZGF0YSwgaW5kaWNhdGluZyB0aGUgZGF0YSB3YXNcbiAgICogc2lnbmVkIGJ5IHRoZSBrZXlyaW5nIGFuZCBoYXMgbm90IGJlZW4gdGFtcGVyZWQgd2l0aC4gKi9cbiAgdmVyaWZ5KGRhdGE6IERhdGEsIGRpZ2VzdDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB8IGJvb2xlYW47XG59XG5cbi8qKiBQcm92aWRlcyBhbiB3YXkgdG8gbWFuYWdlIGNvb2tpZXMgaW4gYSByZXF1ZXN0IGFuZCByZXNwb25zZSBvbiB0aGUgc2VydmVyXG4gKiBhcyBhIHNpbmdsZSBpdGVyYWJsZSBjb2xsZWN0aW9uLCBhcyB3ZWxsIGFzIHRoZSBhYmlsaXR5IHRvIHNpZ24gYW5kIHZlcmlmeVxuICogY29va2llcyB0byBwcmV2ZW50IHRhbXBlcmluZy5cbiAqXG4gKiBUaGUgbWV0aG9kcyBhbmQgcHJvcGVydGllcyBhbGlnbiB0byB7QGxpbmtjb2RlIE1hcH0sIGJ1dCBkdWUgdG8gdGhlIG5lZWQgdG9cbiAqIHN1cHBvcnQgYXN5bmNocm9ub3VzIGNyeXB0b2dyYXBoaWMga2V5cywgYWxsIHRoZSBBUElzIG9wZXJhdGUgYXN5bmMuIFdoZW5cbiAqIGNvbnN0cnVjdGluZyBhIHtAbGlua2NvZGUgUmVxdWVzdH0gb3Ige0BsaW5rY29kZSBIZWFkZXJzfSBmcm9tIHRoZSByZXF1ZXN0XG4gKiBuZWVkIHRvIGJlIHByb3ZpZGVkLCBhcyB3ZWxsIGFzIG9wdGlvbmFsbHkgdGhlIHtAbGlua2NvZGUgUmVzcG9uc2V9IG9yXG4gKiBgSGVhZGVyc2AgZm9yIHRoZSByZXNwb25zZSBjYW4gYmUgcHJvdmlkZWQuIEFsdGVybmF0aXZlbHkgdGhlXG4gKiB7QGxpbmtjb2RlIG1lcmdlSGVhZGVyc30gZnVuY3Rpb24gY2FuIGJlIHVzZWQgdG8gZ2VuZXJhdGUgYSBmaW5hbCBzZXRcbiAqIG9mIGhlYWRlcnMgZm9yIHNlbmRpbmcgaW4gdGhlIHJlc3BvbnNlLlxuICpcbiAqIE9uIGNvbnN0cnVjdGlvbiwgdGhlIG9wdGlvbmFsIHNldCBvZiBrZXlzIGltcGxlbWVudGluZyB0aGVcbiAqIHtAbGlua2NvZGUgS2V5UmluZ30gaW50ZXJmYWNlLiBXaGlsZSBpdCBpcyBvcHRpb25hbCwgaWYgeW91IGRvbid0IHBsYW4gdG8gdXNlXG4gKiBrZXlzLCB5b3UgbWlnaHQgd2FudCB0byBjb25zaWRlciB1c2luZyBqdXN0IHRoZSB7QGxpbmtjb2RlIENvb2tpZU1hcH0uXG4gKlxuICogQGV4YW1wbGVcbiAqL1xuZXhwb3J0IGNsYXNzIFNlY3VyZUNvb2tpZU1hcCBleHRlbmRzIENvb2tpZU1hcEJhc2Uge1xuICAja2V5UmluZz86IEtleVJpbmc7XG5cbiAgLyoqIElzIHNldCB0byBhIHByb21pc2Ugd2hpY2ggcmVzb2x2ZXMgd2l0aCB0aGUgbnVtYmVyIG9mIGNvb2tpZXMgaW4gdGhlXG4gICAqIHtAbGlua2NvZGUgUmVxdWVzdH0uICovXG4gIGdldCBzaXplKCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgcmV0dXJuIChhc3luYyAoKSA9PiB7XG4gICAgICBsZXQgc2l6ZSA9IDA7XG4gICAgICBmb3IgYXdhaXQgKGNvbnN0IF8gb2YgdGhpcykge1xuICAgICAgICBzaXplKys7XG4gICAgICB9XG4gICAgICByZXR1cm4gc2l6ZTtcbiAgICB9KSgpO1xuICB9XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcmVxdWVzdDogSGVhZGVycyB8IEhlYWRlcmVkLFxuICAgIG9wdGlvbnM6IFNlY3VyZUNvb2tpZU1hcE9wdGlvbnMgPSB7fSxcbiAgKSB7XG4gICAgc3VwZXIocmVxdWVzdCwgb3B0aW9ucyk7XG4gICAgY29uc3QgeyBrZXlzIH0gPSBvcHRpb25zO1xuICAgIHRoaXMuI2tleVJpbmcgPSBrZXlzO1xuICB9XG5cbiAgLyoqIFNldHMgYWxsIGNvb2tpZXMgaW4gdGhlIHtAbGlua2NvZGUgUmVxdWVzdH0gdG8gYmUgZGVsZXRlZCBpbiB0aGVcbiAgICogcmVzcG9uc2UuICovXG4gIGFzeW5jIGNsZWFyKG9wdGlvbnM6IFNlY3VyZUNvb2tpZU1hcFNldERlbGV0ZU9wdGlvbnMpIHtcbiAgICBmb3IgYXdhaXQgKGNvbnN0IGtleSBvZiB0aGlzLmtleXMoKSkge1xuICAgICAgYXdhaXQgdGhpcy5zZXQoa2V5LCBudWxsLCBvcHRpb25zKTtcbiAgICB9XG4gIH1cblxuICAvKiogU2V0IGEgY29va2llIHRvIGJlIGRlbGV0ZWQgaW4gdGhlIHJlc3BvbnNlLlxuICAgKlxuICAgKiBUaGlzIGlzIGEgY29udmVuaWVuY2UgZnVuY3Rpb24gZm9yIGBzZXQoa2V5LCBudWxsLCBvcHRpb25zPylgLiAqL1xuICBhc3luYyBkZWxldGUoXG4gICAga2V5OiBzdHJpbmcsXG4gICAgb3B0aW9uczogU2VjdXJlQ29va2llTWFwU2V0RGVsZXRlT3B0aW9ucyA9IHt9LFxuICApOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBhd2FpdCB0aGlzLnNldChrZXksIG51bGwsIG9wdGlvbnMpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqIEdldCB0aGUgdmFsdWUgb2YgYSBjb29raWUgZnJvbSB0aGUge0BsaW5rY29kZSBSZXF1ZXN0fS5cbiAgICpcbiAgICogSWYgdGhlIGNvb2tpZSBpcyBzaWduZWQsIGFuZCB0aGUgc2lnbmF0dXJlIGlzIGludmFsaWQsIGB1bmRlZmluZWRgIHdpbGwgYmVcbiAgICogcmV0dXJuZWQgYW5kIHRoZSBjb29raWUgd2lsbCBiZSBzZXQgdG8gYmUgZGVsZXRlZCBpbiB0aGUgcmVzcG9uc2UuIElmIHRoZVxuICAgKiBjb29raWUgaXMgdXNpbmcgYW4gXCJvbGRcIiBrZXkgZnJvbSB0aGUga2V5cmluZywgdGhlIGNvb2tpZSB3aWxsIGJlIHJlLXNpZ25lZFxuICAgKiB3aXRoIHRoZSBjdXJyZW50IGtleSBhbmQgYmUgYWRkZWQgdG8gdGhlIHJlc3BvbnNlIHRvIGJlIHVwZGF0ZWQuICovXG4gIGFzeW5jIGdldChcbiAgICBrZXk6IHN0cmluZyxcbiAgICBvcHRpb25zOiBTZWN1cmVDb29raWVNYXBHZXRPcHRpb25zID0ge30sXG4gICk6IFByb21pc2U8c3RyaW5nIHwgdW5kZWZpbmVkPiB7XG4gICAgY29uc3Qgc2lnbmVkID0gb3B0aW9ucy5zaWduZWQgPz8gISF0aGlzLiNrZXlSaW5nO1xuICAgIGNvbnN0IG5hbWVTaWcgPSBgJHtrZXl9LnNpZ2A7XG5cbiAgICBjb25zdCBoZWFkZXIgPSB0aGlzW3JlcXVlc3RIZWFkZXJzXS5nZXQoXCJjb29raWVcIik7XG4gICAgaWYgKCFoZWFkZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgbWF0Y2ggPSBoZWFkZXIubWF0Y2goZ2V0UGF0dGVybihrZXkpKTtcbiAgICBpZiAoIW1hdGNoKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IFssIHZhbHVlXSA9IG1hdGNoO1xuICAgIGlmICghc2lnbmVkKSB7XG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuICAgIGNvbnN0IGRpZ2VzdCA9IGF3YWl0IHRoaXMuZ2V0KG5hbWVTaWcsIHsgc2lnbmVkOiBmYWxzZSB9KTtcbiAgICBpZiAoIWRpZ2VzdCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBkYXRhID0gYCR7a2V5fT0ke3ZhbHVlfWA7XG4gICAgaWYgKCF0aGlzLiNrZXlSaW5nKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwia2V5IHJpbmcgcmVxdWlyZWQgZm9yIHNpZ25lZCBjb29raWVzXCIpO1xuICAgIH1cbiAgICBjb25zdCBpbmRleCA9IGF3YWl0IHRoaXMuI2tleVJpbmcuaW5kZXhPZihkYXRhLCBkaWdlc3QpO1xuXG4gICAgaWYgKGluZGV4IDwgMCkge1xuICAgICAgYXdhaXQgdGhpcy5kZWxldGUobmFtZVNpZywgeyBwYXRoOiBcIi9cIiwgc2lnbmVkOiBmYWxzZSB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGluZGV4KSB7XG4gICAgICAgIGF3YWl0IHRoaXMuc2V0KG5hbWVTaWcsIGF3YWl0IHRoaXMuI2tleVJpbmcuc2lnbihkYXRhKSwge1xuICAgICAgICAgIHNpZ25lZDogZmFsc2UsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBSZXR1cm5zIGB0cnVlYCBpZiB0aGUga2V5IGlzIGluIHRoZSB7QGxpbmtjb2RlIFJlcXVlc3R9LlxuICAgKlxuICAgKiBJZiB0aGUgY29va2llIGlzIHNpZ25lZCwgYW5kIHRoZSBzaWduYXR1cmUgaXMgaW52YWxpZCwgYGZhbHNlYCB3aWxsIGJlXG4gICAqIHJldHVybmVkIGFuZCB0aGUgY29va2llIHdpbGwgYmUgc2V0IHRvIGJlIGRlbGV0ZWQgaW4gdGhlIHJlc3BvbnNlLiBJZiB0aGVcbiAgICogY29va2llIGlzIHVzaW5nIGFuIFwib2xkXCIga2V5IGZyb20gdGhlIGtleXJpbmcsIHRoZSBjb29raWUgd2lsbCBiZSByZS1zaWduZWRcbiAgICogd2l0aCB0aGUgY3VycmVudCBrZXkgYW5kIGJlIGFkZGVkIHRvIHRoZSByZXNwb25zZSB0byBiZSB1cGRhdGVkLiAqL1xuICBhc3luYyBoYXMoXG4gICAga2V5OiBzdHJpbmcsXG4gICAgb3B0aW9uczogU2VjdXJlQ29va2llTWFwR2V0T3B0aW9ucyA9IHt9LFxuICApOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBjb25zdCBzaWduZWQgPSBvcHRpb25zLnNpZ25lZCA/PyAhIXRoaXMuI2tleVJpbmc7XG4gICAgY29uc3QgbmFtZVNpZyA9IGAke2tleX0uc2lnYDtcblxuICAgIGNvbnN0IGhlYWRlciA9IHRoaXNbcmVxdWVzdEhlYWRlcnNdLmdldChcImNvb2tpZVwiKTtcbiAgICBpZiAoIWhlYWRlcikge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBjb25zdCBtYXRjaCA9IGhlYWRlci5tYXRjaChnZXRQYXR0ZXJuKGtleSkpO1xuICAgIGlmICghbWF0Y2gpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKCFzaWduZWQpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBjb25zdCBkaWdlc3QgPSBhd2FpdCB0aGlzLmdldChuYW1lU2lnLCB7IHNpZ25lZDogZmFsc2UgfSk7XG4gICAgaWYgKCFkaWdlc3QpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgY29uc3QgWywgdmFsdWVdID0gbWF0Y2g7XG4gICAgY29uc3QgZGF0YSA9IGAke2tleX09JHt2YWx1ZX1gO1xuICAgIGlmICghdGhpcy4ja2V5UmluZykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImtleSByaW5nIHJlcXVpcmVkIGZvciBzaWduZWQgY29va2llc1wiKTtcbiAgICB9XG4gICAgY29uc3QgaW5kZXggPSBhd2FpdCB0aGlzLiNrZXlSaW5nLmluZGV4T2YoZGF0YSwgZGlnZXN0KTtcblxuICAgIGlmIChpbmRleCA8IDApIHtcbiAgICAgIGF3YWl0IHRoaXMuZGVsZXRlKG5hbWVTaWcsIHsgcGF0aDogXCIvXCIsIHNpZ25lZDogZmFsc2UgfSk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChpbmRleCkge1xuICAgICAgICBhd2FpdCB0aGlzLnNldChuYW1lU2lnLCBhd2FpdCB0aGlzLiNrZXlSaW5nLnNpZ24oZGF0YSksIHtcbiAgICAgICAgICBzaWduZWQ6IGZhbHNlLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBTZXQgYSBjb29raWUgaW4gdGhlIHJlc3BvbnNlIGhlYWRlcnMuXG4gICAqXG4gICAqIElmIHRoZXJlIHdhcyBhIGtleXJpbmcgc2V0LCBjb29raWVzIHdpbGwgYmUgYXV0b21hdGljYWxseSBzaWduZWQsIHVubGVzc1xuICAgKiBvdmVycmlkZGVuIGJ5IHRoZSBwYXNzZWQgb3B0aW9ucy4gQ29va2llcyBjYW4gYmUgZGVsZXRlZCBieSBzZXR0aW5nIHRoZVxuICAgKiB2YWx1ZSB0byBgbnVsbGAuICovXG4gIGFzeW5jIHNldChcbiAgICBrZXk6IHN0cmluZyxcbiAgICB2YWx1ZTogc3RyaW5nIHwgbnVsbCxcbiAgICBvcHRpb25zOiBTZWN1cmVDb29raWVNYXBTZXREZWxldGVPcHRpb25zID0ge30sXG4gICk6IFByb21pc2U8dGhpcz4ge1xuICAgIGNvbnN0IHJlc0hlYWRlcnMgPSB0aGlzW3Jlc3BvbnNlSGVhZGVyc107XG4gICAgY29uc3QgaGVhZGVyczogc3RyaW5nW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiByZXNIZWFkZXJzLmVudHJpZXMoKSkge1xuICAgICAgaWYgKGtleSA9PT0gXCJzZXQtY29va2llXCIpIHtcbiAgICAgICAgaGVhZGVycy5wdXNoKHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3Qgc2VjdXJlID0gdGhpc1tpc1NlY3VyZV07XG4gICAgY29uc3Qgc2lnbmVkID0gb3B0aW9ucy5zaWduZWQgPz8gISF0aGlzLiNrZXlSaW5nO1xuXG4gICAgaWYgKCFzZWN1cmUgJiYgb3B0aW9ucy5zZWN1cmUgJiYgIW9wdGlvbnMuaWdub3JlSW5zZWN1cmUpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgIFwiQ2Fubm90IHNlbmQgc2VjdXJlIGNvb2tpZSBvdmVyIHVuZW5jcnlwdGVkIGNvbm5lY3Rpb24uXCIsXG4gICAgICApO1xuICAgIH1cblxuICAgIGNvbnN0IGNvb2tpZSA9IG5ldyBDb29raWUoa2V5LCB2YWx1ZSwgb3B0aW9ucyk7XG4gICAgY29va2llLnNlY3VyZSA9IG9wdGlvbnMuc2VjdXJlID8/IHNlY3VyZTtcbiAgICBwdXNoQ29va2llKGhlYWRlcnMsIGNvb2tpZSk7XG5cbiAgICBpZiAoc2lnbmVkKSB7XG4gICAgICBpZiAoIXRoaXMuI2tleVJpbmcpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImtleXMgcmVxdWlyZWQgZm9yIHNpZ25lZCBjb29raWVzLlwiKTtcbiAgICAgIH1cbiAgICAgIGNvb2tpZS52YWx1ZSA9IGF3YWl0IHRoaXMuI2tleVJpbmcuc2lnbihjb29raWUudG9TdHJpbmcoKSk7XG4gICAgICBjb29raWUubmFtZSArPSBcIi5zaWdcIjtcbiAgICAgIHB1c2hDb29raWUoaGVhZGVycywgY29va2llKTtcbiAgICB9XG5cbiAgICByZXNIZWFkZXJzLmRlbGV0ZShcInNldC1jb29raWVcIik7XG4gICAgZm9yIChjb25zdCBoZWFkZXIgb2YgaGVhZGVycykge1xuICAgICAgcmVzSGVhZGVycy5hcHBlbmQoXCJzZXQtY29va2llXCIsIGhlYWRlcik7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqIEl0ZXJhdGUgb3ZlciB0aGUge0BsaW5rY29kZSBSZXF1ZXN0fSBjb29raWVzLCB5aWVsZGluZyB1cCBhIHR1cGxlXG4gICAqIGNvbnRhaW5pbmcgdGhlIGtleSBhbmQgdmFsdWUgb2YgZWFjaCBjb29raWUuXG4gICAqXG4gICAqIElmIGEga2V5IHJpbmcgd2FzIHByb3ZpZGVkLCBvbmx5IHByb3Blcmx5IHNpZ25lZCBjb29raWUga2V5cyBhbmQgdmFsdWVzIGFyZVxuICAgKiByZXR1cm5lZC4gKi9cbiAgZW50cmllcygpOiBBc3luY0l0ZXJhYmxlSXRlcmF0b3I8W3N0cmluZywgc3RyaW5nXT4ge1xuICAgIHJldHVybiB0aGlzW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSgpO1xuICB9XG5cbiAgLyoqIEl0ZXJhdGUgb3ZlciB0aGUgcmVxdWVzdCdzIGNvb2tpZXMsIHlpZWxkaW5nIHVwIHRoZSBrZXkgb2YgZWFjaCBjb29raWUuXG4gICAqXG4gICAqIElmIGEga2V5cmluZyB3YXMgcHJvdmlkZWQsIG9ubHkgcHJvcGVybHkgc2lnbmVkIGNvb2tpZSBrZXlzIGFyZVxuICAgKiByZXR1cm5lZC4gKi9cbiAgYXN5bmMgKmtleXMoKTogQXN5bmNJdGVyYWJsZUl0ZXJhdG9yPHN0cmluZz4ge1xuICAgIGZvciBhd2FpdCAoY29uc3QgW2tleV0gb2YgdGhpcykge1xuICAgICAgeWllbGQga2V5O1xuICAgIH1cbiAgfVxuXG4gIC8qKiBJdGVyYXRlIG92ZXIgdGhlIHJlcXVlc3QncyBjb29raWVzLCB5aWVsZGluZyB1cCB0aGUgdmFsdWUgb2YgZWFjaCBjb29raWUuXG4gICAqXG4gICAqIElmIGEga2V5cmluZyB3YXMgcHJvdmlkZWQsIG9ubHkgcHJvcGVybHkgc2lnbmVkIGNvb2tpZSB2YWx1ZXMgYXJlXG4gICAqIHJldHVybmVkLiAqL1xuICBhc3luYyAqdmFsdWVzKCk6IEFzeW5jSXRlcmFibGVJdGVyYXRvcjxzdHJpbmc+IHtcbiAgICBmb3IgYXdhaXQgKGNvbnN0IFssIHZhbHVlXSBvZiB0aGlzKSB7XG4gICAgICB5aWVsZCB2YWx1ZTtcbiAgICB9XG4gIH1cblxuICAvKiogSXRlcmF0ZSBvdmVyIHRoZSB7QGxpbmtjb2RlIFJlcXVlc3R9IGNvb2tpZXMsIHlpZWxkaW5nIHVwIGEgdHVwbGVcbiAgICogY29udGFpbmluZyB0aGUga2V5IGFuZCB2YWx1ZSBvZiBlYWNoIGNvb2tpZS5cbiAgICpcbiAgICogSWYgYSBrZXkgcmluZyB3YXMgcHJvdmlkZWQsIG9ubHkgcHJvcGVybHkgc2lnbmVkIGNvb2tpZSBrZXlzIGFuZCB2YWx1ZXMgYXJlXG4gICAqIHJldHVybmVkLiAqL1xuICBhc3luYyAqW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSgpOiBBc3luY0l0ZXJhYmxlSXRlcmF0b3I8W3N0cmluZywgc3RyaW5nXT4ge1xuICAgIGNvbnN0IGtleXMgPSB0aGlzW3JlcXVlc3RLZXlzXSgpO1xuICAgIGZvciAoY29uc3Qga2V5IG9mIGtleXMpIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gYXdhaXQgdGhpcy5nZXQoa2V5KTtcbiAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICB5aWVsZCBba2V5LCB2YWx1ZV07XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUVyQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FnRkMsR0F1R0Qsb0NBQW9DO0FBQ3BDLE1BQU0sdUJBQXVCO0FBQzdCLE1BQU0sYUFBYTtBQUNuQixNQUFNLG1CQUFtQjtBQUV6QixNQUFNLGFBQXFDLENBQUM7QUFDNUMsU0FBUyxXQUFXLElBQVk7SUFDOUIsSUFBSSxRQUFRLFlBQVk7UUFDdEIsT0FBTyxVQUFVLENBQUMsS0FBSztJQUN6QjtJQUVBLE9BQU8sVUFBVSxDQUFDLEtBQUssR0FBRyxJQUFJLE9BQzVCLENBQUMsU0FBUyxFQUFFLEtBQUssUUFBUSw0QkFBNEIsUUFBUSxRQUFRLENBQUM7QUFFMUU7QUFFQSxTQUFTLFdBQVcsTUFBZ0IsRUFBRSxNQUFjO0lBQ2xELElBQUksT0FBTyxXQUFXO1FBQ3BCLElBQUssSUFBSSxJQUFJLE9BQU8sU0FBUyxHQUFHLEtBQUssR0FBRyxJQUFLO1lBQzNDLElBQUksTUFBTSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBRSxPQUFPLEtBQUssQ0FBQyxDQUFDLE1BQU0sR0FBRztnQkFDOUMsT0FBTyxPQUFPLEdBQUc7WUFDbkI7UUFDRjtJQUNGO0lBQ0EsT0FBTyxLQUFLLE9BQU87QUFDckI7QUFFQSxTQUFTLHVCQUNQLEdBQVcsRUFDWCxLQUFnQztJQUVoQyxJQUFJLFNBQVMsQ0FBQyxxQkFBcUIsS0FBSyxRQUFRO1FBQzlDLE1BQU0sSUFBSSxVQUFVLENBQUMsS0FBSyxFQUFFLElBQUksaUJBQWlCLEVBQUUsTUFBTSxhQUFhLENBQUM7SUFDekU7QUFDRjtBQUVBLCtDQUErQyxHQUMvQyxNQUFNO0lBQ0osT0FBZ0I7SUFDaEIsUUFBZTtJQUNmLFdBQVcsS0FBSztJQUNoQixPQUFnQjtJQUNoQixLQUFhO0lBQ2IsWUFBWSxNQUFNO0lBQ2xCLE9BQU8sSUFBSTtJQUNYLFdBQWdELE1BQU07SUFDdEQsU0FBUyxNQUFNO0lBQ2YsT0FBaUI7SUFDakIsTUFBYztJQUVkLFlBQ0UsSUFBWSxFQUNaLEtBQW9CLEVBQ3BCLFVBQTRCLENBQzVCO1FBQ0EsdUJBQXVCLFFBQVE7UUFDL0IsSUFBSSxDQUFDLE9BQU87UUFDWix1QkFBdUIsU0FBUztRQUNoQyxJQUFJLENBQUMsUUFBUSxTQUFTO1FBQ3RCLE9BQU8sT0FBTyxJQUFJLEVBQUU7UUFDcEIsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPO1lBQ2YsSUFBSSxDQUFDLFVBQVUsSUFBSSxLQUFLO1lBQ3hCLElBQUksQ0FBQyxTQUFTO1FBQ2hCO1FBRUEsdUJBQXVCLFFBQVEsSUFBSSxDQUFDO1FBQ3BDLHVCQUF1QixVQUFVLElBQUksQ0FBQztRQUN0QyxJQUNFLElBQUksQ0FBQyxZQUFZLE9BQU8sSUFBSSxDQUFDLGFBQWEsWUFDMUMsQ0FBQyxpQkFBaUIsS0FBSyxJQUFJLENBQUMsV0FDNUI7WUFDQSxNQUFNLElBQUksVUFDUixDQUFDLCtCQUErQixFQUFFLElBQUksQ0FBQyxTQUFTLGNBQWMsQ0FBQztRQUVuRTtJQUNGO0lBRUEsZ0JBQXdCO1FBQ3RCLElBQUksUUFBUSxJQUFJLENBQUM7UUFDakIsSUFBSSxJQUFJLENBQUMsUUFBUTtZQUNmLElBQUksQ0FBQyxVQUFVLElBQUksS0FBSyxLQUFLLFFBQVMsSUFBSSxDQUFDLFNBQVM7UUFDdEQ7UUFDQSxJQUFJLElBQUksQ0FBQyxNQUFNO1lBQ2IsU0FBUyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQ2hDO1FBQ0EsSUFBSSxJQUFJLENBQUMsU0FBUztZQUNoQixTQUFTLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxRQUFRLGNBQWMsQ0FBQztRQUNwRDtRQUNBLElBQUksSUFBSSxDQUFDLFFBQVE7WUFDZixTQUFTLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUM7UUFDcEM7UUFDQSxJQUFJLElBQUksQ0FBQyxVQUFVO1lBQ2pCLFNBQVMsQ0FBQyxXQUFXLEVBQ25CLElBQUksQ0FBQyxhQUFhLE9BQU8sV0FBVyxJQUFJLENBQUMsU0FBUyxjQUNuRCxDQUFDO1FBQ0o7UUFDQSxJQUFJLElBQUksQ0FBQyxRQUFRO1lBQ2YsU0FBUztRQUNYO1FBQ0EsSUFBSSxJQUFJLENBQUMsVUFBVTtZQUNqQixTQUFTO1FBQ1g7UUFDQSxPQUFPO0lBQ1Q7SUFFQSxXQUFtQjtRQUNqQixPQUFPLENBQUMsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQztJQUNyQztBQUNGO0FBRUE7O1lBRVksR0FDWixPQUFPLE1BQU0sNkJBQTZCLE9BQU8sSUFDL0Msa0NBQ0E7QUFFRixTQUFTLFlBQVksS0FBYztJQUNqQyxPQUFPLFNBQVMsUUFBUSxPQUFPLFVBQVUsWUFDdkMsOEJBQThCO0FBQ2xDO0FBRUE7Ozs7OztnRUFNZ0UsR0FDaEUsT0FBTyxTQUFTLGFBQ2QsR0FBRyxPQUErQztJQUVsRCxNQUFNLFVBQVUsSUFBSTtJQUNwQixLQUFLLE1BQU0sVUFBVSxRQUFTO1FBQzVCLElBQUk7UUFDSixJQUFJLGtCQUFrQixTQUFTO1lBQzdCLFVBQVU7UUFDWixPQUFPLElBQUksYUFBYSxVQUFVLE9BQU8sbUJBQW1CLFNBQVM7WUFDbkUsVUFBVSxPQUFPO1FBQ25CLE9BQU8sSUFBSSxZQUFZLFNBQVM7WUFDOUIsVUFBVSxNQUFNLENBQUMsMkJBQTJCO1FBQzlDLE9BQU8sSUFBSSxNQUFNLFFBQVEsU0FBUztZQUNoQyxVQUFVO1FBQ1osT0FBTztZQUNMLFVBQVUsT0FBTyxRQUFRO1FBQzNCO1FBQ0EsS0FBSyxNQUFNLENBQUMsS0FBSyxNQUFNLElBQUksUUFBUztZQUNsQyxRQUFRLE9BQU8sS0FBSztRQUN0QjtJQUNGO0lBQ0EsT0FBTztBQUNUO0FBRUEsTUFBTSxPQUFPLE9BQU87QUFDcEIsTUFBTSxpQkFBaUIsT0FBTztBQUM5QixNQUFNLGtCQUFrQixPQUFPO0FBQy9CLE1BQU0sV0FBVyxPQUFPO0FBQ3hCLE1BQU0sY0FBYyxPQUFPO0FBRTNCO2tEQUNrRCxHQUNsRCxNQUFlO0lBQ2IsQ0FBQyxLQUFLLENBQVk7SUFDbEIsQ0FBQyxlQUFlLENBQVU7SUFDMUIsQ0FBQyxnQkFBZ0IsQ0FBVTtJQUMzQixDQUFDLFNBQVMsQ0FBVTtJQUVwQixDQUFDLFlBQVksR0FBYTtRQUN4QixJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUU7WUFDZCxPQUFPLElBQUksQ0FBQyxLQUFLO1FBQ25CO1FBQ0EsTUFBTSxTQUFTLElBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRTtRQUM5QixNQUFNLFNBQVMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJO1FBQ3hDLElBQUksQ0FBQyxRQUFRO1lBQ1gsT0FBTztRQUNUO1FBQ0EsSUFBSTtRQUNKLE1BQVEsVUFBVSxXQUFXLEtBQUssUUFBVTtZQUMxQyxNQUFNLEdBQUcsSUFBSSxHQUFHO1lBQ2hCLE9BQU8sS0FBSztRQUNkO1FBQ0EsT0FBTztJQUNUO0lBRUEsWUFBWSxPQUEyQixFQUFFLE9BQXlCLENBQUU7UUFDbEUsSUFBSSxDQUFDLGVBQWUsR0FBRyxhQUFhLFVBQVUsUUFBUSxVQUFVO1FBQ2hFLE1BQU0sRUFBRSxRQUFTLE1BQUssRUFBRSxVQUFXLElBQUksVUFBUyxFQUFFLEdBQUc7UUFDckQsSUFBSSxDQUFDLGdCQUFnQixHQUFHLGFBQWEsV0FBVyxTQUFTLFVBQVU7UUFDbkUsSUFBSSxDQUFDLFNBQVMsR0FBRztJQUNuQjtJQUVBO3VFQUNxRSxHQUNyRSxDQUFDLDJCQUEyQixHQUF1QjtRQUNqRCxNQUFNLE9BQTJCLEVBQUU7UUFDbkMsS0FBSyxNQUFNLENBQUMsS0FBSyxNQUFNLElBQUksSUFBSSxDQUFDLGdCQUFnQixDQUFFO1lBQ2hELElBQUksUUFBUSxjQUFjO2dCQUN4QixLQUFLLEtBQUs7b0JBQUM7b0JBQUs7aUJBQU07WUFDeEI7UUFDRjtRQUNBLE9BQU87SUFDVDtJQUVBLENBQUMsT0FBTyxJQUFJLHNCQUFzQixHQUFHO1FBQ25DLE9BQU8sQ0FBQyxFQUFFLElBQUksQ0FBQyxZQUFZLEtBQUssR0FBRyxDQUFDO0lBQ3RDO0lBRUEsQ0FBQyxPQUFPLElBQUksOEJBQThCLENBQ3hDLEtBQWEsRUFDYixtQ0FBbUM7SUFDbkMsT0FBWSxFQUNaLE9BQXNELEVBQ3REO1FBQ0EsSUFBSSxRQUFRLEdBQUc7WUFDYixPQUFPLFFBQVEsUUFBUSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsWUFBWSxLQUFLLENBQUMsQ0FBQyxFQUFFO1FBQ3ZEO1FBRUEsTUFBTSxhQUFhLE9BQU8sT0FBTyxDQUFDLEdBQUcsU0FBUztZQUM1QyxPQUFPLFFBQVEsVUFBVSxPQUFPLE9BQU8sUUFBUSxRQUFRO1FBQ3pEO1FBQ0EsT0FBTyxDQUFDLEVBQUUsUUFBUSxRQUFRLElBQUksQ0FBQyxZQUFZLE1BQU0sV0FBVyxDQUFDLEVBQzNELFFBQVEsRUFBRSxFQUFFLFlBQ2IsQ0FBQztJQUNKO0FBQ0Y7QUFFQTs7Ozs7Ozs7O2FBU2EsR0FDYixPQUFPLE1BQU0sa0JBQWtCO0lBQzdCLGlFQUFpRSxHQUNqRSxJQUFJLE9BQWU7UUFDakIsT0FBTztlQUFJLElBQUk7U0FBQyxDQUFDO0lBQ25CO0lBRUEsWUFBWSxPQUEyQixFQUFFLFVBQTRCLENBQUMsQ0FBQyxDQUFFO1FBQ3ZFLEtBQUssQ0FBQyxTQUFTO0lBQ2pCO0lBRUEsMEVBQTBFLEdBQzFFLE1BQU0sVUFBcUMsQ0FBQyxDQUFDLEVBQUU7UUFDN0MsS0FBSyxNQUFNLE9BQU8sSUFBSSxDQUFDLE9BQVE7WUFDN0IsSUFBSSxDQUFDLElBQUksS0FBSyxNQUFNO1FBQ3RCO0lBQ0Y7SUFFQTs7O0dBR0MsR0FDRCxPQUFPLEdBQVcsRUFBRSxVQUFxQyxDQUFDLENBQUMsRUFBVztRQUNwRSxJQUFJLENBQUMsSUFBSSxLQUFLLE1BQU07UUFDcEIsT0FBTztJQUNUO0lBRUE7cURBQ21ELEdBQ25ELElBQUksR0FBVyxFQUFzQjtRQUNuQyxNQUFNLGNBQWMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJO1FBQzdDLElBQUksQ0FBQyxhQUFhO1lBQ2hCLE9BQU87UUFDVDtRQUNBLE1BQU0sUUFBUSxZQUFZLE1BQU0sV0FBVztRQUMzQyxJQUFJLENBQUMsT0FBTztZQUNWLE9BQU87UUFDVDtRQUNBLE1BQU0sR0FBRyxNQUFNLEdBQUc7UUFDbEIsT0FBTztJQUNUO0lBRUE7d0JBQ3NCLEdBQ3RCLElBQUksR0FBVyxFQUFXO1FBQ3hCLE1BQU0sY0FBYyxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUk7UUFDN0MsSUFBSSxDQUFDLGFBQWE7WUFDaEIsT0FBTztRQUNUO1FBQ0EsT0FBTyxXQUFXLEtBQUssS0FBSztJQUM5QjtJQUVBOztHQUVDLEdBQ0QsSUFDRSxHQUFXLEVBQ1gsS0FBb0IsRUFDcEIsVUFBcUMsQ0FBQyxDQUFDLEVBQ2pDO1FBQ04sTUFBTSxhQUFhLElBQUksQ0FBQyxnQkFBZ0I7UUFDeEMsTUFBTSxTQUFtQixFQUFFO1FBQzNCLEtBQUssTUFBTSxDQUFDLEtBQUssTUFBTSxJQUFJLFdBQVk7WUFDckMsSUFBSSxRQUFRLGNBQWM7Z0JBQ3hCLE9BQU8sS0FBSztZQUNkO1FBQ0Y7UUFDQSxNQUFNLFNBQVMsSUFBSSxDQUFDLFNBQVM7UUFFN0IsSUFBSSxDQUFDLFVBQVUsUUFBUSxVQUFVLENBQUMsUUFBUSxnQkFBZ0I7WUFDeEQsTUFBTSxJQUFJLFVBQ1I7UUFFSjtRQUVBLE1BQU0sU0FBUyxJQUFJLE9BQU8sS0FBSyxPQUFPO1FBQ3RDLE9BQU8sU0FBUyxRQUFRLFVBQVU7UUFDbEMsV0FBVyxRQUFRO1FBRW5CLFdBQVcsT0FBTztRQUNsQixLQUFLLE1BQU0sU0FBUyxPQUFRO1lBQzFCLFdBQVcsT0FBTyxjQUFjO1FBQ2xDO1FBQ0EsT0FBTyxJQUFJO0lBQ2I7SUFFQTs7MkJBRXlCLEdBQ3pCLFVBQThDO1FBQzVDLE9BQU8sSUFBSSxDQUFDLE9BQU8sU0FBUztJQUM5QjtJQUVBOzBCQUN3QixHQUN4QixDQUFDLE9BQWlDO1FBQ2hDLEtBQUssTUFBTSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUU7WUFDeEIsTUFBTTtRQUNSO0lBQ0Y7SUFFQTswQkFDd0IsR0FDeEIsQ0FBQyxTQUFtQztRQUNsQyxLQUFLLE1BQU0sR0FBRyxNQUFNLElBQUksSUFBSSxDQUFFO1lBQzVCLE1BQU07UUFDUjtJQUNGO0lBRUE7MEJBQ3dCLEdBQ3hCLENBQUMsQ0FBQyxPQUFPLFNBQVMsR0FBdUM7UUFDdkQsTUFBTSxPQUFPLElBQUksQ0FBQyxZQUFZO1FBQzlCLEtBQUssTUFBTSxPQUFPLEtBQU07WUFDdEIsTUFBTSxRQUFRLElBQUksQ0FBQyxJQUFJO1lBQ3ZCLElBQUksT0FBTztnQkFDVCxNQUFNO29CQUFDO29CQUFLO2lCQUFNO1lBQ3BCO1FBQ0Y7SUFDRjtBQUNGO0FBbUJBOzs7Ozs7Ozs7Ozs7Ozs7OztDQWlCQyxHQUNELE9BQU8sTUFBTSx3QkFBd0I7SUFDbkMsQ0FBQyxPQUFPLENBQVc7SUFFbkI7MEJBQ3dCLEdBQ3hCLElBQUksT0FBd0I7UUFDMUIsT0FBTyxBQUFDLENBQUE7WUFDTixJQUFJLE9BQU87WUFDWCxXQUFXLE1BQU0sS0FBSyxJQUFJLENBQUU7Z0JBQzFCO1lBQ0Y7WUFDQSxPQUFPO1FBQ1QsQ0FBQTtJQUNGO0lBRUEsWUFDRSxPQUEyQixFQUMzQixVQUFrQyxDQUFDLENBQUMsQ0FDcEM7UUFDQSxLQUFLLENBQUMsU0FBUztRQUNmLE1BQU0sRUFBRSxLQUFJLEVBQUUsR0FBRztRQUNqQixJQUFJLENBQUMsQ0FBQyxPQUFPLEdBQUc7SUFDbEI7SUFFQTtlQUNhLEdBQ2IsTUFBTSxNQUFNLE9BQXdDLEVBQUU7UUFDcEQsV0FBVyxNQUFNLE9BQU8sSUFBSSxDQUFDLE9BQVE7WUFDbkMsTUFBTSxJQUFJLENBQUMsSUFBSSxLQUFLLE1BQU07UUFDNUI7SUFDRjtJQUVBOztvRUFFa0UsR0FDbEUsTUFBTSxPQUNKLEdBQVcsRUFDWCxVQUEyQyxDQUFDLENBQUMsRUFDM0I7UUFDbEIsTUFBTSxJQUFJLENBQUMsSUFBSSxLQUFLLE1BQU07UUFDMUIsT0FBTztJQUNUO0lBRUE7Ozs7O3NFQUtvRSxHQUNwRSxNQUFNLElBQ0osR0FBVyxFQUNYLFVBQXFDLENBQUMsQ0FBQyxFQUNWO1FBQzdCLE1BQU0sU0FBUyxRQUFRLFVBQVUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU87UUFDaEQsTUFBTSxVQUFVLENBQUMsRUFBRSxJQUFJLElBQUksQ0FBQztRQUU1QixNQUFNLFNBQVMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJO1FBQ3hDLElBQUksQ0FBQyxRQUFRO1lBQ1g7UUFDRjtRQUNBLE1BQU0sUUFBUSxPQUFPLE1BQU0sV0FBVztRQUN0QyxJQUFJLENBQUMsT0FBTztZQUNWO1FBQ0Y7UUFDQSxNQUFNLEdBQUcsTUFBTSxHQUFHO1FBQ2xCLElBQUksQ0FBQyxRQUFRO1lBQ1gsT0FBTztRQUNUO1FBQ0EsTUFBTSxTQUFTLE1BQU0sSUFBSSxDQUFDLElBQUksU0FBUztZQUFFLFFBQVE7UUFBTTtRQUN2RCxJQUFJLENBQUMsUUFBUTtZQUNYO1FBQ0Y7UUFDQSxNQUFNLE9BQU8sQ0FBQyxFQUFFLElBQUksQ0FBQyxFQUFFLE1BQU0sQ0FBQztRQUM5QixJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxFQUFFO1lBQ2xCLE1BQU0sSUFBSSxVQUFVO1FBQ3RCO1FBQ0EsTUFBTSxRQUFRLE1BQU0sSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLFFBQVEsTUFBTTtRQUVoRCxJQUFJLFFBQVEsR0FBRztZQUNiLE1BQU0sSUFBSSxDQUFDLE9BQU8sU0FBUztnQkFBRSxNQUFNO2dCQUFLLFFBQVE7WUFBTTtRQUN4RCxPQUFPO1lBQ0wsSUFBSSxPQUFPO2dCQUNULE1BQU0sSUFBSSxDQUFDLElBQUksU0FBUyxNQUFNLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLE9BQU87b0JBQ3RELFFBQVE7Z0JBQ1Y7WUFDRjtZQUNBLE9BQU87UUFDVDtJQUNGO0lBRUE7Ozs7O3NFQUtvRSxHQUNwRSxNQUFNLElBQ0osR0FBVyxFQUNYLFVBQXFDLENBQUMsQ0FBQyxFQUNyQjtRQUNsQixNQUFNLFNBQVMsUUFBUSxVQUFVLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPO1FBQ2hELE1BQU0sVUFBVSxDQUFDLEVBQUUsSUFBSSxJQUFJLENBQUM7UUFFNUIsTUFBTSxTQUFTLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSTtRQUN4QyxJQUFJLENBQUMsUUFBUTtZQUNYLE9BQU87UUFDVDtRQUNBLE1BQU0sUUFBUSxPQUFPLE1BQU0sV0FBVztRQUN0QyxJQUFJLENBQUMsT0FBTztZQUNWLE9BQU87UUFDVDtRQUNBLElBQUksQ0FBQyxRQUFRO1lBQ1gsT0FBTztRQUNUO1FBQ0EsTUFBTSxTQUFTLE1BQU0sSUFBSSxDQUFDLElBQUksU0FBUztZQUFFLFFBQVE7UUFBTTtRQUN2RCxJQUFJLENBQUMsUUFBUTtZQUNYLE9BQU87UUFDVDtRQUNBLE1BQU0sR0FBRyxNQUFNLEdBQUc7UUFDbEIsTUFBTSxPQUFPLENBQUMsRUFBRSxJQUFJLENBQUMsRUFBRSxNQUFNLENBQUM7UUFDOUIsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sRUFBRTtZQUNsQixNQUFNLElBQUksVUFBVTtRQUN0QjtRQUNBLE1BQU0sUUFBUSxNQUFNLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxRQUFRLE1BQU07UUFFaEQsSUFBSSxRQUFRLEdBQUc7WUFDYixNQUFNLElBQUksQ0FBQyxPQUFPLFNBQVM7Z0JBQUUsTUFBTTtnQkFBSyxRQUFRO1lBQU07WUFDdEQsT0FBTztRQUNULE9BQU87WUFDTCxJQUFJLE9BQU87Z0JBQ1QsTUFBTSxJQUFJLENBQUMsSUFBSSxTQUFTLE1BQU0sSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssT0FBTztvQkFDdEQsUUFBUTtnQkFDVjtZQUNGO1lBQ0EsT0FBTztRQUNUO0lBQ0Y7SUFFQTs7OztzQkFJb0IsR0FDcEIsTUFBTSxJQUNKLEdBQVcsRUFDWCxLQUFvQixFQUNwQixVQUEyQyxDQUFDLENBQUMsRUFDOUI7UUFDZixNQUFNLGFBQWEsSUFBSSxDQUFDLGdCQUFnQjtRQUN4QyxNQUFNLFVBQW9CLEVBQUU7UUFDNUIsS0FBSyxNQUFNLENBQUMsS0FBSyxNQUFNLElBQUksV0FBVyxVQUFXO1lBQy9DLElBQUksUUFBUSxjQUFjO2dCQUN4QixRQUFRLEtBQUs7WUFDZjtRQUNGO1FBQ0EsTUFBTSxTQUFTLElBQUksQ0FBQyxTQUFTO1FBQzdCLE1BQU0sU0FBUyxRQUFRLFVBQVUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU87UUFFaEQsSUFBSSxDQUFDLFVBQVUsUUFBUSxVQUFVLENBQUMsUUFBUSxnQkFBZ0I7WUFDeEQsTUFBTSxJQUFJLFVBQ1I7UUFFSjtRQUVBLE1BQU0sU0FBUyxJQUFJLE9BQU8sS0FBSyxPQUFPO1FBQ3RDLE9BQU8sU0FBUyxRQUFRLFVBQVU7UUFDbEMsV0FBVyxTQUFTO1FBRXBCLElBQUksUUFBUTtZQUNWLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLEVBQUU7Z0JBQ2xCLE1BQU0sSUFBSSxVQUFVO1lBQ3RCO1lBQ0EsT0FBTyxRQUFRLE1BQU0sSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssT0FBTztZQUMvQyxPQUFPLFFBQVE7WUFDZixXQUFXLFNBQVM7UUFDdEI7UUFFQSxXQUFXLE9BQU87UUFDbEIsS0FBSyxNQUFNLFVBQVUsUUFBUztZQUM1QixXQUFXLE9BQU8sY0FBYztRQUNsQztRQUNBLE9BQU8sSUFBSTtJQUNiO0lBRUE7Ozs7ZUFJYSxHQUNiLFVBQW1EO1FBQ2pELE9BQU8sSUFBSSxDQUFDLE9BQU8sY0FBYztJQUNuQztJQUVBOzs7ZUFHYSxHQUNiLE9BQU8sT0FBc0M7UUFDM0MsV0FBVyxNQUFNLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBRTtZQUM5QixNQUFNO1FBQ1I7SUFDRjtJQUVBOzs7ZUFHYSxHQUNiLE9BQU8sU0FBd0M7UUFDN0MsV0FBVyxNQUFNLEdBQUcsTUFBTSxJQUFJLElBQUksQ0FBRTtZQUNsQyxNQUFNO1FBQ1I7SUFDRjtJQUVBOzs7O2VBSWEsR0FDYixPQUFPLENBQUMsT0FBTyxjQUFjLEdBQTRDO1FBQ3ZFLE1BQU0sT0FBTyxJQUFJLENBQUMsWUFBWTtRQUM5QixLQUFLLE1BQU0sT0FBTyxLQUFNO1lBQ3RCLE1BQU0sUUFBUSxNQUFNLElBQUksQ0FBQyxJQUFJO1lBQzdCLElBQUksT0FBTztnQkFDVCxNQUFNO29CQUFDO29CQUFLO2lCQUFNO1lBQ3BCO1FBQ0Y7SUFDRjtBQUNGIn0=