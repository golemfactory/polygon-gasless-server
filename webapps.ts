import { Router } from "https://deno.land/x/oak/mod.ts";

import forwardService from "./services/forward/index.ts";

const router = new Router()
  .use("/api/forward", forwardService.routes(), forwardService.allowedMethods())
  .get("/", (ctx) => {
    ctx.response.status = 200;
    ctx.response.body = { status: "working" };
  });

export default router;
