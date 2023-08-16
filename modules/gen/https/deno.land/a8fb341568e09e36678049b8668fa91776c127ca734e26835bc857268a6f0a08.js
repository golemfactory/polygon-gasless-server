import { Cors } from "./cors.ts";
/**
 * abcCors middleware wrapper
 * @param o CorsOptions | CorsOptionsDelegate
 * @link https://github.com/tajpouria/cors/blob/master/README.md#cors
 */ export const abcCors = (o)=>{
    const corsOptionsDelegate = Cors.produceCorsOptionsDelegate(o);
    return (abcNext)=>async (context)=>{
            const next = ()=>abcNext(context);
            try {
                const { request , response  } = context;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY29yc0B2MS4yLjIvYWJjQ29ycy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IENvcnNPcHRpb25zLCBDb3JzT3B0aW9uc0RlbGVnYXRlIH0gZnJvbSBcIi4vdHlwZXMudHNcIjtcbmltcG9ydCB7IENvcnMgfSBmcm9tIFwiLi9jb3JzLnRzXCI7XG5cbmludGVyZmFjZSBSZXEge1xuICBtZXRob2Q6IHN0cmluZztcbiAgaGVhZGVyczoge1xuICAgIGdldChoZWFkZXJLZXk6IHN0cmluZyk6IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQ7XG4gIH07XG59XG5cbmludGVyZmFjZSBSZXMge1xuICBzdGF0dXM/OiBudW1iZXIgfCBzdHJpbmc7XG4gIGhlYWRlcnM6IHtcbiAgICBnZXQoaGVhZGVyS2V5OiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkO1xuICAgIHNldChoZWFkZXJLZXk6IHN0cmluZywgaGVhZGVyVmFsdWU6IHN0cmluZyk6IGFueTtcbiAgfTtcbn1cblxuLyoqXG4gKiBhYmNDb3JzIG1pZGRsZXdhcmUgd3JhcHBlclxuICogQHBhcmFtIG8gQ29yc09wdGlvbnMgfCBDb3JzT3B0aW9uc0RlbGVnYXRlXG4gKiBAbGluayBodHRwczovL2dpdGh1Yi5jb20vdGFqcG91cmlhL2NvcnMvYmxvYi9tYXN0ZXIvUkVBRE1FLm1kI2NvcnNcbiAqL1xuZXhwb3J0IGNvbnN0IGFiY0NvcnMgPSA8XG4gIFJlcXVlc3RUIGV4dGVuZHMgUmVxID0gYW55LFxuICBSZXNwb25zZVQgZXh0ZW5kcyBSZXMgPSBhbnksXG4gIE1pZGRsZXdhcmVUIGV4dGVuZHMgKFxuICAgIG5leHQ6ICguLi5hcmdzOiBhbnkpID0+IGFueSxcbiAgKSA9PiAoY29udGV4dDogeyByZXF1ZXN0OiBSZXF1ZXN0VDsgcmVzcG9uc2U6IFJlc3BvbnNlVCB9KSA9PiBhbnkgPSBhbnksXG4+KFxuICBvPzogQ29yc09wdGlvbnMgfCBDb3JzT3B0aW9uc0RlbGVnYXRlPFJlcXVlc3RUPixcbikgPT4ge1xuICBjb25zdCBjb3JzT3B0aW9uc0RlbGVnYXRlID0gQ29ycy5wcm9kdWNlQ29yc09wdGlvbnNEZWxlZ2F0ZTxcbiAgICBDb3JzT3B0aW9uc0RlbGVnYXRlPFJlcXVlc3RUPlxuICA+KG8pO1xuXG4gIHJldHVybiAoKGFiY05leHQpID0+XG4gICAgYXN5bmMgKGNvbnRleHQpID0+IHtcbiAgICAgIGNvbnN0IG5leHQgPSAoKSA9PiBhYmNOZXh0KGNvbnRleHQpO1xuXG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCB7IHJlcXVlc3QsIHJlc3BvbnNlIH0gPSBjb250ZXh0O1xuXG4gICAgICAgIGNvbnN0IG9wdGlvbnMgPSBhd2FpdCBjb3JzT3B0aW9uc0RlbGVnYXRlKHJlcXVlc3QpO1xuXG4gICAgICAgIGNvbnN0IGNvcnNPcHRpb25zID0gQ29ycy5wcm9kdWNlQ29yc09wdGlvbnMob3B0aW9ucyB8fCB7fSk7XG4gICAgICAgIGNvbnN0IG9yaWdpbkRlbGVnYXRlID0gQ29ycy5wcm9kdWNlT3JpZ2luRGVsZWdhdGUoY29yc09wdGlvbnMpO1xuXG4gICAgICAgIGlmIChvcmlnaW5EZWxlZ2F0ZSkge1xuICAgICAgICAgIGNvbnN0IHJlcXVlc3RNZXRob2QgPSByZXF1ZXN0Lm1ldGhvZDtcbiAgICAgICAgICBjb25zdCBnZXRSZXF1ZXN0SGVhZGVyID0gKGhlYWRlcktleTogc3RyaW5nKSA9PlxuICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzLmdldChoZWFkZXJLZXkpO1xuICAgICAgICAgIGNvbnN0IGdldFJlc3BvbnNlSGVhZGVyID0gKGhlYWRlcktleTogc3RyaW5nKSA9PlxuICAgICAgICAgICAgcmVzcG9uc2UuaGVhZGVycy5nZXQoaGVhZGVyS2V5KTtcbiAgICAgICAgICBjb25zdCBzZXRSZXNwb25zZUhlYWRlciA9IChoZWFkZXJLZXk6IHN0cmluZywgaGVhZGVyVmFsdWU6IHN0cmluZykgPT5cbiAgICAgICAgICAgIHJlc3BvbnNlLmhlYWRlcnMuc2V0KGhlYWRlcktleSwgaGVhZGVyVmFsdWUpO1xuICAgICAgICAgIGNvbnN0IHNldFN0YXR1cyA9IChcbiAgICAgICAgICAgIHN0YXR1c0NvZGU6IG51bWJlcixcbiAgICAgICAgICApID0+IChyZXNwb25zZS5zdGF0dXMgPSBzdGF0dXNDb2RlKTtcbiAgICAgICAgICBjb25zdCBlbmQgPSAoKSA9PiB7fTtcblxuICAgICAgICAgIGNvbnN0IG9yaWdpbiA9IGF3YWl0IG9yaWdpbkRlbGVnYXRlKGdldFJlcXVlc3RIZWFkZXIoXCJvcmlnaW5cIikpO1xuXG4gICAgICAgICAgaWYgKCFvcmlnaW4pIHJldHVybiBuZXh0KCk7XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb3JzT3B0aW9ucy5vcmlnaW4gPSBvcmlnaW47XG5cbiAgICAgICAgICAgIHJldHVybiBuZXcgQ29ycyh7XG4gICAgICAgICAgICAgIGNvcnNPcHRpb25zLFxuICAgICAgICAgICAgICByZXF1ZXN0TWV0aG9kLFxuICAgICAgICAgICAgICBnZXRSZXF1ZXN0SGVhZGVyLFxuICAgICAgICAgICAgICBnZXRSZXNwb25zZUhlYWRlcixcbiAgICAgICAgICAgICAgc2V0UmVzcG9uc2VIZWFkZXIsXG4gICAgICAgICAgICAgIHNldFN0YXR1cyxcbiAgICAgICAgICAgICAgbmV4dCxcbiAgICAgICAgICAgICAgZW5kLFxuICAgICAgICAgICAgfSkuY29uZmlndXJlSGVhZGVycygpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBuZXh0KCk7XG4gICAgfSkgYXMgTWlkZGxld2FyZVQ7XG59O1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLFNBQVMsSUFBSSxRQUFRLFlBQVk7QUFpQmpDOzs7O0NBSUMsR0FDRCxPQUFPLE1BQU0sVUFBVSxDQU9yQjtJQUVBLE1BQU0sc0JBQXNCLEtBQUssMkJBRS9CO0lBRUYsT0FBUSxDQUFDLFVBQ1AsT0FBTztZQUNMLE1BQU0sT0FBTyxJQUFNLFFBQVE7WUFFM0IsSUFBSTtnQkFDRixNQUFNLEVBQUUsUUFBTyxFQUFFLFNBQVEsRUFBRSxHQUFHO2dCQUU5QixNQUFNLFVBQVUsTUFBTSxvQkFBb0I7Z0JBRTFDLE1BQU0sY0FBYyxLQUFLLG1CQUFtQixXQUFXLENBQUM7Z0JBQ3hELE1BQU0saUJBQWlCLEtBQUssc0JBQXNCO2dCQUVsRCxJQUFJLGdCQUFnQjtvQkFDbEIsTUFBTSxnQkFBZ0IsUUFBUTtvQkFDOUIsTUFBTSxtQkFBbUIsQ0FBQyxZQUN4QixRQUFRLFFBQVEsSUFBSTtvQkFDdEIsTUFBTSxvQkFBb0IsQ0FBQyxZQUN6QixTQUFTLFFBQVEsSUFBSTtvQkFDdkIsTUFBTSxvQkFBb0IsQ0FBQyxXQUFtQixjQUM1QyxTQUFTLFFBQVEsSUFBSSxXQUFXO29CQUNsQyxNQUFNLFlBQVksQ0FDaEIsYUFDSSxTQUFTLFNBQVM7b0JBQ3hCLE1BQU0sTUFBTSxLQUFPO29CQUVuQixNQUFNLFNBQVMsTUFBTSxlQUFlLGlCQUFpQjtvQkFFckQsSUFBSSxDQUFDLFFBQVEsT0FBTzt5QkFDZjt3QkFDSCxZQUFZLFNBQVM7d0JBRXJCLE9BQU8sSUFBSSxLQUFLOzRCQUNkOzRCQUNBOzRCQUNBOzRCQUNBOzRCQUNBOzRCQUNBOzRCQUNBOzRCQUNBO3dCQUNGLEdBQUc7b0JBQ0w7Z0JBQ0Y7WUFDRixFQUFFLE9BQU8sT0FBTztnQkFDZCxRQUFRLE1BQU07WUFDaEI7WUFFQSxPQUFPO1FBQ1Q7QUFDSixFQUFFIn0=