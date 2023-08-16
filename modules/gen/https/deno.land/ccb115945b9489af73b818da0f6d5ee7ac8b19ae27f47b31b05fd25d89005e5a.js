// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { getLevelByName, getLevelName, LogLevels } from "./levels.ts";
export class LogRecord {
    msg;
    #args;
    #datetime;
    level;
    levelName;
    loggerName;
    constructor(options){
        this.msg = options.msg;
        this.#args = [
            ...options.args
        ];
        this.level = options.level;
        this.loggerName = options.loggerName;
        this.#datetime = new Date();
        this.levelName = getLevelName(options.level);
    }
    get args() {
        return [
            ...this.#args
        ];
    }
    get datetime() {
        return new Date(this.#datetime.getTime());
    }
}
export class Logger {
    #level;
    #handlers;
    #loggerName;
    constructor(loggerName, levelName, options = {}){
        this.#loggerName = loggerName;
        this.#level = getLevelByName(levelName);
        this.#handlers = options.handlers || [];
    }
    get level() {
        return this.#level;
    }
    set level(level) {
        this.#level = level;
    }
    get levelName() {
        return getLevelName(this.#level);
    }
    set levelName(levelName) {
        this.#level = getLevelByName(levelName);
    }
    get loggerName() {
        return this.#loggerName;
    }
    set handlers(hndls) {
        this.#handlers = hndls;
    }
    get handlers() {
        return this.#handlers;
    }
    /** If the level of the logger is greater than the level to log, then nothing
   * is logged, otherwise a log record is passed to each log handler.  `msg` data
   * passed in is returned.  If a function is passed in, it is only evaluated
   * if the msg will be logged and the return value will be the result of the
   * function, not the function itself, unless the function isn't called, in which
   * case undefined is returned.  All types are coerced to strings for logging.
   */ _log(level, msg, ...args) {
        if (this.level > level) {
            return msg instanceof Function ? undefined : msg;
        }
        let fnResult;
        let logMessage;
        if (msg instanceof Function) {
            fnResult = msg();
            logMessage = this.asString(fnResult);
        } else {
            logMessage = this.asString(msg);
        }
        const record = new LogRecord({
            msg: logMessage,
            args: args,
            level: level,
            loggerName: this.loggerName
        });
        this.#handlers.forEach((handler)=>{
            handler.handle(record);
        });
        return msg instanceof Function ? fnResult : msg;
    }
    asString(data) {
        if (typeof data === "string") {
            return data;
        } else if (data === null || typeof data === "number" || typeof data === "bigint" || typeof data === "boolean" || typeof data === "undefined" || typeof data === "symbol") {
            return String(data);
        } else if (data instanceof Error) {
            return data.stack;
        } else if (typeof data === "object") {
            return JSON.stringify(data);
        }
        return "undefined";
    }
    debug(msg, ...args) {
        return this._log(LogLevels.DEBUG, msg, ...args);
    }
    info(msg, ...args) {
        return this._log(LogLevels.INFO, msg, ...args);
    }
    warning(msg, ...args) {
        return this._log(LogLevels.WARNING, msg, ...args);
    }
    error(msg, ...args) {
        return this._log(LogLevels.ERROR, msg, ...args);
    }
    critical(msg, ...args) {
        return this._log(LogLevels.CRITICAL, msg, ...args);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjEzMy4wL2xvZy9sb2dnZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMiB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbmltcG9ydCB7IGdldExldmVsQnlOYW1lLCBnZXRMZXZlbE5hbWUsIExvZ0xldmVscyB9IGZyb20gXCIuL2xldmVscy50c1wiO1xuaW1wb3J0IHR5cGUgeyBMZXZlbE5hbWUgfSBmcm9tIFwiLi9sZXZlbHMudHNcIjtcbmltcG9ydCB0eXBlIHsgQmFzZUhhbmRsZXIgfSBmcm9tIFwiLi9oYW5kbGVycy50c1wiO1xuXG4vLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuZXhwb3J0IHR5cGUgR2VuZXJpY0Z1bmN0aW9uID0gKC4uLmFyZ3M6IGFueVtdKSA9PiBhbnk7XG5cbmV4cG9ydCBpbnRlcmZhY2UgTG9nUmVjb3JkT3B0aW9ucyB7XG4gIG1zZzogc3RyaW5nO1xuICBhcmdzOiB1bmtub3duW107XG4gIGxldmVsOiBudW1iZXI7XG4gIGxvZ2dlck5hbWU6IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIExvZ1JlY29yZCB7XG4gIHJlYWRvbmx5IG1zZzogc3RyaW5nO1xuICAjYXJnczogdW5rbm93bltdO1xuICAjZGF0ZXRpbWU6IERhdGU7XG4gIHJlYWRvbmx5IGxldmVsOiBudW1iZXI7XG4gIHJlYWRvbmx5IGxldmVsTmFtZTogc3RyaW5nO1xuICByZWFkb25seSBsb2dnZXJOYW1lOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3Iob3B0aW9uczogTG9nUmVjb3JkT3B0aW9ucykge1xuICAgIHRoaXMubXNnID0gb3B0aW9ucy5tc2c7XG4gICAgdGhpcy4jYXJncyA9IFsuLi5vcHRpb25zLmFyZ3NdO1xuICAgIHRoaXMubGV2ZWwgPSBvcHRpb25zLmxldmVsO1xuICAgIHRoaXMubG9nZ2VyTmFtZSA9IG9wdGlvbnMubG9nZ2VyTmFtZTtcbiAgICB0aGlzLiNkYXRldGltZSA9IG5ldyBEYXRlKCk7XG4gICAgdGhpcy5sZXZlbE5hbWUgPSBnZXRMZXZlbE5hbWUob3B0aW9ucy5sZXZlbCk7XG4gIH1cbiAgZ2V0IGFyZ3MoKTogdW5rbm93bltdIHtcbiAgICByZXR1cm4gWy4uLnRoaXMuI2FyZ3NdO1xuICB9XG4gIGdldCBkYXRldGltZSgpOiBEYXRlIHtcbiAgICByZXR1cm4gbmV3IERhdGUodGhpcy4jZGF0ZXRpbWUuZ2V0VGltZSgpKTtcbiAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIExvZ2dlck9wdGlvbnMge1xuICBoYW5kbGVycz86IEJhc2VIYW5kbGVyW107XG59XG5cbmV4cG9ydCBjbGFzcyBMb2dnZXIge1xuICAjbGV2ZWw6IExvZ0xldmVscztcbiAgI2hhbmRsZXJzOiBCYXNlSGFuZGxlcltdO1xuICByZWFkb25seSAjbG9nZ2VyTmFtZTogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGxvZ2dlck5hbWU6IHN0cmluZyxcbiAgICBsZXZlbE5hbWU6IExldmVsTmFtZSxcbiAgICBvcHRpb25zOiBMb2dnZXJPcHRpb25zID0ge30sXG4gICkge1xuICAgIHRoaXMuI2xvZ2dlck5hbWUgPSBsb2dnZXJOYW1lO1xuICAgIHRoaXMuI2xldmVsID0gZ2V0TGV2ZWxCeU5hbWUobGV2ZWxOYW1lKTtcbiAgICB0aGlzLiNoYW5kbGVycyA9IG9wdGlvbnMuaGFuZGxlcnMgfHwgW107XG4gIH1cblxuICBnZXQgbGV2ZWwoKTogTG9nTGV2ZWxzIHtcbiAgICByZXR1cm4gdGhpcy4jbGV2ZWw7XG4gIH1cbiAgc2V0IGxldmVsKGxldmVsOiBMb2dMZXZlbHMpIHtcbiAgICB0aGlzLiNsZXZlbCA9IGxldmVsO1xuICB9XG5cbiAgZ2V0IGxldmVsTmFtZSgpOiBMZXZlbE5hbWUge1xuICAgIHJldHVybiBnZXRMZXZlbE5hbWUodGhpcy4jbGV2ZWwpO1xuICB9XG4gIHNldCBsZXZlbE5hbWUobGV2ZWxOYW1lOiBMZXZlbE5hbWUpIHtcbiAgICB0aGlzLiNsZXZlbCA9IGdldExldmVsQnlOYW1lKGxldmVsTmFtZSk7XG4gIH1cblxuICBnZXQgbG9nZ2VyTmFtZSgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLiNsb2dnZXJOYW1lO1xuICB9XG5cbiAgc2V0IGhhbmRsZXJzKGhuZGxzOiBCYXNlSGFuZGxlcltdKSB7XG4gICAgdGhpcy4jaGFuZGxlcnMgPSBobmRscztcbiAgfVxuICBnZXQgaGFuZGxlcnMoKTogQmFzZUhhbmRsZXJbXSB7XG4gICAgcmV0dXJuIHRoaXMuI2hhbmRsZXJzO1xuICB9XG5cbiAgLyoqIElmIHRoZSBsZXZlbCBvZiB0aGUgbG9nZ2VyIGlzIGdyZWF0ZXIgdGhhbiB0aGUgbGV2ZWwgdG8gbG9nLCB0aGVuIG5vdGhpbmdcbiAgICogaXMgbG9nZ2VkLCBvdGhlcndpc2UgYSBsb2cgcmVjb3JkIGlzIHBhc3NlZCB0byBlYWNoIGxvZyBoYW5kbGVyLiAgYG1zZ2AgZGF0YVxuICAgKiBwYXNzZWQgaW4gaXMgcmV0dXJuZWQuICBJZiBhIGZ1bmN0aW9uIGlzIHBhc3NlZCBpbiwgaXQgaXMgb25seSBldmFsdWF0ZWRcbiAgICogaWYgdGhlIG1zZyB3aWxsIGJlIGxvZ2dlZCBhbmQgdGhlIHJldHVybiB2YWx1ZSB3aWxsIGJlIHRoZSByZXN1bHQgb2YgdGhlXG4gICAqIGZ1bmN0aW9uLCBub3QgdGhlIGZ1bmN0aW9uIGl0c2VsZiwgdW5sZXNzIHRoZSBmdW5jdGlvbiBpc24ndCBjYWxsZWQsIGluIHdoaWNoXG4gICAqIGNhc2UgdW5kZWZpbmVkIGlzIHJldHVybmVkLiAgQWxsIHR5cGVzIGFyZSBjb2VyY2VkIHRvIHN0cmluZ3MgZm9yIGxvZ2dpbmcuXG4gICAqL1xuICBwcml2YXRlIF9sb2c8VD4oXG4gICAgbGV2ZWw6IG51bWJlcixcbiAgICBtc2c6IChUIGV4dGVuZHMgR2VuZXJpY0Z1bmN0aW9uID8gbmV2ZXIgOiBUKSB8ICgoKSA9PiBUKSxcbiAgICAuLi5hcmdzOiB1bmtub3duW11cbiAgKTogVCB8IHVuZGVmaW5lZCB7XG4gICAgaWYgKHRoaXMubGV2ZWwgPiBsZXZlbCkge1xuICAgICAgcmV0dXJuIG1zZyBpbnN0YW5jZW9mIEZ1bmN0aW9uID8gdW5kZWZpbmVkIDogbXNnO1xuICAgIH1cblxuICAgIGxldCBmblJlc3VsdDogVCB8IHVuZGVmaW5lZDtcbiAgICBsZXQgbG9nTWVzc2FnZTogc3RyaW5nO1xuICAgIGlmIChtc2cgaW5zdGFuY2VvZiBGdW5jdGlvbikge1xuICAgICAgZm5SZXN1bHQgPSBtc2coKTtcbiAgICAgIGxvZ01lc3NhZ2UgPSB0aGlzLmFzU3RyaW5nKGZuUmVzdWx0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgbG9nTWVzc2FnZSA9IHRoaXMuYXNTdHJpbmcobXNnKTtcbiAgICB9XG4gICAgY29uc3QgcmVjb3JkOiBMb2dSZWNvcmQgPSBuZXcgTG9nUmVjb3JkKHtcbiAgICAgIG1zZzogbG9nTWVzc2FnZSxcbiAgICAgIGFyZ3M6IGFyZ3MsXG4gICAgICBsZXZlbDogbGV2ZWwsXG4gICAgICBsb2dnZXJOYW1lOiB0aGlzLmxvZ2dlck5hbWUsXG4gICAgfSk7XG5cbiAgICB0aGlzLiNoYW5kbGVycy5mb3JFYWNoKChoYW5kbGVyKTogdm9pZCA9PiB7XG4gICAgICBoYW5kbGVyLmhhbmRsZShyZWNvcmQpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIG1zZyBpbnN0YW5jZW9mIEZ1bmN0aW9uID8gZm5SZXN1bHQgOiBtc2c7XG4gIH1cblxuICBhc1N0cmluZyhkYXRhOiB1bmtub3duKTogc3RyaW5nIHtcbiAgICBpZiAodHlwZW9mIGRhdGEgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHJldHVybiBkYXRhO1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICBkYXRhID09PSBudWxsIHx8XG4gICAgICB0eXBlb2YgZGF0YSA9PT0gXCJudW1iZXJcIiB8fFxuICAgICAgdHlwZW9mIGRhdGEgPT09IFwiYmlnaW50XCIgfHxcbiAgICAgIHR5cGVvZiBkYXRhID09PSBcImJvb2xlYW5cIiB8fFxuICAgICAgdHlwZW9mIGRhdGEgPT09IFwidW5kZWZpbmVkXCIgfHxcbiAgICAgIHR5cGVvZiBkYXRhID09PSBcInN5bWJvbFwiXG4gICAgKSB7XG4gICAgICByZXR1cm4gU3RyaW5nKGRhdGEpO1xuICAgIH0gZWxzZSBpZiAoZGF0YSBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICByZXR1cm4gZGF0YS5zdGFjayE7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZGF0YSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGRhdGEpO1xuICAgIH1cbiAgICByZXR1cm4gXCJ1bmRlZmluZWRcIjtcbiAgfVxuXG4gIGRlYnVnPFQ+KG1zZzogKCkgPT4gVCwgLi4uYXJnczogdW5rbm93bltdKTogVCB8IHVuZGVmaW5lZDtcbiAgZGVidWc8VD4obXNnOiBUIGV4dGVuZHMgR2VuZXJpY0Z1bmN0aW9uID8gbmV2ZXIgOiBULCAuLi5hcmdzOiB1bmtub3duW10pOiBUO1xuICBkZWJ1ZzxUPihcbiAgICBtc2c6IChUIGV4dGVuZHMgR2VuZXJpY0Z1bmN0aW9uID8gbmV2ZXIgOiBUKSB8ICgoKSA9PiBUKSxcbiAgICAuLi5hcmdzOiB1bmtub3duW11cbiAgKTogVCB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuX2xvZyhMb2dMZXZlbHMuREVCVUcsIG1zZywgLi4uYXJncyk7XG4gIH1cblxuICBpbmZvPFQ+KG1zZzogKCkgPT4gVCwgLi4uYXJnczogdW5rbm93bltdKTogVCB8IHVuZGVmaW5lZDtcbiAgaW5mbzxUPihtc2c6IFQgZXh0ZW5kcyBHZW5lcmljRnVuY3Rpb24gPyBuZXZlciA6IFQsIC4uLmFyZ3M6IHVua25vd25bXSk6IFQ7XG4gIGluZm88VD4oXG4gICAgbXNnOiAoVCBleHRlbmRzIEdlbmVyaWNGdW5jdGlvbiA/IG5ldmVyIDogVCkgfCAoKCkgPT4gVCksXG4gICAgLi4uYXJnczogdW5rbm93bltdXG4gICk6IFQgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLl9sb2coTG9nTGV2ZWxzLklORk8sIG1zZywgLi4uYXJncyk7XG4gIH1cblxuICB3YXJuaW5nPFQ+KG1zZzogKCkgPT4gVCwgLi4uYXJnczogdW5rbm93bltdKTogVCB8IHVuZGVmaW5lZDtcbiAgd2FybmluZzxUPihtc2c6IFQgZXh0ZW5kcyBHZW5lcmljRnVuY3Rpb24gPyBuZXZlciA6IFQsIC4uLmFyZ3M6IHVua25vd25bXSk6IFQ7XG4gIHdhcm5pbmc8VD4oXG4gICAgbXNnOiAoVCBleHRlbmRzIEdlbmVyaWNGdW5jdGlvbiA/IG5ldmVyIDogVCkgfCAoKCkgPT4gVCksXG4gICAgLi4uYXJnczogdW5rbm93bltdXG4gICk6IFQgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLl9sb2coTG9nTGV2ZWxzLldBUk5JTkcsIG1zZywgLi4uYXJncyk7XG4gIH1cblxuICBlcnJvcjxUPihtc2c6ICgpID0+IFQsIC4uLmFyZ3M6IHVua25vd25bXSk6IFQgfCB1bmRlZmluZWQ7XG4gIGVycm9yPFQ+KG1zZzogVCBleHRlbmRzIEdlbmVyaWNGdW5jdGlvbiA/IG5ldmVyIDogVCwgLi4uYXJnczogdW5rbm93bltdKTogVDtcbiAgZXJyb3I8VD4oXG4gICAgbXNnOiAoVCBleHRlbmRzIEdlbmVyaWNGdW5jdGlvbiA/IG5ldmVyIDogVCkgfCAoKCkgPT4gVCksXG4gICAgLi4uYXJnczogdW5rbm93bltdXG4gICk6IFQgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLl9sb2coTG9nTGV2ZWxzLkVSUk9SLCBtc2csIC4uLmFyZ3MpO1xuICB9XG5cbiAgY3JpdGljYWw8VD4obXNnOiAoKSA9PiBULCAuLi5hcmdzOiB1bmtub3duW10pOiBUIHwgdW5kZWZpbmVkO1xuICBjcml0aWNhbDxUPihcbiAgICBtc2c6IFQgZXh0ZW5kcyBHZW5lcmljRnVuY3Rpb24gPyBuZXZlciA6IFQsXG4gICAgLi4uYXJnczogdW5rbm93bltdXG4gICk6IFQ7XG4gIGNyaXRpY2FsPFQ+KFxuICAgIG1zZzogKFQgZXh0ZW5kcyBHZW5lcmljRnVuY3Rpb24gPyBuZXZlciA6IFQpIHwgKCgpID0+IFQpLFxuICAgIC4uLmFyZ3M6IHVua25vd25bXVxuICApOiBUIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5fbG9nKExvZ0xldmVscy5DUklUSUNBTCwgbXNnLCAuLi5hcmdzKTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxTQUFTLGNBQWMsRUFBRSxZQUFZLEVBQUUsU0FBUyxRQUFRLGNBQWM7QUFjdEUsT0FBTyxNQUFNO0lBQ0YsSUFBWTtJQUNyQixDQUFDLElBQUksQ0FBWTtJQUNqQixDQUFDLFFBQVEsQ0FBTztJQUNQLE1BQWM7SUFDZCxVQUFrQjtJQUNsQixXQUFtQjtJQUU1QixZQUFZLE9BQXlCLENBQUU7UUFDckMsSUFBSSxDQUFDLE1BQU0sUUFBUTtRQUNuQixJQUFJLENBQUMsQ0FBQyxJQUFJLEdBQUc7ZUFBSSxRQUFRO1NBQUs7UUFDOUIsSUFBSSxDQUFDLFFBQVEsUUFBUTtRQUNyQixJQUFJLENBQUMsYUFBYSxRQUFRO1FBQzFCLElBQUksQ0FBQyxDQUFDLFFBQVEsR0FBRyxJQUFJO1FBQ3JCLElBQUksQ0FBQyxZQUFZLGFBQWEsUUFBUTtJQUN4QztJQUNBLElBQUksT0FBa0I7UUFDcEIsT0FBTztlQUFJLElBQUksQ0FBQyxDQUFDLElBQUk7U0FBQztJQUN4QjtJQUNBLElBQUksV0FBaUI7UUFDbkIsT0FBTyxJQUFJLEtBQUssSUFBSSxDQUFDLENBQUMsUUFBUSxDQUFDO0lBQ2pDO0FBQ0Y7QUFNQSxPQUFPLE1BQU07SUFDWCxDQUFDLEtBQUssQ0FBWTtJQUNsQixDQUFDLFFBQVEsQ0FBZ0I7SUFDaEIsQ0FBQyxVQUFVLENBQVM7SUFFN0IsWUFDRSxVQUFrQixFQUNsQixTQUFvQixFQUNwQixVQUF5QixDQUFDLENBQUMsQ0FDM0I7UUFDQSxJQUFJLENBQUMsQ0FBQyxVQUFVLEdBQUc7UUFDbkIsSUFBSSxDQUFDLENB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