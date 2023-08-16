import { Cors } from "./cors.ts";
/**
 * mithCors middleware wrapper
 * @param o CorsOptions | CorsOptionsDelegate
 * @link https://github.com/tajpouria/cors/blob/master/README.md#cors
 */ export const mithCors = (o)=>{
    const corsOptionsDelegate = Cors.produceCorsOptionsDelegate(o);
    return async (request, response, next)=>{
        const serverRequest = request.serverRequest;
        try {
            const options = await corsOptionsDelegate(request);
            const corsOptions = Cors.produceCorsOptions(options || {});
            const originDelegate = Cors.produceOriginDelegate(corsOptions);
            if (originDelegate) {
                const requestMethod = serverRequest.method;
                const getRequestHeader = (headerKey)=>serverRequest.headers.get(headerKey);
                const getResponseHeader = (headerKey)=>response.headers.get(headerKey);
                const setResponseHeader = (headerKey, headerValue)=>response.headers.set(headerKey, headerValue);
                const setStatus = (statusCode)=>response.status = statusCode;
                const end = ()=>{};
                const origin = await originDelegate(getRequestHeader("origin"));
                if (!origin) return next();
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
        return next();
    };
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY29yc0B2MS4yLjIvbWl0aENvcnMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBDb3JzT3B0aW9ucywgQ29yc09wdGlvbnNEZWxlZ2F0ZSB9IGZyb20gXCIuL3R5cGVzLnRzXCI7XG5pbXBvcnQgeyBDb3JzIH0gZnJvbSBcIi4vY29ycy50c1wiO1xuXG5pbnRlcmZhY2UgUmVxIHtcbiAgc2VydmVyUmVxdWVzdDoge1xuICAgIG1ldGhvZDogc3RyaW5nO1xuICAgIGhlYWRlcnM6IHtcbiAgICAgIGdldChoZWFkZXJLZXk6IHN0cmluZyk6IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQ7XG4gICAgfTtcbiAgfTtcbn1cblxuaW50ZXJmYWNlIFJlcyB7XG4gIHN0YXR1cz86IG51bWJlciB8IHN0cmluZztcbiAgaGVhZGVyczoge1xuICAgIGdldChoZWFkZXJLZXk6IHN0cmluZyk6IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQ7XG4gICAgc2V0KGhlYWRlcktleTogc3RyaW5nLCBoZWFkZXJWYWx1ZTogc3RyaW5nKTogYW55O1xuICB9O1xufVxuXG4vKipcbiAqIG1pdGhDb3JzIG1pZGRsZXdhcmUgd3JhcHBlclxuICogQHBhcmFtIG8gQ29yc09wdGlvbnMgfCBDb3JzT3B0aW9uc0RlbGVnYXRlXG4gKiBAbGluayBodHRwczovL2dpdGh1Yi5jb20vdGFqcG91cmlhL2NvcnMvYmxvYi9tYXN0ZXIvUkVBRE1FLm1kI2NvcnNcbiAqL1xuZXhwb3J0IGNvbnN0IG1pdGhDb3JzID0gPFxuICBSZXF1ZXN0VCBleHRlbmRzIFJlcSA9IGFueSxcbiAgUmVzcG9uc2VUIGV4dGVuZHMgUmVzID0gYW55LFxuICBNaWRkbGV3YXJlVCBleHRlbmRzIChcbiAgICByZXF1ZXN0OiBSZXF1ZXN0VCxcbiAgICByZXNwb25zZTogUmVzcG9uc2VULFxuICAgIG5leHQ6ICguLi5hcmdzOiBhbnkpID0+IGFueSxcbiAgKSA9PiBhbnkgPSBhbnksXG4+KFxuICBvPzogQ29yc09wdGlvbnMgfCBDb3JzT3B0aW9uc0RlbGVnYXRlPFJlcXVlc3RUPixcbikgPT4ge1xuICBjb25zdCBjb3JzT3B0aW9uc0RlbGVnYXRlID0gQ29ycy5wcm9kdWNlQ29yc09wdGlvbnNEZWxlZ2F0ZTxcbiAgICBDb3JzT3B0aW9uc0RlbGVnYXRlPFJlcXVlc3RUPlxuICA+KG8pO1xuXG4gIHJldHVybiAoYXN5bmMgKHJlcXVlc3QsIHJlc3BvbnNlLCBuZXh0KSA9PiB7XG4gICAgY29uc3Qgc2VydmVyUmVxdWVzdCA9IHJlcXVlc3Quc2VydmVyUmVxdWVzdDtcbiAgICB0cnkge1xuICAgICAgY29uc3Qgb3B0aW9ucyA9IGF3YWl0IGNvcnNPcHRpb25zRGVsZWdhdGUocmVxdWVzdCk7XG5cbiAgICAgIGNvbnN0IGNvcnNPcHRpb25zID0gQ29ycy5wcm9kdWNlQ29yc09wdGlvbnMob3B0aW9ucyB8fCB7fSk7XG4gICAgICBjb25zdCBvcmlnaW5EZWxlZ2F0ZSA9IENvcnMucHJvZHVjZU9yaWdpbkRlbGVnYXRlKGNvcnNPcHRpb25zKTtcblxuICAgICAgaWYgKG9yaWdpbkRlbGVnYXRlKSB7XG4gICAgICAgIGNvbnN0IHJlcXVlc3RNZXRob2QgPSBzZXJ2ZXJSZXF1ZXN0Lm1ldGhvZDtcbiAgICAgICAgY29uc3QgZ2V0UmVxdWVzdEhlYWRlciA9IChoZWFkZXJLZXk6IHN0cmluZykgPT5cbiAgICAgICAgICBzZXJ2ZXJSZXF1ZXN0LmhlYWRlcnMuZ2V0KGhlYWRlcktleSk7XG4gICAgICAgIGNvbnN0IGdldFJlc3BvbnNlSGVhZGVyID0gKGhlYWRlcktleTogc3RyaW5nKSA9PlxuICAgICAgICAgIHJlc3BvbnNlLmhlYWRlcnMuZ2V0KGhlYWRlcktleSk7XG4gICAgICAgIGNvbnN0IHNldFJlc3BvbnNlSGVhZGVyID0gKGhlYWRlcktleTogc3RyaW5nLCBoZWFkZXJWYWx1ZTogc3RyaW5nKSA9PlxuICAgICAgICAgIHJlc3BvbnNlLmhlYWRlcnMuc2V0KGhlYWRlcktleSwgaGVhZGVyVmFsdWUpO1xuICAgICAgICBjb25zdCBzZXRTdGF0dXMgPSAoXG4gICAgICAgICAgc3RhdHVzQ29kZTogbnVtYmVyLFxuICAgICAgICApID0+IChyZXNwb25zZS5zdGF0dXMgPSBzdGF0dXNDb2RlKTtcbiAgICAgICAgY29uc3QgZW5kID0gKCkgPT4ge307XG5cbiAgICAgICAgY29uc3Qgb3JpZ2luID0gYXdhaXQgb3JpZ2luRGVsZWdhdGUoZ2V0UmVxdWVzdEhlYWRlcihcIm9yaWdpblwiKSk7XG5cbiAgICAgICAgaWYgKCFvcmlnaW4pIHJldHVybiBuZXh0KCk7XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGNvcnNPcHRpb25zLm9yaWdpbiA9IG9yaWdpbjtcblxuICAgICAgICAgIHJldHVybiBuZXcgQ29ycyh7XG4gICAgICAgICAgICBjb3JzT3B0aW9ucyxcbiAgICAgICAgICAgIHJlcXVlc3RNZXRob2QsXG4gICAgICAgICAgICBnZXRSZXF1ZXN0SGVhZGVyLFxuICAgICAgICAgICAgZ2V0UmVzcG9uc2VIZWFkZXIsXG4gICAgICAgICAgICBzZXRSZXNwb25zZUhlYWRlcixcbiAgICAgICAgICAgIHNldFN0YXR1cyxcbiAgICAgICAgICAgIG5leHQsXG4gICAgICAgICAgICBlbmQsXG4gICAgICAgICAgfSkuY29uZmlndXJlSGVhZGVycygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXh0KCk7XG4gIH0pIGFzIE1pZGRsZXdhcmVUO1xufTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxTQUFTLElBQUksUUFBUSxZQUFZO0FBbUJqQzs7OztDQUlDLEdBQ0QsT0FBTyxNQUFNLFdBQVcsQ0FTdEI7SUFFQSxNQUFNLHNCQUFzQixLQUFLLDJCQUUvQjtJQUVGLE9BQVEsT0FBTyxTQUFTLFVBQVU7UUFDaEMsTUFBTSxnQkFBZ0IsUUFBUTtRQUM5QixJQUFJO1lBQ0YsTUFBTSxVQUFVLE1BQU0sb0JBQW9CO1lBRTFDLE1BQU0sY0FBYyxLQUFLLG1CQUFtQixXQUFXLENBQUM7WUFDeEQsTUFBTSxpQkFBaUIsS0FBSyxzQkFBc0I7WUFFbEQsSUFBSSxnQkFBZ0I7Z0JBQ2xCLE1BQU0sZ0JBQWdCLGNBQWM7Z0JBQ3BDLE1BQU0sbUJBQW1CLENBQUMsWUFDeEIsY0FBYyxRQUFRLElBQUk7Z0JBQzVCLE1BQU0sb0JBQW9CLENBQUMsWUFDekIsU0FBUyxRQUFRLElBQUk7Z0JBQ3ZCLE1BQU0sb0JBQW9CLENBQUMsV0FBbUIsY0FDNUMsU0FBUyxRQUFRLElBQUksV0FBVztnQkFDbEMsTUFBTSxZQUFZLENBQ2hCLGFBQ0ksU0FBUyxTQUFTO2dCQUN4QixNQUFNLE1BQU0sS0FBTztnQkFFbkIsTUFBTSxTQUFTLE1BQU0sZUFBZSxpQkFBaUI7Z0JBRXJELElBQUksQ0FBQyxRQUFRLE9BQU87cUJBQ2Y7b0JBQ0gsWUFBWSxTQUFTO29CQUVyQixPQUFPLElBQUksS0FBSzt3QkFDZDt3QkFDQTt3QkFDQTt3QkFDQTt3QkFDQTt3QkFDQTt3QkFDQTt3QkFDQTtvQkFDRixHQUFHO2dCQUNMO1lBQ0Y7UUFDRixFQUFFLE9BQU8sT0FBTztZQUNkLFFBQVEsTUFBTTtRQUNoQjtRQUVBLE9BQU87SUFDVDtBQUNGLEVBQUUifQ==