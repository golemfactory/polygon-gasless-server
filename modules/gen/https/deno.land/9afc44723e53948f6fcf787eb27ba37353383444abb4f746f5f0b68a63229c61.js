// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Slice number into 64bit big endian byte array
 * @param d The number to be sliced
 * @param dest The sliced array
 */ export function sliceLongToBytes(d, dest = Array.from({
    length: 8
})) {
    let big = BigInt(d);
    for(let i = 0; i < 8; i++){
        dest[7 - i] = Number(big & 0xffn);
        big >>= 8n;
    }
    return dest;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5My4wL2lvL3NsaWNlX2xvbmdfdG9fYnl0ZXMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMyB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuLyoqXG4gKiBTbGljZSBudW1iZXIgaW50byA2NGJpdCBiaWcgZW5kaWFuIGJ5dGUgYXJyYXlcbiAqIEBwYXJhbSBkIFRoZSBudW1iZXIgdG8gYmUgc2xpY2VkXG4gKiBAcGFyYW0gZGVzdCBUaGUgc2xpY2VkIGFycmF5XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzbGljZUxvbmdUb0J5dGVzKFxuICBkOiBudW1iZXIsXG4gIGRlc3QgPSBBcnJheS5mcm9tPG51bWJlcj4oeyBsZW5ndGg6IDggfSksXG4pOiBudW1iZXJbXSB7XG4gIGxldCBiaWcgPSBCaWdJbnQoZCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgODsgaSsrKSB7XG4gICAgZGVzdFs3IC0gaV0gPSBOdW1iZXIoYmlnICYgMHhmZm4pO1xuICAgIGJpZyA+Pj0gOG47XG4gIH1cbiAgcmV0dXJuIGRlc3Q7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUVyQzs7OztDQUlDLEdBQ0QsT0FBTyxTQUFTLGlCQUNkLENBQVMsRUFDVCxPQUFPLE1BQU0sS0FBYTtJQUFFLFFBQVE7QUFBRSxFQUFFO0lBRXhDLElBQUksTUFBTSxPQUFPO0lBQ2pCLElBQUssSUFBSSxJQUFJLEdBQUcsSUFBSSxHQUFHLElBQUs7UUFDMUIsSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLE9BQU8sTUFBTSxLQUFLO1FBQ2hDLFFBQVEsRUFBRTtJQUNaO0lBQ0EsT0FBTztBQUNUIn0=