// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Provides {@linkcode ServerSentEvent} and
 * {@linkcode ServerSentEventStreamTarget} which provides an interface to send
 * server sent events to a browser using the DOM event model.
 *
 * The {@linkcode ServerSentEventStreamTarget} provides the `.asResponse()` or
 * `.asResponseInit()` to provide a body and headers to the client to establish
 * the event connection. This is accomplished by keeping a connection open to
 * the client by not closing the body, which allows events to be sent down the
 * connection and processed by the client browser.
 *
 * See more about Server-sent events on [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)
 *
 * ## Example
 *
 * ```ts
 * import {
 *   ServerSentEvent,
 *   ServerSentEventStreamTarget,
 * } from "https://deno.land/std@$STD_VERSION/http/server_sent_event.ts";
 * import { serve } from "https://deno.land/std@$STD_VERSION/http/server.ts";
 *
 * await serve((request) => {
 *   const target = new ServerSentEventStreamTarget();
 *   let counter = 0;
 *
 *   // Sends an event every 2 seconds, incrementing the ID
 *   const id = setInterval(() => {
 *     const evt = new ServerSentEvent(
 *       "message",
 *       { data: { hello: "world" }, id: counter++ },
 *     );
 *     target.dispatchEvent(evt);
 *   }, 2000);
 *
 *   target.addEventListener("close", () => clearInterval(id));
 *   return target.asResponse();
 * }, { port: 8000 });
 * ```
 *
 * @module
 */ import { assert } from "../_util/asserts.ts";
