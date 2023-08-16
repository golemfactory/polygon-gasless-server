import web3, { blockMaxAgeS } from "../../../config.ts";
import { TransferArgs } from "../../../sci/transfer-tx-decoder.ts";

export async function validateTransferMetaTxArguments(
  sender: string,
  transfer_details: TransferArgs,
  block_hash: string
): Promise<string | undefined> {
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
