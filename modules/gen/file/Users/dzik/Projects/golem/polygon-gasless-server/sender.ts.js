import { config } from "./config.ts";
import web3 from "./config.ts";
import { TransactionSender } from "./sci/transaction-sender.ts";
export const sender = new TransactionSender(web3, config.gasPrice, config.gasPriceUpperLimit, config.secret);
sender.start();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvZHppay9Qcm9qZWN0cy9nb2xlbS9wb2x5Z29uLWdhc2xlc3Mtc2VydmVyL3NlbmRlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjb25maWcgfSBmcm9tIFwiLi9jb25maWcudHNcIjtcbmltcG9ydCB3ZWIzIGZyb20gXCIuL2NvbmZpZy50c1wiO1xuaW1wb3J0IHsgVHJhbnNhY3Rpb25TZW5kZXIgfSBmcm9tIFwiLi9zY2kvdHJhbnNhY3Rpb24tc2VuZGVyLnRzXCI7XG5cbmV4cG9ydCBjb25zdCBzZW5kZXIgPSBuZXcgVHJhbnNhY3Rpb25TZW5kZXIoXG4gIHdlYjMsXG4gIGNvbmZpZy5nYXNQcmljZSxcbiAgY29uZmlnLmdhc1ByaWNlVXBwZXJMaW1pdCxcbiAgY29uZmlnLnNlY3JldCFcbik7XG5cbnNlbmRlci5zdGFydCgpO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFNBQVMsTUFBTSxRQUFRLGNBQWM7QUFDckMsT0FBTyxVQUFVLGNBQWM7QUFDL0IsU0FBUyxpQkFBaUIsUUFBUSw4QkFBOEI7QUFFaEUsT0FBTyxNQUFNLFNBQVMsSUFBSSxrQkFDeEIsTUFDQSxPQUFPLFVBQ1AsT0FBTyxvQkFDUCxPQUFPLFFBQ1A7QUFFRixPQUFPIn0=