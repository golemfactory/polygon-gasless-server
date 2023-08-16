import { glm, gracePeriodMs } from "../../../config.ts";
import { log, z } from "../../../deps.ts";
import { utils } from "../../../sci.ts";
import { decodeApprove } from "../../../sci/approve-tx-decoder.ts";
import { sender } from "../../../sender.ts";
import { ForwardRequest } from "../utils.ts";
import { validateApproveMetaTxArguments } from "../validators/approve.ts";
import { ethers } from "npm:ethers";
console.log("ethers", ethers);
const pendingSenders = new Set();
export const forwardApprove = async (ctx)=>{
    const logger = log.getLogger("webapp");
    try {
        const input = ForwardRequest.parse(await ctx.request.body({
            type: "json"
        }).value);
        // checking if this is transfer
        const decodedArguments = decodeApprove(input.abiFunctionCall);
        if (!decodedArguments) {
            ctx.response.status = 400;
            ctx.response.body = {
                message: "unable to decode transaction"
            };
            return;
        }
        const errorDetails = await validateApproveMetaTxArguments(input.sender, decodedArguments, input.blockHash || "latest");
        if (errorDetails) {
            ctx.response.status = 400;
            ctx.response.body = {
                message: errorDetails
            };
            return;
        }
        logger.info(()=>`Forwarding approve by ${input.sender} for ${decodedArguments.spender} of ${utils.fromWei(decodedArguments.amount)}`);
        logger.debug(()=>`input=${JSON.stringify(input)}`);
        const data = glm.methods.executeMetaTransaction(input.sender, input.abiFunctionCall, input.r, input.s, input.v).encodeABI();
        if (pendingSenders.has(input.sender)) {
            ctx.response.status = 429;
            ctx.response.body = {
                message: "processing concurrent transaction"
            };
            return;
        }
        try {
            pendingSenders.add(input.sender);
            const now = new Date().getTime();
            const storageKey = `sender.${input.sender}`;
            if (gracePeriodMs) {
                const prev = localStorage.getItem(storageKey);
                logger.debug(()=>`check gracePeriodMs=${gracePeriodMs}, for ${storageKey}, prev=${prev}`);
                if (prev && now - parseInt(prev) < gracePeriodMs) {
                    const retryAfter = new Date(parseInt(prev) + gracePeriodMs);
                    ctx.response.status = 429;
                    ctx.response.headers.set("Retry-After", retryAfter.toUTCString());
                    ctx.response.body = {
                        message: "Grace period did not pass for this address"
                    };
                    return;
                }
            }
            const txId = await sender.sendTx({
                to: glm.options.address,
                data
            });
            localStorage.setItem(storageKey, now.toString());
            ctx.response.type = "json";
            ctx.response.body = {
                txId
            };
        } finally{
            pendingSenders.delete(input.sender);
        }
    } catch (e) {
        //TODO this is bad, in case of problem in deno it looses stack
        log.error(`transfer endpoint failed: ${e}`);
        if (e instanceof z.ZodError) {
            ctx.response.status = 400;
            ctx.response.body = {
                message: "invalid request body",
                issues: e.issues
            };
            return;
        }
        if (e instanceof SyntaxError) {
            ctx.response.status = 400;
            ctx.response.body = {
                message: e.message
            };
            return;
        }
        ctx.response.status = 500;
        ctx.response.body = e.message;
        return;
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvZHppay9Qcm9qZWN0cy9nb2xlbS9wb2x5Z29uLWdhc2xlc3Mtc2VydmVyL3NlcnZpY2VzL2ZvcndhcmQvaGFuZGxlcnMvYXBwcm92ZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBlIH0gZnJvbSBcImh0dHBzOi8vanNwbS5kZXYvbnBtOm9ib2VAMi4xLjUhY2pzXCI7XG5pbXBvcnQgeyBnbG0sIGdyYWNlUGVyaW9kTXMgfSBmcm9tIFwiLi4vLi4vLi4vY29uZmlnLnRzXCI7XG5pbXBvcnQgeyBDb250ZXh0LCBsb2csIHogfSBmcm9tIFwiLi4vLi4vLi4vZGVwcy50c1wiO1xuaW1wb3J0IHsgdXRpbHMgfSBmcm9tIFwiLi4vLi4vLi4vc2NpLnRzXCI7XG5pbXBvcnQgeyBkZWNvZGVBcHByb3ZlIH0gZnJvbSBcIi4uLy4uLy4uL3NjaS9hcHByb3ZlLXR4LWRlY29kZXIudHNcIjtcbmltcG9ydCB7IHNlbmRlciB9IGZyb20gXCIuLi8uLi8uLi9zZW5kZXIudHNcIjtcbmltcG9ydCB7IEZvcndhcmRSZXF1ZXN0IH0gZnJvbSBcIi4uL3V0aWxzLnRzXCI7XG5pbXBvcnQgeyB2YWxpZGF0ZUFwcHJvdmVNZXRhVHhBcmd1bWVudHMgfSBmcm9tIFwiLi4vdmFsaWRhdG9ycy9hcHByb3ZlLnRzXCI7XG5cbmltcG9ydCB7IGV0aGVycyB9IGZyb20gXCJucG06ZXRoZXJzXCI7XG5cbmNvbnNvbGUubG9nKFwiZXRoZXJzXCIsIGV0aGVycyk7XG5jb25zdCBwZW5kaW5nU2VuZGVycyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuZXhwb3J0IGNvbnN0IGZvcndhcmRBcHByb3ZlID0gYXN5bmMgKGN0eDogQ29udGV4dCkgPT4ge1xuICBjb25zdCBsb2dnZXIgPSBsb2cuZ2V0TG9nZ2VyKFwid2ViYXBwXCIpO1xuICB0cnkge1xuICAgIGNvbnN0IGlucHV0ID0gRm9yd2FyZFJlcXVlc3QucGFyc2UoXG4gICAgICBhd2FpdCBjdHgucmVxdWVzdC5ib2R5KHsgdHlwZTogXCJqc29uXCIgfSkudmFsdWVcbiAgICApO1xuXG4gICAgLy8gY2hlY2tpbmcgaWYgdGhpcyBpcyB0cmFuc2ZlclxuICAgIGNvbnN0IGRlY29kZWRBcmd1bWVudHMgPSBkZWNvZGVBcHByb3ZlKGlucHV0LmFiaUZ1bmN0aW9uQ2FsbCk7XG5cbiAgICBpZiAoIWRlY29kZWRBcmd1bWVudHMpIHtcbiAgICAgIGN0eC5yZXNwb25zZS5zdGF0dXMgPSA0MDA7XG4gICAgICBjdHgucmVzcG9uc2UuYm9keSA9IHtcbiAgICAgICAgbWVzc2FnZTogXCJ1bmFibGUgdG8gZGVjb2RlIHRyYW5zYWN0aW9uXCIsXG4gICAgICB9O1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGVycm9yRGV0YWlscyA9IGF3YWl0IHZhbGlkYXRlQXBwcm92ZU1ldGFUeEFyZ3VtZW50cyhcbiAgICAgIGlucHV0LnNlbmRlcixcbiAgICAgIGRlY29kZWRBcmd1bWVudHMsXG4gICAgICBpbnB1dC5ibG9ja0hhc2ggfHwgXCJsYXRlc3RcIlxuICAgICk7XG5cbiAgICBpZiAoZXJyb3JEZXRhaWxzKSB7XG4gICAgICBjdHgucmVzcG9uc2Uuc3RhdHVzID0gNDAwO1xuICAgICAgY3R4LnJlc3BvbnNlLmJvZHkgPSB7XG4gICAgICAgIG1lc3NhZ2U6IGVycm9yRGV0YWlscyxcbiAgICAgIH07XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbG9nZ2VyLmluZm8oXG4gICAgICAoKSA9PlxuICAgICAgICBgRm9yd2FyZGluZyBhcHByb3ZlIGJ5ICR7aW5wdXQuc2VuZGVyfSBmb3IgJHtcbiAgICAgICAgICBkZWNvZGVkQXJndW1lbnRzLnNwZW5kZXJcbiAgICAgICAgfSBvZiAke3V0aWxzLmZyb21XZWkoZGVjb2RlZEFyZ3VtZW50cy5hbW91bnQpfWBcbiAgICApO1xuXG4gICAgbG9nZ2VyLmRlYnVnKCgpID0+IGBpbnB1dD0ke0pTT04uc3RyaW5naWZ5KGlucHV0KX1gKTtcblxuICAgIGNvbnN0IGRhdGEgPSBnbG0ubWV0aG9kc1xuICAgICAgLmV4ZWN1dGVNZXRhVHJhbnNhY3Rpb24oXG4gICAgICAgIGlucHV0LnNlbmRlcixcbiAgICAgICAgaW5wdXQuYWJpRnVuY3Rpb25DYWxsLFxuICAgICAgICBpbnB1dC5yLFxuICAgICAgICBpbnB1dC5zLFxuICAgICAgICBpbnB1dC52XG4gICAgICApXG4gICAgICAuZW5jb2RlQUJJKCk7XG5cbiAgICBpZiAocGVuZGluZ1NlbmRlcnMuaGFzKGlucHV0LnNlbmRlcikpIHtcbiAgICAgIGN0eC5yZXNwb25zZS5zdGF0dXMgPSA0Mjk7XG4gICAgICBjdHgucmVzcG9uc2UuYm9keSA9IHtcbiAgICAgICAgbWVzc2FnZTogXCJwcm9jZXNzaW5nIGNvbmN1cnJlbnQgdHJhbnNhY3Rpb25cIixcbiAgICAgIH07XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIHBlbmRpbmdTZW5kZXJzLmFkZChpbnB1dC5zZW5kZXIpO1xuICAgICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICBjb25zdCBzdG9yYWdlS2V5ID0gYHNlbmRlci4ke2lucHV0LnNlbmRlcn1gO1xuICAgICAgaWYgKGdyYWNlUGVyaW9kTXMpIHtcbiAgICAgICAgY29uc3QgcHJldiA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKHN0b3JhZ2VLZXkpO1xuICAgICAgICBsb2dnZXIuZGVidWcoXG4gICAgICAgICAgKCkgPT5cbiAgICAgICAgICAgIGBjaGVjayBncmFjZVBlcmlvZE1zPSR7Z3JhY2VQZXJpb2RNc30sIGZvciAke3N0b3JhZ2VLZXl9LCBwcmV2PSR7cHJldn1gXG4gICAgICAgICk7XG4gICAgICAgIGlmIChwcmV2ICYmIG5vdyAtIHBhcnNlSW50KHByZXYpIDwgZ3JhY2VQZXJpb2RNcykge1xuICAgICAgICAgIGNvbnN0IHJldHJ5QWZ0ZXIgPSBuZXcgRGF0ZShwYXJzZUludChwcmV2KSArIGdyYWNlUGVyaW9kTXMpO1xuICAgICAgICAgIGN0eC5yZXNwb25zZS5zdGF0dXMgPSA0Mjk7XG4gICAgICAgICAgY3R4LnJlc3BvbnNlLmhlYWRlcnMuc2V0KFwiUmV0cnktQWZ0ZXJcIiwgcmV0cnlBZnRlci50b1VUQ1N0cmluZygpKTtcbiAgICAgICAgICBjdHgucmVzcG9uc2UuYm9keSA9IHtcbiAgICAgICAgICAgIG1lc3NhZ2U6IFwiR3JhY2UgcGVyaW9kIGRpZCBub3QgcGFzcyBmb3IgdGhpcyBhZGRyZXNzXCIsXG4gICAgICAgICAgfTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgdHhJZCA9IGF3YWl0IHNlbmRlci5zZW5kVHgoe1xuICAgICAgICB0bzogZ2xtLm9wdGlvbnMuYWRkcmVzcyxcbiAgICAgICAgZGF0YSxcbiAgICAgIH0pO1xuXG4gICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShzdG9yYWdlS2V5LCBub3cudG9TdHJpbmcoKSk7XG4gICAgICBjdHgucmVzcG9uc2UudHlwZSA9IFwianNvblwiO1xuICAgICAgY3R4LnJlc3BvbnNlLmJvZHkgPSB7IHR4SWQgfTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgcGVuZGluZ1NlbmRlcnMuZGVsZXRlKGlucHV0LnNlbmRlcik7XG4gICAgfVxuICB9IGNhdGNoIChlKSB7XG4gICAgLy9UT0RPIHRoaXMgaXMgYmFkLCBpbiBjYXNlIG9mIHByb2JsZW0gaW4gZGVubyBpdCBsb29zZXMgc3RhY2tcbiAgICBsb2cuZXJyb3IoYHRyYW5zZmVyIGVuZHBvaW50IGZhaWxlZDogJHtlfWApO1xuXG4gICAgaWYgKGUgaW5zdGFuY2VvZiB6LlpvZEVycm9yKSB7XG4gICAgICBjdHgucmVzcG9uc2Uuc3RhdHVzID0gNDAwO1xuICAgICAgY3R4LnJlc3BvbnNlLmJvZHkgPSB7XG4gICAgICAgIG1lc3NhZ2U6IFwiaW52YWxpZCByZXF1ZXN0IGJvZHlcIixcbiAgICAgICAgaXNzdWVzOiBlLmlzc3VlcyxcbiAgICAgIH07XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChlIGluc3RhbmNlb2YgU3ludGF4RXJyb3IpIHtcbiAgICAgIGN0eC5yZXNwb25zZS5zdGF0dXMgPSA0MDA7XG4gICAgICBjdHgucmVzcG9uc2UuYm9keSA9IHtcbiAgICAgICAgbWVzc2FnZTogZS5tZXNzYWdlLFxuICAgICAgfTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjdHgucmVzcG9uc2Uuc3RhdHVzID0gNTAwO1xuICAgIGN0eC5yZXNwb25zZS5ib2R5ID0gZS5tZXNzYWdlO1xuICAgIHJldHVybjtcbiAgfVxufTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxTQUFTLEdBQUcsRUFBRSxhQUFhLFFBQVEscUJBQXFCO0FBQ3hELFNBQWtCLEdBQUcsRUFBRSxDQUFDLFFBQVEsbUJBQW1CO0FBQ25ELFNBQVMsS0FBSyxRQUFRLGtCQUFrQjtBQUN4QyxTQUFTLGFBQWEsUUFBUSxxQ0FBcUM7QUFDbkUsU0FBUyxNQUFNLFFBQVEscUJBQXFCO0FBQzVDLFNBQVMsY0FBYyxRQUFRLGNBQWM7QUFDN0MsU0FBUyw4QkFBOEIsUUFBUSwyQkFBMkI7QUFFMUUsU0FBUyxNQUFNLFFBQVEsYUFBYTtBQUVwQyxRQUFRLElBQUksVUFBVTtBQUN0QixNQUFNLGlCQUFpQixJQUFJO0FBQzNCLE9BQU8sTUFBTSxpQkFBaUIsT0FBTztJQUNuQyxNQUFNLFNBQVMsSUFBSSxVQUFVO0lBQzdCLElBQUk7UUFDRixNQUFNLFFBQVEsZUFBZSxNQUMzQixNQUFNLElBQUksUUFBUSxLQUFLO1lBQUUsTUFBTTtRQUFPLEdBQUc7UUFHM0MsK0JBQStCO1FBQy9CLE1BQU0sbUJBQW1CLGNBQWMsTUFBTTtRQUU3QyxJQUFJLENBQUMsa0JBQWtCO1lBQ3JCLElBQUksU0FBUyxTQUFTO1lBQ3RCLElBQUksU0FBUyxPQUFPO2dCQUNsQixTQUFTO1lBQ1g7WUFDQTtRQUNGO1FBRUEsTUFBTSxlQUFlLE1BQU0sK0JBQ3pCLE1BQU0sUUFDTixrQkFDQSxNQUFNLGFBQWE7UUFHckIsSUFBSSxjQUFjO1lBQ2hCLElBQUksU0FBUyxTQUFTO1lBQ3RCLElBQUksU0FBUyxPQUFPO2dCQUNsQixTQUFTO1lBQ1g7WUFDQTtRQUNGO1FBRUEsT0FBTyxLQUNMLElBQ0UsQ0FBQyxzQkFBc0IsRUFBRSxNQUFNLE9BQU8sS0FBSyxFQUN6QyxpQkFBaUIsUUFDbEIsSUFBSSxFQUFFLE1BQU0sUUFBUSxpQkFBaUIsUUFBUSxDQUFDO1FBR25ELE9BQU8sTUFBTSxJQUFNLENBQUMsTUFBTSxFQUFFLEtBQUssVUFBVSxPQUFPLENBQUM7UUFFbkQsTUFBTSxPQUFPLElBQUksUUFDZCx1QkFDQyxNQUFNLFFBQ04sTUFBTSxpQkFDTixNQUFNLEdBQ04sTUFBTSxHQUNOLE1BQU0sR0FFUDtRQUVILElBQUksZUFBZSxJQUFJLE1BQU0sU0FBUztZQUNwQyxJQUFJLFNBQVMsU0FBUztZQUN0QixJQUFJLFNBQVMsT0FBTztnQkFDbEIsU0FBUztZQUNYO1lBQ0E7UUFDRjtRQUVBLElBQUk7WUFDRixlQUFlLElBQUksTUFBTTtZQUN6QixNQUFNLE1BQU0sSUFBSSxPQUFPO1lBQ3ZCLE1BQU0sYUFBYSxDQUFDLE9BQU8sRUFBRSxNQUFNLE9BQU8sQ0FBQztZQUMzQyxJQUFJLGVBQWU7Z0JBQ2pCLE1BQU0sT0FBTyxhQUFhLFFBQVE7Z0JBQ2xDLE9BQU8sTUFDTCxJQUNFLENBQUMsb0JBQW9CLEVBQUUsY0FBYyxNQUFNLEVBQUUsV0FBVyxPQUFPLEVBQUUsS0FBSyxDQUFDO2dCQUUzRSxJQUFJLFFBQVEsTUFBTSxTQUFTLFFBQVEsZUFBZTtvQkFDaEQsTUFBTSxhQUFhLElBQUksS0FBSyxTQUFTLFFBQVE7b0JBQzdDLElBQUksU0FBUyxTQUFTO29CQUN0QixJQUFJLFNBQVMsUUFBUSxJQUFJLGVBQWUsV0FBVztvQkFDbkQsSUFBSSxTQUFTLE9BQU87d0JBQ2xCLFNBQVM7b0JBQ1g7b0JBQ0E7Z0JBQ0Y7WUFDRjtZQUVBLE1BQU0sT0FBTyxNQUFNLE9BQU8sT0FBTztnQkFDL0IsSUFBSSxJQUFJLFFBQVE7Z0JBQ2hCO1lBQ0Y7WUFFQSxhQUFhLFFBQVEsWUFBWSxJQUFJO1lBQ3JDLElBQUksU0FBUyxPQUFPO1lBQ3BCLElBQUksU0FBUyxPQUFPO2dCQUFFO1lBQUs7UUFDN0IsU0FBVTtZQUNSLGVBQWUsT0FBTyxNQUFNO1FBQzlCO0lBQ0YsRUFBRSxPQUFPLEdBQUc7UUFDViw4REFBOEQ7UUFDOUQsSUFBSSxNQUFNLENBQUMsMEJBQTBCLEVBQUUsRUFBRSxDQUFDO1FBRTFDLElBQUksYUFBYSxFQUFFLFVBQVU7WUFDM0IsSUFBSSxTQUFTLFNBQVM7WUFDdEIsSUFBSSxTQUFTLE9BQU87Z0JBQ2xCLFNBQVM7Z0JBQ1QsUUFBUSxFQUFFO1lBQ1o7WUFDQTtRQUNGO1FBQ0EsSUFBSSxhQUFhLGFBQWE7WUFDNUIsSUFBSSxTQUFTLFNBQVM7WUFDdEIsSUFBSSxTQUFTLE9BQU87Z0JBQ2xCLFNBQVMsRUFBRTtZQUNiO1lBQ0E7UUFDRjtRQUVBLElBQUksU0FBUyxTQUFTO1FBQ3RCLElBQUksU0FBUyxPQUFPLEVBQUU7UUFDdEI7SUFDRjtBQUNGLEVBQUUifQ==