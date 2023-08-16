// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { Logger } from "./logger.ts";
import { BaseHandler, ConsoleHandler, FileHandler, RotatingFileHandler, WriterHandler } from "./handlers.ts";
import { assert } from "../_util/assert.ts";
export { LogLevels } from "./levels.ts";
export { Logger } from "./logger.ts";
export class LoggerConfig {
    level;
    handlers;
}
const DEFAULT_LEVEL = "INFO";
const DEFAULT_CONFIG = {
    handlers: {
        default: new ConsoleHandler(DEFAULT_LEVEL)
    },
    loggers: {
        default: {
            level: DEFAULT_LEVEL,
            handlers: [
                "default"
            ]
        }
    }
};
const state = {
    handlers: new Map(),
    loggers: new Map(),
    config: DEFAULT_CONFIG
};
export const handlers = {
    BaseHandler,
    ConsoleHandler,
    WriterHandler,
    FileHandler,
    RotatingFileHandler
};
/** Get a logger instance. If not specified `name`, get the default logger.  */ export function getLogger(name) {
    if (!name) {
        const d = state.loggers.get("default");
        assert(d != null, `"default" logger must be set for getting logger without name`);
        return d;
    }
    const result = state.loggers.get(name);
    if (!result) {
        const logger = new Logger(name, "NOTSET", {
            handlers: []
        });
        state.loggers.set(name, logger);
        return logger;
    }
    return result;
}
export function debug(msg, ...args) {
    // Assist TS compiler with pass-through generic type
    if (msg instanceof Function) {
        return getLogger("default").debug(msg, ...args);
    }
    return getLogger("default").debug(msg, ...args);
}
export function info(msg, ...args) {
    // Assist TS compiler with pass-through generic type
    if (msg instanceof Function) {
        return getLogger("default").info(msg, ...args);
    }
    return getLogger("default").info(msg, ...args);
}
export function warning(msg, ...args) {
    // Assist TS compiler with pass-through generic type
    if (msg instanceof Function) {
        return getLogger("default").warning(msg, ...args);
    }
    return getLogger("default").warning(msg, ...args);
}
export function error(msg, ...args) {
    // Assist TS compiler with pass-through generic type
    if (msg instanceof Function) {
        return getLogger("default").error(msg, ...args);
    }
    return getLogger("default").error(msg, ...args);
}
export function critical(msg, ...args) {
    // Assist TS compiler with pass-through generic type
    if (msg instanceof Function) {
        return getLogger("default").critical(msg, ...args);
    }
    return getLogger("default").critical(msg, ...args);
}
/** Setup logger config. */ export async function setup(config) {
    state.config = {
        handlers: {
            ...DEFAULT_CONFIG.handlers,
            ...config.handlers
        },
        loggers: {
            ...DEFAULT_CONFIG.loggers,
            ...config.loggers
        }
    };
    // tear down existing handlers
    state.handlers.forEach((handler)=>{
        handler.destroy();
    });
    state.handlers.clear();
    // setup handlers
    const handlers = state.config.handlers || {};
    for(const handlerName in handlers){
        const handler = handlers[handlerName];
        await handler.setup();
        state.handlers.set(handlerName, handler);
    }
    // remove existing loggers
    state.loggers.clear();
    // setup loggers
    const loggers = state.config.loggers || {};
    for(const loggerName in loggers){
        const loggerConfig = loggers[loggerName];
        const handlerNames = loggerConfig.handlers || [];
        const handlers = [];
        handlerNames.forEach((handlerName)=>{
            const handler = state.handlers.get(handlerName);
            if (handler) {
                handlers.push(handler);
            }
        });
        const levelName = loggerConfig.level || DEFAULT_LEVEL;
        const logger = new Logger(loggerName, levelName, {
            handlers: handlers
        });
        state.loggers.set(loggerName, logger);
    }
}
await setup(DEFAULT_CONFIG);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjEzMy4wL2xvZy9tb2QudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMiB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbmltcG9ydCB7IExvZ2dlciB9IGZyb20gXCIuL2xvZ2dlci50c1wiO1xuaW1wb3J0IHR5cGUgeyBHZW5lcmljRnVuY3Rpb24gfSBmcm9tIFwiLi9sb2dnZXIudHNcIjtcbmltcG9ydCB7XG4gIEJhc2VIYW5kbGVyLFxuICBDb25zb2xlSGFuZGxlcixcbiAgRmlsZUhhbmRsZXIsXG4gIFJvdGF0aW5nRmlsZUhhbmRsZXIsXG4gIFdyaXRlckhhbmRsZXIsXG59IGZyb20gXCIuL2hhbmRsZXJzLnRzXCI7XG5pbXBvcnQgeyBhc3NlcnQgfSBmcm9tIFwiLi4vX3V0aWwvYXNzZXJ0LnRzXCI7XG5pbXBvcnQgdHlwZSB7IExldmVsTmFtZSB9IGZyb20gXCIuL2xldmVscy50c1wiO1xuXG5leHBvcnQgeyBMb2dMZXZlbHMgfSBmcm9tIFwiLi9sZXZlbHMudHNcIjtcbmV4cG9ydCB0eXBlIHsgTGV2ZWxOYW1lIH0gZnJvbSBcIi4vbGV2ZWxzLnRzXCI7XG5leHBvcnQgeyBMb2dnZXIgfSBmcm9tIFwiLi9sb2dnZXIudHNcIjtcbmV4cG9ydCB0eXBlIHsgTG9nUmVjb3JkIH0gZnJvbSBcIi4vbG9nZ2VyLnRzXCI7XG5leHBvcnQgdHlwZSB7IEZvcm1hdHRlckZ1bmN0aW9uLCBIYW5kbGVyT3B0aW9ucywgTG9nTW9kZSB9IGZyb20gXCIuL2hhbmRsZXJzLnRzXCI7XG5cbmV4cG9ydCBjbGFzcyBMb2dnZXJDb25maWcge1xuICBsZXZlbD86IExldmVsTmFtZTtcbiAgaGFuZGxlcnM/OiBzdHJpbmdbXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBMb2dDb25maWcge1xuICBoYW5kbGVycz86IHtcbiAgICBbbmFtZTogc3RyaW5nXTogQmFzZUhhbmRsZXI7XG4gIH07XG4gIGxvZ2dlcnM/OiB7XG4gICAgW25hbWU6IHN0cmluZ106IExvZ2dlckNvbmZpZztcbiAgfTtcbn1cblxuY29uc3QgREVGQVVMVF9MRVZFTCA9IFwiSU5GT1wiO1xuY29uc3QgREVGQVVMVF9DT05GSUc6IExvZ0NvbmZpZyA9IHtcbiAgaGFuZGxlcnM6IHtcbiAgICBkZWZhdWx0OiBuZXcgQ29uc29sZUhhbmRsZXIoREVGQVVMVF9MRVZFTCksXG4gIH0sXG5cbiAgbG9nZ2Vyczoge1xuICAgIGRlZmF1bHQ6IHtcbiAgICAgIGxldmVsOiBERUZBVUxUX0xFVkVMLFxuICAgICAgaGFuZGxlcnM6IFtcImRlZmF1bHRcIl0sXG4gICAgfSxcbiAgfSxcbn07XG5cbmNvbnN0IHN0YXRlID0ge1xuICBoYW5kbGVyczogbmV3IE1hcDxzdHJpbmcsIEJhc2VIYW5kbGVyPigpLFxuICBsb2dnZXJzOiBuZXcgTWFwPHN0cmluZywgTG9nZ2VyPigpLFxuICBjb25maWc6IERFRkFVTFRfQ09ORklHLFxufTtcblxuZXhwb3J0IGNvbnN0IGhhbmRsZXJzID0ge1xuICBCYXNlSGFuZGxlcixcbiAgQ29uc29sZUhhbmRsZXIsXG4gIFdyaXRlckhhbmRsZXIsXG4gIEZpbGVIYW5kbGVyLFxuICBSb3RhdGluZ0ZpbGVIYW5kbGVyLFxufTtcblxuLyoqIEdldCBhIGxvZ2dlciBpbnN0YW5jZS4gSWYgbm90IHNwZWNpZmllZCBgbmFtZWAsIGdldCB0aGUgZGVmYXVsdCBsb2dnZXIuICAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExvZ2dlcihuYW1lPzogc3RyaW5nKTogTG9nZ2VyIHtcbiAgaWYgKCFuYW1lKSB7XG4gICAgY29uc3QgZCA9IHN0YXRlLmxvZ2dlcnMuZ2V0KFwiZGVmYXVsdFwiKTtcbiAgICBhc3NlcnQoXG4gICAgICBkICE9IG51bGwsXG4gICAgICBgXCJkZWZhdWx0XCIgbG9nZ2VyIG11c3QgYmUgc2V0IGZvciBnZXR0aW5nIGxvZ2dlciB3aXRob3V0IG5hbWVgLFxuICAgICk7XG4gICAgcmV0dXJuIGQ7XG4gIH1cbiAgY29uc3QgcmVzdWx0ID0gc3RhdGUubG9nZ2Vycy5nZXQobmFtZSk7XG4gIGlmICghcmVzdWx0KSB7XG4gICAgY29uc3QgbG9nZ2VyID0gbmV3IExvZ2dlcihuYW1lLCBcIk5PVFNFVFwiLCB7IGhhbmRsZXJzOiBbXSB9KTtcbiAgICBzdGF0ZS5sb2dnZXJzLnNldChuYW1lLCBsb2dnZXIpO1xuICAgIHJldHVybiBsb2dnZXI7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqIExvZyB3aXRoIGRlYnVnIGxldmVsLCB1c2luZyBkZWZhdWx0IGxvZ2dlci4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZWJ1ZzxUPihtc2c6ICgpID0+IFQsIC4uLmFyZ3M6IHVua25vd25bXSk6IFQgfCB1bmRlZmluZWQ7XG5leHBvcnQgZnVuY3Rpb24gZGVidWc8VD4oXG4gIG1zZzogVCBleHRlbmRzIEdlbmVyaWNGdW5jdGlvbiA/IG5ldmVyIDogVCxcbiAgLi4uYXJnczogdW5rbm93bltdXG4pOiBUO1xuZXhwb3J0IGZ1bmN0aW9uIGRlYnVnPFQ+KFxuICBtc2c6IChUIGV4dGVuZHMgR2VuZXJpY0Z1bmN0aW9uID8gbmV2ZXIgOiBUKSB8ICgoKSA9PiBUKSxcbiAgLi4uYXJnczogdW5rbm93bltdXG4pOiBUIHwgdW5kZWZpbmVkIHtcbiAgLy8gQXNzaXN0IFRTIGNvbXBpbGVyIHdpdGggcGFzcy10aHJvdWdoIGdlbmVyaWMgdHlwZVxuICBpZiAobXNnIGluc3RhbmNlb2YgRnVuY3Rpb24pIHtcbiAgICByZXR1cm4gZ2V0TG9nZ2VyKFwiZGVmYXVsdFwiKS5kZWJ1Zyhtc2csIC4uLmFyZ3MpO1xuICB9XG4gIHJldHVybiBnZXRMb2dnZXIoXCJkZWZhdWx0XCIpLmRlYnVnKG1zZywgLi4uYXJncyk7XG59XG5cbi8qKiBMb2cgd2l0aCBpbmZvIGxldmVsLCB1c2luZyBkZWZhdWx0IGxvZ2dlci4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmZvPFQ+KG1zZzogKCkgPT4gVCwgLi4uYXJnczogdW5rbm93bltdKTogVCB8IHVuZGVmaW5lZDtcbmV4cG9ydCBmdW5jdGlvbiBpbmZvPFQ+KFxuICBtc2c6IFQgZXh0ZW5kcyBHZW5lcmljRnVuY3Rpb24gPyBuZXZlciA6IFQsXG4gIC4uLmFyZ3M6IHVua25vd25bXVxuKTogVDtcbmV4cG9ydCBmdW5jdGlvbiBpbmZvPFQ+KFxuICBtc2c6IChUIGV4dGVuZHMgR2VuZXJpY0Z1bmN0aW9uID8gbmV2ZXIgOiBUKSB8ICgoKSA9PiBUKSxcbiAgLi4uYXJnczogdW5rbm93bltdXG4pOiBUIHwgdW5kZWZpbmVkIHtcbiAgLy8gQXNzaXN0IFRTIGNvbXBpbGVyIHdpdGggcGFzcy10aHJvdWdoIGdlbmVyaWMgdHlwZVxuICBpZiAobXNnIGluc3RhbmNlb2YgRnVuY3Rpb24pIHtcbiAgICByZXR1cm4gZ2V0TG9nZ2VyKFwiZGVmYXVsdFwiKS5pbmZvKG1zZywgLi4uYXJncyk7XG4gIH1cbiAgcmV0dXJuIGdldExvZ2dlcihcImRlZmF1bHRcIikuaW5mbyhtc2csIC4uLmFyZ3MpO1xufVxuXG4vKiogTG9nIHdpdGggd2FybmluZyBsZXZlbCwgdXNpbmcgZGVmYXVsdCBsb2dnZXIuICovXG5leHBvcnQgZnVuY3Rpb24gd2FybmluZzxUPihtc2c6ICgpID0+IFQsIC4uLmFyZ3M6IHVua25vd25bXSk6IFQgfCB1bmRlZmluZWQ7XG5leHBvcnQgZnVuY3Rpb24gd2FybmluZzxUPihcbiAgbXNnOiBUIGV4dGVuZHMgR2VuZXJpY0Z1bmN0aW9uID8gbmV2ZXIgOiBULFxuICAuLi5hcmdzOiB1bmtub3duW11cbik6IFQ7XG5leHBvcnQgZnVuY3Rpb24gd2FybmluZzxUPihcbiAgbXNnOiAoVCBleHRlbmRzIEdlbmVyaWNGdW5jdGlvbiA/IG5ldmVyIDogVCkgfCAoKCkgPT4gVCksXG4gIC4uLmFyZ3M6IHVua25vd25bXVxuKTogVCB8IHVuZGVmaW5lZCB7XG4gIC8vIEFzc2lzdCBUUyBjb21waWxlciB3aXRoIHBhc3MtdGhyb3VnaCBnZW5lcmljIHR5cGVcbiAgaWYgKG1zZyBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB7XG4gICAgcmV0dXJuIGdldExvZ2dlcihcImRlZmF1bHRcIikud2FybmluZyhtc2csIC4uLmFyZ3MpO1xuICB9XG4gIHJldHVybiBnZXRMb2dnZXIoXCJkZWZhdWx0XCIpLndhcm5pbmcobXNnLCAuLi5hcmdzKTtcbn1cblxuLyoqIExvZyB3aXRoIGVycm9yIGxldmVsLCB1c2luZyBkZWZhdWx0IGxvZ2dlci4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlcnJvcjxUPihtc2c6ICgpID0+IFQsIC4uLmFyZ3M6IHVua25vd25bXSk6IFQgfCB1bmRlZmluZWQ7XG5leHBvcnQgZnVuY3Rpb24gZXJyb3I8VD4oXG4gIG1zZzogVCBleHRlbmRzIEdlbmVyaWNGdW5jdGlvbiA/IG5ldmVyIDogVCxcbiAgLi4uYXJnczogdW5rbm93bltdXG4pOiBUO1xuZXhwb3J0IGZ1bmN0aW9uIGVycm9yPFQ+KFxuICBtc2c6IChUIGV4dGVuZHMgR2VuZXJpY0Z1bmN0aW9uID8gbmV2ZXIgOiBUKSB8ICgoKSA9PiBUKSxcbiAgLi4uYXJnczogdW5rbm93bltdXG4pOiBUIHwgdW5kZWZpbmVkIHtcbiAgLy8gQXNzaXN0IFRTIGNvbXBpbGVyIHdpdGggcGFzcy10aHJvdWdoIGdlbmVyaWMgdHlwZVxuICBpZiAobXNnIGluc3RhbmNlb2YgRnVuY3Rpb24pIHtcbiAgICByZXR1cm4gZ2V0TG9nZ2VyKFwiZGVmYXVsdFwiKS5lcnJvcihtc2csIC4uLmFyZ3MpO1xuICB9XG4gIHJldHVybiBnZXRMb2dnZXIoXCJkZWZhdWx0XCIpLmVycm9yKG1zZywgLi4uYXJncyk7XG59XG5cbi8qKiBMb2cgd2l0aCBjcml0aWNhbCBsZXZlbCwgdXNpbmcgZGVmYXVsdCBsb2dnZXIuICovXG5leHBvcnQgZnVuY3Rpb24gY3JpdGljYWw8VD4obXNnOiAoKSA9PiBULCAuLi5hcmdzOiB1bmtub3duW10pOiBUIHwgdW5kZWZpbmVkO1xuZXhwb3J0IGZ1bmN0aW9uIGNyaXRpY2FsPFQ+KFxuICBtc2c6IFQgZXh0ZW5kcyBHZW5lcmljRnVuY3Rpb24gPyBuZXZlciA6IFQsXG4gIC4uLmFyZ3M6IHVua25vd25bXVxuKTogVDtcbmV4cG9ydCBmdW5jdGlvbiBjcml0aWNhbDxUPihcbiAgbXNnOiAoVCBleHRlbmRzIEdlbmVyaWNGdW5jdGlvbiA/IG5ldmVyIDogVCkgfCAoKCkgPT4gVCksXG4gIC4uLmFyZ3M6IHVua25vd25bXVxuKTogVCB8IHVuZGVmaW5lZCB7XG4gIC8vIEFzc2lzdCBUUyBjb21waWxlciB3aXRoIHBhc3MtdGhyb3VnaCBnZW5lcmljIHR5cGVcbiAgaWYgKG1zZyBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB7XG4gICAgcmV0dXJuIGdldExvZ2dlcihcImRlZmF1bHRcIikuY3JpdGljYWwobXNnLCAuLi5hcmdzKTtcbiAgfVxuICByZXR1cm4gZ2V0TG9nZ2VyKFwiZGVmYXVsdFwiKS5jcml0aWNhbChtc2csIC4uLmFyZ3MpO1xufVxuXG4vKiogU2V0dXAgbG9nZ2VyIGNvbmZpZy4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZXR1cChjb25maWc6IExvZ0NvbmZpZykge1xuICBzdGF0ZS5jb25maWcgPSB7XG4gICAgaGFuZGxlcnM6IHsgLi4uREVGQVVMVF9DT05GSUcuaGFuZGxlcnMsIC4uLmNvbmZpZy5oYW5kbGVycyB9LFxuICAgIGxvZ2dlcnM6IHsgLi4uREVGQVVMVF9DT05GSUcubG9nZ2VycywgLi4uY29uZmlnLmxvZ2dlcnMgfSxcbiAgfTtcblxuICAvLyB0ZWFyIGRvd24gZXhpc3RpbmcgaGFuZGxlcnNcbiAgc3RhdGUuaGFuZGxlcnMuZm9yRWFjaCgoaGFuZGxlcik6IHZvaWQgPT4ge1xuICAgIGhhbmRsZXIuZGVzdHJveSgpO1xuICB9KTtcbiAgc3RhdGUuaGFuZGxlcnMuY2xlYXIoKTtcblxuICAvLyBzZXR1cCBoYW5kbGVyc1xuICBjb25zdCBoYW5kbGVycyA9IHN0YXRlLmNvbmZpZy5oYW5kbGVycyB8fCB7fTtcblxuICBmb3IgKGNvbnN0IGhhbmRsZXJOYW1lIGluIGhhbmRsZXJzKSB7XG4gICAgY29uc3QgaGFuZGxlciA9IGhhbmRsZXJzW2hhbmRsZXJOYW1lXTtcbiAgICBhd2FpdCBoYW5kbGVyLnNldHVwKCk7XG4gICAgc3RhdGUuaGFuZGxlcnMuc2V0KGhhbmRsZXJOYW1lLCBoYW5kbGVyKTtcbiAgfVxuXG4gIC8vIHJlbW92ZSBleGlzdGluZyBsb2dnZXJzXG4gIHN0YXRlLmxvZ2dlcnMuY2xlYXIoKTtcblxuICAvLyBzZXR1cCBsb2dnZXJzXG4gIGNvbnN0IGxvZ2dlcnMgPSBzdGF0ZS5jb25maWcubG9nZ2VycyB8fCB7fTtcbiAgZm9yIChjb25zdCBsb2dnZXJOYW1lIGluIGxvZ2dlcnMpIHtcbiAgICBjb25zdCBsb2dnZXJDb25maWcgPSBsb2dnZXJzW2xvZ2dlck5hbWVdO1xuICAgIGNvbnN0IGhhbmRsZXJOYW1lcyA9IGxvZ2dlckNvbmZpZy5oYW5kbGVycyB8fCBbXTtcbiAgICBjb25zdCBoYW5kbGVyczogQmFzZUhhbmRsZXJbXSA9IFtdO1xuXG4gICAgaGFuZGxlck5hbWVzLmZvckVhY2goKGhhbmRsZXJOYW1lKTogdm9pZCA9PiB7XG4gICAgICBjb25zdCBoYW5kbGVyID0gc3RhdGUuaGFuZGxlcnMuZ2V0KGhhbmRsZXJOYW1lKTtcbiAgICAgIGlmIChoYW5kbGVyKSB7XG4gICAgICAgIGhhbmRsZXJzLnB1c2goaGFuZGxlcik7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBjb25zdCBsZXZlbE5hbWUgPSBsb2dnZXJDb25maWcubGV2ZWwgfHwgREVGQVVMVF9MRVZFTDtcbiAgICBjb25zdCBsb2dnZXIgPSBuZXcgTG9nZ2VyKGxvZ2dlck5hbWUsIGxldmVsTmFtZSwgeyBoYW5kbGVyczogaGFuZGxlcnMgfSk7XG4gICAgc3RhdGUubG9nZ2Vycy5zZXQobG9nZ2VyTmFtZSwgbG9nZ2VyKTtcbiAgfVxufVxuXG5hd2FpdCBzZXR1cChERUZBVUxUX0NPTkZJRyk7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLFNBQVMs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