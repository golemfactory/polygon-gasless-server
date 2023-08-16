// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { delay } from "../async/mod.ts";
/** Thrown by Server after it has been closed. */ const ERROR_SERVER_CLOSED = "Server closed";
/** Default port for serving HTTP. */ const HTTP_PORT = 80;
/** Default port for serving HTTPS. */ const HTTPS_PORT = 443;
/** Initial backoff delay of 5ms following a temporary accept failure. */ const INITIAL_ACCEPT_BACKOFF_DELAY = 5;
/** Max backoff delay of 1s following a temporary accept failure. */ const MAX_ACCEPT_BACKOFF_DELAY = 1000;
/** Used to construct an HTTP server. */ export class Server {
    #port;
    #host;
    #handler;
    #closed = false;
    #listeners = new Set();
    #httpConnections = new Set();
    #onError;
    /**
   * Constructs a new HTTP Server instance.
   *
   * ```ts
   * import { Server } from "https://deno.land/std@$STD_VERSION/http/server.ts";
   *
   * const port = 4505;
   * const handler = (request: Request) => {
   *   const body = `Your user-agent is:\n\n${request.headers.get(
   *    "user-agent",
   *   ) ?? "Unknown"}`;
   *
   *   return new Response(body, { status: 200 });
   * };
   *
   * const server = new Server({ port, handler });
   * ```
   *
   * @param serverInit Options for running an HTTP server.
   */ constructor(serverInit){
        this.#port = serverInit.port;
        this.#host = serverInit.hostname;
        this.#handler = serverInit.handler;
        this.#onError = serverInit.onError ?? function(error) {
            console.error(error);
            return new Response("Internal Server Error", {
                status: 500
            });
        };
    }
    /**
   * Accept incoming connections on the given listener, and handle requests on
   * these connections with the given handler.
   *
   * HTTP/2 support is only enabled if the provided Deno.Listener returns TLS
   * connections and was configured with "h2" in the ALPN protocols.
   *
   * Throws a server closed error if called after the server has been closed.
   *
   * Will always close the created listener.
   *
   * ```ts
   * import { Server } from "https://deno.land/std@$STD_VERSION/http/server.ts";
   *
   * const handler = (request: Request) => {
   *   const body = `Your user-agent is:\n\n${request.headers.get(
   *    "user-agent",
   *   ) ?? "Unknown"}`;
   *
   *   return new Response(body, { status: 200 });
   * };
   *
   * const server = new Server({ handler });
   * const listener = Deno.listen({ port: 4505 });
   *
   * console.log("server listening on http://localhost:4505");
   *
   * await server.serve(listener);
   * ```
   *
   * @param listener The listener to accept connections from.
   */ async serve(listener) {
        if (this.#closed) {
            throw new Deno.errors.Http(ERROR_SERVER_CLOSED);
        }
        this.#trackListener(listener);
        try {
            return await this.#accept(listener);
        } finally{
            this.#untrackListener(listener);
            try {
                listener.close();
            } catch  {
            // Listener has already been closed.
            }
        }
    }
    /**
   * Create a listener on the server, accept incoming connections, and handle
   * requests on these connections with the given handler.
   *
   * If the server was constructed without a specified port, 80 is used.
   *
   * If the server was constructed with the hostname omitted from the options, the
   * non-routable meta-address `0.0.0.0` is used.
   *
   * Throws a server closed error if the server has been closed.
   *
   * ```ts
   * import { Server } from "https://deno.land/std@$STD_VERSION/http/server.ts";
   *
   * const port = 4505;
   * const handler = (request: Request) => {
   *   const body = `Your user-agent is:\n\n${request.headers.get(
   *    "user-agent",
   *   ) ?? "Unknown"}`;
   *
   *   return new Response(body, { status: 200 });
   * };
   *
   * const server = new Server({ port, handler });
   *
   * console.log("server listening on http://localhost:4505");
   *
   * await server.listenAndServe();
   * ```
   */ async listenAndServe() {
        if (this.#closed) {
            throw new Deno.errors.Http(ERROR_SERVER_CLOSED);
        }
        const listener = Deno.listen({
            port: this.#port ?? HTTP_PORT,
            hostname: this.#host ?? "0.0.0.0",
            transport: "tcp"
        });
        return await this.serve(listener);
    }
    /**
   * Create a listener on the server, accept incoming connections, upgrade them
   * to TLS, and handle requests on these connections with the given handler.
   *
   * If the server was constructed without a specified port, 443 is used.
   *
   * If the server was constructed with the hostname omitted from the options, the
   * non-routable meta-address `0.0.0.0` is used.
   *
   * Throws a server closed error if the server has been closed.
   *
   * ```ts
   * import { Server } from "https://deno.land/std@$STD_VERSION/http/server.ts";
   *
   * const port = 4505;
   * const handler = (request: Request) => {
   *   const body = `Your user-agent is:\n\n${request.headers.get(
   *    "user-agent",
   *   ) ?? "Unknown"}`;
   *
   *   return new Response(body, { status: 200 });
   * };
   *
   * const server = new Server({ port, handler });
   *
   * const certFile = "/path/to/certFile.crt";
   * const keyFile = "/path/to/keyFile.key";
   *
   * console.log("server listening on https://localhost:4505");
   *
   * await server.listenAndServeTls(certFile, keyFile);
   * ```
   *
   * @param certFile The path to the file containing the TLS certificate.
   * @param keyFile The path to the file containing the TLS private key.
   */ async listenAndServeTls(certFile, keyFile) {
        if (this.#closed) {
            throw new Deno.errors.Http(ERROR_SERVER_CLOSED);
        }
        const listener = Deno.listenTls({
            port: this.#port ?? HTTPS_PORT,
            hostname: this.#host ?? "0.0.0.0",
            certFile,
            keyFile,
            transport: "tcp"
        });
        return await this.serve(listener);
    }
    /**
   * Immediately close the server listeners and associated HTTP connections.
   *
   * Throws a server closed error if called after the server has been closed.
   */ close() {
        if (this.#closed) {
            throw new Deno.errors.Http(ERROR_SERVER_CLOSED);
        }
        this.#closed = true;
        for (const listener of this.#listeners){
            try {
                listener.close();
            } catch  {
            // Listener has already been closed.
            }
        }
        this.#listeners.clear();
        for (const httpConn of this.#httpConnections){
            this.#closeHttpConn(httpConn);
        }
        this.#httpConnections.clear();
    }
    /** Get whether the server is closed. */ get closed() {
        return this.#closed;
    }
    /** Get the list of network addresses the server is listening on. */ get addrs() {
        return Array.from(this.#listeners).map((listener)=>listener.addr);
    }
    /**
   * Responds to an HTTP request.
   *
   * @param requestEvent The HTTP request to respond to.
   * @param httpCon The HTTP connection to yield requests from.
   * @param connInfo Information about the underlying connection.
   */ async #respond(requestEvent, httpConn, connInfo) {
        let response;
        try {
            // Handle the request event, generating a response.
            response = await this.#handler(requestEvent.request, connInfo);
        } catch (error) {
            // Invoke onError handler when request handler throws.
            response = await this.#onError(error);
        }
        try {
            // Send the response.
            await requestEvent.respondWith(response);
        } catch  {
            // respondWith() fails when the connection has already been closed, or there is some
            // other error with responding on this connection that prompts us to
            // close it and open a new connection.
            return this.#closeHttpConn(httpConn);
        }
    }
    /**
   * Serves all HTTP requests on a single connection.
   *
   * @param httpConn The HTTP connection to yield requests from.
   * @param connInfo Information about the underlying connection.
   */ async #serveHttp(httpConn, connInfo) {
        while(!this.#closed){
            let requestEvent;
            try {
                // Yield the new HTTP request on the connection.
                requestEvent = await httpConn.nextRequest();
            } catch  {
                break;
            }
            if (requestEvent === null) {
                break;
            }
            // Respond to the request. Note we do not await this async method to
            // allow the connection to handle multiple requests in the case of h2.
            this.#respond(requestEvent, httpConn, connInfo);
        }
        this.#closeHttpConn(httpConn);
    }
    /**
   * Accepts all connections on a single network listener.
   *
   * @param listener The listener to accept connections from.
   */ async #accept(listener) {
        let acceptBackoffDelay;
        while(!this.#closed){
            let conn;
            try {
                // Wait for a new connection.
                conn = await listener.accept();
            } catch (error) {
                if (// The listener is closed.
                error instanceof Deno.errors.BadResource || // TLS handshake errors.
                error instanceof Deno.errors.InvalidData || error instanceof Deno.errors.UnexpectedEof || error instanceof Deno.errors.ConnectionReset || error instanceof Deno.errors.NotConnected) {
                    // Backoff after transient errors to allow time for the system to
                    // recover, and avoid blocking up the event loop with a continuously
                    // running loop.
                    if (!acceptBackoffDelay) {
                        acceptBackoffDelay = INITIAL_ACCEPT_BACKOFF_DELAY;
                    } else {
                        acceptBackoffDelay *= 2;
                    }
                    if (acceptBackoffDelay >= MAX_ACCEPT_BACKOFF_DELAY) {
                        acceptBackoffDelay = MAX_ACCEPT_BACKOFF_DELAY;
                    }
                    await delay(acceptBackoffDelay);
                    continue;
                }
                throw error;
            }
            acceptBackoffDelay = undefined;
            // "Upgrade" the network connection into an HTTP connection.
            let httpConn;
            try {
                httpConn = Deno.serveHttp(conn);
            } catch  {
                continue;
            }
            // Closing the underlying listener will not close HTTP connections, so we
            // track for closure upon server close.
            this.#trackHttpConnection(httpConn);
            const connInfo = {
                localAddr: conn.localAddr,
                remoteAddr: conn.remoteAddr
            };
            // Serve the requests that arrive on the just-accepted connection. Note
            // we do not await this async method to allow the server to accept new
            // connections.
            this.#serveHttp(httpConn, connInfo);
        }
    }
    /**
   * Untracks and closes an HTTP connection.
   *
   * @param httpConn The HTTP connection to close.
   */ #closeHttpConn(httpConn) {
        this.#untrackHttpConnection(httpConn);
        try {
            httpConn.close();
        } catch  {
        // Connection has already been closed.
        }
    }
    /**
   * Adds the listener to the internal tracking list.
   *
   * @param listener Listener to track.
   */ #trackListener(listener) {
        this.#listeners.add(listener);
    }
    /**
   * Removes the listener from the internal tracking list.
   *
   * @param listener Listener to untrack.
   */ #untrackListener(listener) {
        this.#listeners.delete(listener);
    }
    /**
   * Adds the HTTP connection to the internal tracking list.
   *
   * @param httpConn HTTP connection to track.
   */ #trackHttpConnection(httpConn) {
        this.#httpConnections.add(httpConn);
    }
    /**
   * Removes the HTTP connection from the internal tracking list.
   *
   * @param httpConn HTTP connection to untrack.
   */ #untrackHttpConnection(httpConn) {
        this.#httpConnections.delete(httpConn);
    }
}
/**
 * Constructs a server, accepts incoming connections on the given listener, and
 * handles requests on these connections with the given handler.
 *
 * ```ts
 * import { serveListener } from "https://deno.land/std@$STD_VERSION/http/server.ts";
 *
 * const listener = Deno.listen({ port: 4505 });
 *
 * console.log("server listening on http://localhost:4505");
 *
 * await serveListener(listener, (request) => {
 *   const body = `Your user-agent is:\n\n${request.headers.get(
 *     "user-agent",
 *   ) ?? "Unknown"}`;
 *
 *   return new Response(body, { status: 200 });
 * });
 * ```
 *
 * @param listener The listener to accept connections from.
 * @param handler The handler for individual HTTP requests.
 * @param options Optional serve options.
 */ export async function serveListener(listener, handler, options) {
    const server = new Server({
        handler,
        onError: options?.onError
    });
    if (options?.signal) {
        options.signal.onabort = ()=>server.close();
    }
    return await server.serve(listener);
}
/** Serves HTTP requests with the given handler.
 *
 * You can specify an object with a port and hostname option, which is the address to listen on.
 * The default is port 8000 on hostname "0.0.0.0".
 *
 * The below example serves with the port 8000.
 *
 * ```ts
 * import { serve } from "https://deno.land/std@$STD_VERSION/http/server.ts";
 * serve((_req) => new Response("Hello, world"));
 * ```
 *
 * You can change the listening address by the host and port option. The below example
 * serves with the port 3000.
 *
 * ```ts
 * import { serve } from "https://deno.land/std@$STD_VERSION/http/server.ts";
 * serve((_req) => new Response("Hello, world"), { port: 3000 });
 * console.log("Listening on http://localhost:3000");
 * ```
 *
 * @param handler The handler for individual HTTP requests.
 * @param options The options. See `ServeInit` documentation for details.
 */ export async function serve(handler, options = {}) {
    const server = new Server({
        port: options.port ?? 8000,
        hostname: options.hostname ?? "0.0.0.0",
        handler,
        onError: options.onError
    });
    if (options?.signal) {
        options.signal.onabort = ()=>server.close();
    }
    return await server.listenAndServe();
}
/** Serves HTTPS requests with the given handler.
 *
 * You must specify `keyFile` and `certFile` options.
 *
 * You can specify an object with a port and hostname option, which is the address to listen on.
 * The default is port 8443 on hostname "0.0.0.0".
 *
 * The below example serves with the default port 8443.
 *
 * ```ts
 * import { serveTls } from "https://deno.land/std@$STD_VERSION/http/server.ts";
 * const certFile = "/path/to/certFile.crt";
 * const keyFile = "/path/to/keyFile.key";
 * serveTls((_req) => new Response("Hello, world"), { certFile, keyFile });
 * console.log("Listening on https://localhost:8443");
 * ```
 *
 * @param handler The handler for individual HTTPS requests.
 * @param options The options. See `ServeTlsInit` documentation for details.
 * @returns
 */ export async function serveTls(handler, options) {
    if (!options.keyFile) {
        throw new Error("TLS config is given, but 'keyFile' is missing.");
    }
    if (!options.certFile) {
        throw new Error("TLS config is given, but 'certFile' is missing.");
    }
    const server = new Server({
        port: options.port ?? 8443,
        hostname: options.hostname ?? "0.0.0.0",
        handler,
        onError: options.onError
    });
    if (options?.signal) {
        options.signal.onabort = ()=>server.close();
    }
    return await server.listenAndServeTls(options.certFile, options.keyFile);
}
/**
 * @deprecated Use `serve` instead.
 *
 * Constructs a server, creates a listener on the given address, accepts
 * incoming connections, and handles requests on these connections with the
 * given handler.
 *
 * If the port is omitted from the ListenOptions, 80 is used.
 *
 * If the host is omitted from the ListenOptions, the non-routable meta-address
 * `0.0.0.0` is used.
 *
 * ```ts
 * import { listenAndServe } from "https://deno.land/std@$STD_VERSION/http/server.ts";
 *
 * const port = 4505;
 *
 * console.log("server listening on http://localhost:4505");
 *
 * await listenAndServe({ port }, (request) => {
 *   const body = `Your user-agent is:\n\n${request.headers.get(
 *     "user-agent",
 *   ) ?? "Unknown"}`;
 *
 *   return new Response(body, { status: 200 });
 * });
 * ```
 *
 * @param config The Deno.ListenOptions to specify the hostname and port.
 * @param handler The handler for individual HTTP requests.
 * @param options Optional serve options.
 */ export async function listenAndServe(config, handler, options) {
    const server = new Server({
        ...config,
        handler
    });
    if (options?.signal) {
        options.signal.onabort = ()=>server.close();
    }
    return await server.listenAndServe();
}
/**
 * @deprecated Use `serveTls` instead.
 *
 * Constructs a server, creates a listener on the given address, accepts
 * incoming connections, upgrades them to TLS, and handles requests on these
 * connections with the given handler.
 *
 * If the port is omitted from the ListenOptions, port 443 is used.
 *
 * If the host is omitted from the ListenOptions, the non-routable meta-address
 * `0.0.0.0` is used.
 *
 * ```ts
 * import { listenAndServeTls } from "https://deno.land/std@$STD_VERSION/http/server.ts";
 *
 * const port = 4505;
 * const certFile = "/path/to/certFile.crt";
 * const keyFile = "/path/to/keyFile.key";
 *
 * console.log("server listening on http://localhost:4505");
 *
 * await listenAndServeTls({ port }, certFile, keyFile, (request) => {
 *   const body = `Your user-agent is:\n\n${request.headers.get(
 *     "user-agent",
 *   ) ?? "Unknown"}`;
 *
 *   return new Response(body, { status: 200 });
 * });
 * ```
 *
 * @param config The Deno.ListenOptions to specify the hostname and port.
 * @param certFile The path to the file containing the TLS certificate.
 * @param keyFile The path to the file containing the TLS private key.
 * @param handler The handler for individual HTTP requests.
 * @param options Optional serve options.
 */ export async function listenAndServeTls(config, certFile, keyFile, handler, options) {
    const server = new Server({
        ...config,
        handler
    });
    if (options?.signal) {
        options.signal.onabort = ()=>server.close();
    }
    return await server.listenAndServeTls(certFile, keyFile);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjEzMy4wL2h0dHAvc2VydmVyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjIgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG5pbXBvcnQgeyBkZWxheSB9IGZyb20gXCIuLi9hc3luYy9tb2QudHNcIjtcblxuLyoqIFRocm93biBieSBTZXJ2ZXIgYWZ0ZXIgaXQgaGFzIGJlZW4gY2xvc2VkLiAqL1xuY29uc3QgRVJST1JfU0VSVkVSX0NMT1NFRCA9IFwiU2VydmVyIGNsb3NlZFwiO1xuXG4vKiogRGVmYXVsdCBwb3J0IGZvciBzZXJ2aW5nIEhUVFAuICovXG5jb25zdCBIVFRQX1BPUlQgPSA4MDtcblxuLyoqIERlZmF1bHQgcG9ydCBmb3Igc2VydmluZyBIVFRQUy4gKi9cbmNvbnN0IEhUVFBTX1BPUlQgPSA0NDM7XG5cbi8qKiBJbml0aWFsIGJhY2tvZmYgZGVsYXkgb2YgNW1zIGZvbGxvd2luZyBhIHRlbXBvcmFyeSBhY2NlcHQgZmFpbHVyZS4gKi9cbmNvbnN0IElOSVRJQUxfQUNDRVBUX0JBQ0tPRkZfREVMQVkgPSA1O1xuXG4vKiogTWF4IGJhY2tvZmYgZGVsYXkgb2YgMXMgZm9sbG93aW5nIGEgdGVtcG9yYXJ5IGFjY2VwdCBmYWlsdXJlLiAqL1xuY29uc3QgTUFYX0FDQ0VQVF9CQUNLT0ZGX0RFTEFZID0gMTAwMDtcblxuLyoqIEluZm9ybWF0aW9uIGFib3V0IHRoZSBjb25uZWN0aW9uIGEgcmVxdWVzdCBhcnJpdmVkIG9uLiAqL1xuZXhwb3J0IGludGVyZmFjZSBDb25uSW5mbyB7XG4gIC8qKiBUaGUgbG9jYWwgYWRkcmVzcyBvZiB0aGUgY29ubmVjdGlvbi4gKi9cbiAgcmVhZG9ubHkgbG9jYWxBZGRyOiBEZW5vLkFkZHI7XG4gIC8qKiBUaGUgcmVtb3RlIGFkZHJlc3Mgb2YgdGhlIGNvbm5lY3Rpb24uICovXG4gIHJlYWRvbmx5IHJlbW90ZUFkZHI6IERlbm8uQWRkcjtcbn1cblxuLyoqXG4gKiBBIGhhbmRsZXIgZm9yIEhUVFAgcmVxdWVzdHMuIENvbnN1bWVzIGEgcmVxdWVzdCBhbmQgY29ubmVjdGlvbiBpbmZvcm1hdGlvblxuICogYW5kIHJldHVybnMgYSByZXNwb25zZS5cbiAqXG4gKiBJZiBhIGhhbmRsZXIgdGhyb3dzLCB0aGUgc2VydmVyIGNhbGxpbmcgdGhlIGhhbmRsZXIgd2lsbCBhc3N1bWUgdGhlIGltcGFjdFxuICogb2YgdGhlIGVycm9yIGlzIGlzb2xhdGVkIHRvIHRoZSBpbmRpdmlkdWFsIHJlcXVlc3QuIEl0IHdpbGwgY2F0Y2ggdGhlIGVycm9yXG4gKiBhbmQgY2xvc2UgdGhlIHVuZGVybHlpbmcgY29ubmVjdGlvbi5cbiAqL1xuZXhwb3J0IHR5cGUgSGFuZGxlciA9IChcbiAgcmVxdWVzdDogUmVxdWVzdCxcbiAgY29ubkluZm86IENvbm5JbmZvLFxuKSA9PiBSZXNwb25zZSB8IFByb21pc2U8UmVzcG9uc2U+O1xuXG4vKiogT3B0aW9ucyBmb3IgcnVubmluZyBhbiBIVFRQIHNlcnZlci4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU2VydmVySW5pdCBleHRlbmRzIFBhcnRpYWw8RGVuby5MaXN0ZW5PcHRpb25zPiB7XG4gIC8qKiBUaGUgaGFuZGxlciB0byBpbnZva2UgZm9yIGluZGl2aWR1YWwgSFRUUCByZXF1ZXN0cy4gKi9cbiAgaGFuZGxlcjogSGFuZGxlcjtcblxuICAvKipcbiAgICogVGhlIGhhbmRsZXIgdG8gaW52b2tlIHdoZW4gcm91dGUgaGFuZGxlcnMgdGhyb3cgYW4gZXJyb3IuXG4gICAqXG4gICAqIFRoZSBkZWZhdWx0IGVycm9yIGhhbmRsZXIgbG9ncyBhbmQgcmV0dXJucyB0aGUgZXJyb3IgaW4gSlNPTiBmb3JtYXQuXG4gICAqL1xuICBvbkVycm9yPzogKGVycm9yOiB1bmtub3duKSA9PiBSZXNwb25zZSB8IFByb21pc2U8UmVzcG9uc2U+O1xufVxuXG4vKiogVXNlZCB0byBjb25zdHJ1Y3QgYW4gSFRUUCBzZXJ2ZXIuICovXG5leHBvcnQgY2xhc3MgU2VydmVyIHtcbiAgI3BvcnQ/OiBudW1iZXI7XG4gICNob3N0Pzogc3RyaW5nO1xuICAjaGFuZGxlcjogSGFuZGxlcjtcbiAgI2Nsb3NlZCA9IGZhbHNlO1xuICAjbGlzdGVuZXJzOiBTZXQ8RGVuby5MaXN0ZW5lcj4gPSBuZXcgU2V0KCk7XG4gICNodHRwQ29ubmVjdGlvbnM6IFNldDxEZW5vLkh0dHBDb25uPiA9IG5ldyBTZXQoKTtcbiAgI29uRXJyb3I6IChlcnJvcjogdW5rbm93bikgPT4gUmVzcG9uc2UgfCBQcm9taXNlPFJlc3BvbnNlPjtcblxuICAvKipcbiAgICogQ29uc3RydWN0cyBhIG5ldyBIVFRQIFNlcnZlciBpbnN0YW5jZS5cbiAgICpcbiAgICogYGBgdHNcbiAgICogaW1wb3J0IHsgU2VydmVyIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vaHR0cC9zZXJ2ZXIudHNcIjtcbiAgICpcbiAgICogY29uc3QgcG9ydCA9IDQ1MDU7XG4gICAqIGNvbnN0IGhhbmRsZXIgPSAocmVxdWVzdDogUmVxdWVzdCkgPT4ge1xuICAgKiAgIGNvbnN0IGJvZHkgPSBgWW91ciB1c2VyLWFnZW50IGlzOlxcblxcbiR7cmVxdWVzdC5oZWFkZXJzLmdldChcbiAgICogICAgXCJ1c2VyLWFnZW50XCIsXG4gICAqICAgKSA/PyBcIlVua25vd25cIn1gO1xuICAgKlxuICAgKiAgIHJldHVybiBuZXcgUmVzcG9uc2UoYm9keSwgeyBzdGF0dXM6IDIwMCB9KTtcbiAgICogfTtcbiAgICpcbiAgICogY29uc3Qgc2VydmVyID0gbmV3IFNlcnZlcih7IHBvcnQsIGhhbmRsZXIgfSk7XG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0gc2VydmVySW5pdCBPcHRpb25zIGZvciBydW5uaW5nIGFuIEhUVFAgc2VydmVyLlxuICAgKi9cbiAgY29uc3RydWN0b3Ioc2VydmVySW5pdDogU2VydmVySW5pdCkge1xuICAgIHRoaXMuI3BvcnQgPSBzZXJ2ZXJJbml0LnBvcnQ7XG4gICAgdGhpcy4jaG9zdCA9IHNlcnZlckluaXQuaG9zdG5hbWU7XG4gICAgdGhpcy4jaGFuZGxlciA9IHNlcnZlckluaXQuaGFuZGxlcjtcbiAgICB0aGlzLiNvbkVycm9yID0gc2VydmVySW5pdC5vbkVycm9yID8/XG4gICAgICBmdW5jdGlvbiAoZXJyb3I6IHVua25vd24pIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UoXCJJbnRlcm5hbCBTZXJ2ZXIgRXJyb3JcIiwgeyBzdGF0dXM6IDUwMCB9KTtcbiAgICAgIH07XG4gIH1cblxuICAvKipcbiAgICogQWNjZXB0IGluY29taW5nIGNvbm5lY3Rpb25zIG9uIHRoZSBnaXZlbiBsaXN0ZW5lciwgYW5kIGhhbmRsZSByZXF1ZXN0cyBvblxuICAgKiB0aGVzZSBjb25uZWN0aW9ucyB3aXRoIHRoZSBnaXZlbiBoYW5kbGVyLlxuICAgKlxuICAgKiBIVFRQLzIgc3VwcG9ydCBpcyBvbmx5IGVuYWJsZWQgaWYgdGhlIHByb3ZpZGVkIERlbm8uTGlzdGVuZXIgcmV0dXJucyBUTFNcbiAgICogY29ubmVjdGlvbnMgYW5kIHdhcyBjb25maWd1cmVkIHdpdGggXCJoMlwiIGluIHRoZSBBTFBOIHByb3RvY29scy5cbiAgICpcbiAgICogVGhyb3dzIGEgc2VydmVyIGNsb3NlZCBlcnJvciBpZiBjYWxsZWQgYWZ0ZXIgdGhlIHNlcnZlciBoYXMgYmVlbiBjbG9zZWQuXG4gICAqXG4gICAqIFdpbGwgYWx3YXlzIGNsb3NlIHRoZSBjcmVhdGVkIGxpc3RlbmVyLlxuICAgKlxuICAgKiBgYGB0c1xuICAgKiBpbXBvcnQgeyBTZXJ2ZXIgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9odHRwL3NlcnZlci50c1wiO1xuICAgKlxuICAgKiBjb25zdCBoYW5kbGVyID0gKHJlcXVlc3Q6IFJlcXVlc3QpID0+IHtcbiAgICogICBjb25zdCBib2R5ID0gYFlvdXIgdXNlci1hZ2VudCBpczpcXG5cXG4ke3JlcXVlc3QuaGVhZGVycy5nZXQoXG4gICAqICAgIFwidXNlci1hZ2VudFwiLFxuICAgKiAgICkgPz8gXCJVbmtub3duXCJ9YDtcbiAgICpcbiAgICogICByZXR1cm4gbmV3IFJlc3BvbnNlKGJvZHksIHsgc3RhdHVzOiAyMDAgfSk7XG4gICAqIH07XG4gICAqXG4gICAqIGNvbnN0IHNlcnZlciA9IG5ldyBTZXJ2ZXIoeyBoYW5kbGVyIH0pO1xuICAgKiBjb25zdCBsaXN0ZW5lciA9IERlbm8ubGlzdGVuKHsgcG9ydDogNDUwNSB9KTtcbiAgICpcbiAgICogY29uc29sZS5sb2coXCJzZXJ2ZXIgbGlzdGVuaW5nIG9uIGh0dHA6Ly9sb2NhbGhvc3Q6NDUwNVwiKTtcbiAgICpcbiAgICogYXdhaXQgc2VydmVyLnNlcnZlKGxpc3RlbmVyKTtcbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSBsaXN0ZW5lciBUaGUgbGlzdGVuZXIgdG8gYWNjZXB0IGNvbm5lY3Rpb25zIGZyb20uXG4gICAqL1xuICBhc3luYyBzZXJ2ZShsaXN0ZW5lcjogRGVuby5MaXN0ZW5lcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLiNjbG9zZWQpIHtcbiAgICAgIHRocm93IG5ldyBEZW5vLmVycm9ycy5IdHRwKEVSUk9SX1NFUlZFUl9DTE9TRUQpO1xuICAgIH1cblxuICAgIHRoaXMuI3RyYWNrTGlzdGVuZXIobGlzdGVuZXIpO1xuXG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBhd2FpdCB0aGlzLiNhY2NlcHQobGlzdGVuZXIpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLiN1bnRyYWNrTGlzdGVuZXIobGlzdGVuZXIpO1xuXG4gICAgICB0cnkge1xuICAgICAgICBsaXN0ZW5lci5jbG9zZSgpO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIC8vIExpc3RlbmVyIGhhcyBhbHJlYWR5IGJlZW4gY2xvc2VkLlxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBsaXN0ZW5lciBvbiB0aGUgc2VydmVyLCBhY2NlcHQgaW5jb21pbmcgY29ubmVjdGlvbnMsIGFuZCBoYW5kbGVcbiAgICogcmVxdWVzdHMgb24gdGhlc2UgY29ubmVjdGlvbnMgd2l0aCB0aGUgZ2l2ZW4gaGFuZGxlci5cbiAgICpcbiAgICogSWYgdGhlIHNlcnZlciB3YXMgY29uc3RydWN0ZWQgd2l0aG91dCBhIHNwZWNpZmllZCBwb3J0LCA4MCBpcyB1c2VkLlxuICAgKlxuICAgKiBJZiB0aGUgc2VydmVyIHdhcyBjb25zdHJ1Y3RlZCB3aXRoIHRoZSBob3N0bmFtZSBvbWl0dGVkIGZyb20gdGhlIG9wdGlvbnMsIHRoZVxuICAgKiBub24tcm91dGFibGUgbWV0YS1hZGRyZXNzIGAwLjAuMC4wYCBpcyB1c2VkLlxuICAgKlxuICAgKiBUaHJvd3MgYSBzZXJ2ZXIgY2xvc2VkIGVycm9yIGlmIHRoZSBzZXJ2ZXIgaGFzIGJlZW4gY2xvc2VkLlxuICAgKlxuICAgKiBgYGB0c1xuICAgKiBpbXBvcnQgeyBTZXJ2ZXIgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9odHRwL3NlcnZlci50c1wiO1xuICAgKlxuICAgKiBjb25zdCBwb3J0ID0gNDUwNTtcbiAgICogY29uc3QgaGFuZGxlciA9IChyZXF1ZXN0OiBSZXF1ZXN0KSA9PiB7XG4gICAqICAgY29uc3QgYm9keSA9IGBZb3VyIHVzZXItYWdlbnQgaXM6XFxuXFxuJHtyZXF1ZXN0LmhlYWRlcnMuZ2V0KFxuICAgKiAgICBcInVzZXItYWdlbnRcIixcbiAgICogICApID8/IFwiVW5rbm93blwifWA7XG4gICAqXG4gICAqICAgcmV0dXJuIG5ldyBSZXNwb25zZShib2R5LCB7IHN0YXR1czogMjAwIH0pO1xuICAgKiB9O1xuICAgKlxuICAgKiBjb25zdCBzZXJ2ZXIgPSBuZXcgU2VydmVyKHsgcG9ydCwgaGFuZGxlciB9KTtcbiAgICpcbiAgICogY29uc29sZS5sb2coXCJzZXJ2ZXIgbGlzdGVuaW5nIG9uIGh0dHA6Ly9sb2NhbGhvc3Q6NDUwNVwiKTtcbiAgICpcbiAgICogYXdhaXQgc2VydmVyLmxpc3RlbkFuZFNlcnZlKCk7XG4gICAqIGBgYFxuICAgKi9cbiAgYXN5bmMgbGlzdGVuQW5kU2VydmUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuI2Nsb3NlZCkge1xuICAgICAgdGhyb3cgbmV3IERlbm8uZXJyb3JzLkh0dHAoRVJST1JfU0VSVkVSX0NMT1NFRCk7XG4gICAgfVxuXG4gICAgY29uc3QgbGlzdGVuZXIgPSBEZW5vLmxpc3Rlbih7XG4gICAgICBwb3J0OiB0aGlzLiNwb3J0ID8/IEhUVFBfUE9SVCxcbiAgICAgIGhvc3RuYW1lOiB0aGlzLiNob3N0ID8/IFwiMC4wLjAuMFwiLFxuICAgICAgdHJhbnNwb3J0OiBcInRjcFwiLFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuc2VydmUobGlzdGVuZXIpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIGxpc3RlbmVyIG9uIHRoZSBzZXJ2ZXIsIGFjY2VwdCBpbmNvbWluZyBjb25uZWN0aW9ucywgdXBncmFkZSB0aGVtXG4gICAqIHRvIFRMUywgYW5kIGhhbmRsZSByZXF1ZXN0cyBvbiB0aGVzZSBjb25uZWN0aW9ucyB3aXRoIHRoZSBnaXZlbiBoYW5kbGVyLlxuICAgKlxuICAgKiBJZiB0aGUgc2VydmVyIHdhcyBjb25zdHJ1Y3RlZCB3aXRob3V0IGEgc3BlY2lmaWVkIHBvcnQsIDQ0MyBpcyB1c2VkLlxuICAgKlxuICAgKiBJZiB0aGUgc2VydmVyIHdhcyBjb25zdHJ1Y3RlZCB3aXRoIHRoZSBob3N0bmFtZSBvbWl0dGVkIGZyb20gdGhlIG9wdGlvbnMsIHRoZVxuICAgKiBub24tcm91dGFibGUgbWV0YS1hZGRyZXNzIGAwLjAuMC4wYCBpcyB1c2VkLlxuICAgKlxuICAgKiBUaHJvd3MgYSBzZXJ2ZXIgY2xvc2VkIGVycm9yIGlmIHRoZSBzZXJ2ZXIgaGFzIGJlZW4gY2xvc2VkLlxuICAgKlxuICAgKiBgYGB0c1xuICAgKiBpbXBvcnQgeyBTZXJ2ZXIgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9odHRwL3NlcnZlci50c1wiO1xuICAgKlxuICAgKiBjb25zdCBwb3J0ID0gNDUwNTtcbiAgICogY29uc3QgaGFuZGxlciA9IChyZXF1ZXN0OiBSZXF1ZXN0KSA9PiB7XG4gICAqICAgY29uc3QgYm9keSA9IGBZb3VyIHVzZXItYWdlbnQgaXM6XFxuXFxuJHtyZXF1ZXN0LmhlYWRlcnMuZ2V0KFxuICAgKiAgICBcInVzZXItYWdlbnRcIixcbiAgICogICApID8/IFwiVW5rbm93blwifWA7XG4gICAqXG4gICAqICAgcmV0dXJuIG5ldyBSZXNwb25zZShib2R5LCB7IHN0YXR1czogMjAwIH0pO1xuICAgKiB9O1xuICAgKlxuICAgKiBjb25zdCBzZXJ2ZXIgPSBuZXcgU2VydmVyKHsgcG9ydCwgaGFuZGxlciB9KTtcbiAgICpcbiAgICogY29uc3QgY2VydEZpbGUgPSBcIi9wYXRoL3RvL2NlcnRGaWxlLmNydFwiO1xuICAgKiBjb25zdCBrZXlGaWxlID0gXCIvcGF0aC90by9rZXlGaWxlLmtleVwiO1xuICAgKlxuICAgKiBjb25zb2xlLmxvZyhcInNlcnZlciBsaXN0ZW5pbmcgb24gaHR0cHM6Ly9sb2NhbGhvc3Q6NDUwNVwiKTtcbiAgICpcbiAgICogYXdhaXQgc2VydmVyLmxpc3RlbkFuZFNlcnZlVGxzKGNlcnRGaWxlLCBrZXlGaWxlKTtcbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSBjZXJ0RmlsZSBUaGUgcGF0aCB0byB0aGUgZmlsZSBjb250YWluaW5nIHRoZSBUTFMgY2VydGlmaWNhdGUuXG4gICAqIEBwYXJhbSBrZXlGaWxlIFRoZSBwYXRoIHRvIHRoZSBmaWxlIGNvbnRhaW5pbmcgdGhlIFRMUyBwcml2YXRlIGtleS5cbiAgICovXG4gIGFzeW5jIGxpc3RlbkFuZFNlcnZlVGxzKGNlcnRGaWxlOiBzdHJpbmcsIGtleUZpbGU6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLiNjbG9zZWQpIHtcbiAgICAgIHRocm93IG5ldyBEZW5vLmVycm9ycy5IdHRwKEVSUk9SX1NFUlZFUl9DTE9TRUQpO1xuICAgIH1cblxuICAgIGNvbnN0IGxpc3RlbmVyID0gRGVuby5saXN0ZW5UbHMoe1xuICAgICAgcG9ydDogdGhpcy4jcG9ydCA/PyBIVFRQU19QT1JULFxuICAgICAgaG9zdG5hbWU6IHRoaXMuI2hvc3QgPz8gXCIwLjAuMC4wXCIsXG4gICAgICBjZXJ0RmlsZSxcbiAgICAgIGtleUZpbGUsXG4gICAgICB0cmFuc3BvcnQ6IFwidGNwXCIsXG4gICAgICAvLyBBTFBOIHByb3RvY29sIHN1cHBvcnQgbm90IHlldCBzdGFibGUuXG4gICAgICAvLyBhbHBuUHJvdG9jb2xzOiBbXCJoMlwiLCBcImh0dHAvMS4xXCJdLFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuc2VydmUobGlzdGVuZXIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEltbWVkaWF0ZWx5IGNsb3NlIHRoZSBzZXJ2ZXIgbGlzdGVuZXJzIGFuZCBhc3NvY2lhdGVkIEhUVFAgY29ubmVjdGlvbnMuXG4gICAqXG4gICAqIFRocm93cyBhIHNlcnZlciBjbG9zZWQgZXJyb3IgaWYgY2FsbGVkIGFmdGVyIHRoZSBzZXJ2ZXIgaGFzIGJlZW4gY2xvc2VkLlxuICAgKi9cbiAgY2xvc2UoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuI2Nsb3NlZCkge1xuICAgICAgdGhyb3cgbmV3IERlbm8uZXJyb3JzLkh0dHAoRVJST1JfU0VSVkVSX0NMT1NFRCk7XG4gICAgfVxuXG4gICAgdGhpcy4jY2xvc2VkID0gdHJ1ZTtcblxuICAgIGZvciAoY29uc3QgbGlzdGVuZXIgb2YgdGhpcy4jbGlzdGVuZXJzKSB7XG4gICAgICB0cnkge1xuICAgICAgICBsaXN0ZW5lci5jbG9zZSgpO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIC8vIExpc3RlbmVyIGhhcyBhbHJlYWR5IGJlZW4gY2xvc2VkLlxuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuI2xpc3RlbmVycy5jbGVhcigpO1xuXG4gICAgZm9yIChjb25zdCBodHRwQ29ubiBvZiB0aGlzLiNodHRwQ29ubmVjdGlvbnMpIHtcbiAgICAgIHRoaXMuI2Nsb3NlSHR0cENvbm4oaHR0cENvbm4pO1xuICAgIH1cblxuICAgIHRoaXMuI2h0dHBDb25uZWN0aW9ucy5jbGVhcigpO1xuICB9XG5cbiAgLyoqIEdldCB3aGV0aGVyIHRoZSBzZXJ2ZXIgaXMgY2xvc2VkLiAqL1xuICBnZXQgY2xvc2VkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLiNjbG9zZWQ7XG4gIH1cblxuICAvKiogR2V0IHRoZSBsaXN0IG9mIG5ldHdvcmsgYWRkcmVzc2VzIHRoZSBzZXJ2ZXIgaXMgbGlzdGVuaW5nIG9uLiAqL1xuICBnZXQgYWRkcnMoKTogRGVuby5BZGRyW10ge1xuICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMuI2xpc3RlbmVycykubWFwKChsaXN0ZW5lcikgPT4gbGlzdGVuZXIuYWRkcik7XG4gIH1cblxuICAvKipcbiAgICogUmVzcG9uZHMgdG8gYW4gSFRUUCByZXF1ZXN0LlxuICAgKlxuICAgKiBAcGFyYW0gcmVxdWVzdEV2ZW50IFRoZSBIVFRQIHJlcXVlc3QgdG8gcmVzcG9uZCB0by5cbiAgICogQHBhcmFtIGh0dHBDb24gVGhlIEhUVFAgY29ubmVjdGlvbiB0byB5aWVsZCByZXF1ZXN0cyBmcm9tLlxuICAgKiBAcGFyYW0gY29ubkluZm8gSW5mb3JtYXRpb24gYWJvdXQgdGhlIHVuZGVybHlpbmcgY29ubmVjdGlvbi5cbiAgICovXG4gIGFzeW5jICNyZXNwb25kKFxuICAgIHJlcXVlc3RFdmVudDogRGVuby5SZXF1ZXN0RXZlbnQsXG4gICAgaHR0cENvbm46IERlbm8uSHR0cENvbm4sXG4gICAgY29ubkluZm86IENvbm5JbmZvLFxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBsZXQgcmVzcG9uc2U6IFJlc3BvbnNlO1xuICAgIHRyeSB7XG4gICAgICAvLyBIYW5kbGUgdGhlIHJlcXVlc3QgZXZlbnQsIGdlbmVyYXRpbmcgYSByZXNwb25zZS5cbiAgICAgIHJlc3BvbnNlID0gYXdhaXQgdGhpcy4jaGFuZGxlcihyZXF1ZXN0RXZlbnQucmVxdWVzdCwgY29ubkluZm8pO1xuICAgIH0gY2F0Y2ggKGVycm9yOiB1bmtub3duKSB7XG4gICAgICAvLyBJbnZva2Ugb25FcnJvciBoYW5kbGVyIHdoZW4gcmVxdWVzdCBoYW5kbGVyIHRocm93cy5cbiAgICAgIHJlc3BvbnNlID0gYXdhaXQgdGhpcy4jb25FcnJvcihlcnJvcik7XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIC8vIFNlbmQgdGhlIHJlc3BvbnNlLlxuICAgICAgYXdhaXQgcmVxdWVzdEV2ZW50LnJlc3BvbmRXaXRoKHJlc3BvbnNlKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIHJlc3BvbmRXaXRoKCkgZmFpbHMgd2hlbiB0aGUgY29ubmVjdGlvbiBoYXMgYWxyZWFkeSBiZWVuIGNsb3NlZCwgb3IgdGhlcmUgaXMgc29tZVxuICAgICAgLy8gb3RoZXIgZXJyb3Igd2l0aCByZXNwb25kaW5nIG9uIHRoaXMgY29ubmVjdGlvbiB0aGF0IHByb21wdHMgdXMgdG9cbiAgICAgIC8vIGNsb3NlIGl0IGFuZCBvcGVuIGEgbmV3IGNvbm5lY3Rpb24uXG4gICAgICByZXR1cm4gdGhpcy4jY2xvc2VIdHRwQ29ubihodHRwQ29ubik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNlcnZlcyBhbGwgSFRUUCByZXF1ZXN0cyBvbiBhIHNpbmdsZSBjb25uZWN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gaHR0cENvbm4gVGhlIEhUVFAgY29ubmVjdGlvbiB0byB5aWVsZCByZXF1ZXN0cyBmcm9tLlxuICAgKiBAcGFyYW0gY29ubkluZm8gSW5mb3JtYXRpb24gYWJvdXQgdGhlIHVuZGVybHlpbmcgY29ubmVjdGlvbi5cbiAgICovXG4gIGFzeW5jICNzZXJ2ZUh0dHAoaHR0cENvbm46IERlbm8uSHR0cENvbm4sIGNvbm5JbmZvOiBDb25uSW5mbyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHdoaWxlICghdGhpcy4jY2xvc2VkKSB7XG4gICAgICBsZXQgcmVxdWVzdEV2ZW50OiBEZW5vLlJlcXVlc3RFdmVudCB8IG51bGw7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIC8vIFlpZWxkIHRoZSBuZXcgSFRUUCByZXF1ZXN0IG9uIHRoZSBjb25uZWN0aW9uLlxuICAgICAgICByZXF1ZXN0RXZlbnQgPSBhd2FpdCBodHRwQ29ubi5uZXh0UmVxdWVzdCgpO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIC8vIENvbm5lY3Rpb24gaGFzIGJlZW4gY2xvc2VkLlxuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgaWYgKHJlcXVlc3RFdmVudCA9PT0gbnVsbCkge1xuICAgICAgICAvLyBDb25uZWN0aW9uIGhhcyBiZWVuIGNsb3NlZC5cbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIC8vIFJlc3BvbmQgdG8gdGhlIHJlcXVlc3QuIE5vdGUgd2UgZG8gbm90IGF3YWl0IHRoaXMgYXN5bmMgbWV0aG9kIHRvXG4gICAgICAvLyBhbGxvdyB0aGUgY29ubmVjdGlvbiB0byBoYW5kbGUgbXVsdGlwbGUgcmVxdWVzdHMgaW4gdGhlIGNhc2Ugb2YgaDIuXG4gICAgICB0aGlzLiNyZXNwb25kKHJlcXVlc3RFdmVudCwgaHR0cENvbm4sIGNvbm5JbmZvKTtcbiAgICB9XG5cbiAgICB0aGlzLiNjbG9zZUh0dHBDb25uKGh0dHBDb25uKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBY2NlcHRzIGFsbCBjb25uZWN0aW9ucyBvbiBhIHNpbmdsZSBuZXR3b3JrIGxpc3RlbmVyLlxuICAgKlxuICAgKiBAcGFyYW0gbGlzdGVuZXIgVGhlIGxpc3RlbmVyIHRvIGFjY2VwdCBjb25uZWN0aW9ucyBmcm9tLlxuICAgKi9cbiAgYXN5bmMgI2FjY2VwdChsaXN0ZW5lcjogRGVuby5MaXN0ZW5lcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGxldCBhY2NlcHRCYWNrb2ZmRGVsYXk6IG51bWJlciB8IHVuZGVmaW5lZDtcblxuICAgIHdoaWxlICghdGhpcy4jY2xvc2VkKSB7XG4gICAgICBsZXQgY29ubjogRGVuby5Db25uO1xuXG4gICAgICB0cnkge1xuICAgICAgICAvLyBXYWl0IGZvciBhIG5ldyBjb25uZWN0aW9uLlxuICAgICAgICBjb25uID0gYXdhaXQgbGlzdGVuZXIuYWNjZXB0KCk7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgLy8gVGhlIGxpc3RlbmVyIGlzIGNsb3NlZC5cbiAgICAgICAgICBlcnJvciBpbnN0YW5jZW9mIERlbm8uZXJyb3JzLkJhZFJlc291cmNlIHx8XG4gICAgICAgICAgLy8gVExTIGhhbmRzaGFrZSBlcnJvcnMuXG4gICAgICAgICAgZXJyb3IgaW5zdGFuY2VvZiBEZW5vLmVycm9ycy5JbnZhbGlkRGF0YSB8fFxuICAgICAgICAgIGVycm9yIGluc3RhbmNlb2YgRGVuby5lcnJvcnMuVW5leHBlY3RlZEVvZiB8fFxuICAgICAgICAgIGVycm9yIGluc3RhbmNlb2YgRGVuby5lcnJvcnMuQ29ubmVjdGlvblJlc2V0IHx8XG4gICAgICAgICAgZXJyb3IgaW5zdGFuY2VvZiBEZW5vLmVycm9ycy5Ob3RDb25uZWN0ZWRcbiAgICAgICAgKSB7XG4gICAgICAgICAgLy8gQmFja29mZiBhZnRlciB0cmFuc2llbnQgZXJyb3JzIHRvIGFsbG93IHRpbWUgZm9yIHRoZSBzeXN0ZW0gdG9cbiAgICAgICAgICAvLyByZWNvdmVyLCBhbmQgYXZvaWQgYmxvY2tpbmcgdXAgdGhlIGV2ZW50IGxvb3Agd2l0aCBhIGNvbnRpbnVvdXNseVxuICAgICAgICAgIC8vIHJ1bm5pbmcgbG9vcC5cbiAgICAgICAgICBpZiAoIWFjY2VwdEJhY2tvZmZEZWxheSkge1xuICAgICAgICAgICAgYWNjZXB0QmFja29mZkRlbGF5ID0gSU5JVElBTF9BQ0NFUFRfQkFDS09GRl9ERUxBWTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYWNjZXB0QmFja29mZkRlbGF5ICo9IDI7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGFjY2VwdEJhY2tvZmZEZWxheSA+PSBNQVhfQUNDRVBUX0JBQ0tPRkZfREVMQVkpIHtcbiAgICAgICAgICAgIGFjY2VwdEJhY2tvZmZEZWxheSA9IE1BWF9BQ0NFUFRfQkFDS09GRl9ERUxBWTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBhd2FpdCBkZWxheShhY2NlcHRCYWNrb2ZmRGVsYXkpO1xuXG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgIH1cblxuICAgICAgYWNjZXB0QmFja29mZkRlbGF5ID0gdW5kZWZpbmVkO1xuXG4gICAgICAvLyBcIlVwZ3JhZGVcIiB0aGUgbmV0d29yayBjb25uZWN0aW9uIGludG8gYW4gSFRUUCBjb25uZWN0aW9uLlxuICAgICAgbGV0IGh0dHBDb25uOiBEZW5vLkh0dHBDb25uO1xuXG4gICAgICB0cnkge1xuICAgICAgICBodHRwQ29ubiA9IERlbm8uc2VydmVIdHRwKGNvbm4pO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIC8vIENvbm5lY3Rpb24gaGFzIGJlZW4gY2xvc2VkLlxuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgLy8gQ2xvc2luZyB0aGUgdW5kZXJseWluZyBsaXN0ZW5lciB3aWxsIG5vdCBjbG9zZSBIVFRQIGNvbm5lY3Rpb25zLCBzbyB3ZVxuICAgICAgLy8gdHJhY2sgZm9yIGNsb3N1cmUgdXBvbiBzZXJ2ZXIgY2xvc2UuXG4gICAgICB0aGlzLiN0cmFja0h0dHBDb25uZWN0aW9uKGh0dHBDb25uKTtcblxuICAgICAgY29uc3QgY29ubkluZm86IENvbm5JbmZvID0ge1xuICAgICAgICBsb2NhbEFkZHI6IGNvbm4ubG9jYWxBZGRyLFxuICAgICAgICByZW1vdGVBZGRyOiBjb25uLnJlbW90ZUFkZHIsXG4gICAgICB9O1xuXG4gICAgICAvLyBTZXJ2ZSB0aGUgcmVxdWVzdHMgdGhhdCBhcnJpdmUgb24gdGhlIGp1c3QtYWNjZXB0ZWQgY29ubmVjdGlvbi4gTm90ZVxuICAgICAgLy8gd2UgZG8gbm90IGF3YWl0IHRoaXMgYXN5bmMgbWV0aG9kIHRvIGFsbG93IHRoZSBzZXJ2ZXIgdG8gYWNjZXB0IG5ld1xuICAgICAgLy8gY29ubmVjdGlvbnMuXG4gICAgICB0aGlzLiNzZXJ2ZUh0dHAoaHR0cENvbm4sIGNvbm5JbmZvKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVW50cmFja3MgYW5kIGNsb3NlcyBhbiBIVFRQIGNvbm5lY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSBodHRwQ29ubiBUaGUgSFRUUCBjb25uZWN0aW9uIHRvIGNsb3NlLlxuICAgKi9cbiAgI2Nsb3NlSHR0cENvbm4oaHR0cENvbm46IERlbm8uSHR0cENvbm4pOiB2b2lkIHtcbiAgICB0aGlzLiN1bnRyYWNrSHR0cENvbm5lY3Rpb24oaHR0cENvbm4pO1xuXG4gICAgdHJ5IHtcbiAgICAgIGh0dHBDb25uLmNsb3NlKCk7XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyBDb25uZWN0aW9uIGhhcyBhbHJlYWR5IGJlZW4gY2xvc2VkLlxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIHRoZSBsaXN0ZW5lciB0byB0aGUgaW50ZXJuYWwgdHJhY2tpbmcgbGlzdC5cbiAgICpcbiAgICogQHBhcmFtIGxpc3RlbmVyIExpc3RlbmVyIHRvIHRyYWNrLlxuICAgKi9cbiAgI3RyYWNrTGlzdGVuZXIobGlzdGVuZXI6IERlbm8uTGlzdGVuZXIpOiB2b2lkIHtcbiAgICB0aGlzLiNsaXN0ZW5lcnMuYWRkKGxpc3RlbmVyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIHRoZSBsaXN0ZW5lciBmcm9tIHRoZSBpbnRlcm5hbCB0cmFja2luZyBsaXN0LlxuICAgKlxuICAgKiBAcGFyYW0gbGlzdGVuZXIgTGlzdGVuZXIgdG8gdW50cmFjay5cbiAgICovXG4gICN1bnRyYWNrTGlzdGVuZXIobGlzdGVuZXI6IERlbm8uTGlzdGVuZXIpOiB2b2lkIHtcbiAgICB0aGlzLiNsaXN0ZW5lcnMuZGVsZXRlKGxpc3RlbmVyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIHRoZSBIVFRQIGNvbm5lY3Rpb24gdG8gdGhlIGludGVybmFsIHRyYWNraW5nIGxpc3QuXG4gICAqXG4gICAqIEBwYXJhbSBodHRwQ29ubiBIVFRQIGNvbm5lY3Rpb24gdG8gdHJhY2suXG4gICAqL1xuICAjdHJhY2tIdHRwQ29ubmVjdGlvbihodHRwQ29ubjogRGVuby5IdHRwQ29ubik6IHZvaWQge1xuICAgIHRoaXMuI2h0dHBDb25uZWN0aW9ucy5hZGQoaHR0cENvbm4pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgdGhlIEhUVFAgY29ubmVjdGlvbiBmcm9tIHRoZSBpbnRlcm5hbCB0cmFja2luZyBsaXN0LlxuICAgKlxuICAgKiBAcGFyYW0gaHR0cENvbm4gSFRUUCBjb25uZWN0aW9uIHRvIHVudHJhY2suXG4gICAqL1xuICAjdW50cmFja0h0dHBDb25uZWN0aW9uKGh0dHBDb25uOiBEZW5vLkh0dHBDb25uKTogdm9pZCB7XG4gICAgdGhpcy4jaHR0cENvbm5lY3Rpb25zLmRlbGV0ZShodHRwQ29ubik7XG4gIH1cbn1cblxuLyoqIEFkZGl0aW9uYWwgc2VydmUgb3B0aW9ucy4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU2VydmVJbml0IGV4dGVuZHMgUGFydGlhbDxEZW5vLkxpc3Rlbk9wdGlvbnM+IHtcbiAgLyoqIEFuIEFib3J0U2lnbmFsIHRvIGNsb3NlIHRoZSBzZXJ2ZXIgYW5kIGFsbCBjb25uZWN0aW9ucy4gKi9cbiAgc2lnbmFsPzogQWJvcnRTaWduYWw7XG5cbiAgLyoqIFRoZSBoYW5kbGVyIHRvIGludm9rZSB3aGVuIHJvdXRlIGhhbmRsZXJzIHRocm93IGFuIGVycm9yLiAqL1xuICBvbkVycm9yPzogKGVycm9yOiB1bmtub3duKSA9PiBSZXNwb25zZSB8IFByb21pc2U8UmVzcG9uc2U+O1xufVxuXG4vKipcbiAqIENvbnN0cnVjdHMgYSBzZXJ2ZXIsIGFjY2VwdHMgaW5jb21pbmcgY29ubmVjdGlvbnMgb24gdGhlIGdpdmVuIGxpc3RlbmVyLCBhbmRcbiAqIGhhbmRsZXMgcmVxdWVzdHMgb24gdGhlc2UgY29ubmVjdGlvbnMgd2l0aCB0aGUgZ2l2ZW4gaGFuZGxlci5cbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgc2VydmVMaXN0ZW5lciB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2h0dHAvc2VydmVyLnRzXCI7XG4gKlxuICogY29uc3QgbGlzdGVuZXIgPSBEZW5vLmxpc3Rlbih7IHBvcnQ6IDQ1MDUgfSk7XG4gKlxuICogY29uc29sZS5sb2coXCJzZXJ2ZXIgbGlzdGVuaW5nIG9uIGh0dHA6Ly9sb2NhbGhvc3Q6NDUwNVwiKTtcbiAqXG4gKiBhd2FpdCBzZXJ2ZUxpc3RlbmVyKGxpc3RlbmVyLCAocmVxdWVzdCkgPT4ge1xuICogICBjb25zdCBib2R5ID0gYFlvdXIgdXNlci1hZ2VudCBpczpcXG5cXG4ke3JlcXVlc3QuaGVhZGVycy5nZXQoXG4gKiAgICAgXCJ1c2VyLWFnZW50XCIsXG4gKiAgICkgPz8gXCJVbmtub3duXCJ9YDtcbiAqXG4gKiAgIHJldHVybiBuZXcgUmVzcG9uc2UoYm9keSwgeyBzdGF0dXM6IDIwMCB9KTtcbiAqIH0pO1xuICogYGBgXG4gKlxuICogQHBhcmFtIGxpc3RlbmVyIFRoZSBsaXN0ZW5lciB0byBhY2NlcHQgY29ubmVjdGlvbnMgZnJvbS5cbiAqIEBwYXJhbSBoYW5kbGVyIFRoZSBoYW5kbGVyIGZvciBpbmRpdmlkdWFsIEhUVFAgcmVxdWVzdHMuXG4gKiBAcGFyYW0gb3B0aW9ucyBPcHRpb25hbCBzZXJ2ZSBvcHRpb25zLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2VydmVMaXN0ZW5lcihcbiAgbGlzdGVuZXI6IERlbm8uTGlzdGVuZXIsXG4gIGhhbmRsZXI6IEhhbmRsZXIsXG4gIG9wdGlvbnM/OiBPbWl0PFNlcnZlSW5pdCwgXCJwb3J0XCIgfCBcImhvc3RuYW1lXCI+LFxuKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IHNlcnZlciA9IG5ldyBTZXJ2ZXIoeyBoYW5kbGVyLCBvbkVycm9yOiBvcHRpb25zPy5vbkVycm9yIH0pO1xuXG4gIGlmIChvcHRpb25zPy5zaWduYWwpIHtcbiAgICBvcHRpb25zLnNpZ25hbC5vbmFib3J0ID0gKCkgPT4gc2VydmVyLmNsb3NlKCk7XG4gIH1cblxuICByZXR1cm4gYXdhaXQgc2VydmVyLnNlcnZlKGxpc3RlbmVyKTtcbn1cblxuLyoqIFNlcnZlcyBIVFRQIHJlcXVlc3RzIHdpdGggdGhlIGdpdmVuIGhhbmRsZXIuXG4gKlxuICogWW91IGNhbiBzcGVjaWZ5IGFuIG9iamVjdCB3aXRoIGEgcG9ydCBhbmQgaG9zdG5hbWUgb3B0aW9uLCB3aGljaCBpcyB0aGUgYWRkcmVzcyB0byBsaXN0ZW4gb24uXG4gKiBUaGUgZGVmYXVsdCBpcyBwb3J0IDgwMDAgb24gaG9zdG5hbWUgXCIwLjAuMC4wXCIuXG4gKlxuICogVGhlIGJlbG93IGV4YW1wbGUgc2VydmVzIHdpdGggdGhlIHBvcnQgODAwMC5cbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgc2VydmUgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9odHRwL3NlcnZlci50c1wiO1xuICogc2VydmUoKF9yZXEpID0+IG5ldyBSZXNwb25zZShcIkhlbGxvLCB3b3JsZFwiKSk7XG4gKiBgYGBcbiAqXG4gKiBZb3UgY2FuIGNoYW5nZSB0aGUgbGlzdGVuaW5nIGFkZHJlc3MgYnkgdGhlIGhvc3QgYW5kIHBvcnQgb3B0aW9uLiBUaGUgYmVsb3cgZXhhbXBsZVxuICogc2VydmVzIHdpdGggdGhlIHBvcnQgMzAwMC5cbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgc2VydmUgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9odHRwL3NlcnZlci50c1wiO1xuICogc2VydmUoKF9yZXEpID0+IG5ldyBSZXNwb25zZShcIkhlbGxvLCB3b3JsZFwiKSwgeyBwb3J0OiAzMDAwIH0pO1xuICogY29uc29sZS5sb2coXCJMaXN0ZW5pbmcgb24gaHR0cDovL2xvY2FsaG9zdDozMDAwXCIpO1xuICogYGBgXG4gKlxuICogQHBhcmFtIGhhbmRsZXIgVGhlIGhhbmRsZXIgZm9yIGluZGl2aWR1YWwgSFRUUCByZXF1ZXN0cy5cbiAqIEBwYXJhbSBvcHRpb25zIFRoZSBvcHRpb25zLiBTZWUgYFNlcnZlSW5pdGAgZG9jdW1lbnRhdGlvbiBmb3IgZGV0YWlscy5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNlcnZlKFxuICBoYW5kbGVyOiBIYW5kbGVyLFxuICBvcHRpb25zOiBTZXJ2ZUluaXQgPSB7fSxcbik6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBzZXJ2ZXIgPSBuZXcgU2VydmVyKHtcbiAgICBwb3J0OiBvcHRpb25zLnBvcnQgPz8gODAwMCxcbiAgICBob3N0bmFtZTogb3B0aW9ucy5ob3N0bmFtZSA/PyBcIjAuMC4wLjBcIixcbiAgICBoYW5kbGVyLFxuICAgIG9uRXJyb3I6IG9wdGlvbnMub25FcnJvcixcbiAgfSk7XG5cbiAgaWYgKG9wdGlvbnM/LnNpZ25hbCkge1xuICAgIG9wdGlvbnMuc2lnbmFsLm9uYWJvcnQgPSAoKSA9PiBzZXJ2ZXIuY2xvc2UoKTtcbiAgfVxuXG4gIHJldHVybiBhd2FpdCBzZXJ2ZXIubGlzdGVuQW5kU2VydmUoKTtcbn1cblxuaW50ZXJmYWNlIFNlcnZlVGxzSW5pdCBleHRlbmRzIFNlcnZlSW5pdCB7XG4gIC8qKiBUaGUgcGF0aCB0byB0aGUgZmlsZSBjb250YWluaW5nIHRoZSBUTFMgcHJpdmF0ZSBrZXkuICovXG4gIGtleUZpbGU6IHN0cmluZztcblxuICAvKiogVGhlIHBhdGggdG8gdGhlIGZpbGUgY29udGFpbmluZyB0aGUgVExTIGNlcnRpZmljYXRlICovXG4gIGNlcnRGaWxlOiBzdHJpbmc7XG59XG5cbi8qKiBTZXJ2ZXMgSFRUUFMgcmVxdWVzdHMgd2l0aCB0aGUgZ2l2ZW4gaGFuZGxlci5cbiAqXG4gKiBZb3UgbXVzdCBzcGVjaWZ5IGBrZXlGaWxlYCBhbmQgYGNlcnRGaWxlYCBvcHRpb25zLlxuICpcbiAqIFlvdSBjYW4gc3BlY2lmeSBhbiBvYmplY3Qgd2l0aCBhIHBvcnQgYW5kIGhvc3RuYW1lIG9wdGlvbiwgd2hpY2ggaXMgdGhlIGFkZHJlc3MgdG8gbGlzdGVuIG9uLlxuICogVGhlIGRlZmF1bHQgaXMgcG9ydCA4NDQzIG9uIGhvc3RuYW1lIFwiMC4wLjAuMFwiLlxuICpcbiAqIFRoZSBiZWxvdyBleGFtcGxlIHNlcnZlcyB3aXRoIHRoZSBkZWZhdWx0IHBvcnQgODQ0My5cbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgc2VydmVUbHMgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9odHRwL3NlcnZlci50c1wiO1xuICogY29uc3QgY2VydEZpbGUgPSBcIi9wYXRoL3RvL2NlcnRGaWxlLmNydFwiO1xuICogY29uc3Qga2V5RmlsZSA9IFwiL3BhdGgvdG8va2V5RmlsZS5rZXlcIjtcbiAqIHNlcnZlVGxzKChfcmVxKSA9PiBuZXcgUmVzcG9uc2UoXCJIZWxsbywgd29ybGRcIiksIHsgY2VydEZpbGUsIGtleUZpbGUgfSk7XG4gKiBjb25zb2xlLmxvZyhcIkxpc3RlbmluZyBvbiBodHRwczovL2xvY2FsaG9zdDo4NDQzXCIpO1xuICogYGBgXG4gKlxuICogQHBhcmFtIGhhbmRsZXIgVGhlIGhhbmRsZXIgZm9yIGluZGl2aWR1YWwgSFRUUFMgcmVxdWVzdHMuXG4gKiBAcGFyYW0gb3B0aW9ucyBUaGUgb3B0aW9ucy4gU2VlIGBTZXJ2ZVRsc0luaXRgIGRvY3VtZW50YXRpb24gZm9yIGRldGFpbHMuXG4gKiBAcmV0dXJuc1xuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2VydmVUbHMoXG4gIGhhbmRsZXI6IEhhbmRsZXIsXG4gIG9wdGlvbnM6IFNlcnZlVGxzSW5pdCxcbik6IFByb21pc2U8dm9pZD4ge1xuICBpZiAoIW9wdGlvbnMua2V5RmlsZSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIlRMUyBjb25maWcgaXMgZ2l2ZW4sIGJ1dCAna2V5RmlsZScgaXMgbWlzc2luZy5cIik7XG4gIH1cblxuICBpZiAoIW9wdGlvbnMuY2VydEZpbGUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJUTFMgY29uZmlnIGlzIGdpdmVuLCBidXQgJ2NlcnRGaWxlJyBpcyBtaXNzaW5nLlwiKTtcbiAgfVxuXG4gIGNvbnN0IHNlcnZlciA9IG5ldyBTZXJ2ZXIoe1xuICAgIHBvcnQ6IG9wdGlvbnMucG9ydCA/PyA4NDQzLFxuICAgIGhvc3RuYW1lOiBvcHRpb25zLmhvc3RuYW1lID8/IFwiMC4wLjAuMFwiLFxuICAgIGhhbmRsZXIsXG4gICAgb25FcnJvcjogb3B0aW9ucy5vbkVycm9yLFxuICB9KTtcblxuICBpZiAob3B0aW9ucz8uc2lnbmFsKSB7XG4gICAgb3B0aW9ucy5zaWduYWwub25hYm9ydCA9ICgpID0+IHNlcnZlci5jbG9zZSgpO1xuICB9XG5cbiAgcmV0dXJuIGF3YWl0IHNlcnZlci5saXN0ZW5BbmRTZXJ2ZVRscyhvcHRpb25zLmNlcnRGaWxlLCBvcHRpb25zLmtleUZpbGUpO1xufVxuXG4vKipcbiAqIEBkZXByZWNhdGVkIFVzZSBgc2VydmVgIGluc3RlYWQuXG4gKlxuICogQ29uc3RydWN0cyBhIHNlcnZlciwgY3JlYXRlcyBhIGxpc3RlbmVyIG9uIHRoZSBnaXZlbiBhZGRyZXNzLCBhY2NlcHRzXG4gKiBpbmNvbWluZyBjb25uZWN0aW9ucywgYW5kIGhhbmRsZXMgcmVxdWVzdHMgb24gdGhlc2UgY29ubmVjdGlvbnMgd2l0aCB0aGVcbiAqIGdpdmVuIGhhbmRsZXIuXG4gKlxuICogSWYgdGhlIHBvcnQgaXMgb21pdHRlZCBmcm9tIHRoZSBMaXN0ZW5PcHRpb25zLCA4MCBpcyB1c2VkLlxuICpcbiAqIElmIHRoZSBob3N0IGlzIG9taXR0ZWQgZnJvbSB0aGUgTGlzdGVuT3B0aW9ucywgdGhlIG5vbi1yb3V0YWJsZSBtZXRhLWFkZHJlc3NcbiAqIGAwLjAuMC4wYCBpcyB1c2VkLlxuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBsaXN0ZW5BbmRTZXJ2ZSB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2h0dHAvc2VydmVyLnRzXCI7XG4gKlxuICogY29uc3QgcG9ydCA9IDQ1MDU7XG4gKlxuICogY29uc29sZS5sb2coXCJzZXJ2ZXIgbGlzdGVuaW5nIG9uIGh0dHA6Ly9sb2NhbGhvc3Q6NDUwNVwiKTtcbiAqXG4gKiBhd2FpdCBsaXN0ZW5BbmRTZXJ2ZSh7IHBvcnQgfSwgKHJlcXVlc3QpID0+IHtcbiAqICAgY29uc3QgYm9keSA9IGBZb3VyIHVzZXItYWdlbnQgaXM6XFxuXFxuJHtyZXF1ZXN0LmhlYWRlcnMuZ2V0KFxuICogICAgIFwidXNlci1hZ2VudFwiLFxuICogICApID8/IFwiVW5rbm93blwifWA7XG4gKlxuICogICByZXR1cm4gbmV3IFJlc3BvbnNlKGJvZHksIHsgc3RhdHVzOiAyMDAgfSk7XG4gKiB9KTtcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSBjb25maWcgVGhlIERlbm8uTGlzdGVuT3B0aW9ucyB0byBzcGVjaWZ5IHRoZSBob3N0bmFtZSBhbmQgcG9ydC5cbiAqIEBwYXJhbSBoYW5kbGVyIFRoZSBoYW5kbGVyIGZvciBpbmRpdmlkdWFsIEhUVFAgcmVxdWVzdHMuXG4gKiBAcGFyYW0gb3B0aW9ucyBPcHRpb25hbCBzZXJ2ZSBvcHRpb25zLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbGlzdGVuQW5kU2VydmUoXG4gIGNvbmZpZzogUGFydGlhbDxEZW5vLkxpc3Rlbk9wdGlvbnM+LFxuICBoYW5kbGVyOiBIYW5kbGVyLFxuICBvcHRpb25zPzogU2VydmVJbml0LFxuKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IHNlcnZlciA9IG5ldyBTZXJ2ZXIoeyAuLi5jb25maWcsIGhhbmRsZXIgfSk7XG5cbiAgaWYgKG9wdGlvbnM/LnNpZ25hbCkge1xuICAgIG9wdGlvbnMuc2lnbmFsLm9uYWJvcnQgPSAoKSA9PiBzZXJ2ZXIuY2xvc2UoKTtcbiAgfVxuXG4gIHJldHVybiBhd2FpdCBzZXJ2ZXIubGlzdGVuQW5kU2VydmUoKTtcbn1cblxuLyoqXG4gKiBAZGVwcmVjYXRlZCBVc2UgYHNlcnZlVGxzYCBpbnN0ZWFkLlxuICpcbiAqIENvbnN0cnVjdHMgYSBzZXJ2ZXIsIGNyZWF0ZXMgYSBsaXN0ZW5lciBvbiB0aGUgZ2l2ZW4gYWRkcmVzcywgYWNjZXB0c1xuICogaW5jb21pbmcgY29ubmVjdGlvbnMsIHVwZ3JhZGVzIHRoZW0gdG8gVExTLCBhbmQgaGFuZGxlcyByZXF1ZXN0cyBvbiB0aGVzZVxuICogY29ubmVjdGlvbnMgd2l0aCB0aGUgZ2l2ZW4gaGFuZGxlci5cbiAqXG4gKiBJZiB0aGUgcG9ydCBpcyBvbWl0dGVkIGZyb20gdGhlIExpc3Rlbk9wdGlvbnMsIHBvcnQgNDQzIGlzIHVzZWQuXG4gKlxuICogSWYgdGhlIGhvc3QgaXMgb21pdHRlZCBmcm9tIHRoZSBMaXN0ZW5PcHRpb25zLCB0aGUgbm9uLXJvdXRhYmxlIG1ldGEtYWRkcmVzc1xuICogYDAuMC4wLjBgIGlzIHVzZWQuXG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IGxpc3RlbkFuZFNlcnZlVGxzIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vaHR0cC9zZXJ2ZXIudHNcIjtcbiAqXG4gKiBjb25zdCBwb3J0ID0gNDUwNTtcbiAqIGNvbnN0IGNlcnRGaWxlID0gXCIvcGF0aC90by9jZXJ0RmlsZS5jcnRcIjtcbiAqIGNvbnN0IGtleUZpbGUgPSBcIi9wYXRoL3RvL2tleUZpbGUua2V5XCI7XG4gKlxuICogY29uc29sZS5sb2coXCJzZXJ2ZXIgbGlzdGVuaW5nIG9uIGh0dHA6Ly9sb2NhbGhvc3Q6NDUwNVwiKTtcbiAqXG4gKiBhd2FpdCBsaXN0ZW5BbmRTZXJ2ZVRscyh7IHBvcnQgfSwgY2VydEZpbGUsIGtleUZpbGUsIChyZXF1ZXN0KSA9PiB7XG4gKiAgIGNvbnN0IGJvZHkgPSBgWW91ciB1c2VyLWFnZW50IGlzOlxcblxcbiR7cmVxdWVzdC5oZWFkZXJzLmdldChcbiAqICAgICBcInVzZXItYWdlbnRcIixcbiAqICAgKSA/PyBcIlVua25vd25cIn1gO1xuICpcbiAqICAgcmV0dXJuIG5ldyBSZXNwb25zZShib2R5LCB7IHN0YXR1czogMjAwIH0pO1xuICogfSk7XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gY29uZmlnIFRoZSBEZW5vLkxpc3Rlbk9wdGlvbnMgdG8gc3BlY2lmeSB0aGUgaG9zdG5hbWUgYW5kIHBvcnQuXG4gKiBAcGFyYW0gY2VydEZpbGUgVGhlIHBhdGggdG8gdGhlIGZpbGUgY29udGFpbmluZyB0aGUgVExTIGNlcnRpZmljYXRlLlxuICogQHBhcmFtIGtleUZpbGUgVGhlIHBhdGggdG8gdGhlIGZpbGUgY29udGFpbmluZyB0aGUgVExTIHByaXZhdGUga2V5LlxuICogQHBhcmFtIGhhbmRsZXIgVGhlIGhhbmRsZXIgZm9yIGluZGl2aWR1YWwgSFRUUCByZXF1ZXN0cy5cbiAqIEBwYXJhbSBvcHRpb25zIE9wdGlvbmFsIHNlcnZlIG9wdGlvbnMuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBsaXN0ZW5BbmRTZXJ2ZVRscyhcbiAgY29uZmlnOiBQYXJ0aWFsPERlbm8uTGlzdGVuT3B0aW9ucz4sXG4gIGNlcnRGaWxlOiBzdHJpbmcsXG4gIGtleUZpbGU6IHN0cmluZyxcbiAgaGFuZGxlcjogSGFuZGxlcixcbiAgb3B0aW9ucz86IFNlcnZlSW5pdCxcbik6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBzZXJ2ZXIgPSBuZXcgU2VydmVyKHsgLi4uY29uZmlnLCBoYW5kbGVyIH0pO1xuXG4gIGlmIChvcHRpb25zPy5zaWduYWwpIHtcbiAgICBvcHRpb25zLnNpZ25hbC5vbmFib3J0ID0gKCkgPT4gc2VydmVyLmNsb3NlKCk7XG4gIH1cblxuICByZXR1cm4gYXdhaXQgc2VydmVyLmxpc3RlbkFuZFNlcnZlVGxzKGNlcnRGaWxlLCBrZXlGaWxlKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUsU0FBUyxLQUFLLFFBQVEsa0JBQWtCO0FBRXhDLCtDQUErQyxHQUMvQyxNQUFNLHNCQUFzQjtBQUU1QixtQ0FBbUMsR0FDbkMsTUFBTSxZQUFZO0FBRWxCLG9DQUFvQyxHQUNwQyxNQUFNLGFBQWE7QUFFbkIsdUVBQXVFLEdBQ3ZFLE1BQU0sK0JBQStCO0FBRXJDLGtFQUFrRSxHQUNsRSxNQUFNLDJCQUEyQjtBQW9DakMsc0NBQXNDLEdBQ3RDLE9BQU8sTUFBTTtJQUNYLENBQUMsSUFBSSxDQUFVO0lBQ2YsQ0FBQyxJQUFJLENBQVU7SUFDZixDQUFDLE9BQU8sQ0FBVTtJQUNsQixDQUFDLE1BQU0sR0FBRyxNQUFNO0lBQ2hCLENBQUMsU0FBUyxHQUF1QixJQUFJLE1BQU07SUFDM0MsQ0FBQyxlQUFlLEdBQXVCLElBQUksTUFBTTtJQUNqRCxDQUFDLE9BQU8sQ0FBbUQ7SUFFM0Q7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FtQkMsR0FDRCxZQUFZLFVBQXNCLENBQUU7UUFDbEMsSUFBSSxDQUFDLENBQUMsSUFBSSxHQUFHLFdBQVc7UUFDeEIsSUFBSSxDQUFDLENBQUMsSUFBSSxHQUFHLFdBQVc7UUFDeEIsSUFBSSxDQUFDLENBQUMsT0FBTyxHQUFHLFdBQVc7UUFDM0IsSUFBSSxDQUFDLENBQUMsT0FBTyxHQUFHLFdBQVcsV0FDekIsU0FBVSxLQUFjO1lBQ3RCLFFBQVEsTUFBTTtZQUNkLE9BQU8sSUFBSSxTQUFTLHlCQUF5QjtnQkFBRSxRQUFRO1lBQUk7UUFDN0Q7SUFDSjtJQUVBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBK0JDLEdBQ0QsTUFBTSxNQUFNLFFBQXVCLEVBQWlCO1FBQ2xELElBQUksSUFBSSxDQUFDLENBQUMsTUFBTSxFQUFFO1lBQ2hCLE1BQU0sSUFBSSxLQUFLLE9BQU8sS0FBSztRQUM3QjtRQUVBLElBQUksQ0FBQyxDQUFDLGFBQWEsQ0FBQztRQUVwQixJQUFJO1lBQ0YsT0FBTyxNQUFNLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQztRQUM1QixTQUFVO1lBQ1IsSUFBSSxDQUFDLENBQUMsZUFBZSxDQUFDO1lBRXRCLElBQUk7Z0JBQ0YsU0FBUztZQUNYLEVBQUUsT0FBTTtZQUNOLG9DQUFvQztZQUN0QztRQUNGO0lBQ0Y7SUFFQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0E2QkMsR0FDRCxNQUFNLGlCQUFnQztRQUNwQyxJQUFJLElBQUksQ0FBQyxDQUFDLE1BQU0sRUFBRTtZQUNoQixNQUFNLElBQUksS0FBSyxPQUFPLEtBQUs7UUFDN0I7UUFFQSxNQUFNLFdBQVcsS0FBSyxPQUFPO1lBQzNCLE1BQU0sSUFBSSxDQUFDLENBQUMsSUFBSSxJQUFJO1lBQ3BCLFVBQVUsSUFBSSxDQUFDLENBQUMsSUFBSSxJQUFJO1lBQ3hCLFdBQVc7UUFDYjtRQUVBLE9BQU8sTUFBTSxJQUFJLENBQUMsTUFBTTtJQUMxQjtJQUVBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQW1DQyxHQUNELE1BQU0sa0JBQWtCLFFBQWdCLEVBQUUsT0FBZSxFQUFpQjtRQUN4RSxJQUFJLElBQUksQ0FBQyxDQUFDLE1BQU0sRUFBRTtZQUNoQixNQUFNLElBQUksS0FBSyxPQUFPLEtBQUs7UUFDN0I7UUFFQSxNQUFNLFdBQVcsS0FBSyxVQUFVO1lBQzlCLE1BQU0sSUFBSSxDQUFDLENBQUMsSUFBSSxJQUFJO1lBQ3BCLFVBQVUsSUFBSSxDQUFDLENBQUMsSUFBSSxJQUFJO1lBQ3hCO1lBQ0E7WUFDQSxXQUFXO1FBR2I7UUFFQSxPQUFPLE1BQU0sSUFBSSxDQUFDLE1BQU07SUFDMUI7SUFFQTs7OztHQUlDLEdBQ0QsUUFBYztRQUNaLElBQUksSUFBSSxDQUFDLENBQUMsTUFBTSxFQUFFO1lBQ2hCLE1BQU0sSUFBSSxLQUFLLE9BQU8sS0FBSztRQUM3QjtRQUVBLElBQUksQ0FBQyxDQUFDLE1BQU0sR0FBRztRQUVmLEtBQUssTUFBTSxZQUFZLElBQUksQ0FBQyxDQUFDLFNBQVMsQ0FBRTtZQUN0QyxJQUFJO2dCQUNGLFNBQVM7WUFDWCxFQUFFLE9BQU07WUFDTixvQ0FBb0M7WUFDdEM7UUFDRjtRQUVBLElBQUksQ0FBQyxDQUFDLFNBQVMsQ0FBQztRQUVoQixLQUFLLE1BQU0sWUFBWSxJQUFJLENBQUMsQ0FBQyxlQUFlLENBQUU7WUFDNUMsSUFBSSxDQUFDLENBQUMsYUFBYSxDQUFDO1FBQ3RCO1FBRUEsSUFBSSxDQUFDLENBQUMsZUFBZSxDQUFDO0lBQ3hCO0lBRUEsc0NBQXNDLEdBQ3RDLElBQUksU0FBa0I7UUFDcEIsT0FBTyxJQUFJLENBQUMsQ0FBQyxNQUFNO0lBQ3JCO0lBRUEsa0VBQWtFLEdBQ2xFLElBQUksUUFBcUI7UUFDdkIsT0FBTyxNQUFNLEtBQUssSUFBSSxDQUFDLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxXQUFhLFNBQVM7SUFDaEU7SUFFQTs7Ozs7O0dBTUMsR0FDRCxNQUFNLENBQUMsT0FBTyxDQUNaLFlBQStCLEVBQy9CLFFBQXVCLEVBQ3ZCLFFBQWtCO1FBRWxCLElBQUk7UUFDSixJQUFJO1lBQ0YsbURBQW1EO1lBQ25ELFdBQVcsTUFBTSxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsYUFBYSxTQUFTO1FBQ3ZELEVBQUUsT0FBTyxPQUFnQjtZQUN2QixzREFBc0Q7WUFDdEQsV0FBVyxNQUFNLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQztRQUNqQztRQUVBLElBQUk7WUFDRixxQkFBcUI7WUFDckIsTUFBTSxhQUFhLFlBQVk7UUFDakMsRUFBRSxPQUFNO1lBQ04sb0ZBQW9GO1lBQ3BGLG9FQUFvRTtZQUNwRSxzQ0FBc0M7WUFDdEMsT0FBTyxJQUFJLENBQUMsQ0FBQyxhQUFhLENBQUM7UUFDN0I7SUFDRjtJQUVBOzs7OztHQUtDLEdBQ0QsTUFBTSxDQUFDLFNBQVMsQ0FBQyxRQUF1QixFQUFFLFFBQWtCO1FBQzFELE1BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUU7WUFDcEIsSUFBSTtZQUVKLElBQUk7Z0JBQ0YsZ0RBQWdEO2dCQUNoRCxlQUFlLE1BQU0sU0FBUztZQUNoQyxFQUFFLE9BQU07Z0JBRU47WUFDRjtZQUVBLElBQUksaUJBQWlCLE1BQU07Z0JBRXpCO1lBQ0Y7WUFFQSxvRUFBb0U7WUFDcEUsc0VBQXNFO1lBQ3RFLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxjQUFjLFVBQVU7UUFDeEM7UUFFQSxJQUFJLENBQUMsQ0FBQyxhQUFhLENBQUM7SUFDdEI7SUFFQTs7OztHQUlDLEdBQ0QsTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUF1QjtRQUNuQyxJQUFJO1FBRUosTUFBTyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBRTtZQUNwQixJQUFJO1lBRUosSUFBSTtnQkFDRiw2QkFBNkI7Z0JBQzdCLE9BQU8sTUFBTSxTQUFTO1lBQ3hCLEVBQUUsT0FBTyxPQUFPO2dCQUNkLElBQ0UsMEJBQTBCO2dCQUMxQixpQkFBaUIsS0FBSyxPQUFPLGVBQzdCLHdCQUF3QjtnQkFDeEIsaUJBQWlCLEtBQUssT0FBTyxlQUM3QixpQkFBaUIsS0FBSyxPQUFPLGlCQUM3QixpQkFBaUIsS0FBSyxPQUFPLG1CQUM3QixpQkFBaUIsS0FBSyxPQUFPLGNBQzdCO29CQUNBLGlFQUFpRTtvQkFDakUsb0VBQW9FO29CQUNwRSxnQkFBZ0I7b0JBQ2hCLElBQUksQ0FBQyxvQkFBb0I7d0JBQ3ZCLHFCQUFxQjtvQkFDdkIsT0FBTzt3QkFDTCxzQkFBc0I7b0JBQ3hCO29CQUVBLElBQUksc0JBQXNCLDBCQUEwQjt3QkFDbEQscUJBQXFCO29CQUN2QjtvQkFFQSxNQUFNLE1BQU07b0JBRVo7Z0JBQ0Y7Z0JBRUEsTUFBTTtZQUNSO1lBRUEscUJBQXFCO1lBRXJCLDREQUE0RDtZQUM1RCxJQUFJO1lBRUosSUFBSTtnQkFDRixXQUFXLEtBQUssVUFBVTtZQUM1QixFQUFFLE9BQU07Z0JBRU47WUFDRjtZQUVBLHlFQUF5RTtZQUN6RSx1Q0FBdUM7WUFDdkMsSUFBSSxDQUFDLENBQUMsbUJBQW1CLENBQUM7WUFFMUIsTUFBTSxXQUFxQjtnQkFDekIsV0FBVyxLQUFLO2dCQUNoQixZQUFZLEtBQUs7WUFDbkI7WUFFQSx1RUFBdUU7WUFDdkUsc0VBQXNFO1lBQ3RFLGVBQWU7WUFDZixJQUFJLENBQUMsQ0FBQyxTQUFTLENBQUMsVUFBVTtRQUM1QjtJQUNGO0lBRUE7Ozs7R0FJQyxHQUNELENBQUMsYUFBYSxDQUFDLFFBQXVCO1FBQ3BDLElBQUksQ0FBQyxDQUFDLHFCQUFxQixDQUFDO1FBRTVCLElBQUk7WUFDRixTQUFTO1FBQ1gsRUFBRSxPQUFNO1FBQ04sc0NBQXNDO1FBQ3hDO0lBQ0Y7SUFFQTs7OztHQUlDLEdBQ0QsQ0FBQyxhQUFhLENBQUMsUUFBdUI7UUFDcEMsSUFBSSxDQUFDLENBQUMsU0FBUyxDQUFDLElBQUk7SUFDdEI7SUFFQTs7OztHQUlDLEdBQ0QsQ0FBQyxlQUFlLENBQUMsUUFBdUI7UUFDdEMsSUFBSSxDQUFDLENBQUMsU0FBUyxDQUFDLE9BQU87SUFDekI7SUFFQTs7OztHQUlDLEdBQ0QsQ0FBQyxtQkFBbUIsQ0FBQyxRQUF1QjtRQUMxQyxJQUFJLENBQUMsQ0FBQyxlQUFlLENBQUMsSUFBSTtJQUM1QjtJQUVBOzs7O0dBSUMsR0FDRCxDQUFDLHFCQUFxQixDQUFDLFFBQXVCO1FBQzVDLElBQUksQ0FBQyxDQUFDLGVBQWUsQ0FBQyxPQUFPO0lBQy9CO0FBQ0Y7QUFXQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0F1QkMsR0FDRCxPQUFPLGVBQWUsY0FDcEIsUUFBdUIsRUFDdkIsT0FBZ0IsRUFDaEIsT0FBOEM7SUFFOUMsTUFBTSxTQUFTLElBQUksT0FBTztRQUFFO1FBQVMsU0FBUyxTQUFTO0lBQVE7SUFFL0QsSUFBSSxTQUFTLFFBQVE7UUFDbkIsUUFBUSxPQUFPLFVBQVUsSUFBTSxPQUFPO0lBQ3hDO0lBRUEsT0FBTyxNQUFNLE9BQU8sTUFBTTtBQUM1QjtBQUVBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQXVCQyxHQUNELE9BQU8sZUFBZSxNQUNwQixPQUFnQixFQUNoQixVQUFxQixDQUFDLENBQUM7SUFFdkIsTUFBTSxTQUFTLElBQUksT0FBTztRQUN4QixNQUFNLFFBQVEsUUFBUTtRQUN0QixVQUFVLFFBQVEsWUFBWTtRQUM5QjtRQUNBLFNBQVMsUUFBUTtJQUNuQjtJQUVBLElBQUksU0FBUyxRQUFRO1FBQ25CLFFBQVEsT0FBTyxVQUFVLElBQU0sT0FBTztJQUN4QztJQUVBLE9BQU8sTUFBTSxPQUFPO0FBQ3RCO0FBVUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBb0JDLEdBQ0QsT0FBTyxlQUFlLFNBQ3BCLE9BQWdCLEVBQ2hCLE9BQXFCO0lBRXJCLElBQUksQ0FBQyxRQUFRLFNBQVM7UUFDcEIsTUFBTSxJQUFJLE1BQU07SUFDbEI7SUFFQSxJQUFJLENBQUMsUUFBUSxVQUFVO1FBQ3JCLE1BQU0sSUFBSSxNQUFNO0lBQ2xCO0lBRUEsTUFBTSxTQUFTLElBQUksT0FBTztRQUN4QixNQUFNLFFBQVEsUUFBUTtRQUN0QixVQUFVLFFBQVEsWUFBWTtRQUM5QjtRQUNBLFNBQVMsUUFBUTtJQUNuQjtJQUVBLElBQUksU0FBUyxRQUFRO1FBQ25CLFFBQVEsT0FBTyxVQUFVLElBQU0sT0FBTztJQUN4QztJQUVBLE9BQU8sTUFBTSxPQUFPLGtCQUFrQixRQUFRLFVBQVUsUUFBUTtBQUNsRTtBQUVBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBK0JDLEdBQ0QsT0FBTyxlQUFlLGVBQ3BCLE1BQW1DLEVBQ25DLE9BQWdCLEVBQ2hCLE9BQW1CO0lBRW5CLE1BQU0sU0FBUyxJQUFJLE9BQU87UUFBRSxHQUFHLE1BQU07UUFBRTtJQUFRO0lBRS9DLElBQUksU0FBUyxRQUFRO1FBQ25CLFFBQVEsT0FBTyxVQUFVLElBQU0sT0FBTztJQUN4QztJQUVBLE9BQU8sTUFBTSxPQUFPO0FBQ3RCO0FBRUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBbUNDLEdBQ0QsT0FBTyxlQUFlLGtCQUNwQixNQUFtQyxFQUNuQyxRQUFnQixFQUNoQixPQUFlLEVBQ2YsT0FBZ0IsRUFDaEIsT0FBbUI7SUFFbkIsTUFBTSxTQUFTLElBQUksT0FBTztRQUFFLEdBQUcsTUFBTTtRQUFFO0lBQVE7SUFFL0MsSUFBSSxTQUFTLFFBQVE7UUFDbkIsUUFBUSxPQUFPLFVBQVUsSUFBTSxPQUFPO0lBQ3hDO0lBRUEsT0FBTyxNQUFNLE9BQU8sa0JBQWtCLFVBQVU7QUFDbEQifQ==