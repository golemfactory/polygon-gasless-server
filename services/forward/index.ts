import { Router, oakCors } from "../../deps.ts";
import { forwardApprove } from "./handlers/approve.ts";
import { forwardTransfer, getServiceStatus } from "./handlers/index.ts";

export default new Router()
  .options(
    "/approve",
    oakCors({
      origin: "*",
    })
  )
  .post("/approve", forwardApprove)
  .post("/transfer", forwardTransfer)
  .get("/status", getServiceStatus)
  .post("/status", getServiceStatus);
