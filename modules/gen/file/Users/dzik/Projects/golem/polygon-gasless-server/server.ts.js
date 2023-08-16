import { Application, log } from "./deps.ts";
//TODO : check if sender wallet is provided and throw if not
await log.setup({
    handlers: {
        console: new log.handlers.ConsoleHandler("DEBUG", {
            formatter: "{levelName} - {msg}"
        })
    },
    loggers: {
        default: {
            level: "INFO",
            handlers: [
                "console"
            ]
        },
        webapps: {
            level: "DEBUG",
            handlers: [
                "console"
            ]
        },
        sci: {
            level: "DEBUG",
            handlers: [
                "console"
            ]
        }
    }
});
log.info("started");
if (localStorage.length > 0) {
    log.info(`${localStorage.length} keys stored`);
}
import logger from "https://deno.land/x/oak_logger/mod.ts";
import webapps from "./webapps.ts";
import * as config from "./config.ts";
const app = new Application().use(logger.logger).use(logger.responseTime).use(webapps.routes());
app.addEventListener("listen", ({ hostname , port , secure  })=>{
    console.log(`Listening on: ${secure ? "https://" : "http://"}${hostname ?? "localhost"}:${port}`);
});
await app.listen({
    port: config.port
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvZHppay9Qcm9qZWN0cy9nb2xlbS9wb2x5Z29uLWdhc2xlc3Mtc2VydmVyL3NlcnZlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBcHBsaWNhdGlvbiwgbG9nLCBvYWtDb3JzIH0gZnJvbSBcIi4vZGVwcy50c1wiO1xuXG4vL1RPRE8gOiBjaGVjayBpZiBzZW5kZXIgd2FsbGV0IGlzIHByb3ZpZGVkIGFuZCB0aHJvdyBpZiBub3RcblxuYXdhaXQgbG9nLnNldHVwKHtcbiAgaGFuZGxlcnM6IHtcbiAgICBjb25zb2xlOiBuZXcgbG9nLmhhbmRsZXJzLkNvbnNvbGVIYW5kbGVyKFwiREVCVUdcIiwge1xuICAgICAgZm9ybWF0dGVyOiBcIntsZXZlbE5hbWV9IC0ge21zZ31cIixcbiAgICB9KSxcbiAgfSxcbiAgbG9nZ2Vyczoge1xuICAgIGRlZmF1bHQ6IHsgbGV2ZWw6IFwiSU5GT1wiLCBoYW5kbGVyczogW1wiY29uc29sZVwiXSB9LFxuICAgIHdlYmFwcHM6IHsgbGV2ZWw6IFwiREVCVUdcIiwgaGFuZGxlcnM6IFtcImNvbnNvbGVcIl0gfSxcbiAgICBzY2k6IHsgbGV2ZWw6IFwiREVCVUdcIiwgaGFuZGxlcnM6IFtcImNvbnNvbGVcIl0gfSxcbiAgfSxcbn0pO1xuXG5sb2cuaW5mbyhcInN0YXJ0ZWRcIik7XG5pZiAobG9jYWxTdG9yYWdlLmxlbmd0aCA+IDApIHtcbiAgbG9nLmluZm8oYCR7bG9jYWxTdG9yYWdlLmxlbmd0aH0ga2V5cyBzdG9yZWRgKTtcbn1cblxuaW1wb3J0IGxvZ2dlciBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQveC9vYWtfbG9nZ2VyL21vZC50c1wiO1xuaW1wb3J0IHdlYmFwcHMgZnJvbSBcIi4vd2ViYXBwcy50c1wiO1xuaW1wb3J0ICogYXMgY29uZmlnIGZyb20gXCIuL2NvbmZpZy50c1wiO1xuXG5jb25zdCBhcHAgPSBuZXcgQXBwbGljYXRpb24oKVxuICAudXNlKGxvZ2dlci5sb2dnZXIpXG4gIC51c2UobG9nZ2VyLnJlc3BvbnNlVGltZSlcbiAgLnVzZSh3ZWJhcHBzLnJvdXRlcygpKTtcblxuYXBwLmFkZEV2ZW50TGlzdGVuZXIoXCJsaXN0ZW5cIiwgKHsgaG9zdG5hbWUsIHBvcnQsIHNlY3VyZSB9KSA9PiB7XG4gIGNvbnNvbGUubG9nKFxuICAgIGBMaXN0ZW5pbmcgb246ICR7c2VjdXJlID8gXCJodHRwczovL1wiIDogXCJodHRwOi8vXCJ9JHtcbiAgICAgIGhvc3RuYW1lID8/IFwibG9jYWxob3N0XCJcbiAgICB9OiR7cG9ydH1gXG4gICk7XG59KTtcblxuYXdhaXQgYXBwLmxpc3Rlbih7IHBvcnQ6IGNvbmZpZy5wb3J0IH0pO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFNBQVMsV0FBVyxFQUFFLEdBQUcsUUFBaUIsWUFBWTtBQUV0RCw0REFBNEQ7QUFFNUQsTUFBTSxJQUFJLE1BQU07SUFDZCxVQUFVO1FBQ1IsU0FBUyxJQUFJLElBQUksU0FBUyxlQUFlLFNBQVM7WUFDaEQsV0FBVztRQUNiO0lBQ0Y7SUFDQSxTQUFTO1FBQ1AsU0FBUztZQUFFLE9BQU87WUFBUSxVQUFVO2dCQUFDO2FBQVU7UUFBQztRQUNoRCxTQUFTO1lBQUUsT0FBTztZQUFTLFVBQVU7Z0JBQUM7YUFBVTtRQUFDO1FBQ2pELEtBQUs7WUFBRSxPQUFPO1lBQVMsVUFBVTtnQkFBQzthQUFVO1FBQUM7SUFDL0M7QUFDRjtBQUVBLElBQUksS0FBSztBQUNULElBQUksYUFBYSxTQUFTLEdBQUc7SUFDM0IsSUFBSSxLQUFLLENBQUMsRUFBRSxhQUFhLE9BQU8sWUFBWSxDQUFDO0FBQy9DO0FBRUEsT0FBTyxZQUFZLHdDQUF3QztBQUMzRCxPQUFPLGFBQWEsZUFBZTtBQUNuQyxZQUFZLFlBQVksY0FBYztBQUV0QyxNQUFNLE1BQU0sSUFBSSxjQUNiLElBQUksT0FBTyxRQUNYLElBQUksT0FBTyxjQUNYLElBQUksUUFBUTtBQUVmLElBQUksaUJBQWlCLFVBQVUsQ0FBQyxFQUFFLFNBQVEsRUFBRSxLQUFJLEVBQUUsT0FBTSxFQUFFO0lBQ3hELFFBQVEsSUFDTixDQUFDLGNBQWMsRUFBRSxTQUFTLGFBQWEsVUFBVSxFQUMvQyxZQUFZLFlBQ2IsQ0FBQyxFQUFFLEtBQUssQ0FBQztBQUVkO0FBRUEsTUFBTSxJQUFJLE9BQU87SUFBRSxNQUFNLE9BQU87QUFBSyJ9