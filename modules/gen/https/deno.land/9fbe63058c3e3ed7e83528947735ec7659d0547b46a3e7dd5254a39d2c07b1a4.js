// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { getLevelByName, LogLevels } from "./levels.ts";
import { blue, bold, red, yellow } from "../fmt/colors.ts";
import { exists, existsSync } from "../fs/exists.ts";
import { BufWriterSync } from "../io/buffer.ts";
const DEFAULT_FORMATTER = "{levelName} {msg}";
export class BaseHandler {
    level;
    levelName;
    formatter;
    constructor(levelName, options = {}){
        this.level = getLevelByName(levelName);
        this.levelName = levelName;
        this.formatter = options.formatter || DEFAULT_FORMATTER;
    }
    handle(logRecord) {
        if (this.level > logRecord.level) return;
        const msg = this.format(logRecord);
        return this.log(msg);
    }
    format(logRecord) {
        if (this.formatter instanceof Function) {
            return this.formatter(logRecord);
        }
        return this.formatter.replace(/{(\S+)}/g, (match, p1)=>{
            const value = logRecord[p1];
            // do not interpolate missing values
            if (value == null) {
                return match;
            }
            return String(value);
        });
    }
    log(_msg) {}
    async setup() {}
    async destroy() {}
}
export class ConsoleHandler extends BaseHandler {
    format(logRecord) {
        let msg = super.format(logRecord);
        switch(logRecord.level){
            case LogLevels.INFO:
                msg = blue(msg);
                break;
            case LogLevels.WARNING:
                msg = yellow(msg);
                break;
            case LogLevels.ERROR:
                msg = red(msg);
                break;
            case LogLevels.CRITICAL:
                msg = bold(red(msg));
                break;
            default:
                break;
        }
        return msg;
    }
    log(msg) {
        console.log(msg);
    }
}
export class WriterHandler extends BaseHandler {
    _writer;
    #encoder = new TextEncoder();
}
export class FileHandler extends WriterHandler {
    _file;
    _buf;
    _filename;
    _mode;
    _openOptions;
    _encoder = new TextEncoder();
    #unloadCallback = (()=>{
        this.destroy();
    }).bind(this);
    constructor(levelName, options){
        super(levelName, options);
        this._filename = options.filename;
        // default to append mode, write only
        this._mode = options.mode ? options.mode : "a";
        this._openOptions = {
            createNew: this._mode === "x",
            create: this._mode !== "x",
            append: this._mode === "a",
            truncate: this._mode !== "a",
            write: true
        };
    }
    async setup() {
        this._file = await Deno.open(this._filename, this._openOptions);
        this._writer = this._file;
        this._buf = new BufWriterSync(this._file);
        addEventListener("unload", this.#unloadCallback);
    }
    handle(logRecord) {
        super.handle(logRecord);
        // Immediately flush if log level is higher than ERROR
        if (logRecord.level > LogLevels.ERROR) {
            this.flush();
        }
    }
    log(msg) {
        if (this._encoder.encode(msg).byteLength + 1 > this._buf.available()) {
            this.flush();
        }
        this._buf.writeSync(this._encoder.encode(msg + "\n"));
    }
    flush() {
        if (this._buf?.buffered() > 0) {
            this._buf.flush();
        }
    }
    destroy() {
        this.flush();
        this._file?.close();
        this._file = undefined;
        removeEventListener("unload", this.#unloadCallback);
        return Promise.resolve();
    }
}
export class RotatingFileHandler extends FileHandler {
    #maxBytes;
    #maxBackupCount;
    #currentFileSize = 0;
    constructor(levelName, options){
        super(levelName, options);
        this.#maxBytes = options.maxBytes;
        this.#maxBackupCount = options.maxBackupCount;
    }
    async setup() {
        if (this.#maxBytes < 1) {
            this.destroy();
            throw new Error("maxBytes cannot be less than 1");
        }
        if (this.#maxBackupCount < 1) {
            this.destroy();
            throw new Error("maxBackupCount cannot be less than 1");
        }
        await super.setup();
        if (this._mode === "w") {
            // Remove old backups too as it doesn't make sense to start with a clean
            // log file, but old backups
            for(let i = 1; i <= this.#maxBackupCount; i++){
                if (await exists(this._filename + "." + i)) {
                    await Deno.remove(this._filename + "." + i);
                }
            }
        } else if (this._mode === "x") {
            // Throw if any backups also exist
            for(let i = 1; i <= this.#maxBackupCount; i++){
                if (await exists(this._filename + "." + i)) {
                    this.destroy();
                    throw new Deno.errors.AlreadyExists("Backup log file " + this._filename + "." + i + " already exists");
                }
            }
        } else {
            this.#currentFileSize = (await Deno.stat(this._filename)).size;
        }
    }
    log(msg) {
        const msgByteLength = this._encoder.encode(msg).byteLength + 1;
        if (this.#currentFileSize + msgByteLength > this.#maxBytes) {
            this.rotateLogFiles();
            this.#currentFileSize = 0;
        }
        super.log(msg);
        this.#currentFileSize += msgByteLength;
    }
    rotateLogFiles() {
        this._buf.flush();
        Deno.close(this._file.rid);
        for(let i = this.#maxBackupCount - 1; i >= 0; i--){
            const source = this._filename + (i === 0 ? "" : "." + i);
            const dest = this._filename + "." + (i + 1);
            if (existsSync(source)) {
                Deno.renameSync(source, dest);
            }
        }
        this._file = Deno.openSync(this._filename, this._openOptions);
        this._writer = this._file;
        this._buf = new BufWriterSync(this._file);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjEzMy4wL2xvZy9oYW5kbGVycy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIyIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuaW1wb3J0IHsgZ2V0TGV2ZWxCeU5hbWUsIExldmVsTmFtZSwgTG9nTGV2ZWxzIH0gZnJvbSBcIi4vbGV2ZWxzLnRzXCI7XG5pbXBvcnQgdHlwZSB7IExvZ1JlY29yZCB9IGZyb20gXCIuL2xvZ2dlci50c1wiO1xuaW1wb3J0IHsgYmx1ZSwgYm9sZCwgcmVkLCB5ZWxsb3cgfSBmcm9tIFwiLi4vZm10L2NvbG9ycy50c1wiO1xuaW1wb3J0IHsgZXhpc3RzLCBleGlzdHNTeW5jIH0gZnJvbSBcIi4uL2ZzL2V4aXN0cy50c1wiO1xuaW1wb3J0IHsgQnVmV3JpdGVyU3luYyB9IGZyb20gXCIuLi9pby9idWZmZXIudHNcIjtcblxuY29uc3QgREVGQVVMVF9GT1JNQVRURVIgPSBcIntsZXZlbE5hbWV9IHttc2d9XCI7XG5leHBvcnQgdHlwZSBGb3JtYXR0ZXJGdW5jdGlvbiA9IChsb2dSZWNvcmQ6IExvZ1JlY29yZCkgPT4gc3RyaW5nO1xuZXhwb3J0IHR5cGUgTG9nTW9kZSA9IFwiYVwiIHwgXCJ3XCIgfCBcInhcIjtcblxuZXhwb3J0IGludGVyZmFjZSBIYW5kbGVyT3B0aW9ucyB7XG4gIGZvcm1hdHRlcj86IHN0cmluZyB8IEZvcm1hdHRlckZ1bmN0aW9uO1xufVxuXG5leHBvcnQgY2xhc3MgQmFzZUhhbmRsZXIge1xuICBsZXZlbDogbnVtYmVyO1xuICBsZXZlbE5hbWU6IExldmVsTmFtZTtcbiAgZm9ybWF0dGVyOiBzdHJpbmcgfCBGb3JtYXR0ZXJGdW5jdGlvbjtcblxuICBjb25zdHJ1Y3RvcihsZXZlbE5hbWU6IExldmVsTmFtZSwgb3B0aW9uczogSGFuZGxlck9wdGlvbnMgPSB7fSkge1xuICAgIHRoaXMubGV2ZWwgPSBnZXRMZXZlbEJ5TmFtZShsZXZlbE5hbWUpO1xuICAgIHRoaXMubGV2ZWxOYW1lID0gbGV2ZWxOYW1lO1xuXG4gICAgdGhpcy5mb3JtYXR0ZXIgPSBvcHRpb25zLmZvcm1hdHRlciB8fCBERUZBVUxUX0ZPUk1BVFRFUjtcbiAgfVxuXG4gIGhhbmRsZShsb2dSZWNvcmQ6IExvZ1JlY29yZCk6IHZvaWQge1xuICAgIGlmICh0aGlzLmxldmVsID4gbG9nUmVjb3JkLmxldmVsKSByZXR1cm47XG5cbiAgICBjb25zdCBtc2cgPSB0aGlzLmZvcm1hdChsb2dSZWNvcmQpO1xuICAgIHJldHVybiB0aGlzLmxvZyhtc2cpO1xuICB9XG5cbiAgZm9ybWF0KGxvZ1JlY29yZDogTG9nUmVjb3JkKTogc3RyaW5nIHtcbiAgICBpZiAodGhpcy5mb3JtYXR0ZXIgaW5zdGFuY2VvZiBGdW5jdGlvbikge1xuICAgICAgcmV0dXJuIHRoaXMuZm9ybWF0dGVyKGxvZ1JlY29yZCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuZm9ybWF0dGVyLnJlcGxhY2UoL3soXFxTKyl9L2csIChtYXRjaCwgcDEpOiBzdHJpbmcgPT4ge1xuICAgICAgY29uc3QgdmFsdWUgPSBsb2dSZWNvcmRbcDEgYXMga2V5b2YgTG9nUmVjb3JkXTtcblxuICAgICAgLy8gZG8gbm90IGludGVycG9sYXRlIG1pc3NpbmcgdmFsdWVzXG4gICAgICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gbWF0Y2g7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBTdHJpbmcodmFsdWUpO1xuICAgIH0pO1xuICB9XG5cbiAgbG9nKF9tc2c6IHN0cmluZyk6IHZvaWQge31cbiAgYXN5bmMgc2V0dXAoKSB7fVxuICBhc3luYyBkZXN0cm95KCkge31cbn1cblxuZXhwb3J0IGNsYXNzIENvbnNvbGVIYW5kbGVyIGV4dGVuZHMgQmFzZUhhbmRsZXIge1xuICBvdmVycmlkZSBmb3JtYXQobG9nUmVjb3JkOiBMb2dSZWNvcmQpOiBzdHJpbmcge1xuICAgIGxldCBtc2cgPSBzdXBlci5mb3JtYXQobG9nUmVjb3JkKTtcblxuICAgIHN3aXRjaCAobG9nUmVjb3JkLmxldmVsKSB7XG4gICAgICBjYXNlIExvZ0xldmVscy5JTkZPOlxuICAgICAgICBtc2cgPSBibHVlKG1zZyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBMb2dMZXZlbHMuV0FSTklORzpcbiAgICAgICAgbXNnID0geWVsbG93KG1zZyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBMb2dMZXZlbHMuRVJST1I6XG4gICAgICAgIG1zZyA9IHJlZChtc2cpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgTG9nTGV2ZWxzLkNSSVRJQ0FMOlxuICAgICAgICBtc2cgPSBib2xkKHJlZChtc2cpKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICByZXR1cm4gbXNnO1xuICB9XG5cbiAgb3ZlcnJpZGUgbG9nKG1zZzogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc29sZS5sb2cobXNnKTtcbiAgfVxufVxuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgV3JpdGVySGFuZGxlciBleHRlbmRzIEJhc2VIYW5kbGVyIHtcbiAgcHJvdGVjdGVkIF93cml0ZXIhOiBEZW5vLldyaXRlcjtcbiAgI2VuY29kZXIgPSBuZXcgVGV4dEVuY29kZXIoKTtcblxuICBhYnN0cmFjdCBvdmVycmlkZSBsb2cobXNnOiBzdHJpbmcpOiB2b2lkO1xufVxuXG5pbnRlcmZhY2UgRmlsZUhhbmRsZXJPcHRpb25zIGV4dGVuZHMgSGFuZGxlck9wdGlvbnMge1xuICBmaWxlbmFtZTogc3RyaW5nO1xuICBtb2RlPzogTG9nTW9kZTtcbn1cblxuZXhwb3J0IGNsYXNzIEZpbGVIYW5kbGVyIGV4dGVuZHMgV3JpdGVySGFuZGxlciB7XG4gIHByb3RlY3RlZCBfZmlsZTogRGVuby5Gc0ZpbGUgfCB1bmRlZmluZWQ7XG4gIHByb3RlY3RlZCBfYnVmITogQnVmV3JpdGVyU3luYztcbiAgcHJvdGVjdGVkIF9maWxlbmFtZTogc3RyaW5nO1xuICBwcm90ZWN0ZWQgX21vZGU6IExvZ01vZGU7XG4gIHByb3RlY3RlZCBfb3Blbk9wdGlvbnM6IERlbm8uT3Blbk9wdGlvbnM7XG4gIHByb3RlY3RlZCBfZW5jb2RlciA9IG5ldyBUZXh0RW5jb2RlcigpO1xuICAjdW5sb2FkQ2FsbGJhY2sgPSAoKCkgPT4ge1xuICAgIHRoaXMuZGVzdHJveSgpO1xuICB9KS5iaW5kKHRoaXMpO1xuXG4gIGNvbnN0cnVjdG9yKGxldmVsTmFtZTogTGV2ZWxOYW1lLCBvcHRpb25zOiBGaWxlSGFuZGxlck9wdGlvbnMpIHtcbiAgICBzdXBlcihsZXZlbE5hbWUsIG9wdGlvbnMpO1xuICAgIHRoaXMuX2ZpbGVuYW1lID0gb3B0aW9ucy5maWxlbmFtZTtcbiAgICAvLyBkZWZhdWx0IHRvIGFwcGVuZCBtb2RlLCB3cml0ZSBvbmx5XG4gICAgdGhpcy5fbW9kZSA9IG9wdGlvbnMubW9kZSA/IG9wdGlvbnMubW9kZSA6IFwiYVwiO1xuICAgIHRoaXMuX29wZW5PcHRpb25zID0ge1xuICAgICAgY3JlYXRlTmV3OiB0aGlzLl9tb2RlID09PSBcInhcIixcbiAgICAgIGNyZWF0ZTogdGhpcy5fbW9kZSAhPT0gXCJ4XCIsXG4gICAgICBhcHBlbmQ6IHRoaXMuX21vZGUgPT09IFwiYVwiLFxuICAgICAgdHJ1bmNhdGU6IHRoaXMuX21vZGUgIT09IFwiYVwiLFxuICAgICAgd3JpdGU6IHRydWUsXG4gICAgfTtcbiAgfVxuXG4gIG92ZXJyaWRlIGFzeW5jIHNldHVwKCkge1xuICAgIHRoaXMuX2ZpbGUgPSBhd2FpdCBEZW5vLm9wZW4odGhpcy5fZmlsZW5hbWUsIHRoaXMuX29wZW5PcHRpb25zKTtcbiAgICB0aGlzLl93cml0ZXIgPSB0aGlzLl9maWxlO1xuICAgIHRoaXMuX2J1ZiA9IG5ldyBCdWZXcml0ZXJTeW5jKHRoaXMuX2ZpbGUpO1xuXG4gICAgYWRkRXZlbnRMaXN0ZW5lcihcInVubG9hZFwiLCB0aGlzLiN1bmxvYWRDYWxsYmFjayk7XG4gIH1cblxuICBvdmVycmlkZSBoYW5kbGUobG9nUmVjb3JkOiBMb2dSZWNvcmQpOiB2b2lkIHtcbiAgICBzdXBlci5oYW5kbGUobG9nUmVjb3JkKTtcblxuICAgIC8vIEltbWVkaWF0ZWx5IGZsdXNoIGlmIGxvZyBsZXZlbCBpcyBoaWdoZXIgdGhhbiBFUlJPUlxuICAgIGlmIChsb2dSZWNvcmQubGV2ZWwgPiBMb2dMZXZlbHMuRVJST1IpIHtcbiAgICAgIHRoaXMuZmx1c2goKTtcbiAgICB9XG4gIH1cblxuICBsb2cobXNnOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fZW5jb2Rlci5lbmNvZGUobXNnKS5ieXRlTGVuZ3RoICsgMSA+IHRoaXMuX2J1Zi5hdmFpbGFibGUoKSkge1xuICAgICAgdGhpcy5mbHVzaCgpO1xuICAgIH1cbiAgICB0aGlzLl9idWYud3JpdGVTeW5jKHRoaXMuX2VuY29kZXIuZW5jb2RlKG1zZyArIFwiXFxuXCIpKTtcbiAgfVxuXG4gIGZsdXNoKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9idWY/LmJ1ZmZlcmVkKCkgPiAwKSB7XG4gICAgICB0aGlzLl9idWYuZmx1c2goKTtcbiAgICB9XG4gIH1cblxuICBvdmVycmlkZSBkZXN0cm95KCkge1xuICAgIHRoaXMuZmx1c2goKTtcbiAgICB0aGlzLl9maWxlPy5jbG9zZSgpO1xuICAgIHRoaXMuX2ZpbGUgPSB1bmRlZmluZWQ7XG4gICAgcmVtb3ZlRXZlbnRMaXN0ZW5lcihcInVubG9hZFwiLCB0aGlzLiN1bmxvYWRDYWxsYmFjayk7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICB9XG59XG5cbmludGVyZmFjZSBSb3RhdGluZ0ZpbGVIYW5kbGVyT3B0aW9ucyBleHRlbmRzIEZpbGVIYW5kbGVyT3B0aW9ucyB7XG4gIG1heEJ5dGVzOiBudW1iZXI7XG4gIG1heEJhY2t1cENvdW50OiBudW1iZXI7XG59XG5cbmV4cG9ydCBjbGFzcyBSb3RhdGluZ0ZpbGVIYW5kbGVyIGV4dGVuZHMgRmlsZUhhbmRsZXIge1xuICAjbWF4Qnl0ZXM6IG51bWJlcjtcbiAgI21heEJhY2t1cENvdW50OiBudW1iZXI7XG4gICNjdXJyZW50RmlsZVNpemUgPSAwO1xuXG4gIGNvbnN0cnVjdG9yKGxldmVsTmFtZTogTGV2ZWxOYW1lLCBvcHRpb25zOiBSb3RhdGluZ0ZpbGVIYW5kbGVyT3B0aW9ucykge1xuICAgIHN1cGVyKGxldmVsTmFtZSwgb3B0aW9ucyk7XG4gICAgdGhpcy4jbWF4Qnl0ZXMgPSBvcHRpb25zLm1heEJ5dGVzO1xuICAgIHRoaXMuI21heEJhY2t1cENvdW50ID0gb3B0aW9ucy5tYXhCYWNrdXBDb3VudDtcbiAgfVxuXG4gIG92ZXJyaWRlIGFzeW5jIHNldHVwKCkge1xuICAgIGlmICh0aGlzLiNtYXhCeXRlcyA8IDEpIHtcbiAgICAgIHRoaXMuZGVzdHJveSgpO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwibWF4Qnl0ZXMgY2Fubm90IGJlIGxlc3MgdGhhbiAxXCIpO1xuICAgIH1cbiAgICBpZiAodGhpcy4jbWF4QmFja3VwQ291bnQgPCAxKSB7XG4gICAgICB0aGlzLmRlc3Ryb3koKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIm1heEJhY2t1cENvdW50IGNhbm5vdCBiZSBsZXNzIHRoYW4gMVwiKTtcbiAgICB9XG4gICAgYXdhaXQgc3VwZXIuc2V0dXAoKTtcblxuICAgIGlmICh0aGlzLl9tb2RlID09PSBcIndcIikge1xuICAgICAgLy8gUmVtb3ZlIG9sZCBiYWNrdXBzIHRvbyBhcyBpdCBkb2Vzbid0IG1ha2Ugc2Vuc2UgdG8gc3RhcnQgd2l0aCBhIGNsZWFuXG4gICAgICAvLyBsb2cgZmlsZSwgYnV0IG9sZCBiYWNrdXBzXG4gICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSB0aGlzLiNtYXhCYWNrdXBDb3VudDsgaSsrKSB7XG4gICAgICAgIGlmIChhd2FpdCBleGlzdHModGhpcy5fZmlsZW5hbWUgKyBcIi5cIiArIGkpKSB7XG4gICAgICAgICAgYXdhaXQgRGVuby5yZW1vdmUodGhpcy5fZmlsZW5hbWUgKyBcIi5cIiArIGkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0aGlzLl9tb2RlID09PSBcInhcIikge1xuICAgICAgLy8gVGhyb3cgaWYgYW55IGJhY2t1cHMgYWxzbyBleGlzdFxuICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gdGhpcy4jbWF4QmFja3VwQ291bnQ7IGkrKykge1xuICAgICAgICBpZiAoYXdhaXQgZXhpc3RzKHRoaXMuX2ZpbGVuYW1lICsgXCIuXCIgKyBpKSkge1xuICAgICAgICAgIHRoaXMuZGVzdHJveSgpO1xuICAgICAgICAgIHRocm93IG5ldyBEZW5vLmVycm9ycy5BbHJlYWR5RXhpc3RzKFxuICAgICAgICAgICAgXCJCYWNrdXAgbG9nIGZpbGUgXCIgKyB0aGlzLl9maWxlbmFtZSArIFwiLlwiICsgaSArIFwiIGFscmVhZHkgZXhpc3RzXCIsXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLiNjdXJyZW50RmlsZVNpemUgPSAoYXdhaXQgRGVuby5zdGF0KHRoaXMuX2ZpbGVuYW1lKSkuc2l6ZTtcbiAgICB9XG4gIH1cblxuICBvdmVycmlkZSBsb2cobXNnOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBtc2dCeXRlTGVuZ3RoID0gdGhpcy5fZW5jb2Rlci5lbmNvZGUobXNnKS5ieXRlTGVuZ3RoICsgMTtcblxuICAgIGlmICh0aGlzLiNjdXJyZW50RmlsZVNpemUgKyBtc2dCeXRlTGVuZ3RoID4gdGhpcy4jbWF4Qnl0ZXMpIHtcbiAgICAgIHRoaXMucm90YXRlTG9nRmlsZXMoKTtcbiAgICAgIHRoaXMuI2N1cnJlbnRGaWxlU2l6ZSA9IDA7XG4gICAgfVxuXG4gICAgc3VwZXIubG9nKG1zZyk7XG5cbiAgICB0aGlzLiNjdXJyZW50RmlsZVNpemUgKz0gbXNnQnl0ZUxlbmd0aDtcbiAgfVxuXG4gIHJvdGF0ZUxvZ0ZpbGVzKCk6IHZvaWQge1xuICAgIHRoaXMuX2J1Zi5mbHVzaCgpO1xuICAgIERlbm8uY2xvc2UodGhpcy5fZmlsZSEucmlkKTtcblxuICAgIGZvciAobGV0IGkgPSB0aGlzLiNtYXhCYWNrdXBDb3VudCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICBjb25zdCBzb3VyY2UgPSB0aGlzLl9maWxlbmFtZSArIChpID09PSAwID8gXCJcIiA6IFwiLlwiICsgaSk7XG4gICAgICBjb25zdCBkZXN0ID0gdGhpcy5fZmlsZW5hbWUgKyBcIi5cIiArIChpICsgMSk7XG5cbiAgICAgIGlmIChleGlzdHNTeW5jKHNvdXJjZSkpIHtcbiAgICAgICAgRGVuby5yZW5hbWVTeW5jKHNvdXJjZSwgZGVzdCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5fZmlsZSA9IERlbm8ub3BlblN5bmModGhpcy5fZmlsZW5hbWUsIHRoaXMuX29wZW5PcHRpb25zKTtcbiAgICB0aGlzLl93cml0ZXIgPSB0aGlzLl9maWxlO1xuICAgIHRoaXMuX2J1ZiA9IG5ldyBCdWZXcml0ZXJTeW5jKHRoaXMuX2ZpbGUpO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLFNBQVMsY0FBYyxFQUFhLFNBQVMsUUFBUSxjQUFjO0FBRW5FLFNBQVMsSUFBSSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsTUFBTSxRQUFRLG1CQUFtQjtBQUMzRCxTQUFTLE1BQU0sRUFBRSxVQUFVLFFBQVEsa0JBQWtCO0FBQ3JELFNBQVMsYUFBYSxRQUFRLGtCQUFrQjtBQUVoRCxNQUFNLG9CQUFvQjtBQVExQixPQUFPLE1BQU07SUFDWCxNQUFjO0lBQ2QsVUFBcUI7SUFDckIsVUFBc0M7SUFFdEMsWUFBWSxTQUFvQixFQUFFLFVBQTBCLENBQUMsQ0FBQyxDQUFFO1FBQzlELElBQUksQ0FBQyxRQUFRLGVBQWU7UUFDNUIsSUFBSSxDQUFDLFlBQVk7UUFFakIsSUFBSSxDQUFDLFlBQVksUUFBUSxhQUFhO0lBQ3hDO0lBRUEsT0FB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