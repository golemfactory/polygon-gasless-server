// Copyright 2018-2023 the oak authors. All rights reserved. MIT license.
import { createHttpError, SecureCookieMap, ServerSentEventStreamTarget } from "./deps.ts";
import { Request } from "./request.ts";
import { Response } from "./response.ts";
import { send } from "./send.ts";
import { assert } from "./util.ts";
/** Provides context about the current request and response to middleware
 * functions, and the current instance being processed is the first argument
 * provided a {@linkcode Middleware} function.
 *
 * _Typically this is only used as a type annotation and shouldn't be
 * constructed directly._
 *
 * ### Example
 *
 * ```ts
 * import { Application, Context } from "https://deno.land/x/oak/mod.ts";
 *
 * const app = new Application();
 *
 * app.use((ctx) => {
 *   // information about the request is here:
 *   ctx.request;
 *   // information about the response is here:
 *   ctx.response;
 *   // the cookie store is here:
 *   ctx.cookies;
 * });
 *
 * // Needs a type annotation because it cannot be inferred.
 * function mw(ctx: Context) {
 *   // process here...
 * }
 *
 * app.use(mw);
 * ```
 *
 * @template S the state which extends the application state (`AS`)
 * @template AS the type of the state derived from the application
 */ export class Context {
    #socket;
    #sse;
    #wrapReviverReplacer(reviver) {
        return reviver ? (key, value)=>reviver(key, value, this) : undefined;
    }
    /** A reference to the current application. */ app;
    /** An object which allows access to cookies, mediating both the request and
   * response. */ cookies;
    /** Is `true` if the current connection is upgradeable to a web socket.
   * Otherwise the value is `false`.  Use `.upgrade()` to upgrade the connection
   * and return the web socket. */ get isUpgradable() {
        const upgrade = this.request.headers.get("upgrade");
        if (!upgrade || upgrade.toLowerCase() !== "websocket") {
            return false;
        }
        const secKey = this.request.headers.get("sec-websocket-key");
        return typeof secKey === "string" && secKey != "";
    }
    /** Determines if the request should be responded to.  If `false` when the
   * middleware completes processing, the response will not be sent back to the
   * requestor.  Typically this is used if the middleware will take over low
   * level processing of requests and responses, for example if using web
   * sockets.  This automatically gets set to `false` when the context is
   * upgraded to a web socket via the `.upgrade()` method.
   *
   * The default is `true`. */ respond;
    /** An object which contains information about the current request. */ request;
    /** An object which contains information about the response that will be sent
   * when the middleware finishes processing. */ response;
    /** If the the current context has been upgraded, then this will be set to
   * with the current web socket, otherwise it is `undefined`. */ get socket() {
        return this.#socket;
    }
    /** The object to pass state to front-end views.  This can be typed by
   * supplying the generic state argument when creating a new app.  For
   * example:
   *
   * ```ts
   * const app = new Application<{ foo: string }>();
   * ```
   *
   * Or can be contextually inferred based on setting an initial state object:
   *
   * ```ts
   * const app = new Application({ state: { foo: "bar" } });
   * ```
   *
   * On each request/response cycle, the context's state is cloned from the
   * application state. This means changes to the context's `.state` will be
   * dropped when the request drops, but "defaults" can be applied to the
   * application's state.  Changes to the application's state though won't be
   * reflected until the next request in the context's state.
   */ state;
    constructor(app, serverRequest, state, { secure =false , jsonBodyReplacer , jsonBodyReviver  } = {}){
        this.app = app;
        this.state = state;
        const { proxy  } = app;
        this.request = new Request(serverRequest, {
            proxy,
            secure,
            jsonBodyReviver: this.#wrapReviverReplacer(jsonBodyReviver)
        });
        this.respond = true;
        this.response = new Response(this.request, this.#wrapReviverReplacer(jsonBodyReplacer));
        this.cookies = new SecureCookieMap(serverRequest, {
            keys: this.app.keys,
            response: this.response,
            secure: this.request.secure
        });
    }
    /** Asserts the condition and if the condition fails, creates an HTTP error
   * with the provided status (which defaults to `500`).  The error status by
   * default will be set on the `.response.status`.
   *
   * Because of limitation of TypeScript, any assertion type function requires
   * specific type annotations, so the {@linkcode Context} type should be used
   * even if it can be inferred from the context.
   *
   * ### Example
   *
   * ```ts
   * import { Context, Status } from "https://deno.land/x/oak/mod.ts";
   *
   * export function mw(ctx: Context) {
   *   const body = ctx.request.body();
   *   ctx.assert(body.type === "json", Status.NotAcceptable);
   *   // process the body and send a response...
   * }
   * ```
   */ assert(// deno-lint-ignore no-explicit-any
    condition, errorStatus = 500, message, props) {
        if (condition) {
            return;
        }
        const httpErrorOptions = {};
        if (typeof props === "object") {
            if ("headers" in props) {
                httpErrorOptions.headers = props.headers;
                delete props.headers;
            }
            if ("expose" in props) {
                httpErrorOptions.expose = props.expose;
                delete props.expose;
            }
        }
        const err = createHttpError(errorStatus, message, httpErrorOptions);
        if (props) {
            Object.assign(err, props);
        }
        throw err;
    }
    /** Asynchronously fulfill a response with a file from the local file
   * system.
   *
   * If the `options.path` is not supplied, the file to be sent will default
   * to this `.request.url.pathname`.
   *
   * Requires Deno read permission. */ send(options) {
        const { path =this.request.url.pathname , ...sendOptions } = options;
        return send(this, path, sendOptions);
    }
    /** Convert the connection to stream events, returning an event target for
   * sending server sent events.  Events dispatched on the returned target will
   * be sent to the client and be available in the client's `EventSource` that
   * initiated the connection.
   *
   * **Note** the body needs to be returned to the client to be able to
   * dispatch events, so dispatching events within the middleware will delay
   * sending the body back to the client.
   *
   * This will set the response body and update response headers to support
   * sending SSE events. Additional middleware should not modify the body.
   */ sendEvents(options) {
        if (!this.#sse) {
            assert(this.response.writable, "The response is not writable.");
            const sse = this.#sse = new ServerSentEventStreamTarget(options);
            this.app.addEventListener("close", ()=>sse.close());
            const [bodyInit, { headers  }] = sse.asResponseInit({
                headers: this.response.headers
            });
            this.response.body = bodyInit;
            if (headers instanceof Headers) {
                this.response.headers = headers;
            }
        }
        return this.#sse;
    }
    /** Create and throw an HTTP Error, which can be used to pass status
   * information which can be caught by other middleware to send more
   * meaningful error messages back to the client.  The passed error status will
   * be set on the `.response.status` by default as well.
   */ throw(errorStatus, message, props) {
        const err = createHttpError(errorStatus, message);
        if (props) {
            Object.assign(err, props);
        }
        throw err;
    }
    /** Take the current request and upgrade it to a web socket, resolving with
   * the a web standard `WebSocket` object. This will set `.respond` to
   * `false`.  If the socket cannot be upgraded, this method will throw. */ upgrade(options) {
        if (this.#socket) {
            return this.#socket;
        }
        if (!this.request.originalRequest.upgrade) {
            throw new TypeError("Web socket upgrades not currently supported for this type of server.");
        }
        this.#socket = this.request.originalRequest.upgrade(options);
        this.app.addEventListener("close", ()=>this.#socket?.close());
        this.respond = false;
        return this.#socket;
    }
    [Symbol.for("Deno.customInspect")](inspect) {
        const { app , cookies , isUpgradable , respond , request , response , socket , state  } = this;
        return `${this.constructor.name} ${inspect({
            app,
            cookies,
            isUpgradable,
            respond,
            request,
            response,
            socket,
            state
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
        const { app , cookies , isUpgradable , respond , request , response , socket , state  } = this;
        return `${options.stylize(this.constructor.name, "special")} ${inspect({
            app,
            cookies,
            isUpgradable,
            respond,
            request,
            response,
            socket,
            state
        }, newOptions)}`;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvb2FrQHYxMi42LjAvY29udGV4dC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIzIHRoZSBvYWsgYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG5cbmltcG9ydCB0eXBlIHsgQXBwbGljYXRpb24sIFN0YXRlIH0gZnJvbSBcIi4vYXBwbGljYXRpb24udHNcIjtcbmltcG9ydCB7XG4gIGNyZWF0ZUh0dHBFcnJvcixcbiAgdHlwZSBFcnJvclN0YXR1cyxcbiAgdHlwZSBIdHRwRXJyb3JPcHRpb25zLFxuICBLZXlTdGFjayxcbiAgU2VjdXJlQ29va2llTWFwLFxuICBTZXJ2ZXJTZW50RXZlbnRTdHJlYW1UYXJnZXQsXG4gIHR5cGUgU2VydmVyU2VudEV2ZW50VGFyZ2V0LFxuICB0eXBlIFNlcnZlclNlbnRFdmVudFRhcmdldE9wdGlvbnMsXG59IGZyb20gXCIuL2RlcHMudHNcIjtcbmltcG9ydCB7IFJlcXVlc3QgfSBmcm9tIFwiLi9yZXF1ZXN0LnRzXCI7XG5pbXBvcnQgeyBSZXNwb25zZSB9IGZyb20gXCIuL3Jlc3BvbnNlLnRzXCI7XG5pbXBvcnQgeyBzZW5kLCBTZW5kT3B0aW9ucyB9IGZyb20gXCIuL3NlbmQudHNcIjtcbmltcG9ydCB0eXBlIHsgU2VydmVyUmVxdWVzdCwgVXBncmFkZVdlYlNvY2tldE9wdGlvbnMgfSBmcm9tIFwiLi90eXBlcy5kLnRzXCI7XG5pbXBvcnQgeyBhc3NlcnQgfSBmcm9tIFwiLi91dGlsLnRzXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29udGV4dE9wdGlvbnM8XG4gIFMgZXh0ZW5kcyBBUyA9IFN0YXRlLFxuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBBUyBleHRlbmRzIFN0YXRlID0gUmVjb3JkPHN0cmluZywgYW55Pixcbj4ge1xuICBqc29uQm9keVJlcGxhY2VyPzogKFxuICAgIGtleTogc3RyaW5nLFxuICAgIHZhbHVlOiB1bmtub3duLFxuICAgIGNvbnRleHQ6IENvbnRleHQ8Uz4sXG4gICkgPT4gdW5rbm93bjtcbiAganNvbkJvZHlSZXZpdmVyPzogKFxuICAgIGtleTogc3RyaW5nLFxuICAgIHZhbHVlOiB1bmtub3duLFxuICAgIGNvbnRleHQ6IENvbnRleHQ8Uz4sXG4gICkgPT4gdW5rbm93bjtcbiAgc2VjdXJlPzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDb250ZXh0U2VuZE9wdGlvbnMgZXh0ZW5kcyBTZW5kT3B0aW9ucyB7XG4gIC8qKiBUaGUgZmlsZW5hbWUgdG8gc2VuZCwgd2hpY2ggd2lsbCBiZSByZXNvbHZlZCBiYXNlZCBvbiB0aGUgb3RoZXIgb3B0aW9ucy5cbiAgICogSWYgdGhpcyBwcm9wZXJ0eSBpcyBvbWl0dGVkLCB0aGUgY3VycmVudCBjb250ZXh0J3MgYC5yZXF1ZXN0LnVybC5wYXRobmFtZWBcbiAgICogd2lsbCBiZSB1c2VkLiAqL1xuICBwYXRoPzogc3RyaW5nO1xufVxuXG4vKiogUHJvdmlkZXMgY29udGV4dCBhYm91dCB0aGUgY3VycmVudCByZXF1ZXN0IGFuZCByZXNwb25zZSB0byBtaWRkbGV3YXJlXG4gKiBmdW5jdGlvbnMsIGFuZCB0aGUgY3VycmVudCBpbnN0YW5jZSBiZWluZyBwcm9jZXNzZWQgaXMgdGhlIGZpcnN0IGFyZ3VtZW50XG4gKiBwcm92aWRlZCBhIHtAbGlua2NvZGUgTWlkZGxld2FyZX0gZnVuY3Rpb24uXG4gKlxuICogX1R5cGljYWxseSB0aGlzIGlzIG9ubHkgdXNlZCBhcyBhIHR5cGUgYW5ub3RhdGlvbiBhbmQgc2hvdWxkbid0IGJlXG4gKiBjb25zdHJ1Y3RlZCBkaXJlY3RseS5fXG4gKlxuICogIyMjIEV4YW1wbGVcbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgQXBwbGljYXRpb24sIENvbnRleHQgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQveC9vYWsvbW9kLnRzXCI7XG4gKlxuICogY29uc3QgYXBwID0gbmV3IEFwcGxpY2F0aW9uKCk7XG4gKlxuICogYXBwLnVzZSgoY3R4KSA9PiB7XG4gKiAgIC8vIGluZm9ybWF0aW9uIGFib3V0IHRoZSByZXF1ZXN0IGlzIGhlcmU6XG4gKiAgIGN0eC5yZXF1ZXN0O1xuICogICAvLyBpbmZvcm1hdGlvbiBhYm91dCB0aGUgcmVzcG9uc2UgaXMgaGVyZTpcbiAqICAgY3R4LnJlc3BvbnNlO1xuICogICAvLyB0aGUgY29va2llIHN0b3JlIGlzIGhlcmU6XG4gKiAgIGN0eC5jb29raWVzO1xuICogfSk7XG4gKlxuICogLy8gTmVlZHMgYSB0eXBlIGFubm90YXRpb24gYmVjYXVzZSBpdCBjYW5ub3QgYmUgaW5mZXJyZWQuXG4gKiBmdW5jdGlvbiBtdyhjdHg6IENvbnRleHQpIHtcbiAqICAgLy8gcHJvY2VzcyBoZXJlLi4uXG4gKiB9XG4gKlxuICogYXBwLnVzZShtdyk7XG4gKiBgYGBcbiAqXG4gKiBAdGVtcGxhdGUgUyB0aGUgc3RhdGUgd2hpY2ggZXh0ZW5kcyB0aGUgYXBwbGljYXRpb24gc3RhdGUgKGBBU2ApXG4gKiBAdGVtcGxhdGUgQVMgdGhlIHR5cGUgb2YgdGhlIHN0YXRlIGRlcml2ZWQgZnJvbSB0aGUgYXBwbGljYXRpb25cbiAqL1xuZXhwb3J0IGNsYXNzIENvbnRleHQ8XG4gIFMgZXh0ZW5kcyBBUyA9IFN0YXRlLFxuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBBUyBleHRlbmRzIFN0YXRlID0gUmVjb3JkPHN0cmluZywgYW55Pixcbj4ge1xuICAjc29ja2V0PzogV2ViU29ja2V0O1xuICAjc3NlPzogU2VydmVyU2VudEV2ZW50VGFyZ2V0O1xuXG4gICN3cmFwUmV2aXZlclJlcGxhY2VyKFxuICAgIHJldml2ZXI/OiAoa2V5OiBzdHJpbmcsIHZhbHVlOiB1bmtub3duLCBjb250ZXh0OiB0aGlzKSA9PiB1bmtub3duLFxuICApOiB1bmRlZmluZWQgfCAoKGtleTogc3RyaW5nLCB2YWx1ZTogdW5rbm93bikgPT4gdW5rbm93bikge1xuICAgIHJldHVybiByZXZpdmVyXG4gICAgICA/IChrZXk6IHN0cmluZywgdmFsdWU6IHVua25vd24pID0+IHJldml2ZXIoa2V5LCB2YWx1ZSwgdGhpcylcbiAgICAgIDogdW5kZWZpbmVkO1xuICB9XG5cbiAgLyoqIEEgcmVmZXJlbmNlIHRvIHRoZSBjdXJyZW50IGFwcGxpY2F0aW9uLiAqL1xuICBhcHA6IEFwcGxpY2F0aW9uPEFTPjtcblxuICAvKiogQW4gb2JqZWN0IHdoaWNoIGFsbG93cyBhY2Nlc3MgdG8gY29va2llcywgbWVkaWF0aW5nIGJvdGggdGhlIHJlcXVlc3QgYW5kXG4gICAqIHJlc3BvbnNlLiAqL1xuICBjb29raWVzOiBTZWN1cmVDb29raWVNYXA7XG5cbiAgLyoqIElzIGB0cnVlYCBpZiB0aGUgY3VycmVudCBjb25uZWN0aW9uIGlzIHVwZ3JhZGVhYmxlIHRvIGEgd2ViIHNvY2tldC5cbiAgICogT3RoZXJ3aXNlIHRoZSB2YWx1ZSBpcyBgZmFsc2VgLiAgVXNlIGAudXBncmFkZSgpYCB0byB1cGdyYWRlIHRoZSBjb25uZWN0aW9uXG4gICAqIGFuZCByZXR1cm4gdGhlIHdlYiBzb2NrZXQuICovXG4gIGdldCBpc1VwZ3JhZGFibGUoKTogYm9vbGVhbiB7XG4gICAgY29uc3QgdXBncmFkZSA9IHRoaXMucmVxdWVzdC5oZWFkZXJzLmdldChcInVwZ3JhZGVcIik7XG4gICAgaWYgKCF1cGdyYWRlIHx8IHVwZ3JhZGUudG9Mb3dlckNhc2UoKSAhPT0gXCJ3ZWJzb2NrZXRcIikge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBjb25zdCBzZWNLZXkgPSB0aGlzLnJlcXVlc3QuaGVhZGVycy5nZXQoXCJzZWMtd2Vic29ja2V0LWtleVwiKTtcbiAgICByZXR1cm4gdHlwZW9mIHNlY0tleSA9PT0gXCJzdHJpbmdcIiAmJiBzZWNLZXkgIT0gXCJcIjtcbiAgfVxuXG4gIC8qKiBEZXRlcm1pbmVzIGlmIHRoZSByZXF1ZXN0IHNob3VsZCBiZSByZXNwb25kZWQgdG8uICBJZiBgZmFsc2VgIHdoZW4gdGhlXG4gICAqIG1pZGRsZXdhcmUgY29tcGxldGVzIHByb2Nlc3NpbmcsIHRoZSByZXNwb25zZSB3aWxsIG5vdCBiZSBzZW50IGJhY2sgdG8gdGhlXG4gICAqIHJlcXVlc3Rvci4gIFR5cGljYWxseSB0aGlzIGlzIHVzZWQgaWYgdGhlIG1pZGRsZXdhcmUgd2lsbCB0YWtlIG92ZXIgbG93XG4gICAqIGxldmVsIHByb2Nlc3Npbmcgb2YgcmVxdWVzdHMgYW5kIHJlc3BvbnNlcywgZm9yIGV4YW1wbGUgaWYgdXNpbmcgd2ViXG4gICAqIHNvY2tldHMuICBUaGlzIGF1dG9tYXRpY2FsbHkgZ2V0cyBzZXQgdG8gYGZhbHNlYCB3aGVuIHRoZSBjb250ZXh0IGlzXG4gICAqIHVwZ3JhZGVkIHRvIGEgd2ViIHNvY2tldCB2aWEgdGhlIGAudXBncmFkZSgpYCBtZXRob2QuXG4gICAqXG4gICAqIFRoZSBkZWZhdWx0IGlzIGB0cnVlYC4gKi9cbiAgcmVzcG9uZDogYm9vbGVhbjtcblxuICAvKiogQW4gb2JqZWN0IHdoaWNoIGNvbnRhaW5zIGluZm9ybWF0aW9uIGFib3V0IHRoZSBjdXJyZW50IHJlcXVlc3QuICovXG4gIHJlcXVlc3Q6IFJlcXVlc3Q7XG5cbiAgLyoqIEFuIG9iamVjdCB3aGljaCBjb250YWlucyBpbmZvcm1hdGlvbiBhYm91dCB0aGUgcmVzcG9uc2UgdGhhdCB3aWxsIGJlIHNlbnRcbiAgICogd2hlbiB0aGUgbWlkZGxld2FyZSBmaW5pc2hlcyBwcm9jZXNzaW5nLiAqL1xuICByZXNwb25zZTogUmVzcG9uc2U7XG5cbiAgLyoqIElmIHRoZSB0aGUgY3VycmVudCBjb250ZXh0IGhhcyBiZWVuIHVwZ3JhZGVkLCB0aGVuIHRoaXMgd2lsbCBiZSBzZXQgdG9cbiAgICogd2l0aCB0aGUgY3VycmVudCB3ZWIgc29ja2V0LCBvdGhlcndpc2UgaXQgaXMgYHVuZGVmaW5lZGAuICovXG4gIGdldCBzb2NrZXQoKTogV2ViU29ja2V0IHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy4jc29ja2V0O1xuICB9XG5cbiAgLyoqIFRoZSBvYmplY3QgdG8gcGFzcyBzdGF0ZSB0byBmcm9udC1lbmQgdmlld3MuICBUaGlzIGNhbiBiZSB0eXBlZCBieVxuICAgKiBzdXBwbHlpbmcgdGhlIGdlbmVyaWMgc3RhdGUgYXJndW1lbnQgd2hlbiBjcmVhdGluZyBhIG5ldyBhcHAuICBGb3JcbiAgICogZXhhbXBsZTpcbiAgICpcbiAgICogYGBgdHNcbiAgICogY29uc3QgYXBwID0gbmV3IEFwcGxpY2F0aW9uPHsgZm9vOiBzdHJpbmcgfT4oKTtcbiAgICogYGBgXG4gICAqXG4gICAqIE9yIGNhbiBiZSBjb250ZXh0dWFsbHkgaW5mZXJyZWQgYmFzZWQgb24gc2V0dGluZyBhbiBpbml0aWFsIHN0YXRlIG9iamVjdDpcbiAgICpcbiAgICogYGBgdHNcbiAgICogY29uc3QgYXBwID0gbmV3IEFwcGxpY2F0aW9uKHsgc3RhdGU6IHsgZm9vOiBcImJhclwiIH0gfSk7XG4gICAqIGBgYFxuICAgKlxuICAgKiBPbiBlYWNoIHJlcXVlc3QvcmVzcG9uc2UgY3ljbGUsIHRoZSBjb250ZXh0J3Mgc3RhdGUgaXMgY2xvbmVkIGZyb20gdGhlXG4gICAqIGFwcGxpY2F0aW9uIHN0YXRlLiBUaGlzIG1lYW5zIGNoYW5nZXMgdG8gdGhlIGNvbnRleHQncyBgLnN0YXRlYCB3aWxsIGJlXG4gICAqIGRyb3BwZWQgd2hlbiB0aGUgcmVxdWVzdCBkcm9wcywgYnV0IFwiZGVmYXVsdHNcIiBjYW4gYmUgYXBwbGllZCB0byB0aGVcbiAgICogYXBwbGljYXRpb24ncyBzdGF0ZS4gIENoYW5nZXMgdG8gdGhlIGFwcGxpY2F0aW9uJ3Mgc3RhdGUgdGhvdWdoIHdvbid0IGJlXG4gICAqIHJlZmxlY3RlZCB1bnRpbCB0aGUgbmV4dCByZXF1ZXN0IGluIHRoZSBjb250ZXh0J3Mgc3RhdGUuXG4gICAqL1xuICBzdGF0ZTogUztcblxuICBjb25zdHJ1Y3RvcihcbiAgICBhcHA6IEFwcGxpY2F0aW9uPEFTPixcbiAgICBzZXJ2ZXJSZXF1ZXN0OiBTZXJ2ZXJSZXF1ZXN0LFxuICAgIHN0YXRlOiBTLFxuICAgIHtcbiAgICAgIHNlY3VyZSA9IGZhbHNlLFxuICAgICAganNvbkJvZHlSZXBsYWNlcixcbiAgICAgIGpzb25Cb2R5UmV2aXZlcixcbiAgICB9OiBDb250ZXh0T3B0aW9uczxTLCBBUz4gPSB7fSxcbiAgKSB7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG4gICAgdGhpcy5zdGF0ZSA9IHN0YXRlO1xuICAgIGNvbnN0IHsgcHJveHkgfSA9IGFwcDtcbiAgICB0aGlzLnJlcXVlc3QgPSBuZXcgUmVxdWVzdChcbiAgICAgIHNlcnZlclJlcXVlc3QsXG4gICAgICB7XG4gICAgICAgIHByb3h5LFxuICAgICAgICBzZWN1cmUsXG4gICAgICAgIGpzb25Cb2R5UmV2aXZlcjogdGhpcy4jd3JhcFJldml2ZXJSZXBsYWNlcihqc29uQm9keVJldml2ZXIpLFxuICAgICAgfSxcbiAgICApO1xuICAgIHRoaXMucmVzcG9uZCA9IHRydWU7XG4gICAgdGhpcy5yZXNwb25zZSA9IG5ldyBSZXNwb25zZShcbiAgICAgIHRoaXMucmVxdWVzdCxcbiAgICAgIHRoaXMuI3dyYXBSZXZpdmVyUmVwbGFjZXIoanNvbkJvZHlSZXBsYWNlciksXG4gICAgKTtcbiAgICB0aGlzLmNvb2tpZXMgPSBuZXcgU2VjdXJlQ29va2llTWFwKHNlcnZlclJlcXVlc3QsIHtcbiAgICAgIGtleXM6IHRoaXMuYXBwLmtleXMgYXMgS2V5U3RhY2sgfCB1bmRlZmluZWQsXG4gICAgICByZXNwb25zZTogdGhpcy5yZXNwb25zZSxcbiAgICAgIHNlY3VyZTogdGhpcy5yZXF1ZXN0LnNlY3VyZSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBBc3NlcnRzIHRoZSBjb25kaXRpb24gYW5kIGlmIHRoZSBjb25kaXRpb24gZmFpbHMsIGNyZWF0ZXMgYW4gSFRUUCBlcnJvclxuICAgKiB3aXRoIHRoZSBwcm92aWRlZCBzdGF0dXMgKHdoaWNoIGRlZmF1bHRzIHRvIGA1MDBgKS4gIFRoZSBlcnJvciBzdGF0dXMgYnlcbiAgICogZGVmYXVsdCB3aWxsIGJlIHNldCBvbiB0aGUgYC5yZXNwb25zZS5zdGF0dXNgLlxuICAgKlxuICAgKiBCZWNhdXNlIG9mIGxpbWl0YXRpb24gb2YgVHlwZVNjcmlwdCwgYW55IGFzc2VydGlvbiB0eXBlIGZ1bmN0aW9uIHJlcXVpcmVzXG4gICAqIHNwZWNpZmljIHR5cGUgYW5ub3RhdGlvbnMsIHNvIHRoZSB7QGxpbmtjb2RlIENvbnRleHR9IHR5cGUgc2hvdWxkIGJlIHVzZWRcbiAgICogZXZlbiBpZiBpdCBjYW4gYmUgaW5mZXJyZWQgZnJvbSB0aGUgY29udGV4dC5cbiAgICpcbiAgICogIyMjIEV4YW1wbGVcbiAgICpcbiAgICogYGBgdHNcbiAgICogaW1wb3J0IHsgQ29udGV4dCwgU3RhdHVzIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3gvb2FrL21vZC50c1wiO1xuICAgKlxuICAgKiBleHBvcnQgZnVuY3Rpb24gbXcoY3R4OiBDb250ZXh0KSB7XG4gICAqICAgY29uc3QgYm9keSA9IGN0eC5yZXF1ZXN0LmJvZHkoKTtcbiAgICogICBjdHguYXNzZXJ0KGJvZHkudHlwZSA9PT0gXCJqc29uXCIsIFN0YXR1cy5Ob3RBY2NlcHRhYmxlKTtcbiAgICogICAvLyBwcm9jZXNzIHRoZSBib2R5IGFuZCBzZW5kIGEgcmVzcG9uc2UuLi5cbiAgICogfVxuICAgKiBgYGBcbiAgICovXG4gIGFzc2VydChcbiAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAgIGNvbmRpdGlvbjogYW55LFxuICAgIGVycm9yU3RhdHVzOiBFcnJvclN0YXR1cyA9IDUwMCxcbiAgICBtZXNzYWdlPzogc3RyaW5nLFxuICAgIHByb3BzPzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gJiBPbWl0PEh0dHBFcnJvck9wdGlvbnMsIFwic3RhdHVzXCI+LFxuICApOiBhc3NlcnRzIGNvbmRpdGlvbiB7XG4gICAgaWYgKGNvbmRpdGlvbikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBodHRwRXJyb3JPcHRpb25zOiBIdHRwRXJyb3JPcHRpb25zID0ge307XG4gICAgaWYgKHR5cGVvZiBwcm9wcyA9PT0gXCJvYmplY3RcIikge1xuICAgICAgaWYgKFwiaGVhZGVyc1wiIGluIHByb3BzKSB7XG4gICAgICAgIGh0dHBFcnJvck9wdGlvbnMuaGVhZGVycyA9IHByb3BzLmhlYWRlcnM7XG4gICAgICAgIGRlbGV0ZSBwcm9wcy5oZWFkZXJzO1xuICAgICAgfVxuICAgICAgaWYgKFwiZXhwb3NlXCIgaW4gcHJvcHMpIHtcbiAgICAgICAgaHR0cEVycm9yT3B0aW9ucy5leHBvc2UgPSBwcm9wcy5leHBvc2U7XG4gICAgICAgIGRlbGV0ZSBwcm9wcy5leHBvc2U7XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IGVyciA9IGNyZWF0ZUh0dHBFcnJvcihlcnJvclN0YXR1cywgbWVzc2FnZSwgaHR0cEVycm9yT3B0aW9ucyk7XG4gICAgaWYgKHByb3BzKSB7XG4gICAgICBPYmplY3QuYXNzaWduKGVyciwgcHJvcHMpO1xuICAgIH1cbiAgICB0aHJvdyBlcnI7XG4gIH1cblxuICAvKiogQXN5bmNocm9ub3VzbHkgZnVsZmlsbCBhIHJlc3BvbnNlIHdpdGggYSBmaWxlIGZyb20gdGhlIGxvY2FsIGZpbGVcbiAgICogc3lzdGVtLlxuICAgKlxuICAgKiBJZiB0aGUgYG9wdGlvbnMucGF0aGAgaXMgbm90IHN1cHBsaWVkLCB0aGUgZmlsZSB0byBiZSBzZW50IHdpbGwgZGVmYXVsdFxuICAgKiB0byB0aGlzIGAucmVxdWVzdC51cmwucGF0aG5hbWVgLlxuICAgKlxuICAgKiBSZXF1aXJlcyBEZW5vIHJlYWQgcGVybWlzc2lvbi4gKi9cbiAgc2VuZChvcHRpb25zOiBDb250ZXh0U2VuZE9wdGlvbnMpOiBQcm9taXNlPHN0cmluZyB8IHVuZGVmaW5lZD4ge1xuICAgIGNvbnN0IHsgcGF0aCA9IHRoaXMucmVxdWVzdC51cmwucGF0aG5hbWUsIC4uLnNlbmRPcHRpb25zIH0gPSBvcHRpb25zO1xuICAgIHJldHVybiBzZW5kKHRoaXMsIHBhdGgsIHNlbmRPcHRpb25zKTtcbiAgfVxuXG4gIC8qKiBDb252ZXJ0IHRoZSBjb25uZWN0aW9uIHRvIHN0cmVhbSBldmVudHMsIHJldHVybmluZyBhbiBldmVudCB0YXJnZXQgZm9yXG4gICAqIHNlbmRpbmcgc2VydmVyIHNlbnQgZXZlbnRzLiAgRXZlbnRzIGRpc3BhdGNoZWQgb24gdGhlIHJldHVybmVkIHRhcmdldCB3aWxsXG4gICAqIGJlIHNlbnQgdG8gdGhlIGNsaWVudCBhbmQgYmUgYXZhaWxhYmxlIGluIHRoZSBjbGllbnQncyBgRXZlbnRTb3VyY2VgIHRoYXRcbiAgICogaW5pdGlhdGVkIHRoZSBjb25uZWN0aW9uLlxuICAgKlxuICAgKiAqKk5vdGUqKiB0aGUgYm9keSBuZWVkcyB0byBiZSByZXR1cm5lZCB0byB0aGUgY2xpZW50IHRvIGJlIGFibGUgdG9cbiAgICogZGlzcGF0Y2ggZXZlbnRzLCBzbyBkaXNwYXRjaGluZyBldmVudHMgd2l0aGluIHRoZSBtaWRkbGV3YXJlIHdpbGwgZGVsYXlcbiAgICogc2VuZGluZyB0aGUgYm9keSBiYWNrIHRvIHRoZSBjbGllbnQuXG4gICAqXG4gICAqIFRoaXMgd2lsbCBzZXQgdGhlIHJlc3BvbnNlIGJvZHkgYW5kIHVwZGF0ZSByZXNwb25zZSBoZWFkZXJzIHRvIHN1cHBvcnRcbiAgICogc2VuZGluZyBTU0UgZXZlbnRzLiBBZGRpdGlvbmFsIG1pZGRsZXdhcmUgc2hvdWxkIG5vdCBtb2RpZnkgdGhlIGJvZHkuXG4gICAqL1xuICBzZW5kRXZlbnRzKG9wdGlvbnM/OiBTZXJ2ZXJTZW50RXZlbnRUYXJnZXRPcHRpb25zKTogU2VydmVyU2VudEV2ZW50VGFyZ2V0IHtcbiAgICBpZiAoIXRoaXMuI3NzZSkge1xuICAgICAgYXNzZXJ0KHRoaXMucmVzcG9uc2Uud3JpdGFibGUsIFwiVGhlIHJlc3BvbnNlIGlzIG5vdCB3cml0YWJsZS5cIik7XG4gICAgICBjb25zdCBzc2UgPSB0aGlzLiNzc2UgPSBuZXcgU2VydmVyU2VudEV2ZW50U3RyZWFtVGFyZ2V0KG9wdGlvbnMpO1xuICAgICAgdGhpcy5hcHAuYWRkRXZlbnRMaXN0ZW5lcihcImNsb3NlXCIsICgpID0+IHNzZS5jbG9zZSgpKTtcbiAgICAgIGNvbnN0IFtib2R5SW5pdCwgeyBoZWFkZXJzIH1dID0gc3NlLmFzUmVzcG9uc2VJbml0KHtcbiAgICAgICAgaGVhZGVyczogdGhpcy5yZXNwb25zZS5oZWFkZXJzLFxuICAgICAgfSk7XG4gICAgICB0aGlzLnJlc3BvbnNlLmJvZHkgPSBib2R5SW5pdDtcbiAgICAgIGlmIChoZWFkZXJzIGluc3RhbmNlb2YgSGVhZGVycykge1xuICAgICAgICB0aGlzLnJlc3BvbnNlLmhlYWRlcnMgPSBoZWFkZXJzO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy4jc3NlO1xuICB9XG5cbiAgLyoqIENyZWF0ZSBhbmQgdGhyb3cgYW4gSFRUUCBFcnJvciwgd2hpY2ggY2FuIGJlIHVzZWQgdG8gcGFzcyBzdGF0dXNcbiAgICogaW5mb3JtYXRpb24gd2hpY2ggY2FuIGJlIGNhdWdodCBieSBvdGhlciBtaWRkbGV3YXJlIHRvIHNlbmQgbW9yZVxuICAgKiBtZWFuaW5nZnVsIGVycm9yIG1lc3NhZ2VzIGJhY2sgdG8gdGhlIGNsaWVudC4gIFRoZSBwYXNzZWQgZXJyb3Igc3RhdHVzIHdpbGxcbiAgICogYmUgc2V0IG9uIHRoZSBgLnJlc3BvbnNlLnN0YXR1c2AgYnkgZGVmYXVsdCBhcyB3ZWxsLlxuICAgKi9cbiAgdGhyb3coXG4gICAgZXJyb3JTdGF0dXM6IEVycm9yU3RhdHVzLFxuICAgIG1lc3NhZ2U/OiBzdHJpbmcsXG4gICAgcHJvcHM/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbiAgKTogbmV2ZXIge1xuICAgIGNvbnN0IGVyciA9IGNyZWF0ZUh0dHBFcnJvcihlcnJvclN0YXR1cywgbWVzc2FnZSk7XG4gICAgaWYgKHByb3BzKSB7XG4gICAgICBPYmplY3QuYXNzaWduKGVyciwgcHJvcHMpO1xuICAgIH1cbiAgICB0aHJvdyBlcnI7XG4gIH1cblxuICAvKiogVGFrZSB0aGUgY3VycmVudCByZXF1ZXN0IGFuZCB1cGdyYWRlIGl0IHRvIGEgd2ViIHNvY2tldCwgcmVzb2x2aW5nIHdpdGhcbiAgICogdGhlIGEgd2ViIHN0YW5kYXJkIGBXZWJTb2NrZXRgIG9iamVjdC4gVGhpcyB3aWxsIHNldCBgLnJlc3BvbmRgIHRvXG4gICAqIGBmYWxzZWAuICBJZiB0aGUgc29ja2V0IGNhbm5vdCBiZSB1cGdyYWRlZCwgdGhpcyBtZXRob2Qgd2lsbCB0aHJvdy4gKi9cbiAgdXBncmFkZShvcHRpb25zPzogVXBncmFkZVdlYlNvY2tldE9wdGlvbnMpOiBXZWJTb2NrZXQge1xuICAgIGlmICh0aGlzLiNzb2NrZXQpIHtcbiAgICAgIHJldHVybiB0aGlzLiNzb2NrZXQ7XG4gICAgfVxuICAgIGlmICghdGhpcy5yZXF1ZXN0Lm9yaWdpbmFsUmVxdWVzdC51cGdyYWRlKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICBcIldlYiBzb2NrZXQgdXBncmFkZXMgbm90IGN1cnJlbnRseSBzdXBwb3J0ZWQgZm9yIHRoaXMgdHlwZSBvZiBzZXJ2ZXIuXCIsXG4gICAgICApO1xuICAgIH1cbiAgICB0aGlzLiNzb2NrZXQgPSB0aGlzLnJlcXVlc3Qub3JpZ2luYWxSZXF1ZXN0LnVwZ3JhZGUob3B0aW9ucyk7XG4gICAgdGhpcy5hcHAuYWRkRXZlbnRMaXN0ZW5lcihcImNsb3NlXCIsICgpID0+IHRoaXMuI3NvY2tldD8uY2xvc2UoKSk7XG4gICAgdGhpcy5yZXNwb25kID0gZmFsc2U7XG4gICAgcmV0dXJuIHRoaXMuI3NvY2tldDtcbiAgfVxuXG4gIFtTeW1ib2wuZm9yKFwiRGVuby5jdXN0b21JbnNwZWN0XCIpXShpbnNwZWN0OiAodmFsdWU6IHVua25vd24pID0+IHN0cmluZykge1xuICAgIGNvbnN0IHtcbiAgICAgIGFwcCxcbiAgICAgIGNvb2tpZXMsXG4gICAgICBpc1VwZ3JhZGFibGUsXG4gICAgICByZXNwb25kLFxuICAgICAgcmVxdWVzdCxcbiAgICAgIHJlc3BvbnNlLFxuICAgICAgc29ja2V0LFxuICAgICAgc3RhdGUsXG4gICAgfSA9IHRoaXM7XG4gICAgcmV0dXJuIGAke3RoaXMuY29uc3RydWN0b3IubmFtZX0gJHtcbiAgICAgIGluc3BlY3Qoe1xuICAgICAgICBhcHAsXG4gICAgICAgIGNvb2tpZXMsXG4gICAgICAgIGlzVXBncmFkYWJsZSxcbiAgICAgICAgcmVzcG9uZCxcbiAgICAgICAgcmVxdWVzdCxcbiAgICAgICAgcmVzcG9uc2UsXG4gICAgICAgIHNvY2tldCxcbiAgICAgICAgc3RhdGUsXG4gICAgICB9KVxuICAgIH1gO1xuICB9XG5cbiAgW1N5bWJvbC5mb3IoXCJub2RlanMudXRpbC5pbnNwZWN0LmN1c3RvbVwiKV0oXG4gICAgZGVwdGg6IG51bWJlcixcbiAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAgIG9wdGlvbnM6IGFueSxcbiAgICBpbnNwZWN0OiAodmFsdWU6IHVua25vd24sIG9wdGlvbnM/OiB1bmtub3duKSA9PiBzdHJpbmcsXG4gICkge1xuICAgIGlmIChkZXB0aCA8IDApIHtcbiAgICAgIHJldHVybiBvcHRpb25zLnN0eWxpemUoYFske3RoaXMuY29uc3RydWN0b3IubmFtZX1dYCwgXCJzcGVjaWFsXCIpO1xuICAgIH1cblxuICAgIGNvbnN0IG5ld09wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCBvcHRpb25zLCB7XG4gICAgICBkZXB0aDogb3B0aW9ucy5kZXB0aCA9PT0gbnVsbCA/IG51bGwgOiBvcHRpb25zLmRlcHRoIC0gMSxcbiAgICB9KTtcbiAgICBjb25zdCB7XG4gICAgICBhcHAsXG4gICAgICBjb29raWVzLFxuICAgICAgaXNVcGdyYWRhYmxlLFxuICAgICAgcmVzcG9uZCxcbiAgICAgIHJlcXVlc3QsXG4gICAgICByZXNwb25zZSxcbiAgICAgIHNvY2tldCxcbiAgICAgIHN0YXRlLFxuICAgIH0gPSB0aGlzO1xuICAgIHJldHVybiBgJHtvcHRpb25zLnN0eWxpemUodGhpcy5jb25zdHJ1Y3Rvci5uYW1lLCBcInNwZWNpYWxcIil9ICR7XG4gICAgICBpbnNwZWN0KHtcbiAgICAgICAgYXBwLFxuICAgICAgICBjb29raWVzLFxuICAgICAgICBpc1VwZ3JhZGFibGUsXG4gICAgICAgIHJlc3BvbmQsXG4gICAgICAgIHJlcXVlc3QsXG4gICAgICAgIHJlc3BvbnNlLFxuICAgICAgICBzb2NrZXQsXG4gICAgICAgIHN0YXRlLFxuICAgICAgfSwgbmV3T3B0aW9ucylcbiAgICB9YDtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHlFQUF5RTtBQUd6RSxTQUNFLGVBQWUsRUFJZixlQUFlLEVBQ2YsMkJBQTJCLFFBR3RCLFlBQVk7QUFDbkIsU0FBUyxPQUFPLFFBQVEsZUFBZTtBQUN2QyxTQUFTLFFBQVEsUUFBUSxnQkFBZ0I7QUFDekMsU0FBUyxJQUFJLFFBQXFCLFlBQVk7QUFFOUMsU0FBUyxNQUFNLFFBQVEsWUFBWTtBQTJCbkM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQWlDQyxHQUNELE9BQU8sTUFBTTtJQUtYLENBQUMsTUFBTSxDQUFhO0lBQ3BCLENBQUMsR0FBRyxDQUF5QjtJQUU3QixDQUFDLG1CQUFtQixDQUNsQixPQUFpRTtRQUVqRSxPQUFPLFVBQ0gsQ0FBQyxLQUFhLFFBQW1CLFFBQVEsS0FBSyxPQUFPLElBQUksSUFDekQ7SUFDTjtJQUVBLDRDQUE0QyxHQUM1QyxJQUFxQjtJQUVyQjtlQUNhLEdBQ2IsUUFBeUI7SUFFekI7O2dDQUU4QixHQUM5QixJQUFJLGVBQXdCO1FBQzFCLE1BQU0sVUFBVSxJQUFJLENBQUMsUUFBUSxRQUFRLElBQUk7UUFDekMsSUFBSSxDQUFDLFdBQVcsUUFBUSxrQkFBa0IsYUFBYTtZQUNyRCxPQUFPO1FBQ1Q7UUFDQSxNQUFNLFNBQVMsSUFBSSxDQUFDLFFBQVEsUUFBUSxJQUFJO1FBQ3hDLE9BQU8sT0FBTyxXQUFXLFlBQVksVUFBVTtJQUNqRDtJQUVBOzs7Ozs7OzRCQU8wQixHQUMxQixRQUFpQjtJQUVqQixvRUFBb0UsR0FDcEUsUUFBaUI7SUFFakI7OENBQzRDLEdBQzVDLFNBQW1CO0lBRW5COytEQUM2RCxHQUM3RCxJQUFJLFNBQWdDO1FBQ2xDLE9BQU8sSUFBSSxDQUFDLENBQUMsTUFBTTtJQUNyQjtJQUVBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBbUJDLEdBQ0QsTUFBUztJQUVULFlBQ0UsR0FBb0IsRUFDcEIsYUFBNEIsRUFDNUIsS0FBUSxFQUNSLEVBQ0UsUUFBUyxNQUFLLEVBQ2QsaUJBQWdCLEVBQ2hCLGdCQUFlLEVBQ08sR0FBRyxDQUFDLENBQUMsQ0FDN0I7UUFDQSxJQUFJLENBQUMsTUFBTTtRQUNYLElBQUksQ0FBQyxRQUFRO1FBQ2IsTUFBTSxFQUFFLE1BQUssRUFBRSxHQUFHO1FBQ2xCLElBQUksQ0FBQyxVQUFVLElBQUksUUFDakIsZUFDQTtZQUNFO1lBQ0E7WUFDQSxpQkFBaUIsSUFBSSxDQUFDLENBQUMsbUJBQW1CLENBQUM7UUFDN0M7UUFFRixJQUFJLENBQUMsVUFBVTtRQUNmLElBQUksQ0FBQyxXQUFXLElBQUksU0FDbEIsSUFBSSxDQUFDLFNBQ0wsSUFBSSxDQUFDLENBQUMsbUJBQW1CLENBQUM7UUFFNUIsSUFBSSxDQUFDLFVBQVUsSUFBSSxnQkFBZ0IsZUFBZTtZQUNoRCxNQUFNLElBQUksQ0FBQyxJQUFJO1lBQ2YsVUFBVSxJQUFJLENBQUM7WUFDZixRQUFRLElBQUksQ0FBQyxRQUFRO1FBQ3ZCO0lBQ0Y7SUFFQTs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQW1CQyxHQUNELE9BQ0UsbUNBQW1DO0lBQ25DLFNBQWMsRUFDZCxjQUEyQixHQUFHLEVBQzlCLE9BQWdCLEVBQ2hCLEtBQWtFLEVBQy9DO1FBQ25CLElBQUksV0FBVztZQUNiO1FBQ0Y7UUFDQSxNQUFNLG1CQUFxQyxDQUFDO1FBQzVDLElBQUksT0FBTyxVQUFVLFVBQVU7WUFDN0IsSUFBSSxhQUFhLE9BQU87Z0JBQ3RCLGlCQUFpQixVQUFVLE1BQU07Z0JBQ2pDLE9BQU8sTUFBTTtZQUNmO1lBQ0EsSUFBSSxZQUFZLE9BQU87Z0JBQ3JCLGlCQUFpQixTQUFTLE1BQU07Z0JBQ2hDLE9BQU8sTUFBTTtZQUNmO1FBQ0Y7UUFDQSxNQUFNLE1BQU0sZ0JBQWdCLGFBQWEsU0FBUztRQUNsRCxJQUFJLE9BQU87WUFDVCxPQUFPLE9BQU8sS0FBSztRQUNyQjtRQUNBLE1BQU07SUFDUjtJQUVBOzs7Ozs7b0NBTWtDLEdBQ2xDLEtBQUssT0FBMkIsRUFBK0I7UUFDN0QsTUFBTSxFQUFFLE1BQU8sSUFBSSxDQUFDLFFBQVEsSUFBSSxTQUFRLEVBQUUsR0FBRyxhQUFhLEdBQUc7UUFDN0QsT0FBTyxLQUFLLElBQUksRUFBRSxNQUFNO0lBQzFCO0lBRUE7Ozs7Ozs7Ozs7O0dBV0MsR0FDRCxXQUFXLE9BQXNDLEVBQXlCO1FBQ3hFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUU7WUFDZCxPQUFPLElBQUksQ0FBQyxTQUFTLFVBQVU7WUFDL0IsTUFBTSxNQUFNLElBQUksQ0FBQyxDQUFDLEdBQUcsR0FBRyxJQUFJLDRCQUE0QjtZQUN4RCxJQUFJLENBQUMsSUFBSSxpQkFBaUIsU0FBUyxJQUFNLElBQUk7WUFDN0MsTUFBTSxDQUFDLFVBQVUsRUFBRSxRQUFPLEVBQUUsQ0FBQyxHQUFHLElBQUksZUFBZTtnQkFDakQsU0FBUyxJQUFJLENBQUMsU0FBUztZQUN6QjtZQUNBLElBQUksQ0FBQyxTQUFTLE9BQU87WUFDckIsSUFBSSxtQkFBbUIsU0FBUztnQkFDOUIsSUFBSSxDQUFDLFNBQVMsVUFBVTtZQUMxQjtRQUNGO1FBQ0EsT0FBTyxJQUFJLENBQUMsQ0FBQyxHQUFHO0lBQ2xCO0lBRUE7Ozs7R0FJQyxHQUNELE1BQ0UsV0FBd0IsRUFDeEIsT0FBZ0IsRUFDaEIsS0FBK0IsRUFDeEI7UUFDUCxNQUFNLE1BQU0sZ0JBQWdCLGFBQWE7UUFDekMsSUFBSSxPQUFPO1lBQ1QsT0FBTyxPQUFPLEtBQUs7UUFDckI7UUFDQSxNQUFNO0lBQ1I7SUFFQTs7eUVBRXVFLEdBQ3ZFLFFBQVEsT0FBaUMsRUFBYTtRQUNwRCxJQUFJLElBQUksQ0FBQyxDQUFDLE1BQU0sRUFBRTtZQUNoQixPQUFPLElBQUksQ0FBQyxDQUFDLE1BQU07UUFDckI7UUFDQSxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsZ0JBQWdCLFNBQVM7WUFDekMsTUFBTSxJQUFJLFVBQ1I7UUFFSjtRQUNBLElBQUksQ0FBQyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxnQkFBZ0IsUUFBUTtRQUNwRCxJQUFJLENBQUMsSUFBSSxpQkFBaUIsU0FBUyxJQUFNLElBQUksQ0FBQyxDQUFDLE1BQU0sRUFBRTtRQUN2RCxJQUFJLENBQUMsVUFBVTtRQUNmLE9BQU8sSUFBSSxDQUFDLENBQUMsTUFBTTtJQUNyQjtJQUVBLENBQUMsT0FBTyxJQUFJLHNCQUFzQixDQUFDLE9BQW1DLEVBQUU7UUFDdEUsTUFBTSxFQUNKLElBQUcsRUFDSCxRQUFPLEVBQ1AsYUFBWSxFQUNaLFFBQU8sRUFDUCxRQUFPLEVBQ1AsU0FBUSxFQUNSLE9BQU0sRUFDTixNQUFLLEVBQ04sR0FBRyxJQUFJO1FBQ1IsT0FBTyxDQUFDLEVBQUUsSUFBSSxDQUFDLFlBQVksS0FBSyxDQUFDLEVBQy9CLFFBQVE7WUFDTjtZQUNBO1lBQ0E7WUFDQTtZQUNBO1lBQ0E7WUFDQTtZQUNBO1FBQ0YsR0FDRCxDQUFDO0lBQ0o7SUFFQSxDQUFDLE9BQU8sSUFBSSw4QkFBOEIsQ0FDeEMsS0FBYSxFQUNiLG1DQUFtQztJQUNuQyxPQUFZLEVBQ1osT0FBc0QsRUFDdEQ7UUFDQSxJQUFJLFFBQVEsR0FBRztZQUNiLE9BQU8sUUFBUSxRQUFRLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxZQUFZLEtBQUssQ0FBQyxDQUFDLEVBQUU7UUFDdkQ7UUFFQSxNQUFNLGFBQWEsT0FBTyxPQUFPLENBQUMsR0FBRyxTQUFTO1lBQzVDLE9BQU8sUUFBUSxVQUFVLE9BQU8sT0FBTyxRQUFRLFFBQVE7UUFDekQ7UUFDQSxNQUFNLEVBQ0osSUFBRyxFQUNILFFBQU8sRUFDUCxhQUFZLEVBQ1osUUFBTyxFQUNQLFFBQU8sRUFDUCxTQUFRLEVBQ1IsT0FBTSxFQUNOLE1BQUssRUFDTixHQUFHLElBQUk7UUFDUixPQUFPLENBQUMsRUFBRSxRQUFRLFFBQVEsSUFBSSxDQUFDLFlBQVksTUFBTSxXQUFXLENBQUMsRUFDM0QsUUFBUTtZQUNOO1lBQ0E7WUFDQTtZQUNBO1lBQ0E7WUFDQTtZQUNBO1lBQ0E7UUFDRixHQUFHLFlBQ0osQ0FBQztJQUNKO0FBQ0YifQ==