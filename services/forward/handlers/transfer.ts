import { glm, gracePeriodMs } from "../../../config.ts";
import { Context, log, z } from "../../../deps.ts";
import { utils } from "../../../sci.ts";
import { decodeTransfer } from "../../../sci/transfer-tx-decoder.ts";
import { sender } from "../../../sender.ts";
import { ForwardRequest } from "../utils.ts";
import { validateTransferMetaTxArguments } from "../validators/transfer.ts";

const pendingSenders = new Set<string>();
export const forwardTransfer = async (ctx: Context) => {
  const logger = log.getLogger("webapp");
  try {
    const input = ForwardRequest.parse(
      await ctx.request.body({ type: "json" }).value
    );

    // checking if this is transfer
    const decoded_arguments = decodeTransfer(input.abiFunctionCall);
    if (!decoded_arguments) {
      ctx.response.status = 400;
      ctx.response.body = {
        message: "unable to decode transaction",
      };
      return;
    }

    const error_details = await validateTransferMetaTxArguments(
      input.sender,
      decoded_arguments,
      input.blockHash || "latest"
    );

    if (error_details) {
      ctx.response.status = 400;
      ctx.response.body = {
        message: error_details,
      };
      return;
    }

    logger.info(
      () =>
        `Forwarding transfer from ${input.sender} to ${
          decoded_arguments.recipient
        } of ${utils.fromWei(decoded_arguments.amount)}`
    );
    logger.debug(() => `input=${JSON.stringify(input)}`);

    const data = glm.methods
      .executeMetaTransaction(
        input.sender,
        input.abiFunctionCall,
        input.r,
        input.s,
        input.v
      )
      .encodeABI();

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

      const txId = await sender.sendTx({
        to: glm.options.address,
        data,
      });

      localStorage.setItem(storageKey, now.toString());
      ctx.response.type = "json";
      ctx.response.body = { txId };
    } finally {
      pendingSenders.delete(input.sender);
    }
  } catch (e) {
    log.error(`transfer endpoint failed: ${e}`);

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

    ctx.response.status = 500;
    ctx.response.body = e.message;
    return;
  }
};
