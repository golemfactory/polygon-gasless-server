// Copyright 2018-2023 the oak authors. All rights reserved. MIT license.
// deno-lint-ignore-file no-explicit-any
/**
 * A collection of utility APIs which can make testing of an oak application
 * easier.
 *
 * @module
 */ import { accepts, createHttpError, SecureCookieMap } from "./deps.ts";
import { Response } from "./response.ts";
/** Creates a mock of `Application`. */ export function createMockApp(state = {}) {
    const app = {
        state,
        use () {
            return app;
        },
        [Symbol.for("Deno.customInspect")] () {
            return "MockApplication {}";
        },
        [Symbol.for("nodejs.util.inspect.custom")] (depth, options, inspect) {
            if (depth < 0) {
                return options.stylize(`[MockApplication]`, "special");
            }
            const newOptions = Object.assign({}, options, {
                depth: options.depth === null ? null : options.depth - 1
            });
            return `${options.stylize("MockApplication", "special")} ${inspect({}, newOptions)}`;
        }
    };
    return app;
}
/** Allows external parties to modify the context state. */ export const mockContextState = {
    /** Adjusts the return value of the `acceptedEncodings` in the context's
   * `request` object. */ encodingsAccepted: "identity"
};
/** Create a mock of `Context` or `RouterContext`. */ export function createMockContext({ ip ="127.0.0.1" , method ="GET" , params , path ="/" , state , app =createMockApp(state) , headers: requestHeaders  } = {}) {
    function createMockRequest() {
        const headers = new Headers(requestHeaders);
        return {
            accepts (...types) {
                if (!headers.has("Accept")) {
                    return;
                }
                if (types.length) {
                    return accepts({
                        headers
                    }, ...types);
                }
                return accepts({
                    headers
                });
            },
            acceptsEncodings () {
                return mockContextState.encodingsAccepted;
            },
            headers,
            ip,
            method,
            path,
            search: undefined,
            searchParams: new URLSearchParams(),
            url: new URL(path, "http://localhost/")
        };
    }
    const request = createMockRequest();
    const response = new Response(request);
    const cookies = new SecureCookieMap(request, {
        response
    });
    return {
        app,
        params,
        request,
        cookies,
        response,
        state: Object.assign({}, app.state),
        assert (condition, errorStatus = 500, message, props) {
            if (condition) {
                return;
            }
            const err = createHttpError(errorStatus, message);
            if (props) {
                Object.assign(err, props);
            }
            throw err;
        },
        throw (errorStatus, message, props) {
            const err = createHttpError(errorStatus, message);
            if (props) {
                Object.assign(err, props);
            }
            throw err;
        },
        [Symbol.for("Deno.customInspect")] () {
            return `MockContext {}`;
        },
        [Symbol.for("nodejs.util.inspect.custom")] (depth, options, inspect) {
            if (depth < 0) {
                return options.stylize(`[MockContext]`, "special");
            }
            const newOptions = Object.assign({}, options, {
                depth: options.depth === null ? null : options.depth - 1
            });
            return `${options.stylize("MockContext", "special")} ${inspect({}, newOptions)}`;
        }
    };
}
/** Creates a mock `next()` function which can be used when calling
 * middleware. */ export function createMockNext() {
    return async function next() {};
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvb2FrQHYxMi42LjAvdGVzdGluZy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIzIHRoZSBvYWsgYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG5cbi8vIGRlbm8tbGludC1pZ25vcmUtZmlsZSBuby1leHBsaWNpdC1hbnlcblxuLyoqXG4gKiBBIGNvbGxlY3Rpb24gb2YgdXRpbGl0eSBBUElzIHdoaWNoIGNhbiBtYWtlIHRlc3Rpbmcgb2YgYW4gb2FrIGFwcGxpY2F0aW9uXG4gKiBlYXNpZXIuXG4gKlxuICogQG1vZHVsZVxuICovXG5cbmltcG9ydCB0eXBlIHsgQXBwbGljYXRpb24sIFN0YXRlIH0gZnJvbSBcIi4vYXBwbGljYXRpb24udHNcIjtcbmltcG9ydCB7XG4gIGFjY2VwdHMsXG4gIGNyZWF0ZUh0dHBFcnJvcixcbiAgdHlwZSBFcnJvclN0YXR1cyxcbiAgU2VjdXJlQ29va2llTWFwLFxufSBmcm9tIFwiLi9kZXBzLnRzXCI7XG5pbXBvcnQgdHlwZSB7IFJvdXRlUGFyYW1zLCBSb3V0ZXJDb250ZXh0IH0gZnJvbSBcIi4vcm91dGVyLnRzXCI7XG5pbXBvcnQgeyBSZXF1ZXN0IH0gZnJvbSBcIi4vcmVxdWVzdC50c1wiO1xuaW1wb3J0IHsgUmVzcG9uc2UgfSBmcm9tIFwiLi9yZXNwb25zZS50c1wiO1xuXG4vKiogQ3JlYXRlcyBhIG1vY2sgb2YgYEFwcGxpY2F0aW9uYC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVNb2NrQXBwPFxuICBTIGV4dGVuZHMgUmVjb3JkPHN0cmluZyB8IG51bWJlciB8IHN5bWJvbCwgYW55PiA9IFJlY29yZDxzdHJpbmcsIGFueT4sXG4+KFxuICBzdGF0ZSA9IHt9IGFzIFMsXG4pOiBBcHBsaWNhdGlvbjxTPiB7XG4gIGNvbnN0IGFwcCA9IHtcbiAgICBzdGF0ZSxcbiAgICB1c2UoKSB7XG4gICAgICByZXR1cm4gYXBwO1xuICAgIH0sXG4gICAgW1N5bWJvbC5mb3IoXCJEZW5vLmN1c3RvbUluc3BlY3RcIildKCkge1xuICAgICAgcmV0dXJuIFwiTW9ja0FwcGxpY2F0aW9uIHt9XCI7XG4gICAgfSxcbiAgICBbU3ltYm9sLmZvcihcIm5vZGVqcy51dGlsLmluc3BlY3QuY3VzdG9tXCIpXShcbiAgICAgIGRlcHRoOiBudW1iZXIsXG4gICAgICBvcHRpb25zOiBhbnksXG4gICAgICBpbnNwZWN0OiAodmFsdWU6IHVua25vd24sIG9wdGlvbnM/OiB1bmtub3duKSA9PiBzdHJpbmcsXG4gICAgKSB7XG4gICAgICBpZiAoZGVwdGggPCAwKSB7XG4gICAgICAgIHJldHVybiBvcHRpb25zLnN0eWxpemUoYFtNb2NrQXBwbGljYXRpb25dYCwgXCJzcGVjaWFsXCIpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBuZXdPcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucywge1xuICAgICAgICBkZXB0aDogb3B0aW9ucy5kZXB0aCA9PT0gbnVsbCA/IG51bGwgOiBvcHRpb25zLmRlcHRoIC0gMSxcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGAke29wdGlvbnMuc3R5bGl6ZShcIk1vY2tBcHBsaWNhdGlvblwiLCBcInNwZWNpYWxcIil9ICR7XG4gICAgICAgIGluc3BlY3Qoe30sIG5ld09wdGlvbnMpXG4gICAgICB9YDtcbiAgICB9LFxuICB9IGFzIGFueTtcbiAgcmV0dXJuIGFwcDtcbn1cblxuLyoqIE9wdGlvbnMgdGhhdCBjYW4gYmUgc2V0IGluIGEgbW9jayBjb250ZXh0LiAqL1xuZXhwb3J0IGludGVyZmFjZSBNb2NrQ29udGV4dE9wdGlvbnM8XG4gIFIgZXh0ZW5kcyBzdHJpbmcsXG4gIFAgZXh0ZW5kcyBSb3V0ZVBhcmFtczxSPiA9IFJvdXRlUGFyYW1zPFI+LFxuICBTIGV4dGVuZHMgU3RhdGUgPSBSZWNvcmQ8c3RyaW5nLCBhbnk+LFxuPiB7XG4gIGFwcD86IEFwcGxpY2F0aW9uPFM+O1xuICBpcD86IHN0cmluZztcbiAgbWV0aG9kPzogc3RyaW5nO1xuICBwYXJhbXM/OiBQO1xuICBwYXRoPzogc3RyaW5nO1xuICBzdGF0ZT86IFM7XG4gIGhlYWRlcnM/OiBbc3RyaW5nLCBzdHJpbmddW107XG59XG5cbi8qKiBBbGxvd3MgZXh0ZXJuYWwgcGFydGllcyB0byBtb2RpZnkgdGhlIGNvbnRleHQgc3RhdGUuICovXG5leHBvcnQgY29uc3QgbW9ja0NvbnRleHRTdGF0ZSA9IHtcbiAgLyoqIEFkanVzdHMgdGhlIHJldHVybiB2YWx1ZSBvZiB0aGUgYGFjY2VwdGVkRW5jb2RpbmdzYCBpbiB0aGUgY29udGV4dCdzXG4gICAqIGByZXF1ZXN0YCBvYmplY3QuICovXG4gIGVuY29kaW5nc0FjY2VwdGVkOiBcImlkZW50aXR5XCIsXG59O1xuXG4vKiogQ3JlYXRlIGEgbW9jayBvZiBgQ29udGV4dGAgb3IgYFJvdXRlckNvbnRleHRgLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU1vY2tDb250ZXh0PFxuICBSIGV4dGVuZHMgc3RyaW5nLFxuICBQIGV4dGVuZHMgUm91dGVQYXJhbXM8Uj4gPSBSb3V0ZVBhcmFtczxSPixcbiAgUyBleHRlbmRzIFN0YXRlID0gUmVjb3JkPHN0cmluZywgYW55Pixcbj4oXG4gIHtcbiAgICBpcCA9IFwiMTI3LjAuMC4xXCIsXG4gICAgbWV0aG9kID0gXCJHRVRcIixcbiAgICBwYXJhbXMsXG4gICAgcGF0aCA9IFwiL1wiLFxuICAgIHN0YXRlLFxuICAgIGFwcCA9IGNyZWF0ZU1vY2tBcHAoc3RhdGUpLFxuICAgIGhlYWRlcnM6IHJlcXVlc3RIZWFkZXJzLFxuICB9OiBNb2NrQ29udGV4dE9wdGlvbnM8Uj4gPSB7fSxcbikge1xuICBmdW5jdGlvbiBjcmVhdGVNb2NrUmVxdWVzdCgpOiBSZXF1ZXN0IHtcbiAgICBjb25zdCBoZWFkZXJzID0gbmV3IEhlYWRlcnMocmVxdWVzdEhlYWRlcnMpO1xuICAgIHJldHVybiB7XG4gICAgICBhY2NlcHRzKC4uLnR5cGVzOiBzdHJpbmdbXSkge1xuICAgICAgICBpZiAoIWhlYWRlcnMuaGFzKFwiQWNjZXB0XCIpKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlcy5sZW5ndGgpIHtcbiAgICAgICAgICByZXR1cm4gYWNjZXB0cyh7IGhlYWRlcnMgfSwgLi4udHlwZXMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhY2NlcHRzKHsgaGVhZGVycyB9KTtcbiAgICAgIH0sXG4gICAgICBhY2NlcHRzRW5jb2RpbmdzKCkge1xuICAgICAgICByZXR1cm4gbW9ja0NvbnRleHRTdGF0ZS5lbmNvZGluZ3NBY2NlcHRlZDtcbiAgICAgIH0sXG4gICAgICBoZWFkZXJzLFxuICAgICAgaXAsXG4gICAgICBtZXRob2QsXG4gICAgICBwYXRoLFxuICAgICAgc2VhcmNoOiB1bmRlZmluZWQsXG4gICAgICBzZWFyY2hQYXJhbXM6IG5ldyBVUkxTZWFyY2hQYXJhbXMoKSxcbiAgICAgIHVybDogbmV3IFVSTChwYXRoLCBcImh0dHA6Ly9sb2NhbGhvc3QvXCIpLFxuICAgIH0gYXMgYW55O1xuICB9XG5cbiAgY29uc3QgcmVxdWVzdCA9IGNyZWF0ZU1vY2tSZXF1ZXN0KCk7XG4gIGNvbnN0IHJlc3BvbnNlID0gbmV3IFJlc3BvbnNlKHJlcXVlc3QpO1xuICBjb25zdCBjb29raWVzID0gbmV3IFNlY3VyZUNvb2tpZU1hcChyZXF1ZXN0LCB7IHJlc3BvbnNlIH0pO1xuXG4gIHJldHVybiAoe1xuICAgIGFwcCxcbiAgICBwYXJhbXMsXG4gICAgcmVxdWVzdCxcbiAgICBjb29raWVzLFxuICAgIHJlc3BvbnNlLFxuICAgIHN0YXRlOiBPYmplY3QuYXNzaWduKHt9LCBhcHAuc3RhdGUpLFxuICAgIGFzc2VydChcbiAgICAgIGNvbmRpdGlvbjogYW55LFxuICAgICAgZXJyb3JTdGF0dXM6IEVycm9yU3RhdHVzID0gNTAwLFxuICAgICAgbWVzc2FnZT86IHN0cmluZyxcbiAgICAgIHByb3BzPzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4gICAgKTogYXNzZXJ0cyBjb25kaXRpb24ge1xuICAgICAgaWYgKGNvbmRpdGlvbikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjb25zdCBlcnIgPSBjcmVhdGVIdHRwRXJyb3IoZXJyb3JTdGF0dXMsIG1lc3NhZ2UpO1xuICAgICAgaWYgKHByb3BzKSB7XG4gICAgICAgIE9iamVjdC5hc3NpZ24oZXJyLCBwcm9wcyk7XG4gICAgICB9XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfSxcbiAgICB0aHJvdyhcbiAgICAgIGVycm9yU3RhdHVzOiBFcnJvclN0YXR1cyxcbiAgICAgIG1lc3NhZ2U/OiBzdHJpbmcsXG4gICAgICBwcm9wcz86IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuICAgICk6IG5ldmVyIHtcbiAgICAgIGNvbnN0IGVyciA9IGNyZWF0ZUh0dHBFcnJvcihlcnJvclN0YXR1cywgbWVzc2FnZSk7XG4gICAgICBpZiAocHJvcHMpIHtcbiAgICAgICAgT2JqZWN0LmFzc2lnbihlcnIsIHByb3BzKTtcbiAgICAgIH1cbiAgICAgIHRocm93IGVycjtcbiAgICB9LFxuICAgIFtTeW1ib2wuZm9yKFwiRGVuby5jdXN0b21JbnNwZWN0XCIpXSgpIHtcbiAgICAgIHJldHVybiBgTW9ja0NvbnRleHQge31gO1xuICAgIH0sXG4gICAgW1N5bWJvbC5mb3IoXCJub2RlanMudXRpbC5pbnNwZWN0LmN1c3RvbVwiKV0oXG4gICAgICBkZXB0aDogbnVtYmVyLFxuICAgICAgb3B0aW9uczogYW55LFxuICAgICAgaW5zcGVjdDogKHZhbHVlOiB1bmtub3duLCBvcHRpb25zPzogdW5rbm93bikgPT4gc3RyaW5nLFxuICAgICkge1xuICAgICAgaWYgKGRlcHRoIDwgMCkge1xuICAgICAgICByZXR1cm4gb3B0aW9ucy5zdHlsaXplKGBbTW9ja0NvbnRleHRdYCwgXCJzcGVjaWFsXCIpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBuZXdPcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucywge1xuICAgICAgICBkZXB0aDogb3B0aW9ucy5kZXB0aCA9PT0gbnVsbCA/IG51bGwgOiBvcHRpb25zLmRlcHRoIC0gMSxcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGAke29wdGlvbnMuc3R5bGl6ZShcIk1vY2tDb250ZXh0XCIsIFwic3BlY2lhbFwiKX0gJHtcbiAgICAgICAgaW5zcGVjdCh7fSwgbmV3T3B0aW9ucylcbiAgICAgIH1gO1xuICAgIH0sXG4gIH0gYXMgdW5rbm93bikgYXMgUm91dGVyQ29udGV4dDxSLCBQLCBTPjtcbn1cblxuLyoqIENyZWF0ZXMgYSBtb2NrIGBuZXh0KClgIGZ1bmN0aW9uIHdoaWNoIGNhbiBiZSB1c2VkIHdoZW4gY2FsbGluZ1xuICogbWlkZGxld2FyZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVNb2NrTmV4dCgpIHtcbiAgcmV0dXJuIGFzeW5jIGZ1bmN0aW9uIG5leHQoKSB7fTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSx5RUFBeUU7QUFFekUsd0NBQXdDO0FBRXhDOzs7OztDQUtDLEdBR0QsU0FDRSxPQUFPLEVBQ1AsZUFBZSxFQUVmLGVBQWUsUUFDVixZQUFZO0FBR25CLFNBQVMsUUFBUSxRQUFRLGdCQUFnQjtBQUV6QyxxQ0FBcUMsR0FDckMsT0FBTyxTQUFTLGNBR2QsUUFBUSxDQUFDLENBQU07SUFFZixNQUFNLE1BQU07UUFDVjtRQUNBO1lBQ0UsT0FBTztRQUNUO1FBQ0EsQ0FBQyxPQUFPLElBQUksc0JBQXNCO1lBQ2hDLE9BQU87UUFDVDtRQUNBLENBQUMsT0FBTyxJQUFJLDhCQUE4QixFQUN4QyxLQUFhLEVBQ2IsT0FBWSxFQUNaLE9BQXNEO1lBRXRELElBQUksUUFBUSxHQUFHO2dCQUNiLE9BQU8sUUFBUSxRQUFRLENBQUMsaUJBQWlCLENBQUMsRUFBRTtZQUM5QztZQUVBLE1BQU0sYUFBYSxPQUFPLE9BQU8sQ0FBQyxHQUFHLFNBQVM7Z0JBQzVDLE9BQU8sUUFBUSxVQUFVLE9BQU8sT0FBTyxRQUFRLFFB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