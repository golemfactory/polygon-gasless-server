// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.
//
// Adapted from Node.js. Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
// Hack: work around the following TypeScript error:
//   error: TS2345 [ERROR]: Argument of type 'typeof kCustomPromisifiedSymbol'
//   is not assignable to parameter of type 'typeof kCustomPromisifiedSymbol'.
//        assertStrictEquals(kCustomPromisifiedSymbol, promisify.custom);
//                                                     ~~~~~~~~~~~~~~~~
// End hack.
// In addition to being accessible through util.promisify.custom,
// this symbol is registered globally and can be accessed in any environment as
// Symbol.for('nodejs.util.promisify.custom').
const kCustomPromisifiedSymbol = Symbol.for("nodejs.util.promisify.custom");
// This is an internal Node symbol used by functions returning multiple
// arguments, e.g. ['bytesRead', 'buffer'] for fs.read().
const kCustomPromisifyArgsSymbol = Symbol.for("nodejs.util.promisify.customArgs");
class NodeInvalidArgTypeError extends TypeError {
    code = "ERR_INVALID_ARG_TYPE";
    constructor(argumentName, type, received){
        super(`The "${argumentName}" argument must be of type ${type}. Received ${typeof received}`);
    }
}
export function promisify(original) {
    if (typeof original !== "function") {
        throw new NodeInvalidArgTypeError("original", "Function", original);
    }
    // @ts-expect-error TypeScript (as of 3.7) does not support indexing namespaces by symbol
    if (original[kCustomPromisifiedSymbol]) {
        // @ts-expect-error TypeScript (as of 3.7) does not support indexing namespaces by symbol
        const fn = original[kCustomPromisifiedSymbol];
        if (typeof fn !== "function") {
            throw new NodeInvalidArgTypeError("util.promisify.custom", "Function", fn);
        }
        return Object.defineProperty(fn, kCustomPromisifiedSymbol, {
            value: fn,
            enumerable: false,
            writable: false,
            configurable: true
        });
    }
    // Names to create an object from in case the callback receives multiple
    // arguments, e.g. ['bytesRead', 'buffer'] for fs.read.
    // @ts-expect-error TypeScript (as of 3.7) does not support indexing namespaces by symbol
    const argumentNames = original[kCustomPromisifyArgsSymbol];
    function fn(...args) {
        return new Promise((resolve, reject)=>{
            // @ts-expect-error: 'this' implicitly has type 'any' because it does not have a type annotation
            original.call(this, ...args, (err, ...values)=>{
                if (err) {
                    return reject(err);
                }
                if (argumentNames !== undefined && values.length > 1) {
                    const obj = {};
                    for(let i = 0; i < argumentNames.length; i++){
                        // @ts-expect-error TypeScript
                        obj[argumentNames[i]] = values[i];
                    }
                    resolve(obj);
                } else {
                    resolve(values[0]);
                }
            });
        });
    }
    Object.setPrototypeOf(fn, Object.getPrototypeOf(original));
    Object.defineProperty(fn, kCustomPromisifiedSymbol, {
        value: fn,
        enumerable: false,
        writable: false,
        configurable: true
    });
    return Object.defineProperties(fn, Object.getOwnPropertyDescriptors(original));
}
promisify.custom = kCustomPromisifiedSymbol;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjYzLjAvbm9kZS9fdXRpbC9fdXRpbF9wcm9taXNpZnkudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMCB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vXG4vLyBBZGFwdGVkIGZyb20gTm9kZS5qcy4gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbi8vIEhhY2s6IHdvcmsgYXJvdW5kIHRoZSBmb2xsb3dpbmcgVHlwZVNjcmlwdCBlcnJvcjpcbi8vICAgZXJyb3I6IFRTMjM0NSBbRVJST1JdOiBBcmd1bWVudCBvZiB0eXBlICd0eXBlb2Yga0N1c3RvbVByb21pc2lmaWVkU3ltYm9sJ1xuLy8gICBpcyBub3QgYXNzaWduYWJsZSB0byBwYXJhbWV0ZXIgb2YgdHlwZSAndHlwZW9mIGtDdXN0b21Qcm9taXNpZmllZFN5bWJvbCcuXG4vLyAgICAgICAgYXNzZXJ0U3RyaWN0RXF1YWxzKGtDdXN0b21Qcm9taXNpZmllZFN5bWJvbCwgcHJvbWlzaWZ5LmN1c3RvbSk7XG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfn5+fn5+fn5+fn5+fn5+flxuZGVjbGFyZSBjb25zdCBfQ3VzdG9tUHJvbWlzaWZpZWRTeW1ib2w6IHVuaXF1ZSBzeW1ib2w7XG5kZWNsYXJlIGNvbnN0IF9DdXN0b21Qcm9taXNpZnlBcmdzU3ltYm9sOiB1bmlxdWUgc3ltYm9sO1xuZGVjbGFyZSBsZXQgU3ltYm9sOiBTeW1ib2xDb25zdHJ1Y3RvcjtcbmludGVyZmFjZSBTeW1ib2xDb25zdHJ1Y3RvciB7XG4gIGZvcihrZXk6IFwibm9kZWpzLnV0aWwucHJvbWlzaWZ5LmN1c3RvbVwiKTogdHlwZW9mIF9DdXN0b21Qcm9taXNpZmllZFN5bWJvbDtcbiAgZm9yKFxuICAgIGtleTogXCJub2RlanMudXRpbC5wcm9taXNpZnkuY3VzdG9tQXJnc1wiLFxuICApOiB0eXBlb2YgX0N1c3RvbVByb21pc2lmeUFyZ3NTeW1ib2w7XG59XG4vLyBFbmQgaGFjay5cblxuLy8gSW4gYWRkaXRpb24gdG8gYmVpbmcgYWNjZXNzaWJsZSB0aHJvdWdoIHV0aWwucHJvbWlzaWZ5LmN1c3RvbSxcbi8vIHRoaXMgc3ltYm9sIGlzIHJlZ2lzdGVyZWQgZ2xvYmFsbHkgYW5kIGNhbiBiZSBhY2Nlc3NlZCBpbiBhbnkgZW52aXJvbm1lbnQgYXNcbi8vIFN5bWJvbC5mb3IoJ25vZGVqcy51dGlsLnByb21pc2lmeS5jdXN0b20nKS5cbmNvbnN0IGtDdXN0b21Qcm9taXNpZmllZFN5bWJvbCA9IFN5bWJvbC5mb3IoXCJub2RlanMudXRpbC5wcm9taXNpZnkuY3VzdG9tXCIpO1xuLy8gVGhpcyBpcyBhbiBpbnRlcm5hbCBOb2RlIHN5bWJvbCB1c2VkIGJ5IGZ1bmN0aW9ucyByZXR1cm5pbmcgbXVsdGlwbGVcbi8vIGFyZ3VtZW50cywgZS5nLiBbJ2J5dGVzUmVhZCcsICdidWZmZXInXSBmb3IgZnMucmVhZCgpLlxuY29uc3Qga0N1c3RvbVByb21pc2lmeUFyZ3NTeW1ib2wgPSBTeW1ib2wuZm9yKFxuICBcIm5vZGVqcy51dGlsLnByb21pc2lmeS5jdXN0b21BcmdzXCIsXG4pO1xuXG5jbGFzcyBOb2RlSW52YWxpZEFyZ1R5cGVFcnJvciBleHRlbmRzIFR5cGVFcnJvciB7XG4gIHB1YmxpYyBjb2RlID0gXCJFUlJfSU5WQUxJRF9BUkdfVFlQRVwiO1xuICBjb25zdHJ1Y3Rvcihhcmd1bWVudE5hbWU6IHN0cmluZywgdHlwZTogc3RyaW5nLCByZWNlaXZlZDogdW5rbm93bikge1xuICAgIHN1cGVyKFxuICAgICAgYFRoZSBcIiR7YXJndW1lbnROYW1lfVwiIGFyZ3VtZW50IG11c3QgYmUgb2YgdHlwZSAke3R5cGV9LiBSZWNlaXZlZCAke3R5cGVvZiByZWNlaXZlZH1gLFxuICAgICk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHByb21pc2lmeShvcmlnaW5hbDogRnVuY3Rpb24pOiBGdW5jdGlvbiB7XG4gIGlmICh0eXBlb2Ygb3JpZ2luYWwgIT09IFwiZnVuY3Rpb25cIikge1xuICAgIHRocm93IG5ldyBOb2RlSW52YWxpZEFyZ1R5cGVFcnJvcihcIm9yaWdpbmFsXCIsIFwiRnVuY3Rpb25cIiwgb3JpZ2luYWwpO1xuICB9XG5cbiAgLy8gQHRzLWV4cGVjdC1lcnJvciBUeXBlU2NyaXB0IChhcyBvZiAzLjcpIGRvZXMgbm90IHN1cHBvcnQgaW5kZXhpbmcgbmFtZXNwYWNlcyBieSBzeW1ib2xcbiAgaWYgKG9yaWdpbmFsW2tDdXN0b21Qcm9taXNpZmllZFN5bWJvbF0pIHtcbiAgICAvLyBAdHMtZXhwZWN0LWVycm9yIFR5cGVTY3JpcHQgKGFzIG9mIDMuNykgZG9lcyBub3Qgc3VwcG9ydCBpbmRleGluZyBuYW1lc3BhY2VzIGJ5IHN5bWJvbFxuICAgIGNvbnN0IGZuID0gb3JpZ2luYWxba0N1c3RvbVByb21pc2lmaWVkU3ltYm9sXTtcbiAgICBpZiAodHlwZW9mIGZuICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIHRocm93IG5ldyBOb2RlSW52YWxpZEFyZ1R5cGVFcnJvcihcbiAgICAgICAgXCJ1dGlsLnByb21pc2lmeS5jdXN0b21cIixcbiAgICAgICAgXCJGdW5jdGlvblwiLFxuICAgICAgICBmbixcbiAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiBPYmplY3QuZGVmaW5lUHJvcGVydHkoZm4sIGtDdXN0b21Qcm9taXNpZmllZFN5bWJvbCwge1xuICAgICAgdmFsdWU6IGZuLFxuICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgfSk7XG4gIH1cblxuICAvLyBOYW1lcyB0byBjcmVhdGUgYW4gb2JqZWN0IGZyb20gaW4gY2FzZSB0aGUgY2FsbGJhY2sgcmVjZWl2ZXMgbXVsdGlwbGVcbiAgLy8gYXJndW1lbnRzLCBlLmcuIFsnYnl0ZXNSZWFkJywgJ2J1ZmZlciddIGZvciBmcy5yZWFkLlxuICAvLyBAdHMtZXhwZWN0LWVycm9yIFR5cGVTY3JpcHQgKGFzIG9mIDMuNykgZG9lcyBub3Qgc3VwcG9ydCBpbmRleGluZyBuYW1lc3BhY2VzIGJ5IHN5bWJvbFxuICBjb25zdCBhcmd1bWVudE5hbWVzID0gb3JpZ2luYWxba0N1c3RvbVByb21pc2lmeUFyZ3NTeW1ib2xdO1xuXG4gIGZ1bmN0aW9uIGZuKC4uLmFyZ3M6IHVua25vd25bXSk6IFByb21pc2U8dW5rbm93bj4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAvLyBAdHMtZXhwZWN0LWVycm9yOiAndGhpcycgaW1wbGljaXRseSBoYXMgdHlwZSAnYW55JyBiZWNhdXNlIGl0IGRvZXMgbm90IGhhdmUgYSB0eXBlIGFubm90YXRpb25cbiAgICAgIG9yaWdpbmFsLmNhbGwodGhpcywgLi4uYXJncywgKGVycjogRXJyb3IsIC4uLnZhbHVlczogdW5rbm93bltdKSA9PiB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICByZXR1cm4gcmVqZWN0KGVycik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGFyZ3VtZW50TmFtZXMgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZXMubGVuZ3RoID4gMSkge1xuICAgICAgICAgIGNvbnN0IG9iaiA9IHt9O1xuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXJndW1lbnROYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvciBUeXBlU2NyaXB0XG4gICAgICAgICAgICBvYmpbYXJndW1lbnROYW1lc1tpXV0gPSB2YWx1ZXNbaV07XG4gICAgICAgICAgfVxuICAgICAgICAgIHJlc29sdmUob2JqKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXNvbHZlKHZhbHVlc1swXSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgT2JqZWN0LnNldFByb3RvdHlwZU9mKGZuLCBPYmplY3QuZ2V0UHJvdG90eXBlT2Yob3JpZ2luYWwpKTtcblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZm4sIGtDdXN0b21Qcm9taXNpZmllZFN5bWJvbCwge1xuICAgIHZhbHVlOiBmbixcbiAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICB9KTtcbiAgcmV0dXJuIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKFxuICAgIGZuLFxuICAgIE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3JzKG9yaWdpbmFsKSxcbiAgKTtcbn1cblxucHJvbWlzaWZ5LmN1c3RvbSA9IGtDdXN0b21Qcm9taXNpZmllZFN5bWJvbDtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUsRUFBRTtBQUNGLDRFQUE0RTtBQUM1RSxFQUFFO0FBQ0YsMEVBQTBFO0FBQzFFLGdFQUFnRTtBQUNoRSxzRUFBc0U7QUFDdEUsc0VBQXNFO0FBQ3RFLDRFQUE0RTtBQUM1RSxxRUFBcUU7QUFDckUsd0JBQXdCO0FBQ3hCLEVBQUU7QUFDRiwwRUFBMEU7QUFDMUUseURBQXlEO0FBQ3pELEVBQUU7QUFDRiwwRUFBMEU7QUFDMUUsNkRBQTZEO0FBQzdELDRFQUE0RTtBQUM1RSwyRUFBMkU7QUFDM0Usd0VBQXdFO0FBQ3hFLDRFQUE0RTtBQUM1RSx5Q0FBeUM7QUFFekMsb0RBQW9EO0FBQ3BELDhFQUE4RTtBQUM5RSw4RUFBOEU7QUFDOUUseUVBQXlFO0FBQ3pFLHVFQUF1RTtBQVV2RSxZQUFZO0FBRVosaUVBQWlFO0FBQ2pFLCtFQUErRTtBQUMvRSw4Q0FBOEM7QUFDOUMsTUFBTSwyQkFBMkIsT0FBTyxJQUFJO0FBQzVDLHVFQUF1RTtBQUN2RSx5REFBeUQ7QUFDekQsTUFBTSw2QkFBNkIsT0FBTyxJQUN4QztBQUdGLE1BQU0sZ0NBQWdDO0lBQzdCLE9BQU8sdUJBQXVCO0lBQ3JDLFlBQVksWUFBb0IsRUFBRSxJQUFZLEVBQUUsUUFBaUIsQ0FBRTtRQUNqRSxLQUFLLENBQ0gsQ0FBQyxLQUFLLEVBQUUsYUFBYSwyQkFBMkIsRUFBRSxLQUFLLFdBQVcsRUFBRSxPQUFPLFNBQVMsQ0FBQztJQUV6RjtBQUNGO0FBRUEsT0FBTyxTQUFTLFVBQVUsUUFBa0I7SUFDMUMsSUFBSSxPQUFPLGFBQWEsWUFBWTtRQUNsQyxNQUFNLElBQUksd0JBQXdCLFlBQVksWUFBWTtJQUM1RDtJQUVBLHlGQUF5RjtJQUN6RixJQUFJLFFBQVEsQ0FBQyx5QkFBeUIsRUFBRTtRQUN0Qyx5RkFBeUY7UUFDekYsTUFBTSxLQUFLLFFBQVEsQ0FBQyx5QkFBeUI7UUFDN0MsSUFBSSxPQUFPLE9BQU8sWUFBWTtZQUM1QixNQUFNLElBQUksd0JBQ1IseUJBQ0EsWUFDQTtRQUVKO1FBQ0EsT0FBTyxPQUFPLGVBQWUsSUFBSSwwQkFBMEI7WUFDekQsT0FBTztZQUNQLFlBQVk7WUFDWixVQUFVO1lBQ1YsY0FBYztRQUNoQjtJQUNGO0lBRUEsd0VBQXdFO0lBQ3hFLHVEQUF1RDtJQUN2RCx5RkFBeUY7SUFDekYsTUFBTSxnQkFBZ0IsUUFBUSxDQUFDLDJCQUEyQjtJQUUxRCxTQUFTLEdBQUcsR0FBRyxJQUFlO1FBQzVCLE9BQU8sSUFBSSxRQUFRLENBQUMsU0FBUztZQUMzQixnR0FBZ0c7WUFDaEcsU0FBUyxLQUFLLElBQUksS0FBSyxNQUFNLENBQUMsS0FBWSxHQUFHO2dCQUMzQyxJQUFJLEtBQUs7b0JBQ1AsT0FBTyxPQUFPO2dCQUNoQjtnQkFDQSxJQUFJLGtCQUFrQixhQUFhLE9BQU8sU0FBUyxHQUFHO29CQUNwRCxNQUFNLE1BQU0sQ0FBQztvQkFDYixJQUFLLElBQUksSUFBSSxHQUFHLElBQUksY0FBYyxRQUFRLElBQUs7d0JBQzdDLDhCQUE4Qjt3QkFDOUIsR0FBRyxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLENBQUMsRUFBRTtvQkFDbkM7b0JBQ0EsUUFBUTtnQkFDVixPQUFPO29CQUNMLFFBQVEsTUFBTSxDQUFDLEVBQUU7Z0JBQ25CO1lBQ0Y7UUFDRjtJQUNGO0lBRUEsT0FBTyxlQUFlLElBQUksT0FBTyxlQUFlO0lBRWhELE9BQU8sZUFBZSxJQUFJLDBCQUEwQjtRQUNsRCxPQUFPO1FBQ1AsWUFBWTtRQUNaLFVBQVU7UUFDVixjQUFjO0lBQ2hCO0lBQ0EsT0FBTyxPQUFPLGlCQUNaLElBQ0EsT0FBTywwQkFBMEI7QUFFckM7QUFFQSxVQUFVLFNBQVMifQ==