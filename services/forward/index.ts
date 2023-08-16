import { Router } from "../../deps.ts";
import { forwardTransfer, getServiceStatus } from "./handlers/index.ts";

export default new Router()
  .post("/transfer", forwardTransfer)
  .get("/status", getServiceStatus);
