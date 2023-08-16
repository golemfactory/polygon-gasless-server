import { config } from "./config.ts";
import web3 from "./config.ts";
import { TransactionSender } from "./sci/transaction-sender.ts";

export const sender = new TransactionSender(
  web3,
  config.gasPrice,
  config.gasPriceUpperLimit,
  config.secret!
);

sender.start();
