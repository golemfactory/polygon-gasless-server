// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/** Transform a stream into a stream where each chunk is divided by a newline,
 * be it `\n` or `\r\n`. `\r` can be enabled via the `allowCR` option.
 *
 * ```ts
 * import { TextLineStream } from "https://deno.land/std@$STD_VERSION/streams/text_line_stream.ts";
 * const res = await fetch("https://example.com");
 * const lines = res.body!
 *   .pipeThrough(new TextDecoderStream())
 *   .pipeThrough(new TextLineStream());
 * ```
 */ export class TextLineStream extends TransformStream {
    #allowCR;
    #buf = "";
    constructor(options){
        super({
            transform: (chunk, controller)=>this.#handle(chunk, controller),
            flush: (controller)=>{
                if (this.#buf.length > 0) {
                    if (this.#allowCR && this.#buf[this.#buf.length - 1] === "\r") controller.enqueue(this.#buf.slice(0, -1));
                    else controller.enqueue(this.#buf);
                }
            }
        });
        this.#allowCR = options?.allowCR ?? false;
    }
    #handle(chunk, controller) {
        chunk = this.#buf + chunk;
        for(;;){
            const lfIndex = chunk.indexOf("\n");
            if (this.#allowCR) {
                const crIndex = chunk.indexOf("\r");
                if (crIndex !== -1 && crIndex !== chunk.length - 1 && (lfIndex === -1 || lfIndex - 1 > crIndex)) {
                    controller.enqueue(chunk.slice(0, crIndex));
                    chunk = chunk.slice(crIndex + 1);
                    continue;
                }
            }
            if (lfIndex !== -1) {
                let crOrLfIndex = lfIndex;
                if (chunk[lfIndex - 1] === "\r") {
                    crOrLfIndex--;
                }
                controller.enqueue(chunk.slice(0, crOrLfIndex));
                chunk = chunk.slice(lfIndex + 1);
                continue;
            }
            break;
        }
        this.#buf = chunk;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5My4wL3N0cmVhbXMvdGV4dF9saW5lX3N0cmVhbS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIzIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbnRlcmZhY2UgVGV4dExpbmVTdHJlYW1PcHRpb25zIHtcbiAgLyoqIEFsbG93IHNwbGl0dGluZyBieSBzb2xvIFxcciAqL1xuICBhbGxvd0NSOiBib29sZWFuO1xufVxuXG4vKiogVHJhbnNmb3JtIGEgc3RyZWFtIGludG8gYSBzdHJlYW0gd2hlcmUgZWFjaCBjaHVuayBpcyBkaXZpZGVkIGJ5IGEgbmV3bGluZSxcbiAqIGJlIGl0IGBcXG5gIG9yIGBcXHJcXG5gLiBgXFxyYCBjYW4gYmUgZW5hYmxlZCB2aWEgdGhlIGBhbGxvd0NSYCBvcHRpb24uXG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IFRleHRMaW5lU3RyZWFtIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vc3RyZWFtcy90ZXh0X2xpbmVfc3RyZWFtLnRzXCI7XG4gKiBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChcImh0dHBzOi8vZXhhbXBsZS5jb21cIik7XG4gKiBjb25zdCBsaW5lcyA9IHJlcy5ib2R5IVxuICogICAucGlwZVRocm91Z2gobmV3IFRleHREZWNvZGVyU3RyZWFtKCkpXG4gKiAgIC5waXBlVGhyb3VnaChuZXcgVGV4dExpbmVTdHJlYW0oKSk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNsYXNzIFRleHRMaW5lU3RyZWFtIGV4dGVuZHMgVHJhbnNmb3JtU3RyZWFtPHN0cmluZywgc3RyaW5nPiB7XG4gIHJlYWRvbmx5ICNhbGxvd0NSOiBib29sZWFuO1xuICAjYnVmID0gXCJcIjtcblxuICBjb25zdHJ1Y3RvcihvcHRpb25zPzogVGV4dExpbmVTdHJlYW1PcHRpb25zKSB7XG4gICAgc3VwZXIoe1xuICAgICAgdHJhbnNmb3JtOiAoY2h1bmssIGNvbnRyb2xsZXIpID0+IHRoaXMuI2hhbmRsZShjaHVuaywgY29udHJvbGxlciksXG4gICAgICBmbHVzaDogKGNvbnRyb2xsZXIpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuI2J1Zi5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgdGhpcy4jYWxsb3dDUiAmJlxuICAgICAgICAgICAgdGhpcy4jYnVmW3RoaXMuI2J1Zi5sZW5ndGggLSAxXSA9PT0gXCJcXHJcIlxuICAgICAgICAgICkgY29udHJvbGxlci5lbnF1ZXVlKHRoaXMuI2J1Zi5zbGljZSgwLCAtMSkpO1xuICAgICAgICAgIGVsc2UgY29udHJvbGxlci5lbnF1ZXVlKHRoaXMuI2J1Zik7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgfSk7XG4gICAgdGhpcy4jYWxsb3dDUiA9IG9wdGlvbnM/LmFsbG93Q1IgPz8gZmFsc2U7XG4gIH1cblxuICAjaGFuZGxlKGNodW5rOiBzdHJpbmcsIGNvbnRyb2xsZXI6IFRyYW5zZm9ybVN0cmVhbURlZmF1bHRDb250cm9sbGVyPHN0cmluZz4pIHtcbiAgICBjaHVuayA9IHRoaXMuI2J1ZiArIGNodW5rO1xuXG4gICAgZm9yICg7Oykge1xuICAgICAgY29uc3QgbGZJbmRleCA9IGNodW5rLmluZGV4T2YoXCJcXG5cIik7XG5cbiAgICAgIGlmICh0aGlzLiNhbGxvd0NSKSB7XG4gICAgICAgIGNvbnN0IGNySW5kZXggPSBjaHVuay5pbmRleE9mKFwiXFxyXCIpO1xuXG4gICAgICAgIGlmIChcbiAgICAgICAgICBjckluZGV4ICE9PSAtMSAmJiBjckluZGV4ICE9PSAoY2h1bmsubGVuZ3RoIC0gMSkgJiZcbiAgICAgICAgICAobGZJbmRleCA9PT0gLTEgfHwgKGxmSW5kZXggLSAxKSA+IGNySW5kZXgpXG4gICAgICAgICkge1xuICAgICAgICAgIGNvbnRyb2xsZXIuZW5xdWV1ZShjaHVuay5zbGljZSgwLCBjckluZGV4KSk7XG4gICAgICAgICAgY2h1bmsgPSBjaHVuay5zbGljZShjckluZGV4ICsgMSk7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGxmSW5kZXggIT09IC0xKSB7XG4gICAgICAgIGxldCBjck9yTGZJbmRleCA9IGxmSW5kZXg7XG4gICAgICAgIGlmIChjaHVua1tsZkluZGV4IC0gMV0gPT09IFwiXFxyXCIpIHtcbiAgICAgICAgICBjck9yTGZJbmRleC0tO1xuICAgICAgICB9XG4gICAgICAgIGNvbnRyb2xsZXIuZW5xdWV1ZShjaHVuay5zbGljZSgwLCBjck9yTGZJbmRleCkpO1xuICAgICAgICBjaHVuayA9IGNodW5rLnNsaWNlKGxmSW5kZXggKyAxKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIHRoaXMuI2J1ZiA9IGNodW5rO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFxQztBQU9yQzs7Ozs7Ozs7OztDQVVDLEdBQ0QsT0FBTyxNQUFNLHVCQUF1QjtJQUN6QixDQUFDLE9BQU8sQ0FBVTtJQUMzQixDQUFDLEdBQUcsR0FBRyxHQUFHO0lBRVYsWUFBWSxPQUErQixDQUFFO1FBQzNDLEtBQUssQ0FBQztZQUNKLFdBQVcsQ0FBQyxPQUFPLGFBQWUsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU87WUFDdEQsT0FBTyxDQUFDO2dCQUNOLElBQUksSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLFNBQVMsR0FBRztvQkFDeEIsSUFDRSxJQUFJLENBQUMsQ0FBQyxPQUFPLElBQ2IsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsS0FBSyxNQUNwQyxXQUFXLFFBQVEsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDO3lCQUNwQyxXQUFXLFFBQVEsSUFBSSxDQUFDLENBQUMsR0FBRztnQkFDbkM7WUFDRjtRQUNGO1FBQ0EsSUFBSSxDQUFDLENBQUMsT0FBTyxHQUFHLFNBQVMsV0FBVztJQUN0QztJQUVBLENBQUMsTUFBTSxDQUFDLEtBQWEsRUFBRSxVQUFvRDtRQUN6RSxRQUFRLElBQUksQ0FBQyxDQUFDLEdBQUcsR0FBRztRQUVwQixPQUFTO1lBQ1AsTUFBTSxVQUFVLE1BQU0sUUFBUTtZQUU5QixJQUFJLElBQUksQ0FBQyxDQUFDLE9BQU8sRUFBRTtnQkFDakIsTUFBTSxVQUFVLE1BQU0sUUFBUTtnQkFFOUIsSUFDRSxZQUFZLENBQUMsS0FBSyxZQUFhLE1BQU0sU0FBUyxLQUM5QyxDQUFDLFlBQVksQ0FBQyxLQUFLLEFBQUMsVUFBVSxJQUFLLE9BQU8sR0FDMUM7b0JBQ0EsV0FBVyxRQUFRLE1BQU0sTUFBTSxHQUFHO29CQUNsQyxRQUFRLE1BQU0sTUFBTSxVQUFVO29CQUM5QjtnQkFDRjtZQUNGO1lBRUEsSUFBSSxZQUFZLENBQUMsR0FBRztnQkFDbEIsSUFBSSxjQUFjO2dCQUNsQixJQUFJLEtBQUssQ0FBQyxVQUFVLEVBQUUsS0FBSyxNQUFNO29CQUMvQjtnQkFDRjtnQkFDQSxXQUFXLFFBQVEsTUFBTSxNQUFNLEdBQUc7Z0JBQ2xDLFFBQVEsTUFBTSxNQUFNLFVBQVU7Z0JBQzlCO1lBQ0Y7WUFFQTtRQUNGO1FBRUEsSUFBSSxDQUFDLENBQUMsR0FBRyxHQUFHO0lBQ2Q7QUFDRiJ9