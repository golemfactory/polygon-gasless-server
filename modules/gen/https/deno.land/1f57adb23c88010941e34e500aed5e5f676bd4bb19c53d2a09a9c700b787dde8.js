// Copyright 2018-2023 the oak authors. All rights reserved. MIT license.
/**
 * A collection of oak specific APIs for management of ETags.
 *
 * @module
 */ import { calculate } from "./deps.ts";
import { BODY_TYPES, isAsyncIterable, isReader } from "./util.ts";
// re-exports to maintain backwards compatibility
export { calculate, ifMatch, ifNoneMatch } from "./deps.ts";
function fstat(file) {
    if ("fstat" in Deno) {
        // deno-lint-ignore no-explicit-any
        return Deno.fstat(file.rid);
    }
    return Promise.resolve(undefined);
}
/** For a given Context, try to determine the response body entity that an ETag
 * can be calculated from. */ // deno-lint-ignore no-explicit-any
export function getEntity(context) {
    const { body  } = context.response;
    if (body instanceof Deno.FsFile) {
        return fstat(body);
    }
    if (body instanceof Uint8Array) {
        return Promise.resolve(body);
    }
    if (BODY_TYPES.includes(typeof body)) {
        return Promise.resolve(String(body));
    }
    if (isAsyncIterable(body) || isReader(body)) {
        return Promise.resolve(undefined);
    }
    if (typeof body === "object" && body !== null) {
        try {
            const bodyText = JSON.stringify(body);
            return Promise.resolve(bodyText);
        } catch  {
        // We don't really care about errors here
        }
    }
    return Promise.resolve(undefined);
}
/**
 * Create middleware that will attempt to decode the response.body into
 * something that can be used to generate an `ETag` and add the `ETag` header to
 * the response.
 */ // deno-lint-ignore no-explicit-any
