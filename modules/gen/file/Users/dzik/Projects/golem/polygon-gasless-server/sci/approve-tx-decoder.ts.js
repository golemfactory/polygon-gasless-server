import { abi, utils } from "../sci.ts";
const ABI = {
    name: "approve",
    type: "function",
    inputs: [
        {
            name: "spender",
            type: "address"
        },
        {
            name: "amount",
            type: "uint256"
        }
    ]
};
const APPROVE_SIGNATURE = abi.encodeFunctionSignature(ABI);
export function decodeApprove(hexBytes) {
    const bytes = utils.hexToBytes(hexBytes);
    const functionSignature = utils.bytesToHex(bytes.splice(0, 4));
    if (functionSignature === APPROVE_SIGNATURE) {
        try {
            const { "0": spender , "1": amount  } = abi.decodeParameters([
                "address",
                "uint256"
            ], utils.bytesToHex(bytes));
            return {
                spender,
                amount
            };
        } catch (e) {
            if (e instanceof Error) {
                return undefined;
            }
            throw e;
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvZHppay9Qcm9qZWN0cy9nb2xlbS9wb2x5Z29uLWdhc2xlc3Mtc2VydmVyL3NjaS9hcHByb3ZlLXR4LWRlY29kZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYWJpLCBBYmlJdGVtLCB1dGlscyB9IGZyb20gXCIuLi9zY2kudHNcIjtcblxuZXhwb3J0IHR5cGUgQXBwcm92ZUFyZ3MgPSB7XG4gIHNwZW5kZXI6IHN0cmluZztcbiAgYW1vdW50OiBzdHJpbmc7XG59O1xuXG5jb25zdCBBQkk6IEFiaUl0ZW0gPSB7XG4gIG5hbWU6IFwiYXBwcm92ZVwiLFxuICB0eXBlOiBcImZ1bmN0aW9uXCIsXG4gIGlucHV0czogW1xuICAgIHsgbmFtZTogXCJzcGVuZGVyXCIsIHR5cGU6IFwiYWRkcmVzc1wiIH0sXG4gICAgeyBuYW1lOiBcImFtb3VudFwiLCB0eXBlOiBcInVpbnQyNTZcIiB9LFxuICBdLFxufTtcblxuY29uc3QgQVBQUk9WRV9TSUdOQVRVUkUgPSBhYmkuZW5jb2RlRnVuY3Rpb25TaWduYXR1cmUoQUJJKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGRlY29kZUFwcHJvdmUoaGV4Qnl0ZXM6IHN0cmluZyk6IEFwcHJvdmVBcmdzIHwgdW5kZWZpbmVkIHtcbiAgY29uc3QgYnl0ZXMgPSB1dGlscy5oZXhUb0J5dGVzKGhleEJ5dGVzKTtcbiAgY29uc3QgZnVuY3Rpb25TaWduYXR1cmUgPSB1dGlscy5ieXRlc1RvSGV4KGJ5dGVzLnNwbGljZSgwLCA0KSk7XG4gIGlmIChmdW5jdGlvblNpZ25hdHVyZSA9PT0gQVBQUk9WRV9TSUdOQVRVUkUpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgeyBcIjBcIjogc3BlbmRlciwgXCIxXCI6IGFtb3VudCB9ID0gYWJpLmRlY29kZVBhcmFtZXRlcnMoXG4gICAgICAgIFtcImFkZHJlc3NcIiwgXCJ1aW50MjU2XCJdLFxuICAgICAgICB1dGlscy5ieXRlc1RvSGV4KGJ5dGVzKVxuICAgICAgKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHNwZW5kZXIsXG4gICAgICAgIGFtb3VudCxcbiAgICAgIH07XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgfVxuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxTQUFTLEdBQUcsRUFBVyxLQUFLLFFBQVEsWUFBWTtBQU9oRCxNQUFNLE1BQWU7SUFDbkIsTUFBTTtJQUNOLE1BQU07SUFDTixRQUFRO1FBQ047WUFBRSxNQUFNO1lBQVcsTUFBTTtRQUFVO1FBQ25DO1lBQUUsTUFBTTtZQUFVLE1BQU07UUFBVTtLQUNuQztBQUNIO0FBRUEsTUFBTSxvQkFBb0IsSUFBSSx3QkFBd0I7QUFFdEQsT0FBTyxTQUFTLGNBQWMsUUFBZ0I7SUFDNUMsTUFBTSxRQUFRLE1BQU0sV0FBVztJQUMvQixNQUFNLG9CQUFvQixNQUFNLFdBQVcsTUFBTSxPQUFPLEdBQUc7SUFDM0QsSUFBSSxzQkFBc0IsbUJBQW1CO1FBQzNDLElBQUk7WUFDRixNQUFNLEVBQUUsS0FBSyxRQUFPLEVBQUUsS0FBSyxPQUFNLEVBQUUsR0FBRyxJQUFJLGlCQUN4QztnQkFBQztnQkFBVzthQUFVLEVBQ3RCLE1BQU0sV0FBVztZQUVuQixPQUFPO2dCQUNMO2dCQUNBO1lBQ0Y7UUFDRixFQUFFLE9BQU8sR0FBRztZQUNWLElBQUksYUFBYSxPQUFPO2dCQUN0QixPQUFPO1lBQ1Q7WUFDQSxNQUFNO1FBQ1I7SUFDRjtBQUNGIn0=