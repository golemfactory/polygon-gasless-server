import { z } from "../../deps.ts";
import { utils } from "../../sci.ts";
const HexString = ()=>z.string().refine(utils.isHexStrict, "expected 0x prefixed hex string");
const Address = ()=>z.string().refine(utils.isAddress, "expected eth address");
export const ForwardRequest = z.object({
    r: HexString(),
    s: HexString(),
    v: z.number(),
    sender: Address(),
    abiFunctionCall: HexString(),
    signedRequest: HexString().optional(),
    blockHash: HexString().optional()
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvZHppay9Qcm9qZWN0cy9nb2xlbS9wb2x5Z29uLWdhc2xlc3Mtc2VydmVyL3NlcnZpY2VzL2ZvcndhcmQvdXRpbHMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgeiB9IGZyb20gXCIuLi8uLi9kZXBzLnRzXCI7XG5pbXBvcnQgeyB1dGlscyB9IGZyb20gXCIuLi8uLi9zY2kudHNcIjtcblxuY29uc3QgSGV4U3RyaW5nID0gKCkgPT5cbiAgei5zdHJpbmcoKS5yZWZpbmUodXRpbHMuaXNIZXhTdHJpY3QsIFwiZXhwZWN0ZWQgMHggcHJlZml4ZWQgaGV4IHN0cmluZ1wiKTtcbmNvbnN0IEFkZHJlc3MgPSAoKSA9PlxuICB6LnN0cmluZygpLnJlZmluZSh1dGlscy5pc0FkZHJlc3MsIFwiZXhwZWN0ZWQgZXRoIGFkZHJlc3NcIik7XG5cbmV4cG9ydCBjb25zdCBGb3J3YXJkUmVxdWVzdCA9IHoub2JqZWN0KHtcbiAgcjogSGV4U3RyaW5nKCksXG4gIHM6IEhleFN0cmluZygpLFxuICB2OiB6Lm51bWJlcigpLFxuICBzZW5kZXI6IEFkZHJlc3MoKSxcbiAgYWJpRnVuY3Rpb25DYWxsOiBIZXhTdHJpbmcoKSxcbiAgc2lnbmVkUmVxdWVzdDogSGV4U3RyaW5nKCkub3B0aW9uYWwoKSxcbiAgYmxvY2tIYXNoOiBIZXhTdHJpbmcoKS5vcHRpb25hbCgpLFxufSk7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsU0FBUyxDQUFDLFFBQVEsZ0JBQWdCO0FBQ2xDLFNBQVMsS0FBSyxRQUFRLGVBQWU7QUFFckMsTUFBTSxZQUFZLElBQ2hCLEVBQUUsU0FBUyxPQUFPLE1BQU0sYUFBYTtBQUN2QyxNQUFNLFVBQVUsSUFDZCxFQUFFLFNBQVMsT0FBTyxNQUFNLFdBQVc7QUFFckMsT0FBTyxNQUFNLGlCQUFpQixFQUFFLE9BQU87SUFDckMsR0FBRztJQUNILEdBQUc7SUFDSCxHQUFHLEVBQUU7SUFDTCxRQUFRO0lBQ1IsaUJBQWlCO0lBQ2pCLGVBQWUsWUFBWTtJQUMzQixXQUFXLFlBQVk7QUFDekIsR0FBRyJ9