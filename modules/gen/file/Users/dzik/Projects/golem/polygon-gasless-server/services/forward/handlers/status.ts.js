import web3, { blockMaxAgeS, config, gracePeriodMs } from "../../../config.ts";
import { Status } from "../../../deps.ts";
import { utils } from "../../../sci.ts";
import { sender } from "../../../sender.ts";
export const getServiceStatus = async (ctx)=>{
    console.log("hello");
    const networkId = await web3.eth.net.getId();
    const address = sender.address;
    const gas = utils.fromWei(await web3.eth.getBalance(address));
    const queueSize = sender.queueSize;
    const gasPrice = sender.gasPrice.toString(10);
    const gasPriceUpperLimit = sender.gasPriceUpperLimit.toString(10);
    const contractAddress = config.contractAddress;
    ctx.response.status = Status.OK;
    ctx.response.type = "json";
    ctx.response.body = {
        networkId,
        address,
        gas,
        gasPrice,
        gasPriceUpperLimit,
        queueSize,
        contractAddress,
        gracePeriodMs,
        blockMaxAgeS
    };
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvZHppay9Qcm9qZWN0cy9nb2xlbS9wb2x5Z29uLWdhc2xlc3Mtc2VydmVyL3NlcnZpY2VzL2ZvcndhcmQvaGFuZGxlcnMvc3RhdHVzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB3ZWIzLCB7IGJsb2NrTWF4QWdlUywgY29uZmlnLCBncmFjZVBlcmlvZE1zIH0gZnJvbSBcIi4uLy4uLy4uL2NvbmZpZy50c1wiO1xuaW1wb3J0IHsgQ29udGV4dCwgU3RhdHVzIH0gZnJvbSBcIi4uLy4uLy4uL2RlcHMudHNcIjtcbmltcG9ydCB7IHV0aWxzIH0gZnJvbSBcIi4uLy4uLy4uL3NjaS50c1wiO1xuaW1wb3J0IHsgc2VuZGVyIH0gZnJvbSBcIi4uLy4uLy4uL3NlbmRlci50c1wiO1xuXG5leHBvcnQgY29uc3QgZ2V0U2VydmljZVN0YXR1cyA9IGFzeW5jIChjdHg6IENvbnRleHQpID0+IHtcbiAgY29uc29sZS5sb2coXCJoZWxsb1wiKTtcbiAgY29uc3QgbmV0d29ya0lkID0gYXdhaXQgd2ViMy5ldGgubmV0LmdldElkKCk7XG4gIGNvbnN0IGFkZHJlc3MgPSBzZW5kZXIuYWRkcmVzcztcbiAgY29uc3QgZ2FzID0gdXRpbHMuZnJvbVdlaShhd2FpdCB3ZWIzLmV0aC5nZXRCYWxhbmNlKGFkZHJlc3MpKTtcbiAgY29uc3QgcXVldWVTaXplID0gc2VuZGVyLnF1ZXVlU2l6ZTtcbiAgY29uc3QgZ2FzUHJpY2UgPSBzZW5kZXIuZ2FzUHJpY2UudG9TdHJpbmcoMTApO1xuICBjb25zdCBnYXNQcmljZVVwcGVyTGltaXQgPSBzZW5kZXIuZ2FzUHJpY2VVcHBlckxpbWl0LnRvU3RyaW5nKDEwKTtcbiAgY29uc3QgY29udHJhY3RBZGRyZXNzID0gY29uZmlnLmNvbnRyYWN0QWRkcmVzcztcbiAgY3R4LnJlc3BvbnNlLnN0YXR1cyA9IFN0YXR1cy5PSztcbiAgY3R4LnJlc3BvbnNlLnR5cGUgPSBcImpzb25cIjtcbiAgY3R4LnJlc3BvbnNlLmJvZHkgPSB7XG4gICAgbmV0d29ya0lkLFxuICAgIGFkZHJlc3MsXG4gICAgZ2FzLFxuICAgIGdhc1ByaWNlLFxuICAgIGdhc1ByaWNlVXBwZXJMaW1pdCxcbiAgICBxdWV1ZVNpemUsXG4gICAgY29udHJhY3RBZGRyZXNzLFxuICAgIGdyYWNlUGVyaW9kTXMsXG4gICAgYmxvY2tNYXhBZ2VTLFxuICB9O1xufTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLFFBQVEsWUFBWSxFQUFFLE1BQU0sRUFBRSxhQUFhLFFBQVEscUJBQXFCO0FBQy9FLFNBQWtCLE1BQU0sUUFBUSxtQkFBbUI7QUFDbkQsU0FBUyxLQUFLLFFBQVEsa0JBQWtCO0FBQ3hDLFNBQVMsTUFBTSxRQUFRLHFCQUFxQjtBQUU1QyxPQUFPLE1BQU0sbUJBQW1CLE9BQU87SUFDckMsUUFBUSxJQUFJO0lBQ1osTUFBTSxZQUFZLE1BQU0sS0FBSyxJQUFJLElBQUk7SUFDckMsTUFBTSxVQUFVLE9BQU87SUFDdkIsTUFBTSxNQUFNLE1BQU0sUUFBUSxNQUFNLEtBQUssSUFBSSxXQUFXO0lBQ3BELE1BQU0sWUFBWSxPQUFPO0lBQ3pCLE1BQU0sV0FBVyxPQUFPLFNBQVMsU0FBUztJQUMxQyxNQUFNLHFCQUFxQixPQUFPLG1CQUFtQixTQUFTO0lBQzlELE1BQU0sa0JBQWtCLE9BQU87SUFDL0IsSUFBSSxTQUFTLFNBQVMsT0FBTztJQUM3QixJQUFJLFNBQVMsT0FBTztJQUNwQixJQUFJLFNBQVMsT0FBTztRQUNsQjtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7SUFDRjtBQUNGLEVBQUUifQ==