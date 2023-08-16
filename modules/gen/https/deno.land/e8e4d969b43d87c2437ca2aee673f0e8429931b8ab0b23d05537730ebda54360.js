// Copyright 2018-2023 the oak authors. All rights reserved. MIT license.
import { NativeRequest } from "./http_server_native_request.ts";
import { assert, isListenTlsOptions } from "./util.ts";
const serveHttp = "serveHttp" in Deno ? Deno.serveHttp.bind(Deno) : undefined;
/** The oak abstraction of the Deno native HTTP server which is used internally
 * for handling native HTTP requests. Generally users of oak do not need to
 * worry about this class. */ // deno-lint-ignore no-explicit-any
export class HttpServer {
    #app;
    #closed = false;
    #listener;
    #httpConnections = new Set();
    #options;
    constructor(app, options){
        if (!("serveHttp" in Deno)) {
            throw new Error("The native bindings for serving HTTP are not available.");
        }
        this.#app = app;
        this.#options = options;
    }
    get app() {
        return this.#app;
    }
    get closed() {
        return this.#closed;
    }
    close() {
        this.#closed = true;
        if (this.#listener) {
            this.#listener.close();
            this.#listener = undefined;
        }
        for (const httpConn of this.#httpConnections){
            try {
                httpConn.close();
            } catch (error) {
                if (!(error instanceof Deno.errors.BadResource)) {
                    throw error;
                }
            }
        }
        this.#httpConnections.clear();
    }
    listen() {
        return this.#listener = isListenTlsOptions(this.#options) ? Deno.listenTls(this.#options) : Deno.listen(this.#options);
    }
    #trackHttpConnection(httpConn) {
        this.#httpConnections.add(httpConn);
    }
    #untrackHttpConnection(httpConn) {
        this.#httpConnections.delete(httpConn);
    }
    [Symbol.asyncIterator]() {
        const start = (controller)=>{
            // deno-lint-ignore no-this-alias
            const server = this;
            async function serve(conn) {
                const httpConn = serveHttp(conn);
                server.#trackHttpConnection(httpConn);
                while(true){
                    try {
                        const requestEvent = await httpConn.nextRequest();
                        if (requestEvent === null) {
                            return;
                        }
                        const nativeRequest = new NativeRequest(requestEvent, {
                            conn
                        });
                        controller.enqueue(nativeRequest);
                        // if we await here, this becomes blocking, and really all we want
                        // it to dispatch any errors that occur on the promise
                        nativeRequest.donePromise.catch((error)=>{
                            server.app.dispatchEvent(new ErrorEvent("error", {
                                error
                            }));
                        });
                    } catch (error) {
                        server.app.dispatchEvent(new ErrorEvent("error", {
                            error
                        }));
                    }
                    if (server.closed) {
                        server.#untrackHttpConnection(httpConn);
                        httpConn.close();
                        controller.close();
                    }
                }
            }
            const listener = this.#listener;
            assert(listener);
            async function accept() {
                while(true){
                    try {
                        const conn = await listener.accept();
                        serve(conn);
                    } catch (error) {
                        if (!server.closed) {
                            server.app.dispatchEvent(new ErrorEvent("error", {
                                error
                            }));
                        }
                    }
                    if (server.closed) {
                        controller.close();
                        return;
                    }
                }
            }
            accept();
        };
        const stream = new ReadableStream({
            start
        });
        return stream[Symbol.asyncIterator]();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvb2FrQHYxMi42LjAvaHR0cF9zZXJ2ZXJfbmF0aXZlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjMgdGhlIG9hayBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cblxuaW1wb3J0IHR5cGUgeyBBcHBsaWNhdGlvbiwgU3RhdGUgfSBmcm9tIFwiLi9hcHBsaWNhdGlvbi50c1wiO1xuaW1wb3J0IHsgTmF0aXZlUmVxdWVzdCB9IGZyb20gXCIuL2h0dHBfc2VydmVyX25hdGl2ZV9yZXF1ZXN0LnRzXCI7XG5pbXBvcnQgdHlwZSB7IEh0dHBDb25uLCBMaXN0ZW5lciwgU2VydmVyIH0gZnJvbSBcIi4vdHlwZXMuZC50c1wiO1xuaW1wb3J0IHsgYXNzZXJ0LCBpc0xpc3RlblRsc09wdGlvbnMgfSBmcm9tIFwiLi91dGlsLnRzXCI7XG5cbi8vIHRoaXMgaXMgaW5jbHVkZWQgc28gd2hlbiBkb3duLWVtaXR0aW5nIHRvIG5wbS9Ob2RlLmpzLCBSZWFkYWJsZVN0cmVhbSBoYXNcbi8vIGFzeW5jIGl0ZXJhdG9yc1xuZGVjbGFyZSBnbG9iYWwge1xuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBpbnRlcmZhY2UgUmVhZGFibGVTdHJlYW08UiA9IGFueT4ge1xuICAgIFtTeW1ib2wuYXN5bmNJdGVyYXRvcl0ob3B0aW9ucz86IHtcbiAgICAgIHByZXZlbnRDYW5jZWw/OiBib29sZWFuO1xuICAgIH0pOiBBc3luY0l0ZXJhYmxlSXRlcmF0b3I8Uj47XG4gIH1cbn1cblxuZXhwb3J0IHR5cGUgUmVzcG9uZCA9IChyOiBSZXNwb25zZSB8IFByb21pc2U8UmVzcG9uc2U+KSA9PiB2b2lkO1xuXG4vLyBUaGlzIHR5cGUgaXMgcGFydCBvZiBEZW5vLCBidXQgbm90IHBhcnQgb2YgbGliLmRvbS5kLnRzLCB0aGVyZWZvcmUgYWRkIGl0IGhlcmVcbi8vIHNvIHRoYXQgdHlwZSBjaGVja2luZyBjYW4gb2NjdXIgcHJvcGVybHkgdW5kZXIgYGxpYi5kb20uZC50c2AuXG5pbnRlcmZhY2UgUmVhZGFibGVTdHJlYW1EZWZhdWx0Q29udHJvbGxlckNhbGxiYWNrPFI+IHtcbiAgKGNvbnRyb2xsZXI6IFJlYWRhYmxlU3RyZWFtRGVmYXVsdENvbnRyb2xsZXI8Uj4pOiB2b2lkIHwgUHJvbWlzZUxpa2U8dm9pZD47XG59XG5cbmNvbnN0IHNlcnZlSHR0cDogKGNvbm46IERlbm8uQ29ubikgPT4gSHR0cENvbm4gPSBcInNlcnZlSHR0cFwiIGluIERlbm9cbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgPyAoRGVubyBhcyBhbnkpLnNlcnZlSHR0cC5iaW5kKERlbm8pXG4gIDogdW5kZWZpbmVkO1xuXG4vKiogVGhlIG9hayBhYnN0cmFjdGlvbiBvZiB0aGUgRGVubyBuYXRpdmUgSFRUUCBzZXJ2ZXIgd2hpY2ggaXMgdXNlZCBpbnRlcm5hbGx5XG4gKiBmb3IgaGFuZGxpbmcgbmF0aXZlIEhUVFAgcmVxdWVzdHMuIEdlbmVyYWxseSB1c2VycyBvZiBvYWsgZG8gbm90IG5lZWQgdG9cbiAqIHdvcnJ5IGFib3V0IHRoaXMgY2xhc3MuICovXG4vLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuZXhwb3J0IGNsYXNzIEh0dHBTZXJ2ZXI8QVMgZXh0ZW5kcyBTdGF0ZSA9IFJlY29yZDxzdHJpbmcsIGFueT4+XG4gIGltcGxlbWVudHMgU2VydmVyPE5hdGl2ZVJlcXVlc3Q+IHtcbiAgI2FwcDogQXBwbGljYXRpb248QVM+O1xuICAjY2xvc2VkID0gZmFsc2U7XG4gICNsaXN0ZW5lcj86IERlbm8uTGlzdGVuZXI7XG4gICNodHRwQ29ubmVjdGlvbnM6IFNldDxIdHRwQ29ubj4gPSBuZXcgU2V0KCk7XG4gICNvcHRpb25zOiBEZW5vLkxpc3Rlbk9wdGlvbnMgfCBEZW5vLkxpc3RlblRsc09wdGlvbnM7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgYXBwOiBBcHBsaWNhdGlvbjxBUz4sXG4gICAgb3B0aW9uczogRGVuby5MaXN0ZW5PcHRpb25zIHwgRGVuby5MaXN0ZW5UbHNPcHRpb25zLFxuICApIHtcbiAgICBpZiAoIShcInNlcnZlSHR0cFwiIGluIERlbm8pKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIFwiVGhlIG5hdGl2ZSBiaW5kaW5ncyBmb3Igc2VydmluZyBIVFRQIGFyZSBub3QgYXZhaWxhYmxlLlwiLFxuICAgICAgKTtcbiAgICB9XG4gICAgdGhpcy4jYXBwID0gYXBwO1xuICAgIHRoaXMuI29wdGlvbnMgPSBvcHRpb25zO1xuICB9XG5cbiAgZ2V0IGFwcCgpOiBBcHBsaWNhdGlvbjxBUz4ge1xuICAgIHJldHVybiB0aGlzLiNhcHA7XG4gIH1cblxuICBnZXQgY2xvc2VkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLiNjbG9zZWQ7XG4gIH1cblxuICBjbG9zZSgpOiB2b2lkIHtcbiAgICB0aGlzLiNjbG9zZWQgPSB0cnVlO1xuXG4gICAgaWYgKHRoaXMuI2xpc3RlbmVyKSB7XG4gICAgICB0aGlzLiNsaXN0ZW5lci5jbG9zZSgpO1xuICAgICAgdGhpcy4jbGlzdGVuZXIgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBodHRwQ29ubiBvZiB0aGlzLiNodHRwQ29ubmVjdGlvbnMpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGh0dHBDb25uLmNsb3NlKCk7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBpZiAoIShlcnJvciBpbnN0YW5jZW9mIERlbm8uZXJyb3JzLkJhZFJlc291cmNlKSkge1xuICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy4jaHR0cENvbm5lY3Rpb25zLmNsZWFyKCk7XG4gIH1cblxuICBsaXN0ZW4oKTogTGlzdGVuZXIge1xuICAgIHJldHVybiAodGhpcy4jbGlzdGVuZXIgPSBpc0xpc3RlblRsc09wdGlvbnModGhpcy4jb3B0aW9ucylcbiAgICAgID8gRGVuby5saXN0ZW5UbHModGhpcy4jb3B0aW9ucylcbiAgICAgIDogRGVuby5saXN0ZW4odGhpcy4jb3B0aW9ucykpIGFzIExpc3RlbmVyO1xuICB9XG5cbiAgI3RyYWNrSHR0cENvbm5lY3Rpb24oaHR0cENvbm46IEh0dHBDb25uKTogdm9pZCB7XG4gICAgdGhpcy4jaHR0cENvbm5lY3Rpb25zLmFkZChodHRwQ29ubik7XG4gIH1cblxuICAjdW50cmFja0h0dHBDb25uZWN0aW9uKGh0dHBDb25uOiBIdHRwQ29ubik6IHZvaWQge1xuICAgIHRoaXMuI2h0dHBDb25uZWN0aW9ucy5kZWxldGUoaHR0cENvbm4pO1xuICB9XG5cbiAgW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSgpOiBBc3luY0l0ZXJhYmxlSXRlcmF0b3I8TmF0aXZlUmVxdWVzdD4ge1xuICAgIGNvbnN0IHN0YXJ0OiBSZWFkYWJsZVN0cmVhbURlZmF1bHRDb250cm9sbGVyQ2FsbGJhY2s8TmF0aXZlUmVxdWVzdD4gPSAoXG4gICAgICBjb250cm9sbGVyLFxuICAgICkgPT4ge1xuICAgICAgLy8gZGVuby1saW50LWlnbm9yZSBuby10aGlzLWFsaWFzXG4gICAgICBjb25zdCBzZXJ2ZXIgPSB0aGlzO1xuICAgICAgYXN5bmMgZnVuY3Rpb24gc2VydmUoY29ubjogRGVuby5Db25uKSB7XG4gICAgICAgIGNvbnN0IGh0dHBDb25uID0gc2VydmVIdHRwKGNvbm4pO1xuICAgICAgICBzZXJ2ZXIuI3RyYWNrSHR0cENvbm5lY3Rpb24oaHR0cENvbm4pO1xuXG4gICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlcXVlc3RFdmVudCA9IGF3YWl0IGh0dHBDb25uLm5leHRSZXF1ZXN0KCk7XG5cbiAgICAgICAgICAgIGlmIChyZXF1ZXN0RXZlbnQgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBuYXRpdmVSZXF1ZXN0ID0gbmV3IE5hdGl2ZVJlcXVlc3QocmVxdWVzdEV2ZW50LCB7IGNvbm4gfSk7XG4gICAgICAgICAgICBjb250cm9sbGVyLmVucXVldWUobmF0aXZlUmVxdWVzdCk7XG4gICAgICAgICAgICAvLyBpZiB3ZSBhd2FpdCBoZXJlLCB0aGlzIGJlY29tZXMgYmxvY2tpbmcsIGFuZCByZWFsbHkgYWxsIHdlIHdhbnRcbiAgICAgICAgICAgIC8vIGl0IHRvIGRpc3BhdGNoIGFueSBlcnJvcnMgdGhhdCBvY2N1ciBvbiB0aGUgcHJvbWlzZVxuICAgICAgICAgICAgbmF0aXZlUmVxdWVzdC5kb25lUHJvbWlzZS5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgc2VydmVyLmFwcC5kaXNwYXRjaEV2ZW50KG5ldyBFcnJvckV2ZW50KFwiZXJyb3JcIiwgeyBlcnJvciB9KSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgc2VydmVyLmFwcC5kaXNwYXRjaEV2ZW50KG5ldyBFcnJvckV2ZW50KFwiZXJyb3JcIiwgeyBlcnJvciB9KSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHNlcnZlci5jbG9zZWQpIHtcbiAgICAgICAgICAgIHNlcnZlci4jdW50cmFja0h0dHBDb25uZWN0aW9uKGh0dHBDb25uKTtcbiAgICAgICAgICAgIGh0dHBDb25uLmNsb3NlKCk7XG4gICAgICAgICAgICBjb250cm9sbGVyLmNsb3NlKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGxpc3RlbmVyID0gdGhpcy4jbGlzdGVuZXI7XG4gICAgICBhc3NlcnQobGlzdGVuZXIpO1xuICAgICAgYXN5bmMgZnVuY3Rpb24gYWNjZXB0KCkge1xuICAgICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25uID0gYXdhaXQgbGlzdGVuZXIhLmFjY2VwdCgpO1xuICAgICAgICAgICAgc2VydmUoY29ubik7XG4gICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGlmICghc2VydmVyLmNsb3NlZCkge1xuICAgICAgICAgICAgICBzZXJ2ZXIuYXBwLmRpc3BhdGNoRXZlbnQobmV3IEVycm9yRXZlbnQoXCJlcnJvclwiLCB7IGVycm9yIH0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHNlcnZlci5jbG9zZWQpIHtcbiAgICAgICAgICAgIGNvbnRyb2xsZXIuY2xvc2UoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgYWNjZXB0KCk7XG4gICAgfTtcbiAgICBjb25zdCBzdHJlYW0gPSBuZXcgUmVhZGFibGVTdHJlYW08TmF0aXZlUmVxdWVzdD4oeyBzdGFydCB9KTtcblxuICAgIHJldHVybiBzdHJlYW1bU3ltYm9sLmFzeW5jSXRlcmF0b3JdKCk7XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSx5RUFBeUU7QUFHekUsU0FBUyxhQUFhLFFBQVEsa0NBQWtDO0FBRWhFLFNBQVMsTUFBTSxFQUFFLGtCQUFrQixRQUFRLFlBQVk7QUFxQnZELE1BQU0sWUFBMkMsZUFBZSxPQUU1RCxBQUFDLEtBQWEsVUFBVSxLQUFLLFFBQzdCO0FBRUo7OzJCQUUyQixHQUMzQixtQ0FBbUM7QUFDbkMsT0FBTyxNQUFNO0lBRVgsQ0FBQyxHQUFHLENBQWtCO0lBQ3RCLENBQUMsTUFBTSxHQUFHLE1BQU07SUFDaEIsQ0FBQyxRQUFRLENBQWlCO0lBQzFCLENBQUMsZUFBZSxHQUFrQixJQUFJLE1BQU07SUFDNUMsQ0FBQyxPQUFPLENBQTZDO0lBRXJELFlBQ0UsR0FBb0IsRUFDcEIsT0FBbUQsQ0FDbkQ7UUFDQSxJQUFJLENBQUMsQ0FBQyxlQUFlLElBQUksR0FBRztZQUMxQixN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