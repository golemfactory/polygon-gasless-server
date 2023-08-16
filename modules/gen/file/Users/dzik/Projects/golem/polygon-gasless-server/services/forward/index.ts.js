import { Router, oakCors } from "../../deps.ts";
import { forwardApprove } from "./handlers/approve.ts";
import { forwardTransfer, getServiceStatus } from "./handlers/index.ts";
export default new Router().options("/approve", oakCors({
    origin: "*"
})).post("/approve", forwardApprove).post("/transfer", forwardTransfer).get("/status", getServiceStatus).post("/status", getServiceStatus);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvZHppay9Qcm9qZWN0cy9nb2xlbS9wb2x5Z29uLWdhc2xlc3Mtc2VydmVyL3NlcnZpY2VzL2ZvcndhcmQvaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUm91dGVyLCBvYWtDb3JzIH0gZnJvbSBcIi4uLy4uL2RlcHMudHNcIjtcbmltcG9ydCB7IGZvcndhcmRBcHByb3ZlIH0gZnJvbSBcIi4vaGFuZGxlcnMvYXBwcm92ZS50c1wiO1xuaW1wb3J0IHsgZm9yd2FyZFRyYW5zZmVyLCBnZXRTZXJ2aWNlU3RhdHVzIH0gZnJvbSBcIi4vaGFuZGxlcnMvaW5kZXgudHNcIjtcblxuZXhwb3J0IGRlZmF1bHQgbmV3IFJvdXRlcigpXG4gIC5vcHRpb25zKFxuICAgIFwiL2FwcHJvdmVcIixcbiAgICBvYWtDb3JzKHtcbiAgICAgIG9yaWdpbjogXCIqXCIsXG4gICAgfSlcbiAgKVxuICAucG9zdChcIi9hcHByb3ZlXCIsIGZvcndhcmRBcHByb3ZlKVxuICAucG9zdChcIi90cmFuc2ZlclwiLCBmb3J3YXJkVHJhbnNmZXIpXG4gIC5nZXQoXCIvc3RhdHVzXCIsIGdldFNlcnZpY2VTdGF0dXMpXG4gIC5wb3N0KFwiL3N0YXR1c1wiLCBnZXRTZXJ2aWNlU3RhdHVzKTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxTQUFTLE1BQU0sRUFBRSxPQUFPLFFBQVEsZ0JBQWdCO0FBQ2hELFNBQVMsY0FBYyxRQUFRLHdCQUF3QjtBQUN2RCxTQUFTLGVBQWUsRUFBRSxnQkFBZ0IsUUFBUSxzQkFBc0I7QUFFeEUsZUFBZSxJQUFJLFNBQ2hCLFFBQ0MsWUFDQSxRQUFRO0lBQ04sUUFBUTtBQUNWLElBRUQsS0FBSyxZQUFZLGdCQUNqQixLQUFLLGFBQWEsaUJBQ2xCLElBQUksV0FBVyxrQkFDZixLQUFLLFdBQVcsa0JBQWtCIn0=