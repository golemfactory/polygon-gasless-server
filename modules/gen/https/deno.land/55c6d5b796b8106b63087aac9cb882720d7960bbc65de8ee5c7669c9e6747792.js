import { Cors } from "./cors.ts";
/**
 * opineCors middleware wrapper
 * @param o CorsOptions | CorsOptionsDelegate
 * @link https://github.com/tajpouria/cors/blob/master/README.md#cors
 */ export const opineCors = (o)=>{
    const corsOptionsDelegate = Cors.produceCorsOptionsDelegate(o);
    return async (request, response, next)=>{
        try {
            const options = await corsOptionsDelegate(request);
            const corsOptions = Cors.produceCorsOptions(options || {});
            const originDelegate = Cors.produceOriginDelegate(corsOptions);
            if (originDelegate) {
                const requestMethod = request.method;
                const getRequestHeader = (headerKey)=>request.headers.get(headerKey);
                const getResponseHeader = (headerKey)=>response.get(headerKey);
                const setResponseHeader = (headerKey, headerValue)=>response.set(headerKey, headerValue);
                const setStatus = (statusCode)=>response.setStatus(statusCode);
                const end = ()=>response.end();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY29yc0B2MS4yLjIvb3BpbmVDb3JzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgQ29yc09wdGlvbnMsIENvcnNPcHRpb25zRGVsZWdhdGUgfSBmcm9tIFwiLi90eXBlcy50c1wiO1xuaW1wb3J0IHsgQ29ycyB9IGZyb20gXCIuL2NvcnMudHNcIjtcblxuaW50ZXJmYWNlIFJlcSB7XG4gIG1ldGhvZDogc3RyaW5nO1xuICBoZWFkZXJzOiB7XG4gICAgZ2V0KG5hbWU6IHN0cmluZyk6IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQ7XG4gIH07XG59XG5cbmludGVyZmFjZSBSZXMge1xuICBzZXRTdGF0dXMoY29kZTogYW55KTogdGhpcztcbiAgc2V0KGhlYWRlcktleTogc3RyaW5nLCBoZWFkZXJWYWx1ZTogc3RyaW5nKTogdGhpcztcbiAgZ2V0KGhlYWRlcktleTogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZDtcbiAgZW5kKC4uLmFyZ3M6IGFueSk6IGFueTtcbn1cblxuLyoqXG4gKiBvcGluZUNvcnMgbWlkZGxld2FyZSB3cmFwcGVyXG4gKiBAcGFyYW0gbyBDb3JzT3B0aW9ucyB8IENvcnNPcHRpb25zRGVsZWdhdGVcbiAqIEBsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS90YWpwb3VyaWEvY29ycy9ibG9iL21hc3Rlci9SRUFETUUubWQjY29yc1xuICovXG5leHBvcnQgY29uc3Qgb3BpbmVDb3JzID0gPFxuICBSZXF1ZXN0VCBleHRlbmRzIFJlcSA9IFJlcSxcbiAgUmVzcG9uc2VUIGV4dGVuZHMgUmVzID0gYW55LFxuICBNaWRkbGV3YXJlVCBleHRlbmRzIChcbiAgICByZXF1ZXN0OiBSZXF1ZXN0VCxcbiAgICByZXNwb25zZTogUmVzcG9uc2VULFxuICAgIG5leHQ6ICguLi5hcmdzOiBhbnkpID0+IGFueSxcbiAgKSA9PiBhbnkgPSBhbnksXG4+KFxuICBvPzogQ29yc09wdGlvbnMgfCBDb3JzT3B0aW9uc0RlbGVnYXRlPFJlcXVlc3RUPixcbikgPT4ge1xuICBjb25zdCBjb3JzT3B0aW9uc0RlbGVnYXRlID0gQ29ycy5wcm9kdWNlQ29yc09wdGlvbnNEZWxlZ2F0ZTxcbiAgICBDb3JzT3B0aW9uc0RlbGVnYXRlPFJlcXVlc3RUPlxuICA+KG8pO1xuXG4gIHJldHVybiAoYXN5bmMgKHJlcXVlc3QsIHJlc3BvbnNlLCBuZXh0KSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IG9wdGlvbnMgPSBhd2FpdCBjb3JzT3B0aW9uc0RlbGVnYXRlKHJlcXVlc3QpO1xuXG4gICAgICBjb25zdCBjb3JzT3B0aW9ucyA9IENvcnMucHJvZHVjZUNvcnNPcHRpb25zKG9wdGlvbnMgfHwge30pO1xuICAgICAgY29uc3Qgb3JpZ2luRGVsZWdhdGUgPSBDb3JzLnByb2R1Y2VPcmlnaW5EZWxlZ2F0ZShjb3JzT3B0aW9ucyk7XG5cbiAgICAgIGlmIChvcmlnaW5EZWxlZ2F0ZSkge1xuICAgICAgICBjb25zdCByZXF1ZXN0TWV0aG9kID0gcmVxdWVzdC5tZXRob2Q7XG4gICAgICAgIGNvbnN0IGdldFJlcXVlc3RIZWFkZXIgPSAoaGVhZGVyS2V5OiBzdHJpbmcpID0+XG4gICAgICAgICAgcmVxdWVzdC5oZWFkZXJzLmdldChoZWFkZXJLZXkpO1xuICAgICAgICBjb25zdCBnZXRSZXNwb25zZUhlYWRlciA9IChoZWFkZXJLZXk6IHN0cmluZykgPT5cbiAgICAgICAgICByZXNwb25zZS5nZXQoaGVhZGVyS2V5KTtcbiAgICAgICAgY29uc3Qgc2V0UmVzcG9uc2VIZWFkZXIgPSAoaGVhZGVyS2V5OiBzdHJpbmcsIGhlYWRlclZhbHVlOiBzdHJpbmcpID0+XG4gICAgICAgICAgcmVzcG9uc2Uuc2V0KGhlYWRlcktleSwgaGVhZGVyVmFsdWUpO1xuICAgICAgICBjb25zdCBzZXRTdGF0dXMgPSAoc3RhdHVzQ29kZTogbnVtYmVyKSA9PlxuICAgICAgICAgIHJlc3BvbnNlLnNldFN0YXR1cyhzdGF0dXNDb2RlKTtcbiAgICAgICAgY29uc3QgZW5kID0gKCkgPT4gcmVzcG9uc2UuZW5kKCk7XG5cbiAgICAgICAgY29uc3Qgb3JpZ2luID0gYXdhaXQgb3JpZ2luRGVsZWdhdGUoZ2V0UmVxdWVzdEhlYWRlcihcIm9yaWdpblwiKSk7XG5cbiAgICAgICAgaWYgKCFvcmlnaW4pIHJldHVybiBuZXh0KCk7XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGNvcnNPcHRpb25zLm9yaWdpbiA9IG9yaWdpbjtcblxuICAgICAgICAgIHJldHVybiBuZXcgQ29ycyh7XG4gICAgICAgICAgICBjb3JzT3B0aW9ucyxcbiAgICAgICAgICAgIHJlcXVlc3RNZXRob2QsXG4gICAgICAgICAgICBnZXRSZXF1ZXN0SGVhZGVyLFxuICAgICAgICAgICAgZ2V0UmVzcG9uc2VIZWFkZXIsXG4gICAgICAgICAgICBzZXRSZXNwb25zZUhlYWRlcixcbiAgICAgICAgICAgIHNldFN0YXR1cyxcbiAgICAgICAgICAgIG5leHQsXG4gICAgICAgICAgICBlbmQsXG4gICAgICAgICAgfSkuY29uZmlndXJlSGVhZGVycygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXh0KCk7XG4gIH0pIGFzIE1pZGRsZXdhcmVUO1xufTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxTQUFTLElBQUksUUFBUSxZQUFZO0FBZ0JqQzs7OztDQUlDLEdBQ0QsT0FBTyxNQUFNLFlBQVksQ0FTdkI7SUFFQSxNQUFNLHNCQUFzQixLQUFLLDJCQUUvQjtJQUVGLE9BQVEsT0FBTyxTQUFTLFVBQVU7UUFDaEMsSUFBSTtZQUNGLE1BQU0sVUFBVSxNQUFNLG9CQUFvQjtZQUUxQyxNQUFNLGNBQWMsS0FBSyxtQkFBbUIsV0FBVyxDQUFDO1lBQ3hELE1BQU0saUJBQWlCLEtBQUssc0JBQXNCO1lBRWxELElBQUksZ0JBQWdCO2dCQUNsQixNQUFNLGdCQUFnQixRQUFRO2dCQUM5QixNQUFNLG1CQUFtQixDQUFDLFlBQ3hCLFFBQVEsUUFBUSxJQUFJO2dCQUN0QixNQUFNLG9CQUFvQixDQUFDLFlBQ3pCLFNBQVMsSUFBSTtnQkFDZixNQUFNLG9CQUFvQixDQUFDLFdBQW1CLGNBQzVDLFNBQVMsSUFBSSxXQUFXO2dCQUMxQixNQUFNLFlBQVksQ0FBQyxhQUNqQixTQUFTLFVBQVU7Z0JBQ3JCLE1BQU0sTUFBTSxJQUFNLFNBQVM7Z0JBRTNCLE1BQU0sU0FBUyxNQUFNLGVBQWUsaUJBQWlCO2dCQUVyRCxJQUFJLENBQUMsUUFBUSxPQUFPO3FCQUNmO29CQUNILFlBQVksU0FBUztvQkFFckIsT0FBTyxJQUFJLEtBQUs7d0JBQ2Q7d0JBQ0E7d0JBQ0E7d0JBQ0E7d0JBQ0E7d0JBQ0E7d0JBQ0E7d0JBQ0E7b0JBQ0YsR0FBRztnQkFDTDtZQUNGO1FBQ0YsRUFBRSxPQUFPLE9BQU87WUFDZCxRQUFRLE1BQU07UUFDaEI7UUFFQSxPQUFPO0lBQ1Q7QUFDRixFQUFFIn0=