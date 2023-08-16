import { abi, AbiItem, utils } from "../sci.ts";

export type ApproveArgs = {
  spender: string;
  amount: string;
};

const ABI: AbiItem = {
  name: "approve",
  type: "function",
  inputs: [
    { name: "spender", type: "address" },
    { name: "amount", type: "uint256" },
  ],
};

const APPROVE_SIGNATURE = abi.encodeFunctionSignature(ABI);

export function decodeApprove(hexBytes: string): ApproveArgs | undefined {
  const bytes = utils.hexToBytes(hexBytes);
  const functionSignature = utils.bytesToHex(bytes.splice(0, 4));
  if (functionSignature === APPROVE_SIGNATURE) {
    try {
      const { "0": spender, "1": amount } = abi.decodeParameters(
        ["address", "uint256"],
        utils.bytesToHex(bytes)
      );
      return {
        spender,
        amount,
      };
    } catch (e) {
      if (e instanceof Error) {
        return undefined;
      }
      throw e;
    }
  }
}
