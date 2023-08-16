import { z } from "../../deps.ts";
import { utils } from "../../sci.ts";

const HexString = () =>
  z.string().refine(utils.isHexStrict, "expected 0x prefixed hex string");
const Address = () =>
  z.string().refine(utils.isAddress, "expected eth address");

export const ForwardRequest = z.object({
  r: HexString(),
  s: HexString(),
  v: z.number(),
  sender: Address(),
  abiFunctionCall: HexString(),
  signedRequest: HexString().optional(),
  blockHash: HexString().optional(),
});
