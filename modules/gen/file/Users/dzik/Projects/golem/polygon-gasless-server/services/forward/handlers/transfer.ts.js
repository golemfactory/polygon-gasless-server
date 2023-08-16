import { glm, gracePeriodMs } from "../../../config.ts";
import { log, z } from "../../../deps.ts";
import { utils } from "../../../sci.ts";
import { decodeTransfer } from "../../../sci/transfer-tx-decoder.ts";
import { sender } from "../../../sender.ts";
import { ForwardRequest } from "../utils.ts";
import { validateTransferMetaTxArguments } from "../validators/transfer.ts";
const pendingSenders = new Set();
export const forwardTransfer = async (ctx)=>{
    const logger = log.getLogger("webapp");
    try {
        const input = ForwardRequest.parse(await ctx.request.body({
            type: "json"
        }).value);
        // checking if this is transfer
        const decoded_arguments = decodeTransfer(input.abiFunctionCall);
        if (!decoded_arguments) {
            ctx.response.status = 400;
            ctx.response.body = {
                message: "unable to decode transaction"
            };
            return;
        }
        const error_details = await validateTransferMetaTxArguments(input.sender, decoded_arguments, input.blockHash || "latest");
        if (error_details) {
            ctx.response.status = 400;
            ctx.response.body = {
                message: error_details
            };
            return;
        }
        logger.info(()=>`Forwarding transfer from ${input.sender} to ${decoded_arguments.recipient} of ${utils.fromWei(decoded_arguments.amount)}`);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvZHppay9Qcm9qZWN0cy9nb2xlbS9wb2x5Z29uLWdhc2xlc3Mtc2VydmVyL3NlcnZpY2VzL2ZvcndhcmQvaGFuZGxlcnMvdHJhbnNmZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZ2xtLCBncmFjZVBlcmlvZE1zIH0gZnJvbSBcIi4uLy4uLy4uL2NvbmZpZy50c1wiO1xuaW1wb3J0IHsgQ29udGV4dCwgbG9nLCB6IH0gZnJvbSBcIi4uLy4uLy4uL2RlcHMudHNcIjtcbmltcG9ydCB7IHV0aWxzIH0gZnJvbSBcIi4uLy4uLy4uL3NjaS50c1wiO1xuaW1wb3J0IHsgZGVjb2RlVHJhbnNmZXIgfSBmcm9tIFwiLi4vLi4vLi4vc2NpL3RyYW5zZmVyLXR4LWRlY29kZXIudHNcIjtcbmltcG9ydCB7IHNlbmRlciB9IGZyb20gXCIuLi8uLi8uLi9zZW5kZXIudHNcIjtcbmltcG9ydCB7IEZvcndhcmRSZXF1ZXN0IH0gZnJvbSBcIi4uL3V0aWxzLnRzXCI7XG5pbXBvcnQgeyB2YWxpZGF0ZVRyYW5zZmVyTWV0YVR4QXJndW1lbnRzIH0gZnJvbSBcIi4uL3ZhbGlkYXRvcnMvdHJhbnNmZXIudHNcIjtcblxuY29uc3QgcGVuZGluZ1NlbmRlcnMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbmV4cG9ydCBjb25zdCBmb3J3YXJkVHJhbnNmZXIgPSBhc3luYyAoY3R4OiBDb250ZXh0KSA9PiB7XG4gIGNvbnN0IGxvZ2dlciA9IGxvZy5nZXRMb2dnZXIoXCJ3ZWJhcHBcIik7XG4gIHRyeSB7XG4gICAgY29uc3QgaW5wdXQgPSBGb3J3YXJkUmVxdWVzdC5wYXJzZShcbiAgICAgIGF3YWl0IGN0eC5yZXF1ZXN0LmJvZHkoeyB0eXBlOiBcImpzb25cIiB9KS52YWx1ZVxuICAgICk7XG5cbiAgICAvLyBjaGVja2luZyBpZiB0aGlzIGlzIHRyYW5zZmVyXG4gICAgY29uc3QgZGVjb2RlZF9hcmd1bWVudHMgPSBkZWNvZGVUcmFuc2ZlcihpbnB1dC5hYmlGdW5jdGlvbkNhbGwpO1xuICAgIGlmICghZGVjb2RlZF9hcmd1bWVudHMpIHtcbiAgICAgIGN0eC5yZXNwb25zZS5zdGF0dXMgPSA0MDA7XG4gICAgICBjdHgucmVzcG9uc2UuYm9keSA9IHtcbiAgICAgICAgbWVzc2FnZTogXCJ1bmFibGUgdG8gZGVjb2RlIHRyYW5zYWN0aW9uXCIsXG4gICAgICB9O1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGVycm9yX2RldGFpbHMgPSBhd2FpdCB2YWxpZGF0ZVRyYW5zZmVyTWV0YVR4QXJndW1lbnRzKFxuICAgICAgaW5wdXQuc2VuZGVyLFxuICAgICAgZGVjb2RlZF9hcmd1bWVudHMsXG4gICAgICBpbnB1dC5ibG9ja0hhc2ggfHwgXCJsYXRlc3RcIlxuICAgICk7XG5cbiAgICBpZiAoZXJyb3JfZGV0YWlscykge1xuICAgICAgY3R4LnJlc3BvbnNlLnN0YXR1cyA9IDQwMDtcbiAgICAgIGN0eC5yZXNwb25zZS5ib2R5ID0ge1xuICAgICAgICBtZXNzYWdlOiBlcnJvcl9kZXRhaWxzLFxuICAgICAgfTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsb2dnZXIuaW5mbyhcbiAgICAgICgpID0+XG4gICAgICAgIGBGb3J3YXJkaW5nIHRyYW5zZmVyIGZyb20gJHtpbnB1dC5zZW5kZXJ9IHRvICR7XG4gICAgICAgICAgZGVjb2RlZF9hcmd1bWVudHMucmVjaXBpZW50XG4gICAgICAgIH0gb2YgJHt1dGlscy5mcm9tV2VpKGRlY29kZWRfYXJndW1lbnRzLmFtb3VudCl9YFxuICAgICk7XG4gICAgbG9nZ2VyLmRlYnVnKCgpID0+IGBpbnB1dD0ke0pTT04uc3RyaW5naWZ5KGlucHV0KX1gKTtcblxuICAgIGNvbnN0IGRhdGEgPSBnbG0ubWV0aG9kc1xuICAgICAgLmV4ZWN1dGVNZXRhVHJhbnNhY3Rpb24oXG4gICAgICAgIGlucHV0LnNlbmRlcixcbiAgICAgICAgaW5wdXQuYWJpRnVuY3Rpb25DYWxsLFxuICAgICAgICBpbnB1dC5yLFxuICAgICAgICBpbnB1dC5zLFxuICAgICAgICBpbnB1dC52XG4gICAgICApXG4gICAgICAuZW5jb2RlQUJJKCk7XG5cbiAgICBpZiAocGVuZGluZ1NlbmRlcnMuaGFzKGlucHV0LnNlbmRlcikpIHtcbiAgICAgIGN0eC5yZXNwb25zZS5zdGF0dXMgPSA0Mjk7XG4gICAgICBjdHgucmVzcG9uc2UuYm9keSA9IHtcbiAgICAgICAgbWVzc2FnZTogXCJwcm9jZXNzaW5nIGNvbmN1cnJlbnQgdHJhbnNhY3Rpb25cIixcbiAgICAgIH07XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICBwZW5kaW5nU2VuZGVycy5hZGQoaW5wdXQuc2VuZGVyKTtcbiAgICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgY29uc3Qgc3RvcmFnZUtleSA9IGBzZW5kZXIuJHtpbnB1dC5zZW5kZXJ9YDtcbiAgICAgIGlmIChncmFjZVBlcmlvZE1zKSB7XG4gICAgICAgIGNvbnN0IHByZXYgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShzdG9yYWdlS2V5KTtcbiAgICAgICAgbG9nZ2VyLmRlYnVnKFxuICAgICAgICAgICgpID0+XG4gICAgICAgICAgICBgY2hlY2sgZ3JhY2VQZXJpb2RNcz0ke2dyYWNlUGVyaW9kTXN9LCBmb3IgJHtzdG9yYWdlS2V5fSwgcHJldj0ke3ByZXZ9YFxuICAgICAgICApO1xuICAgICAgICBpZiAocHJldiAmJiBub3cgLSBwYXJzZUludChwcmV2KSA8IGdyYWNlUGVyaW9kTXMpIHtcbiAgICAgICAgICBjb25zdCByZXRyeUFmdGVyID0gbmV3IERhdGUocGFyc2VJbnQocHJldikgKyBncmFjZVBlcmlvZE1zKTtcbiAgICAgICAgICBjdHgucmVzcG9uc2Uuc3RhdHVzID0gNDI5O1xuICAgICAgICAgIGN0eC5yZXNwb25zZS5oZWFkZXJzLnNldChcIlJldHJ5LUFmdGVyXCIsIHJldHJ5QWZ0ZXIudG9VVENTdHJpbmcoKSk7XG4gICAgICAgICAgY3R4LnJlc3BvbnNlLmJvZHkgPSB7XG4gICAgICAgICAgICBtZXNzYWdlOiBcIkdyYWNlIHBlcmlvZCBkaWQgbm90IHBhc3MgZm9yIHRoaXMgYWRkcmVzc1wiLFxuICAgICAgICAgIH07XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHR4SWQgPSBhd2FpdCBzZW5kZXIuc2VuZFR4KHtcbiAgICAgICAgdG86IGdsbS5vcHRpb25zLmFkZHJlc3MsXG4gICAgICAgIGRhdGEsXG4gICAgICB9KTtcblxuICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oc3RvcmFnZUtleSwgbm93LnRvU3RyaW5nKCkpO1xuICAgICAgY3R4LnJlc3BvbnNlLnR5cGUgPSBcImpzb25cIjtcbiAgICAgIGN0eC5yZXNwb25zZS5ib2R5ID0geyB0eElkIH07XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHBlbmRpbmdTZW5kZXJzLmRlbGV0ZShpbnB1dC5zZW5kZXIpO1xuICAgIH1cbiAgfSBjYXRjaCAoZSkge1xuICAgIGxvZy5lcnJvcihgdHJhbnNmZXIgZW5kcG9pbnQgZmFpbGVkOiAke2V9YCk7XG5cbiAgICBpZiAoZSBpbnN0YW5jZW9mIHouWm9kRXJyb3IpIHtcbiAgICAgIGN0eC5yZXNwb25zZS5zdGF0dXMgPSA0MDA7XG4gICAgICBjdHgucmVzcG9uc2UuYm9keSA9IHtcbiAgICAgICAgbWVzc2FnZTogXCJpbnZhbGlkIHJlcXVlc3QgYm9keVwiLFxuICAgICAgICBpc3N1ZXM6IGUuaXNzdWVzLFxuICAgICAgfTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGUgaW5zdGFuY2VvZiBTeW50YXhFcnJvcikge1xuICAgICAgY3R4LnJlc3BvbnNlLnN0YXR1cyA9IDQwMDtcbiAgICAgIGN0eC5yZXNwb25zZS5ib2R5ID0ge1xuICAgICAgICBtZXNzYWdlOiBlLm1lc3NhZ2UsXG4gICAgICB9O1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGN0eC5yZXNwb25zZS5zdGF0dXMgPSA1MDA7XG4gICAgY3R4LnJlc3BvbnNlLmJvZHkgPSBlLm1lc3NhZ2U7XG4gICAgcmV0dXJuO1xuICB9XG59O1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFNBQVMsR0FBRyxFQUFFLGFBQWEsUUFBUSxxQkFBcUI7QUFDeEQsU0FBa0IsR0FBRyxFQUFFLENBQUMsUUFBUSxtQkFBbUI7QUFDbkQsU0FBUyxLQUFLLFFBQVEsa0JBQWtCO0FBQ3hDLFNBQVMsY0FBYyxRQUFRLHNDQUFzQztBQUNyRSxTQUFTLE1BQU0sUUFBUSxxQkFBcUI7QUFDNUMsU0FBUyxjQUFjLFFBQVEsY0FBYztBQUM3QyxTQUFTLCtCQUErQixRQUFRLDRCQUE0QjtBQUU1RSxNQUFNLGlCQUFpQixJQUFJO0FBQzNCLE9BQU8sTUFBTSxrQkFBa0IsT0FBTztJQUNwQyxNQUFNLFNBQVMsSUFBSSxVQUFVO0lBQzdCLElBQUk7UUFDRixNQUFNLFFBQVEsZUFBZSxNQUMzQixNQUFNLElBQUksUUFBUSxLQUFLO1lBQUUsTUFBTTtRQUFPLEdBQUc7UUFHM0MsK0JBQStCO1FBQy9CLE1BQU0sb0JBQW9CLGVBQWUsTUFBTTtRQUMvQyxJQUFJLENBQUMsbUJBQW1CO1lBQ3RCLElBQUksU0FBUyxTQUFTO1lBQ3RCLElBQUksU0FBUyxPQUFPO2dCQUNsQixTQUFTO1lBQ1g7WUFDQTtRQUNGO1FBRUEsTUFBTSxnQkFBZ0IsTUFBTSxnQ0FDMUIsTUFBTSxRQUNOLG1CQUNBLE1BQU0sYUFBYTtRQUdyQixJQUFJLGVBQWU7WUFDakIsSUFBSSxTQUFTLFNBQVM7WUFDdEIsSUFBSSxTQUFTLE9BQU87Z0JBQ2xCLFNBQVM7WUFDWDtZQUNBO1FBQ0Y7UUFFQSxPQUFPLEtBQ0wsSUFDRSxDQUFDLHlCQUF5QixFQUFFLE1BQU0sT0FBTyxJQUFJLEVBQzNDLGtCQUFrQixVQUNuQixJQUFJLEVBQUUsTUFBTSxRQUFRLGtCQUFrQixRQUFRLENBQUM7UUFFcEQsT0FBTyxNQUFNLElBQU0sQ0FBQyxNQUFNLEVBQUUsS0FBSyxVQUFVLE9BQU8sQ0FBQztRQUVuRCxNQUFNLE9BQU8sSUFBSSxRQUNkLHVCQUNDLE1BQU0sUUFDTixNQUFNLGlCQUNOLE1BQU0sR0FDTixNQUFNLEdBQ04sTUFBTSxHQUVQO1FBRUgsSUFBSSxlQUFlLElBQUksTUFBTSxTQUFTO1lBQ3BDLElBQUksU0FBUyxTQUFTO1lBQ3RCLElBQUksU0FBUyxPQUFPO2dCQUNsQixTQUFTO1lBQ1g7WUFDQTtRQUNGO1FBQ0EsSUFBSTtZQUNGLGVBQWUsSUFBSSxNQUFNO1lBQ3pCLE1BQU0sTUFBTSxJQUFJLE9BQU87WUFDdkIsTUFBTSxhQUFhLENBQUMsT0FBTyxFQUFFLE1BQU0sT0FBTyxDQUFDO1lBQzNDLElBQUksZUFBZTtnQkFDakIsTUFBTSxPQUFPLGFBQWEsUUFBUTtnQkFDbEMsT0FBTyxNQUNMLElBQ0UsQ0FBQyxvQkFBb0IsRUFBRSxjQUFjLE1BQU0sRUFBRSxXQUFXLE9BQU8sRUFBRSxLQUFLLENBQUM7Z0JBRTNFLElBQUksUUFBUSxNQUFNLFNBQVMsUUFBUSxlQUFlO29CQUNoRCxNQUFNLGFBQWEsSUFBSSxLQUFLLFNBQVMsUUFBUTtvQkFDN0MsSUFBSSxTQUFTLFNBQVM7b0JBQ3RCLElBQUksU0FBUyxRQUFRLElBQUksZUFBZSxXQUFXO29CQUNuRCxJQUFJLFNBQVMsT0FBTzt3QkFDbEIsU0FBUztvQkFDWDtvQkFDQTtnQkFDRjtZQUNGO1lBRUEsTUFBTSxPQUFPLE1BQU0sT0FBTyxPQUFPO2dCQUMvQixJQUFJLElBQUksUUFBUTtnQkFDaEI7WUFDRjtZQUVBLGFBQWEsUUFBUSxZQUFZLElBQUk7WUFDckMsSUFBSSxTQUFTLE9BQU87WUFDcEIsSUFBSSxTQUFTLE9BQU87Z0JBQUU7WUFBSztRQUM3QixTQUFVO1lBQ1IsZUFBZSxPQUFPLE1BQU07UUFDOUI7SUFDRixFQUFFLE9BQU8sR0FBRztRQUNWLElBQUksTUFBTSxDQUFDLDBCQUEwQixFQUFFLEVBQUUsQ0FBQztRQUUxQyxJQUFJLGFBQWEsRUFBRSxVQUFVO1lBQzNCLElBQUksU0FBUyxTQUFTO1lBQ3RCLElBQUksU0FBUyxPQUFPO2dCQUNsQixTQUFTO2dCQUNULFFBQVEsRUFBRTtZQUNaO1lBQ0E7UUFDRjtRQUNBLElBQUksYUFBYSxhQUFhO1lBQzVCLElBQUksU0FBUyxTQUFTO1lBQ3RCLElBQUksU0FBUyxPQUFPO2dCQUNsQixTQUFTLEVBQUU7WUFDYjtZQUNBO1FBQ0Y7UUFFQSxJQUFJLFNBQVMsU0FBUztRQUN0QixJQUFJLFNBQVMsT0FBTyxFQUFFO1FBQ3RCO0lBQ0Y7QUFDRixFQUFFIn0=