// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * An abstraction of multiple Uint8Arrays
 */ export class BytesList {
    #len = 0;
    #chunks = [];
    constructor(){}
    /**
   * Total size of bytes
   */ size() {
        return this.#len;
    }
    /**
   * Push bytes with given offset infos
   */ add(value, start = 0, end = value.byteLength) {
        if (value.byteLength === 0 || end - start === 0) {
            return;
        }
        checkRange(start, end, value.byteLength);
        this.#chunks.push({
            value,
            end,
            start,
            offset: this.#len
        });
        this.#len += end - start;
    }
    /**
   * Drop head `n` bytes.
   */ shift(n) {
        if (n === 0) {
            return;
        }
        if (this.#len <= n) {
            this.#chunks = [];
            this.#len = 0;
            return;
        }
        const idx = this.getChunkIndex(n);
        this.#chunks.splice(0, idx);
        const [chunk] = this.#chunks;
        if (chunk) {
            const diff = n - chunk.offset;
            chunk.start += diff;
        }
        let offset = 0;
        for (const chunk of this.#chunks){
            chunk.offset = offset;
            offset += chunk.end - chunk.start;
        }
        this.#len = offset;
    }
    /**
   * Find chunk index in which `pos` locates by binary-search
   * returns -1 if out of range
   */ getChunkIndex(pos) {
        let max = this.#chunks.length;
        let min = 0;
        while(true){
            const i = min + Math.floor((max - min) / 2);
            if (i < 0 || this.#chunks.length <= i) {
                return -1;
            }
            const { offset , start , end  } = this.#chunks[i];
            const len = end - start;
            if (offset <= pos && pos < offset + len) {
                return i;
            } else if (offset + len <= pos) {
                min = i + 1;
            } else {
                max = i - 1;
            }
        }
    }
    /**
   * Get indexed byte from chunks
   */ get(i) {
        if (i < 0 || this.#len <= i) {
            throw new Error("out of range");
        }
        const idx = this.getChunkIndex(i);
        const { value , offset , start  } = this.#chunks[idx];
        return value[start + i - offset];
    }
    /**
   * Iterator of bytes from given position
   */ *iterator(start = 0) {
        const startIdx = this.getChunkIndex(start);
        if (startIdx < 0) return;
        const first = this.#chunks[startIdx];
        let firstOffset = start - first.offset;
        for(let i = startIdx; i < this.#chunks.length; i++){
            const chunk = this.#chunks[i];
            for(let j = chunk.start + firstOffset; j < chunk.end; j++){
                yield chunk.value[j];
            }
            firstOffset = 0;
        }
    }
    /**
   * Returns subset of bytes copied
   */ slice(start, end = this.#len) {
        if (end === start) {
            return new Uint8Array();
        }
        checkRange(start, end, this.#len);
        const result = new Uint8Array(end - start);
        const startIdx = this.getChunkIndex(start);
        const endIdx = this.getChunkIndex(end - 1);
        let written = 0;
        for(let i = startIdx; i <= endIdx; i++){
            const { value: chunkValue , start: chunkStart , end: chunkEnd , offset: chunkOffset  } = this.#chunks[i];
            const readStart = chunkStart + (i === startIdx ? start - chunkOffset : 0);
            const readEnd = i === endIdx ? end - chunkOffset + chunkStart : chunkEnd;
            const len = readEnd - readStart;
            result.set(chunkValue.subarray(readStart, readEnd), written);
            written += len;
        }
        return result;
    }
    /**
   * Concatenate chunks into single Uint8Array copied.
   */ concat() {
        const result = new Uint8Array(this.#len);
        let sum = 0;
        for (const { value , start , end  } of this.#chunks){
            result.set(value.subarray(start, end), sum);
            sum += end - start;
        }
        return result;
    }
}
function checkRange(start, end, len) {
    if (start < 0 || len < start || end < 0 || len < end || end < start) {
        throw new Error("invalid range");
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE5My4wL2J5dGVzL2J5dGVzX2xpc3QudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMyB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuLyoqXG4gKiBBbiBhYnN0cmFjdGlvbiBvZiBtdWx0aXBsZSBVaW50OEFycmF5c1xuICovXG5leHBvcnQgY2xhc3MgQnl0ZXNMaXN0IHtcbiAgI2xlbiA9IDA7XG4gICNjaHVua3M6IHtcbiAgICB2YWx1ZTogVWludDhBcnJheTtcbiAgICBzdGFydDogbnVtYmVyOyAvLyBzdGFydCBvZmZzZXQgZnJvbSBoZWFkIG9mIGNodW5rXG4gICAgZW5kOiBudW1iZXI7IC8vIGVuZCBvZmZzZXQgZnJvbSBoZWFkIG9mIGNodW5rXG4gICAgb2Zmc2V0OiBudW1iZXI7IC8vIG9mZnNldCBvZiBoZWFkIGluIGFsbCBieXRlc1xuICB9W10gPSBbXTtcbiAgY29uc3RydWN0b3IoKSB7fVxuXG4gIC8qKlxuICAgKiBUb3RhbCBzaXplIG9mIGJ5dGVzXG4gICAqL1xuICBzaXplKCkge1xuICAgIHJldHVybiB0aGlzLiNsZW47XG4gIH1cbiAgLyoqXG4gICAqIFB1c2ggYnl0ZXMgd2l0aCBnaXZlbiBvZmZzZXQgaW5mb3NcbiAgICovXG4gIGFkZCh2YWx1ZTogVWludDhBcnJheSwgc3RhcnQgPSAwLCBlbmQgPSB2YWx1ZS5ieXRlTGVuZ3RoKSB7XG4gICAgaWYgKHZhbHVlLmJ5dGVMZW5ndGggPT09IDAgfHwgZW5kIC0gc3RhcnQgPT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY2hlY2tSYW5nZShzdGFydCwgZW5kLCB2YWx1ZS5ieXRlTGVuZ3RoKTtcbiAgICB0aGlzLiNjaHVua3MucHVzaCh7XG4gICAgICB2YWx1ZSxcbiAgICAgIGVuZCxcbiAgICAgIHN0YXJ0LFxuICAgICAgb2Zmc2V0OiB0aGlzLiNsZW4sXG4gICAgfSk7XG4gICAgdGhpcy4jbGVuICs9IGVuZCAtIHN0YXJ0O1xuICB9XG5cbiAgLyoqXG4gICAqIERyb3AgaGVhZCBgbmAgYnl0ZXMuXG4gICAqL1xuICBzaGlmdChuOiBudW1iZXIpIHtcbiAgICBpZiAobiA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodGhpcy4jbGVuIDw9IG4pIHtcbiAgICAgIHRoaXMuI2NodW5rcyA9IFtdO1xuICAgICAgdGhpcy4jbGVuID0gMDtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgaWR4ID0gdGhpcy5nZXRDaHVua0luZGV4KG4pO1xuICAgIHRoaXMuI2NodW5rcy5zcGxpY2UoMCwgaWR4KTtcbiAgICBjb25zdCBbY2h1bmtdID0gdGhpcy4jY2h1bmtzO1xuICAgIGlmIChjaHVuaykge1xuICAgICAgY29uc3QgZGlmZiA9IG4gLSBjaHVuay5vZmZzZXQ7XG4gICAgICBjaHVuay5zdGFydCArPSBkaWZmO1xuICAgIH1cbiAgICBsZXQgb2Zmc2V0ID0gMDtcbiAgICBmb3IgKGNvbnN0IGNodW5rIG9mIHRoaXMuI2NodW5rcykge1xuICAgICAgY2h1bmsub2Zmc2V0ID0gb2Zmc2V0O1xuICAgICAgb2Zmc2V0ICs9IGNodW5rLmVuZCAtIGNodW5rLnN0YXJ0O1xuICAgIH1cbiAgICB0aGlzLiNsZW4gPSBvZmZzZXQ7XG4gIH1cblxuICAvKipcbiAgICogRmluZCBjaHVuayBpbmRleCBpbiB3aGljaCBgcG9zYCBsb2NhdGVzIGJ5IGJpbmFyeS1zZWFyY2hcbiAgICogcmV0dXJucyAtMSBpZiBvdXQgb2YgcmFuZ2VcbiAgICovXG4gIGdldENodW5rSW5kZXgocG9zOiBudW1iZXIpOiBudW1iZXIge1xuICAgIGxldCBtYXggPSB0aGlzLiNjaHVua3MubGVuZ3RoO1xuICAgIGxldCBtaW4gPSAwO1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICBjb25zdCBpID0gbWluICsgTWF0aC5mbG9vcigobWF4IC0gbWluKSAvIDIpO1xuICAgICAgaWYgKGkgPCAwIHx8IHRoaXMuI2NodW5rcy5sZW5ndGggPD0gaSkge1xuICAgICAgICByZXR1cm4gLTE7XG4gICAgICB9XG4gICAgICBjb25zdCB7IG9mZnNldCwgc3RhcnQsIGVuZCB9ID0gdGhpcy4jY2h1bmtzW2ldO1xuICAgICAgY29uc3QgbGVuID0gZW5kIC0gc3RhcnQ7XG4gICAgICBpZiAob2Zmc2V0IDw9IHBvcyAmJiBwb3MgPCBvZmZzZXQgKyBsZW4pIHtcbiAgICAgICAgcmV0dXJuIGk7XG4gICAgICB9IGVsc2UgaWYgKG9mZnNldCArIGxlbiA8PSBwb3MpIHtcbiAgICAgICAgbWluID0gaSArIDE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtYXggPSBpIC0gMTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0IGluZGV4ZWQgYnl0ZSBmcm9tIGNodW5rc1xuICAgKi9cbiAgZ2V0KGk6IG51bWJlcik6IG51bWJlciB7XG4gICAgaWYgKGkgPCAwIHx8IHRoaXMuI2xlbiA8PSBpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJvdXQgb2YgcmFuZ2VcIik7XG4gICAgfVxuICAgIGNvbnN0IGlkeCA9IHRoaXMuZ2V0Q2h1bmtJbmRleChpKTtcbiAgICBjb25zdCB7IHZhbHVlLCBvZmZzZXQsIHN0YXJ0IH0gPSB0aGlzLiNjaHVua3NbaWR4XTtcbiAgICByZXR1cm4gdmFsdWVbc3RhcnQgKyBpIC0gb2Zmc2V0XTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJdGVyYXRvciBvZiBieXRlcyBmcm9tIGdpdmVuIHBvc2l0aW9uXG4gICAqL1xuICAqaXRlcmF0b3Ioc3RhcnQgPSAwKTogSXRlcmFibGVJdGVyYXRvcjxudW1iZXI+IHtcbiAgICBjb25zdCBzdGFydElkeCA9IHRoaXMuZ2V0Q2h1bmtJbmRleChzdGFydCk7XG4gICAgaWYgKHN0YXJ0SWR4IDwgMCkgcmV0dXJuO1xuICAgIGNvbnN0IGZpcnN0ID0gdGhpcy4jY2h1bmtzW3N0YXJ0SWR4XTtcbiAgICBsZXQgZmlyc3RPZmZzZXQgPSBzdGFydCAtIGZpcnN0Lm9mZnNldDtcbiAgICBmb3IgKGxldCBpID0gc3RhcnRJZHg7IGkgPCB0aGlzLiNjaHVua3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGNodW5rID0gdGhpcy4jY2h1bmtzW2ldO1xuICAgICAgZm9yIChsZXQgaiA9IGNodW5rLnN0YXJ0ICsgZmlyc3RPZmZzZXQ7IGogPCBjaHVuay5lbmQ7IGorKykge1xuICAgICAgICB5aWVsZCBjaHVuay52YWx1ZVtqXTtcbiAgICAgIH1cbiAgICAgIGZpcnN0T2Zmc2V0ID0gMDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBzdWJzZXQgb2YgYnl0ZXMgY29waWVkXG4gICAqL1xuICBzbGljZShzdGFydDogbnVtYmVyLCBlbmQ6IG51bWJlciA9IHRoaXMuI2xlbik6IFVpbnQ4QXJyYXkge1xuICAgIGlmIChlbmQgPT09IHN0YXJ0KSB7XG4gICAgICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoKTtcbiAgICB9XG4gICAgY2hlY2tSYW5nZShzdGFydCwgZW5kLCB0aGlzLiNsZW4pO1xuICAgIGNvbnN0IHJlc3VsdCA9IG5ldyBVaW50OEFycmF5KGVuZCAtIHN0YXJ0KTtcbiAgICBjb25zdCBzdGFydElkeCA9IHRoaXMuZ2V0Q2h1bmtJbmRleChzdGFydCk7XG4gICAgY29uc3QgZW5kSWR4ID0gdGhpcy5nZXRDaHVua0luZGV4KGVuZCAtIDEpO1xuICAgIGxldCB3cml0dGVuID0gMDtcbiAgICBmb3IgKGxldCBpID0gc3RhcnRJZHg7IGkgPD0gZW5kSWR4OyBpKyspIHtcbiAgICAgIGNvbnN0IHtcbiAgICAgICAgdmFsdWU6IGNodW5rVmFsdWUsXG4gICAgICAgIHN0YXJ0OiBjaHVua1N0YXJ0LFxuICAgICAgICBlbmQ6IGNodW5rRW5kLFxuICAgICAgICBvZmZzZXQ6IGNodW5rT2Zmc2V0LFxuICAgICAgfSA9IHRoaXMuI2NodW5rc1tpXTtcbiAgICAgIGNvbnN0IHJlYWRTdGFydCA9IGNodW5rU3RhcnQgKyAoaSA9PT0gc3RhcnRJZHggPyBzdGFydCAtIGNodW5rT2Zmc2V0IDogMCk7XG4gICAgICBjb25zdCByZWFkRW5kID0gaSA9PT0gZW5kSWR4ID8gZW5kIC0gY2h1bmtPZmZzZXQgKyBjaHVua1N0YXJ0IDogY2h1bmtFbmQ7XG4gICAgICBjb25zdCBsZW4gPSByZWFkRW5kIC0gcmVhZFN0YXJ0O1xuICAgICAgcmVzdWx0LnNldChjaHVua1ZhbHVlLnN1YmFycmF5KHJlYWRTdGFydCwgcmVhZEVuZCksIHdyaXR0ZW4pO1xuICAgICAgd3JpdHRlbiArPSBsZW47XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgLyoqXG4gICAqIENvbmNhdGVuYXRlIGNodW5rcyBpbnRvIHNpbmdsZSBVaW50OEFycmF5IGNvcGllZC5cbiAgICovXG4gIGNvbmNhdCgpOiBVaW50OEFycmF5IHtcbiAgICBjb25zdCByZXN1bHQgPSBuZXcgVWludDhBcnJheSh0aGlzLiNsZW4pO1xuICAgIGxldCBzdW0gPSAwO1xuICAgIGZvciAoY29uc3QgeyB2YWx1ZSwgc3RhcnQsIGVuZCB9IG9mIHRoaXMuI2NodW5rcykge1xuICAgICAgcmVzdWx0LnNldCh2YWx1ZS5zdWJhcnJheShzdGFydCwgZW5kKSwgc3VtKTtcbiAgICAgIHN1bSArPSBlbmQgLSBzdGFydDtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxufVxuXG5mdW5jdGlvbiBjaGVja1JhbmdlKHN0YXJ0OiBudW1iZXIsIGVuZDogbnVtYmVyLCBsZW46IG51bWJlcikge1xuICBpZiAoc3RhcnQgPCAwIHx8IGxlbiA8IHN0YXJ0IHx8IGVuZCA8IDAgfHwgbGVuIDwgZW5kIHx8IGVuZCA8IHN0YXJ0KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiaW52YWxpZCByYW5nZVwiKTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFB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