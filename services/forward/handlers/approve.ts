import { e } from "https://jspm.dev/npm:oboe@2.1.5!cjs";
import { gracePeriodMs, ethersContract } from "../../../config.ts";
import { Context, log, z } from "../../../deps.ts";
import { utils } from "../../../sci.ts";
import { decodeApprove } from "../../../sci/approve-tx-decoder.ts";
import { ForwardRequest } from "../utils.ts";
import { validateApproveMetaTxArguments } from "../validators/approve.ts";

const pendingSenders = new Set<string>();
export const forwardApprove = async (ctx: Context) => {
  const logger = log.getLogger("webapp");
  try {
    const input = ForwardRequest.parse(
      await ctx.request.body({ type: "json" }).value
    );

    // checking if this is transfer
    const decodedArguments = decodeApprove(input.abiFunctionCall);

    if (!decodedArguments) {
      ctx.response.status = 400;
      ctx.response.body = {
        message: "unable to decode transaction",
      };
      return;
    }

    const errorDetails = await validateApproveMetaTxArguments(
      input.sender,
      decodedArguments,
      input.blockHash || "latest"
    );

    if (errorDetails) {
      ctx.response.status = 400;
      ctx.response.body = {
        message: errorDetails,
      };
      return;
    }

    logger.info(
      () =>
        `Forwarding approve by ${input.sender} for ${
          decodedArguments.spender
        } of ${utils.fromWei(decodedArguments.amount)}`
    );

    logger.debug(() => `input=${JSON.stringify(input)}`);

    if (pendingSenders.has(input.sender)) {
      ctx.response.status = 429;
      ctx.response.body = {
        message: "processing concurrent transaction",
      };
      return;
    }
    try {
      pendingSenders.add(input.sender);
      const now = new Date().getTime();
      const storageKey = `sender.${input.sender}`;
      if (gracePeriodMs) {
        const prev = localStorage.getItem(storageKey);
        logger.debug(
          () =>
            `check gracePeriodMs=${gracePeriodMs}, for ${storageKey}, prev=${prev}`
        );
        if (prev && now - parseInt(prev) < gracePeriodMs) {
          const retryAfter = new Date(parseInt(prev) + gracePeriodMs);
          ctx.response.status = 429;
          ctx.response.headers.set("Retry-After", retryAfter.toUTCString());
          ctx.response.body = {
            message: "Grace period did not pass for this address",
          };
          return;
        }
      }

      const data = await ethersContract.executeMetaTransaction(
        input.sender,
        input.abiFunctionCall,
        input.r,
        input.s,
        input.v
      );

      console.log("datass", data);

      localStorage.setItem(storageKey, now.toString());
      ctx.response.type = "json";
      ctx.response.body = { txId: data.hash };
    } finally {
      pendingSenders.delete(input.sender);
    }
  } catch (e) {
    if (e instanceof z.ZodError) {
      ctx.response.status = 400;
      ctx.response.body = {
        message: "invalid request body",
        issues: e.issues,
      };
      return;
    }
    if (e instanceof SyntaxError) {
      ctx.response.status = 400;
      ctx.response.body = {
        message: e.message,
      };
      return;
    }
  }

  ctx.response.status = 500;
  ctx.response.body = e.message;
  return;
};
