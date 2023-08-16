import { setupWeb3Api } from "./sci.ts";
import { dotenv } from "./deps.ts";
import { contract } from "./sci/golem-polygon-contract.ts";
import contractData from "./sci/golem-polygon-contract.json" assert { type: "json" };
import { ethers } from "npm:ethers";

let _dotenvCfg: dotenv.DotenvConfig | undefined = undefined;

async function getDotEnv(key: string, ask?: boolean) {
  if (_dotenvCfg) {
    return _dotenvCfg[key];
  }
  let d = await Deno.permissions.query({ name: "read", path: ".env" });
  if (d.state == "prompt" && ask) {
    d = await Deno.permissions.request({ name: "read", path: ".env" });
  }
  if (d.state === "granted") {
    _dotenvCfg = await dotenv.config({ defaults: undefined, export: false });
  }
  if (_dotenvCfg) {
    return _dotenvCfg[key];
  }
  return undefined;
}

async function getEnv(
  key: string,
  options?: { ask?: boolean; required?: boolean }
): Promise<string | undefined> {
  let dotenvValue = await getDotEnv(key);
  let permissionStatus = await Deno.permissions.query({
    name: "env",
    variable: key,
  });

  if (
    permissionStatus.state === "prompt" &&
    (options?.ask || options?.required)
  ) {
    dotenvValue = await getDotEnv(key, options?.ask);
    if (!dotenvValue) {
      permissionStatus = await Deno.permissions.request({
        name: "env",
        variable: key,
      });
    }
  }
  if (permissionStatus.state === "granted") {
    const value = Deno.env.get(key);
    if (value) {
      return value;
    }
  }
  if (dotenvValue) {
    return dotenvValue;
  }
  if (options?.required) {
    throw new Error(`missing ${key} environment variable`);
  }
  return undefined;
}

async function getIntEnv(
  key: string,
  options?: { ask?: boolean; required?: boolean }
): Promise<number | undefined> {
  const value = await getEnv(key, options);
  if (value) {
    return parseInt(value);
  }
}

export const config = {
  secret: await getEnv("ERC20_PRIVATE_KEY", { required: true }),
  rpc: (await getEnv("WEB3_RPC")) || "https://polygon-rpc.com/",

  /*
  Mainnet = "0x0b220b82f3ea3b7f6d9a1d8ab58930c064a2b5bf";
  Mumbai = "0x2036807B0B3aaf5b1858EE822D0e111fDdac7018";
*/

  contractAddress:
    (await getEnv("ERC20_CONTRACT_ADDRESS")) ||
    "0x0b220b82f3ea3b7f6d9a1d8ab58930c064a2b5bf",
  gasPrice: (await getEnv("ERC20_GAS_PRICE")) || "30.1",
  gasPriceUpperLimit: (await getEnv("ERC20_GAS_PRICE_UPPER_LIMIT")) || "180.1",
};

export const port = (await getIntEnv("BACKEND_SERVICE_PORT")) || 8000;

export const allowedOrigins = (await getEnv("ALLOWED_ORIGINS"))?.split(",");

export const gracePeriodMs = await getIntEnv("GRACE_PERIOD_MS");

export const blockMaxAgeS = (await getIntEnv("BLOCK_MAX_AGE")) || 5 * 60;

const web3 = setupWeb3Api(config.rpc);

export const glm = contract(web3, config.contractAddress);

export default web3;

//web.js returns strange errors here so for now ethers.js is in use
//TODO in future use only ethers.js across whole server or npm newest version of web3.js

const provider = new ethers.JsonRpcProvider(config.rpc);

// TODO : refactor to avoid ts-ignore
//@ts-ignore
const signer = new ethers.Wallet(config.secret, provider);

export const ethersContract = new ethers.Contract(
  config.contractAddress,
  contractData.abi,
  signer
);

// const tokenContract = new ethers.Contract(
//   "0x0B220b82F3eA3B7F6d9A1D8ab58930C064A2b5Bf",
//   golemAbi,
//   signer
// );