export function factory(options) {
    return async function etag(context, next) {
        await next();
        if (!context.response.headers.has("ETag")) {
            const entity = await getEntity(context);
            if (entity) {
                const etag = await calculate(entity, options);
                if (etag) {
                    context.response.headers.set("ETag", etag);
                }
            }
        }
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvb2FrQHYxMi42LjAvZXRhZy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIzIHRoZSBvYWsgYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG5cbi8qKlxuICogQSBjb2xsZWN0aW9uIG9mIG9hayBzcGVjaWZpYyBBUElzIGZvciBtYW5hZ2VtZW50IG9mIEVUYWdzLlxuICpcbiAqIEBtb2R1bGVcbiAqL1xuXG5pbXBvcnQgdHlwZSB7IFN0YXRlIH0gZnJvbSBcIi4vYXBwbGljYXRpb24udHNcIjtcbmltcG9ydCB0eXBlIHsgQ29udGV4dCB9IGZyb20gXCIuL2NvbnRleHQudHNcIjtcbmltcG9ydCB7IGNhbGN1bGF0ZSwgdHlwZSBFVGFnT3B0aW9ucyB9IGZyb20gXCIuL2RlcHMudHNcIjtcbmltcG9ydCB0eXBlIHsgTWlkZGxld2FyZSB9IGZyb20gXCIuL21pZGRsZXdhcmUudHNcIjtcbmltcG9ydCB7IEJPRFlfVFlQRVMsIGlzQXN5bmNJdGVyYWJsZSwgaXNSZWFkZXIgfSBmcm9tIFwiLi91dGlsLnRzXCI7XG5cbi8vIHJlLWV4cG9ydHMgdG8gbWFpbnRhaW4gYmFja3dhcmRzIGNvbXBhdGliaWxpdHlcbmV4cG9ydCB7XG4gIGNhbGN1bGF0ZSxcbiAgdHlwZSBFVGFnT3B0aW9ucyxcbiAgdHlwZSBGaWxlSW5mbyxcbiAgaWZNYXRjaCxcbiAgaWZOb25lTWF0Y2gsXG59IGZyb20gXCIuL2RlcHMudHNcIjtcblxuZnVuY3Rpb24gZnN0YXQoZmlsZTogRGVuby5Gc0ZpbGUpOiBQcm9taXNlPERlbm8uRmlsZUluZm8gfCB1bmRlZmluZWQ+IHtcbiAgaWYgKFwiZnN0YXRcIiBpbiBEZW5vKSB7XG4gICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICByZXR1cm4gKERlbm8gYXMgYW55KS5mc3RhdChmaWxlLnJpZCk7XG4gIH1cbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xufVxuXG4vKiogRm9yIGEgZ2l2ZW4gQ29udGV4dCwgdHJ5IHRvIGRldGVybWluZSB0aGUgcmVzcG9uc2UgYm9keSBlbnRpdHkgdGhhdCBhbiBFVGFnXG4gKiBjYW4gYmUgY2FsY3VsYXRlZCBmcm9tLiAqL1xuLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbmV4cG9ydCBmdW5jdGlvbiBnZXRFbnRpdHk8UyBleHRlbmRzIFN0YXRlID0gUmVjb3JkPHN0cmluZywgYW55Pj4oXG4gIGNvbnRleHQ6IENvbnRleHQ8Uz4sXG4pOiBQcm9taXNlPHN0cmluZyB8IFVpbnQ4QXJyYXkgfCBEZW5vLkZpbGVJbmZvIHwgdW5kZWZpbmVkPiB7XG4gIGNvbnN0IHsgYm9keSB9ID0gY29udGV4dC5yZXNwb25zZTtcbiAgaWYgKGJvZHkgaW5zdGFuY2VvZiBEZW5vLkZzRmlsZSkge1xuICAgIHJldHVybiBmc3RhdChib2R5KTtcbiAgfVxuICBpZiAoYm9keSBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGJvZHkpO1xuICB9XG4gIGlmIChCT0RZX1RZUEVTLmluY2x1ZGVzKHR5cGVvZiBib2R5KSkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoU3RyaW5nKGJvZHkpKTtcbiAgfVxuICBpZiAoaXNBc3luY0l0ZXJhYmxlKGJvZHkpIHx8IGlzUmVhZGVyKGJvZHkpKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xuICB9XG4gIGlmICh0eXBlb2YgYm9keSA9PT0gXCJvYmplY3RcIiAmJiBib2R5ICE9PSBudWxsKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGJvZHlUZXh0ID0gSlNPTi5zdHJpbmdpZnkoYm9keSk7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGJvZHlUZXh0KTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIFdlIGRvbid0IHJlYWxseSBjYXJlIGFib3V0IGVycm9ycyBoZXJlXG4gICAgfVxuICB9XG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgbWlkZGxld2FyZSB0aGF0IHdpbGwgYXR0ZW1wdCB0byBkZWNvZGUgdGhlIHJlc3BvbnNlLmJvZHkgaW50b1xuICogc29tZXRoaW5nIHRoYXQgY2FuIGJlIHVzZWQgdG8gZ2VuZXJhdGUgYW4gYEVUYWdgIGFuZCBhZGQgdGhlIGBFVGFnYCBoZWFkZXIgdG9cbiAqIHRoZSByZXNwb25zZS5cbiAqL1xuLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbmV4cG9ydCBmdW5jdGlvbiBmYWN0b3J5PFMgZXh0ZW5kcyBTdGF0ZSA9IFJlY29yZDxzdHJpbmcsIGFueT4+KFxuICBvcHRpb25zPzogRVRhZ09wdGlvbnMsXG4pOiBNaWRkbGV3YXJlPFM+IHtcbiAgcmV0dXJuIGFzeW5jIGZ1bmN0aW9uIGV0YWcoY29udGV4dDogQ29udGV4dDxTPiwgbmV4dCkge1xuICAgIGF3YWl0IG5leHQoKTtcbiAgICBpZiAoIWNvbnRleHQucmVzcG9uc2UuaGVhZGVycy5oYXMoXCJFVGFnXCIpKSB7XG4gICAgICBjb25zdCBlbnRpdHkgPSBhd2FpdCBnZXRFbnRpdHkoY29udGV4dCk7XG4gICAgICBpZiAoZW50aXR5KSB7XG4gICAgICAgIGNvbnN0IGV0YWcgPSBhd2FpdCBjYWxjdWxhdGUoZW50aXR5LCBvcHRpb25zKTtcbiAgICAgICAgaWYgKGV0YWcpIHtcbiAgICAgICAgICBjb250ZXh0LnJlc3BvbnNlLmhlYWRlcnMuc2V0KFwiRVRhZ1wiLCBldGFnKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSx5RUFBeUU7QUFFekU7Ozs7Q0FJQyxHQUlELFNBQVMsU0FBUyxRQUEwQixZQUFZO0FBRXhELFNBQVMsVUFBVSxFQUFFLGVBQWUsRUFBRSxRQUFRLFFBQVEsWUFBWTtBQUVsRSxpREFBaUQ7QUFDakQsU0FDRSxTQUFTLEVBR1QsT0FBTyxFQUNQLFdBQVcsUUFDTixZQUFZO0FBRW5CLFNBQVMsTUFBTSxJQUFpQjtJQUM5QixJQUFJLFdBQVcsTUFBTTtRQUNuQixtQ0FBbUM7UUFDbkMsT0FBTyxBQUFDLEtBQWEsTUFBTSxLQUFLO0lBQ2xDO0lBQ0EsT0FBTyxRQUFRLFFBQVE7QUFDekI7QUFFQTsyQkFDMkIsR0FDM0IsbUNBQW1DO0FBQ25DLE9BQU8sU0FBUyxVQUNkLE9BQW1CO0lBRW5CLE1BQU0sRUFBRSxLQUFJLEVBQUUsR0FBRyxRQUFRO0lBQ3pCLElBQUksZ0JBQWdCLEtBQUssUUFBUTtRQUMvQixPQUFPLE1BQU07SUFDZjtJQUNBLElBQUksZ0JBQWdCLFlBQVk7UUFDOUIsT0FBTyxRQUFRLFFBQVE7SUFDekI7SUFDQSxJQUFJLFdBQVcsU0FBUyxPQUFPLE9BQU87UUFDcEMsT0FBTyxRQUFRLFFBQVEsT0FBTztJQUNoQztJQUNBLElBQUksZ0JBQWdCLFNBQVMsU0FBUyxPQUFPO1FBQzNDLE9BQU8sUUFBUSxRQUFRO0lBQ3pCO0lBQ0EsSUFBSSxPQUFPLFNBQVMsWUFBWSxTQUFTLE1BQU07UUFDN0MsSUFBSTtZQUNGLE1BQU0sV0FBVyxLQUFLLFVBQVU7WUFDaEMsT0FBTyxRQUFRLFFBQVE7UUFDekIsRUFBRSxPQUFNO1FBQ04seUNBQXlDO1FBQzNDO0lBQ0Y7SUFDQSxPQUFPLFFBQVEsUUFBUTtBQUN6QjtBQUVBOzs7O0NBSUMsR0FDRCxtQ0FBbUM7QUFDbkMsT0FBTyxTQUFTLFFBQ2QsT0FBcUI7SUFFckIsT0FBTyxlQUFlLEtBQUssT0FBbUIsRUFBRSxJQUFJO1FBQ2xELE1BQU07UUFDTixJQUFJLENBQUMsUUFBUSxTQUFTLFFBQVEsSUFBSSxTQUFTO1lBQ3pDLE1BQU0sU0FBUyxNQUFNLFVBQVU7WUFDL0IsSUFBSSxRQUFRO2dCQUNWLE1BQU0sT0FBTyxNQUFNLFVBQVUsUUFBUTtnQkFDckMsSUFBSSxNQUFNO29CQUNSLFFBQVEsU0FBUyxRQUFRLElBQUksUUFBUTtnQkFDdkM7WUFDRjtRQUNGO0lBQ0Y7QUFDRiJ9