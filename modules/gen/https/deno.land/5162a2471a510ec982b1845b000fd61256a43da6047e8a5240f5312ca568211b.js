// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import db from "./vendor/mime-db.v1.52.0.ts";
import { extensions } from "./_util.ts";
/** A map of the media type for a given extension */ export const types = new Map();
/** Internal function to populate the maps based on the Mime DB. */ (function populateMaps() {
    const preference = [
        "nginx",
        "apache",
        undefined,
        "iana"
    ];
    for (const type of Object.keys(db)){
        const mime = db[type];
        const exts = mime.extensions;
        if (!exts || !exts.length) {
            continue;
        }
        // @ts-ignore work around denoland/dnt#148
        extensions.set(type, exts);
        for (const ext of exts){
            const current = types.get(ext);
            if (current) {
                const from = preference.indexOf(db[current].source);
                const to = preference.indexOf(mime.source);
                if (current !== "application/octet-stream" && (from > to || // @ts-ignore work around denoland/dnt#148
                from === to && current.startsWith("application/"))) {
                    continue;
                }
            }
            types.set(ext, type);
        }
    }
})();
export { db };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5My4wL21lZGlhX3R5cGVzL19kYi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIzIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuaW1wb3J0IGRiIGZyb20gXCIuL3ZlbmRvci9taW1lLWRiLnYxLjUyLjAudHNcIjtcbmltcG9ydCB7IHR5cGUgREJFbnRyeSwgZXh0ZW5zaW9ucyB9IGZyb20gXCIuL191dGlsLnRzXCI7XG5cbmV4cG9ydCB0eXBlIEtleU9mRGIgPSBrZXlvZiB0eXBlb2YgZGI7XG5cbi8qKiBBIG1hcCBvZiB0aGUgbWVkaWEgdHlwZSBmb3IgYSBnaXZlbiBleHRlbnNpb24gKi9cbmV4cG9ydCBjb25zdCB0eXBlcyA9IG5ldyBNYXA8c3RyaW5nLCBLZXlPZkRiPigpO1xuXG4vKiogSW50ZXJuYWwgZnVuY3Rpb24gdG8gcG9wdWxhdGUgdGhlIG1hcHMgYmFzZWQgb24gdGhlIE1pbWUgREIuICovXG4oZnVuY3Rpb24gcG9wdWxhdGVNYXBzKCkge1xuICBjb25zdCBwcmVmZXJlbmNlID0gW1wibmdpbnhcIiwgXCJhcGFjaGVcIiwgdW5kZWZpbmVkLCBcImlhbmFcIl07XG5cbiAgZm9yIChjb25zdCB0eXBlIG9mIE9iamVjdC5rZXlzKGRiKSBhcyBLZXlPZkRiW10pIHtcbiAgICBjb25zdCBtaW1lID0gZGJbdHlwZV0gYXMgREJFbnRyeTtcbiAgICBjb25zdCBleHRzID0gbWltZS5leHRlbnNpb25zO1xuXG4gICAgaWYgKCFleHRzIHx8ICFleHRzLmxlbmd0aCkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gQHRzLWlnbm9yZSB3b3JrIGFyb3VuZCBkZW5vbGFuZC9kbnQjMTQ4XG4gICAgZXh0ZW5zaW9ucy5zZXQodHlwZSwgZXh0cyk7XG5cbiAgICBmb3IgKGNvbnN0IGV4dCBvZiBleHRzKSB7XG4gICAgICBjb25zdCBjdXJyZW50ID0gdHlwZXMuZ2V0KGV4dCk7XG4gICAgICBpZiAoY3VycmVudCkge1xuICAgICAgICBjb25zdCBmcm9tID0gcHJlZmVyZW5jZS5pbmRleE9mKChkYltjdXJyZW50XSBhcyBEQkVudHJ5KS5zb3VyY2UpO1xuICAgICAgICBjb25zdCB0byA9IHByZWZlcmVuY2UuaW5kZXhPZihtaW1lLnNvdXJjZSk7XG5cbiAgICAgICAgaWYgKFxuICAgICAgICAgIGN1cnJlbnQgIT09IFwiYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtXCIgJiZcbiAgICAgICAgICAoZnJvbSA+IHRvIHx8XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlIHdvcmsgYXJvdW5kIGRlbm9sYW5kL2RudCMxNDhcbiAgICAgICAgICAgIChmcm9tID09PSB0byAmJiBjdXJyZW50LnN0YXJ0c1dpdGgoXCJhcHBsaWNhdGlvbi9cIikpKVxuICAgICAgICApIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0eXBlcy5zZXQoZXh0LCB0eXBlKTtcbiAgICB9XG4gIH1cbn0pKCk7XG5cbmV4cG9ydCB7IGRiIH07XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLE9BQU8sUUFBUSw4QkFBOEI7QUFDN0MsU0FBdUIsVUFBVSxRQUFRLGFBQWE7QUFJdEQsa0RBQWtELEdBQ2xELE9BQU8sTUFBTSxRQUFRLElBQUksTUFBdUI7QUFFaEQsaUVBQWlFLEdBQ2pFLENBQUMsU0FBUztJQUNSLE1BQU0sYUFBYTtRQUFDO1FBQVM7UUFBVTtRQUFXO0tBQU87SUFFekQsS0FBSyxNQUFNLFFBQVEsT0FBTyxLQUFLLElBQWtCO1FBQy9DLE1BQU0sT0FBTyxFQUFFLENBQUMsS0FBSztRQUNyQixNQUFNLE9BQU8sS0FBSztRQUVsQixJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssUUFBUTtZQUN6QjtRQUNGO1FBRUEsMENBQTBDO1FBQzFDLFdBQVcsSUFBSSxNQUFNO1FBRXJCLEtBQUssTUFBTSxPQUFPLEtBQU07WUFDdEIsTUFBTSxVQUFVLE1BQU0sSUFBSTtZQUMxQixJQUFJLFNBQVM7Z0JBQ1gsTUFBTSxPQUFPLFdBQVcsUUFBUSxBQUFDLEVBQUUsQ0FBQyxRQUFRLENBQWE7Z0JBQ3pELE1BQU0sS0FBSyxXQUFXLFFBQVEsS0FBSztnQkFFbkMsSUFDRSxZQUFZLDhCQUNaLENBQUMsT0FBTyxNQUNOLDBDQUEwQztnQkFDekMsU0FBUyxNQUFNLFFBQVEsV0FBVyxlQUFnQixHQUNyRDtvQkFDQTtnQkFDRjtZQUNGO1lBRUEsTUFBTSxJQUFJLEtBQUs7UUFDakI7SUFDRjtBQUNGLENBQUM7QUFFRCxTQUFTLEVBQUUsR0FBRyJ9