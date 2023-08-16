import { Cors } from "./cors.ts";
/**
 * oakCors middleware wrapper
 * @param o CorsOptions | CorsOptionsDelegate
 * @link https://github.com/tajpouria/cors/blob/master/README.md#cors
 */ export const oakCors = (o)=>{
    const corsOptionsDelegate = Cors.produceCorsOptionsDelegate(o);
    return async ({ request , response  }, next)=>{
        try {
            const options = await corsOptionsDelegate(request);
            const corsOptions = Cors.produceCorsOptions(options || {});
            const originDelegate = Cors.produceOriginDelegate(corsOptions);
            if (originDelegate) {
                const requestMethod = request.method;
                const getRequestHeader = (headerKey)=>request.headers.get(headerKey);
                const getResponseHeader = (headerKey)=>response.headers.get(headerKey);
                const setResponseHeader = (headerKey, headerValue)=>response.headers.set(headerKey, headerValue);
                const setStatus = (statusCode)=>response.status = statusCode;
                const end = ()=>{};
                const origin = await originDelegate(getRequestHeader("origin"));
                if (!origin) next();
                else {
                    corsOptions.origin = origin;
                    return new Cors({
                        corsOptions,
                        requestMethod,
                        getRequestHeader,
                        getResponseHeader,
                        setResponseHeader,
                        setStatus,
                        next,
                        end
                    }).configureHeaders();
                }
            }
        } catch (error) {
            console.error(error);
        }
        next();
    };
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY29yc0B2MS4yLjIvb2FrQ29ycy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IENvcnNPcHRpb25zLCBDb3JzT3B0aW9uc0RlbGVnYXRlIH0gZnJvbSBcIi4vdHlwZXMudHNcIjtcbmltcG9ydCB7IENvcnMgfSBmcm9tIFwiLi9jb3JzLnRzXCI7XG5cbmludGVyZmFjZSBSZXEge1xuICBtZXRob2Q6IHN0cmluZztcbiAgaGVhZGVyczoge1xuICAgIGdldChoZWFkZXJLZXk6IHN0cmluZyk6IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQ7XG4gIH07XG59XG5cbmludGVyZmFjZSBSZXMge1xuICBzdGF0dXM/OiBudW1iZXIgfCBzdHJpbmc7XG4gIGhlYWRlcnM6IHtcbiAgICBnZXQoaGVhZGVyS2V5OiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkO1xuICAgIHNldChoZWFkZXJLZXk6IHN0cmluZywgaGVhZGVyVmFsdWU6IHN0cmluZyk6IGFueTtcbiAgfTtcbn1cblxuLyoqXG4gKiBvYWtDb3JzIG1pZGRsZXdhcmUgd3JhcHBlclxuICogQHBhcmFtIG8gQ29yc09wdGlvbnMgfCBDb3JzT3B0aW9uc0RlbGVnYXRlXG4gKiBAbGluayBodHRwczovL2dpdGh1Yi5jb20vdGFqcG91cmlhL2NvcnMvYmxvYi9tYXN0ZXIvUkVBRE1FLm1kI2NvcnNcbiAqL1xuZXhwb3J0IGNvbnN0IG9ha0NvcnMgPSA8XG4gIFJlcXVlc3RUIGV4dGVuZHMgUmVxID0gYW55LFxuICBSZXNwb25zZVQgZXh0ZW5kcyBSZXMgPSBhbnksXG4gIE1pZGRsZXdhcmVUIGV4dGVuZHMgKFxuICAgIGNvbnRleHQ6IHsgcmVxdWVzdDogUmVxdWVzdFQ7IHJlc3BvbnNlOiBSZXNwb25zZVQgfSxcbiAgICBuZXh0OiAoLi4uYXJnczogYW55KSA9PiBhbnksXG4gICkgPT4gYW55ID0gYW55LFxuPihcbiAgbz86IENvcnNPcHRpb25zIHwgQ29yc09wdGlvbnNEZWxlZ2F0ZTxSZXF1ZXN0VD4sXG4pID0+IHtcbiAgY29uc3QgY29yc09wdGlvbnNEZWxlZ2F0ZSA9IENvcnMucHJvZHVjZUNvcnNPcHRpb25zRGVsZWdhdGU8XG4gICAgQ29yc09wdGlvbnNEZWxlZ2F0ZTxSZXF1ZXN0VD5cbiAgPihvKTtcblxuICByZXR1cm4gKGFzeW5jICh7IHJlcXVlc3QsIHJlc3BvbnNlIH0sIG5leHQpID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3Qgb3B0aW9ucyA9IGF3YWl0IGNvcnNPcHRpb25zRGVsZWdhdGUocmVxdWVzdCk7XG5cbiAgICAgIGNvbnN0IGNvcnNPcHRpb25zID0gQ29ycy5wcm9kdWNlQ29yc09wdGlvbnMob3B0aW9ucyB8fCB7fSk7XG4gICAgICBjb25zdCBvcmlnaW5EZWxlZ2F0ZSA9IENvcnMucHJvZHVjZU9yaWdpbkRlbGVnYXRlKGNvcnNPcHRpb25zKTtcblxuICAgICAgaWYgKG9yaWdpbkRlbGVnYXRlKSB7XG4gICAgICAgIGNvbnN0IHJlcXVlc3RNZXRob2QgPSByZXF1ZXN0Lm1ldGhvZDtcbiAgICAgICAgY29uc3QgZ2V0UmVxdWVzdEhlYWRlciA9IChoZWFkZXJLZXk6IHN0cmluZykgPT5cbiAgICAgICAgICByZXF1ZXN0LmhlYWRlcnMuZ2V0KGhlYWRlcktleSk7XG4gICAgICAgIGNvbnN0IGdldFJlc3BvbnNlSGVhZGVyID0gKGhlYWRlcktleTogc3RyaW5nKSA9PlxuICAgICAgICAgIHJlc3BvbnNlLmhlYWRlcnMuZ2V0KGhlYWRlcktleSk7XG4gICAgICAgIGNvbnN0IHNldFJlc3BvbnNlSGVhZGVyID0gKGhlYWRlcktleTogc3RyaW5nLCBoZWFkZXJWYWx1ZTogc3RyaW5nKSA9PlxuICAgICAgICAgIHJlc3BvbnNlLmhlYWRlcnMuc2V0KGhlYWRlcktleSwgaGVhZGVyVmFsdWUpO1xuICAgICAgICBjb25zdCBzZXRTdGF0dXMgPSAoXG4gICAgICAgICAgc3RhdHVzQ29kZTogbnVtYmVyLFxuICAgICAgICApID0+IChyZXNwb25zZS5zdGF0dXMgPSBzdGF0dXNDb2RlKTtcbiAgICAgICAgY29uc3QgZW5kID0gKCkgPT4ge307XG5cbiAgICAgICAgY29uc3Qgb3JpZ2luID0gYXdhaXQgb3JpZ2luRGVsZWdhdGUoZ2V0UmVxdWVzdEhlYWRlcihcIm9yaWdpblwiKSk7XG5cbiAgICAgICAgaWYgKCFvcmlnaW4pIG5leHQoKTtcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgY29yc09wdGlvbnMub3JpZ2luID0gb3JpZ2luO1xuXG4gICAgICAgICAgcmV0dXJuIG5ldyBDb3JzKHtcbiAgICAgICAgICAgIGNvcnNPcHRpb25zLFxuICAgICAgICAgICAgcmVxdWVzdE1ldGhvZCxcbiAgICAgICAgICAgIGdldFJlcXVlc3RIZWFkZXIsXG4gICAgICAgICAgICBnZXRSZXNwb25zZUhlYWRlcixcbiAgICAgICAgICAgIHNldFJlc3BvbnNlSGVhZGVyLFxuICAgICAgICAgICAgc2V0U3RhdHVzLFxuICAgICAgICAgICAgbmV4dCxcbiAgICAgICAgICAgIGVuZCxcbiAgICAgICAgICB9KS5jb25maWd1cmVIZWFkZXJzKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgfVxuXG4gICAgbmV4dCgpO1xuICB9KSBhcyBNaWRkbGV3YXJlVDtcbn07XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsU0FBUyxJQUFJLFFBQVEsWUFBWTtBQWlCakM7Ozs7Q0FJQyxHQUNELE9BQU8sTUFBTSxVQUFVLENBUXJCO0lBRUEsTUFBTSxzQkFBc0IsS0FBSywyQkFFL0I7SUFFRixPQUFRLE9BQU8sRUFBRSxRQUFPLEVBQUUsU0FBUSxFQUFFLEVBQUU7UUFDcEMsSUFBSTtZQUNGLE1BQU0sVUFBVSxNQUFNLG9CQUFvQjtZQUUxQyxNQUFNLGNBQWMsS0FBSyxtQkFBbUIsV0FBVyxDQUFDO1lBQ3hELE1BQU0saUJBQWlCLEtBQUssc0JBQXNCO1lBRWxELElBQUksZ0JBQWdCO2dCQUNsQixNQUFNLGdCQUFnQixRQUFRO2dCQUM5QixNQUFNLG1CQUFtQixDQUFDLFlBQ3hCLFFBQVEsUUFBUSxJQUFJO2dCQUN0QixNQUFNLG9CQUFvQixDQUFDLFlBQ3pCLFNBQVMsUUFBUSxJQUFJO2dCQUN2QixNQUFNLG9CQUFvQixDQUFDLFdBQW1CLGNBQzVDLFNBQVMsUUFBUSxJQUFJLFdBQVc7Z0JBQ2xDLE1BQU0sWUFBWSxDQUNoQixhQUNJLFNBQVMsU0FBUztnQkFDeEIsTUFBTSxNQUFNLEtBQU87Z0JBRW5CLE1BQU0sU0FBUyxNQUFNLGVBQWUsaUJBQWlCO2dCQUVyRCxJQUFJLENBQUMsUUFBUTtxQkFDUjtvQkFDSCxZQUFZLFNBQVM7b0JBRXJCLE9BQU8sSUFBSSxLQUFLO3dCQUNkO3dCQUNBO3dCQUNBO3dCQUNBO3dCQUNBO3dCQUNBO3dCQUNBO3dCQUNBO29CQUNGLEdBQUc7Z0JBQ0w7WUFDRjtRQUNGLEVBQUUsT0FBTyxPQUFPO1lBQ2QsUUFBUSxNQUFNO1FBQ2hCO1FBRUE7SUFDRjtBQUNGLEVBQUUifQ==