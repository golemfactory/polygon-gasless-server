// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { writeAll } from "./write_all.ts";
function isCloser(value) {
    return typeof value === "object" && value != null && "close" in value && // deno-lint-ignore no-explicit-any
    typeof value["close"] === "function";
}
/** Create a `WritableStream` from a `Writer`. */ export function writableStreamFromWriter(writer, options = {}) {
    const { autoClose =true  } = options;
    return new WritableStream({
        async write (chunk, controller) {
            try {
                await writeAll(writer, chunk);
            } catch (e) {
                controller.error(e);
                if (isCloser(writer) && autoClose) {
                    writer.close();
                }
            }
        },
        close () {
            if (isCloser(writer) && autoClose) {
                writer.close();
            }
        },
        abort () {
            if (isCloser(writer) && autoClose) {
                writer.close();
            }
        }
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5My4wL3N0cmVhbXMvd3JpdGFibGVfc3RyZWFtX2Zyb21fd3JpdGVyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjMgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbmltcG9ydCB7IHdyaXRlQWxsIH0gZnJvbSBcIi4vd3JpdGVfYWxsLnRzXCI7XG5pbXBvcnQgdHlwZSB7IENsb3NlciwgV3JpdGVyIH0gZnJvbSBcIi4uL3R5cGVzLmQudHNcIjtcblxuZnVuY3Rpb24gaXNDbG9zZXIodmFsdWU6IHVua25vd24pOiB2YWx1ZSBpcyBDbG9zZXIge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmIHZhbHVlICE9IG51bGwgJiYgXCJjbG9zZVwiIGluIHZhbHVlICYmXG4gICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICB0eXBlb2YgKHZhbHVlIGFzIFJlY29yZDxzdHJpbmcsIGFueT4pW1wiY2xvc2VcIl0gPT09IFwiZnVuY3Rpb25cIjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBXcml0YWJsZVN0cmVhbUZyb21Xcml0ZXJPcHRpb25zIHtcbiAgLyoqXG4gICAqIElmIHRoZSBgd3JpdGVyYCBpcyBhbHNvIGEgYENsb3NlcmAsIGF1dG9tYXRpY2FsbHkgY2xvc2UgdGhlIGB3cml0ZXJgXG4gICAqIHdoZW4gdGhlIHN0cmVhbSBpcyBjbG9zZWQsIGFib3J0ZWQsIG9yIGEgd3JpdGUgZXJyb3Igb2NjdXJzLlxuICAgKlxuICAgKiBAZGVmYXVsdCB7dHJ1ZX1cbiAgICovXG4gIGF1dG9DbG9zZT86IGJvb2xlYW47XG59XG5cbi8qKiBDcmVhdGUgYSBgV3JpdGFibGVTdHJlYW1gIGZyb20gYSBgV3JpdGVyYC4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3cml0YWJsZVN0cmVhbUZyb21Xcml0ZXIoXG4gIHdyaXRlcjogV3JpdGVyLFxuICBvcHRpb25zOiBXcml0YWJsZVN0cmVhbUZyb21Xcml0ZXJPcHRpb25zID0ge30sXG4pOiBXcml0YWJsZVN0cmVhbTxVaW50OEFycmF5PiB7XG4gIGNvbnN0IHsgYXV0b0Nsb3NlID0gdHJ1ZSB9ID0gb3B0aW9ucztcblxuICByZXR1cm4gbmV3IFdyaXRhYmxlU3RyZWFtKHtcbiAgICBhc3luYyB3cml0ZShjaHVuaywgY29udHJvbGxlcikge1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgd3JpdGVBbGwod3JpdGVyLCBjaHVuayk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNvbnRyb2xsZXIuZXJyb3IoZSk7XG4gICAgICAgIGlmIChpc0Nsb3Nlcih3cml0ZXIpICYmIGF1dG9DbG9zZSkge1xuICAgICAgICAgIHdyaXRlci5jbG9zZSgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICBjbG9zZSgpIHtcbiAgICAgIGlmIChpc0Nsb3Nlcih3cml0ZXIpICYmIGF1dG9DbG9zZSkge1xuICAgICAgICB3cml0ZXIuY2xvc2UoKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIGFib3J0KCkge1xuICAgICAgaWYgKGlzQ2xvc2VyKHdyaXRlcikgJiYgYXV0b0Nsb3NlKSB7XG4gICAgICAgIHdyaXRlci5jbG9zZSgpO1xuICAgICAgfVxuICAgIH0sXG4gIH0pO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckMsU0FBUyxRQUFRLFFBQVEsaUJBQWlCO0FBRzFDLFNBQVMsU0FBUyxLQUFjO0lBQzlCLE9BQU8sT0FBTyxVQUFVLFlBQVksU0FBUyxRQUFRLFdBQVcsU0FDOUQsbUNBQW1DO0lBQ25DLE9BQU8sQUFBQyxLQUE2QixDQUFDLFFBQVEsS0FBSztBQUN2RDtBQVlBLCtDQUErQyxHQUMvQyxPQUFPLFNBQVMseUJBQ2QsTUFBYyxFQUNkLFVBQTJDLENBQUMsQ0FBQztJQUU3QyxNQUFNLEVBQUUsV0FBWSxLQUFJLEVBQUUsR0FBRztJQUU3QixPQUFPLElBQUksZUFBZTtRQUN4QixNQUFNLE9BQU0sS0FBSyxFQUFFLFVBQVU7WUFDM0IsSUFBSTtnQkFDRixNQUFNLFNBQVMsUUFBUTtZQUN6QixFQUFFLE9BQU8sR0FBRztnQkFDVixXQUFXLE1BQU07Z0JBQ2pCLElBQUksU0FBUyxXQUFXLFdBQVc7b0JBQ2pDLE9BQU87Z0JBQ1Q7WUFDRjtRQUNGO1FBQ0E7WUFDRSxJQUFJLFNBQVMsV0FBVyxXQUFXO2dCQUNqQyxPQUFPO1lBQ1Q7UUFDRjtRQUNBO1lBQ0UsSUFBSSxTQUFTLFdBQVcsV0FBVztnQkFDakMsT0FBTztZQUNUO1FBQ0Y7SUFDRjtBQUNGIn0=