const encoder = new TextEncoder();
const DEFAULT_KEEP_ALIVE_INTERVAL = 30_000;
class CloseEvent extends Event {
    constructor(eventInit){
        super("close", eventInit);
    }
}
/** An event which contains information which will be sent to the remote
 * connection and be made available in an `EventSource` as an event. A server
 * creates new events and dispatches them on the target which will then be
 * sent to a client.
 *
 * See more about Server-sent events on [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)
 *
 * ### Example
 *
 * ```ts
 * import {
 *   ServerSentEvent,
 *   ServerSentEventStreamTarget,
 * } from "https://deno.land/std@$STD_VERSION/http/server_sent_event.ts";
 * import { serve } from "https://deno.land/std@$STD_VERSION/http/server.ts";
 *
 * await serve((request) => {
 *   const target = new ServerSentEventStreamTarget();
 *   const evt = new ServerSentEvent("message", {
 *     data: { hello: "world" },
 *     id: 1
 *   });
 *   target.dispatchEvent(evt);
 *   return target.asResponse();
 * }, { port: 8000 });
 * ```
 */ export class ServerSentEvent extends Event {
    #data;
    #id;
    #type;
    /**
   * @param type the event type that will be available on the client. The type
   *             of `"message"` will be handled specifically as a message
   *             server-side event.
   * @param eventInit initialization options for the event
   */ constructor(type, eventInit = {}){
        super(type, eventInit);
        const { data , replacer , space  } = eventInit;
        this.#type = type;
        try {
            this.#data = typeof data === "string" ? data : data !== undefined ? JSON.stringify(data, replacer, space) : "";
        } catch (e) {
            assert(e instanceof Error);
            throw new TypeError(`data could not be coerced into a serialized string.\n  ${e.message}`);
        }
        const { id  } = eventInit;
        this.#id = id;
    }
    /** The data associated with the event, which will be sent to the client and
   * be made available in the `EventSource`. */ get data() {
        return this.#data;
    }
    /** The optional ID associated with the event that will be sent to the client
   * and be made available in the `EventSource`. */ get id() {
        return this.#id;
    }
    toString() {
        const data = `data: ${this.#data.split("\n").join("\ndata: ")}\n`;
        return `${this.#type === "__message" ? "" : `event: ${this.#type}\n`}${this.#id ? `id: ${String(this.#id)}\n` : ""}${data}\n`;
    }
}
const RESPONSE_HEADERS = [
    [
        "Connection",
        "Keep-Alive"
    ],
    [
        "Content-Type",
        "text/event-stream"
    ],
    [
        "Cache-Control",
        "no-cache"
    ],
    [
        "Keep-Alive",
        `timeout=${Number.MAX_SAFE_INTEGER}`
    ]
];
/** An implementation of {@linkcode ServerSentEventTarget} that provides a
 * readable stream as a body of a response to establish a connection to a
 * client. */ export class ServerSentEventStreamTarget extends EventTarget {
    #bodyInit;
    #closed = false;
    #controller;
    // we are ignoring any here, because when exporting to npm/Node.js, the timer
    // handle isn't a number.
    // deno-lint-ignore no-explicit-any
    #keepAliveId;
    // deno-lint-ignore no-explicit-any
    #error(error) {
        this.dispatchEvent(new CloseEvent({
            cancelable: false
        }));
        const errorEvent = new ErrorEvent("error", {
            error
        });
        this.dispatchEvent(errorEvent);
    }
    #push(payload) {
        if (!this.#controller) {
            this.#error(new Error("The controller has not been set."));
            return;
        }
        if (this.#closed) {
            return;
        }
        this.#controller.enqueue(encoder.encode(payload));
    }
    get closed() {
        return this.#closed;
    }
    constructor({ keepAlive =false  } = {}){
        super();
        this.#bodyInit = new ReadableStream({
            start: (controller)=>{
                this.#controller = controller;
            },
            cancel: (error)=>{
                // connections closing are considered "normal" for SSE events and just
                // mean the far side has closed.
                if (error instanceof Error && error.message.includes("connection closed")) {
                    this.close();
                } else {
                    this.#error(error);
                }
            }
        });
        this.addEventListener("close", ()=>{
            this.#closed = true;
            if (this.#keepAliveId != null) {
                clearInterval(this.#keepAliveId);
                this.#keepAliveId = undefined;
            }
            if (this.#controller) {
                try {
                    this.#controller.close();
                } catch  {
                // we ignore any errors here, as it is likely that the controller
                // is already closed
                }
            }
        });
        if (keepAlive) {
            const interval = typeof keepAlive === "number" ? keepAlive : DEFAULT_KEEP_ALIVE_INTERVAL;
            this.#keepAliveId = setInterval(()=>{
                this.dispatchComment("keep-alive comment");
            }, interval);
        }
    }
    /** Returns a {@linkcode Response} which contains the body and headers needed
   * to initiate a SSE connection with the client. */ asResponse(responseInit) {
        return new Response(...this.asResponseInit(responseInit));
    }
    /** Returns a tuple which contains the {@linkcode BodyInit} and
   * {@linkcode ResponseInit} needed to create a response that will establish
   * a SSE connection with the client. */ asResponseInit(responseInit = {}) {
        const headers = new Headers(responseInit.headers);
        for (const [key, value] of RESPONSE_HEADERS){
            headers.set(key, value);
        }
        responseInit.headers = headers;
        return [
            this.#bodyInit,
            responseInit
        ];
    }
    close() {
        this.dispatchEvent(new CloseEvent({
            cancelable: false
        }));
        return Promise.resolve();
    }
    dispatchComment(comment) {
        this.#push(`: ${comment.split("\n").join("\n: ")}\n\n`);
        return true;
    }
    // deno-lint-ignore no-explicit-any
    dispatchMessage(data) {
        const event = new ServerSentEvent("__message", {
            data
        });
        return this.dispatchEvent(event);
    }
    dispatchEvent(event) {
        const dispatched = super.dispatchEvent(event);
        if (dispatched && event instanceof ServerSentEvent) {
            this.#push(String(event));
        }
        return dispatched;
    }
    [Symbol.for("Deno.customInspect")](inspect) {
        return `${this.constructor.name} ${inspect({
            "#bodyInit": this.#bodyInit,
            "#closed": this.#closed
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
        return `${options.stylize(this.constructor.name, "special")} ${inspect({
            "#bodyInit": this.#bodyInit,
            "#closed": this.#closed
        }, newOptions)}`;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5My4wL2h0dHAvc2VydmVyX3NlbnRfZXZlbnQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMyB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuLyoqXG4gKiBQcm92aWRlcyB7QGxpbmtjb2RlIFNlcnZlclNlbnRFdmVudH0gYW5kXG4gKiB7QGxpbmtjb2RlIFNlcnZlclNlbnRFdmVudFN0cmVhbVRhcmdldH0gd2hpY2ggcHJvdmlkZXMgYW4gaW50ZXJmYWNlIHRvIHNlbmRcbiAqIHNlcnZlciBzZW50IGV2ZW50cyB0byBhIGJyb3dzZXIgdXNpbmcgdGhlIERPTSBldmVudCBtb2RlbC5cbiAqXG4gKiBUaGUge0BsaW5rY29kZSBTZXJ2ZXJTZW50RXZlbnRTdHJlYW1UYXJnZXR9IHByb3ZpZGVzIHRoZSBgLmFzUmVzcG9uc2UoKWAgb3JcbiAqIGAuYXNSZXNwb25zZUluaXQoKWAgdG8gcHJvdmlkZSBhIGJvZHkgYW5kIGhlYWRlcnMgdG8gdGhlIGNsaWVudCB0byBlc3RhYmxpc2hcbiAqIHRoZSBldmVudCBjb25uZWN0aW9uLiBUaGlzIGlzIGFjY29tcGxpc2hlZCBieSBrZWVwaW5nIGEgY29ubmVjdGlvbiBvcGVuIHRvXG4gKiB0aGUgY2xpZW50IGJ5IG5vdCBjbG9zaW5nIHRoZSBib2R5LCB3aGljaCBhbGxvd3MgZXZlbnRzIHRvIGJlIHNlbnQgZG93biB0aGVcbiAqIGNvbm5lY3Rpb24gYW5kIHByb2Nlc3NlZCBieSB0aGUgY2xpZW50IGJyb3dzZXIuXG4gKlxuICogU2VlIG1vcmUgYWJvdXQgU2VydmVyLXNlbnQgZXZlbnRzIG9uIFtNRE5dKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9TZXJ2ZXItc2VudF9ldmVudHMvVXNpbmdfc2VydmVyLXNlbnRfZXZlbnRzKVxuICpcbiAqICMjIEV4YW1wbGVcbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHtcbiAqICAgU2VydmVyU2VudEV2ZW50LFxuICogICBTZXJ2ZXJTZW50RXZlbnRTdHJlYW1UYXJnZXQsXG4gKiB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2h0dHAvc2VydmVyX3NlbnRfZXZlbnQudHNcIjtcbiAqIGltcG9ydCB7IHNlcnZlIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vaHR0cC9zZXJ2ZXIudHNcIjtcbiAqXG4gKiBhd2FpdCBzZXJ2ZSgocmVxdWVzdCkgPT4ge1xuICogICBjb25zdCB0YXJnZXQgPSBuZXcgU2VydmVyU2VudEV2ZW50U3RyZWFtVGFyZ2V0KCk7XG4gKiAgIGxldCBjb3VudGVyID0gMDtcbiAqXG4gKiAgIC8vIFNlbmRzIGFuIGV2ZW50IGV2ZXJ5IDIgc2Vjb25kcywgaW5jcmVtZW50aW5nIHRoZSBJRFxuICogICBjb25zdCBpZCA9IHNldEludGVydmFsKCgpID0+IHtcbiAqICAgICBjb25zdCBldnQgPSBuZXcgU2VydmVyU2VudEV2ZW50KFxuICogICAgICAgXCJtZXNzYWdlXCIsXG4gKiAgICAgICB7IGRhdGE6IHsgaGVsbG86IFwid29ybGRcIiB9LCBpZDogY291bnRlcisrIH0sXG4gKiAgICAgKTtcbiAqICAgICB0YXJnZXQuZGlzcGF0Y2hFdmVudChldnQpO1xuICogICB9LCAyMDAwKTtcbiAqXG4gKiAgIHRhcmdldC5hZGRFdmVudExpc3RlbmVyKFwiY2xvc2VcIiwgKCkgPT4gY2xlYXJJbnRlcnZhbChpZCkpO1xuICogICByZXR1cm4gdGFyZ2V0LmFzUmVzcG9uc2UoKTtcbiAqIH0sIHsgcG9ydDogODAwMCB9KTtcbiAqIGBgYFxuICpcbiAqIEBtb2R1bGVcbiAqL1xuXG5pbXBvcnQgeyBhc3NlcnQgfSBmcm9tIFwiLi4vX3V0aWwvYXNzZXJ0cy50c1wiO1xuXG5jb25zdCBlbmNvZGVyID0gbmV3IFRleHRFbmNvZGVyKCk7XG5cbmNvbnN0IERFRkFVTFRfS0VFUF9BTElWRV9JTlRFUlZBTCA9IDMwXzAwMDtcblxuZXhwb3J0IGludGVyZmFjZSBTZXJ2ZXJTZW50RXZlbnRJbml0IGV4dGVuZHMgRXZlbnRJbml0IHtcbiAgLyoqIE9wdGlvbmFsIGFyYml0cmFyeSBkYXRhIHRvIHNlbmQgdG8gdGhlIGNsaWVudCwgZGF0YSB0aGlzIGlzIGEgc3RyaW5nIHdpbGxcbiAgICogYmUgc2VudCB1bm1vZGlmaWVkLCBvdGhlcndpc2UgYEpTT04ucGFyc2UoKWAgd2lsbCBiZSB1c2VkIHRvIHNlcmlhbGl6ZSB0aGVcbiAgICogdmFsdWUuICovXG4gIGRhdGE/OiB1bmtub3duO1xuXG4gIC8qKiBBbiBvcHRpb25hbCBgaWRgIHdoaWNoIHdpbGwgYmUgc2VudCB3aXRoIHRoZSBldmVudCBhbmQgZXhwb3NlZCBpbiB0aGVcbiAgICogY2xpZW50IGBFdmVudFNvdXJjZWAuICovXG4gIGlkPzogbnVtYmVyO1xuXG4gIC8qKiBUaGUgcmVwbGFjZXIgaXMgcGFzc2VkIHRvIGBKU09OLnN0cmluZ2lmeWAgd2hlbiBjb252ZXJ0aW5nIHRoZSBgZGF0YWBcbiAgICogcHJvcGVydHkgdG8gYSBKU09OIHN0cmluZy4gKi9cbiAgcmVwbGFjZXI/OlxuICAgIHwgKHN0cmluZyB8IG51bWJlcilbXVxuICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gICAgfCAoKHRoaXM6IGFueSwga2V5OiBzdHJpbmcsIHZhbHVlOiBhbnkpID0+IGFueSk7XG5cbiAgLyoqIFNwYWNlIGlzIHBhc3NlZCB0byBgSlNPTi5zdHJpbmdpZnlgIHdoZW4gY29udmVydGluZyB0aGUgYGRhdGFgIHByb3BlcnR5XG4gICAqIHRvIGEgSlNPTiBzdHJpbmcuICovXG4gIHNwYWNlPzogc3RyaW5nIHwgbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNlcnZlclNlbnRFdmVudFRhcmdldE9wdGlvbnMge1xuICAvKiogS2VlcCBjbGllbnQgY29ubmVjdGlvbnMgYWxpdmUgYnkgc2VuZGluZyBhIGNvbW1lbnQgZXZlbnQgdG8gdGhlIGNsaWVudFxuICAgKiBhdCBhIHNwZWNpZmllZCBpbnRlcnZhbC4gIElmIGB0cnVlYCwgdGhlbiBpdCBwb2xscyBldmVyeSAzMDAwMCBtaWxsaXNlY29uZHNcbiAgICogKDMwIHNlY29uZHMpLiBJZiBzZXQgdG8gYSBudW1iZXIsIHRoZW4gaXQgcG9sbHMgdGhhdCBudW1iZXIgb2ZcbiAgICogbWlsbGlzZWNvbmRzLiAgVGhlIGZlYXR1cmUgaXMgZGlzYWJsZWQgaWYgc2V0IHRvIGBmYWxzZWAuICBJdCBkZWZhdWx0cyB0b1xuICAgKiBgZmFsc2VgLiAqL1xuICBrZWVwQWxpdmU/OiBib29sZWFuIHwgbnVtYmVyO1xufVxuXG5jbGFzcyBDbG9zZUV2ZW50IGV4dGVuZHMgRXZlbnQge1xuICBjb25zdHJ1Y3RvcihldmVudEluaXQ6IEV2ZW50SW5pdCkge1xuICAgIHN1cGVyKFwiY2xvc2VcIiwgZXZlbnRJbml0KTtcbiAgfVxufVxuXG4vKiogQW4gZXZlbnQgd2hpY2ggY29udGFpbnMgaW5mb3JtYXRpb24gd2hpY2ggd2lsbCBiZSBzZW50IHRvIHRoZSByZW1vdGVcbiAqIGNvbm5lY3Rpb24gYW5kIGJlIG1hZGUgYXZhaWxhYmxlIGluIGFuIGBFdmVudFNvdXJjZWAgYXMgYW4gZXZlbnQuIEEgc2VydmVyXG4gKiBjcmVhdGVzIG5ldyBldmVudHMgYW5kIGRpc3BhdGNoZXMgdGhlbSBvbiB0aGUgdGFyZ2V0IHdoaWNoIHdpbGwgdGhlbiBiZVxuICogc2VudCB0byBhIGNsaWVudC5cbiAqXG4gKiBTZWUgbW9yZSBhYm91dCBTZXJ2ZXItc2VudCBldmVudHMgb24gW01ETl0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1NlcnZlci1zZW50X2V2ZW50cy9Vc2luZ19zZXJ2ZXItc2VudF9ldmVudHMpXG4gKlxuICogIyMjIEV4YW1wbGVcbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHtcbiAqICAgU2VydmVyU2VudEV2ZW50LFxuICogICBTZXJ2ZXJTZW50RXZlbnRTdHJlYW1UYXJnZXQsXG4gKiB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2h0dHAvc2VydmVyX3NlbnRfZXZlbnQudHNcIjtcbiAqIGltcG9ydCB7IHNlcnZlIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vaHR0cC9zZXJ2ZXIudHNcIjtcbiAqXG4gKiBhd2FpdCBzZXJ2ZSgocmVxdWVzdCkgPT4ge1xuICogICBjb25zdCB0YXJnZXQgPSBuZXcgU2VydmVyU2VudEV2ZW50U3RyZWFtVGFyZ2V0KCk7XG4gKiAgIGNvbnN0IGV2dCA9IG5ldyBTZXJ2ZXJTZW50RXZlbnQoXCJtZXNzYWdlXCIsIHtcbiAqICAgICBkYXRhOiB7IGhlbGxvOiBcIndvcmxkXCIgfSxcbiAqICAgICBpZDogMVxuICogICB9KTtcbiAqICAgdGFyZ2V0LmRpc3BhdGNoRXZlbnQoZXZ0KTtcbiAqICAgcmV0dXJuIHRhcmdldC5hc1Jlc3BvbnNlKCk7XG4gKiB9LCB7IHBvcnQ6IDgwMDAgfSk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNsYXNzIFNlcnZlclNlbnRFdmVudCBleHRlbmRzIEV2ZW50IHtcbiAgI2RhdGE6IHN0cmluZztcbiAgI2lkPzogbnVtYmVyO1xuICAjdHlwZTogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBAcGFyYW0gdHlwZSB0aGUgZXZlbnQgdHlwZSB0aGF0IHdpbGwgYmUgYXZhaWxhYmxlIG9uIHRoZSBjbGllbnQuIFRoZSB0eXBlXG4gICAqICAgICAgICAgICAgIG9mIGBcIm1lc3NhZ2VcImAgd2lsbCBiZSBoYW5kbGVkIHNwZWNpZmljYWxseSBhcyBhIG1lc3NhZ2VcbiAgICogICAgICAgICAgICAgc2VydmVyLXNpZGUgZXZlbnQuXG4gICAqIEBwYXJhbSBldmVudEluaXQgaW5pdGlhbGl6YXRpb24gb3B0aW9ucyBmb3IgdGhlIGV2ZW50XG4gICAqL1xuICBjb25zdHJ1Y3Rvcih0eXBlOiBzdHJpbmcsIGV2ZW50SW5pdDogU2VydmVyU2VudEV2ZW50SW5pdCA9IHt9KSB7XG4gICAgc3VwZXIodHlwZSwgZXZlbnRJbml0KTtcbiAgICBjb25zdCB7IGRhdGEsIHJlcGxhY2VyLCBzcGFjZSB9ID0gZXZlbnRJbml0O1xuICAgIHRoaXMuI3R5cGUgPSB0eXBlO1xuICAgIHRyeSB7XG4gICAgICB0aGlzLiNkYXRhID0gdHlwZW9mIGRhdGEgPT09IFwic3RyaW5nXCJcbiAgICAgICAgPyBkYXRhXG4gICAgICAgIDogZGF0YSAhPT0gdW5kZWZpbmVkXG4gICAgICAgID8gSlNPTi5zdHJpbmdpZnkoZGF0YSwgcmVwbGFjZXIgYXMgKHN0cmluZyB8IG51bWJlcilbXSwgc3BhY2UpXG4gICAgICAgIDogXCJcIjtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBhc3NlcnQoZSBpbnN0YW5jZW9mIEVycm9yKTtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgIGBkYXRhIGNvdWxkIG5vdCBiZSBjb2VyY2VkIGludG8gYSBzZXJpYWxpemVkIHN0cmluZy5cXG4gICR7ZS5tZXNzYWdlfWAsXG4gICAgICApO1xuICAgIH1cbiAgICBjb25zdCB7IGlkIH0gPSBldmVudEluaXQ7XG4gICAgdGhpcy4jaWQgPSBpZDtcbiAgfVxuXG4gIC8qKiBUaGUgZGF0YSBhc3NvY2lhdGVkIHdpdGggdGhlIGV2ZW50LCB3aGljaCB3aWxsIGJlIHNlbnQgdG8gdGhlIGNsaWVudCBhbmRcbiAgICogYmUgbWFkZSBhdmFpbGFibGUgaW4gdGhlIGBFdmVudFNvdXJjZWAuICovXG4gIGdldCBkYXRhKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuI2RhdGE7XG4gIH1cblxuICAvKiogVGhlIG9wdGlvbmFsIElEIGFzc29jaWF0ZWQgd2l0aCB0aGUgZXZlbnQgdGhhdCB3aWxsIGJlIHNlbnQgdG8gdGhlIGNsaWVudFxuICAgKiBhbmQgYmUgbWFkZSBhdmFpbGFibGUgaW4gdGhlIGBFdmVudFNvdXJjZWAuICovXG4gIGdldCBpZCgpOiBudW1iZXIgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLiNpZDtcbiAgfVxuXG4gIG92ZXJyaWRlIHRvU3RyaW5nKCk6IHN0cmluZyB7XG4gICAgY29uc3QgZGF0YSA9IGBkYXRhOiAke3RoaXMuI2RhdGEuc3BsaXQoXCJcXG5cIikuam9pbihcIlxcbmRhdGE6IFwiKX1cXG5gO1xuICAgIHJldHVybiBgJHt0aGlzLiN0eXBlID09PSBcIl9fbWVzc2FnZVwiID8gXCJcIiA6IGBldmVudDogJHt0aGlzLiN0eXBlfVxcbmB9JHtcbiAgICAgIHRoaXMuI2lkID8gYGlkOiAke1N0cmluZyh0aGlzLiNpZCl9XFxuYCA6IFwiXCJcbiAgICB9JHtkYXRhfVxcbmA7XG4gIH1cbn1cblxuY29uc3QgUkVTUE9OU0VfSEVBREVSUyA9IFtcbiAgW1wiQ29ubmVjdGlvblwiLCBcIktlZXAtQWxpdmVcIl0sXG4gIFtcIkNvbnRlbnQtVHlwZVwiLCBcInRleHQvZXZlbnQtc3RyZWFtXCJdLFxuICBbXCJDYWNoZS1Db250cm9sXCIsIFwibm8tY2FjaGVcIl0sXG4gIFtcIktlZXAtQWxpdmVcIiwgYHRpbWVvdXQ9JHtOdW1iZXIuTUFYX1NBRkVfSU5URUdFUn1gXSxcbl0gYXMgY29uc3Q7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2VydmVyU2VudEV2ZW50VGFyZ2V0IGV4dGVuZHMgRXZlbnRUYXJnZXQge1xuICAvKiogSXMgc2V0IHRvIGB0cnVlYCBpZiBldmVudHMgY2Fubm90IGJlIHNlbnQgdG8gdGhlIHJlbW90ZSBjb25uZWN0aW9uLlxuICAgKiBPdGhlcndpc2UgaXQgaXMgc2V0IHRvIGBmYWxzZWAuXG4gICAqXG4gICAqICpOb3RlKjogVGhpcyBmbGFnIGlzIGxhemlseSBzZXQsIGFuZCBtaWdodCBub3QgcmVmbGVjdCBhIGNsb3NlZCBzdGF0ZSB1bnRpbFxuICAgKiBhbm90aGVyIGV2ZW50LCBjb21tZW50IG9yIG1lc3NhZ2UgaXMgYXR0ZW1wdGVkIHRvIGJlIHByb2Nlc3NlZC4gKi9cbiAgcmVhZG9ubHkgY2xvc2VkOiBib29sZWFuO1xuXG4gIC8qKiBDbG9zZSB0aGUgdGFyZ2V0LCByZWZ1c2luZyB0byBhY2NlcHQgYW55IG1vcmUgZXZlbnRzLiAqL1xuICBjbG9zZSgpOiBQcm9taXNlPHZvaWQ+O1xuXG4gIC8qKiBTZW5kIGEgY29tbWVudCB0byB0aGUgcmVtb3RlIGNvbm5lY3Rpb24uICBDb21tZW50cyBhcmUgbm90IGV4cG9zZWQgdG8gdGhlXG4gICAqIGNsaWVudCBgRXZlbnRTb3VyY2VgIGJ1dCBhcmUgdXNlZCBmb3IgZGlhZ25vc3RpY3MgYW5kIGhlbHBpbmcgZW5zdXJlIGFcbiAgICogY29ubmVjdGlvbiBpcyBrZXB0IGFsaXZlLlxuICAgKlxuICAgKiBgYGB0c1xuICAgKiBpbXBvcnQgeyBTZXJ2ZXJTZW50RXZlbnRTdHJlYW1UYXJnZXQgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9odHRwL3NlcnZlcl9zZW50X2V2ZW50LnRzXCI7XG4gICAqIGltcG9ydCB7IHNlcnZlIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vaHR0cC9zZXJ2ZXIudHNcIjtcbiAgICpcbiAgICogYXdhaXQgc2VydmUoKHJlcXVlc3QpID0+IHtcbiAgICogICBjb25zdCB0YXJnZXQgPSBuZXcgU2VydmVyU2VudEV2ZW50U3RyZWFtVGFyZ2V0KCk7XG4gICAqICAgdGFyZ2V0LmRpc3BhdGNoQ29tbWVudChcInRoaXMgaXMgYSBjb21tZW50XCIpO1xuICAgKiAgIHJldHVybiB0YXJnZXQuYXNSZXNwb25zZSgpO1xuICAgKiB9LCB7IHBvcnQ6IDgwMDAgfSk7XG4gICAqIGBgYFxuICAgKi9cbiAgZGlzcGF0Y2hDb21tZW50KGNvbW1lbnQ6IHN0cmluZyk6IGJvb2xlYW47XG5cbiAgLyoqIERpc3BhdGNoIGEgbWVzc2FnZSB0byB0aGUgY2xpZW50LiAgVGhpcyBtZXNzYWdlIHdpbGwgY29udGFpbiBgZGF0YTogYCBvbmx5XG4gICAqIGFuZCBiZSBhdmFpbGFibGUgb24gdGhlIGNsaWVudCBgRXZlbnRTb3VyY2VgIG9uIHRoZSBgb25tZXNzYWdlYCBvciBhbiBldmVudFxuICAgKiBsaXN0ZW5lciBvZiB0eXBlIGBcIm1lc3NhZ2VcImAuICovXG4gIGRpc3BhdGNoTWVzc2FnZShkYXRhOiB1bmtub3duKTogYm9vbGVhbjtcblxuICAvKiogRGlzcGF0Y2ggYSBzZXJ2ZXIgc2VudCBldmVudCB0byB0aGUgY2xpZW50LiAgVGhlIGV2ZW50IGB0eXBlYCB3aWxsIGJlXG4gICAqIHNlbnQgYXMgYGV2ZW50OiBgIHRvIHRoZSBjbGllbnQgd2hpY2ggd2lsbCBiZSByYWlzZWQgYXMgYSBgTWVzc2FnZUV2ZW50YFxuICAgKiBvbiB0aGUgYEV2ZW50U291cmNlYCBpbiB0aGUgY2xpZW50LlxuICAgKlxuICAgKiBBbnkgbG9jYWwgZXZlbnQgaGFuZGxlcnMgd2lsbCBiZSBkaXNwYXRjaGVkIHRvIGZpcnN0LCBhbmQgaWYgdGhlIGV2ZW50XG4gICAqIGlzIGNhbmNlbGxlZCwgaXQgd2lsbCBub3QgYmUgc2VudCB0byB0aGUgY2xpZW50LlxuICAgKlxuICAgKiBgYGB0c1xuICAgKiBpbXBvcnQge1xuICAgKiAgIFNlcnZlclNlbnRFdmVudCxcbiAgICogICBTZXJ2ZXJTZW50RXZlbnRTdHJlYW1UYXJnZXQsXG4gICAqIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vaHR0cC9zZXJ2ZXJfc2VudF9ldmVudC50c1wiO1xuICAgKiBpbXBvcnQgeyBzZXJ2ZSB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2h0dHAvc2VydmVyLnRzXCI7XG4gICAqXG4gICAqIGF3YWl0IHNlcnZlKChyZXF1ZXN0KSA9PiB7XG4gICAqICAgY29uc3QgdGFyZ2V0ID0gbmV3IFNlcnZlclNlbnRFdmVudFN0cmVhbVRhcmdldCgpO1xuICAgKiAgIGNvbnN0IGV2dCA9IG5ldyBTZXJ2ZXJTZW50RXZlbnQoXCJwaW5nXCIsIHsgZGF0YTogXCJoZWxsb1wiIH0pO1xuICAgKiAgIHRhcmdldC5kaXNwYXRjaEV2ZW50KGV2dCk7XG4gICAqICAgcmV0dXJuIHRhcmdldC5hc1Jlc3BvbnNlKCk7XG4gICAqIH0sIHsgcG9ydDogODAwMCB9KTtcbiAgICogYGBgXG4gICAqL1xuICBkaXNwYXRjaEV2ZW50KGV2ZW50OiBTZXJ2ZXJTZW50RXZlbnQpOiBib29sZWFuO1xuXG4gIC8qKiBEaXNwYXRjaCBhIHNlcnZlciBzZW50IGV2ZW50IHRvIHRoZSBjbGllbnQuICBUaGUgZXZlbnQgYHR5cGVgIHdpbGwgYmVcbiAgICogc2VudCBhcyBgZXZlbnQ6IGAgdG8gdGhlIGNsaWVudCB3aGljaCB3aWxsIGJlIHJhaXNlZCBhcyBhIGBNZXNzYWdlRXZlbnRgXG4gICAqIG9uIHRoZSBgRXZlbnRTb3VyY2VgIGluIHRoZSBjbGllbnQuXG4gICAqXG4gICAqIEFueSBsb2NhbCBldmVudCBoYW5kbGVycyB3aWxsIGJlIGRpc3BhdGNoZWQgdG8gZmlyc3QsIGFuZCBpZiB0aGUgZXZlbnRcbiAgICogaXMgY2FuY2VsbGVkLCBpdCB3aWxsIG5vdCBiZSBzZW50IHRvIHRoZSBjbGllbnQuXG4gICAqXG4gICAqIGBgYHRzXG4gICAqIGltcG9ydCB7XG4gICAqICAgU2VydmVyU2VudEV2ZW50LFxuICAgKiAgIFNlcnZlclNlbnRFdmVudFN0cmVhbVRhcmdldCxcbiAgICogfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9odHRwL3NlcnZlcl9zZW50X2V2ZW50LnRzXCI7XG4gICAqIGltcG9ydCB7IHNlcnZlIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vaHR0cC9zZXJ2ZXIudHNcIjtcbiAgICpcbiAgICogYXdhaXQgc2VydmUoKHJlcXVlc3QpID0+IHtcbiAgICogICBjb25zdCB0YXJnZXQgPSBuZXcgU2VydmVyU2VudEV2ZW50U3RyZWFtVGFyZ2V0KCk7XG4gICAqICAgY29uc3QgZXZ0ID0gbmV3IFNlcnZlclNlbnRFdmVudChcInBpbmdcIiwgeyBkYXRhOiBcImhlbGxvXCIgfSk7XG4gICAqICAgdGFyZ2V0LmRpc3BhdGNoRXZlbnQoZXZ0KTtcbiAgICogICByZXR1cm4gdGFyZ2V0LmFzUmVzcG9uc2UoKTtcbiAgICogfSwgeyBwb3J0OiA4MDAwIH0pO1xuICAgKiBgYGBcbiAgICovXG4gIGRpc3BhdGNoRXZlbnQoZXZlbnQ6IENsb3NlRXZlbnQgfCBFcnJvckV2ZW50KTogYm9vbGVhbjtcbn1cblxuLyoqIEFuIGltcGxlbWVudGF0aW9uIG9mIHtAbGlua2NvZGUgU2VydmVyU2VudEV2ZW50VGFyZ2V0fSB0aGF0IHByb3ZpZGVzIGFcbiAqIHJlYWRhYmxlIHN0cmVhbSBhcyBhIGJvZHkgb2YgYSByZXNwb25zZSB0byBlc3RhYmxpc2ggYSBjb25uZWN0aW9uIHRvIGFcbiAqIGNsaWVudC4gKi9cbmV4cG9ydCBjbGFzcyBTZXJ2ZXJTZW50RXZlbnRTdHJlYW1UYXJnZXQgZXh0ZW5kcyBFdmVudFRhcmdldFxuICBpbXBsZW1lbnRzIFNlcnZlclNlbnRFdmVudFRhcmdldCB7XG4gICNib2R5SW5pdDogUmVhZGFibGVTdHJlYW08VWludDhBcnJheT47XG4gICNjbG9zZWQgPSBmYWxzZTtcbiAgI2NvbnRyb2xsZXI/OiBSZWFkYWJsZVN0cmVhbURlZmF1bHRDb250cm9sbGVyPFVpbnQ4QXJyYXk+O1xuICAvLyB3ZSBhcmUgaWdub3JpbmcgYW55IGhlcmUsIGJlY2F1c2Ugd2hlbiBleHBvcnRpbmcgdG8gbnBtL05vZGUuanMsIHRoZSB0aW1lclxuICAvLyBoYW5kbGUgaXNuJ3QgYSBudW1iZXIuXG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gICNrZWVwQWxpdmVJZD86IGFueTtcblxuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAjZXJyb3IoZXJyb3I6IGFueSkge1xuICAgIHRoaXMuZGlzcGF0Y2hFdmVudChuZXcgQ2xvc2VFdmVudCh7IGNhbmNlbGFibGU6IGZhbHNlIH0pKTtcbiAgICBjb25zdCBlcnJvckV2ZW50ID0gbmV3IEVycm9yRXZlbnQoXCJlcnJvclwiLCB7IGVycm9yIH0pO1xuICAgIHRoaXMuZGlzcGF0Y2hFdmVudChlcnJvckV2ZW50KTtcbiAgfVxuXG4gICNwdXNoKHBheWxvYWQ6IHN0cmluZykge1xuICAgIGlmICghdGhpcy4jY29udHJvbGxlcikge1xuICAgICAgdGhpcy4jZXJyb3IobmV3IEVycm9yKFwiVGhlIGNvbnRyb2xsZXIgaGFzIG5vdCBiZWVuIHNldC5cIikpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodGhpcy4jY2xvc2VkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuI2NvbnRyb2xsZXIuZW5xdWV1ZShlbmNvZGVyLmVuY29kZShwYXlsb2FkKSk7XG4gIH1cblxuICBnZXQgY2xvc2VkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLiNjbG9zZWQ7XG4gIH1cblxuICBjb25zdHJ1Y3Rvcih7IGtlZXBBbGl2ZSA9IGZhbHNlIH06IFNlcnZlclNlbnRFdmVudFRhcmdldE9wdGlvbnMgPSB7fSkge1xuICAgIHN1cGVyKCk7XG5cbiAgICB0aGlzLiNib2R5SW5pdCA9IG5ldyBSZWFkYWJsZVN0cmVhbTxVaW50OEFycmF5Pih7XG4gICAgICBzdGFydDogKGNvbnRyb2xsZXIpID0+IHtcbiAgICAgICAgdGhpcy4jY29udHJvbGxlciA9IGNvbnRyb2xsZXI7XG4gICAgICB9LFxuICAgICAgY2FuY2VsOiAoZXJyb3IpID0+IHtcbiAgICAgICAgLy8gY29ubmVjdGlvbnMgY2xvc2luZyBhcmUgY29uc2lkZXJlZCBcIm5vcm1hbFwiIGZvciBTU0UgZXZlbnRzIGFuZCBqdXN0XG4gICAgICAgIC8vIG1lYW4gdGhlIGZhciBzaWRlIGhhcyBjbG9zZWQuXG4gICAgICAgIGlmIChcbiAgICAgICAgICBlcnJvciBpbnN0YW5jZW9mIEVycm9yICYmIGVycm9yLm1lc3NhZ2UuaW5jbHVkZXMoXCJjb25uZWN0aW9uIGNsb3NlZFwiKVxuICAgICAgICApIHtcbiAgICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy4jZXJyb3IoZXJyb3IpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKFwiY2xvc2VcIiwgKCkgPT4ge1xuICAgICAgdGhpcy4jY2xvc2VkID0gdHJ1ZTtcbiAgICAgIGlmICh0aGlzLiNrZWVwQWxpdmVJZCAhPSBudWxsKSB7XG4gICAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy4ja2VlcEFsaXZlSWQpO1xuICAgICAgICB0aGlzLiNrZWVwQWxpdmVJZCA9IHVuZGVmaW5lZDtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLiNjb250cm9sbGVyKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgdGhpcy4jY29udHJvbGxlci5jbG9zZSgpO1xuICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAvLyB3ZSBpZ25vcmUgYW55IGVycm9ycyBoZXJlLCBhcyBpdCBpcyBsaWtlbHkgdGhhdCB0aGUgY29udHJvbGxlclxuICAgICAgICAgIC8vIGlzIGFscmVhZHkgY2xvc2VkXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGlmIChrZWVwQWxpdmUpIHtcbiAgICAgIGNvbnN0IGludGVydmFsID0gdHlwZW9mIGtlZXBBbGl2ZSA9PT0gXCJudW1iZXJcIlxuICAgICAgICA/IGtlZXBBbGl2ZVxuICAgICAgICA6IERFRkFVTFRfS0VFUF9BTElWRV9JTlRFUlZBTDtcbiAgICAgIHRoaXMuI2tlZXBBbGl2ZUlkID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgICB0aGlzLmRpc3BhdGNoQ29tbWVudChcImtlZXAtYWxpdmUgY29tbWVudFwiKTtcbiAgICAgIH0sIGludGVydmFsKTtcbiAgICB9XG4gIH1cblxuICAvKiogUmV0dXJucyBhIHtAbGlua2NvZGUgUmVzcG9uc2V9IHdoaWNoIGNvbnRhaW5zIHRoZSBib2R5IGFuZCBoZWFkZXJzIG5lZWRlZFxuICAgKiB0byBpbml0aWF0ZSBhIFNTRSBjb25uZWN0aW9uIHdpdGggdGhlIGNsaWVudC4gKi9cbiAgYXNSZXNwb25zZShyZXNwb25zZUluaXQ/OiBSZXNwb25zZUluaXQpOiBSZXNwb25zZSB7XG4gICAgcmV0dXJuIG5ldyBSZXNwb25zZSguLi50aGlzLmFzUmVzcG9uc2VJbml0KHJlc3BvbnNlSW5pdCkpO1xuICB9XG5cbiAgLyoqIFJldHVybnMgYSB0dXBsZSB3aGljaCBjb250YWlucyB0aGUge0BsaW5rY29kZSBCb2R5SW5pdH0gYW5kXG4gICAqIHtAbGlua2NvZGUgUmVzcG9uc2VJbml0fSBuZWVkZWQgdG8gY3JlYXRlIGEgcmVzcG9uc2UgdGhhdCB3aWxsIGVzdGFibGlzaFxuICAgKiBhIFNTRSBjb25uZWN0aW9uIHdpdGggdGhlIGNsaWVudC4gKi9cbiAgYXNSZXNwb25zZUluaXQocmVzcG9uc2VJbml0OiBSZXNwb25zZUluaXQgPSB7fSk6IFtCb2R5SW5pdCwgUmVzcG9uc2VJbml0XSB7XG4gICAgY29uc3QgaGVhZGVycyA9IG5ldyBIZWFkZXJzKHJlc3BvbnNlSW5pdC5oZWFkZXJzKTtcbiAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBSRVNQT05TRV9IRUFERVJTKSB7XG4gICAgICBoZWFkZXJzLnNldChrZXksIHZhbHVlKTtcbiAgICB9XG4gICAgcmVzcG9uc2VJbml0LmhlYWRlcnMgPSBoZWFkZXJzO1xuICAgIHJldHVybiBbdGhpcy4jYm9keUluaXQsIHJlc3BvbnNlSW5pdF07XG4gIH1cblxuICBjbG9zZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLmRpc3BhdGNoRXZlbnQobmV3IENsb3NlRXZlbnQoeyBjYW5jZWxhYmxlOiBmYWxzZSB9KSk7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICB9XG5cbiAgZGlzcGF0Y2hDb21tZW50KGNvbW1lbnQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHRoaXMuI3B1c2goYDogJHtjb21tZW50LnNwbGl0KFwiXFxuXCIpLmpvaW4oXCJcXG46IFwiKX1cXG5cXG5gKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIGRpc3BhdGNoTWVzc2FnZShkYXRhOiBhbnkpOiBib29sZWFuIHtcbiAgICBjb25zdCBldmVudCA9IG5ldyBTZXJ2ZXJTZW50RXZlbnQoXCJfX21lc3NhZ2VcIiwgeyBkYXRhIH0pO1xuICAgIHJldHVybiB0aGlzLmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xuICB9XG5cbiAgb3ZlcnJpZGUgZGlzcGF0Y2hFdmVudChldmVudDogU2VydmVyU2VudEV2ZW50KTogYm9vbGVhbjtcbiAgb3ZlcnJpZGUgZGlzcGF0Y2hFdmVudChldmVudDogQ2xvc2VFdmVudCB8IEVycm9yRXZlbnQpOiBib29sZWFuO1xuICBvdmVycmlkZSBkaXNwYXRjaEV2ZW50KFxuICAgIGV2ZW50OiBTZXJ2ZXJTZW50RXZlbnQgfCBDbG9zZUV2ZW50IHwgRXJyb3JFdmVudCxcbiAgKTogYm9vbGVhbiB7XG4gICAgY29uc3QgZGlzcGF0Y2hlZCA9IHN1cGVyLmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xuICAgIGlmIChkaXNwYXRjaGVkICYmIGV2ZW50IGluc3RhbmNlb2YgU2VydmVyU2VudEV2ZW50KSB7XG4gICAgICB0aGlzLiNwdXNoKFN0cmluZyhldmVudCkpO1xuICAgIH1cbiAgICByZXR1cm4gZGlzcGF0Y2hlZDtcbiAgfVxuXG4gIFtTeW1ib2wuZm9yKFwiRGVuby5jdXN0b21JbnNwZWN0XCIpXShpbnNwZWN0OiAodmFsdWU6IHVua25vd24pID0+IHN0cmluZykge1xuICAgIHJldHVybiBgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9ICR7XG4gICAgICBpbnNwZWN0KHsgXCIjYm9keUluaXRcIjogdGhpcy4jYm9keUluaXQsIFwiI2Nsb3NlZFwiOiB0aGlzLiNjbG9zZWQgfSlcbiAgICB9YDtcbiAgfVxuXG4gIFtTeW1ib2wuZm9yKFwibm9kZWpzLnV0aWwuaW5zcGVjdC5jdXN0b21cIildKFxuICAgIGRlcHRoOiBudW1iZXIsXG4gICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICBvcHRpb25zOiBhbnksXG4gICAgaW5zcGVjdDogKHZhbHVlOiB1bmtub3duLCBvcHRpb25zPzogdW5rbm93bikgPT4gc3RyaW5nLFxuICApIHtcbiAgICBpZiAoZGVwdGggPCAwKSB7XG4gICAgICByZXR1cm4gb3B0aW9ucy5zdHlsaXplKGBbJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9XWAsIFwic3BlY2lhbFwiKTtcbiAgICB9XG5cbiAgICBjb25zdCBuZXdPcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucywge1xuICAgICAgZGVwdGg6IG9wdGlvbnMuZGVwdGggPT09IG51bGwgPyBudWxsIDogb3B0aW9ucy5kZXB0aCAtIDEsXG4gICAgfSk7XG4gICAgcmV0dXJuIGAke29wdGlvbnMuc3R5bGl6ZSh0aGlzLmNvbnN0cnVjdG9yLm5hbWUsIFwic3BlY2lhbFwiKX0gJHtcbiAgICAgIGluc3BlY3QoXG4gICAgICAgIHsgXCIjYm9keUluaXRcIjogdGhpcy4jYm9keUluaXQsIFwiI2Nsb3NlZFwiOiB0aGlzLiNjbG9zZWQgfSxcbiAgICAgICAgbmV3T3B0aW9ucyxcbiAgICAgIClcbiAgICB9YDtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBeUNDLEdBRUQsU0FBUyxNQUFNLFFBQVEsc0JBQXNCO0FBRTdDLE1BQU0sVUFBVSxJQUFJO0FBRXBCLE1BQU0sOEJBQThCO0FBaUNwQyxNQUFNLG1CQUFtQjtJQUN2QixZQUFZLFNB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