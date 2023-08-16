import web3, { blockMaxAgeS } from "../../../config.ts";
export async function validateApproveMetaTxArguments(sender, transferDetails, blockHash) {
    const requestedAmount = web3.utils.toBN(transferDetails.amount);
    if (requestedAmount.isZero()) {
        return "Cannot approve for 0 tokens";
    }
    let from = sender.toLocaleLowerCase();
    if (!from.startsWith("0x")) {
        from = "0x" + from;
    }
    let to = transferDetails.spender.toLowerCase();
    if (!to.startsWith("0x")) {
        to = "0x" + to;
    }
    if (from === to) {
        return "Sender and spender addresses must differ";
    }
    let block;
    try {
        block = await web3.eth.getBlock(blockHash);
    } catch (_error) {
        return `Can't get ${blockHash} block`;
    }
    if (!block.nonce) {
        return `Block ${blockHash} is still pending`;
    }
    const now_seconds = Date.now() / 1000;
    if (now_seconds - +block.timestamp > blockMaxAgeS) {
        return "Provided block is too old and can contain stale data";
    }
    return undefined;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvZHppay9Qcm9qZWN0cy9nb2xlbS9wb2x5Z29uLWdhc2xlc3Mtc2VydmVyL3NlcnZpY2VzL2ZvcndhcmQvdmFsaWRhdG9ycy9hcHByb3ZlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB3ZWIzLCB7IGJsb2NrTWF4QWdlUyB9IGZyb20gXCIuLi8uLi8uLi9jb25maWcudHNcIjtcbmltcG9ydCB7IEFwcHJvdmVBcmdzIH0gZnJvbSBcIi4uLy4uLy4uL3NjaS9hcHByb3ZlLXR4LWRlY29kZXIudHNcIjtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHZhbGlkYXRlQXBwcm92ZU1ldGFUeEFyZ3VtZW50cyhcbiAgc2VuZGVyOiBzdHJpbmcsXG4gIHRyYW5zZmVyRGV0YWlsczogQXBwcm92ZUFyZ3MsXG4gIGJsb2NrSGFzaDogc3RyaW5nXG4pOiBQcm9taXNlPHN0cmluZyB8IHVuZGVmaW5lZD4ge1xuICBjb25zdCByZXF1ZXN0ZWRBbW91bnQgPSB3ZWIzLnV0aWxzLnRvQk4odHJhbnNmZXJEZXRhaWxzLmFtb3VudCk7XG5cbiAgaWYgKHJlcXVlc3RlZEFtb3VudC5pc1plcm8oKSkge1xuICAgIHJldHVybiBcIkNhbm5vdCBhcHByb3ZlIGZvciAwIHRva2Vuc1wiO1xuICB9XG5cbiAgbGV0IGZyb20gPSBzZW5kZXIudG9Mb2NhbGVMb3dlckNhc2UoKTtcbiAgaWYgKCFmcm9tLnN0YXJ0c1dpdGgoXCIweFwiKSkge1xuICAgIGZyb20gPSBcIjB4XCIgKyBmcm9tO1xuICB9XG5cbiAgbGV0IHRvID0gdHJhbnNmZXJEZXRhaWxzLnNwZW5kZXIudG9Mb3dlckNhc2UoKTtcbiAgaWYgKCF0by5zdGFydHNXaXRoKFwiMHhcIikpIHtcbiAgICB0byA9IFwiMHhcIiArIHRvO1xuICB9XG5cbiAgaWYgKGZyb20gPT09IHRvKSB7XG4gICAgcmV0dXJuIFwiU2VuZGVyIGFuZCBzcGVuZGVyIGFkZHJlc3NlcyBtdXN0IGRpZmZlclwiO1xuICB9XG5cbiAgbGV0IGJsb2NrO1xuICB0cnkge1xuICAgIGJsb2NrID0gYXdhaXQgd2ViMy5ldGguZ2V0QmxvY2soYmxvY2tIYXNoKTtcbiAgfSBjYXRjaCAoX2Vycm9yKSB7XG4gICAgcmV0dXJuIGBDYW4ndCBnZXQgJHtibG9ja0hhc2h9IGJsb2NrYDtcbiAgfVxuXG4gIGlmICghYmxvY2subm9uY2UpIHtcbiAgICByZXR1cm4gYEJsb2NrICR7YmxvY2tIYXNofSBpcyBzdGlsbCBwZW5kaW5nYDtcbiAgfVxuXG4gIGNvbnN0IG5vd19zZWNvbmRzID0gRGF0ZS5ub3coKSAvIDEwMDA7XG4gIGlmIChub3dfc2Vjb25kcyAtICtibG9jay50aW1lc3RhbXAgPiBibG9ja01heEFnZVMpIHtcbiAgICByZXR1cm4gXCJQcm92aWRlZCBibG9jayBpcyB0b28gb2xkIGFuZCBjYW4gY29udGFpbiBzdGFsZSBkYXRhXCI7XG4gIH1cblxuICByZXR1cm4gdW5kZWZpbmVkO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sUUFBUSxZQUFZLFFBQVEscUJBQXFCO0FBR3hELE9BQU8sZUFBZSwrQkFDcEIsTUFBYyxFQUNkLGVBQTRCLEVBQzVCLFNBQWlCO0lBRWpCLE1BQU0sa0JBQWtCLEtBQUssTUFBTSxLQUFLLGdCQUFnQjtJQUV4RCxJQUFJLGdCQUFnQixVQUFVO1FBQzVCLE9BQU87SUFDVDtJQUVBLElBQUksT0FBTyxPQUFPO0lBQ2xCLElBQUksQ0FBQyxLQUFLLFdBQVcsT0FBTztRQUMxQixPQUFPLE9BQU87SUFDaEI7SUFFQSxJQUFJLEtBQUssZ0JBQWdCLFFBQVE7SUFDakMsSUFBSSxDQUFDLEdBQUcsV0FBVyxPQUFPO1FBQ3hCLEtBQUssT0FBTztJQUNkO0lBRUEsSUFBSSxTQUFTLElBQUk7UUFDZixPQUFPO0lBQ1Q7SUFFQSxJQUFJO0lBQ0osSUFBSTtRQUNGLFFBQVEsTUFBTSxLQUFLLElBQUksU0FBUztJQUNsQyxFQUFFLE9BQU8sUUFBUTtRQUNmLE9BQU8sQ0FBQyxVQUFVLEVBQUUsVUFBVSxNQUFNLENBQUM7SUFDdkM7SUFFQSxJQUFJLENBQUMsTUFBTSxPQUFPO1FBQ2hCLE9BQU8sQ0FBQyxNQUFNLEVBQUUsVUFBVSxpQkFBaUIsQ0FBQztJQUM5QztJQUVBLE1BQU0sY0FBYyxLQUFLLFFBQVE7SUFDakMsSUFBSSxjQUFjLENBQUMsTUFBTSxZQUFZLGNBQWM7UUFDakQsT0FBTztJQUNUO0lBRUEsT0FBTztBQUNUIn0=