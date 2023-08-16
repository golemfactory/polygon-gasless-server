import web3, { blockMaxAgeS } from "../../../config.ts";
export async function validateTransferMetaTxArguments(sender, transfer_details, block_hash) {
    const requested_amount = web3.utils.toBN(transfer_details.amount);
    if (requested_amount.isZero()) {
        return "Cannot transfer 0 tokens";
    }
    let from = sender.toLocaleLowerCase();
    if (!from.startsWith("0x")) {
        from = "0x" + from;
    }
    let to = transfer_details.recipient.toLowerCase();
    if (!to.startsWith("0x")) {
        to = "0x" + to;
    }
    if (from === to) {
        return "Sender and recipient addresses must differ";
    }
    let block;
    try {
        block = await web3.eth.getBlock(block_hash);
    } catch (_error) {
        return `Block ${block_hash} is too old`;
    }
    if (!block.nonce) {
        return `Block ${block_hash} is still pending`;
    }
    const now_seconds = Date.now() / 1000;
    if (now_seconds - +block.timestamp > blockMaxAgeS) {
        return "Provided block is too old and can contain stale data";
    }
    return undefined;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvZHppay9Qcm9qZWN0cy9nb2xlbS9wb2x5Z29uLWdhc2xlc3Mtc2VydmVyL3NlcnZpY2VzL2ZvcndhcmQvdmFsaWRhdG9ycy90cmFuc2Zlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgd2ViMywgeyBibG9ja01heEFnZVMgfSBmcm9tIFwiLi4vLi4vLi4vY29uZmlnLnRzXCI7XG5pbXBvcnQgeyBUcmFuc2ZlckFyZ3MgfSBmcm9tIFwiLi4vLi4vLi4vc2NpL3RyYW5zZmVyLXR4LWRlY29kZXIudHNcIjtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHZhbGlkYXRlVHJhbnNmZXJNZXRhVHhBcmd1bWVudHMoXG4gIHNlbmRlcjogc3RyaW5nLFxuICB0cmFuc2Zlcl9kZXRhaWxzOiBUcmFuc2ZlckFyZ3MsXG4gIGJsb2NrX2hhc2g6IHN0cmluZ1xuKTogUHJvbWlzZTxzdHJpbmcgfCB1bmRlZmluZWQ+IHtcbiAgY29uc3QgcmVxdWVzdGVkX2Ftb3VudCA9IHdlYjMudXRpbHMudG9CTih0cmFuc2Zlcl9kZXRhaWxzLmFtb3VudCk7XG5cbiAgaWYgKHJlcXVlc3RlZF9hbW91bnQuaXNaZXJvKCkpIHtcbiAgICByZXR1cm4gXCJDYW5ub3QgdHJhbnNmZXIgMCB0b2tlbnNcIjtcbiAgfVxuXG4gIGxldCBmcm9tID0gc2VuZGVyLnRvTG9jYWxlTG93ZXJDYXNlKCk7XG4gIGlmICghZnJvbS5zdGFydHNXaXRoKFwiMHhcIikpIHtcbiAgICBmcm9tID0gXCIweFwiICsgZnJvbTtcbiAgfVxuXG4gIGxldCB0byA9IHRyYW5zZmVyX2RldGFpbHMucmVjaXBpZW50LnRvTG93ZXJDYXNlKCk7XG4gIGlmICghdG8uc3RhcnRzV2l0aChcIjB4XCIpKSB7XG4gICAgdG8gPSBcIjB4XCIgKyB0bztcbiAgfVxuXG4gIGlmIChmcm9tID09PSB0bykge1xuICAgIHJldHVybiBcIlNlbmRlciBhbmQgcmVjaXBpZW50IGFkZHJlc3NlcyBtdXN0IGRpZmZlclwiO1xuICB9XG5cbiAgbGV0IGJsb2NrO1xuICB0cnkge1xuICAgIGJsb2NrID0gYXdhaXQgd2ViMy5ldGguZ2V0QmxvY2soYmxvY2tfaGFzaCk7XG4gIH0gY2F0Y2ggKF9lcnJvcikge1xuICAgIHJldHVybiBgQmxvY2sgJHtibG9ja19oYXNofSBpcyB0b28gb2xkYDtcbiAgfVxuXG4gIGlmICghYmxvY2subm9uY2UpIHtcbiAgICByZXR1cm4gYEJsb2NrICR7YmxvY2tfaGFzaH0gaXMgc3RpbGwgcGVuZGluZ2A7XG4gIH1cblxuICBjb25zdCBub3dfc2Vjb25kcyA9IERhdGUubm93KCkgLyAxMDAwO1xuICBpZiAobm93X3NlY29uZHMgLSArYmxvY2sudGltZXN0YW1wID4gYmxvY2tNYXhBZ2VTKSB7XG4gICAgcmV0dXJuIFwiUHJvdmlkZWQgYmxvY2sgaXMgdG9vIG9sZCBhbmQgY2FuIGNvbnRhaW4gc3RhbGUgZGF0YVwiO1xuICB9XG5cbiAgcmV0dXJuIHVuZGVmaW5lZDtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLFFBQVEsWUFBWSxRQUFRLHFCQUFxQjtBQUd4RCxPQUFPLGVBQWUsZ0NBQ3BCLE1BQWMsRUFDZCxnQkFBOEIsRUFDOUIsVUFBa0I7SUFFbEIsTUFBTSxtQkFBbUIsS0FBSyxNQUFNLEtBQUssaUJBQWlCO0lBRTFELElBQUksaUJBQWlCLFVBQVU7UUFDN0IsT0FBTztJQUNUO0lBRUEsSUFBSSxPQUFPLE9BQU87SUFDbEIsSUFBSSxDQUFDLEtBQUssV0FBVyxPQUFPO1FBQzFCLE9BQU8sT0FBTztJQUNoQjtJQUVBLElBQUksS0FBSyxpQkFBaUIsVUFBVTtJQUNwQyxJQUFJLENBQUMsR0FBRyxXQUFXLE9BQU87UUFDeEIsS0FBSyxPQUFPO0lBQ2Q7SUFFQSxJQUFJLFNBQVMsSUFBSTtRQUNmLE9BQU87SUFDVDtJQUVBLElBQUk7SUFDSixJQUFJO1FBQ0YsUUFBUSxNQUFNLEtBQUssSUFBSSxTQUFTO0lBQ2xDLEVBQUUsT0FBTyxRQUFRO1FBQ2YsT0FBTyxDQUFDLE1BQU0sRUFBRSxXQUFXLFdBQVcsQ0FBQztJQUN6QztJQUVBLElBQUksQ0FBQyxNQUFNLE9BQU87UUFDaEIsT0FBTyxDQUFDLE1BQU0sRUFBRSxXQUFXLGlCQUFpQixDQUFDO0lBQy9DO0lBRUEsTUFBTSxjQUFjLEtBQUssUUFBUTtJQUNqQyxJQUFJLGNBQWMsQ0FBQyxNQUFNLFlBQVksY0FBYztRQUNqRCxPQUFPO0lBQ1Q7SUFFQSxPQUFPO0FBQ1QifQ==