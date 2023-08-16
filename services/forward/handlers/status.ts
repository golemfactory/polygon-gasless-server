import web3, { blockMaxAgeS, config, gracePeriodMs } from "../../../config.ts";
import { Context, Status } from "../../../deps.ts";
import { utils } from "../../../sci.ts";
import { sender } from "../../../sender.ts";

export const getServiceStatus = async (ctx: Context) => {
  const networkId = await web3.eth.net.getId();
  const address = sender.address;
  const gas = utils.fromWei(await web3.eth.getBalance(address));
  const queueSize = sender.queueSize;
  const gasPrice = sender.gasPrice.toString(10);
  const gasPriceUpperLimit = sender.gasPriceUpperLimit.toString(10);
  const contractAddress = config.contractAddress;
  ctx.response.status = Status.OK;
  ctx.response.type = "json";
  ctx.response.body = {
    networkId,
    address,
    gas,
    gasPrice,
    gasPriceUpperLimit,
    queueSize,
    contractAddress,
    gracePeriodMs,
    blockMaxAgeS,
  };
};
