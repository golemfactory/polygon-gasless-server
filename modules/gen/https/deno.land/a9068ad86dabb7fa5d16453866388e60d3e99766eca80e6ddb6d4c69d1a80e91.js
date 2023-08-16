// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { DEFAULT_BUFFER_SIZE } from "./_common.ts";
/** Copies from `src` to `dst` until either EOF (`null`) is read from `src` or
 * an error occurs. It resolves to the number of bytes copied or rejects with
 * the first error encountered while copying.
 *
 * ```ts
 * import { copy } from "https://deno.land/std@$STD_VERSION/streams/copy.ts";
 *
 * const source = await Deno.open("my_file.txt");
 * const bytesCopied1 = await copy(source, Deno.stdout);
 * const destination = await Deno.create("my_file_2.txt");
 * const bytesCopied2 = await copy(source, destination);
 * ```
 *
 * @param src The source to copy from
 * @param dst The destination to copy to
 * @param options Can be used to tune size of the buffer. Default size is 32kB
 */ export async function copy(src, dst, options) {
    let n = 0;
    const bufSize = options?.bufSize ?? DEFAULT_BUFFER_SIZE;
    const b = new Uint8Array(bufSize);
    let gotEOF = false;
    while(gotEOF === false){
        const result = await src.read(b);
        if (result === null) {
            gotEOF = true;
        } else {
            let nwritten = 0;
            while(nwritten < result){
                nwritten += await dst.write(b.subarray(nwritten, result));
            }
            n += nwritten;
        }
    }
    return n;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5My4wL3N0cmVhbXMvY29weS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIzIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQgeyBERUZBVUxUX0JVRkZFUl9TSVpFIH0gZnJvbSBcIi4vX2NvbW1vbi50c1wiO1xuaW1wb3J0IHR5cGUgeyBSZWFkZXIsIFdyaXRlciB9IGZyb20gXCIuLi90eXBlcy5kLnRzXCI7XG5cbi8qKiBDb3BpZXMgZnJvbSBgc3JjYCB0byBgZHN0YCB1bnRpbCBlaXRoZXIgRU9GIChgbnVsbGApIGlzIHJlYWQgZnJvbSBgc3JjYCBvclxuICogYW4gZXJyb3Igb2NjdXJzLiBJdCByZXNvbHZlcyB0byB0aGUgbnVtYmVyIG9mIGJ5dGVzIGNvcGllZCBvciByZWplY3RzIHdpdGhcbiAqIHRoZSBmaXJzdCBlcnJvciBlbmNvdW50ZXJlZCB3aGlsZSBjb3B5aW5nLlxuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBjb3B5IH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vc3RyZWFtcy9jb3B5LnRzXCI7XG4gKlxuICogY29uc3Qgc291cmNlID0gYXdhaXQgRGVuby5vcGVuKFwibXlfZmlsZS50eHRcIik7XG4gKiBjb25zdCBieXRlc0NvcGllZDEgPSBhd2FpdCBjb3B5KHNvdXJjZSwgRGVuby5zdGRvdXQpO1xuICogY29uc3QgZGVzdGluYXRpb24gPSBhd2FpdCBEZW5vLmNyZWF0ZShcIm15X2ZpbGVfMi50eHRcIik7XG4gKiBjb25zdCBieXRlc0NvcGllZDIgPSBhd2FpdCBjb3B5KHNvdXJjZSwgZGVzdGluYXRpb24pO1xuICogYGBgXG4gKlxuICogQHBhcmFtIHNyYyBUaGUgc291cmNlIHRvIGNvcHkgZnJvbVxuICogQHBhcmFtIGRzdCBUaGUgZGVzdGluYXRpb24gdG8gY29weSB0b1xuICogQHBhcmFtIG9wdGlvbnMgQ2FuIGJlIHVzZWQgdG8gdHVuZSBzaXplIG9mIHRoZSBidWZmZXIuIERlZmF1bHQgc2l6ZSBpcyAzMmtCXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjb3B5KFxuICBzcmM6IFJlYWRlcixcbiAgZHN0OiBXcml0ZXIsXG4gIG9wdGlvbnM/OiB7XG4gICAgYnVmU2l6ZT86IG51bWJlcjtcbiAgfSxcbik6IFByb21pc2U8bnVtYmVyPiB7XG4gIGxldCBuID0gMDtcbiAgY29uc3QgYnVmU2l6ZSA9IG9wdGlvbnM/LmJ1ZlNpemUgPz8gREVGQVVMVF9CVUZGRVJfU0laRTtcbiAgY29uc3QgYiA9IG5ldyBVaW50OEFycmF5KGJ1ZlNpemUpO1xuICBsZXQgZ290RU9GID0gZmFsc2U7XG4gIHdoaWxlIChnb3RFT0YgPT09IGZhbHNlKSB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgc3JjLnJlYWQoYik7XG4gICAgaWYgKHJlc3VsdCA9PT0gbnVsbCkge1xuICAgICAgZ290RU9GID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IG53cml0dGVuID0gMDtcbiAgICAgIHdoaWxlIChud3JpdHRlbiA8IHJlc3VsdCkge1xuICAgICAgICBud3JpdHRlbiArPSBhd2FpdCBkc3Qud3JpdGUoYi5zdWJhcnJheShud3JpdHRlbiwgcmVzdWx0KSk7XG4gICAgICB9XG4gICAgICBuICs9IG53cml0dGVuO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbjtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDLFNBQVMsbUJBQW1CLFFBQVEsZUFBZTtBQUduRDs7Ozs7Ozs7Ozs7Ozs7OztDQWdCQyxHQUNELE9BQU8sZUFBZSxLQUNwQixHQUFXLEVBQ1gsR0FBVyxFQUNYLE9BRUM7SUFFRCxJQUFJLElBQUk7SUFDUixNQUFNLFVBQVUsU0FBUyxXQUFXO0lBQ3BDLE1BQU0sSUFBSSxJQUFJLFdBQVc7SUFDekIsSUFBSSxTQUFTO0lBQ2IsTUFBTyxXQUFXLE1BQU87UUFDdkIsTUFBTSxTQUFTLE1BQU0sSUFBSSxLQUFLO1FBQzlCLElBQUksV0FBVyxNQUFNO1lBQ25CLFNBQVM7UUFDWCxPQUFPO1lBQ0wsSUFBSSxXQUFXO1lBQ2YsTUFBTyxXQUFXLE9BQVE7Z0JBQ3hCLFlBQVksTUFBTSxJQUFJLE1BQU0sRUFBRSxTQUFTLFVBQVU7WUFDbkQ7WUFDQSxLQUFLO1FBQ1A7SUFDRjtJQUNBLE9BQU87QUFDVCJ9