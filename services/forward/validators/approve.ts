import web3, { blockMaxAgeS } from "../../../config.ts";
import { ApproveArgs } from "../../../sci/approve-tx-decoder.ts";

export async function validateApproveMetaTxArguments(
  sender: string,
  transferDetails: ApproveArgs,
  blockHash: string
): Promise<string | undefined> {
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
