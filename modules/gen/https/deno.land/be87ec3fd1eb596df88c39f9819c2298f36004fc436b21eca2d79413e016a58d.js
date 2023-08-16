import { Cors } from "./cors.ts";
/**
 * attainCors middleware wrapper
 * @param o CorsOptions | CorsOptionsDelegate
 * @link https://github.com/tajpouria/cors/blob/master/README.md#cors
 */ export const attainCors = (o)=>{
    const corsOptionsDelegate = Cors.produceCorsOptionsDelegate(o);
    return async function cors(request, response) {
        try {
            const fakeNext = ()=>undefined;
            const options = await corsOptionsDelegate(request);
            const corsOptions = Cors.produceCorsOptions(options || {});
            const originDelegate = Cors.produceOriginDelegate(corsOptions);
            if (originDelegate) {
                const requestMethod = request.method;
                const getRequestHeader = (headerKey)=>request.headers.get(headerKey);
                const getResponseHeader = (headerKey)=>response.headers.get(headerKey);
                const setResponseHeader = (headerKey, headerValue)=>response.headers.set(headerKey, headerValue);
                const setStatus = (statusCode)=>response.status(statusCode);
                const end = response.end();
                const origin = await originDelegate(getRequestHeader("origin"));
                if (origin) {
                    corsOptions.origin = origin;
                    new Cors({
                        corsOptions,
                        requestMethod,
                        getRequestHeader,
                        getResponseHeader,
                        setResponseHeader,
                        setStatus,
                        next: fakeNext,
                        end
                    }).configureHeaders();
                }
            }
            if (request.method === "OPTIONS") {
                response.send("");
            }
        } catch (error) {
            console.error(error);
        }
    };
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY29yc0B2MS4yLjIvYXR0YWluQ29ycy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IENvcnNPcHRpb25zLCBDb3JzT3B0aW9uc0RlbGVnYXRlIH0gZnJvbSBcIi4vdHlwZXMudHNcIjtcbmltcG9ydCB7IENvcnMgfSBmcm9tIFwiLi9jb3JzLnRzXCI7XG5cbmludGVyZmFjZSBSZXEge1xuICBtZXRob2Q6IHN0cmluZztcbiAgaGVhZGVyczoge1xuICAgIGdldChoZWFkZXJLZXk6IHN0cmluZyk6IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQ7XG4gIH07XG59XG5cbmludGVyZmFjZSBSZXMge1xuICBzdGF0dXM6IChzdGF0dXM6IG51bWJlcikgPT4gYW55O1xuICBoZWFkZXJzOiB7XG4gICAgZ2V0KGhlYWRlcktleTogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZDtcbiAgICBzZXQoaGVhZGVyS2V5OiBzdHJpbmcsIGhlYWRlclZhbHVlOiBzdHJpbmcpOiBhbnk7XG4gIH07XG4gIHNlbmQ6IChib2R5OiBhbnkpID0+IGFueTtcbiAgZW5kKC4uLmFyZ3M6IGFueSk6IGFueTtcbn1cblxuLyoqXG4gKiBhdHRhaW5Db3JzIG1pZGRsZXdhcmUgd3JhcHBlclxuICogQHBhcmFtIG8gQ29yc09wdGlvbnMgfCBDb3JzT3B0aW9uc0RlbGVnYXRlXG4gKiBAbGluayBodHRwczovL2dpdGh1Yi5jb20vdGFqcG91cmlhL2NvcnMvYmxvYi9tYXN0ZXIvUkVBRE1FLm1kI2NvcnNcbiAqL1xuZXhwb3J0IGNvbnN0IGF0dGFpbkNvcnMgPSA8XG4gIFJlcXVlc3RUIGV4dGVuZHMgUmVxID0gYW55LFxuICBSZXNwb25zZVQgZXh0ZW5kcyBSZXMgPSBhbnksXG4gIE1pZGRsZXdhcmVUIGV4dGVuZHMgKHJlcXVlc3Q6IFJlcXVlc3RULCByZXNwb25zZTogUmVzcG9uc2VUKSA9PiBhbnkgPSBhbnksXG4+KFxuICBvPzogQ29yc09wdGlvbnMgfCBDb3JzT3B0aW9uc0RlbGVnYXRlPFJlcXVlc3RUPixcbikgPT4ge1xuICBjb25zdCBjb3JzT3B0aW9uc0RlbGVnYXRlID0gQ29ycy5wcm9kdWNlQ29yc09wdGlvbnNEZWxlZ2F0ZTxcbiAgICBDb3JzT3B0aW9uc0RlbGVnYXRlPFJlcXVlc3RUPlxuICA+KG8pO1xuXG4gIHJldHVybiBhc3luYyBmdW5jdGlvbiBjb3JzKHJlcXVlc3QsIHJlc3BvbnNlKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGZha2VOZXh0ID0gKCkgPT4gdW5kZWZpbmVkO1xuICAgICAgY29uc3Qgb3B0aW9ucyA9IGF3YWl0IGNvcnNPcHRpb25zRGVsZWdhdGUocmVxdWVzdCk7XG5cbiAgICAgIGNvbnN0IGNvcnNPcHRpb25zID0gQ29ycy5wcm9kdWNlQ29yc09wdGlvbnMob3B0aW9ucyB8fCB7fSk7XG4gICAgICBjb25zdCBvcmlnaW5EZWxlZ2F0ZSA9IENvcnMucHJvZHVjZU9yaWdpbkRlbGVnYXRlKGNvcnNPcHRpb25zKTtcblxuICAgICAgaWYgKG9yaWdpbkRlbGVnYXRlKSB7XG4gICAgICAgIGNvbnN0IHJlcXVlc3RNZXRob2QgPSByZXF1ZXN0Lm1ldGhvZDtcbiAgICAgICAgY29uc3QgZ2V0UmVxdWVzdEhlYWRlciA9IChoZWFkZXJLZXk6IHN0cmluZykgPT5cbiAgICAgICAgICByZXF1ZXN0LmhlYWRlcnMuZ2V0KGhlYWRlcktleSk7XG4gICAgICAgIGNvbnN0IGdldFJlc3BvbnNlSGVhZGVyID0gKGhlYWRlcktleTogc3RyaW5nKSA9PlxuICAgICAgICAgIHJlc3BvbnNlLmhlYWRlcnMuZ2V0KGhlYWRlcktleSk7XG4gICAgICAgIGNvbnN0IHNldFJlc3BvbnNlSGVhZGVyID0gKGhlYWRlcktleTogc3RyaW5nLCBoZWFkZXJWYWx1ZTogc3RyaW5nKSA9PlxuICAgICAgICAgIHJlc3BvbnNlLmhlYWRlcnMuc2V0KGhlYWRlcktleSwgaGVhZGVyVmFsdWUpO1xuICAgICAgICBjb25zdCBzZXRTdGF0dXMgPSAoc3RhdHVzQ29kZTogbnVtYmVyKSA9PiByZXNwb25zZS5zdGF0dXMoc3RhdHVzQ29kZSk7XG4gICAgICAgIGNvbnN0IGVuZCA9IHJlc3BvbnNlLmVuZCgpO1xuXG4gICAgICAgIGNvbnN0IG9yaWdpbiA9IGF3YWl0IG9yaWdpbkRlbGVnYXRlKGdldFJlcXVlc3RIZWFkZXIoXCJvcmlnaW5cIikpO1xuXG4gICAgICAgIGlmIChvcmlnaW4pIHtcbiAgICAgICAgICBjb3JzT3B0aW9ucy5vcmlnaW4gPSBvcmlnaW47XG5cbiAgICAgICAgICBuZXcgQ29ycyh7XG4gICAgICAgICAgICBjb3JzT3B0aW9ucyxcbiAgICAgICAgICAgIHJlcXVlc3RNZXRob2QsXG4gICAgICAgICAgICBnZXRSZXF1ZXN0SGVhZGVyLFxuICAgICAgICAgICAgZ2V0UmVzcG9uc2VIZWFkZXIsXG4gICAgICAgICAgICBzZXRSZXNwb25zZUhlYWRlcixcbiAgICAgICAgICAgIHNldFN0YXR1cyxcbiAgICAgICAgICAgIG5leHQ6IGZha2VOZXh0LFxuICAgICAgICAgICAgZW5kLFxuICAgICAgICAgIH0pLmNvbmZpZ3VyZUhlYWRlcnMoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAocmVxdWVzdC5tZXRob2QgPT09IFwiT1BUSU9OU1wiKSB7XG4gICAgICAgIHJlc3BvbnNlLnNlbmQoXCJcIik7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgIH1cbiAgfSBhcyBNaWRkbGV3YXJlVDtcbn07XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsU0FBUyxJQUFJLFFBQVEsWUFBWTtBQW1CakM7Ozs7Q0FJQyxHQUNELE9BQU8sTUFBTSxhQUFhLENBS3hCO0lBRUEsTUFBTSxzQkFBc0IsS0FBSywyQkFFL0I7SUFFRixPQUFPLGVBQWUsS0FBSyxPQUFPLEVBQUUsUUFBUTtRQUMxQyxJQUFJO1lBQ0YsTUFBTSxXQUFXLElBQU07WUFDdkIsTUFBTSxVQUFVLE1BQU0sb0JBQW9CO1lBRTFDLE1BQU0sY0FBYyxLQUFLLG1CQUFtQixXQUFXLENBQUM7WUFDeEQsTUFBTSxpQkFBaUIsS0FBSyxzQkFBc0I7WUFFbEQsSUFBSSxnQkFBZ0I7Z0JBQ2xCLE1BQU0sZ0JBQWdCLFFBQVE7Z0JBQzlCLE1BQU0sbUJBQW1CLENBQUMsWUFDeEIsUUFBUSxRQUFRLElBQUk7Z0JBQ3RCLE1BQU0sb0JBQW9CLENBQUMsWUFDekIsU0FBUyxRQUFRLElBQUk7Z0JBQ3ZCLE1BQU0sb0JBQW9CLENBQUMsV0FBbUIsY0FDNUMsU0FBUyxRQUFRLElBQUksV0FBVztnQkFDbEMsTUFBTSxZQUFZLENBQUMsYUFBdUIsU0FBUyxPQUFPO2dCQUMxRCxNQUFNLE1BQU0sU0FBUztnQkFFckIsTUFBTSxTQUFTLE1BQU0sZUFBZSxpQkFBaUI7Z0JBRXJELElBQUksUUFBUTtvQkFDVixZQUFZLFNBQVM7b0JBRXJCLElBQUksS0FBSzt3QkFDUDt3QkFDQTt3QkFDQTt3QkFDQTt3QkFDQTt3QkFDQTt3QkFDQSxNQUFNO3dCQUNOO29CQUNGLEdBQUc7Z0JBQ0w7WUFDRjtZQUVBLElBQUksUUFBUSxXQUFXLFdBQVc7Z0JBQ2hDLFNBQVMsS0FBSztZQUNoQjtRQUNGLEVBQUUsT0FBTyxPQUFPO1lBQ2QsUUFBUSxNQUFNO1FBQ2hCO0lBQ0Y7QUFDRixFQUFFIn0=